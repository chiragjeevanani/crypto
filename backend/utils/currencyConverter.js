/**
 * Currency Converter Utility
 *
 * Platform base currency: INR (all gift prices are stored in INR via gift.price).
 * Exchange rates are USD-based (e.g., rates.INR = 83.5, rates.USD = 1, rates.AUD = 1.52).
 *
 * Direct conversion formula (no coins involved):
 *   amountINR / rates.INR * rates[targetCurrency] = targetAmount
 *
 * Example: ₹2 INR → USD
 *   2 / 83.5 * 1 = $0.024
 */

/**
 * Converts an INR amount directly to the target currency.
 * @param {number} amountINR - The gift price in INR (gift.price from Gift model)
 * @param {string} targetCurrencyCode - Receiver's currency e.g. 'USD', 'AUD', 'GBP'
 * @param {Object} rates - USD-base rate map from getCachedRates()
 * @returns {number|null} Converted amount in target currency, or null if unavailable
 */
const convertFromINR = (amountINR, targetCurrencyCode, rates) => {
    if (!rates || !targetCurrencyCode || !amountINR) return null;

    const inrRate = rates['INR'];
    const targetRate = rates[targetCurrencyCode.toUpperCase()];

    if (!inrRate || !targetRate || inrRate === 0) return null;

    // Direct: INR → USD base → target currency
    return (amountINR / inrRate) * targetRate;
};

/**
 * Formats a local amount for display with smart decimal precision.
 * @param {number} amount
 * @param {string} symbol - e.g. '$', '€', '₹'
 * @returns {string|null} e.g. "$0.0241" or "€1.25"
 */
const formatLocalAmount = (amount, symbol = '') => {
    if (amount === null || amount === undefined || isNaN(amount)) return null;
    const decimals = Math.abs(amount) >= 1 ? 2 : 4;
    return `${symbol}${amount.toFixed(decimals)}`;
};

/**
 * Builds the localized currency meta object for a gift transaction.
 * Uses gift.price (INR) directly — no coins or coinRate in the formula.
 *
 * @param {number} giftPriceINR - The gift's price in INR (gift.price)
 * @param {string} currencyCode - Recipient's registered currency code
 * @param {string} currencySymbol - Recipient's registered currency symbol
 * @param {Object} rates - USD-based rate map from getCachedRates()
 * @returns {{ inrAmount, localAmount, localCurrency, localSymbol, formatted }}
 */
const buildCurrencyMeta = (giftPriceINR, currencyCode, currencySymbol, rates) => {
    const localAmount = convertFromINR(giftPriceINR, currencyCode, rates);

    return {
        inrAmount: parseFloat(Number(giftPriceINR).toFixed(4)),
        localAmount: localAmount !== null ? parseFloat(localAmount.toFixed(6)) : null,
        localCurrency: currencyCode || 'INR',
        localSymbol: currencySymbol || '₹',
        formatted: formatLocalAmount(localAmount, currencySymbol)
    };
};

module.exports = { convertFromINR, formatLocalAmount, buildCurrencyMeta };
