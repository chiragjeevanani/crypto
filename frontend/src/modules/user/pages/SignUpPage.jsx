import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Zap, Phone, Search, ChevronDown, Check } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { authService } from '../../auth/services/authService';

const COUNTRY_MOBILE_DIGITS = {
    IN: 10, US: 10, GB: 10, EU: 10, AE: 9,
    OM: 8, JO: 9, CH: 9, CA: 10, AU: 9,
    SG: 8, RU: 10, FR: 9
};

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const validateEmail = (v) => {
    if (!v?.trim()) return 'Email is required';
    if (!emailRegex.test(v.trim())) return 'Invalid email format (check domain, e.g. .com, .in)';
    return '';
};
const validatePassword = (v) => {
    if (!v) return 'Password is required';
    if (v.length < 6) return 'Password must be at least 6 characters';
    if (!/\d/.test(v)) return 'Password must contain at least one number';
    if (!/[a-zA-Z]/.test(v)) return 'Password must contain at least one letter';
    return '';
};
const validatePhone = (v, countryCode = 'IN') => {
    const digits = (v || '').replace(/\D/g, '');
    const required = COUNTRY_MOBILE_DIGITS[countryCode] || 10;
    if (digits.length === 0) return 'Phone number is required';
    if (digits.length !== required) return `Phone number must be exactly ${required} digits for this country`;
    return '';
};

const validateName = (v) => {
    if (!v?.trim()) return 'Name is required';
    if (/\d/.test(v)) return 'Name should only contain alphabets';
    if (v.trim().length < 2) return 'Name is too short';
    return '';
};

