import { useState, useMemo } from "react";
import {
  FiRepeat,
  FiPlus,
  FiSearch,
  FiCheckCircle,
  FiTruck,
  FiPackage,
  FiClock,
  FiX,
  FiAlertCircle,
  FiArrowRight,
  FiXCircle,
  FiTrash2,
  FiSend,
  FiDownload,
} from "react-icons/fi";
import PortalKpiGrid from "./PortalKpiGrid";
import CountryFlag from "../common/CountryFlag";
import { useCountry } from "../../context/CountryContext";
import {
  getLocationStockEntry,
  getSupplyHubTotals,
} from "../../services/stockService";
import {
  createTransferRequest,
  approveTransferRequest,
  rejectTransferRequest,
  dispatchTransferShipment,
  receiveTransferShipment,
  cancelTransferRequest,
} from "../../services/transferService";
import { convertAedToLocalPrice } from "../../config/locationsConfig";

const STATUS_BADGES = {
  "Pending Approval":
    "bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
  Approved:
    "bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-500/30",
  "In Transit":
    "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30",
  Received:
    "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
  Rejected:
    "bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-500/30",
  Cancelled:
    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

const StockTransfersManagement = ({
  transfers = [],
  globalStock = [],
  activePortalLocation = "AE",
  currentUser,
  isAdmin = false,
  isHubManager = false,
  canSwitchLocations = false,
  prefillSku = null,
  onClearPrefill,
  onTransfersUpdated,
}) => {
  const { allLocations, supplyHubs, getLocationByCode } = useCountry();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [busyId, setBusyId] = useState("");

  // Create Requisition Modal State
  const [showCreateModal, setShowCreateModal] = useState(Boolean(prefillSku));
  const [sourceHub, setSourceHub] = useState("AE");
  const [destinationCountry, setDestinationCountry] = useState(() => {
    if (!canSwitchLocations && activePortalLocation && activePortalLocation !== "ALL") {
      return activePortalLocation;
    }
    return activePortalLocation && !["ALL", "AE", "CN", "HK"].includes(activePortalLocation)
      ? activePortalLocation
      : "KE";
  });
  const [priority, setPriority] = useState("Normal");
  const [requestNotes, setRequestNotes] = useState("");
  const [skuSearch, setSkuSearch] = useState("");
  const [draftItems, setDraftItems] = useState(() => {
    if (!prefillSku) return [];
    return [
      {
        sku: prefillSku.sku,
        name: prefillSku.name,
        brand: prefillSku.brand,
        image: prefillSku.image || "/logo.png",
        requestedQty: 5,
        unitCostAed: Number(prefillSku.costPriceAed || prefillSku.costPrice || 0),
        unitPriceAed: Number(prefillSku.priceAed || prefillSku.price || 0),
      },
    ];
  });

  // Dispatch Modal State
  const [dispatchingTransfer, setDispatchingTransfer] = useState(null);
  const [carrier, setCarrier] = useState("DHL Express Air Cargo");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [freightCostUsd, setFreightCostUsd] = useState("120");
  const [dispatchNotes, setDispatchNotes] = useState("");

  // Receive & Landed Cost Modal State
  const [receivingTransfer, setReceivingTransfer] = useState(null);
  const [customsDutyLocal, setCustomsDutyLocal] = useState("0");
  const [localLogisticsLocal, setLocalLogisticsLocal] = useState("0");
  const [applyPriceUpdates, setApplyPriceUpdates] = useState(true);
  const [receiveNotes, setReceiveNotes] = useState("");
  const [receiveDraftLines, setReceiveDraftLines] = useState([]);

  const locationOptions = useMemo(
    () => allLocations.filter((l) => l.isActive !== false),
    [allLocations]
  );

  const hubOptions = useMemo(
    () =>
      supplyHubs.length > 0
        ? supplyHubs
        : allLocations.filter((l) => ["AE", "CN", "HK"].includes(l.code)),
    [supplyHubs, allLocations]
  );

  // Scoped transfers (country staff see transfers involving their assigned country; admins see all or active location)
  const scopedTransfers = useMemo(() => {
    return (transfers || []).filter((t) => {
      if (activePortalLocation && activePortalLocation !== "ALL") {
        const matchesRoute =
          t.sourceHub === activePortalLocation ||
          t.destinationCountry === activePortalLocation;
        if (!matchesRoute) return false;
      }
      if (statusFilter !== "All" && t.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const hit =
          (t.transferId || "").toLowerCase().includes(q) ||
          (t.sourceHub || "").toLowerCase().includes(q) ||
          (t.destinationCountry || "").toLowerCase().includes(q) ||
          (t.trackingNumber || "").toLowerCase().includes(q) ||
          (t.requestedBy || "").toLowerCase().includes(q) ||
          (t.items || []).some(
            (i) =>
              (i.sku || "").toLowerCase().includes(q) ||
              (i.name || "").toLowerCase().includes(q)
          );
        if (!hit) return false;
      }
      return true;
    });
  }, [transfers, activePortalLocation, statusFilter, search]);

  // KPI metrics
  const kpiItems = useMemo(() => {
    const pending = scopedTransfers.filter((t) => t.status === "Pending Approval").length;
    const inTransit = scopedTransfers.filter((t) => t.status === "In Transit");
    const unitsInTransit = inTransit.reduce(
      (s, t) => s + Number(t.totalDispatchedUnits || t.totalRequestedUnits || 0),
      0
    );
    const received = scopedTransfers.filter((t) => t.status === "Received").length;

    return [
      {
        label: "Pending Approval",
        value: pending,
        icon: FiClock,
        tone: pending > 0 ? "amber" : "slate",
        sub: "Awaiting supply hub review",
      },
      {
        label: "Shipments In Transit",
        value: inTransit.length,
        icon: FiTruck,
        tone: "sky",
        sub: "Dispatched from AE / CN / HK",
      },
      {
        label: "Units In Transit",
        value: unitsInTransit.toLocaleString(),
        icon: FiPackage,
        tone: "indigo",
        sub: "Pending branch verification",
      },
      {
        label: "Completed Transfers",
        value: received,
        icon: FiCheckCircle,
        tone: "emerald",
        sub: "Stock live in destination hubs",
      },
    ];
  }, [scopedTransfers]);

  // SKU Picker matches for Create Requisition Modal
  const skuMatches = useMemo(() => {
    const q = skuSearch.trim().toLowerCase();
    const list = (globalStock || []).filter((item) => {
      if (!q) return getLocationStockEntry(item, sourceHub).quantity > 0;
      return (
        (item.name || "").toLowerCase().includes(q) ||
        (item.sku || "").toLowerCase().includes(q) ||
        (item.brand || "").toLowerCase().includes(q)
      );
    });
    return list
      .sort(
        (a, b) =>
          getLocationStockEntry(b, sourceHub).quantity -
          getLocationStockEntry(a, sourceHub).quantity
      )
      .slice(0, 12);
  }, [globalStock, skuSearch, sourceHub]);

  const handleAddDraftSku = (stockItem) => {
    setDraftItems((prev) => {
      const exists = prev.find((i) => i.sku === stockItem.sku);
      if (exists) {
        return prev.map((i) =>
          i.sku === stockItem.sku
            ? { ...i, requestedQty: i.requestedQty + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          sku: stockItem.sku,
          name: stockItem.name,
          brand: stockItem.brand,
          image: stockItem.image || "/logo.png",
          requestedQty: 5,
          unitCostAed: Number(stockItem.costPrice || 0),
          unitPriceAed: Number(stockItem.price || 0),
        },
      ];
    });
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");
    setBusyId("create");
    try {
      const rec = await createTransferRequest({
        sourceHub,
        destinationCountry,
        items: draftItems,
        requestedBy: currentUser?.name || "Staff",
        priority,
        notes: requestNotes,
      });
      setShowCreateModal(false);
      setDraftItems([]);
      setRequestNotes("");
      setSkuSearch("");
      if (onClearPrefill) onClearPrefill();
      setActionSuccess(
        `Transfer request ${rec.transferId} (${rec.sourceHub} → ${rec.destinationCountry}) created.`
      );
      if (onTransfersUpdated) await onTransfersUpdated();
    } catch (err) {
      setActionError(err.message || "Could not create transfer request.");
    } finally {
      setBusyId("");
    }
  };

  const handleApprove = async (transfer) => {
    setActionError("");
    setActionSuccess("");
    setBusyId(transfer.transferId);
    try {
      await approveTransferRequest(transfer.transferId, {
        approvedBy: currentUser?.name || "Admin",
      });
      setActionSuccess(`Approved ${transfer.transferId}. Ready for warehouse dispatch.`);
      if (onTransfersUpdated) await onTransfersUpdated();
    } catch (err) {
      setActionError(err.message || "Approval failed.");
    } finally {
      setBusyId("");
    }
  };

  const handleReject = async (transfer) => {
    const reason = window.prompt(`Reason for rejecting ${transfer.transferId}:`, "Insufficient hub allocation");
    if (reason === null) return;
    setActionError("");
    setActionSuccess("");
    setBusyId(transfer.transferId);
    try {
      await rejectTransferRequest(transfer.transferId, {
        rejectedBy: currentUser?.name || "Admin",
        reason,
      });
      setActionSuccess(`Rejected transfer ${transfer.transferId}.`);
      if (onTransfersUpdated) await onTransfersUpdated();
    } catch (err) {
      setActionError(err.message || "Rejection failed.");
    } finally {
      setBusyId("");
    }
  };

  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchingTransfer) return;
    setActionError("");
    setActionSuccess("");
    setBusyId(dispatchingTransfer.transferId);
    try {
      await dispatchTransferShipment(dispatchingTransfer.transferId, {
        dispatchedBy: currentUser?.name || "Hub Manager",
        carrier,
        trackingNumber,
        freightCostUsd: Number(freightCostUsd) || 0,
        dispatchNotes,
      });
      setActionSuccess(
        `Dispatched ${dispatchingTransfer.transferId} from ${dispatchingTransfer.sourceHub} → ${dispatchingTransfer.destinationCountry}. Source stock deducted & marked In Transit.`
      );
      setDispatchingTransfer(null);
      setTrackingNumber("");
      setDispatchNotes("");
      if (onTransfersUpdated) await onTransfersUpdated();
    } catch (err) {
      setActionError(err.message || "Dispatch failed.");
    } finally {
      setBusyId("");
    }
  };

  const openReceiveModal = (transfer) => {
    const destCfg = getLocationByCode(transfer.destinationCountry);
    setReceivingTransfer(transfer);
    setCustomsDutyLocal("0");
    setLocalLogisticsLocal("0");
    setApplyPriceUpdates(true);
    setReceiveNotes("");
    setReceiveDraftLines(
      (transfer.items || []).map((item) => {
        const liveStockDoc = (globalStock || []).find(
          (s) => String(s.sku || "").toUpperCase() === String(item.sku || "").toUpperCase()
        );
        const existingDestPrice = liveStockDoc
          ? getLocationStockEntry(liveStockDoc, transfer.destinationCountry).priceLocal
          : 0;
        const refAed = Number(liveStockDoc?.price || item.unitPriceAed || 0);
        const baseCostAed = Number(item.unitCostAed || liveStockDoc?.costPrice || 0);
        const autoLocalPrice =
          existingDestPrice > 0
            ? existingDestPrice
            : convertAedToLocalPrice(refAed, destCfg, item.targetPriceLocal || 0);
        return {
          sku: item.sku,
          name: item.name,
          baseCostAed,
          dispatchedQty: Number(item.dispatchedQty || item.approvedQty || item.requestedQty || 0),
          receivedQty: Number(item.dispatchedQty || item.approvedQty || item.requestedQty || 0),
          priceLocal: autoLocalPrice,
        };
      })
    );
  };

  const handleConfirmReceive = async (e) => {
    e.preventDefault();
    if (!receivingTransfer) return;
    setActionError("");
    setActionSuccess("");
    setBusyId(receivingTransfer.transferId);
    try {
      const destCfg = getLocationByCode(receivingTransfer.destinationCountry);
      await receiveTransferShipment(receivingTransfer.transferId, {
        receivedBy: currentUser?.name || "Branch Staff",
        receivedItems: receiveDraftLines,
        destinationConfig: destCfg,
        customsDutyLocal: Number(customsDutyLocal) || 0,
        localLogisticsLocal: Number(localLogisticsLocal) || 0,
        applyPriceUpdates,
        receiveNotes,
      });
      setActionSuccess(
        `Received ${receivingTransfer.transferId} into ${destCfg.flag} ${destCfg.hubName}! Local stock & ${destCfg.currency} storefront prices are now LIVE.`
      );
      setReceivingTransfer(null);
      if (onTransfersUpdated) await onTransfersUpdated();
    } catch (err) {
      setActionError(err.message || "Receiving failed.");
    } finally {
      setBusyId("");
    }
  };

  const handleCancel = async (transfer) => {
    if (
      !window.confirm(
        `Cancel transfer ${transfer.transferId}? ${
          transfer.status === "In Transit"
            ? `Dispatched stock will be returned to [${transfer.sourceHub}].`
            : ""
        }`
      )
    ) {
      return;
    }
    setActionError("");
    setActionSuccess("");
    setBusyId(transfer.transferId);
    try {
      await cancelTransferRequest(transfer.transferId, {
        cancelledBy: currentUser?.name || "Admin",
        reason: "Cancelled in Portal",
      });
      setActionSuccess(`Cancelled ${transfer.transferId}.`);
      if (onTransfersUpdated) await onTransfersUpdated();
    } catch (err) {
      setActionError(err.message || "Cancel failed.");
    } finally {
      setBusyId("");
    }
  };

  const canApproveOrDispatch = (transfer) => {
    if (isAdmin || isHubManager) return true;
    return activePortalLocation === transfer.sourceHub;
  };

  const canReceive = (transfer) => {
    if (isAdmin) return true;
    return activePortalLocation === transfer.destinationCountry;
  };

  return (
    <div className="space-y-5 text-left">
      <PortalKpiGrid items={kpiItems} />

      {/* Notices */}
      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <FiAlertCircle className="shrink-0 text-base" />
            {actionError}
          </span>
          <button type="button" onClick={() => setActionError("")} className="cursor-pointer">
            <FiX />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <FiCheckCircle className="shrink-0 text-base" />
            {actionSuccess}
          </span>
          <button type="button" onClick={() => setActionSuccess("")} className="cursor-pointer">
            <FiX />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Transfer ID, SKU, AWB, country..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-600"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {["All", "Pending Approval", "Approved", "In Transit", "Received", "Rejected"].map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    statusFilter === st
                      ? "bg-slate-900 dark:bg-sky-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setActionError("");
            setShowCreateModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-extrabold shadow-xs transition cursor-pointer shrink-0"
        >
          <FiPlus className="text-sm" />
          <span>New Transfer Request</span>
        </button>
      </div>

      {/* Transfers List */}
      {scopedTransfers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto text-2xl">
            <FiRepeat />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No inter-hub stock transfers yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Country branches (Kenya, Senegal, Uganda, Ghana, Côte d&apos;Ivoire, Saudi Arabia) can
            submit stock requisitions from <strong>Dubai (AE)</strong>,{" "}
            <strong>China (CN)</strong>, or <strong>Hong Kong (HK)</strong> supply hubs here.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition cursor-pointer"
          >
            <FiPlus /> Create First Transfer Request
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {scopedTransfers.map((trf) => {
            const srcLoc = getLocationByCode(trf.sourceHub);
            const destLoc = getLocationByCode(trf.destinationCountry);
            const badgeCls =
              STATUS_BADGES[trf.status] || STATUS_BADGES["Pending Approval"];
            const isBusy = busyId === trf.transferId;

            return (
              <div
                key={trf.transferId}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-3.5 shadow-2xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      {trf.transferId}
                    </span>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1">
                        <CountryFlag code={trf.sourceHub} size="xs" />
                        <span>{trf.sourceHub}</span>
                      </span>
                      <FiArrowRight className="text-sky-600" />
                      <span className="inline-flex items-center gap-1">
                        <CountryFlag code={trf.destinationCountry} size="xs" />
                        <span>
                          {trf.destinationCountry} ({destLoc.currency})
                        </span>
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeCls}`}
                    >
                      {trf.status}
                    </span>

                    {trf.recoveredFromAudit && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Recovered from Audit Trail
                      </span>
                    )}

                    {trf.priority === "Urgent" && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        Urgent Air Cargo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {trf.status === "Pending Approval" && canApproveOrDispatch(trf) && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleApprove(trf)}
                          className="px-3 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition cursor-pointer disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setDispatchingTransfer(trf)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer disabled:opacity-50"
                        >
                          <FiSend className="text-xs" /> Approve &amp; Dispatch
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleReject(trf)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {trf.status === "Approved" && canApproveOrDispatch(trf) && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setDispatchingTransfer(trf)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold transition cursor-pointer disabled:opacity-50"
                      >
                        <FiTruck className="text-xs" /> Dispatch Shipment (AWB)
                      </button>
                    )}

                    {trf.status === "In Transit" && canReceive(trf) && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => openReceiveModal(trf)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold transition cursor-pointer disabled:opacity-50"
                      >
                        <FiDownload className="text-xs" /> Receive &amp; Push Live ({destLoc.code})
                      </button>
                    )}

                    {isAdmin && ["Pending Approval", "Approved", "In Transit"].includes(trf.status) && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleCancel(trf)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 font-semibold transition cursor-pointer"
                      >
                        <FiXCircle className="text-xs" /> Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Items table (or compact audit-recovered unit summary) */}
                {(trf.items || []).length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-4 font-mono">
                      <span>
                        Requested:{" "}
                        <strong className="text-slate-900 dark:text-white">
                          {Number(trf.totalRequestedUnits || 0).toLocaleString()} pcs
                        </strong>
                      </span>
                      <span>
                        Dispatched:{" "}
                        <strong className="text-indigo-700 dark:text-indigo-400">
                          {Number(trf.totalDispatchedUnits || 0).toLocaleString()} pcs
                        </strong>
                      </span>
                      <span>
                        Received:{" "}
                        <strong className="text-emerald-700 dark:text-emerald-400">
                          {Number(trf.totalReceivedUnits || 0).toLocaleString()} pcs
                        </strong>
                      </span>
                    </div>
                    {trf.skuCount > 0 && (
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {trf.skuCount} SKU{trf.skuCount === 1 ? "" : "s"} transferred
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[10.5px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                          <th className="py-1.5 text-left font-bold">SKU / Product</th>
                          <th className="py-1.5 text-right font-bold">Requested</th>
                          <th className="py-1.5 text-right font-bold">Dispatched</th>
                          <th className="py-1.5 text-right font-bold">Received</th>
                          <th className="py-1.5 text-right font-bold">
                            Hub Cost ({srcLoc.currency || "AED"})
                          </th>
                          <th className="py-1.5 text-right font-bold">
                            Dest Retail ({destLoc.currency})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                        {(trf.items || []).map((item) => (
                          <tr key={item.sku}>
                            <td className="py-2 pr-3">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {item.name}
                              </p>
                              <span className="font-mono text-[10.5px] text-slate-400">
                                {item.sku}
                              </span>
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                              {Number(item.requestedQty || 0).toLocaleString()}
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-indigo-700 dark:text-indigo-400">
                              {item.dispatchedQty
                                ? Number(item.dispatchedQty).toLocaleString()
                                : "—"}
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {item.receivedQty
                                ? Number(item.receivedQty).toLocaleString()
                                : "—"}
                            </td>
                            <td className="py-2 text-right font-mono text-slate-600 dark:text-slate-400">
                              {item.unitCostAed > 0
                                ? `${srcLoc.currencySymbol || "AED"} ${Number(
                                    item.unitCostAed
                                  ).toLocaleString()}`
                                : "—"}
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {item.appliedPriceLocal > 0
                                ? `${destLoc.currencySymbol} ${Number(
                                    item.appliedPriceLocal
                                  ).toLocaleString()}`
                                : "Auto FX"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Metadata Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Requested by <strong className="text-slate-700 dark:text-slate-200">{trf.requestedBy}</strong> ·{" "}
                      {new Date(trf.createdAt).toLocaleString()}
                    </span>
                    {trf.carrier && (
                      <span>
                        Carrier: <strong className="text-slate-700 dark:text-slate-200">{trf.carrier}</strong>
                      </span>
                    )}
                    {trf.trackingNumber && (
                      <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                        AWB: {trf.trackingNumber}
                      </span>
                    )}
                  </div>
                  {trf.notes && (
                    <span className="italic text-slate-500">Note: {trf.notes}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: CREATE INTER-HUB STOCK REQUISITION                           */}
      {/* ===================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  New Inter-Hub Stock Transfer Request
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Request stock transfer from Tier-1 Global Supply Hubs (Dubai AE, China CN, Hong Kong HK)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  if (onClearPrefill) onClearPrefill();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Source Supply Hub *
                  </label>
                  <select
                    value={sourceHub}
                    onChange={(e) => setSourceHub(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  >
                    {hubOptions.map((h) => (
                      <option key={h.code} value={h.code}>
                        {h.flag} {h.hubName} ({h.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Destination Country Hub *
                  </label>
                  <select
                    value={destinationCountry}
                    disabled={!canSwitchLocations}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white disabled:opacity-60"
                  >
                    {locationOptions.map((loc) => (
                      <option key={loc.code} value={loc.code}>
                        {loc.flag} {loc.name} — {loc.hubName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Dispatch Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Normal">Normal Consolidation</option>
                    <option value="Urgent">Urgent Air Cargo (24–48h)</option>
                  </select>
                </div>
              </div>

              {/* Live Hub Stock Picker */}
              <div className="space-y-2">
                <label className="block font-bold uppercase text-[10px] text-slate-500">
                  Add SKUs (Showing Live Supply Hub Availability: AE · CN · HK)
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={skuSearch}
                    onChange={(e) => setSkuSearch(e.target.value)}
                    placeholder="Search iPhone, Galaxy, HMD, Nokia, SKU..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-sky-600"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {skuMatches.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      No matching SKUs found. Type a model name or SKU above.
                    </div>
                  ) : (
                    skuMatches.map((item) => {
                      const hubs = getSupplyHubTotals(item);
                      const srcAvail = getLocationStockEntry(item, sourceHub).quantity;
                      return (
                        <div
                          key={item.sku}
                          className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 text-[10.5px] font-mono text-slate-500">
                              <span>{item.sku}</span>
                              <span className="px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold">
                                🇦🇪 AE: {hubs.AE} · 🇨🇳 CN: {hubs.CN} · 🇭🇰 HK: {hubs.HK}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddDraftSku(item)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition ${
                              srcAvail > 0
                                ? "bg-sky-700 hover:bg-sky-800 text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
                            }`}
                          >
                            + Add
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected Line Items */}
              {draftItems.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                  <p className="text-[10.5px] font-extrabold uppercase text-slate-500">
                    Transfer Cart ({draftItems.length} SKU{draftItems.length === 1 ? "" : "s"} /{" "}
                    {draftItems
                      .reduce((s, i) => s + Number(i.requestedQty || 0), 0)
                      .toLocaleString()}{" "}
                    units)
                  </p>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                    {draftItems.map((item) => {
                      const liveDoc = (globalStock || []).find(
                        (s) => String(s.sku || "").toUpperCase() === String(item.sku || "").toUpperCase()
                      );
                      const srcAvail = liveDoc
                        ? getLocationStockEntry(liveDoc, sourceHub).quantity
                        : 0;
                      const exceedsHub = Number(item.requestedQty || 0) > srcAvail;
                      return (
                        <div
                          key={item.sku}
                          className={`flex items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border ${
                            exceedsHub
                              ? "border-amber-300 dark:border-amber-500/40"
                              : "border-slate-200/80 dark:border-slate-800"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-mono">
                              <span className="text-slate-400">{item.sku}</span>
                              <span
                                className={
                                  exceedsHub
                                    ? "text-amber-600 dark:text-amber-400 font-bold"
                                    : "text-slate-400"
                                }
                              >
                                {sourceHub} avail: {srcAvail.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <label className="text-[10px] text-slate-400">Qty:</label>
                            <input
                              type="number"
                              min="1"
                              value={item.requestedQty}
                              onChange={(e) =>
                                setDraftItems((prev) =>
                                  prev.map((x) =>
                                    x.sku === item.sku
                                      ? {
                                          ...x,
                                          requestedQty: Math.max(
                                            1,
                                            parseInt(e.target.value, 10) || 1
                                          ),
                                        }
                                      : x
                                  )
                                )
                              }
                              className="w-24 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-center text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDraftItems((prev) =>
                                  prev.filter((x) => x.sku !== item.sku)
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                  Shipping / Allocation Notes
                </label>
                <input
                  type="text"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="e.g. Urgent Nairobi showroom replenishment — prefer sealed ME/Global spec"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    if (onClearPrefill) onClearPrefill();
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={draftItems.length === 0 || busyId === "create"}
                  className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-40 text-white font-extrabold cursor-pointer transition"
                >
                  {busyId === "create" ? "Submitting..." : "Submit Transfer Requisition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: DISPATCH SHIPMENT FROM SUPPLY HUB                            */}
      {/* ===================================================================== */}
      {dispatchingTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Dispatch {dispatchingTransfer.transferId}
                </h3>
                <p className="text-xs text-slate-500">
                  Deducts stock from [{dispatchingTransfer.sourceHub}] and moves to In-Transit for [
                  {dispatchingTransfer.destinationCountry}]
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDispatchingTransfer(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                  Freight Carrier / Airline *
                </label>
                <input
                  type="text"
                  required
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    AWB / Tracking Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AWB-176-904218"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Freight Cost (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={freightCostUsd}
                    onChange={(e) => setFreightCostUsd(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                  Dispatch Remarks
                </label>
                <input
                  type="text"
                  placeholder="Carton count, seal number, flight details..."
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDispatchingTransfer(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(busyId)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: RECEIVE GOODS, LANDED COST & PUSH LIVE TO COUNTRY STOREFRONT */}
      {/* ===================================================================== */}
      {receivingTransfer && (() => {
        const destCfg = getLocationByCode(receivingTransfer.destinationCountry);
        const totalRecvUnits = receiveDraftLines.reduce(
          (s, l) => s + Number(l.receivedQty || 0),
          0
        );
        const freightAed = (Number(receivingTransfer.freightCostUsd) || 0) * 3.6725;
        const freightLocal = convertAedToLocalPrice(freightAed, destCfg, 0);
        const sharedOverheadPerUnit =
          totalRecvUnits > 0
            ? (freightLocal +
                (Number(customsDutyLocal) || 0) +
                (Number(localLogisticsLocal) || 0)) /
              totalRecvUnits
            : 0;
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Receive {receivingTransfer.transferId} into</span>
                    <CountryFlag code={destCfg.code} size="sm" />
                    <span>{destCfg.hubName}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confirm arrived units, enter local customs duty &amp; set {destCfg.currency} retail prices
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReceivingTransfer(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleConfirmReceive} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                      Import Customs Duty ({destCfg.currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={customsDutyLocal}
                      onChange={(e) => setCustomsDutyLocal(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                      Local Port Clearance &amp; Delivery ({destCfg.currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={localLogisticsLocal}
                      onChange={(e) => setLocalLogisticsLocal(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase text-slate-500 sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 text-left">SKU / Item</th>
                        <th className="p-2.5 text-center">Shipped</th>
                        <th className="p-2.5 text-center">Received Qty</th>
                        <th className="p-2.5 text-right">
                          Est. Landed ({destCfg.currency})
                        </th>
                        <th className="p-2.5 text-right">
                          {destCfg.shortName} Retail ({destCfg.currency})
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {receiveDraftLines.map((line) => {
                        const baseLocal =
                          Number(line.baseCostAed || 0) *
                          (Number(destCfg.fxRateFromAed) || 1);
                        const estLanded = Math.round(
                          baseLocal + sharedOverheadPerUnit
                        );
                        return (
                          <tr key={line.sku}>
                            <td className="p-2.5">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {line.name}
                              </p>
                              <span className="font-mono text-[10px] text-slate-400">
                                {line.sku}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-mono text-slate-500">
                              {Number(line.dispatchedQty || 0).toLocaleString()}
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min="0"
                                value={line.receivedQty}
                                onChange={(e) =>
                                  setReceiveDraftLines((prev) =>
                                    prev.map((x) =>
                                      x.sku === line.sku
                                        ? {
                                            ...x,
                                            receivedQty: Math.max(
                                              0,
                                              parseInt(e.target.value, 10) || 0
                                            ),
                                          }
                                        : x
                                    )
                                  )
                                }
                                className="w-24 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-center"
                              />
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-500 dark:text-slate-400">
                              {estLanded > 0
                                ? `${destCfg.currencySymbol} ${estLanded.toLocaleString()}`
                                : "—"}
                            </td>
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                min="0"
                                value={line.priceLocal}
                                onChange={(e) =>
                                  setReceiveDraftLines((prev) =>
                                    prev.map((x) =>
                                      x.sku === line.sku
                                        ? {
                                            ...x,
                                            priceLocal: Math.max(
                                              0,
                                              Number(e.target.value) || 0
                                            ),
                                          }
                                        : x
                                    )
                                  )
                                }
                                className="w-28 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-right text-emerald-700 dark:text-emerald-400"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyPriceUpdates}
                    onChange={(e) => setApplyPriceUpdates(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600"
                  />
                  <span>
                    Publish local {destCfg.currency} selling prices immediately to{" "}
                    <strong className="font-mono">/{destCfg.slug}</strong> storefront
                  </span>
                </label>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setReceivingTransfer(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(busyId)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold cursor-pointer"
                  >
                    Confirm Receipt &amp; Push Stock Live
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default StockTransfersManagement;

