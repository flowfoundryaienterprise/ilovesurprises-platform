# ILoveSurprises.com

> Premium direct-sales e-commerce marketplace featuring luxury surprise reveals (guaranteed real cash & jewelry in every product), instant search with YouTube-style animated voice typing, dynamic quick-commerce cart engine, and a 5-tier affiliate representative ecosystem.

---

## Overview

**ILoveSurprises.com** is a high-performance, modern direct-to-consumer (DTC) quick-commerce storefront and affiliate marketplace. Every handcrafted product in the catalog—from aromatic soy candles and luxury wax melts to artisan bath treats—contains a sealed, waterproof surprise reveal: either **real cash ($2 to $2,500)** or **luxury jewelry (valued up to $7,500)**.

The platform combines a luxury shopping experience with a fast, app-like interface. It features instant catalog filtering, YouTube-style voice typing recognition, a slide-over cart drawer with automatic free shipping calculations, role-based authentication for customers and brand representatives, and complete mobile responsiveness with hardware return button safety.

---

## ✨ Key Features

- **🎁 Guaranteed Surprise Reveal Metadata:** Every product card transparently highlights prize values (`💵 Real Cash $2 - $2,500 inside` or `💍 Jewelry inside worth $10 - $7,500`).
- **🎙️ YouTube-Style Voice Search Modal:** Real-time Web Speech API voice typing modal featuring concentric pulsating ripple waves, dynamic equalizer bars, and live speech transcription.
- **⚡ Instant Search & Auto-Scroll Highlight:** Real-time keyword filtering across names, scent notes, and surprise values with automatic smooth scrolling and animated focus glow (`#product-{id}`).
- **🛍️ Luxury Slide-Over Cart Drawer:** Quick item adjustments with in-place `− 1 +` steppers, dynamic free shipping threshold calculator ($50 milestone), and discount promo code engine (`VIP15`, `WIN20`, `REP20`).
- **👤 Role-Based Authentication Dialog:** Dual-mode account access supporting **VIP Customers** and **20% Affiliate Representatives** with one-click demo credentials and live session state.
- **📱 Mobile-First Top Navigation:** Clean top-only navigation bar with compact search, adjacent logo layout, and hardware back button trap handling via HTML5 History API (`window.history.pushState` / `popstate`).
- **🖼️ 100% Local Asset Delivery:** All 123 product images, banners, category graphics, review photos, and brand logos are served locally with zero external image dependencies.
- **♿ Motion-Safe & Accessible:** Respects `prefers-reduced-motion` preferences with keyboard shortcuts (`/` for search, `Esc` for modals) and full ARIA semantics.

---

## 🛠️ Tech Stack

### Frontend & Core Engine
- **React 19** (`v19.2.8`) — High-performance declarative component architecture with React Hooks.
- **TypeScript 6** (`~6.0.2`) — Strict type safety across all catalog models, cart operations, and user profiles.
- **Vite 8** (`v8.2.2`) — Instant HMR development server and optimized Rollup production bundler.

