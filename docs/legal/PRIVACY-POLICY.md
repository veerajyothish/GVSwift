# GVSwift — Privacy Policy

**Effective Date:** 16 July 2026  
**Last Updated:** 16 July 2026  
**Version:** 1.0

> ⚠️ This policy is a starting template drafted in the spirit of India's Digital Personal Data Protection Act 2023 (DPDP Act). Have it reviewed by a qualified legal professional before public launch.

---

## 1. Who We Are

GVSwift is operated by GVSwift, located at MVP Colony, Sector 9, 2-1-7/1, Visakhapatnam, Andhra Pradesh — 530017, India ("Data Fiduciary" under the DPDP Act 2023). This policy explains what personal data we collect, why, and how we protect it.

---

## 2. Data We Collect

### 2.1 Data You Provide Directly

| Data | When collected | Why |
|---|---|---|
| Full name | Registration, checkout | Identify you, address your orders |
| Email address | Registration | Authentication, order emails, password reset |
| Phone number | Address book | Delivery coordination |
| Delivery address (street, city, state, pincode) | Address book, checkout | Fulfil your order |
| Support ticket messages | Support form | Resolve your complaint |

### 2.2 Data Collected Automatically

| Data | Source | Why |
|---|---|---|
| IP address | Server logs | Security, rate limiting, fraud detection |
| Browser type, device type | Server logs | Debugging, compatibility |
| Pages visited, events (add-to-cart, checkout start, order placed) | Google Analytics 4 | Improve the Platform — **only with your cookie consent** |
| Error logs | Sentry | Fix bugs and monitor system health |

### 2.3 Data We Do NOT Collect

- Payment card numbers (no online payment at this stage)
- Government IDs (Aadhaar, PAN) — we do not request or store these
- Biometric data
- Location data beyond delivery address

---

## 3. Legal Basis for Processing

Under India's DPDP Act 2023, we process your data on the following grounds:

- **Consent** — for analytics cookies (GA4), which you can withdraw via the cookie banner.
- **Contractual necessity** — to process your order and deliver to you.
- **Legitimate interests** — for fraud prevention, security monitoring, and error logging.
- **Legal obligation** — to maintain records as required by applicable Indian law.

---

## 4. How We Use Your Data

- To create and manage your account.
- To process, fulfil, and communicate about your orders.
- To send transactional emails (order confirmation, status updates, password reset) via Resend.
- To detect and prevent fraud and abuse via our risk flagging system.
- To respond to your support tickets.
- To analyse site usage via GA4 (consent-gated only).
- To monitor errors and system health via Sentry.

---

## 5. Data Sharing

We do not sell your personal data. We share data only with:

| Recipient | Purpose | Data shared |
|---|---|---|
| Supabase | Authentication and database hosting | All user data (encrypted at rest) |
| Resend | Transactional email delivery | Name, email address |
| Sentry | Error monitoring | Anonymised error context (no PII in breadcrumbs by policy) |
| Google Analytics (GA4) | Usage analytics | Anonymised event data — only with your consent |
| Vercel | Hosting | Server logs, IP address |
| Upstash Redis | Rate limiting | Hashed identifiers only |

All third-party processors are contractually obligated to process data only for the stated purpose and to maintain appropriate security standards.

---

## 6. Data Retention

| Data type | Retention period |
|---|---|
| Account data | Until you delete your account + 90 days |
| Order data | 7 years (legal/accounting obligation) |
| Support tickets | 2 years after closure |
| Server/access logs | 90 days |
| Analytics data (GA4) | Per Google's data retention settings (default 14 months) |

---

## 7. Your Rights

Under the DPDP Act 2023, you have the right to:

- **Access** — request a copy of the personal data we hold about you.
- **Correction** — request correction of inaccurate data.
- **Erasure** — request deletion of your data (subject to legal retention obligations).
- **Withdraw consent** — withdraw analytics consent at any time via the cookie banner.
- **Nominate** — nominate a person to exercise rights on your behalf in the event of death or incapacity.
- **Grievance** — file a complaint with our Grievance Officer (see below) or with the Data Protection Board of India once it is constituted.

To exercise any right, email support@gvswift.com with the subject line "Data Rights Request".

---

## 8. Cookies

See our separate **Cookie Policy** (`docs/legal/COOKIE-POLICY.md`) for full details. In summary:

- **Essential cookies** — required for authentication and session management. Cannot be disabled.
- **Analytics cookies (GA4)** — only set after you accept via the cookie consent banner. You can withdraw consent at any time.

---

## 9. Security

- All data in transit is encrypted via HTTPS/TLS.
- Supabase encrypts data at rest.
- Passwords are never stored by us — Supabase Auth handles authentication with bcrypt hashing.
- The `SUPABASE_SERVICE_ROLE_KEY` is a server-side secret and is never exposed to the browser.
- Rate limiting is enforced on login, signup, and checkout to prevent brute-force and abuse.
- We conduct security reviews before major releases.

---

## 10. Children's Privacy

GVSwift is not directed at children under 18. We do not knowingly collect personal data from children. If you believe a child has provided us data, contact us immediately at support@gvswift.com.

---

## 11. Changes to This Policy

We may update this policy from time to time. Material changes will be communicated via a banner on the Platform or by email at least 7 days before they take effect.

---

## 12. Grievance Officer

**Grievance Officer:** P Govind  
**Email:** gvswift.help@gmail.com  
**Address:** MVP Colony, Sector 9, 2-1-7/1, Visakhapatnam, Andhra Pradesh — 530017, India  
**Response time:** Acknowledgement within 48 hours; resolution within 30 days.

---

*End of Privacy Policy.*
