import { useState, useMemo } from 'react'
import { Search, Edit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/useUserStore'

const MOCK_CONVERSATIONS = [
    {
        id: '1',
        user: { id: 'user1', username: 'alex_jordan', avatar: '', handle: '@alex_j' },
        lastMessage: { text: 'Check out this reel!', timestamp: '22:15', unread: true },
        isOnline: true,
    },
    {
        id: '2',
        user: { id: 'user2', username: 'sarah_miller', avatar: '', handle: '@sarahm' },
        lastMessage: { text: 'You: See you there!', timestamp: 'Yesterday', unread: false },
        isOnline: false,
    },
    {
        id: '3',
        user: { id: 'user3', username: 'mike_brown', avatar: '', handle: '@mikeb' },
        lastMessage: { text: 'Awesome shot!', timestamp: 'Tue', unread: false },
        isOnline: true,
    },
    {
        id: '4',
        user: { id: 'user4', username: 'emily_davis', avatar: '', handle: '@emilyd' },
        lastMessage: { text: 'Sent a photo', timestamp: '1h', unread: true },
        isOnline: false,
    },
]

export default function ConversationList({ onSelectChat, selectedChatId }) {
    const { profile } = useUserStore()
    const [searchQuery, setSearchQuery] = useState('')
    const navigate = useNavigate()

    const filteredConversations = useMemo(() => {
        return MOCK_CONVERSATIONS.filter(conv => 
            conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.user.handle.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [searchQuery])

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>
            {/* Header */}
            <div className="px-4 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)' }}>
                <h2 className="text-lg font-bold truncate" style={{ color: 'var(--color-text)' }}>
                    {profile?.username || 'Messages'}
                </h2>
                <button 
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
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent outline-none text-sm"
                        style={{ color: 'var(--color-text)' }}
                    />
                </div>
            </div>

            {/* Stories/Active now (Small avatars) */}
            <div className="flex gap-4 px-4 py-3 overflow-x-auto hide-scrollbar border-b" style={{ borderColor: 'var(--color-border)' }}>
                {MOCK_CONVERSATIONS.filter(c => c.isOnline).map(conv => (
                    <div key={`story-${conv.id}`} className="flex flex-col items-center gap-1 cursor-pointer min-w-14">
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

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-20 md:pb-5">
                {filteredConversations.length > 0 ? (
                    filteredConversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => onSelectChat(conv)}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface2)] text-left ${selectedChatId === conv.id ? 'bg-[var(--color-surface2)]' : ''}`}
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
                                    <p className={`text-xs truncate ${conv.lastMessage.unread ? 'font-bold' : ''}`} style={{ color: conv.lastMessage.unread ? 'var(--color-text)' : 'var(--color-muted)' }}>
                                        {conv.lastMessage.text}
                                    </p>
                                    {conv.lastMessage.unread && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    )}
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="p-8 text-center" style={{ color: 'var(--color-muted)' }}>
                        <p className="text-sm">No conversations found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
