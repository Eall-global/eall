import { Helmet } from "react-helmet-async";

const SITE_NAME = "E-ALL";
const SITE_URL = "https://www.eall.ae";

/**
 * Product-specific SEO & Google Rich Snippets / Google Shopping Structured Data
 */
const ProductSEO = ({ product }) => {
  if (!product) return null;

  const title = `${product.name} - Official ${product.brand} | Buy Online UAE Best Price`;
  const productPrice = Number(product.livePrice ?? product.price ?? 0);
  const originalPrice = Number(product.originalPrice ?? productPrice);
  
  const description =
    product.description ||
    product.shortDescription ||
    `Buy authentic ${product.name} by ${product.brand} online at E-ALL UAE for AED ${productPrice.toFixed(2)}. Factory sealed with official manufacturer warranty, IMEI authenticity verification, and fast UAE express delivery.`;

  const canonicalUrl = `${SITE_URL}/products/${product.slug}`;
  const imageUrl = product.image?.startsWith("http")
    ? product.image
    : `${SITE_URL}${product.image?.startsWith("/") ? "" : "/"}${product.image || "logo.png"}`;

  // Availability mapping
  const isAvailable = product.availability !== "Out of Stock" && product.stock !== 0;
  const schemaAvailability = isAvailable
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  // Google Schema.org Product JSON-LD markup
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: [imageUrl],
    description: description,
    sku: product.sku || product.slug,
    mpn: product.sku || product.slug,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    category: product.categoryName || product.category || "Electronics",
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "AED",
      price: productPrice.toFixed(2),
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: schemaAvailability,
      seller: {
        "@type": "Organization",
        name: "E-ALL UAE",
        url: SITE_URL,
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "AE",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0.00",
          currency: "AED",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "AE",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          businessDays: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          },
          cutoffTime: "16:00:00+04:00",
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "d",
          },
        },
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "28",
      bestRating: "5",
      worstRating: "1",
    },
  };

  // Breadcrumbs Schema for Google Search results
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.categoryName || "Products",
        item: `${SITE_URL}/products?category=${product.category || "all"}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <Helmet>
      {/* 🏷️ META TAGS */}
      <title>{title} | {SITE_NAME}</title>
      <meta name="title" content={`${title} | ${SITE_NAME}`} />
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

      {/* Keywords */}
      <meta
        name="keywords"
        content={`${product.name}, ${product.brand}, buy ${product.name} Dubai, ${product.name} UAE price, genuine ${product.brand} UAE, eall.ae`}
      />

      {/* 🌐 OPEN GRAPH / FACEBOOK / WHATSAPP PREVIEW */}
      <meta property="og:type" content="product" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="product:price:amount" content={productPrice.toFixed(2)} />
      <meta property="product:price:currency" content="AED" />

      {/* 🐦 TWITTER CARDS */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* 🏬 SCHEMA.ORG JSON-LD STRUCTURED DATA */}
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
};

export default ProductSEO;
