# ILoveSurprises.com

**Custom Full-Stack E-Commerce Platform with 5-Tier MLM Commission Engine**

Executing Agency: **FlowFoundry AI Solutions**
Project Duration: **3 Weeks (21 Days)**
Project Scope: **MLM Direct Sales & E-Commerce Platform**

---

## 1. Executive Summary

ILoveSurprises is a custom, full-stack direct-sales e-commerce marketplace integrated with a 5-tier Multi-Level Marketing (MLM) commission structure. Unlike a standard e-commerce setup, this platform requires custom backend business logic to process real-time upline genealogy, enforce strict commission percentage caps, and support three separate role-based operational dashboards.

---

## 2. Core Functional Modules

### E-Commerce Storefront (Public)
- Premium responsive product discovery and catalog browsing
- Shopping cart and custom checkout
- Customer account management and help desk

### Referral & Tracking Engine
- Custom dynamic username routing (e.g. `/username`)
- Secure first-party referral cookie attribution
- Session event logs and click analytics

### Genealogy & Commission Calculation Engine
- 20% direct personal seller commission
- 5-level upline structure: 5% / 4% / 3% / 2% / 1%
- Strict enforcer for a maximum **35% total commission cap** across all beneficiaries per order

### Refund & Cancellation Lifecycle
- Automated reversal, holding, or voiding of pending payout records upon order refunds or chargebacks

### Three Operational Dashboards
- **Super Admin Console** — global metrics, financial controls, user management, system configuration
- **Rep / Affiliate Portal** — personal referral links, interactive genealogy tree view, sales tracking, earnings ledger
- **Staff Admin** — granular Role-Based Access Control (RBAC) for finance, order processing, and customer support staff

---

## 3. Work Breakdown & Scope Deliverables

| Module / Phase | Core Deliverables & Technical Scope |
|---|---|
| 1. Architecture & UI Setup | Design system (Tailwind CSS), authentication system, RBAC infrastructure |
| 2. Core Storefront & Catalog | Product collection views, item details, shopping cart, and checkout workflow |
| 3. Referral & Genealogy Logic | Dynamic routing engine, tracking cookies, sponsor attribution, and downline visualizer |
| 4. Commission & Payout Engine | 20% direct + 5-tier calculation rules, 35% hard cap enforcer, refund hooks, and payout ledger |
| 5. Operational Dashboards | Super Admin Console, Rep Portal, and Staff Admin custom views |
| 6. Reporting & QA | Financial reconciliation exports, calculation test suites, and security audits |

---

## 4. Key Technical Controls & Governance

- **Transaction Atomicity** — all commission calculations and ledger entries run inside strict database transactions to prevent duplicate payouts from webhook retries
- **Cap Auditing** — backend rules strictly guarantee unearned upline percentages are capped at ≤ 35% total and not incorrectly redistributed
- **Attribution Security** — first-party referral cookies use secure, HTTP-only options with fallback mechanics

---

## 5. 3-Week Delivery Roadmap

### Week 1 — Architecture, Storefront & Referral Engine
- **Sri Harsha M (Tech Lead):** Design overall system architecture, supervise database integrity schemas, configure CI/CD pipeline guidelines
- **Nithish (Backend):** Hostinger VPS provisioning; PostgreSQL schema creation (`users`, `orders`, `genealogy_closure`, `commissions_ledger`); JWT auth APIs; dynamic `/username` edge router; referral cookies
- **Janarthanan (Frontend):** Responsive storefront UI, product catalog, detail views, cart slide-over, authentication UI

### Week 2 — 5-Tier Commission Engine & Rep Portal
- **Sri Harsha M (Tech Lead):** Review dynamic genealogy tree algorithm performance; validate strict 35% hard-cap database enforcer logic
- **Nithish (Backend):** Build Closure Table tree traversal services; calculate 20% direct + 5/4/3/2/1% upline payouts; integrate payment gateway webhooks; enforce transaction idempotency
- **Janarthanan (Frontend):** Interactive 5-level downline visualizer tree, referral link generator, affiliate earnings dashboard

### Week 3 — Admin Console, Refunds, Testing & Deployment
- **Sri Harsha M (Tech Lead):** Conduct end-to-end User Acceptance Testing (UAT), audit RBAC permissions, supervise DNS cutover on GoDaddy/Hostinger, manage client sign-off
- **Nithish (Backend):** Implement automated refund/chargeback webhook handlers for ledger clawbacks, complete RBAC middleware, finalize financial export APIs
- **Janarthanan (Frontend):** Admin console views for order management, rep approvals, catalog management, and audit logs

---

## 6. Team Structure & Role Reallocation

| Role / Specialist | Ownership Area |
|---|---|
| **Sri Harsha M** — Founder & Tech Lead | Overall technical oversight, architecture sign-off, UAT testing, scope governance, and client alignment |
| **Ravi Vaghela** — Co-Founder & Sales | Client progress updates, milestone tracking, and project delivery coordination |
| **Nithish** — Senior Backend Developer | Full backend delivery: database schemas, Hostinger VPS setup, dynamic vanity routing, payment webhooks, 5-tier commission calculation engine, and refund clawbacks |
| **Janarthanan** — Frontend Developer | Storefront UI/UX, shopping cart, dynamic affiliate dashboard, tree visualizer, and admin management portal |

---

## 7. Tech Stack (from scope documents)

- **Frontend:** Tailwind CSS design system, responsive storefront UI
- **Backend:** PostgreSQL, JWT authentication, dynamic edge routing
- **Hosting/Infra:** Hostinger VPS, DNS via GoDaddy/Hostinger
- **Payments:** Payment gateway webhooks with idempotent transaction handling

---

*FlowFoundry AI Solutions • ILoveSurprises.com Project Plan & Scope Documentation*
