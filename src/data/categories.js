import { BsShieldCheck } from "react-icons/bs";
import { FaWifi } from "react-icons/fa";
import {
  FiHardDrive,
  FiHeadphones,
  FiMonitor,
  FiSmartphone,
} from "react-icons/fi";

const categories = [
  {
    id: 1,
    name: "Mobile Devices",
    slug: "mobile-devices",
    icon: FiSmartphone,

    description:
      "Smartphones, feature phones and tablets from leading global brands.",

    subCategories: [
      {
        name: "Smartphones",
        slug: "smartphones",
        families: [
          {
            name: "Flagship Smartphones",
            slug: "flagship-smartphones",
          },
          {
            name: "Mid-range Smartphones",
            slug: "mid-range-smartphones",
          },
          {
            name: "Entry-level Smartphones",
            slug: "entry-level-smartphones",
          },
          {
            name: "Foldable Smartphones",
            slug: "foldable-smartphones",
          },
          {
            name: "Gaming Smartphones",
            slug: "gaming-smartphones",
          },
          {
            name: "Rugged Smartphones",
            slug: "rugged-smartphones",
          },
        ],
      },

      {
        name: "Feature Phones",
        slug: "feature-phones",
        families: [
          {
            name: "Classic Phones",
            slug: "classic-phones",
          },
          {
            name: "4G Feature Phones",
            slug: "4g-feature-phones",
          },
          {
            name: "Senior Phones",
            slug: "senior-phones",
          },
        ],
      },

      {
        name: "Tablets",
        slug: "tablets",
        families: [
          {
            name: "Android Tablets",
            slug: "android-tablets",
          },
          {
            name: "iPad",
            slug: "ipad",
          },
          {
            name: "Windows Tablets",
            slug: "windows-tablets",
          },
          {
            name: "Kids Tablets",
            slug: "kids-tablets",
          },
          {
            name: "Rugged Tablets",
            slug: "rugged-tablets",
          },
        ],
      },
    ],
  },

  {
    id: 2,
    name: "Consumer Electronics",
    slug: "consumer-electronics",
    icon: FiHeadphones,

    description: "Audio, wearables and smart home products.",

    subCategories: [
      {
        name: "Audio",
        slug: "audio",

        families: [
          {
            name: "Earbuds",
            slug: "earbuds",
          },
          {
            name: "True Wireless Earbuds",
            slug: "true-wireless-earbuds",
          },
          {
            name: "Headphones",
            slug: "headphones",
          },
          {
            name: "Neckbands",
            slug: "neckbands",
          },
          {
            name: "Portable Speakers",
            slug: "portable-speakers",
          },
          {
            name: "Home Speakers",
            slug: "home-speakers",
          },
          {
            name: "Soundbars",
            slug: "soundbars",
          },
          {
            name: "Microphones",
            slug: "microphones",
          },
        ],
      },

      {
        name: "Wearables",
        slug: "wearables",

        families: [
          {
            name: "Smart Watches",
            slug: "smart-watches",
          },
          {
            name: "Fitness Bands",
            slug: "fitness-bands",
          },
          {
            name: "Smart Rings",
            slug: "smart-rings",
          },
          {
            name: "VR Headsets",
            slug: "vr-headsets",
          },
        ],
      },

      {
        name: "Smart Home",
        slug: "smart-home",

        families: [
          {
            name: "Smart Cameras",
            slug: "smart-cameras",
          },
          {
            name: "Smart Lighting",
            slug: "smart-lighting",
          },
          {
            name: "Smart Sensors",
            slug: "smart-sensors",
          },
          {
            name: "Smart Plugs",
            slug: "smart-plugs",
          },
          {
            name: "Smart Doorbells",
            slug: "smart-doorbells",
          },
        ],
      },
    ],
  },

  {
    id: 3,
    name: "IT & Enterprise",
    slug: "it-enterprise",
    icon: FiHardDrive,

    description: "Networking, servers and enterprise infrastructure.",

    subCategories: [
      {
        name: "Networking",
        slug: "networking",

        families: [
          {
            name: "Routers",
            slug: "routers",
          },
          {
            name: "Switches",
            slug: "switches",
          },
          {
            name: "Access Points",
            slug: "access-points",
          },
          {
            name: "Firewalls",
            slug: "firewalls",
          },
          {
            name: "Network Controllers",
            slug: "network-controllers",
          },
        ],
      },

      {
        name: "Servers",
        slug: "servers",

        families: [
          {
            name: "Rack Servers",
            slug: "rack-servers",
          },
          {
            name: "Tower Servers",
            slug: "tower-servers",
          },
          {
            name: "Blade Servers",
            slug: "blade-servers",
          },
        ],
      },

      {
        name: "Storage",
        slug: "storage",

        families: [
          {
            name: "NAS",
            slug: "nas",
          },
          {
            name: "SAN",
            slug: "san",
          },
          {
            name: "External Storage",
            slug: "external-storage",
          },
          {
            name: "Enterprise SSD",
            slug: "enterprise-ssd",
          },
        ],
      },
    ],
  },

  {
    id: 4,
    name: "Display & Visual",
    slug: "display-visual",
    icon: FiMonitor,

    description: "Professional displays and visual solutions.",

    subCategories: [
      {
        name: "Monitors",
        slug: "monitors",

        families: [
          {
            name: "Business Monitors",
            slug: "business-monitors",
          },
          {
            name: "Gaming Monitors",
            slug: "gaming-monitors",
          },
          {
            name: "Professional Monitors",
            slug: "professional-monitors",
          },
          {
            name: "Portable Monitors",
            slug: "portable-monitors",
          },
        ],
      },

      {
        name: "TVs",
        slug: "tvs",

        families: [
          {
            name: "LED TVs",
            slug: "led-tvs",
          },
          {
            name: "OLED TVs",
            slug: "oled-tvs",
          },
          {
            name: "QLED TVs",
            slug: "qled-tvs",
          },
          {
            name: "Commercial TVs",
            slug: "commercial-tvs",
          },
        ],
      },

      {
        name: "Digital Signage",
        slug: "digital-signage",

        families: [
          {
            name: "Indoor Signage",
            slug: "indoor-signage",
          },
          {
            name: "Outdoor Signage",
            slug: "outdoor-signage",
          },
          {
            name: "Interactive Displays",
            slug: "interactive-displays",
          },
        ],
      },
    ],
  },

  {
    id: 5,
    name: "Connectivity",
    slug: "connectivity",
    icon: FaWifi,

    description: "Power, charging and mobile accessories.",

    subCategories: [
      {
        name: "Chargers",
        slug: "chargers",

        families: [
          {
            name: "Wall Chargers",
            slug: "wall-chargers",
          },
          {
            name: "Wireless Chargers",
            slug: "wireless-chargers",
          },
          {
            name: "Car Chargers",
            slug: "car-chargers",
          },
          {
            name: "GaN Chargers",
            slug: "gan-chargers",
          },
        ],
      },

      {
        name: "Power Banks",
        slug: "power-banks",

        families: [
          {
            name: "10000mAh",
            slug: "10000mah",
          },
          {
            name: "20000mAh",
            slug: "20000mah",
          },
          {
            name: "MagSafe Power Banks",
            slug: "magsafe-power-banks",
          },
        ],
      },

      {
        name: "Cables",
        slug: "cables",

        families: [
          {
            name: "USB-C",
            slug: "usb-c",
          },
          {
            name: "Lightning",
            slug: "lightning",
          },
          {
            name: "Micro USB",
            slug: "micro-usb",
          },
          {
            name: "HDMI",
            slug: "hdmi",
          },
          {
            name: "DisplayPort",
            slug: "displayport",
          },
        ],
      },
    ],
  },

  {
    id: 6,
    name: "Security & Protection",
    slug: "security-protection",
    icon: BsShieldCheck,

    description: "Enterprise surveillance and security solutions.",

    subCategories: [
      {
        name: "CCTV",
        slug: "cctv",

        families: [
          {
            name: "IP Cameras",
            slug: "ip-cameras",
          },
          {
            name: "Dome Cameras",
            slug: "dome-cameras",
          },
          {
            name: "Bullet Cameras",
            slug: "bullet-cameras",
          },
          {
            name: "NVR",
            slug: "nvr",
          },
          {
            name: "DVR",
            slug: "dvr",
          },
        ],
      },

      {
        name: "Access Control",
        slug: "access-control",

        families: [
          {
            name: "Biometric Devices",
            slug: "biometric-devices",
          },
          {
            name: "RFID Readers",
            slug: "rfid-readers",
          },
          {
            name: "Door Controllers",
            slug: "door-controllers",
          },
          {
            name: "Time Attendance",
            slug: "time-attendance",
          },
        ],
      },
    ],
  },
];

export default categories;
