import React, { useState, useEffect } from 'react';
import { X, Search, Users } from 'lucide-react';
import Avatar from '../../components/shared/Avatar';
import { searchService } from '../../services/searchService';
import { messageService } from '../../../../services/messageService';

export default function CreateGroupModal({ isOpen, onClose, onCreate }) {
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setGroupName('');
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUsers([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            loadSuggested();
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const results = await searchService.search(searchQuery);
                setSearchResults(results.users || []);
            } catch (err) {
                console.error('Search error:', err);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadSuggested = async () => {
        try {
            const results = await searchService.getSuggestedUsers();
            setSearchResults(results.users || []);
        } catch (err) {
            console.error('Suggested users error:', err);
        }
    };

    const handleSelectUser = (user) => {
        const userId = user.id || user._id;
        if (selectedUsers.find(u => (u.id || u._id) === userId)) {
            setSelectedUsers(selectedUsers.filter(u => (u.id || u._id) !== userId));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;
        setLoading(true);
        try {
            const memberIds = selectedUsers.map(u => u.id || u._id);
            const res = await messageService.createGroup(groupName, memberIds);
            onCreate(res.group);
            onClose();
        } catch (err) {
            console.error('Failed to create group:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div 
                className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2">
                        <Users size={20} style={{ color: 'var(--color-text)' }} />
                        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>New Group</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--color-surface2)] transition-colors">
                        <X size={20} style={{ color: 'var(--color-text)' }} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Group Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Group Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Crypto Squad"
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl outline-none"
                            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                        />
                    </div>

                    {/* Search Users */}
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-muted)' }}>Add Members</label>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                            <Search size={16} style={{ color: 'var(--color-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent outline-none text-sm"
                                style={{ color: 'var(--color-text)' }}
                            />
                        </div>
                    </div>

                    {/* Selected Users Chips */}
                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map(user => (
                                <div key={user.id || user._id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-medium">
                                    <Avatar src={user.avatar} alt={user.username || user.name} size="xs" />
                                    <span>{user.username || user.name}</span>
                                    <button onClick={() => handleSelectUser(user)}>
                                        <X size={12} className="ml-1 cursor-pointer hover:opacity-70" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="max-h-48 overflow-y-auto rounded-xl border p-2" style={{ borderColor: 'var(--color-border)' }}>
                            {searchResults.map(user => {
                                const isSelected = selectedUsers.find(u => (u.id || u._id) === (user.id || user._id));
                                return (
                                    <button
                                        key={user.id || user._id}
                                        onClick={() => handleSelectUser(user)}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-surface2)] transition-colors ${isSelected ? 'bg-[var(--color-surface)]' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar src={user.avatar} alt={user.username || user.name} size="sm" />
                                            <div className="text-left">
                                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{user.username || user.name}</p>
                                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>@{user.handle}</p>
                                            </div>
                                        </div>
                                        {isSelected && <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] flex items-center justify-center"><X size={10} className="text-white" /></div>}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--color-border)' }}>
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--color-surface2)]"
                        style={{ color: 'var(--color-text)' }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleCreate}
                        disabled={loading || !groupName.trim() || selectedUsers.length === 0}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        {loading ? 'Creating...' : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
}
