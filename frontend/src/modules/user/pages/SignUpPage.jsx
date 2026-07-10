import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Zap, Phone, Search, ChevronDown, Check, Globe, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { authService } from '../../auth/services/authService';
import axios from 'axios';
import { X } from 'lucide-react';

// Correct mobile number digit counts per country (excluding dial code prefix)
const PHONE_DIGITS = {
    IN: 10, US: 10, GB: 10, CA: 10, AU: 9,
    AE: 9,  SA: 9,  SG: 8,  MY: 9,  PH: 10,
    ID: 9,  PK: 10, BD: 10, NP: 10, LK: 9,
    DE: 10, FR: 9,  IT: 10, ES: 9,  NL: 9,
    RU: 10, CN: 11, JP: 10, KR: 10, HK: 8,
    TW: 9,  TH: 9,  VN: 9,  MM: 9,  KH: 9,
    NG: 10, ZA: 9,  KE: 9,  GH: 9,  ET: 9,
    EG: 10, MA: 9,  TZ: 9,  UG: 9,  ZM: 9,
    BR: 11, MX: 10, AR: 10, CO: 10, CL: 9,
    PE: 9,  VE: 10, EC: 9,  BO: 8,  PY: 9,
    NZ: 9,  FJ: 7,  PG: 8,  IR: 10, IQ: 10,
    TR: 10, IL: 9,  JO: 9,  LB: 8,  QA: 8,
    KW: 8,  BH: 8,  OM: 8,  YE: 9,  SY: 9,
    PL: 9,  UA: 9,  RO: 9,  CZ: 9,  HU: 9,
    PT: 9,  GR: 10, SE: 9,  NO: 8,  FI: 10,
    DK: 8,  CH: 9,  AT: 10, BE: 9,  IE: 9,
};

/**
 * Returns how many digits the phone number for a given country should have.
 * Priority: 1) PHONE_DIGITS static map  2) Backend API country data  3) Default 10
 */
const getPhoneLength = (countryCode, countries) => {
    if (PHONE_DIGITS[countryCode]) return PHONE_DIGITS[countryCode];
    const country = countries?.find(c => c.code === countryCode);
    return country?.mobileDigits || country?.phoneDigits || 10;
};


// Comprehensive ISO-3166 country code to dial code map
const DIAL_CODES = {
    IN: '+91',  US: '+1',   GB: '+44',  AU: '+61',  CA: '+1',
    AE: '+971', SA: '+966', SG: '+65',  MY: '+60',  PH: '+63',
    ID: '+62',  PK: '+92',  BD: '+880', NP: '+977', LK: '+94',
    DE: '+49',  FR: '+33',  IT: '+39',  ES: '+34',  NL: '+31',
    RU: '+7',   CN: '+86',  JP: '+81',  KR: '+82',  HK: '+852',
    TW: '+886', TH: '+66',  VN: '+84',  MM: '+95',  KH: '+855',
    NG: '+234', ZA: '+27',  KE: '+254', GH: '+233', ET: '+251',
    EG: '+20',  MA: '+212', TZ: '+255', UG: '+256', ZM: '+260',
    BR: '+55',  MX: '+52',  AR: '+54',  CO: '+57',  CL: '+56',
    PE: '+51',  VE: '+58',  EC: '+593', BO: '+591', PY: '+595',
    NZ: '+64',  FJ: '+679', PG: '+675', IR: '+98',  IQ: '+964',
    TR: '+90',  IL: '+972', JO: '+962', LB: '+961', QA: '+974',
    KW: '+965', BH: '+973', OM: '+968', YE: '+967', SY: '+963',
    PL: '+48',  UA: '+380', RO: '+40',  CZ: '+420', HU: '+36',
    PT: '+351', GR: '+30',  SE: '+46',  NO: '+47',  FI: '+358',
    DK: '+45',  CH: '+41',  AT: '+43',  BE: '+32',  IE: '+353',
};

