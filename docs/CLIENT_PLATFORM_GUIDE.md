# I Love Surprises™ — Client Platform Guide

Welcome to the official administration, affiliate, customer, and testing reference guide for the **I Love Surprises** luxury DTC ecommerce platform.

---

## A. Admin Access & Management

### 1. Admin Login URL
- **Path:** `/admin` or via the storefront by clicking the administrative badge in the customer account menu.
- **Direct Tab Links:**
  - Overview: `/admin?tab=overview`
  - Commerce & Catalog: `/admin?tab=commerce`
  - Representatives & MLM: `/admin?tab=representatives`
  - Memberships & Subscriptions: `/admin?tab=memberships`
  - Commissions & Payouts: `/admin?tab=commissions`
  - Jewelry Appraisals & Certificates: `/admin?tab=appraisals`
  - Sales & Traffic Reports: `/admin?tab=reports`
  - System Settings & Gateways: `/admin?tab=settings`
  - Role Permissions: `/admin?tab=permissions`

### 2. Admin Roles & Access Hierarchy
- **Super Administrator (Full Access):** Complete unrestricted control across commerce, representatives, payout approvals, settings, and database configurations.
- **Store Manager (Commerce & Ops):** Manages product catalog, inventory levels, order refunds, promotional discount codes, and sales analytics.
- **Affiliate & Rep Director (Downline & Comms):** Oversees consultant onboarding, applications, downline genealogy, and commission approval ledgers.
- **Customer Support Lead (Read & Assist):** Dedicated read-and-assist role with access to customer registries, representative lookup, and refund processing.

### 3. Key Administrative Functions
- **Product Management (`/admin?tab=commerce` -> Products & Inventory):**
  - **Add Product:** Create new catalog entries with real-time Supabase persistence. Specify name, category, price, compare-at price, surprise type (Cash, Jewelry, Mystery, Bath), surprise value, stock quantity, and imagery.
  - **Edit Product:** Update live pricing, categories, variant details, or stock levels.
  - **Publish / Unpublish:** Toggle products between *Active (Published)* and *Draft (Unpublished)*.
  - **Delete Product:** Remove discontinued products from catalog.
- **Collection Management (`/admin?tab=commerce` -> Collections):**
  - **Create Collection:** Set name, URL slug, description tagline, and cover photo.
  - **Edit Collection:** Modify titles, imagery, and metadata.
  - **Homepage Featured Status:** Toggle whether a collection is featured in the main homepage showcase.
- **Order & Refund Auditing (`/admin?tab=commerce` -> Refunds & Returns):**
  - Search orders, view transaction details, issue full or partial refunds, and record restocking inventory status.
- **Customer Directory (`/admin?tab=commerce` -> Customers):**
  - View registered customers, total lifetime spend, order counts, and permanent representative attribution tags.
- **Affiliate / Representative Roster (`/admin?tab=representatives`):**
  - Approve or suspend representatives, view sponsor uplines, personal sales volume, downline team volume, and total payout histories.
- **Commission Ledger & Payouts (`/admin?tab=commissions`):**
  - Review 5-level commission distributions per order, approve pending earnings, and batch-disburse approved commission balances.
- **Jewelry Appraisal Registry (`/admin?tab=appraisals`):**
  - Manage unique verification codes (e.g., `ILS-GOLD-550`, `ILS-DIAMOND-7500`), serial numbers, certified retail values, gemstone grades, and inspection dates.

---

## B. Affiliate & Representative Access

### 1. Representative Registration & Login
- **Portal URL:** `/affiliate`
- **Registration Flow:** Prospective consultants choose a unique representative username, set up their display storefront name, and enroll with an active consultant plan (Monthly Active, 6-Month, or 12-Month VIP).

### 2. Referral Tracking & Storefront URLs
- **Unique Referral Format:** `https://ilovesurprises.com/rep/{username}` or `?ref={username}`
- **Attribution Logic:**
  - Visitors arriving through a representative's link have their session attributed via local storage and cookie tracking.
  - The storefront displays the consultant's verified profile badge (e.g., *"Shopping with Consultant Emily Watson"*).
- **Permanent / Lifetime Attribution:**
  - When an order is placed, the customer profile is permanently linked to the referring representative in Supabase.
  - Subsequent purchases by that customer automatically credit the original representative, even if the customer navigates directly or clicks a different marketing link later.

### 3. 5-Level Compensation Plan
Commissions are calculated server-side based on the eligible product subtotal:
- **Direct Selling Representative:** **20%**
- **Level 1 Upline Sponsor:** **5%**
- **Level 2 Upline Sponsor:** **4%**
- **Level 3 Upline Sponsor:** **3%**
- **Level 4 Upline Sponsor:** **2%**
- **Level 5 Upline Sponsor:** **1%**
- **Maximum Total Team Distribution:** **35%**

### 4. Representative Dashboard Features
- **Earnings Summary:** Real-time metrics for total earnings, pending commissions, approved payouts, and lifetime sales volume.
- **Downline Tree:** Interactive genealogy visualizer showing direct recruits (Level 1) through Level 5 team members.
- **Customer List:** Roster of permanently attributed customers with order frequencies.
- **Marketing Kit:** Downloadable high-resolution banners, social media assets, and pre-formatted referral copy.

---

## C. Customer Shopping Experience

### 1. Account Creation & Authentication
- **Sign Up / Login:** Accessible via the user icon in the main navigation bar.
- **Email Verification & Password Reset:** Built-in email reset workflows via Supabase Auth.
- **Social Login:** Google OAuth integration supported via Supabase Identity Provider.

