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
    <div className="space-y-4 sm:space-y-6 text-left">
      {/* 📊 SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Customers
            </p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 font-mono">
              {metrics.totalCount}
            </p>
          </div>
          <div className="p-2 sm:p-2.5 bg-sky-50 text-sky-700 rounded-xl text-lg sm:text-xl">
            <FiUsers />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Buyers
            </p>
            <p className="text-lg sm:text-2xl font-black text-emerald-700 mt-0.5 font-mono">
              {metrics.activeBuyers}
            </p>
          </div>
          <div className="p-2 sm:p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-lg sm:text-xl">
            <FiCheckCircle />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Orders
            </p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 font-mono">
              {metrics.totalOrders}
            </p>
          </div>
          <div className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-lg sm:text-xl">
            <FiShoppingBag />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Spend
            </p>
            <div className="mt-0.5">
              <AedPrice
                amount={metrics.totalRevenue}
                decimals={0}
                className="text-base sm:text-xl font-black text-sky-900 truncate"
              />
            </div>
          </div>
          <div className="p-2 sm:p-2.5 bg-amber-50 text-amber-700 rounded-xl text-lg sm:text-xl">
            <FiShield />
          </div>
        </div>
      </div>

      {/* 🔍 SEARCH & VIEW CONTROLS */}
      <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          <input
            type="text"
            placeholder="Search customers by name, email, phone, city, or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-sky-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* 🔲 VIEW MODE SWITCHER */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-sky-800 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Card / Grid View"
            >
              <FiGrid className="text-sm" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-sky-800 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
            >
              <FiList className="text-sm" />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadCustomers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer shrink-0"
          >
            <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 🔲 VIEW MODE 1: GRID / CARDS VIEW (RESPONSIVE FOR WEB & MOBILE) */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
              <FiUsers className="text-4xl mx-auto text-slate-300" />
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
                  className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3.5 cursor-pointer hover:border-sky-300 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-2xl bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {(cust.fullName || cust.email || "C").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {cust.fullName || "Customer"}
                          </h4>
                          <span className="text-[10.5px] text-slate-400 font-medium block truncate">
                            {cust.country || "United Arab Emirates"}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl shrink-0">
                        View
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 pt-1">
                      <p className="truncate text-slate-700 flex items-center gap-1.5 text-[11px]">
                        <FiMail className="text-slate-400 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </p>
                      {cust.phone && (
                        <p className="font-mono text-slate-500 flex items-center gap-1.5 text-[11px]">
                          <FiPhone className="text-slate-400 shrink-0" />
                          <span>{cust.phone}</span>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="p-2 bg-slate-50 rounded-2xl text-center">
                        <span className="text-[9.5px] text-slate-400 block font-semibold uppercase">Addresses</span>
                        <span className="font-mono font-bold text-slate-800 text-xs">{addrCount}/5</span>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-2xl text-center">
                        <span className="text-[9.5px] text-slate-400 block font-semibold uppercase">Orders</span>
                        <span className="font-mono font-bold text-slate-800 text-xs">{cust.ordersCount || 0}</span>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-2xl text-center">
                        <span className="text-[9.5px] text-slate-400 block font-semibold uppercase">Spend</span>
                        <AedPrice amount={cust.totalSpent || 0} decimals={0} className="font-bold text-slate-900 text-[11px] justify-center" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-[10.5px] text-slate-400 text-right flex items-center justify-end gap-1 font-medium">
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
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Addresses</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4 text-right">Lifetime Spend (<AedSymbol />)</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FiUsers className="text-3xl mx-auto mb-2 text-slate-300" />
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
                      <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs shrink-0">
                              {(cust.fullName || cust.email || "C").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 truncate max-w-xs">
                                {cust.fullName || "Customer"}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                ID: {cust.id.slice(0, 10)}...
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="text-slate-800 text-xs flex items-center gap-1.5 truncate max-w-[200px]">
                              <FiMail className="text-slate-400 text-xs shrink-0" />
                              <span>{cust.email}</span>
                            </p>
                            {cust.phone && (
                              <p className="text-slate-500 font-mono text-[11px] flex items-center gap-1.5">
                                <FiPhone className="text-slate-400 text-xs shrink-0" />
                                <span>{cust.phone}</span>
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold mb-0.5">
                            {cust.country || "United Arab Emirates"}
                          </span>
                          <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {cust.city || "Dubai"}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-bold border border-sky-200/60">
                            <FiMapPin className="text-xs" />
                            <span>{addrCount}/5</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-xs">
                            {cust.ordersCount || 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <AedPrice
                            amount={cust.totalSpent || 0}
                            className="font-bold text-slate-950 text-sm justify-end"
                          />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(cust)}
                            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl text-xs transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 w-full max-w-2xl shadow-2xl space-y-4 my-6 text-left border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {selectedCustomer.fullName || "Customer Details"}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedCustomer.email} • {selectedCustomer.phone || "No phone"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Saved Addresses Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FiMapPin className="text-sky-700" />
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
                  <div key={addr.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200">
                        {addr.label || "Address"}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] text-emerald-700 font-bold">Default</span>
                      )}
                    </div>
                    <p className="font-medium text-slate-800 line-clamp-2">{addr.streetAddress}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {[addr.city, addr.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders History Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FiShoppingBag className="text-sky-700" />
                <span>Order History ({selectedCustomer.ordersCount || 0})</span>
              </h4>

              {Array.isArray(selectedCustomer.orders) && selectedCustomer.orders.length > 0 ? (
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {selectedCustomer.orders.map((ord) => (
                    <div key={ord.orderId} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold font-mono text-slate-900">{ord.orderId}</p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString()} • {ord.paymentMethodName || ord.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <AedPrice amount={ord.total} className="font-bold text-slate-900" />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold block mt-0.5">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No orders placed yet.</p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
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
