import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Users, Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight,
    X, Check, ChevronDown, Shield, UserCog, Loader2, RefreshCw, ExternalLink
} from 'lucide-react';
import { useUserStore } from '../../../modules/user/store/useUserStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const ALL_MENU_GROUPS = [
    {
        title: 'Overview',
        items: [{ key: 'dashboard', label: 'Dashboard' }]
    },
    {
        title: 'Users & Content',
        items: [
            { key: 'users', label: 'Users' },
            { key: 'content', label: 'Content' },
            { key: 'categories', label: 'Categories' },
            { key: 'nfts', label: 'V-World Review' },
            { key: 'voting', label: 'Voting' },
            { key: 'music', label: 'Music' },
            { key: 'auctions', label: 'Auctions' },
            { key: 'locations', label: 'Locations' },
        ]
    },
    {
        title: 'Campaigns',
        items: [
            { key: 'campaigns', label: 'Campaigns' },
            { key: 'advertisers', label: 'Advertisers' },
            { key: 'deals', label: 'Trending Deals' },
        ]
    },
    {
        title: 'Money',
        items: [
            { key: 'wallet', label: 'Wallet' },
            { key: 'withdrawals', label: 'Withdrawals' },
            { key: 'gifts', label: 'Gifts' },
        ]
    },
    {
        title: 'Safety',
        items: [
            { key: 'reports', label: 'Reports' },
            { key: 'audit', label: 'Audit Logs' },
            { key: 'kyc', label: 'KYC Management' },
        ]
    },
    {
        title: 'Settings',
        items: [{ key: 'settings', label: 'Platform Settings' }]
    },
];

const ROLE_LABELS = { staff: 'Staff', team_leader: 'Team Leader' };
const ROLE_COLORS = { staff: 'indigo', team_leader: 'amber' };