export default function SignUpPage() {
    const navigate = useNavigate();
    const registerUser = useUserStore(state => state.registerUser);
    const authLoading = useUserStore(state => state.authLoading);
    const authError = useUserStore(state => state.authError);
    const setAuthError = useUserStore(state => state.setAuthError);
    const [searchParams] = useSearchParams();
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    const [isStateOpen, setIsStateOpen] = useState(false);
    const [stateSearch, setStateSearch] = useState('');
    const stateDropdownRef = useRef(null);
    
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const countryDropdownRef = useRef(null);

    // Handle click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target)) {
                setIsStateOpen(false);
            }
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
                setIsCountryOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        countryCode: 'IN',
        state: '',
        language: 'English',
        referralCode: searchParams.get('ref')?.toUpperCase() || '',
    });

    const [fieldErrors, setFieldErrors] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        country: '',
        state: '',
    });

    // Fetch countries on mount
    React.useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await authService.getCountries();
                if (res.success) {
                    setCountries(res.countries);
                }
            } catch (err) {
                console.error('Failed to fetch countries:', err);
            }
        };
        fetchCountries();
    }, []);

    const filteredStates = states.filter(s => 
        s.name.toLowerCase().includes(stateSearch.toLowerCase())
    );

    const filteredCountries = countries.filter(c => 
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
    );

    const selectedCountry = countries.find(c => c.code === formData.countryCode) || 
                          { name: 'India', code: 'IN', flag: '🇮🇳', currencySymbol: '₹' };

    // Fetch states when country changes
    React.useEffect(() => {
        const fetchStates = async () => {
            if (!formData.countryCode) return;
            setLoadingLocations(true);
            setStateSearch(''); // Reset search
            try {
                const res = await authService.getStates(formData.countryCode);
                if (res.success) {
                    setStates(res.states);
                    // Reset state selection if current state is not in new list
                    if (res.states.length > 0 && !res.states.find(s => s.name === formData.state)) {
                        setFormData(prev => ({ ...prev, state: '' }));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch states:', err);
            } finally {
                setLoadingLocations(false);
            }
        };
        fetchStates();
    }, [formData.countryCode]);

    const handleChange = (field, value) => {
        let finalValue = value;
        if (field === 'countryCode') {
            const requiredDigs = COUNTRY_MOBILE_DIGITS[value] || 10;
            if (formData.phone.length > requiredDigs) {
                setFormData(prev => ({ ...prev, phone: prev.phone.slice(0, requiredDigs) }));
            }
        }
        setFormData(prev => ({ ...prev, [field]: finalValue }));
        setAuthError('');
        // clear field error when user types
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');
        const nameErr = validateName(formData.name);
        const emailErr = validateEmail(formData.email);
        const passwordErr = validatePassword(formData.password);
        const phoneErr = validatePhone(formData.phone, formData.countryCode);
        const countryErr = formData.countryCode ? '' : 'Country is required';
        
        // Only require state if there are states available for this country
        const stateRequired = states.length > 0;
        const stateErr = (stateRequired && !formData.state) ? 'State is required' : '';

        setFieldErrors({
            name: nameErr,
            email: emailErr,
            password: passwordErr,
            phone: phoneErr,
            country: countryErr,
            state: stateErr,
        });

        if (nameErr || emailErr || passwordErr || phoneErr || countryErr || stateErr) return;

        try {
            await registerUser({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                phone: formData.phone.trim() ? formData.phone.replace(/\D/g, '') : undefined,
                countryCode: formData.countryCode,
                state: formData.state || "Default", // Provide fallback if no state selected
                language: formData.language,
                referralCode: formData.referralCode.trim().toUpperCase(),
            });
            navigate('/signin');
        } catch (err) {
            const msg = err?.message || '';
            if (msg.toLowerCase().includes('email already registered')) {
                setFieldErrors(prev => ({ ...prev, email: 'Email already registered' }));
            }
        }
    };

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4 selection:bg-primary/30">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[480px] bg-surface border rounded-2xl overflow-hidden shadow-2xl"
                style={{ borderColor: 'var(--color-border)' }}
            >
                <div className="w-full p-8">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mx-auto mb-4">
                            <ShieldCheck className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-text">Create Account</h1>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/[0-9]/.test(val)) return; // prevent typing numbers
                                        handleChange('name', val);
                                    }}
                                    className={`w-full bg-bg border rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text ${fieldErrors.name ? 'border-red-500' : 'border-surface'}`}
                                    placeholder="Jane Doe"
                                />
                            </div>
                            {fieldErrors.name && (
                                <p className="text-[10px] text-red-500 ml-1 font-bold">{fieldErrors.name}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className={`w-full bg-bg border rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text ${fieldErrors.email ? 'border-red-500' : 'border-surface'}`}
                                    placeholder="name@domain.io"
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="text-xs text-red-500 ml-1">{fieldErrors.email}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    className={`w-full bg-bg border rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text ${fieldErrors.password ? 'border-red-500' : 'border-surface'}`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {fieldErrors.password && (
                                <p className="text-xs text-red-500 ml-1">{fieldErrors.password}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Phone ({COUNTRY_MOBILE_DIGITS[formData.countryCode] || 10} digits)</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={COUNTRY_MOBILE_DIGITS[formData.countryCode] || 10}
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const required = COUNTRY_MOBILE_DIGITS[formData.countryCode] || 10;
                                        handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, required));
                                    }}
                                    className={`w-full bg-bg border rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text ${fieldErrors.phone ? 'border-red-500' : 'border-surface'}`}
                                    placeholder={`e.g. ${'1234567890'.slice(0, COUNTRY_MOBILE_DIGITS[formData.countryCode] || 10)}`}
                                />
                            </div>
                            {fieldErrors.phone && (
                                <p className="text-[10px] text-red-500 ml-1 font-bold">{fieldErrors.phone}</p>
                            )}
                        </div>
                        <div className="space-y-2 relative" ref={countryDropdownRef}>
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Country</label>
                            
                            {/* Custom Country Dropdown */}
                            <div 
                                onClick={() => setIsCountryOpen(!isCountryOpen)}
                                className={`w-full bg-bg border rounded-xl py-3.5 px-4 text-sm font-medium flex items-center justify-between cursor-pointer transition-all ${isCountryOpen ? 'border-primary ring-1 ring-primary/20' : 'border-surface'}`}
                            >
                                <span className="flex items-center gap-2 text-text">
                                    {selectedCountry.flag} {selectedCountry.name} ({selectedCountry.currencySymbol})
                                </span>
                                <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isCountryOpen ? 'rotate-180' : ''}`} />
                            </div>

                            <AnimatePresence>
                                {isCountryOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-[60] left-0 right-0 top-full mt-2 bg-surface border border-surface rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
                                    >
                                        <div className="p-2 border-b border-white/5 bg-white/5">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                                                <input 
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Search countries..."
                                                    value={countrySearch}
                                                    onChange={(e) => setCountrySearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full bg-bg border border-surface rounded-lg py-2 pl-9 pr-4 text-xs outline-none focus:border-primary/50 transition-all"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                            {filteredCountries.length > 0 ? (
                                                filteredCountries.map(c => (
                                                    <div 
                                                        key={c.code}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleChange('countryCode', c.code);
                                                            setIsCountryOpen(false);
                                                        }}
                                                        className="px-4 py-2.5 text-sm hover:bg-primary/10 cursor-pointer flex items-center justify-between group transition-colors"
                                                    >
                                                        <span className={formData.countryCode === c.code ? 'text-primary font-semibold' : 'text-text'}>
                                                            {c.flag} {c.name} ({c.currencySymbol})
                                                        </span>
                                                        {formData.countryCode === c.code && <Check className="w-4 h-4 text-primary" />}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-4 text-xs text-muted text-center italic">
                                                    No countries found matching "{countrySearch}"
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {fieldErrors.country && (
                                <p className="text-xs text-red-500 ml-1">{fieldErrors.country}</p>
                            )}
                        </div>
                        <div className="space-y-2 relative" ref={stateDropdownRef}>
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">
                                {loadingLocations ? 'Loading States...' : 'State'}
                            </label>
                            
                            {/* Custom Searchable Dropdown */}
                            <div 
                                onClick={() => !loadingLocations && setIsStateOpen(!isStateOpen)}
                                className={`w-full bg-bg border rounded-xl py-3.5 px-4 text-sm font-medium flex items-center justify-between cursor-pointer transition-all ${isStateOpen ? 'border-primary ring-1 ring-primary/20' : 'border-surface'} ${loadingLocations ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className={formData.state ? 'text-text' : 'text-muted'}>
                                    {formData.state || "Select State"}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isStateOpen ? 'rotate-180' : ''}`} />
                            </div>

                            <AnimatePresence>
                                {isStateOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-50 left-0 right-0 top-full mt-2 bg-surface border border-surface rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
                                    >
                                        <div className="p-2 border-b border-white/5 bg-white/5">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                                                <input 
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Search states..."
                                                    value={stateSearch}
                                                    onChange={(e) => setStateSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full bg-bg border border-surface rounded-lg py-2 pl-9 pr-4 text-xs outline-none focus:border-primary/50 transition-all"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                            {filteredStates.length > 0 ? (
                                                filteredStates.map(s => (
                                                    <div 
                                                        key={s.name}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleChange('state', s.name);
                                                            setIsStateOpen(false);
                                                        }}
                                                        className="px-4 py-2.5 text-sm hover:bg-primary/10 cursor-pointer flex items-center justify-between group transition-colors"
                                                    >
                                                        <span className={formData.state === s.name ? 'text-primary font-semibold' : 'text-text'}>
                                                            {s.name}
                                                        </span>
                                                        {formData.state === s.name && <Check className="w-4 h-4 text-primary" />}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-4 text-xs text-muted text-center italic">
                                                    No states found matching "{stateSearch}"
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {fieldErrors.state && (
                                <p className="text-xs text-red-500 ml-1">{fieldErrors.state}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Preferred Language</label>
                            <select
                                value={formData.language}
                                onChange={(e) => handleChange('language', e.target.value)}
                                className="w-full bg-bg border border-surface rounded-xl py-3.5 px-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text"
                            >
                                {["English", "Hindi", "Gujarati", "Marathi", "Bengali", "Telugu", "Tamil", "Kannada", "Malayalam"].map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Referral Code (Optional)</label>
                            <div className="relative group">
                                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={formData.referralCode}
                                    onChange={(e) => handleChange('referralCode', e.target.value.toUpperCase())}
                                    className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text uppercase placeholder:normal-case"
                                    placeholder="e.g. USER1234"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full bg-primary text-black font-bold uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {authLoading ? (
                                <Zap className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Sign Up <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                        {authError && <p className="text-xs text-red-500">{authError}</p>}
                    </form>
                    <p className="mt-6 text-center text-[10px] text-muted">
                        Already registered? <Link to="/signin" className="text-primary underline">Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
