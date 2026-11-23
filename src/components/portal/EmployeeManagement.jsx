import { useState, useMemo } from "react";
import {
  FiUsers,
  FiUserCheck,
  FiShield,
  FiDollarSign,
  FiPercent,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUploadCloud,
  FiGrid,
  FiList,
  FiEye,
  FiEyeOff,
  FiPhone,
  FiMail,
  FiMapPin,
  FiX,
  FiCheckCircle,
  FiSlash,
  FiFileText,
  FiClock,
  FiAlertCircle,
  FiArrowRight,
} from "react-icons/fi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { useCountry } from "../../context/CountryContext";
import { usePortalCurrency } from "../../context/PortalCurrencyContext";
import { AedPrice } from "../common/AedSymbol";
import PortalKpiGrid from "./PortalKpiGrid";
import { PortalFilterMenu, ActiveFilterChips } from "./PortalFilterMenu";

const ROLE_OPTIONS = [
  { value: "admin", label: "Master Admin (Global)" },
  { value: "hub_manager", label: "Supply Hub Manager" },
  { value: "country_manager", label: "Country Manager" },
  { value: "sales", label: "Country Sales Executive" },
  { value: "procurement", label: "Procurement" },
  { value: "warehouse", label: "Warehouse / Ops" },
];

const getRoleLabel = (role) => {
  const found = ROLE_OPTIONS.find((r) => r.value === role);
  return found ? found.label : "Sales Executive";
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const matchInvoiceToEmployee = (inv, member) => {
  const createdBy = (inv.createdBy || "").trim().toLowerCase();
  const memberName = (member.name || "").trim().toLowerCase();
  if (!createdBy || !memberName) return false;
  if (createdBy === memberName) return true;
  // Also match first-name / prefix (e.g., "Yafey" vs "Yafey - Sales Executive")
  const shortName = memberName.split("-")[0].trim();
  return shortName.length >= 3 && createdBy === shortName;
};

const EMPTY_FORM = {
  name: "",
  title: "Sales Executive",
  role: "sales",
  pin: "",
  phone: "",
  email: "",
  branch: "Dubai Silicon Oasis HQ",
  assignedLocation: "AE",
  commissionRate: 2,
  status: "active",
};

const EmployeeManagement = ({ invoices = [], onViewInvoice }) => {
  const {
    members,
    addMember,
    updateMember,
    deleteMember,
    pushAllMembersToCloud,
  } = useStaffAuth();
  const { allLocations } = useCountry();
  const portalCur = usePortalCurrency();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table"); // table | grid
  const [revealedPins, setRevealedPins] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState(null); // { type, message }

  // Employee Detail Drawer
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Add / Edit Modal
  const [modalMode, setModalMode] = useState(null); // "create" | "edit" | null
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Enrich each employee with real-time sales attribution from invoices
  const enrichedMembers = useMemo(() => {
    return members.map((member) => {
      const empInvoices = invoices.filter((inv) =>
        matchInvoiceToEmployee(inv, member)
      );
      const totalRevenue = empInvoices.reduce(
        (sum, inv) => sum + (Number(inv.totalAmount) || 0),
        0
      );
      const totalDiscounts = empInvoices.reduce(
        (sum, inv) => sum + (Number(inv.discount) || 0),
        0
      );
      const avgOrderValue =
        empInvoices.length > 0 ? totalRevenue / empInvoices.length : 0;
      const commissionRate = Number(member.commissionRate || 0);
      const estimatedCommission = (totalRevenue * commissionRate) / 100;

      return {
        ...member,
        status: member.status === "suspended" ? "suspended" : "active",
        invoices: empInvoices,
        invoicesCount: empInvoices.length,
        totalRevenue,
        totalDiscounts,
        avgOrderValue,
        commissionRate,
        estimatedCommission,
      };
    });
  }, [members, invoices]);

  // Filtered employees
  const filteredMembers = useMemo(() => {
    return enrichedMembers.filter((m) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const hit =
          (m.name || "").toLowerCase().includes(q) ||
          (m.title || "").toLowerCase().includes(q) ||
          (m.email || "").toLowerCase().includes(q) ||
          (m.phone || "").toLowerCase().includes(q) ||
          (m.branch || "").toLowerCase().includes(q) ||
          getRoleLabel(m.role).toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (roleFilter !== "All" && m.role !== roleFilter) return false;
      if (statusFilter !== "All" && m.status !== statusFilter) return false;
      return true;
    });
  }, [enrichedMembers, search, roleFilter, statusFilter]);

  // Executive KPI Metrics
  const metrics = useMemo(() => {
    const totalStaff = enrichedMembers.length;
    const activeSales = enrichedMembers.filter(
      (m) => m.role !== "admin" && m.status === "active"
    ).length;
    const teamRevenue = enrichedMembers.reduce(
      (sum, m) => sum + m.totalRevenue,
      0
    );
    const totalCommissions = enrichedMembers.reduce(
      (sum, m) => sum + m.estimatedCommission,
      0
    );
    return { totalStaff, activeSales, teamRevenue, totalCommissions };
  }, [enrichedMembers]);

  // Two-column unified Filter Menu
  const filterSections = useMemo(
    () => [
      {
        id: "role",
        label: "Role",
        value: roleFilter,
        defaultValue: "All",
        onChange: setRoleFilter,
        options: [
          { value: "All", label: "All Roles", count: enrichedMembers.length },
          ...ROLE_OPTIONS.map((r) => ({
            value: r.value,
            label: r.label,
            count: enrichedMembers.filter((m) => m.role === r.value).length,
          })),
        ],
      },
      {
        id: "status",
        label: "Status",
        value: statusFilter,
        defaultValue: "All",
        onChange: setStatusFilter,
        options: [
          { value: "All", label: "All Statuses", count: enrichedMembers.length },
          {
            value: "active",
            label: "Active",
            count: enrichedMembers.filter((m) => m.status === "active").length,
          },
          {
            value: "suspended",
            label: "Suspended",
            count: enrichedMembers.filter((m) => m.status === "suspended").length,
          },
        ],
      },
    ],
    [enrichedMembers, roleFilter, statusFilter]
  );

  const handleResetFilters = () => {
    setRoleFilter("All");
    setStatusFilter("All");
  };

  const toggleRevealPin = (id) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const openEditModal = (member) => {
    setModalMode("edit");
    setEditingId(member.id);
    setForm({
      name: member.name || "",
      title: member.title || getRoleLabel(member.role),
      role: member.role || "sales",
      pin: member.pin || "",
      phone: member.phone || "",
      email: member.email || "",
      branch: member.branch || "Dubai Silicon Oasis HQ",
      assignedLocation:
        member.assignedLocation || (member.role === "admin" ? "ALL" : "AE"),
      commissionRate: member.commissionRate ?? 0,
      status: member.status || "active",
    });
    setFormError("");
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError("");
    const cleanPin = String(form.pin || "").trim();
    if (!form.name.trim()) {
      setFormError("Employee full name is required.");
      return;
    }
    if (!/^\d{4,6}$/.test(cleanPin)) {
      setFormError("Access PIN must be 4 to 6 numeric digits.");
      return;
    }

    setSaving(true);
    try {
      if (modalMode === "create") {
        await addMember({
          ...form,
          pin: cleanPin,
          commissionRate: Number(form.commissionRate) || 0,
        });
      } else if (editingId) {
        await updateMember(editingId, {
          ...form,
          pin: cleanPin,
          commissionRate: Number(form.commissionRate) || 0,
        });
      }
      setModalMode(null);
      setEditingId(null);
    } catch (err) {
      setFormError(err.message || "Could not save employee record.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSuspend = async (member) => {
    if (member.id === "admin") return;
    const nextStatus = member.status === "suspended" ? "active" : "suspended";
    await updateMember(member.id, { status: nextStatus });
  };

  const handleDelete = async (member) => {
    if (member.id === "admin") return;
    if (
      window.confirm(
        `Remove "${member.name}" from staff access? Historical invoices remain preserved in reports.`
      )
    ) {
      await deleteMember(member.id);
      if (selectedEmployee?.id === member.id) {
        setSelectedEmployee(null);
      }
    }
  };

  const handleSyncToCloud = async () => {
    setSyncing(true);
    setSyncNotice(null);
    try {
      const res = await pushAllMembersToCloud();
      if (res.success) {
        setSyncNotice({
          type: "success",
          message: `Synced ${res.count} employee profiles to Cloud Firestore.`,
        });
      } else {
        setSyncNotice({
          type: "error",
          message: res.error || "Cloud sync unavailable in Local Mode.",
        });
      }
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncNotice(null), 4000);
    }
  };

  const activeDrawerEmployee = useMemo(() => {
    if (!selectedEmployee) return null;
    return (
      enrichedMembers.find((m) => m.id === selectedEmployee.id) ||
      selectedEmployee
    );
  }, [selectedEmployee, enrichedMembers]);

  return (
    <div className="space-y-4 sm:space-y-5 text-left">
      {/* KPI Grid */}
      <PortalKpiGrid
        items={[
          {
            id: "staff",
            label: "Total Staff",
            value: metrics.totalStaff,
            icon: FiUsers,
            tone: "sky",
          },
          {
            id: "sales-team",
            label: "Active Team",
            value: metrics.activeSales,
            icon: FiUserCheck,
            tone: "emerald",
          },
          {
            id: "team-revenue",
            label: "Attributed Sales",
            value: (
              <AedPrice
                amount={Math.round(metrics.teamRevenue)}
                decimals={0}
                className="font-mono font-black text-sky-900 dark:text-sky-300"
              />
            ),
            icon: FiDollarSign,
            tone: "indigo",
          },
          {
            id: "commissions",
            label: "Est. Commissions",
            value: (
              <AedPrice
                amount={metrics.totalCommissions}
                decimals={0}
                className="font-mono font-black text-amber-700 dark:text-amber-400"
              />
            ),
            icon: FiPercent,
            tone: "amber",
          },
        ]}
      />

      {/* Unified Toolbar */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Search + Desktop Filter */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base" />
              <input
                type="text"
                placeholder="Search employees by name, role, branch, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 transition"
              />
            </div>

            <div className="hidden md:block">
              <PortalFilterMenu
                sections={filterSections}
                onResetAll={handleResetFilters}
                resultCount={filteredMembers.length}
                resultLabel="employees"
              />
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="md:hidden">
              <PortalFilterMenu
                sections={filterSections}
                onResetAll={handleResetFilters}
                resultCount={filteredMembers.length}
                resultLabel="employees"
              />
            </div>

            {/* Icon-only Grid / Table Switcher */}
            <div
              role="group"
              aria-label="View mode"
              className="inline-flex items-center h-10 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700"
            >
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
            </div>

            {/* Sync to Cloud (icon-only mobile, labeled desktop) */}
            <button
              type="button"
              onClick={handleSyncToCloud}
              disabled={syncing}
              aria-label="Sync team to cloud"
              title="Sync staff directory to Firestore"
              className="inline-flex items-center justify-center gap-1.5 w-10 h-10 md:w-auto md:px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              <FiUploadCloud className="text-[16px] md:text-sm" />
              <span className="hidden md:inline">
                {syncing ? "Syncing..." : "Sync Cloud"}
              </span>
            </button>

            {/* Add Employee CTA */}
            <button
              type="button"
              onClick={openCreateModal}
              className="ml-auto md:ml-0 inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
            >
              <FiPlus className="text-sm" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {syncNotice && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              syncNotice.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/25 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/25 text-amber-800 dark:text-amber-300"
            }`}
          >
            {syncNotice.type === "success" ? (
              <FiCheckCircle className="shrink-0" />
            ) : (
              <FiAlertCircle className="shrink-0" />
            )}
            <span>{syncNotice.message}</span>
          </div>
        )}

        <ActiveFilterChips
          sections={filterSections}
          onResetAll={handleResetFilters}
        />
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 whitespace-nowrap">Employee</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Role &amp; Branch</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Invoices</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Revenue ({portalCur.symbol})</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Commission</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Access PIN</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-slate-400 dark:text-slate-500"
                    >
                      <FiUsers className="text-3xl mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-semibold">
                        No employees match your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((emp) => {
                    const isPinShown = Boolean(revealedPins[emp.id]);
                    const isSuspended = emp.status === "suspended";

                    return (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedEmployee(emp)}
                        className="hover:bg-sky-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        {/* Employee Identity */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                                emp.role === "admin"
                                  ? "bg-sky-600 text-white"
                                  : isSuspended
                                  ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                  : "bg-emerald-600 text-white"
                              }`}
                            >
                              {getInitials(emp.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate max-w-[200px]">
                                {emp.name}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                                {emp.email || emp.phone || emp.title}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role & Branch */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              emp.role === "admin"
                                ? "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {emp.role === "admin" ? (
                              <FiShield className="text-[11px]" />
                            ) : (
                              <FiUserCheck className="text-[11px]" />
                            )}
                            <span>{getRoleLabel(emp.role)}</span>
                          </span>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[160px]">
                            {emp.branch}
                          </p>
                        </td>

                        {/* Status */}
                        <td
                          className="py-3.5 px-3 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            disabled={emp.id === "admin"}
                            onClick={() => handleToggleSuspend(emp)}
                            title={
                              emp.id === "admin"
                                ? "Primary Admin is always active"
                                : isSuspended
                                ? "Click to Reactivate Access"
                                : "Click to Suspend Access"
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                              emp.id === "admin"
                                ? "cursor-default"
                                : "cursor-pointer"
                            } ${
                              isSuspended
                                ? "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/25"
                                : "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25"
                            }`}
                          >
                            {isSuspended ? <FiSlash /> : <FiCheckCircle />}
                            <span>{isSuspended ? "Suspended" : "Active"}</span>
                          </button>
                        </td>

                        {/* Invoices Count */}
                        <td className="py-3.5 px-3 text-center font-mono font-bold whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                            {emp.invoicesCount}
                          </span>
                        </td>

                        {/* Revenue Generated */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <AedPrice amount={emp.totalRevenue} decimals={0} />
                        </td>

                        {/* Commission */}
                        <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                              <AedPrice amount={emp.estimatedCommission} />
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {emp.commissionRate}% rate
                            </span>
                          </div>
                        </td>

                        {/* Access PIN (Masked with Reveal Toggle) */}
                        <td
                          className="py-3.5 px-3 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                            <span>{isPinShown ? emp.pin : "••••"}</span>
                            <button
                              type="button"
                              onClick={() => toggleRevealPin(emp.id)}
                              aria-label={isPinShown ? "Hide PIN" : "Show PIN"}
                              className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer"
                            >
                              {isPinShown ? (
                                <FiEyeOff className="text-xs" />
                              ) : (
                                <FiEye className="text-xs" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(emp)}
                              className="p-1.5 text-slate-400 hover:text-sky-700 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/15 rounded-lg transition cursor-pointer"
                              title="Edit Employee Details & PIN"
                            >
                              <FiEdit2 className="text-sm" />
                            </button>
                            {emp.id !== "admin" && (
                              <button
                                type="button"
                                onClick={() => handleDelete(emp)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-lg transition cursor-pointer"
                                title="Remove Employee"
                              >
                                <FiTrash2 className="text-sm" />
                              </button>
                            )}
                          </div>
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

      {/* VIEW 2: GRID CARDS VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMembers.length === 0 ? (
            <div className="col-span-full p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <FiUsers className="text-4xl mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">No employees match your filters.</p>
            </div>
          ) : (
            filteredMembers.map((emp) => {
              const isSuspended = emp.status === "suspended";
              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5 cursor-pointer hover:border-sky-300 dark:hover:border-sky-500/40 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 ${
                            emp.role === "admin"
                              ? "bg-sky-600 text-white"
                              : isSuspended
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-500"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {getInitials(emp.name)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {emp.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {getRoleLabel(emp.role)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isSuspended
                            ? "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"
                            : "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {isSuspended ? "Suspended" : "Active"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/70 rounded-xl">
                        <span className="text-[9.5px] text-slate-400 uppercase font-bold block">
                          Invoices
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {emp.invoicesCount}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/70 rounded-xl">
                        <span className="text-[9.5px] text-slate-400 uppercase font-bold block">
                          Sales
                        </span>
                        <AedPrice
                          amount={emp.totalRevenue}
                          decimals={0}
                          className="font-mono font-bold text-slate-900 dark:text-white text-[11px] justify-center"
                        />
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/70 rounded-xl">
                        <span className="text-[9.5px] text-slate-400 uppercase font-bold block">
                          Comm.
                        </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                          {emp.commissionRate}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                      {emp.branch}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-400">
                      <span>View ledger</span>
                      <FiArrowRight className="text-[10px]" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* EMPLOYEE PROFILE & SALES PERFORMANCE SLIDE-OVER DRAWER */}
      {activeDrawerEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end text-left">
          <div
            onClick={() => setSelectedEmployee(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
          />
          <aside
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full sm:w-[500px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 bg-slate-50/90 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    activeDrawerEmployee.role === "admin"
                      ? "bg-sky-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {getInitials(activeDrawerEmployee.name)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                    {activeDrawerEmployee.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {activeDrawerEmployee.title || getRoleLabel(activeDrawerEmployee.role)} •{" "}
                    {activeDrawerEmployee.branch}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const target = activeDrawerEmployee;
                    setSelectedEmployee(null);
                    openEditModal(target);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(null)}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <FiX className="text-lg" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Contact & Metadata */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <FiPhone className="text-slate-400 shrink-0" />
                  <span className="font-mono truncate">
                    {activeDrawerEmployee.phone || "No phone set"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <FiMail className="text-slate-400 shrink-0" />
                  <span className="truncate">
                    {activeDrawerEmployee.email || "No email set"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <FiMapPin className="text-slate-400 shrink-0" />
                  <span className="truncate">{activeDrawerEmployee.branch}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <FiClock className="text-slate-400 shrink-0" />
                  <span className="truncate">
                    Last login:{" "}
                    {activeDrawerEmployee.lastLoginAt
                      ? new Date(activeDrawerEmployee.lastLoginAt).toLocaleDateString("en-GB")
                      : "Never"}
                  </span>
                </div>
              </div>

              {/* 4 Performance KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Total Sales
                  </p>
                  <div className="mt-1 text-lg font-black font-mono text-slate-900 dark:text-white">
                    <AedPrice amount={activeDrawerEmployee.totalRevenue} decimals={0} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeDrawerEmployee.invoicesCount} invoice(s) closed
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Est. Commission ({activeDrawerEmployee.commissionRate}%)
                  </p>
                  <div className="mt-1 text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
                    <AedPrice amount={activeDrawerEmployee.estimatedCommission} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Based on billed total
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Avg. Invoice Value
                  </p>
                  <div className="mt-1 text-base font-black font-mono text-sky-800 dark:text-sky-300">
                    <AedPrice amount={activeDrawerEmployee.avgOrderValue} decimals={0} />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Discounts Granted
                  </p>
                  <div className="mt-1 text-base font-black font-mono text-amber-700 dark:text-amber-400">
                    <AedPrice amount={activeDrawerEmployee.totalDiscounts} decimals={0} />
                  </div>
                </div>
              </div>

              {/* Attributed Invoices History */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FiFileText className="text-sky-600 dark:text-sky-400" />
                  <span>Sales &amp; Invoices Issued ({activeDrawerEmployee.invoicesCount})</span>
                </h4>

                {activeDrawerEmployee.invoices.length === 0 ? (
                  <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                    No sales invoices attributed to this employee yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {activeDrawerEmployee.invoices.map((inv) => (
                      <div
                        key={inv.invoiceNo}
                        className="p-3 flex items-center justify-between gap-2 bg-white dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                      >
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmployee(null);
                              if (onViewInvoice) onViewInvoice(inv);
                            }}
                            className="font-mono font-bold text-xs text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                          >
                            {inv.invoiceNo}
                          </button>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {inv.customerName} •{" "}
                            {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <AedPrice
                            amount={inv.totalAmount}
                            className="font-mono font-bold text-xs text-slate-900 dark:text-white"
                          />
                          <span className="block text-[10px] text-slate-400">
                            {inv.paymentMethod}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 my-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {modalMode === "create" ? "Add New Employee" : "Edit Employee Profile"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure staff access PIN, role permissions, branch, and commission rate.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                  <FiAlertCircle className="shrink-0 text-sm" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Al Mansoor"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Sales Executive"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Portal Role
                  </label>
                  <select
                    value={form.role}
                    disabled={editingId === "admin"}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:border-sky-600 cursor-pointer disabled:opacity-60"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Access PIN (4-6 digits) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="e.g. 4589"
                    value={form.pin}
                    onChange={(e) =>
                      setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Commission (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.25"
                    value={form.commissionRate}
                    onChange={(e) =>
                      setForm({ ...form, commissionRate: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 rounded-xl font-mono font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+971 50 000 0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    placeholder="name@eall.ae"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Assigned Country / Warehouse Hub *
                  </label>
                  <select
                    value={form.assignedLocation || "AE"}
                    disabled={editingId === "admin"}
                    onChange={(e) => {
                      const locCode = e.target.value;
                      const locObj = allLocations.find((l) => l.code === locCode);
                      setForm({
                        ...form,
                        assignedLocation: locCode,
                        branch:
                          locCode === "ALL"
                            ? "Global HQ (All Hubs & Countries)"
                            : locObj?.hubName || form.branch,
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:border-sky-600 cursor-pointer disabled:opacity-60"
                  >
                    <option value="ALL">🌍 Global (All Countries &amp; Supply Hubs)</option>
                    {allLocations.map((loc) => (
                      <option key={loc.code} value={loc.code}>
                        {loc.flag} {loc.name} — {loc.hubName} ({loc.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Branch / Office Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nairobi Westlands Branch"
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Account Status
                </label>
                <select
                  value={form.status}
                  disabled={editingId === "admin"}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:border-sky-600 cursor-pointer disabled:opacity-60"
                >
                  <option value="active">Active (Can Sign In)</option>
                  <option value="suspended">Suspended (Access Blocked)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving
                    ? "Saving..."
                    : modalMode === "create"
                    ? "Create Employee"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;

