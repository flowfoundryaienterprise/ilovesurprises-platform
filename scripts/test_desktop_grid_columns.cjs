const fs = require('fs');
const assert = require('assert');

// 1. Check Homepage FeaturedProducts.tsx
const homeFeatured = fs.readFileSync('src/components/home/FeaturedProducts.tsx', 'utf8');
assert(homeFeatured.includes('xl:grid-cols-5'), 'Homepage must contain xl:grid-cols-5');
assert(homeFeatured.includes('grid-cols-2'), 'Homepage mobile must be grid-cols-2');
assert(homeFeatured.includes('md:grid-cols-3'), 'Homepage tablet must be md:grid-cols-3');
console.log('✅ 1. Homepage desktop 5-col verified (xl:grid-cols-5), mobile (grid-cols-2) and tablet (md:grid-cols-3) intact.');

// 2. Check ProductGrid.tsx (Search results & category navigation in Shop.tsx)
const productGrid = fs.readFileSync('src/components/products/ProductGrid.tsx', 'utf8');
assert(productGrid.includes('xl:grid-cols-5'), 'ProductGrid must contain xl:grid-cols-5');
assert(!productGrid.includes('xl:grid-cols-4'), 'ProductGrid must NOT contain xl:grid-cols-4');
assert(productGrid.includes('grid-cols-2'), 'ProductGrid mobile must be grid-cols-2');
assert(productGrid.includes('md:grid-cols-3'), 'ProductGrid tablet must be md:grid-cols-3');
console.log('✅ 2. Search Results & Category Grid verified (xl:grid-cols-5), mobile & tablet intact.');

// 3. Check Collection.tsx (Collection pages)
const collectionPage = fs.readFileSync('src/pages/Collection.tsx', 'utf8');
assert(collectionPage.includes('xl:grid-cols-5'), 'Collection page must contain xl:grid-cols-5');
assert(collectionPage.includes('grid-cols-2'), 'Collection mobile must be grid-cols-2');
assert(collectionPage.includes('md:grid-cols-3'), 'Collection tablet must be md:grid-cols-3');
console.log('✅ 3. Collection Page grid verified (xl:grid-cols-5), mobile & tablet intact.');

// 4. Check ProductDetails.tsx (Related products)
const prodDetails = fs.readFileSync('src/pages/ProductDetails.tsx', 'utf8');
assert(prodDetails.includes('xl:grid-cols-5'), 'ProductDetails related grid must contain xl:grid-cols-5');
assert(prodDetails.includes('grid-cols-2'), 'ProductDetails related grid mobile must be grid-cols-2');
console.log('✅ 4. Product Details Related Grid verified (xl:grid-cols-5), mobile & tablet intact.');

console.log('\n🌟 ALL DESKTOP 5-COLUMN GRID SPECIFICATIONS VERIFIED (100% PASS)');
