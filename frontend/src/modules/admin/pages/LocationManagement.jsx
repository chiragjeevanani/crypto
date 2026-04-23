import React, { useEffect, useState } from 'react';
import { 
    Plus, 
    Trash2, 
    Edit3, 
    ChevronDown, 
    ChevronUp, 
    Globe, 
    MapPin, 
    Coins, 
    Search, 
    ArrowLeft,
    Save,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPageHeader } from '../components/shared';

const StateItem = ({ state, onDelete }) => (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-surface bg-bg group/state hover:border-primary/20 transition-all">
        <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-text truncate">
                {state.name}
            </p>
        </div>
        <button 
            onClick={() => onDelete(state._id)} 
            className="p-1.5 opacity-0 group-hover/state:opacity-100 hover:bg-rose-500/10 text-rose-500 rounded-md transition-all"
        >
            <Trash2 className="h-3 w-3" />
        </button>
    </div>
);

const CountryCard = ({ 
    country, 
    isExpanded, 
    onToggle, 
    onEdit, 
    onDelete, 
    states, 
    onAddState, 
    onDeleteState 
}) => {
    const [newStateName, setNewStateName] = useState('');

    return (
        <div className="space-y-2">
            <div className={`flex items-center justify-between p-4 rounded-2xl border border-surface bg-surface group transition-all hover:border-primary/30 ${isExpanded ? 'border-primary/50 shadow-xl ring-1 ring-primary/10' : ''}`}>
                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={onToggle}>
                    <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center text-2xl shadow-inner border border-surface">
                        {country.flag}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-text">{country.name}</p>
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest border border-primary/10">
                                {country.code}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1.5 text-muted">
                                <Coins className="h-3 w-3" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{country.currencyCode} ({country.currencySymbol})</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                                <span className="text-[10px] font-black uppercase tracking-tighter">1 {country.currencyCode} = ₹{country.inrValue}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mr-4">
                         <div className="text-right hidden sm:block">
                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">States</p>
                            <p className="text-xs font-black text-text">{country.stateCount || 0}</p>
                         </div>
                         <div className={`w-8 h-8 rounded-lg bg-bg flex items-center justify-center text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 border-l border-surface pl-2 ml-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggle(); }} 
                        className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-primary text-black' : 'text-muted hover:text-primary hover:bg-primary/10'}`}
                        title="Manage States"
                    >
                        <MapPin className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(country); }} 
                        className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                        title="Edit Country"
                    >
                        <Edit3 className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(country.code); }} 
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Delete Country"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="ml-8 mt-2 p-6 rounded-2xl border border-surface bg-bg/50 space-y-6 border-l-4 border-l-primary/30 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-primary" />
                                    Regional Nodes
                                </h4>
                                <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                    {states?.length || 0} Total
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30" />
                                    <input
                                        value={newStateName}
                                        onChange={(e) => setNewStateName(e.target.value)}
                                        placeholder="Add new state/region..."
                                        className="w-full rounded-xl border border-surface bg-bg pl-10 pr-4 py-2.5 text-xs text-text outline-none focus:border-primary transition-all font-medium"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newStateName.trim()) {
                                                onAddState(country.code, newStateName.trim());
                                                setNewStateName('');
                                            }
                                        }}
                                    />
                                </div>
                                <button 
                                    onClick={() => {
                                        if (newStateName.trim()) {
                                            console.log("Adding state:", { countryCode: country.code, name: newStateName.trim() });
                                            onAddState(country.code, newStateName.trim());
                                            setNewStateName('');
                                        }
                                    }} 
                                    className="px-4 py-2.5 rounded-xl bg-primary text-black text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {states?.length > 0 ? (
                                    states.map(state => (
                                        <StateItem 
                                            key={state._id} 
                                            state={state} 
                                            onDelete={onDeleteState}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full py-10 text-center border-2 border-dashed border-surface rounded-2xl bg-surface/20">
                                        <p className="text-[10px] text-muted italic font-bold uppercase tracking-widest opacity-30">No regional data mapped</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function LocationManagement() {
    const { 
        countries, 
        states, 
        loadCountries, 
        loadStates, 
        saveCountry, 
        deleteCountry, 
        addState: createNewState, 
        deleteState,
        isLoading
    } = useAdminStore();

    const [isAddingCountry, setIsAddingCountry] = useState(false);
    const [editingCountry, setEditingCountry] = useState(null);
    const [expandedCode, setExpandedCode] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [form, setForm] = useState({
        name: '',
        code: '',
        currencyCode: '',
        currencySymbol: '',
        flag: '',
        inrValue: 1
    });

    useEffect(() => {
        loadCountries();
    }, [loadCountries]);

    useEffect(() => {
        if (expandedCode) {
            loadStates(expandedCode);
        }
    }, [expandedCode, loadStates]);

    const handleSaveCountry = async (e) => {
        e.preventDefault();
        try {
            await saveCountry(form);
            setIsAddingCountry(false);
            setEditingCountry(null);
            setForm({ name: '', code: '', currencyCode: '', currencySymbol: '', flag: '', inrValue: 1 });
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (country) => {
        setForm(country);
        setEditingCountry(country.code);
        setIsAddingCountry(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteCountry = async (code) => {
        if (window.confirm(`Are you sure? This will delete ${code} and all its states.`)) {
            await deleteCountry(code);
        }
    };

    const filteredCountries = countries.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            <AdminPageHeader 
                title="Global Location Manager"
                subtitle="Manage country protocol, currency valuation, and regional nodes."
                actions={
                    <button 
                        onClick={() => setIsAddingCountry(!isAddingCountry)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                    >
                        {isAddingCountry ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {isAddingCountry ? 'Cancel Entry' : 'Add New Country'}
                    </button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Section */}
                <AnimatePresence>
                    {isAddingCountry && (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="lg:col-span-4"
                        >
                            <div className="bg-surface border border-surface rounded-[32px] p-8 shadow-2xl sticky top-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-base font-black text-text uppercase tracking-tight">
                                        {editingCountry ? 'Update Protocol' : 'New Country Node'}
                                    </h3>
                                </div>

                                <form onSubmit={handleSaveCountry} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Name</label>
                                            <input 
                                                required
                                                value={form.name}
                                                onChange={e => setForm({...form, name: e.target.value})}
                                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-primary transition-all font-bold"
                                                placeholder="e.g. India"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">ISO Code</label>
                                            <input 
                                                required
                                                maxLength={2}
                                                value={form.code}
                                                disabled={!!editingCountry}
                                                onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-primary transition-all font-bold disabled:opacity-50"
                                                placeholder="IN"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Currency Code</label>
                                            <input 
                                                required
                                                value={form.currencyCode}
                                                onChange={e => setForm({...form, currencyCode: e.target.value.toUpperCase()})}
                                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-primary transition-all font-bold"
                                                placeholder="INR"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Symbol</label>
                                            <input 
                                                required
                                                value={form.currencySymbol}
                                                onChange={e => setForm({...form, currencySymbol: e.target.value})}
                                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-primary transition-all font-bold text-center"
                                                placeholder="₹"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Flag Emoji</label>
                                            <input 
                                                required
                                                value={form.flag}
                                                onChange={e => setForm({...form, flag: e.target.value})}
                                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-primary transition-all font-bold text-center text-xl"
                                                placeholder="🇮🇳"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">INR Value (1 Unit)</label>
                                            <input 
                                                type="number"
                                                step="0.01"
                                                required
                                                value={form.inrValue}
                                                onChange={e => setForm({...form, inrValue: parseFloat(e.target.value)})}
                                                className="w-full bg-bg border border-surface rounded-xl px-4 py-3 text-sm text-emerald-500 outline-none focus:border-emerald-500/50 transition-all font-black"
                                                placeholder="1.0"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-primary text-black font-black uppercase tracking-[0.2em] py-4 rounded-2xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        {editingCountry ? 'Commit Changes' : 'Initialize Node'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* List Section */}
                <div className={`${isAddingCountry ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
                    <div className="bg-surface border border-surface rounded-[32px] p-8 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center border border-surface">
                                    <Search className="w-4 h-4 text-muted" />
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <input 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-transparent text-sm font-bold text-text outline-none placeholder:text-muted/40 placeholder:uppercase placeholder:tracking-widest"
                                        placeholder="Filter countries..."
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] opacity-40">Cluster Nodes</p>
                                    <p className="text-base font-black text-text">{countries.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredCountries.length > 0 ? (
                                filteredCountries.map(country => (
                                    <CountryCard 
                                        key={country.code}
                                        country={country}
                                        isExpanded={expandedCode === country.code}
                                        onToggle={() => setExpandedCode(expandedCode === country.code ? null : country.code)}
                                        onEdit={handleEdit}
                                        onDelete={handleDeleteCountry}
                                        states={states}
                                        onAddState={(code, name) => createNewState({ countryCode: code, name })}
                                        onDeleteState={deleteState}
                                    />
                                ))
                            ) : (
                                <div className="py-20 text-center border-2 border-dashed border-surface rounded-[32px] bg-bg/20">
                                    < Globe className="w-12 h-12 text-muted mx-auto mb-4 opacity-20" />
                                    <p className="text-xs font-black text-muted uppercase tracking-[0.3em] opacity-40">No matching nodes discovered</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
