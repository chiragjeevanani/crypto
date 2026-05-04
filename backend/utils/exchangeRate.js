const axios = require('axios');
const Country = require('../models/Country');

// In-memory cache: { rates, lastUpdate, expiry }
let rateCache = { rates: null, lastUpdate: null, expiry: 0 };

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetches and caches exchange rates (USD base).
 * Falls back to Country model inrValue values if API is unavailable.
 * @returns {{ rates: Object, lastUpdate: string }}
 */
const getCachedRates = async () => {
    // Return cache if still fresh
    if (rateCache.rates && Date.now() < rateCache.expiry) {
        return { rates: rateCache.rates, lastUpdate: rateCache.lastUpdate, source: 'cache' };
    }

    try {
        const apiKey = process.env.EXCHANGE_RATE_API_KEY;
        let url;

        if (apiKey) {
            url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
        } else {
            url = `https://api.exchangerate-api.com/v4/latest/USD`;
        }

        const response = await axios.get(url, { timeout: 5000 });
        let rates, lastUpdate;

        if (apiKey) {
            rates = response.data.conversion_rates;
            lastUpdate = response.data.time_last_update_utc;
        } else {
            rates = response.data.rates;
            lastUpdate = new Date(response.data.time_last_updated * 1000).toUTCString();
        }

        // Update cache
        rateCache = { rates, lastUpdate, expiry: Date.now() + CACHE_TTL_MS };
        console.log(`[ExchangeRate] ✅ Rates refreshed from LIVE API. INR=${rates['INR']}, USD=${rates['USD']}`);
        return { rates, lastUpdate, source: 'api' };

    } catch (error) {
        console.error('[ExchangeRate] API fetch failed:', error.message);

        // If we have stale cache, use it
        if (rateCache.rates) {
            console.warn('[ExchangeRate] ⚠️  API down — using stale cache as fallback.');
            return { rates: rateCache.rates, lastUpdate: rateCache.lastUpdate, source: 'stale_cache' };
        }

        // Last resort: build rates from Country model's stored inrValue
        console.warn('[ExchangeRate] Building fallback rates from Country model...');
        const countries = await Country.find({}).lean();
        const fallbackRates = { USD: 1 };
        const inrRate = countries.find(c => c.currencyCode === 'INR')?.inrValue || 83.5;

        for (const country of countries) {
            if (country.currencyCode && country.inrValue) {
                // inrValue = how many INR per 1 unit of this currency
                // We need: how many of this currency per 1 USD
                // USD→INR = inrRate, so USD→X = inrRate / inrValue
                fallbackRates[country.currencyCode] = parseFloat((inrRate / country.inrValue).toFixed(6));
            }
        }

        fallbackRates.INR = inrRate;
        const lastUpdate = new Date().toUTCString() + ' (country-model-fallback)';
        rateCache = { rates: fallbackRates, lastUpdate, expiry: Date.now() + CACHE_TTL_MS };
        console.warn('[ExchangeRate] ⚠️  Using Country model stored values as last-resort fallback.');
        return { rates: fallbackRates, lastUpdate, source: 'country_model_fallback' };
    }
};

/**
 * Legacy direct fetch (still usable for admin dashboard).
 */
const getExchangeRates = async (base = 'USD') => {
    const { rates, lastUpdate } = await getCachedRates();
    return { base: 'USD', rates, lastUpdate };
};

module.exports = { getExchangeRates, getCachedRates };
