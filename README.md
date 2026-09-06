# I Love Surprises Platform

A modern direct-to-consumer (DTC) e-commerce storefront for surprise reveal products—featuring cash and fine jewelry reveal candles, bath treats, interactive shopping bag, affiliate representative tools, and administrative management.

## ✨ Features

- **Product Catalog & Discovery**: Browse luxury candles, bath bombs, wax melts, and soaps with scent profile breakdowns, burn times, wax blend details, and reveal tier information.
- **Interactive Shopping Bag**: Slide-over cart drawer with dynamic free shipping progress tracking, promotional discount code application, and real-time item updates.
- **Faceted Search & Voice Search**: Filter by category, price, customer rating, and prize reveal tier, plus hands-free search powered by the Web Speech API.
- **Multistep Checkout**: Complete checkout workflow featuring guest/account checkout options, order summary, and interactive Leaflet map address location picker.
- **Affiliate & Brand Rep Portal**: Dedicated brand representative dashboard with referral code tracking, commission statistics, and personalized shopping banners.
- **Admin Dashboard**: Comprehensive management interface for inventory levels, order processing status, promo codes, and customer reports.
- **Customer Rewards & Accounts**: Account hub for tracking order history, saved addresses, and loyalty rewards points.
- **High-Refresh & Mobile Optimization**: Smooth 60/120/144Hz animation performance, GPU-accelerated transforms, and responsive mobile-first layouts.

## 🛠️ Tech Stack

- **Core**: React 19, TypeScript
- **Styling**: Tailwind CSS v4, Vanilla CSS
- **Icons**: Lucide React
- **Maps**: Leaflet (`leaflet`, `@types/leaflet`)
- **Animation**: Framer Motion
- **Tooling & Build**: Vite 8, Oxlint

## 📁 Project Structure

```text
ilovesurprises-platform/
├── public/              # Static assets, logo, favicon, robots.txt, sitemap.xml
├── src/
│   ├── components/      # UI components organized by domain
│   │   ├── account/     # Customer profile, order history, addresses
│   │   ├── admin/       # Admin management, inventory, orders, analytics
│   │   ├── affiliate/   # Representative dashboard and referral tools
│   │   ├── auth/        # Login, registration, role switcher modal
│   │   ├── cart/        # Slide-over shopping bag and shipping tracker
│   │   ├── checkout/    # Checkout flow and Leaflet map address picker
│   │   ├── home/        # Hero section, product categories, reveal banner
│   │   ├── layout/      # Navbar, footer, announcement banners
│   │   ├── products/    # Product cards, catalog grid, filtering, quick view
│   │   ├── seo/         # Dynamic metadata, OpenGraph, JSON-LD tags
│   │   └── ui/          # Reusable UI primitives (modals, badges, buttons)
│   ├── constants/       # Site constants, routes, navigation configuration
│   ├── data/            # Mock products, categories, coupons, reviews
│   ├── hooks/           # Custom React hooks (cart, auth, viewport, voice)
│   ├── pages/           # Top-level page views (Home, Shop, Checkout, Admin, etc.)
│   ├── services/        # State management, local storage, mock service layer
│   ├── types/           # TypeScript interfaces and data models
│   ├── utils/           # Helper functions, formatters, calculations
│   ├── App.tsx          # Application shell, router, and context providers
│   ├── index.css        # Design tokens, theme variables, and global CSS
│   └── main.tsx         # React root entry point
├── package.json         # Project metadata, scripts, and dependencies
├── tsconfig.json        # TypeScript compiler configuration
└── vite.config.ts       # Vite build configuration
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/flowfoundryaienterprise/ilovesurprises-platform.git
   cd "I Love Surprises"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## 🌐 Live Demo

The production application is live at:
[https://ilovesurprises.com](https://ilovesurprises.com)

## 📦 Build

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

To run the linter:

```bash
npm run lint
```

## 👨‍💻 Author

- **Janarthanan** — [FlowFoundry AI Enterprise](https://github.com/flowfoundryaienterprise)

## 📄 License

This project is private and proprietary. All rights reserved.
