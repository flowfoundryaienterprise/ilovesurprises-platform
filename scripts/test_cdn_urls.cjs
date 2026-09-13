const https = require('https');

const urls = [
  'https://cdn.shopify.com/s/files/1/0172/4672/products/Whippet.png?v=1571263554',
  'https://cdn.shopify.com/s/files/1/0172/4672/products/BahamaMama_edc7e3ed-1ecc-4f0d-ad9e-a08842f8bf90.png?v=1571262643',
  'https://cdn.shopify.com/s/files/1/0172/4672/products/BedtimeSpa_8cd20f75-895e-4f1f-a3bb-7170890ccb1c.png?v=1571262644',
  'https://cdn.shopify.com/s/files/1/0172/4672/products/ChocoCC_639812dc-35a6-40ac-9da8-d6b8ef9c2460.png?v=1571262645',
  'https://cdn.shopify.com/s/files/1/0172/4672/products/AmazonRainforest_993d50d7-40e1-4138-947f-05619541b921.png?v=1571262643',
  'https://cdn.shopify.com/s/files/1/0172/4672/products/bLACKrasVan_1787a53a-e698-4f42-a9b6-b161ccb5f365.png?v=1571262644',
  'https://cdn.shopify.com/s/files/1/0172/4672/products/BakedAP.png?v=1601558697'
];

urls.forEach(u => {
  https.get(u, res => {
    console.log(u.split('/products/')[1].split('?')[0], '=> STATUS:', res.statusCode);
  }).on('error', e => {
    console.log(u, '=> ERROR:', e.message);
  });
});