### 2. Browse & Shop
- **Homepage:** Features the Hero Showcase, the 6 authentic categories in *Shop by Surprise*, the *Featured Collections* showcase (Cash Candles, Trending Collection, Jewelry Candles), and verified customer unboxing reviews.
- **Shop Catalog (`/shop`):**
  - Multi-faceted filtering by Category, Prize Reveal Type (Cash vs Jewelry), Price range, and Minimum Customer Rating.
  - Sorting by Featured, Best Sellers, Price (Low to High / High to Low), and Highest Rated.
- **Product Details (`/product/{slug}`):**
  - High-resolution photography, aroma scent notes, surprise value range, variant selectors (Ring Sizes 5–10, Jewelry Reveal Types: Ring, Necklace, Earrings, Bracelet), and direct link to the Jewelry Appraisal verification tool.

### 3. Cart & Checkout
- **Slide-Over Bag:** Real-time quantity adjustments, free shipping progress bar ($50 threshold), and coupon validation.
- **Secure SSL Checkout (`/checkout`):**
  - Requires customer authentication to safeguard order history and commission attribution.
  - Address auto-completion, shipping rate calculation, tax computation, and order confirmation summary.

---

## D. Step-by-Step Quality Testing Guide

### 1. Testing Catalog & Products
1. Visit `/shop` and select **Cash Candles**.
2. Verify only authentic cash reveal candles are displayed (10,986 live products in database).
3. Switch filter to **Jewelry Candles**. Verify products display ring size selectors and jewelry reveal types.
4. Click any product to open the product details view and verify images, prices, and scent notes render cleanly.

### 2. Testing Customer Signup & Authentication
1. Click the User icon in the top header.
2. Select **Sign Up**, enter a valid email and password, and submit.
3. Verify session creates successfully and user name appears in the top navigation.
4. Test **Sign Out** to ensure local session state clears cleanly.

### 3. Testing Representative Registration & Referral Tracking
1. Open an incognito/private browser window.
2. Navigate to `/affiliate`.
3. Complete representative registration with username `test_consultant_1`.
4. Copy the referral link (`http://localhost:5174/rep/test_consultant_1`).
5. Open the referral link in a new tab. Verify the announcement ribbon shows: *"Shopping with Representative: test_consultant_1"*.

### 4. Testing Lifetime Customer Attribution
1. While attributed to `test_consultant_1`, create a new customer account and complete an order.
2. Verify in Supabase (`orders` and `profiles` tables) that `customer_id` has `referred_by_rep: 'test_consultant_1'`.
3. Visit the site again using a different link (e.g., `/rep/other_rep`).
4. Place another order with the same customer account.
5. Verify the order remains attributed to `test_consultant_1` due to permanent lifetime attribution rules.

### 5. Testing 5-Level Commission Calculation
1. Set up a 5-level hierarchy (Rep A -> Rep B -> Rep C -> Rep D -> Rep E -> Direct Rep F).
2. Place an order for $100.00 with Direct Rep F.
3. Verify commission records in Supabase:
   - Direct Rep F: $20.00 (20%)
   - Rep E (Level 1): $5.00 (5%)
   - Rep D (Level 2): $4.00 (4%)
   - Rep C (Level 3): $3.00 (3%)
   - Rep B (Level 4): $2.00 (2%)
   - Rep A (Level 5): $1.00 (1%)
   - Total payout: $35.00 (35% maximum cap verified).

### 6. Testing Jewelry Appraisal & Certificate
1. Click **Appraise Jewelry** in the header ribbon or visit `/appraise-your-jewelry`.
2. Click sample code `ILS-GOLD-550` or type it into the authentication field.
3. Click **Check Value**.
4. Verify the celebration card displays:
   - Appraised Value: **$550.00**
   - Item: **14K Solid Yellow Gold CZ Brilliant Stud Earrings**
   - Inspection Date, Serial Number, and Hallmarks.
5. Click **View Certificate** and confirm the printable certificate modal opens with full gemological specifications.

---

## E. Backend & Supabase Architecture

The platform connects to a high-performance PostgreSQL backend on Supabase. Below is an overview of the core schema tables:

| Table Name | Primary Purpose | Key Fields |
| :--- | :--- | :--- |
| `products` | Master ecommerce catalog | `id`, `name`, `slug`, `category_id`, `price`, `original_price`, `surprise_type`, `surprise_value`, `image`, `in_stock`, `is_best_seller`, `scent_notes` |
| `categories` | Product collections & taxonomy | `id`, `name`, `slug`, `tagline`, `description`, `item_count`, `image`, `featured` |
| `profiles` | Customer & representative users | `id`, `email`, `name`, `role`, `rep_username`, `sponsor_username`, `referred_by_rep`, `created_at` |
| `orders` | Completed customer orders | `id`, `customer_id`, `total_amount`, `subtotal`, `shipping_amount`, `discount_amount`, `status`, `shipping_address`, `referred_by_rep` |
| `order_items` | Individual line items per order | `id`, `order_id`, `product_id`, `quantity`, `price`, `selected_ring_size`, `selected_jewelry_type` |
| `commissions` | MLM & referral earnings ledger | `id`, `order_id`, `representative_id`, `beneficiary_username`, `level`, `percentage`, `commission_amount`, `status` |
| `reviews` | Customer product reviews & ratings | `id`, `product_id`, `author_name`, `rating`, `title`, `comment`, `verified_purchase`, `created_at` |

### Security & Privacy Policy
- **Row-Level Security (RLS):** Enabled across all production tables. Public anonymous clients have read-only access to published products and categories. Customer and commission records are strictly restricted to their respective owners and authenticated administrators.
- **Zero Secrets Policy:** No API secret keys, service-role keys, or database passwords are hardcoded in client-facing bundles or platform documentation. All elevated operations are executed through secure backend services.
