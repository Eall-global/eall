export const brands = [
  {
    id: 1,
    slug: "apple",
    name: "Apple",
    tagline: "Think Different.",
    logo: "/brands/Apple.png",
    banners: ["/products/apple/apple-banner.png"],

    country: "United States",
    founded: "1976",

    description:
      "Apple is a global leader in premium smartphones, tablets, wearables, and accessories, recognized for innovation, quality, and seamless ecosystem integration.",
    partnership: {
      type: "Authorized Dealer",
      region: "United Arab Emirates",
      verified: true,
    },
    themeColor: "#0071E3",

    categories: [
      {
        name: "Smartphones",
        slug: "smartphones",
        type: "subcategory",
      },
      {
        name: "Tablets",
        slug: "tablets",
        type: "subcategory",
      },
      {
        name: "Wearables",
        slug: "wearables",
        type: "subcategory",
      },
      {
        name: "Audio",
        slug: "audio",
        type: "subcategory",
      },
      {
        name: "Accessories",
        slug: "accessories",
        type: "subcategory",
      },
    ],

    stats: {
      products: 42,
      warranty: "Official",
      availability: "In Stock",
    },
  },

  {
    id: 2,
    slug: "samsung",
    name: "Samsung",
    tagline: "Inspiring the World, Creating the Future",
    logo: "/brands/Samsung.png",
    banners: ["/products/samsung/samsung-banner.jpg"],
    country: "South Korea",
    founded: "1938",
    description:
      "Samsung is one of the world's largest technology companies, offering smartphones, consumer electronics, displays, home appliances, and enterprise solutions.",
    partnership: {
      type: "Authorized Dealer",
      region: "United Arab Emirates",
      verified: true,
    },
    themeColor: "#1428A0",
    categories: [
      {
        name: "Smartphones",
        slug: "smartphones",
        type: "subcategory",
      },
      {
        name: "Tablets",
        slug: "tablets",
        type: "subcategory",
      },
      {
        name: "Wearables",
        slug: "wearables",
        type: "subcategory",
      },
      {
        name: "Audio",
        slug: "audio",
        type: "subcategory",
      },
      {
        name: "TV & Displays",
        slug: "tv-displays",
        type: "subcategory",
      },
      {
        name: "Accessories",
        slug: "accessories",
        type: "subcategory",
      },
    ],
    stats: {
      products: 65,
      warranty: "Official",
      availability: "In Stock",
    },
  },
  {
    id: 7,
    slug: "hmd",
    name: "HMD",
    tagline: "Human Mobile Devices",
    logo: "/brands/hmd.png",
    banners: ["/products/hmd/homepage.avif", "/banner/nigerian-banner-4.png"],
    country: "Finland",
    founded: "2016",
    description:
      "Human Mobile Devices (HMD) designs smartphones and feature phones with a focus on durability, security, sustainability, and enterprise reliability.",
    partnership: {
      type: "Authorized Distributor",
      region: "Middle East",
      verified: true,
    },
    themeColor: "#0066CC",
    categories: [
      {
        name: "Smartphones",
        slug: "smartphones",
        type: "subcategory",
      },
      {
        name: "Feature Phones",
        slug: "feature-phones",
        type: "subcategory",
      },
      {
        name: "Tablets",
        slug: "tablets",
        type: "subcategory",
      },
      {
        name: "Smart Watches",
        slug: "smart-watches",
        type: "subcategory",
      },
      {
        name: "Accessories",
        slug: "accessories",
        type: "subcategory",
      },
      {
        name: "True Wireless Earbuds",
        slug: "true-wireless-earbuds",
        type: "family",
      },
    ],

    videos: [
      {
        id: 1,
        title: "HMD DUB P50",
        thumbnail:
          "/GALLERY/HMD ACCESSORIES GALLERY/DUB/DUB P50/Black/HMD_Dub_P50-Black-Buds.avif",
        video: "/products/hmd/hmd-dub-p50.mp4",
      },
      {
        id: 2,
        title: "HMD WATCH X1",
        thumbnail:
          "/GALLERY/HMD ACCESSORIES GALLERY/WATCH/WATCH X1/Gray Green/HMD_Watch_X1-GreyGreen-Angled.avif",
        video: "/products/hmd/hmd-watch-x1.mp4",
      },
      {
        id: 3,
        title: "HMD DUB P60",
        thumbnail:
          "/GALLERY/HMD ACCESSORIES GALLERY/DUB/DUB P60/Black/HMD_Dub_P60-Black-Buds.avif",
        video: "/products/hmd/hmd-dub-p60.mp4",
      },
      {
        id: 4,
        title: "HMD WATCH P1",
        thumbnail:
          "/GALLERY/HMD ACCESSORIES GALLERY/WATCH/WATCH P1/SILVER/HMD_Watch_P1-Silver-Angled.avif",
        video: "/products/hmd/hmd-watch-p1-16x9.mp4",
      },
      {
        id: 5,
        title: "HMD DUB P70",
        thumbnail:
          "/GALLERY/HMD ACCESSORIES GALLERY/DUB/DUB P70/White/HMD_Dub_P70-White-Buds.avif",
        video: "/products/hmd/hmd-dub-p70.mp4",
      },
    ],

    stats: {
      products: 22,
      warranty: "Official",
      availability: "In Stock",
    },
  },
  {
    id: 3,
    slug: "xiaomi",
    name: "Xiaomi",
    tagline: "Innovation for Everyone",
    logo: "/brands/Xiaomi.png",
    banners: ["/products/xiaomi/xiaomi-banner.jpg"],
    country: "China",
    founded: "2010",
    description:
      "Xiaomi is a leading global consumer electronics and smart device manufacturer, delivering innovative smartphones, AIoT devices, wearables, and smart home products.",
    partnership: {
      type: "Authorized Dealer",
      region: "United Arab Emirates",
      verified: true,
    },
    themeColor: "#FF6900",
    categories: [
      {
        name: "Smartphones",
        slug: "smartphones",
        type: "subcategory",
      },
      {
        name: "Smart Home",
        slug: "smart-home",
        type: "subcategory",
      },
      {
        name: "Wearables",
        slug: "wearables",
        type: "subcategory",
      },
      {
        name: "Audio",
        slug: "audio",
        type: "subcategory",
      },
      {
        name: "Accessories",
        slug: "accessories",
        type: "subcategory",
      },
    ],

    stats: {
      products: 48,
      warranty: "Official",
      availability: "In Stock",
    },
  },

  {
    id: 4,
    slug: "oppo",
    name: "Oppo",
    tagline: "Inspiration Ahead",
    logo: "/brands/Oppo.png",
    banners: ["/brands/oppo-banner.jpg"],
    country: "China",
    founded: "2004",
    description:
      "Oppo specializes in innovative smartphones and smart devices, focusing on premium design, camera technology, and fast charging solutions.",
    partnership: {
      type: "Authorized Dealer",
      region: "United Arab Emirates",
      verified: true,
    },
    themeColor: "#00A53C",
    categories: [
      {
        name: "Smartphones",
        slug: "smartphones",
        type: "subcategory",
      },
      {
        name: "Wearables",
        slug: "wearables",
        type: "subcategory",
      },
      {
        name: "Audio",
        slug: "audio",
        type: "subcategory",
      },
      {
        name: "Accessories",
        slug: "accessories",
        type: "subcategory",
      },
    ],
    stats: {
      products: 34,
      warranty: "Official",
      availability: "In Stock",
    },
  },

  {
    id: 5,
    slug: "realme",
    name: "Realme",
    tagline: "Dare to Leap",
    logo: "/brands/Realme.png",
    banners: ["/brands/realme-banner.jpg"],
    country: "China",
    founded: "2018",
    description:
      "Realme develops stylish smartphones, AIoT devices, and smart accessories designed for young consumers seeking high performance and value.",
    partnership: {
      type: "Authorized Dealer",
      region: "United Arab Emirates",
      verified: true,
    },
    themeColor: "#FFD400",
    categories: [
      {
        name: "Smartphones",
        slug: "smartphones",
        type: "subcategory",
      },
      {
        name: "Wearables",
        slug: "wearables",
        type: "subcategory",
      },
      {
        name: "Audio",
        slug: "audio",
        type: "subcategory",
      },
      {
        name: "Accessories",
        slug: "accessories",
        type: "subcategory",
      },
    ],
    stats: {
      products: 29,
      warranty: "Official",
      availability: "In Stock",
    },
  },

  {
    id: 6,
    slug: "huawei",
    name: "Huawei",
    tagline: "Building a Fully Connected, Intelligent World",
    logo: "/brands/Huawei.png",
    banners: ["/brands/huawei-banner.jpg"],
    country: "China",
    founded: "1987",
    description:
      "Huawei is a global technology company providing smartphones, networking equipment, cloud computing, enterprise infrastructure, and consumer electronics.",
    partnership: {
      type: "Authorized Dealer",
      region: "United Arab Emirates",
      verified: true,
    },
    themeColor: "#C7000B",
    categories: [
      {
        name: "Smartphones",
        slug: "smartphones",
        type: "subcategory",
      },
      {
        name: "Tablets",
        slug: "tablets",
        type: "subcategory",
      },
      {
        name: "Wearables",
        slug: "wearables",
        type: "subcategory",
      },
      {
        name: "Networking",
        slug: "networking",
        type: "subcategory",
      },
      {
        name: "Accessories",
        slug: "accessories",
        type: "subcategory",
      },
    ],
    stats: {
      products: 37,
      warranty: "Official",
      availability: "Limited Stock",
    },
  },

  {
    id: 8,
    slug: "nokia",
    name: "Nokia",
    tagline: "Connecting People",
    logo: "/brands/Nokia.png",
    banners: ["/products/nokia/nokia-banner.jpg"],
    country: "Finland",
    founded: "1865",
    description:
      "Nokia is a renowned technology brand delivering secure smartphones, networking infrastructure, enterprise communications, and feature phones.",
    partnership: {
      type: "Authorized Distributor",
      region: "Middle East",
      verified: true,
    },
    themeColor: "#124191",
    categories: [
      {
        name: "Smartphones",
        slug: "smartphones",
        type: "subcategory",
      },
      {
        name: "Feature Phones",
        slug: "feature-phones",
        type: "subcategory",
      },
      {
        name: "Networking",
        slug: "networking",
        type: "subcategory",
      },
      {
        name: "Accessories",
        slug: "accessories",
        type: "subcategory",
      },
    ],
    stats: {
      products: 26,
      warranty: "Official",
      availability: "In Stock",
    },
  },

  {
    id: 9,
    slug: "motorola",
    name: "Motorola",
    tagline: "Hello Moto",
    logo: "/brands/Motorola.png",
    banners: ["/brands/motorola-banner.jpg"],
    country: "United States",
    founded: "1928",
    description:
      "Motorola offers innovative Android smartphones, enterprise mobility solutions, communication devices, and accessories trusted worldwide.",
    partnership: {
      type: "Authorized Dealer",
      region: "United Arab Emirates",
      verified: true,
    },
    themeColor: "#5C2D91",
    categories: [
      {
        name: "Smartphones",
        slug: "smartphones",
        type: "subcategory",
      },
      {
        name: "Wearables",
        slug: "wearables",
        type: "subcategory",
      },
      {
        name: "Accessories",
        slug: "accessories",
        type: "subcategory",
      },
    ],
    stats: {
      products: 31,
      warranty: "Official",
      availability: "In Stock",
    },
  },

  {
    id: 10,
    slug: "jbl",
    name: "JBL",
    tagline: "Dare to Listen",
    logo: "/brands/JBL.png",
    banners: ["/brands/jbl-banner.jpg"],
    country: "United States",
    founded: "1946",
    description:
      "JBL is a world-leading audio brand offering premium wireless speakers, headphones, professional sound systems, and portable entertainment solutions.",
    partnership: {
      type: "Authorized Dealer",
      region: "United Arab Emirates",
      verified: true,
    },
    themeColor: "#FF6600",
    categories: [
      {
        name: "Portable Speakers",
        slug: "portable-speakers",
        type: "family",
      },
      {
        name: "Home Speakers",
        slug: "home-speakers",
        type: "family",
      },
      {
        name: "Headphones",
        slug: "headphones",
        type: "family",
      },
      {
        name: "Soundbars",
        slug: "soundbars",
        type: "family",
      },
    ],
    stats: {
      products: 44,
      warranty: "Official",
      availability: "In Stock",
    },
  },

  {
    id: 11,
    slug: "cisco",
    name: "Cisco",
    tagline: "The Bridge to Possible",
    logo: "/brands/Cisco.png",
    banners: ["/brands/cisco-banner.jpg"],
    country: "United States",
    founded: "1984",
    description:
      "Cisco is a global leader in enterprise networking, cybersecurity, collaboration, cloud infrastructure, and IT solutions for businesses worldwide.",
    partnership: {
      type: "Authorized Dealer",
      region: "United Arab Emirates",
      verified: true,
    },
    themeColor: "#049FD9",
    categories: [
      {
        name: "Enterprise",
        slug: "enterprise",
        type: "subcategory",
      },
      {
        name: "Security",
        slug: "security",
        type: "subcategory",
      },
      {
        name: "Collaboration",
        slug: "collaboration",
        type: "subcategory",
      },
      {
        name: "Networking",
        slug: "networking",
        type: "subcategory",
      },
      {
        name: "Accessories",
        slug: "accessories",
        type: "subcategory",
      },
    ],
    stats: {
      products: 58,
      warranty: "Official",
      availability: "Available on Request",
    },
  },

  {
    id: 12,
    slug: "belkin",
    name: "Belkin",
    tagline: "Connected Things",
    logo: "/brands/Belkin.png",
    banners: ["/products/belkin/belkin-banner.jpg"],
    country: "United States",
    founded: "1983",
    description:
      "Belkin manufactures premium charging solutions, mobile accessories, connectivity products, networking devices, and smart home accessories.",
    partnership: {
      type: "Authorized Dealer",
      region: "United Arab Emirates",
      verified: true,
    },
    themeColor: "#0099CC",
    categories: [
      {
        name: "Chargers",
        slug: "chargers",
        type: "subcategory",
      },
      {
        name: "Cables",
        slug: "cables",
        type: "subcategory",
      },
      {
        name: "Power Banks",
        slug: "power-banks",
        type: "subcategory",
      },
      {
        name: "Connectivity",
        slug: "connectivity",
        type: "subcategory",
      },
      {
        name: "Accessories",
        slug: "accessories",
        type: "subcategory",
      },
    ],
    stats: {
      products: 53,
      warranty: "Official",
      availability: "In Stock",
    },
  },
];
