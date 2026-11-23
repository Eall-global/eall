/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";

const PortalCurrencyContext = createContext(null);

/**
 * Provides the active Back Office location's currency, symbol, locale, decimals,
 * VAT rate, and legal entity details to all portal components and `<AedPrice />`.
 */
export const PortalCurrencyProvider = ({
  locationConfig = null,
  activeLocationCode = "AE",
  children,
}) => {
  const value = useMemo(() => {
    const isAll = activeLocationCode === "ALL";
    const cfg = isAll ? null : locationConfig;
    const currency = cfg?.currency || "AED";
    const symbol = cfg?.currencySymbol || currency || "AED";
    const locale = cfg?.locale || "en-AE";
    const decimals = Number.isFinite(Number(cfg?.decimals))
      ? Number(cfg.decimals)
      : 2;
    const vatRate = Number.isFinite(Number(cfg?.vatRate))
      ? Number(cfg.vatRate)
      : 5;

    const format = (amount = 0, customDecimals = undefined) => {
      const d = customDecimals !== undefined ? customDecimals : decimals;
      const num = Number(amount) || 0;
      return `${symbol} ${num.toLocaleString(locale, {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      })}`;
    };

    const formatNumber = (amount = 0, customDecimals = undefined) => {
      const d = customDecimals !== undefined ? customDecimals : decimals;
      const num = Number(amount) || 0;
      return num.toLocaleString(locale, {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });
    };

    return {
      activeLocationCode,
      isAll,
      locationConfig: cfg || locationConfig,
      countryCode: cfg?.code || "AE",
      countryName: cfg?.name || "United Arab Emirates",
      shortName: cfg?.shortName || "UAE",
      hubName: cfg?.hubName || "Dubai Main Hub (HQ)",
      legalEntityName: cfg?.legalEntityName || "Electronics All FZCO",
      legalTaxId: cfg?.legalTaxId || "104215897200003",
      legalAddress:
        cfg?.legalAddress || "Dubai Silicon Oasis, DDP Building A2, Dubai, UAE",
      taxIdLabel: cfg?.taxIdLabel || "TRN",
      currency,
      symbol,
      locale,
      decimals,
      vatRate,
      fxRateFromAed: Number(cfg?.fxRateFromAed) || 1,
      format,
      formatNumber,
    };
  }, [locationConfig, activeLocationCode]);

  return (
    <PortalCurrencyContext.Provider value={value}>
      {children}
    </PortalCurrencyContext.Provider>
  );
};

export const usePortalCurrencyOptional = () =>
  useContext(PortalCurrencyContext);

export const usePortalCurrency = () => {
  const ctx = useContext(PortalCurrencyContext);
  if (ctx) return ctx;
  return {
    activeLocationCode: "AE",
    isAll: false,
    locationConfig: null,
    countryCode: "AE",
    countryName: "United Arab Emirates",
    shortName: "UAE",
    hubName: "Dubai Main Hub (HQ)",
    legalEntityName: "Electronics All FZCO",
    legalTaxId: "104215897200003",
    legalAddress: "Dubai Silicon Oasis, DDP Building A2, Dubai, UAE",
    taxIdLabel: "TRN",
    currency: "AED",
    symbol: "AED",
    locale: "en-AE",
    decimals: 2,
    vatRate: 5,
    fxRateFromAed: 1,
    format: (amount = 0, customDecimals = 2) =>
      `AED ${(Number(amount) || 0).toLocaleString("en-AE", {
        minimumFractionDigits: customDecimals,
        maximumFractionDigits: customDecimals,
      })}`,
    formatNumber: (amount = 0, customDecimals = 2) =>
      (Number(amount) || 0).toLocaleString("en-AE", {
        minimumFractionDigits: customDecimals,
        maximumFractionDigits: customDecimals,
      }),
  };
};