function MenuCheckboxGrid({ selected, onChange }) {
    const toggleAll = () => {
        const allKeys = ALL_MENU_GROUPS.flatMap(g => g.items.map(i => i.key));
        if (selected.length === allKeys.length) onChange([]);
        else onChange(allKeys);
    };

    const toggleKey = (key) => {
        onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Sidebar Permissions</p>
                <button type="button" onClick={toggleAll} className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider hover:opacity-80">
                    {selected.length === ALL_MENU_GROUPS.flatMap(g => g.items).length ? 'Deselect All' : 'Select All'}
                </button>
            </div>
            {ALL_MENU_GROUPS.map(group => (
                <div key={group.title}>
                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2 opacity-50">{group.title}</p>
                    <div className="grid grid-cols-2 gap-2">
                        {group.items.map(item => {
                            const checked = selected.includes(item.key);
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => toggleKey(item.key)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
                                        checked
                                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                                            : 'bg-bg border-surface text-muted hover:border-indigo-500/20 hover:text-text'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${checked ? 'bg-indigo-500 border-indigo-500' : 'border-surface'}`}>
                                        {checked && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

function StaffDrawer({ mode, staffData, onClose, onSaved, getAuthHeader }) {
    const isEdit = mode === 'edit';
    const [form, setForm] = useState({
        name: staffData?.name || '',
        email: staffData?.email || '',
        password: '',
        role: staffData?.role || 'staff',
        grantedMenus: staffData?.grantedMenus || [],
        phone: staffData?.phone || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const url = isEdit ? `${API_BASE}/admin/staff/${staffData.id || staffData._id}` : `${API_BASE}/admin/staff`;
            const body = isEdit
                ? { name: form.name, email: form.email, role: form.role, grantedMenus: form.grantedMenus, phone: form.phone }
                : form;

            const res = await fetch(url, {
                method: isEdit ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || 'Operation failed');
                setLoading(false);
                return;
            }
            onSaved();
        } catch {
            setError('Network error. Please try again.');
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-end"
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-w-md h-full bg-surface border-l border-surface flex flex-col shadow-2xl overflow-hidden"
            >
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-surface shrink-0">
                    <div>
                        <h2 className="text-sm font-bold text-text">{isEdit ? 'Edit Staff Member' : 'Create Staff Member'}</h2>
                        <p className="text-[10px] text-muted mt-0.5">{isEdit ? 'Update permissions and details' : 'Set up a new staff or team leader account'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface2 text-muted hover:text-text transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Drawer Body */}
                <form id="staff-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 hide-scrollbar">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Full Name</label>
                        <input
                            type="text" value={form.name}
                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-1 focus:ring-indigo-500/30 text-text"
                            placeholder="Jane Doe" required
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Email Address</label>
                        <input
                            type="email" value={form.email}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                            className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-1 focus:ring-indigo-500/30 text-text"
                            placeholder="jane@company.io" required
                        />
                    </div>

                    {/* Password (create only) */}
                    {!isEdit && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Temporary Password</label>
                            <input
                                type="password" value={form.password}
                                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                className="w-full bg-bg border border-surface rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-1 focus:ring-indigo-500/30 text-text"
                                placeholder="Min. 6 characters" minLength={6} required
                            />
                            <p className="text-[9px] text-muted opacity-60">Staff can reset via email after first login.</p>
                        </div>
                    )}

                    {/* Role */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Role</label>
                        <div className="flex gap-2">
                            {['staff', 'team_leader'].map(r => (
                                <button
                                    key={r} type="button"
                                    onClick={() => setForm(p => ({ ...p, role: r }))}
                                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                        form.role === r
                                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                                            : 'border-surface text-muted hover:text-text'
                                    }`}
                                >
                                    {ROLE_LABELS[r]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Menu Permissions */}
                    <div className="border-t border-surface pt-5">
                        <MenuCheckboxGrid
                            selected={form.grantedMenus}
                            onChange={menus => setForm(p => ({ ...p, grantedMenus: menus }))}
                        />
                    </div>

                    {error && <p className="text-xs text-red-400">{error}</p>}
                </form>

                {/* Drawer Footer */}
                <div className="px-6 py-4 border-t border-surface flex gap-3 shrink-0">
                    <button type="button" onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-surface text-[11px] font-bold uppercase tracking-wider text-muted hover:text-text transition-all">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="staff-drawer-form"
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-indigo-600 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEdit ? 'Save Changes' : 'Create Member')}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function StaffManagement() {
    const navigate = useNavigate();
    const { token } = useUserStore();
    const getAuthHeader = () => token ? { Authorization: `Bearer ${token}` } : {};

    const [staffList, setStaffList] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [drawer, setDrawer] = useState({ open: false, mode: 'create', data: null });
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState('');

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ search, role: roleFilter, limit: 50 });
            const res = await fetch(`${API_BASE}/admin/staff?${params}`, {
                headers: getAuthHeader()
            });
            const data = await res.json();
            if (data.success) {
                setStaffList(data.staff);
                setTotal(data.total);
            }
        } catch (err) {
            console.error('Failed to fetch staff:', err);
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter, token]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const handleToggleActive = async (id, current) => {
        setActionLoading(id);
        try {
            await fetch(`${API_BASE}/admin/staff/${id}/toggle`, {
                method: 'PATCH', headers: getAuthHeader()
            });
            fetchStaff();
        } finally {
            setActionLoading('');
        }
    };

    const handleDelete = async (id) => {
        setActionLoading(id);
        try {
            await fetch(`${API_BASE}/admin/staff/${id}`, {
                method: 'DELETE', headers: getAuthHeader()
            });
            setDeleteConfirm(null);
            fetchStaff();
        } finally {
            setActionLoading('');
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-text tracking-tight">Staff Management</h1>
                    <p className="text-xs text-muted mt-1">{total} member{total !== 1 ? 's' : ''} · Manage roles and sidebar access</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.open('/staff/login', '_blank')}
                        className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold uppercase tracking-wider text-[11px] py-2.5 px-4 rounded-xl hover:bg-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <UserCog className="w-4 h-4" /> Staff Portal <ExternalLink className="w-3 h-3 opacity-60" />
                    </button>
                    <button
                        id="create-staff-btn"
                        onClick={() => setDrawer({ open: true, mode: 'create', data: null })}
                        className="flex items-center gap-2 bg-indigo-500 text-white font-bold uppercase tracking-wider text-[11px] py-2.5 px-4 rounded-xl hover:bg-indigo-600 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Create Member
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                        type="text" value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full bg-surface border border-surface rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-indigo-500/30 text-text"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="bg-surface border border-surface rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-1 focus:ring-indigo-500/30 text-text"
                >
                    <option value="">All Roles</option>
                    <option value="staff">Staff</option>
                    <option value="team_leader">Team Leader</option>
                </select>
                <button onClick={fetchStaff} className="p-2.5 bg-surface border border-surface rounded-xl text-muted hover:text-text transition-colors">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Staff Table */}
            <div className="bg-surface border border-surface rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-muted" />
                    </div>
                ) : staffList.length === 0 ? (
                    <div className="text-center py-20">
                        <UserCog className="w-10 h-10 text-muted mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-bold text-muted">No staff members found</p>
                        <p className="text-xs text-muted opacity-50 mt-1">Create your first staff member using the button above.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface">
                                    <th className="text-left px-5 py-3.5 text-[9px] font-bold text-muted uppercase tracking-widest">Member</th>
                                    <th className="text-left px-5 py-3.5 text-[9px] font-bold text-muted uppercase tracking-widest">Role</th>
                                    <th className="text-left px-5 py-3.5 text-[9px] font-bold text-muted uppercase tracking-widest">Menus</th>
                                    <th className="text-left px-5 py-3.5 text-[9px] font-bold text-muted uppercase tracking-widest">Status</th>
                                    <th className="text-left px-5 py-3.5 text-[9px] font-bold text-muted uppercase tracking-widest">Last Login</th>
                                    <th className="text-left px-5 py-3.5 text-[9px] font-bold text-muted uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface">
                                {staffList.map(member => {
                                    const id = member._id || member.id;
                                    const color = ROLE_COLORS[member.role];
                                    return (
                                        <tr key={id} className="hover:bg-surface2/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[11px] font-bold text-indigo-400">
                                                        {member.name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-text">{member.name}</p>
                                                        <p className="text-[9px] text-muted">{member.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
                                                    <Shield className="w-2.5 h-2.5" />
                                                    {ROLE_LABELS[member.role]}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 flex-wrap max-w-[180px]">
                                                    {(member.grantedMenus || []).slice(0, 3).map(m => (
                                                        <span key={m} className="px-1.5 py-0.5 bg-surface2 rounded text-[8px] font-bold text-muted uppercase">{m}</span>
                                                    ))}
                                                    {(member.grantedMenus?.length || 0) > 3 && (
                                                        <span className="px-1.5 py-0.5 bg-surface2 rounded text-[8px] font-bold text-muted">+{member.grantedMenus.length - 3}</span>
                                                    )}
                                                    {(!member.grantedMenus || member.grantedMenus.length === 0) && (
                                                        <span className="text-[9px] text-muted opacity-40">None</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() => handleToggleActive(id, member.isActive)}
                                                    disabled={actionLoading === id}
                                                    className="transition-opacity hover:opacity-80"
                                                    title={member.isActive ? 'Click to deactivate' : 'Click to activate'}
                                                >
                                                    {actionLoading === id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-muted" />
                                                    ) : member.isActive ? (
                                                        <span className="flex items-center gap-1 text-green-400">
                                                            <ToggleRight className="w-5 h-5" />
                                                            <span className="text-[9px] font-bold uppercase tracking-wider">Active</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-muted">
                                                            <ToggleLeft className="w-5 h-5" />
                                                            <span className="text-[9px] font-bold uppercase tracking-wider">Inactive</span>
                                                        </span>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-[10px] text-muted">{formatDate(member.lastLoginAt)}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setDrawer({ open: true, mode: 'edit', data: { ...member, id } })}
                                                        className="p-2 rounded-lg hover:bg-indigo-500/10 text-muted hover:text-indigo-400 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(id)}
                                                        className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Drawer */}
            <AnimatePresence>
                {drawer.open && (
                    <StaffDrawer
                        mode={drawer.mode}
                        staffData={drawer.data}
                        getAuthHeader={getAuthHeader}
                        onClose={() => setDrawer({ open: false, mode: 'create', data: null })}
                        onSaved={() => { setDrawer({ open: false, mode: 'create', data: null }); fetchStaff(); }}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-surface border border-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                        >
                            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <h3 className="text-sm font-bold text-text text-center">Delete Staff Member</h3>
                            <p className="text-xs text-muted text-center mt-2 leading-relaxed">
                                This will permanently remove the staff member. This action cannot be undone.
                            </p>
                            <div className="flex gap-3 mt-5">
                                <button onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-3 rounded-xl border border-surface text-[11px] font-bold uppercase tracking-wider text-muted hover:text-text transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    disabled={actionLoading === deleteConfirm}
                                    className="flex-1 flex items-center justify-center py-3 rounded-xl bg-red-500 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-red-600 transition-all disabled:opacity-50"
                                >
                                    {actionLoading === deleteConfirm ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
