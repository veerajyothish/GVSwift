import React from "react";
import { Metadata } from "next";
import { FadeIn, StaggerContainer, StaggerChild } from "@/components/ui/Animated";
import { TextEffect } from "@/components/motion-primitives/text-effect";

export const metadata: Metadata = {
  title: "About Us | GVSwift",
  description: "Learn more about GVSwift, our mission to support local brands, and our commitment to zero platform fees.",
};

export default function AboutPage() {
  return (
    <div className="homepage-wrapper min-h-screen flex flex-col bg-default">
      <main id="main-content" className="flex-1" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Header Section */}
          <header style={{ textAlign: "center", marginBottom: "64px" }}>
            <FadeIn delay={0.05} y={15}>
              <h2
                style={{
                  display: "block",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--color-accent)",
                  marginBottom: "20px",
                }}
              >
                Our Story
              </h2>
            </FadeIn>
            <FadeIn delay={0.15} y={20}>
              <TextEffect
                as="h1"
                preset="fade"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(36px, 5vw, 56px)",
                  fontWeight: 400,
                  color: "var(--color-text-primary)",
                  lineHeight: 1.1,
                  marginBottom: "24px",
                }}
              >
                A Platform Built for Local Brilliance
              </TextEffect>
            </FadeIn>
          </header>

          {/* Content Section */}
          <StaggerContainer>
            <StaggerChild>
              <section style={{ marginBottom: "48px" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "24px",
                    fontWeight: 400,
                    color: "var(--color-text-primary)",
                    marginBottom: "16px",
                  }}
                >
                  The Inspiration
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.7,
                    color: "var(--color-text-secondary)",
                    textWrap: "pretty",
                  }}
                >
                  GVSwift was born from a simple yet powerful idea: empowering local stores, homegrown brands, and independent artisans to thrive in the digital age. Many incredible businesses lack the resources or expertise to establish an online presence. We bridge that gap by offering a seamless digital stage for them to expand their reach, amplify their sales, and leverage modern marketing—all without the traditional hurdles of going online.
                </p>
              </section>
            </StaggerChild>

            <StaggerChild>
              <section style={{ marginBottom: "48px" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "24px",
                    fontWeight: 400,
                    color: "var(--color-text-primary)",
                    marginBottom: "16px",
                  }}
                >
                  More Than Just a Store
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.7,
                    color: "var(--color-text-secondary)",
                    textWrap: "pretty",
                  }}
                >
                  Think of GVSwift as a modern digital multi-complex. It is a curated destination where you can discover a diverse array of premium fashion for men and women, meticulously crafted accessories, and unique gifts and decor. We bring the charm and quality of the best local boutiques directly to your screen.
                </p>
              </section>
            </StaggerChild>

            <StaggerChild>
              <section
                style={{
                  background: "var(--color-surface)",
                  padding: "40px",
                  borderRadius: "16px",
                  border: "1px solid var(--color-border)",
                  marginTop: "32px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "24px",
                    fontWeight: 400,
                    color: "var(--color-primary)",
                    marginBottom: "16px",
                    textAlign: "center",
                  }}
                >
                  The GVSwift Difference
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.7,
                    color: "var(--color-text-secondary)",
                    textWrap: "pretty",
                    textAlign: "center",
                    marginBottom: 0,
                  }}
                >
                  Unlike other platforms, we believe in fair growth. <strong>We charge zero maintenance fees, zero platform fees, and zero delivery fees</strong>—not from our customers, and not from our partner stores. Every aspect of the platform's logistics and maintenance is fully managed by the dedicated team at GVSwift. When you shop with us, you are directly supporting the growth of local businesses without hidden markups.
                </p>
              </section>
            </StaggerChild>
          </StaggerContainer>
        </div>
      </main>
    </div>
  );
}
