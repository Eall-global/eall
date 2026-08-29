import { Helmet } from "react-helmet-async";

const SITE_NAME = "E-ALL";
const SITE_URL = "https://www.eall.ae";
const DEFAULT_IMAGE = "https://www.eall.ae/logo.png";

/**
 * Enterprise SEO Component for E-ALL Website
 * Injects OpenGraph, Twitter Cards, Canonical URLs, and Schema.org JSON-LD structured data.
 */
const SEO = ({
  title,
  description,
  keywords,
  image = DEFAULT_IMAGE,
  url = SITE_URL,
  type = "website",
  schema = null,
}) => {
  const fullTitle = title
    ? `${title} | ${SITE_NAME} - Premium Electronics & Mobile Devices UAE`
    : `${SITE_NAME} - Genuine Electronics, Smartphones & Accessories in UAE`;

  const metaDescription =
    description ||
    "E-ALL is UAE's leading e-commerce and wholesale distributor for genuine Apple, Samsung, HMD, and Nokia smartphones, feature phones, audio accessories with official warranty and fast express delivery across UAE and Africa.";

  const canonicalUrl = url.startsWith("http") ? url : `${SITE_URL}${url}`;
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`;

  // Default Organization & LocalBusiness JSON-LD
  const defaultOrgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "E-ALL UAE",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: "Official distributor and retailer of genuine mobile phones, electronics, and accessories in the UAE and West Africa.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Naif 2, Deira",
      addressLocality: "Dubai",
      addressRegion: "Dubai",
      addressCountry: "AE",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+971-56-111-0147",
      contactType: "customer service",
      areaServed: ["AE", "SA", "QA", "OM", "KW", "BH", "SN", "CI", "ML"],
      availableLanguage: ["English", "Arabic", "French"],
    },
    sameAs: [
      "https://www.instagram.com/eall.ae",
      "https://www.facebook.com/eall.ae",
    ],
  };

  return (
    <Helmet>
      {/* 🏷️ PRIMARY META TAGS */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

      {/* 🌐 OPEN GRAPH / FACEBOOK / WHATSAPP */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_AE" />

      {/* 🐦 TWITTER CARDS */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />

      {/* 🏢 SCHEMA.ORG JSON-LD STRUCTURED DATA */}
      <script type="application/ld+json">
        {JSON.stringify(schema || defaultOrgSchema)}
      </script>
    </Helmet>
  );
};

export default SEO;
