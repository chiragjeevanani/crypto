import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Edit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/useUserStore'
import { messageService } from '../../../../services/messageService'
import { searchService } from '../../services/searchService'
import { getSocket } from '../../../../socket'

export default function ConversationList({ onSelectChat, selectedChatId }) {
    const { profile } = useUserStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [conversations, setConversations] = useState([])
    const [searchResults, setSearchResults] = useState([])
    const [loading, setLoading] = useState(true)
    const [searching, setSearching] = useState(false)
    const navigate = useNavigate()

    const fetchConversations = useCallback(() => {
        messageService.getConversations()
            .then(data => {
                setConversations(data)
                setLoading(false)
            })
            .catch(err => {
                console.error('Fetch conversations error:', err)
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        setLoading(true)
        fetchConversations()
    }, [fetchConversations])

    // Listen for new messages globally to update the list
    useEffect(() => {
        const socket = getSocket()
        if (!socket.connected) socket.connect()

        const handleNewMessage = (msg) => {
            setConversations(prev => {
                const index = prev.findIndex(c => c.user.id === msg.senderId)
                if (index !== -1) {
                    const updated = [...prev]
                    const isNowActive = selectedChatId === (updated[index].id || updated[index].user.id)
                    updated[index] = {
                        ...updated[index],
                        lastMessage: {
                            text: msg.text,
                            timestamp: msg.timestamp,
                            unreadCount: isNowActive ? 0 : (updated[index].lastMessage.unreadCount || 0) + 1
                        }
                    }
                    // Bring to top
                    const item = updated.splice(index, 1)[0]
                    return [item, ...updated]
                } else {
                    fetchConversations()
                    return prev
                }
            })
        }

        const handleStatusChanged = ({ userId, status }) => {
            setConversations(prev => prev.map(c => 
                c.user.id === userId ? { ...c, isOnline: status === 'online' } : c
            ))
        }

        const handleSeenUpdate = ({ roomId, userId }) => {
            // If the other user (userId) marked messages from us as seen
            // (Not strictly needed for local unread count which is for messages RECEIVED)
            // But we can reset our own unread count if WE are the one who saw it
        }

        socket.on('receive_message', handleNewMessage)
        socket.on('user_status_changed', handleStatusChanged)
        socket.on('messages_seen_update', handleSeenUpdate)

        return () => {
            socket.off('receive_message', handleNewMessage)
            socket.off('user_status_changed', handleStatusChanged)
            socket.off('messages_seen_update', handleSeenUpdate)
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
                const mappedResults = users.map(user => ({
                    id: null, // Global search might not have a conversation ID yet
                    user: {
                        id: user.id || user._id,
                        username: user.username || user.name,
                        handle: user.handle,
                        avatar: user.avatar
                    },
                    lastMessage: { text: 'New contact...', timestamp: '' },
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

    const displayList = useMemo(() => {
        if (searchQuery.trim()) {
            return searchResults
        }
        return conversations
    }, [searchQuery, conversations, searchResults])

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>
            {/* Header */}
            <div className="px-4 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)' }}>
                <h2 className="text-lg font-bold truncate" style={{ color: 'var(--color-text)' }}>
                    {profile?.username || 'Messages'}
                </h2>
                <button className="p-2 rounded-full hover:bg-[var(--color-surface2)] transition-colors">
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
                                <div className="w-14 h-14 rounded-full p-0.5" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                                    <div className="w-full h-full rounded-full bg-[var(--color-bg)] p-0.5">
                                        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--color-surface2)' }}>
                                            {conv.user.avatar ? <img src={conv.user.avatar} alt={conv.user.username} className="w-full h-full object-cover" /> : <div className="text-xs font-bold">{conv.user.username[0].toUpperCase()}</div>}
                                        </div>
                                    </div>
                                </div>
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
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface2)] text-left ${selectedChatId === (conv.id || conv.user.id) ? 'bg-[var(--color-surface2)]' : ''}`}
                        >
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface-invert-20)' }}>
                                    {conv.user.avatar ? <img src={conv.user.avatar} alt={conv.user.username} className="w-full h-full object-cover" /> : (
                                        <div className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{conv.user.username[0].toUpperCase()}</div>
                                    )}
                                </div>
                                {conv.isOnline && (
                                    <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-bg)] bg-green-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{conv.user.username}</h4>
                                    <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>{conv.lastMessage.timestamp}</span>
                                </div>
                                <div className="flex items-center justify-between mt-0.5">
                                    <p className={`text-xs truncate ${conv.lastMessage?.unreadCount > 0 ? 'font-bold' : ''}`} style={{ color: conv.lastMessage?.unreadCount > 0 ? 'var(--color-text)' : 'var(--color-muted)' }}>
                                        {conv.lastMessage?.text}
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
        </div>
    )
}
