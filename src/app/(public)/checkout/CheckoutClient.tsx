"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface Address {
  id: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
  isCodBlocked: boolean;
  isServiceable: boolean;
  requiresApproval: boolean;
}

interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: {
    name: string;
    slug: string;
    basePricePaise: number;
    images?: Array<{
      url: string;
      altText: string | null;
      isPrimary: boolean;
    }>;
  };
  variant: {
    sku: string;
    stock: number;
    priceDeltaPaise: number;
  } | null;
}

interface Cart {
  id: string;
  items: CartItem[];
}

interface CheckoutClientProps {
  initialCart: Cart;
  initialAddresses: Address[];
  codLimitPaise: number;
  loyaltyBalance: number;
  loyaltySettings: { rupeesPer100Points: number };
}

const defaultFormData = {
  fullName: "",
  phone: "",
  pincode: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  isDefault: false,
};

function generateIdempotencyKey(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default function CheckoutClient({
  initialCart,
  initialAddresses,
  codLimitPaise,
  loyaltyBalance: initialLoyaltyBalance,
  loyaltySettings: initialLoyaltySettings,
}: CheckoutClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submittingAddress, setSubmittingAddress] = useState(false);

  const [isTcChecked, setIsTcChecked] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPaise: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  
  // Stable idempotency key per checkout session
  const [idempotencyKey] = useState(() => generateIdempotencyKey());

  // B12: Loyalty points states
  const [loyaltyBalance, setLoyaltyBalance] = useState(initialLoyaltyBalance ?? 0);
  const [loyaltySettings, setLoyaltySettings] = useState(initialLoyaltySettings ?? { rupeesPer100Points: 10 });
  const [usePoints, setUsePoints] = useState(false);

  const [locating, setLocating] = useState(false);

  const handleGeolocation = async () => {
    setLocating(true);

    interface NominatimAddress {
      city?: string;
      town?: string;
      village?: string;
      suburb?: string;
      county?: string;
      state?: string;
      postcode?: string;
    }

    const applyAddress = (addr: NominatimAddress) => {
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        addr.county ||
        "";
      const state = addr.state || "";
      const pincode = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);

      setFormData((prev) => ({
        ...prev,
        city,
        state,
        pincode,
      }));
      setLocating(false);
    };

    const fetchByCoords = async (lat: number, lon: number) => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "en", "User-Agent": "GVSwift-App/1.0" } }
      );
      if (!res.ok) throw new Error("Nominatim failed");
      const data = await res.json();
      applyAddress(data.address);
    };

    const fetchByIP = async () => {
      const res = await fetch("https://ipwho.is/");
      if (!res.ok) throw new Error("IP API failed");
      const data = await res.json();
      if (!data.success) throw new Error("IP Geolocation unsuccessful");
      const pincode = (data.postal || "").replace(/\D/g, "").slice(0, 6);
      setFormData((prev) => ({
        ...prev,
        city: data.city || "",
        state: data.region || "",
        pincode,
      }));
      setLocating(false);
    };

    if (!navigator.geolocation) {
      try {
        await fetchByIP();
      } catch {
        setLocating(false);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await fetchByCoords(position.coords.latitude, position.coords.longitude);
        } catch {
          try {
            await fetchByIP();
          } catch {
            setLocating(false);
          }
        }
      },
      async () => {
        try {
          await fetchByIP();
        } catch {
          setLocating(false);
        }
      },
      { timeout: 8000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    fetch("/api/v1/loyalty/me")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (typeof data.balance === "number") {
            setLoyaltyBalance(data.balance);
          }
          if (typeof data.rupeesPer100Points === "number") {
            setLoyaltySettings({ rupeesPer100Points: data.rupeesPer100Points });
          }
        }
      })
      .catch(() => {});
  }, []);

  const pointsDiscountPaise = usePoints
    ? Math.floor((loyaltyBalance / 100) * loyaltySettings.rupeesPer100Points * 100)
    : 0;

  // Keep addresses in sync with page props (router.refresh() updates this)
  useEffect(() => {
    setAddresses(initialAddresses);
    // Automatically select the default address if it exists and nothing is selected yet
    if (!selectedAddressId && initialAddresses.length > 0) {
      const defaultAddr = initialAddresses.find((a) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else {
        setSelectedAddressId(initialAddresses[0].id);
      }
    }
  }, [initialAddresses, selectedAddressId]);

  const formatRupees = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(paise / 100);
  };

  // Calculate prices
  const getItemPrice = (item: CartItem) => {
    const base = item.product.basePricePaise;
    const delta = item.variant?.priceDeltaPaise ?? 0;
    return base + delta;
  };

  const getSubtotal = () => {
    return initialCart.items.reduce((total, item) => {
      return total + getItemPrice(item) * item.quantity;
    }, 0);
  };

  const subtotalPaise = getSubtotal();
  const shippingPaise = 0;
  const codFeePaise = 0;
  const discountPaise = appliedCoupon?.discountPaise ?? 0;
  const totalPaise = Math.max(0, subtotalPaise + shippingPaise + codFeePaise - discountPaise - pointsDiscountPaise);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError("Please enter a coupon code."); return; }
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/v1/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, cartTotalPaise: subtotalPaise }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error ?? "Invalid coupon code.");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({ code: data.code, discountPaise: data.discountPaise });
      setCouponError(null);
      setCouponInput("");
    } catch {
      setCouponError("Network error. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleClearCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponInput("");
  };

  const isOverCodLimit = totalPaise > codLimitPaise;
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const validateAddressForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (formData.fullName.length > 100) {
      errors.fullName = "Full name must be at most 100 characters";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      errors.phone = "Enter a valid 10-digit Indian mobile number (starts with 6-9)";
    }

    if (!formData.pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errors.pincode = "Pincode must be exactly 6 digits";
    }

    if (!formData.line1.trim()) {
      errors.line1 = "Address line 1 is required";
    } else if (formData.line1.length > 200) {
      errors.line1 = "Address line 1 must be at most 200 characters";
    }

    if (formData.line2 && formData.line2.length > 200) {
      errors.line2 = "Address line 2 must be at most 200 characters";
    }

    if (!formData.city.trim()) {
      errors.city = "City is required";
    } else if (formData.city.length > 100) {
      errors.city = "City must be at most 100 characters";
    }

    if (!formData.state.trim()) {
      errors.state = "State is required";
    } else if (formData.state.length > 100) {
      errors.state = "State must be at most 100 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddressForm()) return;

    setSubmittingAddress(true);
    setServerError(null);

    try {
      const res = await fetch("/api/v1/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error && (data.error.includes("ship to this pincode") || data.error.includes("serviceable"))) {
          setFieldErrors((prev) => ({ ...prev, pincode: data.error }));
          throw new Error(data.error);
        }
        throw new Error(data.error || "Failed to save address");
      }

      toast.success("Address added successfully");
      setIsModalOpen(false);
      setFormData(defaultFormData);
      
      // Auto-select this newly created address
      setSelectedAddressId(data.id);
      
      // Refresh server component so risk levels are resolved
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not add address", "Error");
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a shipping address");
      return;
    }

    if (selectedAddress?.isCodBlocked) {
      toast.error("Cash on Delivery is not available for the selected address");
      return;
    }

    if (!selectedAddress?.isServiceable) {
      toast.error("The selected address is not serviceable");
      return;
    }

    if (isOverCodLimit) {
      toast.error("Order total exceeds the Cash on Delivery limit");
      return;
    }

    if (!isTcChecked) {
      toast.error("You must agree to the Terms & Conditions to place an order");
      return;
    }

    setSubmittingOrder(true);
    setServerError(null);

    try {
      const res = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: initialCart.id,
          addressId: selectedAddressId,
          idempotencyKey,
          paymentMethod: "COD",
          couponCode: appliedCoupon?.code ?? undefined,
          pointsToRedeem: usePoints ? (loyaltyBalance || 0) : 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "An error occurred during checkout");
      }

      toast.success("Order placed successfully!");
      
      // Redirect to the order details page as part of TICKET-302 implementation
      router.push(`/account/orders/${data.order.id}`);
    } catch (err: unknown) {
      const error = err as Error;
      setServerError(error.message || "Failed to place order. Please try again.");
      toast.error(error.message || "Checkout failed", "Error");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const isPlaceOrderDisabled =
    !isTcChecked ||
    !selectedAddressId ||
    selectedAddress?.isCodBlocked ||
    !selectedAddress?.isServiceable ||
    isOverCodLimit ||
    submittingOrder;

  return (
    <div className="checkout-grid">
      {/* Checkout Steps Form */}
      <div className="checkout-main-col">
        {/* Step 1: Shipping Address Selection */}
        <Card className="checkout-card">
          <div className="checkout-card-header">
            <h2 className="text-xl font-semibold checkout-header-title">
              1. Shipping Address
            </h2>
            {!isModalOpen && (
              <Button
                variant="secondary"
                onClick={() => {
                  setFormData(defaultFormData);
                  setFieldErrors({});
                  setIsModalOpen(true);
                }}
                className="checkout-add-address-btn"
              >
                + Add Address
              </Button>
            )}
          </div>

          {isModalOpen ? (
            <div style={{ paddingTop: "8px" }}>
              <form onSubmit={handleAddAddressSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }} className="md:grid-cols-2">
                  <Input
                    label="Full Name"
                    placeholder="e.g. John Doe"
                    value={formData.fullName}
                    error={fieldErrors.fullName}
                    required
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                  <Input
                    label="Mobile Number"
                    placeholder="10-digit Indian number"
                    value={formData.phone}
                    error={fieldErrors.phone}
                    required
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "-8px" }}>
                  <button
                    type="button"
                    onClick={handleGeolocation}
                    disabled={locating}
                    className="btn btn-outline btn-sm flex items-center gap-2"
                    style={{ padding: "6px 12px", fontSize: "12px", minHeight: "32px" }}
                  >
                    {locating ? (
                      <>
                        <span className="animate-spin">⏳</span> Detecting location...
                      </>
                    ) : (
                      <>📍 Use My Location</>
                    )}
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }} className="md:grid-cols-3">
                  <Input
                    label="Pincode"
                    placeholder="6-digit PIN code"
                    value={formData.pincode}
                    error={fieldErrors.pincode}
                    required
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
                  />
                  <Input
                    label="City"
                    placeholder="e.g. Bangalore"
                    value={formData.city}
                    error={fieldErrors.city}
                    required
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                  <Input
                    label="State"
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    error={fieldErrors.state}
                    required
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>

                <Input
                  label="Address Line 1"
                  placeholder="Flat, House no., Building, Company, Apartment"
                  value={formData.line1}
                  error={fieldErrors.line1}
                  required
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                />

                <Input
                  label="Address Line 2 (Optional)"
                  placeholder="Area, Street, Sector, Village"
                  value={formData.line2}
                  error={fieldErrors.line2}
                  onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      accentColor: "var(--color-accent)",
                    }}
                  />
                  <label
                    htmlFor="isDefault"
                    style={{
                      fontSize: "14px",
                      color: "var(--color-text-primary)",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Make this my default shipping address
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px", borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
                  <Button
                    variant="secondary"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submittingAddress}
                    type="button"
                    style={{ minHeight: "44px" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAddAddressSubmit}
                    loading={submittingAddress}
                    type="submit"
                    style={{ minHeight: "44px", minWidth: "120px" }}
                  >
                    Add Address
                  </Button>
                </div>
              </form>
            </div>
          ) : addresses.length === 0 ? (
            <div className="checkout-empty-address">
              <p style={{ color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                No shipping addresses saved yet.
              </p>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Add Shipping Address
              </Button>
            </div>
          ) : (
            <div className="checkout-address-list">
              {addresses.map((addr) => {
                const isSelected = addr.id === selectedAddressId;

                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`checkout-address-option ${isSelected ? "checkout-address-option-selected" : ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "start", marginTop: "4px" }}>
                      <input
                        type="radio"
                        id={`addr-${addr.id}`}
                        name="selectedAddress"
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(addr.id)}
                        style={{
                          accentColor: "var(--color-accent)",
                          width: "18px",
                          height: "18px",
                          cursor: "pointer",
                        }}
                      />
                    </div>

                    <div style={{ flexGrow: 1 }}>
                      <label
                        htmlFor={`addr-${addr.id}`}
                        style={{
                          fontWeight: 600,
                          fontSize: "15px",
                          color: "var(--color-text-primary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {addr.fullName}
                        {addr.isDefault && (
                          <span className="checkout-default-badge">
                            Default
                          </span>
                        )}
                      </label>

                      <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                        Phone: {addr.phone}
                      </p>

                      <p style={{ color: "var(--color-text-primary)", fontSize: "14px", marginTop: "8px", lineHeight: "1.5" }}>
                        {addr.line1}
                        {addr.line2 && `, ${addr.line2}`}
                        <br />
                        {addr.city}, {addr.state} &ndash;{" "}
                        <strong style={{ color: "var(--color-accent)" }}>{addr.pincode}</strong>
                      </p>

                      {/* Serviceability Warnings */}
                      {!addr.isServiceable && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", color: "var(--color-error)", fontSize: "12px", fontWeight: 600, marginTop: "12px" }}>
                          <span>❌ This pincode is not serviceable. Please select a different address.</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({
                                fullName: addr.fullName,
                                phone: addr.phone,
                                pincode: addr.pincode,
                                line1: addr.line1,
                                line2: addr.line2 ?? "",
                                city: addr.city,
                                state: addr.state,
                                isDefault: addr.isDefault,
                              });
                              setFieldErrors({});
                              setIsModalOpen(true);
                            }}
                            className="btn btn-secondary"
                            style={{ alignSelf: "flex-start", padding: "4px 8px", fontSize: "11px", marginTop: "2px" }}
                          >
                            ← Back to Address Input
                          </button>
                        </div>
                      )}
                      {addr.isServiceable && addr.isCodBlocked && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-warning)", fontSize: "12px", fontWeight: 600, marginTop: "12px" }}>
                          <span>⚠️ Cash on Delivery (COD) is blocked for this address.</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Step 2: Payment Method */}
        <Card className="checkout-card">
          <div className="checkout-card-header">
            <h2 className="text-xl font-semibold checkout-header-title">
              2. Payment Method
            </h2>
          </div>

          <div className="checkout-payment-box">
            <div className="checkout-payment-title-row">
              <span style={{ fontSize: "20px" }}>💵</span>
              <strong className="checkout-payment-title">Cash on Delivery (COD)</strong>
            </div>
            <p style={{ color: "var(--color-text-primary)", fontSize: "14px", margin: "4px 0" }}>
              Pay in cash when your order is delivered to your doorstep.
            </p>
            <span style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
              Note: There are no extra handling fees for COD. The COD fee is ₹0.
            </span>
          </div>
        </Card>
      </div>

      {/* Sidebar Order Summary */}
      <div>
        <div className="card p-5 cart-summary-sticky">
          <h2 className="text-lg font-semibold cart-summary-title">
            Order Summary
          </h2>

          {/* Line Items List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
            {initialCart.items.map((item) => {
              const imageObj = item.product.images?.find((img) => img.isPrimary) || item.product.images?.[0];
              const imageUrl = imageObj?.url || "/fashion_product_mockup.png";
              const price = getItemPrice(item);

              return (
                <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--color-border)", flexShrink: 0, backgroundColor: "var(--color-bg)" }}>
                    <Image
                      src={imageUrl}
                      alt={item.product.name}
                      width={40}
                      height={40}
                      style={{ objectFit: "cover" }}
                      sizes="40px"
                    />
                  </div>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "flex", gap: "8px" }}>
                      <span>Qty: {item.quantity}</span>
                      {item.variant && <span>SKU: {item.variant.sku}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 600, flexShrink: 0 }}>
                    {formatRupees(price * item.quantity)}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ borderBottom: "1px solid var(--color-border)" }} />

          {/* Pricing Details */}
          <div className="cart-summary-rows">
            <div className="cart-summary-row">
              <span className="footer-text-muted">Subtotal</span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatRupees(subtotalPaise)}</span>
            </div>
            <div className="cart-summary-row">
              <span className="footer-text-muted">Shipping</span>
              <span style={{ color: "var(--color-success)", fontWeight: 500 }}>FREE</span>
            </div>
            <div className="cart-summary-row">
              <span className="footer-text-muted">COD Fee</span>
              <span style={{ color: "var(--color-success)", fontWeight: 500 }}>FREE</span>
            </div>
            {appliedCoupon && (
              <div className="cart-summary-row">
                <span style={{ color: "var(--color-success)", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                  🎟️ {appliedCoupon.code}
                  <button onClick={handleClearCoupon} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--color-text-secondary)", textDecoration: "underline" }}>Remove</button>
                </span>
                <span style={{ color: "var(--color-success)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>−{formatRupees(appliedCoupon.discountPaise)}</span>
              </div>
            )}
            {usePoints && pointsDiscountPaise > 0 && (
              <div className="cart-summary-row">
                <span style={{ color: "var(--color-success)", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                  ⭐ <span style={{ fontVariantNumeric: "tabular-nums" }}>{loyaltyBalance}</span> pts used
                </span>
                <span style={{ color: "var(--color-success)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>−{formatRupees(pointsDiscountPaise)}</span>
              </div>
            )}
          </div>

          {/* B12: Loyalty Points Checkbox */}
          {loyaltyBalance > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 0",
                fontSize: "13px",
                color: "var(--color-text-primary)",
                fontWeight: 500,
                userSelect: "none",
                cursor: "pointer",
                marginTop: "4px",
              }}
              onClick={() => setUsePoints((v) => !v)}
            >
              <input
                type="checkbox"
                id="loyalty-points-checkbox"
                checked={usePoints}
                onChange={(e) => setUsePoints(e.target.checked)}
                style={{
                  accentColor: "var(--color-accent)",
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <label
                htmlFor="loyalty-points-checkbox"
                style={{ cursor: "pointer", flexGrow: 1 }}
              >
                Use my loyalty points (<span style={{ fontVariantNumeric: "tabular-nums" }}>{loyaltyBalance}</span> pts = ₹<span style={{ fontVariantNumeric: "tabular-nums" }}>{Math.floor(loyaltyBalance / 100) * loyaltySettings.rupeesPer100Points}</span> off)
              </label>
            </div>
          )}

          <div style={{ borderBottom: "1px solid var(--color-border)" }} />

          <div className="cart-summary-total-row">
            <span style={{ fontSize: "16px", fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-accent)", fontVariantNumeric: "tabular-nums" }}>{formatRupees(totalPaise)}</span>
          </div>

          {/* Coupon Input */}
          {!appliedCoupon && (
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                id="coupon-code-input"
                type="text"
                className="input-field"
                style={{ flex: 1, fontSize: "13px" }}
                placeholder="Coupon code"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                disabled={couponLoading}
              />
              <button
                type="button"
                id="apply-coupon-btn"
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponInput.trim()}
                className="btn btn-secondary"
                style={{ fontSize: "13px", padding: "8px 14px", flexShrink: 0 }}
              >
                {couponLoading ? "…" : "Apply"}
              </button>
            </div>
          )}
          {couponError && (
            <div style={{ fontSize: "12px", color: "var(--color-error)", fontWeight: 500 }}>{couponError}</div>
          )}



          {/* Error / Warning Alert Banners */}
          {serverError && (
            <div style={{ backgroundColor: "var(--color-error-bg)", border: "1px solid var(--color-error)", borderRadius: "var(--radius-md)", padding: "12px", fontSize: "13px", color: "var(--color-error)", fontWeight: 500, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>{serverError}</div>
              {(serverError.toLowerCase().includes("pincode") || serverError.toLowerCase().includes("serviceable")) && selectedAddress && (
                <button
                  onClick={() => {
                    setFormData({
                      fullName: selectedAddress.fullName,
                      phone: selectedAddress.phone,
                      pincode: selectedAddress.pincode,
                      line1: selectedAddress.line1,
                      line2: selectedAddress.line2 ?? "",
                      city: selectedAddress.city,
                      state: selectedAddress.state,
                      isDefault: selectedAddress.isDefault,
                    });
                    setFieldErrors({});
                    setIsModalOpen(true);
                  }}
                  className="btn btn-secondary"
                  style={{ alignSelf: "flex-start", padding: "4px 8px", fontSize: "12px" }}
                >
                  ← Back to Address Input
                </button>
              )}
            </div>
          )}

          {isOverCodLimit && (
            <div style={{ backgroundColor: "var(--color-error-bg)", border: "1px solid var(--color-error)", borderRadius: "var(--radius-md)", padding: "12px", fontSize: "13px", color: "var(--color-error)", fontWeight: 500 }}>
              ⚠️ Order total of {formatRupees(totalPaise)} exceeds the Cash on Delivery limit of {formatRupees(codLimitPaise)}. Please reduce your items to proceed.
            </div>
          )}

          {selectedAddress?.isCodBlocked && (
            <div style={{ backgroundColor: "var(--color-error-bg)", border: "1px solid var(--color-error)", borderRadius: "var(--radius-md)", padding: "12px", fontSize: "13px", color: "var(--color-error)", fontWeight: 500 }}>
              ⚠️ COD is restricted for the selected address.
            </div>
          )}

          {selectedAddress && !selectedAddress.isServiceable && (
            <div style={{ backgroundColor: "var(--color-error-bg)", border: "1px solid var(--color-error)", borderRadius: "var(--radius-md)", padding: "12px", fontSize: "13px", color: "var(--color-error)", fontWeight: 500, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>❌ The selected address is not serviceable.</div>
              <button
                onClick={() => {
                  setFormData({
                    fullName: selectedAddress.fullName,
                    phone: selectedAddress.phone,
                    pincode: selectedAddress.pincode,
                    line1: selectedAddress.line1,
                    line2: selectedAddress.line2 ?? "",
                    city: selectedAddress.city,
                    state: selectedAddress.state,
                    isDefault: selectedAddress.isDefault,
                  });
                  setFieldErrors({});
                  setIsModalOpen(true);
                }}
                className="btn btn-secondary"
                style={{ alignSelf: "flex-start", padding: "4px 8px", fontSize: "12px" }}
              >
                ← Back to Address Input
              </button>
            </div>
          )}

          {/* Policy summary */}
          <div className="checkout-policy-box">
            <strong>Shipping & Returns:</strong>
            <p style={{ marginTop: "4px" }}>
              Standard delivery takes 3-5 business days. We offer a 7-day hassle-free return window post delivery.
            </p>
          </div>

          {/* T&C Consent checkbox */}
          <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
            <input
              type="checkbox"
              id="tcConsent"
              checked={isTcChecked}
              onChange={(e) => setIsTcChecked(e.target.checked)}
              style={{
                accentColor: "var(--color-accent)",
                width: "18px",
                height: "18px",
                cursor: "pointer",
                marginTop: "2px",
                flexShrink: 0,
              }}
            />
            <label
              htmlFor="tcConsent"
              style={{
                fontSize: "13px",
                color: "var(--color-text-primary)",
                cursor: "pointer",
                userSelect: "none",
                lineHeight: "1.4",
              }}
            >
              I agree to the{" "}
              <Link href="/terms" target="_blank" style={{ color: "var(--color-accent)", textDecoration: "underline" }}>
                Terms &amp; Conditions
              </Link>
              ,{" "}
              <Link href="/shipping" target="_blank" style={{ color: "var(--color-accent)", textDecoration: "underline" }}>
                Shipping Policy
              </Link>
              , and{" "}
              <Link href="/returns" target="_blank" style={{ color: "var(--color-accent)", textDecoration: "underline" }}>
                Returns Policy
              </Link>
              .
            </label>
          </div>

          {/* Trust Badges */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            padding: "16px 0",
            borderTop: "1px solid var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
            margin: "16px 0 20px 0",
            textAlign: "center",
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "20px" }}>🛡️</span>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--color-text-primary)" }}>Secure Checkout</span>
              <span style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>100% Encrypted</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "20px" }}>🔄</span>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--color-text-primary)" }}>Easy Returns</span>
              <span style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>7-day Window</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "20px" }}>🚚</span>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--color-text-primary)" }}>Fast Delivery</span>
              <span style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>3-5 Days COD</span>
            </div>
          </div>

          {/* Action CTA Button */}
          <Button
            variant="primary"
            onClick={handlePlaceOrder}
            disabled={isPlaceOrderDisabled}
            loading={submittingOrder}
            style={{ width: "100%", padding: "14px 28px", fontSize: "15px" }}
            className="btn-premium"
          >
            Place COD Order &rarr;
          </Button>

          <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", textAlign: "center", display: "block" }}>
            Your details are encrypted and processed securely.
          </span>
        </div>
      </div>

    </div>
  );
}