### Styling & Design System
- **Tailwind CSS 4** (`v4.3.3`) + `@tailwindcss/vite` (`v4.3.3`) — Utility-first styling with zero runtime overhead.
- **Typography** — Plus Jakarta Sans (body copy) & Outfit (bold luxury display headlines).
- **Iconography** — `lucide-react` (`v1.37.0`) tree-shakeable SVG icons.
- **Animation System** — Hardware-accelerated CSS transforms (`transform-gpu`, `translate3d`), cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`), and Tailwind animation tokens.

### Code Quality & Tooling
- **Oxlint** (`v1.79.0`) — Ultra-fast JavaScript/TypeScript linter (116 configured rules, 0 errors/warnings).

---

## 📁 Project Structure

```
ILoveSurprises/
├── public/                       # Static public assets served from root
│   ├── favicon.svg               # Brand SVG favicon
│   └── assets/
│       └── ilovesurprises/       # 123 localized, high-resolution brand assets
│           ├── affiliate/        # Rep program badges & certificate graphics
│           ├── banners/          # Promotional banner compositions (Cash drops, Jewelry reveals)
│           ├── categories/       # Category exploration circular thumbnails
│           ├── experiences/      # 4-step unboxing reveal step visuals
│           ├── hero/             # Showcase hero product photography
│           ├── icons/            # SVG/PNG trust and feature iconography
│           ├── logo/             # Official I Love Surprises brand logos
│           ├── other/            # Decorative background patterns
│           ├── products/         # 43 handcrafted product images
│           └── reviews/          # Verified customer unboxing photos
├── src/                          # TypeScript application source code
│   ├── main.tsx                  # React 19 application entry with StrictMode
│   ├── App.tsx                   # Master root state (Cart, Auth, Search query, Toast alerts)
│   ├── index.css                 # Tailwind v4 theme variables, easing curves, a11y reduced-motion
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces (Product, Category, Review, CartItem, UserProfile)
│   ├── data/
│   │   ├── categories.ts         # 6 official store categories
│   │   ├── products.ts           # 24 catalog products with scents & surprise valuations
│   │   └── reviews.ts            # 12 verified customer unboxing testimonials
│   ├── pages/
│   │   └── Home.tsx              # Single-page layout coordinating all homepage sections
│   └── components/
│       ├── auth/
│       │   └── AuthModal.tsx     # Role-based VIP & 20% Rep login/register modal dialog
│       ├── cart/
│       │   └── CartDrawer.tsx    # Slide-over shopping bag with promo code & shipping bar
│       ├── home/
│       │   ├── Hero.tsx          # Promotional shopping showcase with prize badges
│       │   ├── PromoBanners.tsx  # Side-by-side promotional drops (Cash vs. Jewelry)
│       │   ├── CategorySection.tsx # Category exploration capsules with mobile snap-scroll
│       │   ├── FeaturedProducts.tsx # Dynamic product grid with category pills & search spy
│       │   ├── SurpriseExperience.tsx # 4-step unboxing reveal journey
│       │   ├── AffiliateSection.tsx # 20% commission rep onboarding showcase
│       │   └── ReviewsSection.tsx # Verified customer review masonry with star filter
│       ├── layout/
│       │   ├── Header.tsx        # Top nav, location hub, full-screen search & voice modal
│       │   └── Footer.tsx        # Quick-commerce footer with trust badges & newsletter
│       └── products/
│           └── ProductCard.tsx   # Interactive product card with quantity stepper & wishlist
├── .oxlintrc.json                # Oxlint linter configuration
├── index.html                    # HTML5 template with Google Web Fonts preconnect
├── package.json                  # Dependencies, scripts, and package metadata
├── tsconfig.json                 # TypeScript project configuration
├── tsconfig.app.json             # App TypeScript compiler settings
├── tsconfig.node.json            # Node/Vite build tool TypeScript configuration
└── vite.config.ts                # Vite 8 configuration with Tailwind CSS 4 plugin
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** `v18.0.0` or higher
- **npm** `v9.0.0` or higher

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/flowfoundryaienterprise/ilovesurprises-platform.git
   cd "I Love Surprises"
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## 🔐 Environment Variables

The frontend is fully configured to run standalone with self-contained mock data. When connecting to an external backend API, the following environment variables can be configured in a `.env` file at the root:

| Variable | Type | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | String | `""` (Local Mock) | Base URL for REST / GraphQL backend services |
| `VITE_APP_NAME` | String | `"I Love Surprises"` | Application display name |

---

## 📜 Available Scripts

In the project directory, you can run:

| Command | Purpose |
|---|---|
| `npm run dev` | Launches the local development server with Vite HMR. |
| `npm run build` | Runs TypeScript type checking (`tsc -b`) and bundles production assets into `dist/`. |
| `npm run lint` | Runs `oxlint` across all TypeScript files for instantaneous code quality checks. |
| `npm run preview` | Locally previews the production build from the `dist/` directory. |

---

## 🌐 Deployment

The application compiles into static HTML, CSS, and JavaScript files in the `dist/` folder via Vite.

### Build for Production:
```bash
npm run build
```

### Supported Hosting Platforms:
- **Vercel / Netlify:** Connect the repository, set the build command to `npm run build`, and configure the output directory as `dist`.
- **Hostinger VPS / Nginx / Apache:** Serve the contents of `dist/` with SPA fallback routing enabled (`try_files $uri $uri/ /index.html;`).

---

## 📱 Responsive Design

The user interface has been tested and verified across all standard viewport widths:

