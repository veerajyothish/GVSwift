"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { trackEvent } from "@/lib/analytics/ga4";
import { mapProductToGa4Item } from "@/lib/analytics/ecommerce";

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

interface AvailableCoupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderPaise: number;
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
  const [isPending, startTransition] = useTransition();

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
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  
  // Stable idempotency key per checkout session
  const [idempotencyKey] = useState(() => generateIdempotencyKey());

  // B12: Loyalty points states
  const [loyaltyBalance, setLoyaltyBalance] = useState(initialLoyaltyBalance ?? 0);
  const [loyaltySettings, setLoyaltySettings] = useState(initialLoyaltySettings ?? { rupeesPer100Points: 10 });
  const [usePoints, setUsePoints] = useState(false);

  const [locating, setLocating] = useState(false);
  const formStartedFired = React.useRef(false);

  const trackValidationError = (error: string) => {
    trackEvent("checkout_validation_error", { error_message: error });
    toast.error(error);
  };

  const handleGeolocation = async () => {
    setLocating(true);

    interface NominatimAddress {
      house_number?: string;
      road?: string;
      neighbourhood?: string;
      suburb?: string;
      county?: string;
      city?: string;
      town?: string;
      village?: string;
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

      const houseNumber = addr.house_number ?? "";
      const road = addr.road ?? addr.neighbourhood ?? "";
      const suburb = addr.suburb ?? addr.neighbourhood ?? "";
      const county = addr.county ?? "";

      setFormData((prev) => ({
        ...prev,
        line1: [houseNumber, road].filter(Boolean).join(", ") || prev.line1,
        line2: [suburb, county].filter(Boolean).join(", ") || prev.line2,
        city,
        state,
        pincode,
      }));
      setLocating(false);
      toast.success("Location populated!");
    };

    const fetchByCoords = async (lat: number, lon: number) => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!res.ok) throw new Error("Nominatim failed");
      const data = await res.json();
      if (!data || !data.address) throw new Error("No address details returned");
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
      toast.success("Location populated (from IP)!");
    };

    if (!navigator.geolocation) {
      try {
        await fetchByIP();
      } catch (err) {
        console.error("IP geolocation failed:", err);
        toast.error("Could not fetch location. Please enter manually.");
        setLocating(false);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await fetchByCoords(position.coords.latitude, position.coords.longitude);
        } catch (err) {
          console.warn("fetchByCoords failed, trying IP fallback:", err);
          try {
            await fetchByIP();
          } catch (ipErr) {
            console.error("Geolocation and IP fallback failed:", ipErr);
            toast.error("Could not fetch location. Please enter manually.");
            setLocating(false);
          }
        }
      },
      async (error) => {
        console.warn("Browser Geolocation permission denied or failed, trying IP fallback:", error);
        try {
          await fetchByIP();
        } catch (ipErr) {
          console.error("Geolocation and IP fallback failed:", ipErr);
          toast.error("Could not fetch location. Please enter manually.");
          setLocating(false);
        }
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
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
 
  useEffect(() => {
    fetch("/api/v1/coupons")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAvailableCoupons(data);
        }
      })
      .catch(() => {});
  }, []);
 
  const applySpecificCoupon = (code: string) => {
    setCouponInput(code);
    setCouponError(null);
    setTimeout(async () => {
      setCouponLoading(true);
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
        } else {
          setAppliedCoupon({ code: data.code, discountPaise: data.discountPaise });
          setCouponError(null);
          setCouponInput("");
        }
      } catch {
        setCouponError("Network error. Please try again.");
      } finally {
        setCouponLoading(false);
      }
    }, 50);
  };

  const redeemablePoints = Math.floor(loyaltyBalance / 100) * 100;
  const pointsDiscountPaise = usePoints
    ? (redeemablePoints / 100) * loyaltySettings.rupeesPer100Points * 100
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
    trackEvent("apply_coupon", { coupon: code });
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
        trackEvent("coupon_failure", { coupon: code, error: data.error ?? "Invalid coupon code." });
        setCouponError(data.error ?? "Invalid coupon code.");
        setAppliedCoupon(null);
        return;
      }
      trackEvent("coupon_success", { coupon: code, discount: data.discountPaise / 100 });
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

  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    trackEvent("add_shipping_info", {
      currency: "INR",
      value: totalPaise / 100,
      coupon: appliedCoupon?.code ?? undefined,
      shipping_tier: "Standard",
      items: initialCart.items.map((i) => mapProductToGa4Item(i)),
    });
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
      
      // Optimistically append the new address so it displays immediately without flashing/reloading
      const newAddress: Address = {
        id: data.id,
        fullName: data.fullName,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone,
        isDefault: data.isDefault,
        isServiceable: true,
        isCodBlocked: false,
        requiresApproval: false,
      };
      setAddresses((prev) => [...prev, newAddress]);

      // Auto-select this newly created address
      handleAddressSelect(data.id);
      
      // Refresh server component in the background so risk levels are resolved
      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not add address", "Error");
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      trackValidationError("Please select a shipping address");
      return;
    }

    if (selectedAddress?.isCodBlocked) {
      trackValidationError("Cash on Delivery is not available for the selected address");
      return;
    }

    if (!selectedAddress?.isServiceable) {
      trackValidationError("The selected address is not serviceable");
      return;
    }

    if (isOverCodLimit) {
      trackValidationError("Order total exceeds the Cash on Delivery limit");
      return;
    }

    if (!isTcChecked) {
      trackValidationError("You must agree to the Terms & Conditions to place an order");
      return;
    }

    setSubmittingOrder(true);
    setServerError(null);

    trackEvent("add_payment_info", {
      currency: "INR",
      value: totalPaise / 100,
      coupon: appliedCoupon?.code ?? undefined,
      payment_type: "COD",
      items: initialCart.items.map(i => mapProductToGa4Item(i)),
    });

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
          pointsToRedeem: usePoints ? redeemablePoints : 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "An error occurred during checkout");
      }

      const orderId = data.order.id;
      trackEvent("purchase", {
        currency: "INR",
        transaction_id: orderId,
        value: totalPaise / 100,
        coupon: appliedCoupon?.code ?? undefined,
        items: initialCart.items.map(i => mapProductToGa4Item(i)),
      });

      toast.success("Order placed successfully!");

      // Trigger order confirmation email
      try {
        await fetch('/api/email/order-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: data.order.user.email,
            customerName: data.order.user.name || "Customer",
            orderId: orderId,
            orderItems: data.order.items.map((item: { product: { name: string }, quantity: number, unitPricePaise: number }) => ({
              name: item.product.name,
              quantity: item.quantity,
              price: item.unitPricePaise / 100,
            })),
            totalAmount: data.order.totalPaise / 100,
            deliveryAddress: `${data.order.address.line1}, ${data.order.address.city}, ${data.order.address.state} ${data.order.address.pincode}`,
          }),
        });
      } catch (emailErr) {
        console.error("Failed to trigger order confirmation email", emailErr);
      }

      // ponytail: CSS-only confetti burst
      const colors = ["#6b1e2e", "#d4a574", "#e8c8a0", "#8b3a4a", "#c49a6c", "#f0d8b4", "#a0522d", "#deb887"];
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;inset:0;z-index:99999;pointer-events:none;overflow:hidden;";
      const style = document.createElement("style");
      style.textContent = `@keyframes gv-confetti{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`;
      container.appendChild(style);
      for (let i = 0; i < 40; i++) {
        const p = document.createElement("span");
        p.style.cssText = `
          position:absolute;top:-10px;
          left:${Math.random() * 100}%;
          width:${6 + Math.random() * 6}px;
          height:${6 + Math.random() * 6}px;
          background:${colors[Math.floor(Math.random() * colors.length)]};
          border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
          animation:gv-confetti ${1.2 + Math.random() * 1}s ease-out ${Math.random() * 0.5}s forwards;
        `;
        container.appendChild(p);
      }
      document.body.appendChild(container);
      setTimeout(() => container.remove(), 2500);

      // Redirect after confetti plays
      setTimeout(() => {
        startTransition(() => {
          router.push(`/account/orders/${orderId}`);
        });
      }, 1800);
    } catch (err: unknown) {
      const error = err as Error;
      setServerError(error.message || "Failed to place order. Please try again.");
      toast.error(error.message || "Checkout failed", "Error");
      setSubmittingOrder(false); // Only re-enable on error
    }
  };

  const isPlaceOrderDisabled =
    !isTcChecked ||
    !selectedAddressId ||
    selectedAddress?.isCodBlocked ||
    !selectedAddress?.isServiceable ||
    isOverCodLimit ||
    submittingOrder ||
    isPending;

  return (
    <div className="checkout-grid">
      {/* Checkout Steps Form */}
      <div className="checkout-main-col">
        {/* Mobile Expandable Summary */}
        <div className="lg:hidden w-full max-w-[800px] mb-8">
          <details 
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "16px", marginBottom: "16px" }}
            onToggle={(e) => {
              if (e.currentTarget.open) trackEvent("checkout_order_summary_opened");
            }}
          >
            <summary style={{ fontWeight: 600, fontSize: "14px", cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between" }}>
              <span>Order Summary</span>
              <span style={{ color: "var(--color-accent)" }}>{formatRupees(totalPaise)}</span>
            </summary>
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
              {initialCart.items.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13px" }}>
                  <span>{item.quantity}x {item.product.name}</span>
                  <span>{formatRupees((item.variant ? (item.product.basePricePaise + item.variant.priceDeltaPaise) : item.product.basePricePaise) * item.quantity)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", fontSize: "13px" }}>
                <span className="text-secondary">Subtotal</span>
                <span>{formatRupees(subtotalPaise)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "13px" }}>
                <span className="text-secondary">Shipping</span>
                <span style={{ color: "var(--color-success)" }}>Free &middot; Delivery in 3–5 days</span>
              </div>
            </div>
          </details>
        </div>

        {/* Step 1: Shipping Address Selection */}
        <Card className="checkout-card">
          <fieldset style={{ border: "none", margin: 0, padding: 0, minWidth: 0 }}>
            <legend className="sr-only">1. Shipping Address</legend>
            <div className="checkout-card-header">
              <h2 className="text-xl font-semibold checkout-header-title" aria-hidden="true">
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
                    autoComplete="name"
                    onFocus={() => {
                      if (!formStartedFired.current) {
                        formStartedFired.current = true;
                        trackEvent("checkout_form_started");
                      }
                    }}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                  <Input
                    label="Mobile Number"
                    placeholder="10-digit Indian number"
                    value={formData.phone}
                    error={fieldErrors.phone}
                    required
                    autoComplete="tel"
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
                    autoComplete="postal-code"
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
                  />
                  <Input
                    label="City"
                    placeholder="e.g. Bangalore"
                    value={formData.city}
                    error={fieldErrors.city}
                    required
                    autoComplete="address-level2"
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                  <Input
                    label="State"
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    error={fieldErrors.state}
                    required
                    autoComplete="address-level1"
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>

                <Input
                  label="Address Line 1"
                  placeholder="Flat, House no., Building, Company, Apartment"
                  value={formData.line1}
                  error={fieldErrors.line1}
                  required
                  autoComplete="address-line1"
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                />

                <Input
                  label="Address Line 2 (Optional)"
                  placeholder="Area, Street, Sector, Village"
                  value={formData.line2}
                  error={fieldErrors.line2}
                  autoComplete="address-line2"
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
                    onClick={() => handleAddressSelect(addr.id)}
                    className={`checkout-address-option ${isSelected ? "checkout-address-option-selected" : ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "start", marginTop: "4px" }}>
                      <input
                        type="radio"
                        id={`addr-${addr.id}`}
                        name="selectedAddress"
                        checked={isSelected}
                        onChange={() => handleAddressSelect(addr.id)}
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
          </fieldset>
        </Card>

        {/* Step 2: Payment Method */}
        <Card className="checkout-card">
          <fieldset style={{ border: "none", margin: 0, padding: 0, minWidth: 0 }}>
            <legend className="sr-only">2. Payment Method</legend>
            <div className="checkout-card-header">
              <h2 className="text-xl font-semibold checkout-header-title" aria-hidden="true">
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
          </fieldset>
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
              <span className="text-secondary">Subtotal</span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatRupees(subtotalPaise)}</span>
            </div>
            <div className="cart-summary-row">
              <span className="text-secondary">Shipping</span>
              <span style={{ color: "var(--color-success)", fontWeight: 500 }}>FREE</span>
            </div>
            <div className="cart-summary-row">
              <span className="text-secondary">COD Fee</span>
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 0",
              fontSize: "13px",
              color: loyaltyBalance >= 100 ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              fontWeight: 500,
              userSelect: "none",
              cursor: loyaltyBalance >= 100 ? "pointer" : "not-allowed",
              marginTop: "4px",
            }}
            onClick={() => {
              if (loyaltyBalance >= 100) setUsePoints((v) => !v);
            }}
          >
            <input
              type="checkbox"
              id="loyalty-points-checkbox"
              checked={usePoints}
              onChange={(e) => {
                if (loyaltyBalance >= 100) setUsePoints(e.target.checked);
              }}
              disabled={loyaltyBalance < 100}
              style={{
                accentColor: "var(--color-accent)",
                width: "20px",
                height: "20px",
                cursor: loyaltyBalance >= 100 ? "pointer" : "not-allowed",
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <label
              htmlFor="loyalty-points-checkbox"
              style={{ cursor: loyaltyBalance >= 100 ? "pointer" : "not-allowed", flexGrow: 1 }}
              onClick={(e) => e.preventDefault()} // Let parent div handle the click to prevent double firing
            >
              Use my loyalty points (<span style={{ fontVariantNumeric: "tabular-nums" }}>{loyaltyBalance >= 100 ? redeemablePoints : loyaltyBalance}</span> pts{loyaltyBalance >= 100 ? ` = ₹${(redeemablePoints / 100) * loyaltySettings.rupeesPer100Points} off` : " available. Min 100 required."})
            </label>
          </div>

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
                onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
                onBlur={(e) => setCouponInput(e.target.value.trim().toUpperCase())}
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
 
          {!appliedCoupon && availableCoupons.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
                Available Coupons
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {availableCoupons.map((c) => {
                  const offerText = c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue / 100} OFF`;
                  const isEligible = subtotalPaise >= c.minOrderPaise;
                  return (
                    <div
                      key={c.code}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        border: "1px dashed var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        background: "rgba(0,0,0,0.01)",
                        opacity: isEligible ? 1 : 0.6,
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, padding: "2px 6px", border: "1px solid var(--color-accent)", borderRadius: "4px", color: "var(--color-accent)", background: "rgba(107,30,46,0.02)" }}>
                            {c.code}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-success)" }}>
                            {offerText}
                          </span>
                        </div>
                        {c.minOrderPaise > 0 && (
                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                            Min purchase: {formatRupees(c.minOrderPaise)}
                          </div>
                        )}
                      </div>
                      {isEligible ? (
                        <button
                          type="button"
                          onClick={() => applySpecificCoupon(c.code)}
                          disabled={couponLoading}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "4px 10px", fontSize: "11px", borderRadius: "var(--radius-sm)" }}
                        >
                          Apply
                        </button>
                      ) : (
                        <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-error)", whiteSpace: "nowrap" }}>
                          Needs {formatRupees(c.minOrderPaise - subtotalPaise)} more
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
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
          <div 
            style={{ display: "flex", gap: "10px", alignItems: "start", cursor: "pointer", padding: "4px 0" }}
            onClick={(e) => {
              // Prevent toggling if a link was clicked
              if ((e.target as HTMLElement).tagName !== 'A') {
                setIsTcChecked(!isTcChecked);
              }
            }}
          >
            <input
              type="checkbox"
              id="tcConsent"
              checked={isTcChecked}
              onChange={(e) => setIsTcChecked(e.target.checked)}
              style={{
                accentColor: "var(--color-accent)",
                width: "20px",
                height: "20px",
                cursor: "pointer",
                marginTop: "2px",
                flexShrink: 0,
              }}
              onClick={(e) => e.stopPropagation()}
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
              onClick={(e) => e.preventDefault()} // Parent handles the toggle
            >
              I agree to the{" "}
              <Link href="/terms" target="_blank" style={{ color: "var(--color-accent)", textDecoration: "underline" }} onClick={(e) => e.stopPropagation()}>
                Terms &amp; Conditions
              </Link>
              ,{" "}
              <Link href="/shipping" target="_blank" style={{ color: "var(--color-accent)", textDecoration: "underline" }} onClick={(e) => e.stopPropagation()}>
                Shipping Policy
              </Link>
              , and{" "}
              <Link href="/returns" target="_blank" style={{ color: "var(--color-accent)", textDecoration: "underline" }} onClick={(e) => e.stopPropagation()}>
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
            disabled={isPlaceOrderDisabled || submittingOrder}
            loading={submittingOrder && !isPending}
            style={{ width: "100%", padding: "14px 28px", fontSize: "15px" }}
            className="btn-premium"
          >
            {submittingOrder ? "Redirecting..." : "Place Order & Pay on Delivery"}
          </Button>

          <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--color-text-secondary)", justifyContent: "center" }}>
            <span>🔒 Secure Checkout</span>
            <span>•</span>
            <span>🔄 Easy Returns</span>
            <span>•</span>
            <span>💵 COD Available</span>
          </div>
        </div>
      </div>

    </div>
  );
}
