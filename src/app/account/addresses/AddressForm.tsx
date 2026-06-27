"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface AddressFormData {
  fullName: string;
  phone: string;
  pincode: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  isDefault: boolean;
}

interface AddressFormProps {
  initialData?: AddressFormData;
  addressId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const defaultFormData: AddressFormData = {
  fullName: "",
  phone: "",
  pincode: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  isDefault: false,
};

export default function AddressForm({
  initialData,
  addressId,
  onSuccess,
  onCancel,
  isModal = false,
}: AddressFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<AddressFormData>(initialData || defaultFormData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
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

  const handlePincodeBlur = async () => {
    const pin = formData.pincode.trim();
    if (!/^\d{6}$/.test(pin)) return;

    setPincodeLoading(true);
    setFieldErrors((prev) => ({ ...prev, pincode: "" }));
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const district = data[0].PostOffice[0].District;
        const stateName = data[0].PostOffice[0].State;
        setFormData((prev) => ({
          ...prev,
          city: district || prev.city,
          state: stateName || prev.state,
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, pincode: "Invalid pincode, please enter manually" }));
      }
    } catch {
      setFieldErrors((prev) => ({ ...prev, pincode: "Failed to fetch postal details, please enter manually" }));
    } finally {
      setPincodeLoading(false);
    }
  };

  const validate = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const isEdit = !!addressId;
      const url = isEdit ? `/api/v1/addresses/${addressId}` : "/api/v1/addresses";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
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

      toast.success(isEdit ? "Address updated successfully" : "Address created successfully");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/account/addresses");
        router.refresh();
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred while saving address";
      toast.error(errMsg, "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const formJsx = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Geolocation Button */}
      <button
        type="button"
        disabled={locating}
        onClick={handleGeolocation}
        className="btn btn-secondary flex items-center gap-2 mb-2 self-start btn-premium"
        style={{
          minHeight: "36px",
          fontSize: "12px",
          padding: "8px 16px",
          borderRadius: "50px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {locating ? (
          <>
            <span className="animate-spin mr-1">⌛</span> Detecting location...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>my_location</span>
            Use My Location
          </>
        )}
      </button>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Full Name"
          placeholder="e.g. John Doe"
          value={formData.fullName}
          error={fieldErrors.fullName}
          required
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="input-field-premium"
        />
        <Input
          label="Mobile Number"
          placeholder="10-digit Indian number"
          value={formData.phone}
          error={fieldErrors.phone}
          required
          onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
          className="input-field-premium"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative">
          <Input
            label="Pincode"
            placeholder="6-digit PIN code"
            value={formData.pincode}
            error={fieldErrors.pincode}
            required
            onBlur={handlePincodeBlur}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
            className="input-field-premium"
          />
          {pincodeLoading && (
            <span className="absolute right-3 top-9 text-xs text-secondary animate-pulse font-medium">
              Loading...
            </span>
          )}
        </div>
        <Input
          label="City"
          placeholder="e.g. Bangalore"
          value={formData.city}
          error={fieldErrors.city}
          required
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          className="input-field-premium"
        />
        <Input
          label="State"
          placeholder="e.g. Karnataka"
          value={formData.state}
          error={fieldErrors.state}
          required
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          className="input-field-premium"
        />
      </div>

      <Input
        label="Address Line 1"
        placeholder="Flat, House no., Building, Company, Apartment"
        value={formData.line1}
        error={fieldErrors.line1}
        required
        onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
        className="input-field-premium"
      />

      <Input
        label="Address Line 2 (Optional)"
        placeholder="Area, Street, Sector, Village"
        value={formData.line2}
        error={fieldErrors.line2}
        onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
        className="input-field-premium"
      />

      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          style={{
            cursor: "pointer",
            accentColor: "var(--color-primary)",
            width: "18px",
            height: "18px",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
          }}
        />
        <label
          htmlFor="isDefault"
          className="text-sm text-primary font-medium"
          style={{
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          Make this my default shipping address
        </label>
      </div>

      <div
        className="border-t border-color-border pt-6 mt-4 flex justify-end gap-3"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            if (onCancel) {
              onCancel();
            } else {
              router.push("/account/addresses");
            }
          }}
          disabled={submitting}
          style={{
            borderRadius: "50px",
            padding: "10px 24px",
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          loading={submitting}
          className="btn-premium"
          style={{
            borderRadius: "50px",
            padding: "10px 32px",
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {addressId ? "Save Changes" : "Add Address"}
        </Button>
      </div>
    </form>
  );

  if (isModal) {
    return formJsx;
  }

  return (
    <Card className="p-6 bg-surface border border-color-border rounded-lg shadow-sm w-full max-w-xl mx-auto" style={{ border: "1px solid var(--color-border)" }}>
      {formJsx}
    </Card>
  );
}

