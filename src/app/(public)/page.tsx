"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function HomePage() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    pincode: "",
    service: "standard",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleTriggerLoading = () => {
    setIsButtonLoading(true);
    toast.info("Loading simulated action...", "Processing");
    setTimeout(() => {
      setIsButtonLoading(false);
      toast.success("Simulated action completed successfully!", "Success");
    }, 2000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name) errors.name = "Full name is required";
    if (!formData.email) {
      errors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Enter a valid email address";
    }
    if (!formData.pincode) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      errors.pincode = "Pincode must be exactly 6 digits";
    }

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      toast.success(
        `Details submitted for ${formData.name}! Check console.`,
        "Form Submitted"
      );
      console.log("Form Data submitted:", formData);
    } else {
      toast.error("Please correct the errors in the form.", "Validation Failed");
    }
  };

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
      {/* ── Brand Header ────────────────────────────────────────────────────── */}
      <header
        style={{
          textAlign: "center",
          marginBottom: "60px",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "30px",
        }}
      >
        <span
          className="text-xs font-semibold"
          style={{
            color: "var(--color-accent)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            display: "inline-block",
            marginBottom: "8px",
          }}
        >
          Stitch Design System Showcase
        </span>
        <h1 className="text-3xl" style={{ marginBottom: "12px" }}>
          GVSwift Storefront
        </h1>
        <p
          className="text-base"
          style={{ color: "var(--color-text-secondary)", maxWidth: "600px", margin: "0 auto" }}
        >
          Shop with confidence. Premium quality, 4-tier risk-assessed Cash on Delivery (COD) services, and responsive customer support.
        </p>
      </header>

      {/* ── Component Showcase Sections ────────────────────────────────────── */}
      <div style={{ display: "grid", gap: "50px" }}>
        
        {/* SECTION 1: Buttons */}
        <section>
          <h2 className="text-xl" style={{ marginBottom: "20px", borderLeft: "4px solid var(--color-accent)", paddingLeft: "12px" }}>
            Buttons
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
            <Button variant="primary">Primary Gold Button</Button>
            <Button variant="secondary">Secondary Dark Outline</Button>
            <Button variant="danger">Danger Outline</Button>
            <Button variant="primary" disabled>Disabled Button</Button>
            <Button
              variant="primary"
              loading={isButtonLoading}
              onClick={handleTriggerLoading}
            >
              Click to Load Spinner
            </Button>
          </div>
        </section>

        {/* SECTION 2: Toasts */}
        <section>
          <h2 className="text-xl" style={{ marginBottom: "20px", borderLeft: "4px solid var(--color-accent)", paddingLeft: "12px" }}>
            Toast Notifications
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            <Button variant="secondary" onClick={() => toast.success("Your changes have been saved successfully.", "Saved")}>
              Trigger Success Toast
            </Button>
            <Button variant="secondary" onClick={() => toast.error("Could not establish a database connection.", "Database Error")}>
              Trigger Error Toast
            </Button>
            <Button variant="secondary" onClick={() => toast.info("Your order is scheduled for dispatch today.", "Information Update")}>
              Trigger Info Toast
            </Button>
          </div>
        </section>

        {/* SECTION 3: Cards & Products */}
        <section>
          <h2 className="text-xl" style={{ marginBottom: "20px", borderLeft: "4px solid var(--color-accent)", paddingLeft: "12px" }}>
            Cards & Product Layout
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "30px" }}>
            
            {/* Product Card */}
            <Card interactive className="card-product">
              <div className="card-product-image-container">
                <Image
                  src="/fashion_product_mockup.png"
                  alt="Premium Black Jacket with Gold Zippers"
                  className="card-product-image"
                  width={300}
                  height={300}
                  style={{ objectFit: "cover" }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-text-on-dark)",
                    padding: "4px 8px",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  NEW RELEASE
                </span>
              </div>
              <div className="card-product-content">
                <h3 className="card-product-title">Stitch Gold-Trimmed Premium Jacket</h3>
                <span className="card-product-price" style={{ color: "var(--color-accent-dark)", marginBottom: "16px", display: "block" }}>
                  ₹4,999.00
                </span>
                <div style={{ marginTop: "auto" }}>
                  <Button variant="primary" style={{ width: "100%" }} onClick={() => toast.success("Added Premium Jacket to your cart!", "Cart Updated")}>
                    Add to Cart
                  </Button>
                </div>
              </div>
            </Card>

            {/* Info / Policy Card */}
            <Card className="card-info" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <CardHeader>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    style={{ width: "20px", height: "20px", color: "var(--color-accent)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124l-.09-2.543a1.125 1.125 0 00-.735-1.012l-3.325-1.109m0-6h1.5A2.25 2.25 0 0121 8.25v5.25m-18 0A2.25 2.25 0 015.25 11.25h11.25m-11.25 3v1.5m2.25 0h7.5"
                    />
                  </svg>
                  <span>Shipping & Returns Policy</span>
                </CardHeader>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
                  Standard shipping: 3-5 business days across India. Return windows are strictly 7 days from the timestamp of delivery. COD is available for serviceable locations only.
                </p>
                
                <div className="alert-banner alert-warning" style={{ marginTop: "16px" }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    style={{ width: "18px", height: "18px", flexShrink: 0, marginTop: "2px" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  <div>
                    <strong style={{ display: "block", marginBottom: "2px" }}>COD Limit Active</strong>
                    Orders exceeding ₹10,000 are restricted to prepaid payment methods only.
                  </div>
                </div>
              </div>
              <Button variant="secondary" style={{ marginTop: "20px" }} onClick={() => setIsModalOpen(true)}>
                Open Full Terms Modal
              </Button>
            </Card>

          </div>
        </section>

        {/* SECTION 4: Interactive Forms */}
        <section>
          <h2 className="text-xl" style={{ marginBottom: "20px", borderLeft: "4px solid var(--color-accent)", paddingLeft: "12px" }}>
            Interactive Form Controls
          </h2>
          <Card style={{ padding: "30px", maxWidth: "600px" }}>
            <form onSubmit={handleFormSubmit}>
              <Input
                label="Full Name"
                placeholder="Enter your name"
                required
                value={formData.name}
                error={formErrors.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Email Address"
                placeholder="you@example.com"
                type="email"
                required
                value={formData.email}
                error={formErrors.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Pincode"
                placeholder="e.g. 530001"
                required
                maxLength={6}
                value={formData.pincode}
                error={formErrors.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
              />
              <Select
                label="Shipping Service Level"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                options={[
                  { value: "standard", label: "Standard Shipping (3-5 Days)" },
                  { value: "express", label: "Express Shipping (1-2 Days)" },
                  { value: "same-day", label: "Vizag Direct Same-Day (Selected areas)" },
                ]}
              />
              <Textarea
                label="Additional Delivery Instructions"
                placeholder="e.g. Leave with security guard"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
              <Button variant="primary" type="submit" style={{ width: "100%", marginTop: "10px" }}>
                Submit Information
              </Button>
            </form>
          </Card>
        </section>

      </div>

      {/* ── Modal Component ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="GVSwift Policies & Terms"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Decline
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(false);
                toast.success("You accepted the terms and conditions.", "Terms Accepted");
              }}
            >
              Accept Terms
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", color: "var(--color-text-secondary)" }}>
          <p>
            Welcome to GVSwift. Please read our operational policies carefully. Our Cash on Delivery (COD) services are subject to verification and local serviceability filters.
          </p>
          <p>
            Any account flagged with a <strong>BLACKLISTED</strong> or <strong>HIGH_RISK</strong> status in our database will be restricted from placing COD orders. Orders exceeding the transaction value of ₹10,000 will be auto-rejected at checkout.
          </p>
          <p>
            Return requests are only valid within 7 days of package delivery. Returned packages must remain unworn, with all tags and original packaging intact.
          </p>
        </div>
      </Modal>
    </main>
  );
}
