/**
 * E-ALL Payment Gateway Configuration
 * Supporting Wave Money Transfer (African Markets) & Local Payment Options
 */

export const WAVE_PAYMENT_CONFIG = {
  merchantName: "E-ALL Electronics Senegal & West Africa",
  merchantPhone: "+221 77 890 1234",
  merchantCode: "WAVE-EALL-8899",
  waveQrImage: "/wave-qr.png", // Wave QR code image
  supportedCountries: [
    { code: "SN", name: "Senegal", currency: "XOF", waveFeeRate: "0%" },
    { code: "CI", name: "Côte d'Ivoire", currency: "XOF", waveFeeRate: "0%" },
    { code: "ML", name: "Mali", currency: "XOF", waveFeeRate: "0%" },
    { code: "BF", name: "Burkina Faso", currency: "XOF", waveFeeRate: "0%" },
    { code: "GM", name: "Gambia", currency: "GMD", waveFeeRate: "0%" },
    { code: "UG", name: "Uganda", currency: "UGX", waveFeeRate: "0%" },
    { code: "AE", name: "United Arab Emirates", currency: "AED", waveFeeRate: "0%" },
    { code: "US", name: "United States / International", currency: "USD", waveFeeRate: "0%" },
  ],
  instructions: [
    "Open your Wave App on your mobile phone.",
    "Tap 'Send' or scan our Merchant QR Code below.",
    "Enter the exact Order Total and paste your unique Order Reference Number in the note field.",
    "Copy the 10-digit Wave Transaction ID from your receipt and paste it below to confirm your order instantly.",
  ],
  customerSupportPhone: "+221 33 800 0000",
  whatsappSupport: "+971 56 825 3436",
};

export const PAYMENT_METHODS = [
  {
    id: "wave",
    name: "Wave Money Transfer",
    badge: "Recommended for Africa (0% Deposit Fee)",
    icon: "🌊",
    description: "Instant, free & secure mobile money transfer across West & Sub-Saharan Africa.",
    popular: true,
  },
  {
    id: "cod",
    name: "Cash on Delivery (COD)",
    badge: "Available in Select Regions",
    icon: "💵",
    description: "Pay in cash upon doorstep delivery.",
    popular: false,
  },
  {
    id: "wire",
    name: "Direct Wire / Bank Transfer",
    badge: "International Accounts",
    icon: "🏦",
    description: "Direct bank transfer to E-ALL corporate account.",
    popular: false,
  },
];
