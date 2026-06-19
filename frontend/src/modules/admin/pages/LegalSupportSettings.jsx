import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useUserStore } from '../../user/store/useUserStore';

export default function LegalSupportSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        termsAndConditions: '',
        privacyPolicy: '',
        nftTermsAndConditions: '',
        supportEmail: '',
        supportMobile: '',
        faqs: []
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const token = useUserStore.getState().token;
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/admin/config`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                const c = res.data.config;
                setConfig({
                    termsAndConditions: c.termsAndConditions || '',
                    privacyPolicy: c.privacyPolicy || '',
                    nftTermsAndConditions: c.nftTermsAndConditions || '',
                    supportEmail: c.supportEmail || '',
                    supportMobile: c.supportMobile || '',
                    faqs: c.faqs || []
                });
            }
        } catch (err) {
            alert("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = useUserStore.getState().token;
            const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/admin/config`, config, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                alert('Settings saved successfully');
            } else {
                alert(res.data.message || 'Failed to save settings');
            }
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAddFaq = () => {
        setConfig({
            ...config,
            faqs: [...config.faqs, { question: '', answer: '' }]
        });
    };

    const handleUpdateFaq = (index, field, value) => {
        const newFaqs = [...config.faqs];
        newFaqs[index][field] = value;
        setConfig({ ...config, faqs: newFaqs });
    };

    const handleRemoveFaq = (index) => {
        const newFaqs = [...config.faqs];
        newFaqs.splice(index, 1);
        setConfig({ ...config, faqs: newFaqs });
    };

    if (loading) {
        return <div className="p-8 text-center text-muted">Loading settings...</div>;
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold">Legal & Support</h1>
                <p className="text-sm text-muted">Manage the app's Terms & Conditions, Privacy Policy, and Support Info.</p>
            </div>

            <div className="bg-surface rounded-xl p-6 border border-border shadow-sm space-y-6">
                <h2 className="text-lg font-bold">Legal Documents</h2>
                
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Terms & Conditions</label>
                    <textarea 
                        className="w-full bg-bg border border-border rounded-lg p-3 text-sm min-h-[150px] outline-none focus:ring-1 focus:ring-primary/50"
                        value={config.termsAndConditions}
                        onChange={e => setConfig({...config, termsAndConditions: e.target.value})}
                        placeholder="Enter terms and conditions text..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold">Privacy Policy</label>
                    <textarea 
                        className="w-full bg-bg border border-border rounded-lg p-3 text-sm min-h-[150px] outline-none focus:ring-1 focus:ring-primary/50"
                        value={config.privacyPolicy}
                        onChange={e => setConfig({...config, privacyPolicy: e.target.value})}
                        placeholder="Enter privacy policy text..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold">NFT Terms & Conditions</label>
                    <textarea 
                        className="w-full bg-bg border border-border rounded-lg p-3 text-sm min-h-[150px] outline-none focus:ring-1 focus:ring-primary/50"
                        value={config.nftTermsAndConditions}
                        onChange={e => setConfig({...config, nftTermsAndConditions: e.target.value})}
                        placeholder="Enter terms and conditions specifically for NFT creation..."
                    />
                </div>
            </div>

            <div className="bg-surface rounded-xl p-6 border border-border shadow-sm space-y-6">
                <h2 className="text-lg font-bold">Support Contact</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Support Email</label>
                        <input 
                            type="email"
                            className="w-full bg-bg border border-border rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                            value={config.supportEmail}
                            onChange={e => setConfig({...config, supportEmail: e.target.value})}
                            placeholder="e.g. support@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Support Mobile</label>
                        <input 
                            type="text"
                            className="w-full bg-bg border border-border rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                            value={config.supportMobile}
                            onChange={e => setConfig({...config, supportMobile: e.target.value})}
                            placeholder="e.g. +1 234 567 890"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-surface rounded-xl p-6 border border-border shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">Frequently Asked Questions (FAQs)</h2>
                    <button 
                        onClick={handleAddFaq}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-1"
                    >
                        <Plus size={14} /> Add FAQ
                    </button>
                </div>
                
                <div className="space-y-4">
                    {config.faqs.length === 0 && (
                        <p className="text-sm text-muted text-center py-4">No FAQs added yet.</p>
                    )}
                    {config.faqs.map((faq, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-bg border border-border space-y-3 relative group">
                            <button 
                                onClick={() => handleRemoveFaq(idx)}
                                className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                            <input 
                                type="text"
                                className="w-full bg-surface border border-border rounded-md p-2 text-sm font-bold outline-none pr-8"
                                placeholder="Question"
                                value={faq.question}
                                onChange={e => handleUpdateFaq(idx, 'question', e.target.value)}
                            />
                            <textarea 
                                className="w-full bg-surface border border-border rounded-md p-2 text-sm outline-none min-h-[60px]"
                                placeholder="Answer"
                                value={faq.answer}
                                onChange={e => handleUpdateFaq(idx, 'answer', e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                    {saving ? 'Saving...' : <><Save size={18} /> Save Settings</>}
                </button>
            </div>
        </div>
    );
}
