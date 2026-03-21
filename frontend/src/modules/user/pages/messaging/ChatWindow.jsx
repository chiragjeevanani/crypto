import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Info, Phone, Video, Send, Image as ImageIcon, Smile, Paperclip, PlayCircle, MoreHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/useUserStore'

const MOCK_MESSAGES = [
    { id: 'm1', sender: 'user1', text: 'Hey! Did you see my latest post?', timestamp: '21:10', type: 'text' },
    { id: 'm2', sender: 'me', text: 'Not yet, what is it about?', timestamp: '22:15', type: 'text' },
    { id: 'm3', sender: 'user1', text: 'Its about my new project!', timestamp: '22:16', type: 'text' },
    { 
        id: 'm4', 
        sender: 'user1', 
        type: 'post', 
        payload: {
            id: 'post1',
            creator: { username: 'alex_jordan', avatar: '' },
            thumbnail: 'https://placehold.co/600x400/orange/white?text=A+Beautiful+Post',
            caption: 'My latest adventure!',
            postType: 'regular'
        },
        timestamp: '22:16'
    },
    { id: 'm5', sender: 'user1', text: 'Check out this reel!', timestamp: '22:16', type: 'text' },
    { 
        id: 'm6', 
        sender: 'user1', 
        type: 'reel', 
        payload: {
            id: 'reel1',
            creator: { username: 'travel_junkie', avatar: '' },
            thumbnail: 'https://placehold.co/400x600/blue/white?text=Amazing+Reel',
            caption: 'Nature is beautiful #nature',
            postType: 'reel'
        },
        timestamp: '22:17'
    },
]

export default function ChatWindow({ chat, onBack }) {
    const navigate = useNavigate()
    const { profile } = useUserStore()
    const [messages, setMessages] = useState(MOCK_MESSAGES)
    const [inputValue, setInputValue] = useState('')
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = (e) => {
        e.preventDefault()
        if (!inputValue.trim()) return

        const newMessage = {
            id: `me-${Date.now()}`,
            sender: 'me',
            text: inputValue,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            type: 'text'
        }

        setMessages([...messages, newMessage])
        setInputValue('')
    }

    const renderMessageContent = (msg) => {
        if (msg.type === 'text') {
            return (
                <div 
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${msg.sender === 'me' ? 'text-white self-end rounded-br-none' : 'bg-[var(--color-surface2)] text-[var(--color-text)] self-start rounded-bl-none'}`}
                    style={msg.sender === 'me' ? { background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))' } : {}}
                >
                    {msg.text}
                </div>
            )
        }

        if (msg.type === 'post' || msg.type === 'reel') {
            const isMe = msg.sender === 'me'
            return (
                <div 
                    className={`max-w-[75%] rounded-2xl overflow-hidden shadow-sm border ${isMe ? 'self-end' : 'self-start'}`}
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                    {/* Creator header */}
                    <div className="flex items-center gap-2 p-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface2)' }}>
                            {msg.payload.creator.avatar ? <img src={msg.payload.creator.avatar} alt={msg.payload.creator.username} className="w-full h-full object-cover" /> : <div className="text-[10px] font-bold">{msg.payload.creator.username[0].toUpperCase()}</div>}
                        </div>
                        <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--color-text)' }}>{msg.payload.creator.username}</span>
                    </div>

                    {/* Content thumbnail */}
                    <div className="relative aspect-square w-full">
                        <img src={msg.payload.thumbnail} alt={msg.payload.caption} className="w-full h-full object-cover" />
                        {msg.type === 'reel' && (
                            <div className="absolute top-2 right-2">
                                <PlayCircle size={20} className="text-white drop-shadow-md" />
                            </div>
                        )}
                    </div>

                    {/* Caption */}
                    <div className="p-2.5">
                        <p className="text-[11px] font-semibold" style={{ color: 'var(--color-text)' }}>{msg.payload.creator.username}</p>
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--color-muted)' }}>{msg.payload.caption}</p>
                    </div>

                    {/* Footer button */}
                    <button 
                        onClick={() => navigate(`/home?view=${msg.type === 'reel' ? 'reels' : 'explore'}&post=${msg.payload.id}`)}
                        className="w-full py-2 text-center text-xs font-semibold border-t transition-colors hover:bg-[var(--color-surface2)]"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                        View {msg.type === 'reel' ? 'Reel' : 'Post'}
                    </button>
                </div>
            )
        }

        return null
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="p-1 -ml-1 rounded-full hover:bg-[var(--color-surface2)] transition-colors">
                            <ChevronLeft size={24} style={{ color: 'var(--color-text)' }} />
                        </button>
                    )}
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface2)' }}>
                            {chat.user.avatar ? <img src={chat.user.avatar} alt={chat.user.username} className="w-full h-full object-cover" /> : <div className="text-sm font-bold">{chat.user.username[0].toUpperCase()}</div>}
                        </div>
                        {chat.isOnline && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-bg)] bg-green-500" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{chat.user.username}</h4>
                        <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{chat.isOnline ? 'Active now' : 'Seen 2h ago'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Phone size={18} style={{ color: 'var(--color-text)' }} className="cursor-pointer" />
                    <Video size={20} style={{ color: 'var(--color-text)' }} className="cursor-pointer" />
                    <Info size={20} style={{ color: 'var(--color-text)' }} className="cursor-pointer" />
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 flex flex-col gap-4">
                <div className="flex flex-col items-center py-8">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center mb-3" style={{ background: 'var(--color-surface2)' }}>
                        {chat.user.avatar ? <img src={chat.user.avatar} alt={chat.user.username} className="w-full h-full object-cover" /> : <div className="text-xl font-bold">{chat.user.username[0].toUpperCase()}</div>}
                    </div>
                    <h5 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{chat.user.username}</h5>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{chat.user.handle} &bull; Instagram</p>
                    <button 
                        onClick={() => navigate(`/user/${chat.user.id}`)}
                        className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                        style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                    >
                        View Profile
                    </button>
                </div>

                <div className="text-center text-[11px] py-4" style={{ color: 'var(--color-muted)' }}>SEPTEMBER 21 at 21:10</div>

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col w-full ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                        {renderMessageContent(msg)}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <form 
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                    <button type="button" className="p-1 rounded-full hover:bg-[var(--color-surface2)]">
                        <Smile size={20} style={{ color: 'var(--color-text)' }} />
                    </button>
                    <input 
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Message..."
                        className="flex-1 bg-transparent outline-none text-sm"
                        style={{ color: 'var(--color-text)' }}
                    />
                    <div className="flex items-center gap-2">
                        {inputValue ? (
                            <button 
                                type="submit" 
                                className="font-bold text-sm" 
                                style={{ color: 'var(--color-primary)' }}
                            >
                                Send
                            </button>
                        ) : (
                            <>
                                <button type="button" className="p-1 rounded-full hover:bg-[var(--color-surface2)]">
                                    <ImageIcon size={19} style={{ color: 'var(--color-text)' }} />
                                </button>
                                <button type="button" className="p-1 rounded-full hover:bg-[var(--color-surface2)]">
                                    <Paperclip size={19} style={{ color: 'var(--color-text)' }} />
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
