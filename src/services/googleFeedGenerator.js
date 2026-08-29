import { products as staticProducts } from "../data/products/index.js";

const SITE_URL = "https://www.eall.ae";

/**
 * Escapes XML special characters for valid RSS/XML feeds
 */
const escapeXml = (unsafe = "") => {
  if (typeof unsafe !== "string") return String(unsafe || "");
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

/**
 * Generates official Google Merchant Center XML RSS 2.0 Feed
 * Compatible with Google Shopping, Free Product Listings, and Performance Max campaigns.
 */
export const generateGoogleShoppingXml = (productsList = staticProducts) => {
  const products = productsList && productsList.length > 0 ? productsList : staticProducts;

  const itemsXml = products
    .map((product) => {
      const id = product.sku || product.slug || `EALL_${product.id}`;
      const title = product.name;
      const description =
        product.description ||
        product.shortDescription ||
        `Genuine ${product.name} by ${product.brand} available at E-ALL UAE. Factory sealed with official warranty and fast express UAE delivery.`;

      const link = `${SITE_URL}/products/${product.slug}`;
      const imageLink = product.image?.startsWith("http")
        ? product.image
        : `${SITE_URL}${product.image?.startsWith("/") ? "" : "/"}${product.image || "logo.png"}`;

      const price = Number(product.livePrice ?? product.price ?? 0).toFixed(2);
      const originalPrice = Number(product.originalPrice ?? 0);
      const isSale = originalPrice > Number(price) && Number(price) > 0;

      const availability =
        product.availability === "Out of Stock" || product.stock === 0
          ? "out_of_stock"
          : "in_stock";

      const brand = product.brand || "E-ALL";
      const category = product.categoryName || product.category || "Electronics > Communications > Telephony > Mobile Phones";

      return `    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price} AED</g:price>
      ${isSale ? `<g:sale_price>${price} AED</g:sale_price>` : ""}
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:google_product_category>${escapeXml(category)}</g:google_product_category>
      <g:mpn>${escapeXml(id)}</g:mpn>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>AE</g:country>
        <g:service>Standard Courier</g:service>
        <g:price>0.00 AED</g:price>
      </g:shipping>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>E-ALL UAE - Google Shopping Feed</title>
    <link>${SITE_URL}</link>
    <description>E-ALL official Google Merchant Center Product Feed for Genuine Electronics and Mobile Devices in UAE</description>
${itemsXml}
  </channel>
</rss>`;
};

/**
 * Generates standard Sitemap.xml for Google Search Console
 */
export const generateSitemapXml = (productsList = staticProducts) => {
  const products = productsList && productsList.length > 0 ? productsList : staticProducts;
  const today = new Date().toISOString().split("T")[0];

  const staticPages = [
    { loc: `${SITE_URL}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${SITE_URL}/products`, priority: "0.9", changefreq: "daily" },
    { loc: `${SITE_URL}/brands`, priority: "0.8", changefreq: "weekly" },
    { loc: `${SITE_URL}/solutions`, priority: "0.7", changefreq: "monthly" },
    { loc: `${SITE_URL}/services`, priority: "0.7", changefreq: "monthly" },
    { loc: `${SITE_URL}/about`, priority: "0.6", changefreq: "monthly" },
    { loc: `${SITE_URL}/contact`, priority: "0.8", changefreq: "monthly" },
    { loc: `${SITE_URL}/verify`, priority: "0.7", changefreq: "monthly" },
  ];

  const brandPages = [
    "apple",
    "samsung",
    "hmd",
    "nokia",
  ].map((slug) => ({
    loc: `${SITE_URL}/brands/${slug}`,
    priority: "0.8",
    changefreq: "weekly",
  }));

  const productPages = products.map((product) => ({
    loc: `${SITE_URL}/products/${product.slug}`,
    priority: "0.85",
    changefreq: "daily",
  }));

  const allPages = [...staticPages, ...brandPages, ...productPages];

  const urlEntries = allPages
    .map(
      (page) => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
};

/**
 * Triggers a browser download for the Google Shopping XML Feed
 */
export const downloadGoogleShoppingFeed = (productsList) => {
  const xml = generateGoogleShoppingXml(productsList);
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "google-shopping-feed.xml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Triggers a browser download for the Sitemap.xml
 */
export const downloadSitemap = (productsList) => {
  const xml = generateSitemapXml(productsList);
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sitemap.xml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