| Viewport | Device Category | Layout Adaptations |
|---|---|---|
| **320px – 414px** | Mobile Devices (iPhone SE, 14/15, Android) | Compact header (`34px` search next to logo), 2-column product grid, horizontal snap scroll for categories, full-screen search view, slide-in menu drawer. |
| **640px – 768px** | Tablets / iPads | 3-column product grid, 2-column promo banners, slide-over cart drawer. |
| **1024px – 1440px**| Laptops & Desktop Displays | Full horizontal navbar with scroll spy, 4-column product catalog, 6-column category capsules. |
| **1440px+** | Ultra-Wide Screens | Centered max container constraint (`1460px`) with high-DPI asset clarity. |

---

## 🎨 UI/UX & Design Philosophy

- **Curated Color Palette:**
  - `Brand Pink`: `#ec2f73` (Primary CTA & highlights)
  - `Dark Pink`: `#d92467` (Hover & active gradients)
  - `Soft Pink Surface`: `#fff3f7` (Borders & badge backgrounds)
  - `Luxury Plum`: `#54217f` (Accent badges & jewelry tones)
  - `Ink Black`: `#141219` (High-contrast typography)
- **Tactile Feedback:** Buttons feature active micro-press scaling (`active:scale-[0.96]`) and subtle elevation changes.
- **Hardware-Accelerated Transitions:** Uses CSS `will-change` and `translate3d` to maintain smooth 60fps animations on mobile browsers.
- **Accessibility:** Full keyboard navigation support (`/` to search, `Escape` to close drawers), semantic HTML5 tags, and `@media (prefers-reduced-motion)` suppression.

---

## 🔌 Data Models & Interfaces

The platform utilizes strongly typed TypeScript interfaces in `src/types/index.ts`:

```typescript
export type SurpriseType = 'jewelry' | 'cash' | 'trinket' | 'charm' | 'mystery';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  originalPrice?: number;
  surpriseType: SurpriseType;
  surpriseValue?: string; // e.g. "Real Cash $2 - $2,500 inside"
  rating: number;
  reviewCount: number;
  image: string;
  badge?: string;
  isBestSeller?: boolean;
  inStock: boolean;
  scentNotes?: string[];
  description?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'representative';
  repUsername?: string;
  avatar?: string;
}
```

---

## 🧪 Testing & Code Quality

- **Linter:** `oxlint` validates all 25 active TypeScript files against 116 strict ESLint-compatible rules with **0 errors and 0 warnings**.
- **Type Checking:** `tsc -b` validates full project compilation with zero implicit `any` types.
- **Production Bundle:** Clean build achieved in **< 1.0s** with optimized gzip footprint (CSS: ~13.7 kB, JS: ~94.1 kB).

---

## 🔒 Security Practices

- **Zero External Script Injections:** No unverified external tracking scripts or CDN dependencies.
- **Safe State Handling:** Native React state management prevents arbitrary HTML/XSS injection.
- **Safe History Navigation:** Modal states use browser history traps (`popstate`) to avoid navigation deadlocks on mobile devices.
- **No Hardcoded Secrets:** Zero API keys or private credentials committed to the codebase.

---

## 📊 Project Status

| Area | Status | Notes |
|---|---|---|
| **Homepage Storefront** | ✅ Complete | 10 sections fully implemented with responsive styling |
| **Catalog & Filtering** | ✅ Complete | 24 products, 6 categories, keyword search, voice search |
| **Shopping Cart Engine** | ✅ Complete | Slide-over bag, discount promo engine, shipping threshold bar |
| **Authentication Flow** | ✅ Complete | Customer / Rep role switcher with demo logins |
| **YouTube Voice Search** | ✅ Complete | Concentric ripples, audio waveform equalizer, speech transcription |
| **Admin & API Backend** | ⏳ In Planning | Architecture ready for REST/GraphQL API integration |

---

## 🔮 Future Improvements

- **Multi-Step Checkout Flow:** Dedicated address collection and payment gateway integration.
- **5-Tier Downline Visualizer:** Interactive tree graph for representative affiliate downlines.
- **Product Quick-View Modal:** Detailed scent pyramid notes and surprise unboxing probability table.
- **Admin Management Portal:** Inventory management, order tracking, and rep commission payout ledgers.

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add amazing feature"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request.

---

## 📄 License

This project is proprietary software created for ILoveSurprises.com. All rights reserved. No open-source license has been specified.

---

## 👨‍💻 Author & Project Team

Executed by **FlowFoundry AI Solutions**:

- **Sri Harsha M** — *Founder & Tech Lead*
- **Ravi Vaghela** — *Co-Founder & Client Coordination*
- **Nithish** — *Senior Backend Developer*
- **Janarthanan** — *Frontend Developer*
