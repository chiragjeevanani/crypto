import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Users, Shield, UserMinus, Edit2, Check, Camera, UserPlus } from 'lucide-react';
import Avatar from '../../components/shared/Avatar';
import { messageService } from '../../../../services/messageService';
import { searchService } from '../../services/searchService';
import { useUserStore } from '../../store/useUserStore';

export default function GroupDetailsModal({ isOpen, onClose, groupId, onGroupUpdated, onLeave }) {
    const { profile } = useUserStore();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Edit state
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // Add member state
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (isOpen && groupId) {
            fetchDetails();
        } else {
            setGroup(null);
            setIsEditingName(false);
            setIsAddingMember(false);
            setSearchQuery('');
        }
    }, [isOpen, groupId]);

    useEffect(() => {
        if (!isAddingMember) return;
        
        if (!searchQuery.trim()) {
            loadSuggested();
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setIsSearching(true);
                const results = await searchService.search(searchQuery);
                setSearchResults(results.users || []);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, isAddingMember]);

    const loadSuggested = async () => {
        try {
            setIsSearching(true);
            const results = await searchService.getSuggestedUsers();
            setSearchResults(results.users || []);
        } catch (err) {
            console.error('Suggested users error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const data = await messageService.getGroupDetails(groupId);
            setGroup(data);
            setEditName(data.name);
        } catch (error) {
            console.error("Failed to load group details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveName = async () => {
        if (!editName.trim() || editName === group.name) {
            setIsEditingName(false);
            return;
        }
        try {
            setIsSavingName(true);
            const updated = await messageService.updateGroup(groupId, editName.trim());
            setGroup(updated);
            setIsEditingName(false);
            if (onGroupUpdated) onGroupUpdated(updated);
        } catch (err) {
            console.error("Failed to update name", err);
        } finally {
            setIsSavingName(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm("Remove this member from the group?")) return;
        try {
            await messageService.removeGroupMember(groupId, memberId);
            setGroup(prev => ({
                ...prev,
                members: prev.members.filter(m => m._id !== memberId)
            }));
            if (onGroupUpdated) onGroupUpdated(group);
        } catch (err) {
            console.error("Failed to remove member", err);
        }
    };

    const handleLeaveGroup = async () => {
        if (!window.confirm("Are you sure you want to leave this group?")) return;
        try {
            await messageService.leaveGroup(groupId);
            onClose();
            if (onLeave) onLeave();
        } catch (err) {
            console.error("Failed to leave group", err);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsUploadingAvatar(true);
            const { url } = await messageService.uploadMedia(file);
            const updated = await messageService.updateGroup(groupId, undefined, url);
            setGroup(updated);
            if (onGroupUpdated) onGroupUpdated(updated);
        } catch (err) {
            console.error("Failed to upload group avatar", err);
            alert("Failed to upload group avatar");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleAddMember = async (user) => {
        const userId = user.id || user._id;
        try {
            const updated = await messageService.addGroupMembers(groupId, [userId]);
            setGroup(updated.group || updated);
            setIsAddingMember(false);
            setSearchQuery('');
            if (onGroupUpdated) onGroupUpdated(updated.group || updated);
        } catch (err) {
            console.error("Failed to add member", err);
            alert("Failed to add member. They might already be in the group.");
        }
    };

    if (!isOpen) return null;

    const isAdmin = group?.admins?.includes(profile?.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div 
                className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2">
                        <Users size={20} style={{ color: 'var(--color-text)' }} />
                        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Group Details</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--color-surface2)] transition-colors">
                        <X size={20} style={{ color: 'var(--color-text)' }} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>Loading...</div>
                ) : !group ? (
                    <div className="p-8 text-center text-sm text-red-500">Failed to load group.</div>
                ) : (
                    <div className="overflow-y-auto p-4 space-y-6">
                        
                        {/* Group Profile Info */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[var(--color-surface2)] overflow-hidden">
                                    {isUploadingAvatar ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--color-primary)] border-t-transparent"></div>
                                    ) : (
                                        <img src={group.avatar || '/group-placeholder.png'} alt={group.name} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                {isAdmin && !isUploadingAvatar && (
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[var(--color-surface)] shadow border flex items-center justify-center hover:bg-[var(--color-surface2)] transition-colors"
                                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                    >
                                        <Camera size={14} />
                                    </button>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleAvatarUpload} 
                                    accept="image/*" 
                                    className="hidden" 
                                />
                            </div>
                            
                            <div className="flex items-center gap-2 w-full justify-center px-4">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2 w-full max-w-xs">
                                        <input 
                                            autoFocus
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-[var(--color-surface)] border outline-none text-center"
                                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                            disabled={isSavingName}
                                        />
                                        <button 
                                            onClick={handleSaveName}
                                            disabled={isSavingName}
                                            className="p-1.5 rounded-lg bg-[var(--color-primary)] text-white"
                                        >
                                            <Check size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-xl font-bold truncate" style={{ color: 'var(--color-text)' }}>{group.name}</h3>
                                        {isAdmin && (
                                            <button 
                                                onClick={() => setIsEditingName(true)}
                                                className="p-1 rounded-full hover:bg-[var(--color-surface2)] transition-colors text-[var(--color-muted)] hover:text-[var(--color-text)]"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{group.members?.length || 0} members</p>
                        </div>

                        {/* Members List */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-bold" style={{ color: 'var(--color-muted)' }}>Members</label>
                                {isAdmin && (
                                    <button 
                                        onClick={() => setIsAddingMember(!isAddingMember)}
                                        className="text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity"
                                        style={{ color: 'var(--color-primary)' }}
                                    >
                                        {isAddingMember ? 'Cancel' : <><UserPlus size={14} /> Add</>}
                                    </button>
                                )}
                            </div>

                            {/* Add Member Search Section */}
                            {isAddingMember && (
                                <div className="mb-4 p-3 rounded-xl bg-[var(--color-surface2)] border" style={{ borderColor: 'var(--color-border)' }}>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2 bg-[var(--color-surface)]" style={{ border: '1px solid var(--color-border)' }}>
                                        <Search size={14} style={{ color: 'var(--color-muted)' }} />
                                        <input 
                                            type="text" 
                                            placeholder="Search users to add..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full bg-transparent outline-none text-xs"
                                            style={{ color: 'var(--color-text)' }}
                                            autoFocus
                                        />
                                    </div>
                                    
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {isSearching ? (
                                            <p className="text-xs text-center py-2" style={{ color: 'var(--color-muted)' }}>Searching...</p>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map(user => {
                                                const userId = user.id || user._id;
                                                const isAlreadyMember = group.members.some(m => (m.id || m._id) === userId);
                                                
                                                if (isAlreadyMember) return null;
                                                
                                                return (
                                                    <button
                                                        key={userId}
                                                        onClick={() => handleAddMember(user)}
                                                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-left"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Avatar src={user.avatar} alt={user.username || user.name} size="xs" />
                                                            <div>
                                                                <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{user.username || user.name}</p>
                                                                <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>@{user.handle || user.username}</p>
                                                            </div>
                                                        </div>
                                                        <UserPlus size={14} style={{ color: 'var(--color-primary)' }} />
                                                    </button>
                                                )
                                            })
                                        ) : (
                                            <p className="text-xs text-center py-2" style={{ color: 'var(--color-muted)' }}>No users found.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {group.members?.map(member => {
                                    const isUserAdmin = group.admins?.includes(member._id);
                                    const isMe = member._id === profile?.id;

                                    return (
                                        <div key={member._id} className="flex items-center justify-between p-2 rounded-xl bg-[var(--color-surface)]" style={{ border: '1px solid var(--color-border)' }}>
                                            <div className="flex items-center gap-3">
                                                <Avatar src={member.avatar} alt={member.username || member.name || 'User'} size="sm" />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                                            {member.username || member.name || 'Unknown User'} {isMe && '(You)'}
                                                        </p>
                                                        {isUserAdmin && (
                                                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                                                <Shield size={10} /> Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>@{member.handle || member.username || 'user'}</p>
                                                        {member.email && (
                                                            <p className="text-[10px] opacity-70" style={{ color: 'var(--color-muted)' }}>{member.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Admin Actions */}
                                            {isAdmin && !isMe && (
                                                <button 
                                                    onClick={() => handleRemoveMember(member._id)}
                                                    className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition-colors"
                                                    title="Remove Member"
                                                >
                                                    <UserMinus size={16} />
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                    </div>
                )}

                <div className="p-4 border-t flex flex-col gap-2" style={{ borderColor: 'var(--color-border)' }}>
                    {!loading && group && (
                        <button 
                            onClick={handleLeaveGroup}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                        >
                            Leave Group
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
