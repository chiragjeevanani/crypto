import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Edit, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/useUserStore'
import { messageService } from '../../../../services/messageService'
import { searchService } from '../../services/searchService'
import { getSocket } from '../../../../socket'
import Avatar from '../../components/shared/Avatar'
import CreateGroupModal from './CreateGroupModal'

function formatConversationDate(createdAt, fallbackTimestamp) {
    if (!createdAt) return fallbackTimestamp;
    const date = new Date(createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString(undefined, { year: '2-digit', month: 'numeric', day: 'numeric' });
    }
}

export default function ConversationList({ onSelectChat, selectedChatId }) {
    const { profile } = useUserStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [conversations, setConversations] = useState([])
    const [searchResults, setSearchResults] = useState([])
    const [loading, setLoading] = useState(true)
    const [searching, setSearching] = useState(false)
    const [showGroupModal, setShowGroupModal] = useState(false)
    const navigate = useNavigate()

    const fetchConversations = useCallback(() => {
        messageService.getConversations()
            .then(data => {
                // Filter out conversations with self
                const filtered = data.filter(c => c.user.id !== profile?.id)
                setConversations(filtered)
                setLoading(false)
            })
            .catch(err => {
                console.error('Fetch conversations error:', err)
                setLoading(false)
            })
    }, [profile?.id])

    useEffect(() => {
        setLoading(true)
        fetchConversations()
    }, [fetchConversations])

    // Listen for new messages globally to update the list
    useEffect(() => {
        const socket = getSocket()
        if (!socket.connected) socket.connect()

        const handleNewMessage = (msg) => {
            const targetUserId = msg.senderId
            setConversations(prev => {
                const index = prev.findIndex(c => c.user.id === targetUserId)
                
                if (index !== -1) {
                    const updated = [...prev]
                    const c = updated[index]
                    const isNowActive = selectedChatId === (c.id || c.user.id)
                    
                    const newItem = {
                        ...c,
                        lastMessage: {
                            text: msg.text,
                            timestamp: msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                            createdAt: new Date().toISOString(),
                            unreadCount: isNowActive ? 0 : (msg.isOwn ? 0 : (c.lastMessage?.unreadCount || 0) + 1)
                        },
                        isTyping: false
                    }
                    
                    const filtered = updated.filter((_, i) => i !== index)
                    return [newItem, ...filtered]
                } else {
                    fetchConversations()
                    return prev
                }
            })
        }

        const handleTyping = ({ roomId, userId }) => {
            setConversations(prev => prev.map(c => 
                c.user.id === userId ? { ...c, isTyping: true } : c
            ))
        }

        const handleStopTyping = ({ roomId, userId }) => {
            setConversations(prev => prev.map(c => 
                c.user.id === userId ? { ...c, isTyping: false } : c
            ))
        }

        const handleStatusChanged = ({ userId, status }) => {
            setConversations(prev => prev.map(c => 
                c.user.id === userId ? { ...c, isOnline: status === 'online' } : c
            ))
        }

        const handleChatDeleted = () => {
            fetchConversations()
        }

        const handleUnreadReset = (data) => {
            setConversations(prev => prev.map(conv => 
                (conv.id === data.roomId || conv.roomId === data.roomId) ? { ...conv, lastMessage: { ...conv.lastMessage, unreadCount: 0 } } : conv
            ))
        }

        const handleMessageUpdate = () => {
            fetchConversations()
        }

        socket.on('receive_message', handleNewMessage)
        socket.on('new_message_alert', (data) => handleNewMessage(data.message))
        socket.on('own_message_sent', (msg) => handleNewMessage({ ...msg, isOwn: true }))
        socket.on('user_status_changed', handleStatusChanged)
        socket.on('user_typing', handleTyping)
        socket.on('user_stop_typing', handleStopTyping)
        socket.on('chat_deleted', handleChatDeleted)
        socket.on('unread_count_reset', handleUnreadReset)
        socket.on('message_deleted', handleMessageUpdate)
        socket.on('message_edited', handleMessageUpdate)

        return () => {
            socket.off('receive_message', handleNewMessage)
            socket.off('new_message_alert')
            socket.off('own_message_sent')
            socket.off('user_status_changed', handleStatusChanged)
            socket.off('user_typing', handleTyping)
            socket.off('user_stop_typing', handleStopTyping)
            socket.off('chat_deleted', handleChatDeleted)
            socket.off('unread_count_reset', handleUnreadReset)
            socket.off('message_deleted', handleMessageUpdate)
            socket.off('message_edited', handleMessageUpdate)
        }
    }, [fetchConversations, selectedChatId])

    // Debounced search logic
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([])
            setSearching(false)
            return
        }

        setSearching(true)
        const timer = setTimeout(async () => {
            try {
                const results = await searchService.search(searchQuery)
                // Map global search results to match the chat format
                const users = results.users || []
                const mappedResults = users
                    .filter(user => (user.id || user._id) !== profile?.id) // Filter self from search results
                    .map(user => ({
                        id: null, // Global search might not have a conversation ID yet
                        user: {
                            id: user.id || user._id,
                            username: user.username || user.name,
                            handle: user.handle,
                            email: user.email,
                            avatar: user.avatar,
                            isPremium: user.isPremium
                        },
                        lastMessage: { text: user.email || user.handle || 'New contact...', timestamp: '' },
                        isOnline: false
                    }))
                setSearchResults(mappedResults)
            } catch (err) {
                console.error('Global search error:', err)
            } finally {
                setSearching(false)
            }
        }, 500) // 500ms debounce

        return () => clearTimeout(timer)
    }, [searchQuery])

    // Clear unread count when a chat is selected
    useEffect(() => {
        if (selectedChatId) {
            setConversations(prev => prev.map(c => {
                if ((c.id === selectedChatId || c.user.id === selectedChatId) && c.lastMessage?.unreadCount > 0) {
                    return {
                        ...c,
                        lastMessage: { ...c.lastMessage, unreadCount: 0 }
                    }
                }
                return c
            }))
        }
    }, [selectedChatId])

    const displayList = useMemo(() => {
        if (searchQuery.trim()) {
            return searchResults
        }
        return conversations
    }, [searchQuery, conversations, searchResults])

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>
            {/* Header */}
            <div className="px-4 py-4 flex items-center justify-between border-b relative" style={{ borderColor: 'var(--color-border)' }}>
                <div className="absolute left-1/2 -translate-x-1/2">
                    <img src="/knqlogo.jpeg" alt="KnQ Logo" className="h-12 w-12 rounded-full object-cover shadow-sm" />
                </div>
                <h2 className="text-lg font-bold truncate z-10" style={{ color: 'var(--color-text)' }}>
                    {profile?.username || 'Messages'}
                </h2>
                <button 
                    onClick={() => setShowGroupModal(true)}
                    className="p-2 rounded-full hover:bg-[var(--color-surface2)] transition-colors"
                >
                    <Edit size={18} style={{ color: 'var(--color-text)' }} />
                </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
                <div 
                    className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                    <Search size={16} style={{ color: 'var(--color-muted)' }} />
                    <input 
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent outline-none text-sm"
                        style={{ color: 'var(--color-text)' }}
                    />
                    {searching && <div className="w-4 h-4 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />}
                </div>
            </div>

            {/* Stories/Active now (Small avatars) only if not searching */}
            {!searchQuery && (
                <div className="flex gap-4 px-4 py-3 overflow-x-auto hide-scrollbar border-b" style={{ borderColor: 'var(--color-border)' }}>
                    {conversations.filter(c => c.isOnline).map(conv => (
                        <div key={`story-${conv.id || conv.user.id}`} className="flex flex-col items-center gap-1 cursor-pointer min-w-14">
                            <div className="relative">
                                <Avatar 
                                    src={conv.user.avatar} 
                                    alt={conv.user.username} 
                                    size="lg" 
                                    isPremium={conv.user.isPremium} 
                                    className="ring-2 ring-primary ring-offset-2 ring-offset-bg"
                                />
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-bg)] bg-green-500" />
                            </div>
                            <span className="text-[10px] w-full truncate text-center" style={{ color: 'var(--color-muted)' }}>{conv.user.username.split('_')[0]}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-20 md:pb-5">
                {loading ? (
                    <div className="p-8 text-center" style={{ color: 'var(--color-muted)' }}>
                        <p className="text-sm">Loading...</p>
                    </div>
                ) : displayList.length > 0 ? (
                    displayList.map((conv) => (
                        <button
                            key={conv.id || conv.user.id}
                            onClick={() => {
                                setSearchQuery('')
                                onSelectChat(conv)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface2)] text-left ${(selectedChatId === conv.id || selectedChatId === conv.user.id) ? 'bg-[var(--color-surface2)]' : ''}`}
                        >
                            <div className="relative">
                                <Avatar 
                                    src={conv.user.avatar} 
                                    alt={conv.user.username} 
                                    size="lg" 
                                    isPremium={conv.user.isPremium} 
                                />
                                {conv.isOnline && (
                                    <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-bg)] bg-green-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 min-w-0">
                                        <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{conv.user.username}</h4>
                                        {conv.user.isPremium && (
                                            <div className="w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center p-0.5 shadow-sm">
                                                <Check size={9} className="text-white" strokeWidth={5} />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>{formatConversationDate(conv.lastMessage?.createdAt, conv.lastMessage?.timestamp)}</span>
                                </div>
                                <div className="flex items-center justify-between mt-0.5">
                                    <p className={`text-xs truncate ${conv.lastMessage?.unreadCount > 0 ? 'font-bold' : ''}`} style={{ color: conv.lastMessage?.unreadCount > 0 ? 'var(--color-text)' : 'var(--color-muted)' }}>
                                        {conv.isTyping ? <span className="text-blue-500 italic">Typing...</span> : conv.lastMessage?.text}
                                    </p>
                                    {conv.lastMessage?.unreadCount > 0 && (
                                        <div 
                                            className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 text-[10px] font-bold text-white bg-blue-500"
                                        >
                                            {conv.lastMessage.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="p-8 text-center" style={{ color: 'var(--color-muted)' }}>
                        <p className="text-sm">No results found</p>
                    </div>
                )}
            </div>

            <CreateGroupModal 
                isOpen={showGroupModal}
                onClose={() => setShowGroupModal(false)}
                onCreate={(group) => {
                    fetchConversations();
                    // Optionally select the newly created group chat immediately
                    onSelectChat({
                        id: group._id,
                        isGroup: true,
                        groupId: group._id,
                        user: {
                            id: group._id,
                            username: group.name,
                            avatar: group.avatar || ''
                        },
                        lastMessage: { text: 'Group created', timestamp: 'Just now' }
                    });
                }}
            />
        </div>
    )
}
