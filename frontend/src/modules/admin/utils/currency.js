const CURRENCY = import.meta.env.VITE_CURRENCY || '₹';

export const formatCurrency = (value, symbol = CURRENCY) => {
    if (typeof value === 'string' && value.startsWith('$')) {
        return value.replace('$', symbol);
    }

    const numberValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : value;

    if (isNaN(numberValue)) return value;

    // Use Indian locale for ₹ to get proper lakhs/crores formatting
    const locale = symbol === '₹' ? 'en-IN' : undefined;

    return `${symbol}${numberValue.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

export const getCurrency = () => CURRENCY;