const getDialCode = (countryCode) => DIAL_CODES[countryCode] || '';


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
const validatePhone = (v, requiredLength = 10) => {
    const digits = (v || '').replace(/\D/g, '');
    if (digits.length === 0) return 'Phone number is required';
    if (digits.length !== requiredLength) return `Phone number must be exactly ${requiredLength} digits for this country`;
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
    const [showPassword, setShowPassword] = useState(false);

    // Step 1: Form, Step 2: OTP Verification
    const [step, setStep] = useState(() => searchParams.get('verify') === 'true' ? 2 : 1);
    const [registeredEmail, setRegisteredEmail] = useState(() => searchParams.get('email') || '');
    const [otp, setOtp] = useState('');
    const verifyEmail = useUserStore(state => state.verifyEmail);


    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    const [isStateOpen, setIsStateOpen] = useState(false);
    const [stateSearch, setStateSearch] = useState('');
    const stateDropdownRef = useRef(null);
    
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const countryDropdownRef = useRef(null);

    // Phone dial code prefix picker
    const [isPhoneDialOpen, setIsPhoneDialOpen] = useState(false);
    const [phoneDialSearch, setPhoneDialSearch] = useState('');
    const phoneDialRef = useRef(null);

    // Modal state for terms and privacy
    const [modalConfig, setModalConfig] = useState({ open: false, type: '', content: '', loading: false });

    const openModal = async (type) => {
        setModalConfig({ open: true, type, content: '', loading: true });
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/config`);
            if (res.data.success) {
                const content = type === 'terms' ? res.data.config.termsAndConditions : res.data.config.privacyPolicy;
                setModalConfig({ open: true, type, content: content || `No ${type} available.`, loading: false });
            }
        } catch (err) {
            setModalConfig({ open: true, type, content: 'Failed to load content.', loading: false });
        }
    };

    // Handle click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target)) {
                setIsStateOpen(false);
            }
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
                setIsCountryOpen(false);
            }
            if (phoneDialRef.current && !phoneDialRef.current.contains(event.target)) {
                setIsPhoneDialOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const FORM_STORAGE_KEY = 'signup_form_draft_v1';

    // Load persisted draft from sessionStorage (tab-scoped — not shared between users/tabs)
    const loadDraft = () => {
        try {
            const raw = sessionStorage.getItem(FORM_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const draft = loadDraft();
    const refCode = searchParams.get('ref')?.toUpperCase() || '';

    const [formData, setFormData] = useState({
        name: draft?.name || '',
        email: draft?.email || '',
        password: '',              // never persist password
        phone: draft?.phone || '',
        countryCode: draft?.countryCode || 'IN',
        state: draft?.state || '',
        language: draft?.language || 'English',
        // URL referral code takes priority over draft
        referralCode: refCode || draft?.referralCode || '',
        agreedToTerms: draft?.agreedToTerms || false,
    });

    const [fieldErrors, setFieldErrors] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        country: '',
        state: '',
        agreedToTerms: '',
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
            // Trim phone if it's longer than the new country's allowed digits
            const requiredDigs = getPhoneLength(value, countries);
            const currentDigits = formData.phone.replace(/\D/g, '');
            if (currentDigits.length > requiredDigs) {
                finalValue = value; // keep the new countryCode as finalValue
                // Trim phone inside the setFormData below atomically
                setFormData(prev => {
                    const trimmed = currentDigits.slice(0, requiredDigs);
                    const next = { ...prev, countryCode: value, phone: trimmed };
                    try {
                        const { password: _pw, ...safeDraft } = next;
                        sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(safeDraft));
                    } catch { /* ignore */ }
                    return next;
                });
                setAuthError('');
                return; // early return — state already updated above
            }
        }
        setFormData(prev => {
            const next = { ...prev, [field]: finalValue };
            // Persist draft to sessionStorage on every change (except password)
            try {
                const { password: _pw, ...safeDraft } = next;
                sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(safeDraft));
            } catch { /* ignore storage errors */ }
            return next;
        });
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
        const phoneErr = validatePhone(formData.phone, getPhoneLength(formData.countryCode, countries));
        const countryErr = formData.countryCode ? '' : 'Country is required';
        
        // Only require state if there are states available for this country
        const stateRequired = states.length > 0;
        const stateErr = (stateRequired && !formData.state) ? 'State is required' : '';
        const agreedErr = !formData.agreedToTerms ? 'You must agree to the Terms and Privacy Policy' : '';

        setFieldErrors({
            name: nameErr,
            email: emailErr,
            password: passwordErr,
            phone: phoneErr,
            country: countryErr,
            state: stateErr,
            agreedToTerms: agreedErr,
        });

        if (nameErr || emailErr || passwordErr || phoneErr || countryErr || stateErr || agreedErr) return;

        try {
            const res = await registerUser({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                phone: formData.phone.trim() ? formData.phone.replace(/\D/g, '') : undefined,
                countryCode: formData.countryCode,
                state: formData.state || "Default", // Provide fallback if no state selected
                language: formData.language,
                referralCode: formData.referralCode.trim().toUpperCase(),
                agreedToTerms: formData.agreedToTerms,
            });
            if (res?.requireVerification) {
                setRegisteredEmail(formData.email.trim());
                setStep(2);
                setAuthError('');
            } else {
                // Clear draft on successful registration so next user starts fresh
                sessionStorage.removeItem(FORM_STORAGE_KEY);
                navigate('/home');
            }
        } catch (err) {
            const msg = err?.message || '';
            if (msg.toLowerCase().includes('email already registered')) {
                setFieldErrors(prev => ({ ...prev, email: 'Email already registered' }));
            } else if (msg.toLowerCase().includes('phone') || msg.toLowerCase().includes('digit')) {
                // Route any phone-related backend error to the phone field (shows under input, not after button)
                setFieldErrors(prev => ({ ...prev, phone: msg }));
            }
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.length !== 4) return;
        try {
            await verifyEmail(registeredEmail, otp);
            sessionStorage.removeItem(FORM_STORAGE_KEY);
            alert("Email verified successfully! You can now sign in.");
            navigate('/signin');
        } catch (err) {
            // Error is handled by store and displayed via authError
        }
    };

    const handleResendOtp = async () => {
        try {
            await authService.resendVerification(registeredEmail);
            alert("A new OTP has been sent to your email.");
        } catch (err) {
            alert(err.message || "Failed to resend OTP");
        }
    };

    return (
        <div className="min-h-screen bg-bg flex flex-col py-8 px-4 selection:bg-primary/30">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[480px] m-auto bg-surface border rounded-2xl shadow-2xl relative"
                style={{ borderColor: 'var(--color-border)' }}
            >
                <div className="w-full p-8">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mx-auto mb-4">
                            <ShieldCheck className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-text">
                            {step === 1 ? "Create Account" : "Verify Email"}
                        </h1>
                        {step === 2 && (
                            <p className="text-xs text-muted mt-2">
                                We've sent a 4-digit OTP to {registeredEmail}. It is valid for 10 minutes.
                            </p>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                    <motion.form 
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleSubmit} 
                        className="space-y-5"
                    >
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
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    className={`w-full bg-bg border rounded-xl py-3.5 pl-12 pr-12 text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text ${fieldErrors.password ? 'border-red-500' : 'border-surface'}`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="text-xs text-red-500 ml-1">{fieldErrors.password}</p>
                            )}
                        </div>
                        {/* ── Phone with Dial Code Prefix ── */}
                        <div className="space-y-2 relative" ref={phoneDialRef}>
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">
                                Phone Number ({getPhoneLength(formData.countryCode, countries)} digits)
                            </label>
                            <div className={`flex items-stretch bg-bg border rounded-xl overflow-visible transition-all ${fieldErrors.phone ? 'border-red-500' : 'border-surface'}`}>
                                {/* Dial code prefix button */}
                                <button
                                    type="button"
                                    onClick={() => { setIsPhoneDialOpen(v => !v); setPhoneDialSearch(''); }}
                                    className="flex items-center gap-1.5 pl-3 pr-2 py-3.5 border-r text-sm font-semibold shrink-0 transition-colors hover:bg-primary/10 rounded-l-xl cursor-pointer"
                                    style={{ borderColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                                >
                                    <span className="text-base leading-none">
                                        {countries.find(c => c.code === formData.countryCode)?.flag || '🌍'}
                                    </span>
                                    <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                                        {getDialCode(formData.countryCode) || '+?'}
                                    </span>
                                    <ChevronDown size={12} className={`transition-transform ${isPhoneDialOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--color-muted)' }} />
                                </button>

                                {/* Actual phone number input */}
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const required = getPhoneLength(formData.countryCode, countries);
                                        const digits = e.target.value.replace(/\D/g, '').slice(0, required);
                                        handleChange('phone', digits);
                                    }}
                                    className="flex-1 bg-transparent px-3 py-3.5 text-sm font-medium outline-none text-text min-w-0"
                                    placeholder={`e.g. ${'9876543210'.slice(0, getPhoneLength(formData.countryCode, countries))}`}
                                />
                            </div>

                            {/* Dial code searchable dropdown */}
                            <AnimatePresence>
                                {isPhoneDialOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute z-[70] left-0 right-0 mt-1 rounded-xl shadow-2xl overflow-hidden"
                                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                                    >
                                        {/* Search */}
                                        <div className="p-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Search country or dial code..."
                                                    value={phoneDialSearch}
                                                    onChange={(e) => setPhoneDialSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full rounded-lg py-2 pl-9 pr-4 text-xs outline-none"
                                                    style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                                                />
                                            </div>
                                        </div>
                                        {/* Country list */}
                                        <div className="max-h-52 overflow-y-auto">
                                            {countries
                                                .filter(c => {
                                                    const q = phoneDialSearch.toLowerCase();
                                                    const dial = getDialCode(c.code);
                                                    return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || dial.includes(q);
                                                })
                                                .map(c => {
                                                    const dial = getDialCode(c.code);
                                                    const isSelected = formData.countryCode === c.code;
                                                    return (
                                                        <div
                                                            key={c.code}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleChange('countryCode', c.code);
                                                                setIsPhoneDialOpen(false);
                                                                setPhoneDialSearch('');
                                                            }}
                                                            className="flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors"
                                                            style={{
                                                                background: isSelected ? 'var(--color-primary)10' : 'transparent',
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--color-primary-rgb, 245,158,11), 0.08)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(var(--color-primary-rgb, 245,158,11), 0.08)' : 'transparent'}
                                                        >
                                                            <span className="flex items-center gap-2.5 text-sm" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                                                                <span className="text-lg leading-none">{c.flag}</span>
                                                                <span className={isSelected ? 'font-bold' : 'font-medium'}>{c.name}</span>
                                                            </span>
                                                            <span className="text-xs font-bold tabular-nums ml-2 shrink-0" style={{ color: dial ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                                                                {dial || '—'}
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            }
                                            {countries.filter(c => {
                                                const q = phoneDialSearch.toLowerCase();
                                                return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || getDialCode(c.code).includes(q);
                                            }).length === 0 && (
                                                <div className="px-4 py-6 text-center text-xs italic" style={{ color: 'var(--color-muted)' }}>
                                                    No countries matching "{phoneDialSearch}"
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

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

                        <div className="space-y-1">
                            <label className="flex items-start gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={formData.agreedToTerms}
                                    onChange={(e) => handleChange('agreedToTerms', e.target.checked)}
                                    className="w-4 h-4 mt-0.5 rounded border-surface text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                                />
                                <span className="text-[11px] text-muted font-medium group-hover:text-text transition-colors">
                                    I agree to the <button type="button" className="text-primary hover:underline" onClick={e => { e.preventDefault(); e.stopPropagation(); openModal('terms'); }}>Terms & Conditions</button> and <button type="button" className="text-primary hover:underline" onClick={e => { e.preventDefault(); e.stopPropagation(); openModal('privacy'); }}>Privacy Policy</button>
                                </span>
                            </label>
                            {fieldErrors.agreedToTerms && (
                                <p className="text-[10px] text-red-500 ml-6 font-bold">{fieldErrors.agreedToTerms}</p>
                            )}
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
                        {authError && <p className="text-xs text-red-500 text-center mt-2">{authError}</p>}
                    </motion.form>
                        ) : (
                            <motion.form 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerify} 
                                className="space-y-5"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">4-Digit OTP</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            maxLength={4}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-bg border border-surface rounded-xl py-3.5 pl-12 pr-4 text-center tracking-[0.5em] text-lg font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all text-text uppercase placeholder:tracking-normal placeholder:font-medium placeholder:text-sm"
                                            placeholder="e.g. 1234"
                                            required
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
                                            Verify & Continue <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                                {authError && <p className="text-xs text-red-500 text-center mt-2">{authError}</p>}
                                
                                <div className="flex flex-col items-center gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        className="text-xs font-medium text-primary hover:underline"
                                    >
                                        Resend OTP
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setStep(1); setAuthError(''); }}
                                        className="text-xs text-muted hover:text-text transition-colors"
                                    >
                                        Back to Details
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {step === 1 && (
                        <p className="mt-6 text-center text-[10px] text-muted">
                            Already registered? <Link to="/signin" className="text-primary underline">Sign in</Link>
                        </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted font-medium">
                        <Link to="/terms-conditions" className="hover:text-primary transition-colors">Terms & Conditions</Link>
                        <span>•</span>
                        <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                        <span>•</span>
                        <Link to="/support" className="hover:text-primary transition-colors">Support Center</Link>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {modalConfig.open && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
                        onClick={() => setModalConfig({ ...modalConfig, open: false })}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-2xl max-h-[80vh] bg-surface border border-border rounded-2xl overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-4 border-b border-border flex justify-between items-center bg-bg">
                                <h2 className="text-lg font-bold text-text">
                                    {modalConfig.type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
                                </h2>
                                <button 
                                    onClick={() => setModalConfig({ ...modalConfig, open: false })} 
                                    className="p-2 hover:bg-surface rounded-full transition-colors text-muted hover:text-text"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto whitespace-pre-wrap text-sm text-sub custom-scrollbar bg-surface" style={{ maxHeight: 'calc(80vh - 70px)' }}>
                                {modalConfig.loading ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted">
                                        <Zap className="w-8 h-8 animate-spin mb-4 text-primary" />
                                        <p>Loading document...</p>
                                    </div>
                                ) : (
                                    modalConfig.content
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
