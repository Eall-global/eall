/**
 * UAE Official Currency Formatter (د.إ / AED)
 */

export const CURRENCY_SYMBOL = "د.إ";

/**
 * Format any numerical price or currency into official UAE Dirham (د.إ) representation
 * @param {number|string} amount
 * @param {number} decimals
 * @returns {string} e.g. "د.إ 159.00"
 */
export const formatAED = (amount, decimals = 2) => {
  const val = Number(amount);
  if (isNaN(val)) return `${CURRENCY_SYMBOL} 0.00`;
  return `${CURRENCY_SYMBOL} ${val.toLocaleString("en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

/**
 * Split currency symbol and formatted number for customized typography
 * @param {number|string} amount
 * @param {number} decimals
 */
export const formatPriceParts = (amount, decimals = 2) => {
  const val = Number(amount) || 0;
  return {
    symbol: CURRENCY_SYMBOL,
    amount: val.toLocaleString("en-AE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
    value: val,
  };
};

export default formatAED;
