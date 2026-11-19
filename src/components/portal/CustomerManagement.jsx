import { useState, useEffect, useMemo } from "react";
import {
  FiUsers,
  FiSearch,
  FiMapPin,
  FiShoppingBag,
  FiCalendar,
  FiMail,
  FiPhone,
  FiX,
  FiCheckCircle,
  FiRefreshCw,
  FiShield,
  FiArrowRight,
  FiGrid,
  FiList,
} from "react-icons/fi";
import { fetchCustomersList } from "../../services/customerService";
import { AedSymbol, AedPrice } from "../common/AedSymbol";
import PortalKpiGrid from "./PortalKpiGrid";

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomersList();
      setCustomers(data);
    } catch (e) {
      console.error("Could not load customers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase().trim();
    return customers.filter(
      (c) =>
        (c.fullName || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.country || "").toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  const metrics = useMemo(() => {
    const totalCount = customers.length;
    const activeBuyers = customers.filter((c) => (c.ordersCount || 0) > 0).length;
    const totalOrders = customers.reduce((sum, c) => sum + (c.ordersCount || 0), 0);
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    return { totalCount, activeBuyers, totalOrders, totalRevenue };
  }, [customers]);

  return (
    <div className="space-y-4 sm:space-y-5 text-left">
      {/* 📊 SUMMARY CARDS */}
      <PortalKpiGrid
        items={[
          {
            id: "total",
            label: "Total Customers",
            value: metrics.totalCount,
            icon: FiUsers,
            tone: "sky",
          },
          {
            id: "active",
            label: "Active Buyers",
            value: metrics.activeBuyers,
            icon: FiCheckCircle,
            tone: "emerald",
          },
          {
            id: "orders",
            label: "Total Orders",
            value: metrics.totalOrders,
            icon: FiShoppingBag,
            tone: "indigo",
            valueClassName: "text-slate-900 dark:text-white",
          },
          {
            id: "spend",
            label: "Total Spend",
            value: (
              <AedPrice
                amount={metrics.totalRevenue}
                decimals={0}
                className="font-mono font-black text-sky-900 dark:text-sky-300"
              />
            ),
            icon: FiShield,
            tone: "amber",
          },
        ]}
      />

      {/* 🔍 SEARCH & VIEW CONTROLS */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 sm:gap-3 transition-colors">
        <div className="relative flex-1 min-w-0">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base" />
          <input
            type="text"
            placeholder="Search customers by name, email, phone, city, or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Icon-Only View Mode Switcher */}
          <div
            role="group"
            aria-label="View mode"
            className="inline-flex items-center h-10 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700"
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              title="Grid View"
              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FiGrid className="text-[15px]" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              aria-label="Table view"
              aria-pressed={viewMode === "table"}
              title="Table View"
              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FiList className="text-[15px]" />
            </button>
          </div>

          <button
            type="button"
            onClick={loadCustomers}
            disabled={loading}
            aria-label="Refresh customers"
            title="Refresh"
            className="inline-flex items-center justify-center gap-1.5 w-10 h-10 md:w-auto md:px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer shrink-0"
          >
            <FiRefreshCw className={`text-[15px] md:text-sm ${loading ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 🔲 VIEW MODE 1: GRID / CARDS VIEW (RESPONSIVE FOR WEB & MOBILE) */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <FiUsers className="text-4xl mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">No customer accounts found.</p>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const addrCount = Array.isArray(cust.addresses)
                ? cust.addresses.length
                : cust.shippingAddress
                ? 1
                : 0;

              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5 cursor-pointer hover:border-sky-300 dark:hover:border-sky-500/40 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-2xl bg-sky-100 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {(cust.fullName || cust.email || "C").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                            {cust.fullName || "Customer"}
                          </h4>
                          <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                            {cust.country || "United Arab Emirates"}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 px-2.5 py-1 rounded-xl shrink-0">
                        View
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
                      <p className="truncate text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px]">
                        <FiMail className="text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </p>
                      {cust.phone && (
                        <p className="font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
                          <FiPhone className="text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{cust.phone}</span>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/70 rounded-2xl text-center">
                        <span className="text-[9.5px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Addresses</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">{addrCount}/5</span>
                      </div>

                      <div className="p-2 bg-slate-50 dark:bg-slate-800/70 rounded-2xl text-center">
                        <span className="text-[9.5px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Orders</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">{cust.ordersCount || 0}</span>
                      </div>

                      <div className="p-2 bg-slate-50 dark:bg-slate-800/70 rounded-2xl text-center">
                        <span className="text-[9.5px] text-slate-400 dark:text-slate-500 block font-semibold uppercase">Spend</span>
                        <AedPrice amount={cust.totalSpent || 0} decimals={0} className="font-bold text-slate-900 dark:text-white text-[11px] justify-center" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-[10.5px] text-slate-400 dark:text-slate-500 text-right flex items-center justify-end gap-1 font-medium">
                    <span>Manage profile &amp; orders</span>
                    <FiArrowRight className="text-[9px]" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 📄 VIEW MODE 2: TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Addresses</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4 text-right">Lifetime Spend (<AedSymbol />)</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <FiUsers className="text-3xl mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-semibold">No customer accounts found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const addrCount = Array.isArray(cust.addresses)
                      ? cust.addresses.length
                      : cust.shippingAddress
                      ? 1
                      : 0;

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {(cust.fullName || cust.email || "C").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
                                {cust.fullName || "Customer"}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                ID: {cust.id.slice(0, 10)}...
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 truncate max-w-[200px]">
                              <FiMail className="text-slate-400 dark:text-slate-500 text-xs shrink-0" />
                              <span>{cust.email}</span>
                            </p>
                            {cust.phone && (
                              <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                                <FiPhone className="text-slate-400 dark:text-slate-500 text-xs shrink-0" />
                                <span>{cust.phone}</span>
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold mb-0.5">
                            {cust.country || "United Arab Emirates"}
                          </span>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                            {cust.city || "Dubai"}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 text-xs font-bold border border-sky-200/60 dark:border-sky-500/25">
                            <FiMapPin className="text-xs" />
                            <span>{addrCount}/5</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                            {cust.ordersCount || 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <AedPrice
                            amount={cust.totalSpent || 0}
                            className="font-bold text-slate-950 dark:text-white text-sm justify-end"
                          />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(cust)}
                            className="px-3 py-1.5 bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 dark:hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 font-bold rounded-xl text-xs transition cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🔍 CUSTOMER DRILLDOWN MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 w-full max-w-2xl shadow-2xl space-y-4 my-6 text-left border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {selectedCustomer.fullName || "Customer Details"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {selectedCustomer.email} • {selectedCustomer.phone || "No phone"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Saved Addresses Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FiMapPin className="text-sky-700 dark:text-sky-400" />
                <span>Saved Delivery Addresses (Max 5)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(selectedCustomer.addresses || (selectedCustomer.shippingAddress ? [
                  {
                    id: "addr_def",
                    label: "Primary",
                    fullName: selectedCustomer.fullName,
                    phone: selectedCustomer.phone,
                    streetAddress: selectedCustomer.shippingAddress,
                    city: selectedCustomer.city,
                    country: selectedCustomer.country,
                    isDefault: true,
                  }
                ] : [])).map((addr, idx) => (
                  <div key={addr.id || idx} className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        {addr.label || "Address"}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Default</span>
                      )}
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2">{addr.streetAddress}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {[addr.city, addr.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders History Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FiShoppingBag className="text-sky-700 dark:text-sky-400" />
                <span>Order History ({selectedCustomer.ordersCount || 0})</span>
              </h4>

              {Array.isArray(selectedCustomer.orders) && selectedCustomer.orders.length > 0 ? (
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {selectedCustomer.orders.map((ord) => (
                    <div key={ord.orderId} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold font-mono text-slate-900 dark:text-white">{ord.orderId}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {new Date(ord.createdAt).toLocaleDateString()} • {ord.paymentMethodName || ord.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <AedPrice amount={ord.total} className="font-bold text-slate-900 dark:text-white" />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold block mt-0.5">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">No orders placed yet.</p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
