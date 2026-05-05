/**
 * Currency Converter Utility
 *
 * Platform base currency: USD (all gift prices are anchored to USD via gift.priceUsd).
 * All conversions: USD -> Target Currency.
 */

/**
 * Converts a USD amount to a target currency.
 * @param {number} amountUsd - The gift price in USD (gift.priceUsd)
 * @param {string} targetCurrencyCode - The currency to convert to e.g. 'INR', 'AUD'
 * @param {Object} rates - USD-base rate map from getCachedRates()
 * @returns {number|null}
 */
const convertFromUSD = (amountUsd, targetCurrencyCode, rates) => {
    if (!rates || !targetCurrencyCode || amountUsd === undefined) return null;
    
    const targetRate = rates[targetCurrencyCode.toUpperCase()];
    if (!targetRate) return null;

    // Formula: USD Amount * (Target Currency / 1 USD)
    return Number(amountUsd) * targetRate;
};

/**
 * Converts a local currency amount back to USD.
 * @param {number} amountLocal 
 * @param {string} sourceCurrencyCode 
 * @param {Object} rates 
 * @returns {number|null}
 */
const convertToUSD = (amountLocal, sourceCurrencyCode, rates) => {
    if (!rates || !sourceCurrencyCode || amountLocal === undefined) return null;

    const sourceRate = rates[sourceCurrencyCode.toUpperCase()];
    if (!sourceRate || sourceRate === 0) return null;

    // Formula: Local Amount / (Source Currency / 1 USD)
    return Number(amountLocal) / sourceRate;
};

/**
 * Formats a local amount for display with standard 2 decimal places.
 * @param {number} amount
 * @param {string} symbol - e.g. '$', '€', '₹'
 */
const formatLocalAmount = (amount, symbol = '') => {
    if (amount === null || amount === undefined || isNaN(amount)) return null;
    return `${symbol}${Number(amount).toFixed(2)}`;
};

/**
 * Builds localized currency metadata for a transaction snapshot.
 * 
 * @param {number} priceUsd - Ground truth USD price
 * @param {string} currencyCode - User's local currency code
 * @param {string} currencySymbol - User's local currency symbol
 * @param {Object} rates - Live USD rates
 */
const buildCurrencyMeta = (priceUsd, currencyCode, currencySymbol, rates) => {
    const localAmount = convertFromUSD(priceUsd, currencyCode, rates);

    return {
        priceUsd: Number(priceUsd),
        localAmount: localAmount !== null ? parseFloat(localAmount.toFixed(2)) : null,
        localCurrency: currencyCode || 'USD',
        localSymbol: currencySymbol || '$',
        formatted: formatLocalAmount(localAmount, currencySymbol)
    };
};

module.exports = { convertFromUSD, convertToUSD, formatLocalAmount, buildCurrencyMeta };
