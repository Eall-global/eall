/**
 * E-ALL Customer Management Service (Admin Only)
 * Fetches all registered customer profiles, address histories, and total spend analytics
 */
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  getDocs,
  query,
  orderBy,
} from "../lib/firebaseClient";

const CUSTOMERS_CACHE_KEY = "eall_admin_customers_cache";

export const fetchCustomersList = async () => {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, "customers"));
      const customers = [];
      snap.forEach((d) => {
        customers.push({ id: d.id, ...d.data() });
      });

      // Fetch all customer orders to calculate real-time lifetime value (LTV)
      const ordersSnap = await getDocs(collection(db, "customer_orders"));
      const ordersByCustomer = {};
      ordersSnap.forEach((d) => {
        const o = d.data();
        const cId = o.customerId || o.customerEmail || o.email;
        if (cId) {
          if (!ordersByCustomer[cId]) ordersByCustomer[cId] = [];
          ordersByCustomer[cId].push(o);
        }
      });

      // Merge order stats
      const enriched = customers.map((c) => {
        const custOrders = ordersByCustomer[c.id] || ordersByCustomer[c.uid] || ordersByCustomer[c.email] || [];
        const totalSpent = custOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        return {
          ...c,
          ordersCount: custOrders.length,
          totalSpent,
          orders: custOrders,
        };
      });

      enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      localStorage.setItem(CUSTOMERS_CACHE_KEY, JSON.stringify(enriched));
      return enriched;
    } catch (e) {
      console.warn("Could not fetch customers from Firestore:", e);
    }
  }

  try {
    const cached = localStorage.getItem(CUSTOMERS_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // fallback
  }

  // Demo fallback seed for testing
  return [
    {
      id: "cust_demo_1",
      fullName: "Mohammed yafe",
      email: "myrs888000@gmail.com",
      phone: "+971568172539",
      country: "United Arab Emirates",
      city: "Dubai",
      shippingAddress: "Al khaleej street Naif 2 opposite to Hyatt Regency Gold Souq Deira",
      addresses: [
        {
          id: "addr_1",
          label: "Home",
          fullName: "Mohammed yafe",
          phone: "+971568172539",
          country: "United Arab Emirates",
          city: "Dubai",
          streetAddress: "Al khaleej street Naif 2 opposite to Hyatt Regency Gold Souq Deira",
          isDefault: true,
        },
      ],
      ordersCount: 1,
      totalSpent: 636,
      createdAt: new Date().toISOString(),
    },
  ];
};
