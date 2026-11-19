import { useState, useMemo } from "react";
import {
  FiGlobe,
  FiClock,
  FiFileText,
  FiDollarSign,
  FiSearch,
  FiPlus,
  FiDownload,
  FiGrid,
  FiList,
  FiEye,
  FiTrash2,
  FiX,
  FiMail,
  FiPhone,
  FiMapPin,
  FiMessageCircle,
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
} from "react-icons/fi";
import {
  RFQ_STATUSES,
  INCOTERM_OPTIONS,
  submitRFQ,
  updateRFQ,
  deleteRFQ,
} from "../../services/b2bService";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { AedPrice, AedSymbol } from "../common/AedSymbol";
import PortalKpiGrid from "./PortalKpiGrid";
import { PortalFilterMenu, ActiveFilterChips } from "./PortalFilterMenu";

const getRfqStatusBadge = (status = "") => {
  const s = status.toLowerCase();
  if (s.includes("won") || s.includes("approved")) {
    return "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25";
  }
  if (s.includes("quoted") || s.includes("negotiat")) {
    return "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-500/25";
  }
  if (s.includes("closed") || s.includes("lost")) {
    return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
  }
  return "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25";
};

const EMPTY_RFQ_FORM = {
  companyName: "",
  trnNumber: "",
  businessType: "Wholesaler / Distributor",
  contactName: "",
  email: "",
  phone: "",
  destinationCountry: "United Arab Emirates",
  destinationCity: "Dubai",
  incoterms: "EXW (Dubai Warehouse)",
  productsRequired: "",
  estimatedVolume: "50-100 Units",
  additionalNotes: "",
};

