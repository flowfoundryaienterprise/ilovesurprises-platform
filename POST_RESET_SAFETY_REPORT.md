# POST-RESET SAFETY REPORT
**Target Project:** `https://grwhdtvorhdvyvcxwomn.supabase.co` (`grwhdtvorhdvyvcxwomn`)  
**Reset Execution Timestamp:** 2026-09-12T14:49:12.022Z  
**Staging Tables Reset Verdict:** ✅ PASS — ALL 11 STAGING TABLES ZEROED  
**Protected Data Safety Verdict:** ✅ PASS — ZERO PROTECTED DATA TOUCHED  

---

## 1. Safety & Project Verification
- **Target Supabase URL:** `https://grwhdtvorhdvyvcxwomn.supabase.co` (`grwhdtvorhdvyvcxwomn`) -> **VERIFIED TARGET**
- **Forbidden Old Project:** `wlycsdhrhfbbjqhjjkwz` -> **VERIFIED UNTOUCHED**
- **Production Catalog:** `products`, `collections` -> **VERIFIED UNTOUCHED (Zero production writes)**
- **Customer / Auth Data:** `auth.users`, `profiles`, `orders`, `commissions` -> **VERIFIED UNTOUCHED (100% Protected)**

---

## 2. Staging Tables Pre-Reset vs. Post-Reset Counts

| Staging Table Name | Pre-Reset Count | Post-Reset Count | Status |
| :--- | :--- | :--- | :--- |
| `staging_collection_publications` | 0 | **0** | ✅ CLEAN (0 rows) |
| `staging_collection_conditions` | 0 | **0** | ✅ CLEAN (0 rows) |
| `staging_collection_metafields` | 0 | **0** | ✅ CLEAN (0 rows) |
| `staging_product_metafields` | 0 | **0** | ✅ CLEAN (0 rows) |
| `staging_product_collections` | 0 | **0** | ✅ CLEAN (0 rows) |
| `staging_product_images` | 0 | **0** | ✅ CLEAN (0 rows) |
| `staging_product_option_values` | 699999 | **0** | ✅ CLEAN (0 rows) |
| `staging_product_options` | 47788 | **0** | ✅ CLEAN (0 rows) |
| `staging_product_variants` | -1 | **0** | ✅ CLEAN (0 rows) |
| `staging_collections` | 460 | **0** | ✅ CLEAN (0 rows) |
| `staging_products` | 57479 | **0** | ✅ CLEAN (0 rows) |

---

## 3. Protected Tables Audit

| Protected Entity | Pre-Reset Status | Post-Reset Status | Impact |
| :--- | :--- | :--- | :--- |
| `auth.users` | 0 users | 0 users | ✅ ZERO IMPACT |
| `profiles` | Table uncreated | Table uncreated | ✅ ZERO IMPACT |
| `orders` | Table uncreated | Table uncreated | ✅ ZERO IMPACT |
| `order_items` | Table uncreated | Table uncreated | ✅ ZERO IMPACT |
| `commissions` | Table uncreated | Table uncreated | ✅ ZERO IMPACT |
| `reviews` | Table uncreated | Table uncreated | ✅ ZERO IMPACT |
| `representatives` | Table uncreated | Table uncreated | ✅ ZERO IMPACT |
| Production `products` | Table uncreated | Table uncreated | ✅ ZERO IMPACT |
| Production `collections` | Table uncreated | Table uncreated | ✅ ZERO IMPACT |

---

## 4. Reclaimed Disk Capacity
- **Estimated Reclaimed Storage:** **~600 MB**
- **Staging Schema State:** Pristine (0 rows across all staging tables)
- **Ready for Phase 5 Schema Alignment & Authoritative Load:** **YES**
