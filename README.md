<p align="center">
  <img src="public/assets/ilovesurprises/logo/Picsart_26-09-06_13-10-54-145.jpg" alt="I Love Surprises Logo" width="460" />
</p>

<h1 align="center">I Love Surprises Platform</h1>

<p align="center">
  <strong>Handcrafted Soy Candles &amp; Bath Treats with Hidden Cash &amp; Fine Jewelry Reveals</strong>
</p>

<p align="center">
  A state-of-the-art direct-to-consumer (DTC) e-commerce storefront delivering viral unboxing excitement, role-based representative affiliate management, interactive delivery mapping, and multi-tier loyalty rewards.
</p>

<p align="center">
  <a href="https://github.com/flowfoundryaienterprise/ilovesurprises-platform" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/💻_GitHub-Repository-24292e?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/Lucide_Icons-F56565?style=flat-square&logo=feather&logoColor=white" alt="Lucide Icons" />
  <img src="https://img.shields.io/badge/Oxlint-4B32C3?style=flat-square&logo=oxc&logoColor=white" alt="Oxlint" />
</p>

---

## 📖 Project Overview

**I Love Surprises** is a luxury direct-to-consumer (DTC) e-commerce storefront dedicated to sensory surprise reveal products. Every hand-poured soy candle, artisan goat's milk soap, and bath bomb conceals a sealed prize inside: genuine cash bills ranging from **$2 to $2,500**, or fine appraised jewelry valued up to **$7,500** (including solid sterling silver and 14K gold pieces).

Built with **React 19**, **TypeScript**, and **Tailwind CSS v4**, the application delivers a frictionless shopping experience featuring interactive image zooming, real-time faceted search, hands-free voice search, dynamic cart management, interactive Leaflet delivery mapping, a 20% commission brand representative affiliate portal, and a merchant admin operations console.

---

## ✨ Key Features

- **Product Catalog & Scent Discovery**: Browse luxury jewelry candles, cash candles, soda-pop novelty candles, and goat's milk soaps with detailed scent notes, burn time specifications, wax blend breakdowns, and prize reveal tiers.
- **Interactive Product Gallery**: Detail view equipped with smooth hover zoom inspection, full-screen lightbox exploration, ring size variant selection (sizes 5–10), and verified customer unboxing reviews.
- **Slide-Over Shopping Bag**: Interactive cart drawer with dynamic free shipping progress threshold tracking, coupon code discounts, and real-time quantity adjustments.
- **Faceted Search & Voice Search**: Filter catalog items by category, price, customer rating, and prize reveal type, paired with hands-free search powered by the browser Web Speech API.
- **Precision Pin-Drop Checkout**: Streamlined multi-step checkout workflow with guest/account checkout options, order summary breakdown, and interactive Leaflet map address location picker.
- **Brand Representative Affiliate Portal**: Dedicated consultant hub featuring sales commission tracking, personalized storefront attribution banners, referral link generator, and downloadable QR cards.
- **Merchant Admin Console**: Centralized management interface for tracking inventory stock levels, order fulfillment workflows (Pending, Processing, Shipped, Delivered), promotional coupon management, and customer analytics.
- **Tiered Customer Loyalty Club**: Customer rewards points tracker, milestone redemption tiers, and surprise reveal probability information.
- **High-Refresh Mobile Polish**: GPU-accelerated micro-animations, skeleton shimmer loaders, and smooth 60/120/144Hz scrolling optimization.

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | **React 19** | Component-based UI library utilizing modern hooks and concurrent features |
| **Language** | **TypeScript** | Strict compile-time type safety across all models, services, and components |
| **Styling** | **Tailwind CSS v4** | Next-generation utility-first styling with modern CSS variables and container queries |
| **Build Tooling** | **Vite 8** | Lightning-fast ESM development server and optimized Rollup production bundling |
| **Icons** | **Lucide React** | Lightweight, consistent SVG icon set |
| **Interactive Maps**| **Leaflet** | Interactive mapping and pinpoint delivery address selection |
| **Animations** | **Framer Motion** | Declarative hardware-accelerated animations and page transitions |
| **Code Quality** | **Oxlint** | High-performance linter ensuring clean, maintainable code standards |

---

## 💡 Technical Highlights