const B2BRfqManagement = ({
  rfqs = [],
  onRfqsUpdated,
  onConvertToPOS,
  currentUser,
  isAdmin,
}) => {
  const { members } = useStaffAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [incotermFilter, setIncotermFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table"); // table | grid

  // Slide-over Detail & Quote Drawer
  const [selectedRfqId, setSelectedRfqId] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editQuotedAmount, setEditQuotedAmount] = useState("");
  const [editQuoteRef, setEditQuoteRef] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editInternalNotes, setEditInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Create Manual RFQ Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_RFQ_FORM);
  const [creating, setCreating] = useState(false);

  const selectedRfq = useMemo(
    () => rfqs.find((r) => r.rfqId === selectedRfqId) || null,
    [rfqs, selectedRfqId]
  );

  const openRfqDrawer = (rfq) => {
    setSelectedRfqId(rfq.rfqId);
    setEditStatus(rfq.status || "Pending Executive Review");
    setEditQuotedAmount(rfq.quotedAmount ? String(rfq.quotedAmount) : "");
    setEditQuoteRef(rfq.quoteRef || `QT-${rfq.rfqId.replace("RFQ-", "")}`);
    setEditAssignedTo(rfq.assignedTo || currentUser?.name || "");
    setEditInternalNotes(rfq.internalNotes || "");
  };

  // Dynamic Incoterms & Assignees
  const availableIncoterms = useMemo(() => {
    const set = new Set(INCOTERM_OPTIONS);
    rfqs.forEach((r) => r.incoterms && set.add(r.incoterms));
    return Array.from(set);
  }, [rfqs]);

  const availableAssignees = useMemo(() => {
    const set = new Set();
    members.forEach((m) => m.name && set.add(m.name));
    rfqs.forEach((r) => r.assignedTo && set.add(r.assignedTo));
    return Array.from(set);
  }, [members, rfqs]);

  // Filtered RFQs
  const filteredRfqs = useMemo(() => {
    return rfqs.filter((r) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const hit =
          (r.rfqId || "").toLowerCase().includes(q) ||
          (r.companyName || "").toLowerCase().includes(q) ||
          (r.contactName || "").toLowerCase().includes(q) ||
          (r.trnNumber || "").toLowerCase().includes(q) ||
          (r.productsRequired || "").toLowerCase().includes(q) ||
          (r.destinationCountry || "").toLowerCase().includes(q) ||
          (r.destinationCity || "").toLowerCase().includes(q);
        if (!hit) return false;
      }

      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (incotermFilter !== "All" && r.incoterms !== incotermFilter) return false;
      if (assigneeFilter === "Unassigned" && r.assignedTo) return false;
      if (
        assigneeFilter !== "All" &&
        assigneeFilter !== "Unassigned" &&
        r.assignedTo !== assigneeFilter
      ) {
        return false;
      }
      return true;
    });
  }, [rfqs, search, statusFilter, incotermFilter, assigneeFilter]);

  // Executive KPIs
  const metrics = useMemo(() => {
    const totalRfqs = rfqs.length;
    const pendingReview = rfqs.filter((r) =>
      ["Pending Executive Review", "In Review"].includes(r.status)
    ).length;
    const activeQuoted = rfqs.filter((r) =>
      ["Quoted", "Negotiating", "Won / Approved"].includes(r.status)
    ).length;
    const pipelineValue = rfqs
      .filter((r) => r.status !== "Closed / Lost")
      .reduce((sum, r) => sum + (Number(r.quotedAmount) || 0), 0);
    return { totalRfqs, pendingReview, activeQuoted, pipelineValue };
  }, [rfqs]);

  // Unified Two-Column Filter Menu
  const filterSections = useMemo(
    () => [
      {
        id: "status",
        label: "Stage",
        value: statusFilter,
        defaultValue: "All",
        onChange: setStatusFilter,
        options: [
          { value: "All", label: "All Stages", count: rfqs.length },
          ...RFQ_STATUSES.map((st) => ({
            value: st,
            label: st,
            count: rfqs.filter((r) => r.status === st).length,
          })),
        ],
      },
      {
        id: "incoterms",
        label: "Incoterms",
        value: incotermFilter,
        defaultValue: "All",
        onChange: setIncotermFilter,
        options: [
          { value: "All", label: "All Incoterms", count: rfqs.length },
          ...availableIncoterms.map((inc) => ({
            value: inc,
            label: inc,
            count: rfqs.filter((r) => r.incoterms === inc).length,
          })),
        ],
      },
      {
        id: "assignee",
        label: "Assigned To",
        value: assigneeFilter,
        defaultValue: "All",
        onChange: setAssigneeFilter,
        options: [
          { value: "All", label: "All Staff", count: rfqs.length },
          {
            value: "Unassigned",
            label: "Unassigned",
            count: rfqs.filter((r) => !r.assignedTo).length,
          },
          ...availableAssignees.map((name) => ({
            value: name,
            label: name,
            count: rfqs.filter((r) => r.assignedTo === name).length,
          })),
        ],
      },
    ],
    [rfqs, statusFilter, incotermFilter, assigneeFilter, availableIncoterms, availableAssignees]
  );

  const handleResetFilters = () => {
    setStatusFilter("All");
    setIncotermFilter("All");
    setAssigneeFilter("All");
  };

  const handleSaveRfq = async (e) => {
    e.preventDefault();
    if (!selectedRfq) return;
    setSaving(true);
    try {
      await updateRFQ(selectedRfq.rfqId, {
        status: editStatus,
        quotedAmount: parseFloat(editQuotedAmount) || 0,
        quoteRef: editQuoteRef.trim(),
        assignedTo: editAssignedTo,
        internalNotes: editInternalNotes,
        updatedBy: currentUser?.name || "Staff",
      });
      if (onRfqsUpdated) onRfqsUpdated();
      setSelectedRfqId(null);
    } catch (err) {
      alert(err.message || "Could not update RFQ.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRfq = async (e) => {
    e.preventDefault();
    if (!createForm.companyName.trim()) return;
    setCreating(true);
    try {
      await submitRFQ(
        {
          ...createForm,
          assignedTo: currentUser?.name || "",
        },
        { fromPortal: true }
      );
      setShowCreateModal(false);
      setCreateForm(EMPTY_RFQ_FORM);
      if (onRfqsUpdated) onRfqsUpdated();
    } catch (err) {
      alert(err.message || "Could not log B2B RFQ.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRfq = async (rfq) => {
    if (!isAdmin) return;
    if (window.confirm(`Permanently delete B2B RFQ ${rfq.rfqId} (${rfq.companyName})?`)) {
      await deleteRFQ(rfq.rfqId);
      if (selectedRfqId === rfq.rfqId) setSelectedRfqId(null);
      if (onRfqsUpdated) onRfqsUpdated();
    }
  };

  const handleWhatsAppQuote = (rfq) => {
    const cleanPhone = (rfq.phone || "").replace(/[^0-9]/g, "");
    const amount = parseFloat(editQuotedAmount) || Number(rfq.quotedAmount) || 0;
    const msg =
      `Hello ${rfq.contactName || rfq.companyName},\n` +
      `Thank you for your wholesale inquiry with *E-ALL (Electronics All FZCO)*.\n\n` +
      `*RFQ Reference:* ${rfq.rfqId}\n` +
      (editQuoteRef ? `*Quotation #:* ${editQuoteRef}\n` : "") +
      `*Company:* ${rfq.companyName}\n` +
      `*Incoterms:* ${rfq.incoterms}\n` +
      (amount > 0
        ? `*Quoted Total:* AED ${amount.toLocaleString("en-AE", { minimumFractionDigits: 2 })}\n`
        : "") +
      `\nPlease reply to confirm stock allocation and proforma invoice issuance.`;
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  const handleEmailQuote = (rfq) => {
    const amount = parseFloat(editQuotedAmount) || Number(rfq.quotedAmount) || 0;
    const subject = `Official Quotation ${editQuoteRef || rfq.rfqId} - E-ALL Electronics FZCO`;
    const body =
      `Dear ${rfq.contactName || rfq.companyName},\n\n` +
      `Please find our wholesale quotation summary for RFQ ${rfq.rfqId}:\n` +
      `- Company: ${rfq.companyName}\n` +
      `- Incoterms: ${rfq.incoterms}\n` +
      `- Destination: ${rfq.destinationCity}, ${rfq.destinationCountry}\n` +
      (amount > 0 ? `- Quoted Total: AED ${amount.toLocaleString("en-AE", { minimumFractionDigits: 2 })}\n` : "") +
      `\nBest regards,\n${currentUser?.name || "E-ALL B2B Sales Desk"}\nElectronics All FZCO, Dubai Silicon Oasis`;
    window.open(
      `mailto:${rfq.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_self"
    );
  };

  const handleExportCSV = () => {
    if (filteredRfqs.length === 0) return;
    const headers = [
      "RFQ ID",
      "Date",
      "Company",
      "TRN",
      "Contact",
      "Phone",
      "Email",
      "Destination",
      "Incoterms",
      "Volume",
      "Quoted Value (AED)",
      "Status",
      "Assigned To",
    ];
    const rows = filteredRfqs.map((r) => [
      r.rfqId,
      new Date(r.createdAt).toLocaleDateString("en-GB"),
      `"${(r.companyName || "").replace(/"/g, '""')}"`,
      `"${r.trnNumber || ""}"`,
      `"${(r.contactName || "").replace(/"/g, '""')}"`,
      `"${r.phone || ""}"`,
      `"${r.email || ""}"`,
      `"${r.destinationCity}, ${r.destinationCountry}"`,
      `"${r.incoterms || ""}"`,
      `"${r.estimatedVolume || ""}"`,
      Number(r.quotedAmount || 0).toFixed(2),
      `"${r.status || ""}"`,
      `"${r.assignedTo || ""}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EALL_B2B_RFQs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-5 text-left">
      {/* KPI Grid */}
      <PortalKpiGrid
        items={[
          {
            id: "total-rfqs",
            label: "Total RFQs",
            value: metrics.totalRfqs,
            icon: FiGlobe,
            tone: "sky",
          },
          {
            id: "pending-rfqs",
            label: "Pending Review",
            value: metrics.pendingReview,
            icon: FiClock,
            tone: "amber",
          },
          {
            id: "quoted-rfqs",
            label: "Quoted / Won",
            value: metrics.activeQuoted,
            icon: FiCheckCircle,
            tone: "emerald",
          },
          {
            id: "pipeline-val",
            label: "Pipeline Value",
            value: (
              <AedPrice
                amount={Math.round(metrics.pipelineValue)}
                decimals={0}
                className="font-mono font-black text-indigo-900 dark:text-indigo-300"
              />
            ),
            icon: FiDollarSign,
            tone: "indigo",
          },
        ]}
      />

      {/* Unified Toolbar */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base" />
              <input
                type="text"
                placeholder="Search RFQs by company, TRN, contact, products, or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 transition"
              />
            </div>

            <div className="hidden md:block">
              <PortalFilterMenu
                sections={filterSections}
                onResetAll={handleResetFilters}
                resultCount={filteredRfqs.length}
                resultLabel="RFQs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="md:hidden">
              <PortalFilterMenu
                sections={filterSections}
                onResetAll={handleResetFilters}
                resultCount={filteredRfqs.length}
                resultLabel="RFQs"
              />
            </div>

            {/* Icon-only View Mode Switcher */}
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

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredRfqs.length === 0}
              aria-label="Export CSV"
              title="Export RFQs as CSV"
              className="inline-flex items-center justify-center gap-1.5 w-10 h-10 md:w-auto md:px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-40 shrink-0"
            >
              <FiDownload className="text-[16px] md:text-sm" />
              <span className="hidden md:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="ml-auto md:ml-0 inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
            >
              <FiPlus className="text-sm" />
              <span>Log RFQ</span>
            </button>
          </div>
        </div>

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
                  <th className="py-3.5 px-4 whitespace-nowrap">RFQ # &amp; Date</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Company &amp; Contact</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Destination &amp; Terms</th>
                  <th className="py-3.5 px-3">Requirements &amp; Volume</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Quote (<AedSymbol />)</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Stage</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
                {filteredRfqs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-slate-400 dark:text-slate-500"
                    >
                      <FiGlobe className="text-3xl mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        No B2B wholesale RFQs yet
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Website B2B quote requests sync here automatically, or click &ldquo;Log RFQ&rdquo; to record a wholesale lead.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRfqs.map((rfq) => (
                    <tr
                      key={rfq.rfqId}
                      onClick={() => openRfqDrawer(rfq)}
                      className="hover:bg-sky-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-sky-800 dark:text-sky-400 block">
                          {rfq.rfqId}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          {new Date(rfq.createdAt).toLocaleDateString("en-GB")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                          {rfq.companyName}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {rfq.contactName || rfq.phone || rfq.email}
                        </p>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                          {rfq.destinationCity}, {rfq.destinationCountry}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {rfq.incoterms}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 max-w-[240px]">
                        <p className="text-xs text-slate-800 dark:text-slate-200 truncate">
                          {rfq.productsRequired || "General wholesale inquiry"}
                        </p>
                        <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400">
                          Vol: {rfq.estimatedVolume}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        {rfq.quotedAmount > 0 ? (
                          <AedPrice
                            amount={rfq.quotedAmount}
                            decimals={0}
                            className="text-slate-900 dark:text-white"
                          />
                        ) : (
                          <span className="text-xs text-slate-400 font-sans font-medium">
                            Not quoted
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${getRfqStatusBadge(
                            rfq.status
                          )}`}
                        >
                          {rfq.status}
                        </span>
                        {rfq.assignedTo && (
                          <span className="block text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px] mx-auto">
                            {rfq.assignedTo}
                          </span>
                        )}
                      </td>

                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openRfqDrawer(rfq)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 dark:hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-semibold cursor-pointer"
                          >
                            <FiEye className="text-xs" />
                            <span>Quote</span>
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRfq(rfq)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-lg transition cursor-pointer"
                              title="Delete RFQ"
                            >
                              <FiTrash2 className="text-sm" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: GRID VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRfqs.length === 0 ? (
            <div className="col-span-full p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <FiGlobe className="text-4xl mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">No B2B RFQs match your filters.</p>
            </div>
          ) : (
            filteredRfqs.map((rfq) => (
              <div
                key={rfq.rfqId}
                onClick={() => openRfqDrawer(rfq)}
                className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 cursor-pointer hover:border-sky-300 dark:hover:border-sky-500/40 hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-sky-700 dark:text-sky-400">
                      {rfq.rfqId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getRfqStatusBadge(
                        rfq.status
                      )}`}
                    >
                      {rfq.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                      {rfq.companyName}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {rfq.destinationCity}, {rfq.destinationCountry} • {rfq.incoterms}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {rfq.productsRequired || "Wholesale inquiry"}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {rfq.quotedAmount > 0 ? (
                      <AedPrice amount={rfq.quotedAmount} decimals={0} />
                    ) : (
                      <span className="text-slate-400 font-sans font-normal">
                        {rfq.estimatedVolume}
                      </span>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-400 text-[11px]">
                    Manage <FiArrowRight className="text-[10px]" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* B2B RFQ DETAIL & QUOTATION DRAWER */}
      {selectedRfq && (
        <div className="fixed inset-0 z-50 flex justify-end text-left">
          <div
            onClick={() => setSelectedRfqId(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
          />
          <aside
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full sm:w-[560px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 bg-slate-50/90 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black font-mono text-slate-900 dark:text-white">
                    {selectedRfq.rfqId}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getRfqStatusBadge(
                      selectedRfq.status
                    )}`}
                  >
                    {selectedRfq.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {selectedRfq.companyName} • {selectedRfq.businessType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRfqId(null)}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Body */}
            <form
              onSubmit={handleSaveRfq}
              className="flex-1 overflow-y-auto p-5 space-y-5 text-xs"
            >
              {/* Buyer Contact Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FiBriefcase className="text-sky-600 dark:text-sky-400" />
                    {selectedRfq.companyName}
                  </span>
                  {selectedRfq.trnNumber && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                      TRN: {selectedRfq.trnNumber}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 pt-1">
                  <span className="flex items-center gap-1.5">
                    <FiPhone className="text-slate-400 shrink-0" />
                    <span className="font-mono">{selectedRfq.phone || "No phone"}</span>
                  </span>
                  <span className="flex items-center gap-1.5 truncate">
                    <FiMail className="text-slate-400 shrink-0" />
                    <span className="truncate">{selectedRfq.email || "No email"}</span>
                  </span>
                  <span className="flex items-center gap-1.5 sm:col-span-2">
                    <FiMapPin className="text-slate-400 shrink-0" />
                    <span>
                      {selectedRfq.destinationCity}, {selectedRfq.destinationCountry} •{" "}
                      <strong>{selectedRfq.incoterms}</strong>
                    </span>
                  </span>
                </div>
              </div>

              {/* Requirements Box */}
              <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-500/10 border border-sky-200/70 dark:border-sky-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                    Requested Products &amp; Specs
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300">
                    {selectedRfq.estimatedVolume}
                  </span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedRfq.productsRequired || "No product details provided."}
                </p>
                {selectedRfq.additionalNotes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-sky-200/60 dark:border-sky-500/20">
                    Buyer notes: {selectedRfq.additionalNotes}
                  </p>
                )}
              </div>

              {/* Quotation & Pipeline Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:border-sky-600 cursor-pointer"
                  >
                    {RFQ_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                    Assigned Account Manager
                  </label>
                  <select
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:border-sky-600 cursor-pointer"
                  >
                    <option value="">-- Unassigned --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                    Quoted Amount (AED)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={editQuotedAmount}
                    onChange={(e) => setEditQuotedAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                    Quotation Reference #
                  </label>
                  <input
                    type="text"
                    placeholder="QT-2026-10045"
                    value={editQuoteRef}
                    onChange={(e) => setEditQuoteRef(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  Internal Commercial Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Unit pricing breakdown, payment terms, shipment readiness..."
                  value={editInternalNotes}
                  onChange={(e) => setEditInternalNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
                />
              </div>

              {/* 1-Click Wholesale Quick Actions */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quick Wholesale Actions
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedRfq.phone && (
                    <button
                      type="button"
                      onClick={() => handleWhatsAppQuote(selectedRfq)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/25 font-bold cursor-pointer transition"
                    >
                      <FiMessageCircle /> WhatsApp Quote
                    </button>
                  )}
                  {selectedRfq.email && (
                    <button
                      type="button"
                      onClick={() => handleEmailQuote(selectedRfq)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer transition"
                    >
                      <FiMail /> Email Quote
                    </button>
                  )}
                  {onConvertToPOS && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedRfq;
                        setSelectedRfqId(null);
                        onConvertToPOS({
                          rfqId: target.rfqId,
                          customerName: target.companyName,
                          customerPhone: target.phone,
                          customerEmail: target.email,
                          customerTrn: target.trnNumber,
                          notes: `Converted from B2B ${target.rfqId} (${target.incoterms})`,
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 dark:hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-500/25 font-bold cursor-pointer transition"
                    >
                      <FiFileText /> Convert to POS Invoice
                    </button>
                  )}
                </div>
              </div>

              {/* Save Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRfqId(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : "Update RFQ"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* LOG NEW B2B RFQ MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 w-full max-w-xl shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 my-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Log B2B Wholesale RFQ
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Capture phone, WhatsApp, or email wholesale quote inquiries into the CRM pipeline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateRfq} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gulf Mobile Trading LLC"
                    value={createForm.companyName}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, companyName: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:border-sky-600"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    TRN / Tax ID
                  </label>
                  <input
                    type="text"
                    placeholder="100xxxxxxxx"
                    value={createForm.trnNumber}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, trnNumber: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="Buyer name"
                    value={createForm.contactName}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, contactName: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+971 50 ..."
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, phone: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono outline-none focus:border-sky-600"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="buyer@company.com"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    Destination Country
                  </label>
                  <input
                    type="text"
                    value={createForm.destinationCountry}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        destinationCountry: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={createForm.destinationCity}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        destinationCity: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                    Incoterms
                  </label>
                  <select
                    value={createForm.incoterms}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, incoterms: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold outline-none focus:border-sky-600 cursor-pointer"
                  >
                    {INCOTERM_OPTIONS.map((inc) => (
                      <option key={inc} value={inc}>
                        {inc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                  Products &amp; Quantities Requested *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. 200x Nokia 105 DS, 50x Samsung Galaxy A56 256GB..."
                  value={createForm.productsRequired}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      productsRequired: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {creating ? "Logging..." : "Save B2B RFQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default B2BRfqManagement;