- **Domain-Driven Component Architecture**: Organized into distinct feature modules (`products`, `cart`, `checkout`, `affiliate`, `admin`, `account`, `seo`, `ui`) for maximum maintainability and scalability.
- **Dynamic Route-Level Code Splitting**: Heavy dashboards (`AdminDashboard`, `AffiliateDashboard`, `Checkout`, `Account`) are lazy-loaded via `React.lazy()` and `Suspense`, keeping initial bundle footprint light and load times instantaneous.
- **Interactive Delivery Mapping**: Embedded Leaflet module allowing customers to visually select their shipping delivery location directly on an interactive map with reverse-coordinate resolution.
- **Hands-Free Voice Search**: Built-in speech recognition using the native Web Speech API, allowing customers to search for candle scents and prize reveals hands-free.
- **State & Session Persistence**: LocalStorage sync for cart items, customer credentials, orders, and consultant referral attribution across browser sessions.

---

## 📁 Project Structure

```text
ilovesurprises-platform/
├── public/
│   ├── assets/ilovesurprises/
│   │   ├── banners/          # Desktop, mobile, and mega-menu banners
│   │   ├── categories/       # Category exploration cards
│   │   ├── hero/             # Lifestyle and hero product imagery
│   │   ├── logo/             # SVG and Ultra-HD PNG brand logos
│   │   ├── products/         # Active catalog product photography
│   │   ├── Profile/          # Default user avatar
│   │   └── reviews/          # Customer unboxing reviews assets
│   ├── favicon.ico           # Legacy browser favicon
│   ├── favicon.png           # 32x32 standard favicon
│   ├── favicon.svg           # High-resolution scalable vector favicon
│   ├── logo.png              # 512x512 Open Graph and Apple touch icon
│   ├── robots.txt            # Search engine crawler directives
│   └── sitemap.xml           # XML sitemap for SEO indexing
├── src/
│   ├── components/
│   │   ├── account/          # Customer profile, addresses, order history
│   │   ├── admin/            # Inventory, orders, commissions, analytics
│   │   ├── affiliate/        # Consultant dashboard, links, genealogy tree
│   │   ├── auth/             # Login, registration, role switcher modals
│   │   ├── cart/             # Slide-over shopping bag and shipping tracker
│   │   ├── checkout/         # Multi-step checkout & Leaflet map pin-drop
│   │   ├── home/             # Hero banner, category strip, reviews section
│   │   ├── layout/           # Header, footer, announcement banner
│   │   ├── products/         # Product cards, catalog grid, filtering
│   │   ├── seo/              # Dynamic metadata, OpenGraph, JSON-LD tags
│   │   └── ui/               # Reusable UI primitives (modals, badges, selects)
│   ├── constants/            # Site routes, navigation links, brand configs
│   ├── data/                 # Mock products, categories, coupons, reviews
│   ├── hooks/                # Custom hooks (cart, auth, voice, pathname)
│   ├── pages/                # Top-level route views (Home, Shop, Admin, etc.)
│   ├── services/             # State services, mock APIs, local storage
│   ├── types/                # TypeScript interfaces and data models
│   ├── utils/                # Formatting, currency, calculations
│   ├── App.tsx               # Main application shell and lazy-loaded routes
│   ├── index.css             # Theme tokens, font imports, global utility styles
│   └── main.tsx              # React application root entry point
├── package.json              # Project metadata, scripts, and dependencies
├── tsconfig.json             # TypeScript root configuration
└── vite.config.ts            # Vite bundler plugins and settings
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) (version 9 or higher)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/flowfoundryaienterprise/ilovesurprises-platform.git
   ```

2. **Navigate to the project directory**:
   ```bash
   cd "I Love Surprises"
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local Vite development server with instant Hot Module Replacement (HMR) |
| `npm run build` | Compiles TypeScript types (`tsc -b`) and generates an optimized production bundle in `dist/` |
| `npm run preview` | Spins up a local web server to preview the production build output |
| `npm run lint` | Runs the Oxlint linter across the entire project for code quality and correctness |

---

## 📸 Storefront Experience

Browse luxury jewelry reveal candles, cash surprises, scent profiles, interactive cart bag, and multi-step checkout.

---

## 📱 Responsive Design

The storefront is built mobile-first and tested across all major device tiers:

- **Mobile Displays (320px – 639px)**: Optimized bottom touch bars, collapsible navigation, swipeable drawers, and compact banner cards.
- **Tablets (640px – 1023px)**: Adaptive multi-column product grids and side-by-side modal dialogs.
- **Laptops & Desktops (1024px – 1439px)**: Full interactive hover mega-menus, dual-column sticky product galleries, and expansive admin tables.
- **Ultra-Wide Screens (1440px+)**: Content constrained to a centered maximum container (`max-w-[1460px]`) preserving balanced visual composition.
- **High-Refresh Rate Displays (60Hz / 120Hz / 144Hz)**: Smooth animations powered by GPU-accelerated CSS transforms (`translate3d`, `scale`) for zero frame stuttering.

---

## ⚡ Performance Optimizations

- **Asset Cleanup**: 17.99 MB of unreferenced legacy files purged; all active product photos compressed in modern WebP/JPEG formats.
- **Route-Based Code Splitting**: Non-critical dashboard views are loaded asynchronously on demand.
- **GPU Compositing**: Transitions avoid expensive layout thrashing (`width`, `height`, `margin`) and rely strictly on GPU-friendly `transform` and `opacity`.
- **Skeleton Shimmer UI**: Skeleton placeholders provide immediate visual feedback while content loads.
- **Content Visibility**: CSS `contain-intrinsic-size` utilized on large product grids to optimize rendering throughput.

---

## 🔍 Search Engine Optimization (SEO)

- **Semantic HTML5**: Strict heading hierarchy (`<h1>` through `<h3>`), `<nav>`, `<main>`, `<section>`, and `<footer>` elements.
- **Dynamic SEO Head**: Route-aware page titles, canonical links, and descriptive meta tags.
- **Open Graph & Twitter Cards**: Social preview tags for sharing on Facebook, X (Twitter), and messaging apps.
- **JSON-LD Structured Data**: Embedded Organization, WebSite, and Product schema markup for enhanced search engine indexing.
- **Indexing Directives**: Search-ready `public/robots.txt` and `public/sitemap.xml`.

---

## 🎨 UI / UX Design

- **Color Palette**: Curated luxury DTC aesthetic combining deep burgundy (`#D30915`), soft blush rose (`#fdf5f7`), and warm champagne accents (`#eedde6`).
- **Typography**: Clean modern typography featuring Google Fonts (`Outfit` and `Plus Jakarta Sans`) paired with elegant display styling (`Oleo Script`).
- **Micro-Interactions**: Smooth button elevation, hover zooms, card scale lifts, and animated badge indicators.
- **Accessibility**: High-contrast text ratios, visible keyboard focus indicators, and semantic ARIA labeling.

---

## 🗺️ Routes & Pages

| View | Path | Description |
| :--- | :--- | :--- |
| **Home** | `/` | Hero presentation banner, reveal tiers showcase, featured collections, customer reviews |
| **Shop** | `/shop` | Complete product catalog with faceted category/price/rating filters and sorting |
| **Categories** | `/categories` | Visual category showcase cards and collection highlights |
| **Product Details** | `/product/:slug` | Interactive hover zoom, scent notes, ring size selector, and customer reviews |
| **Checkout** | `/checkout` | Multi-step checkout with Leaflet shipping map pin-drop |
| **Order Confirmation** | `/order-confirmation` | Order summary, items list, delivery estimate, and order tracking ID |
| **Account** | `/account` | Customer profile hub, saved shipping addresses, order history, and loyalty points |
| **Brand Rep Portal** | `/affiliate` | Consultant dashboard, real-time sales metrics, referral links, and commission tracking |
| **Admin Dashboard** | `/admin` | Store administration, inventory tracking, orders, discount coupons, and analytics |
| **Rewards** | `/rewards` | VIP tier perks, points milestone progression, and prize reveal probability rates |
| **Jewelry Appraisal** | `/appraise-your-jewelry` | Unique code lookup to reveal hidden jewelry retail appraised value and specs |
| **About Us** | `/about` | Brand heritage, artisan soy wax craftsmanship, and surprise reveal guarantee |
| **Contact** | `/contact` | Customer support form, FAQ accordion, and direct contact details |

---

## 📄 License

This project is private and proprietary. All rights reserved.
