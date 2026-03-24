import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Info, Phone, Video, Send, Image as ImageIcon, Smile, Paperclip, PlayCircle, MoreHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/useUserStore'
import { getSocket } from '../../../../socket'
import { messageService } from '../../../../services/messageService'

export default function ChatWindow({ chat, onBack, sharingPost, clearSharingPost }) {
    const navigate = useNavigate()
    const { profile } = useUserStore()
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const messagesEndRef = useRef(null)
    const [roomId, setRoomId] = useState('')
    const [isOtherTyping, setIsOtherTyping] = useState(false)
    const typingTimeoutRef = useRef(null)
    const fileInputRef = useRef(null)
    const [isUploading, setIsUploading] = useState(false)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Sort user IDs for a consistent roomId
    useEffect(() => {
        if (profile?.id && chat?.user?.id) {
            const sortedIds = [profile.id.toString(), chat.user.id.toString()].sort()
            setRoomId(`${sortedIds[0]}-${sortedIds[1]}`)
        }
    }, [profile?.id, chat?.user?.id])

    useEffect(() => {
        if (!roomId) return

        const socket = getSocket()
        if (!socket.connected) socket.connect()

        // Register user identity on socket
        socket.emit('register_user', profile.id)

        // Fetch initial messages
        messageService.getMessages(roomId).then(msgs => {
            setMessages(msgs)
            // Mark all existing messages as seen
            socket.emit('mark_seen', { roomId, userId: chat.user.id, currentUserId: profile.id })
        }).catch(err => console.error('Fetch messages error:', err))

        // Join room
        socket.emit('join_room', roomId)

        // Socket listeners
        const handleReceiveMessage = (msg) => {
            setMessages(prev => [...prev, msg])
            // If window is active, mark as seen
            socket.emit('mark_seen', { roomId, userId: chat.user.id, currentUserId: profile.id })
        }

        const handleUserTyping = (data) => {
            if (data.roomId === roomId && data.userId !== profile.id) {
                setIsOtherTyping(true)
            }
        }

        const handleUserStopTyping = (data) => {
            if (data.roomId === roomId) {
                setIsOtherTyping(false)
            }
        }

        const handleMessagesSeenUpdate = (data) => {
            if (data.roomId === roomId) {
                setMessages(prev => prev.map(m => m.sender === 'me' ? { ...m, status: 'seen' } : m))
            }
        }

        const handleStatusSent = (data) => {
            setMessages(prev => prev.map(m => m.id === data.id ? { ...m, status: data.status } : m))
        }

        socket.on('receive_message', handleReceiveMessage)
        socket.on('user_typing', handleUserTyping)
        socket.on('user_stop_typing', handleUserStopTyping)
        socket.on('messages_seen_update', handleMessagesSeenUpdate)
        socket.on('message_status_sent', handleStatusSent)

        return () => {
            socket.off('receive_message', handleReceiveMessage)
            socket.off('user_typing', handleUserTyping)
            socket.off('user_stop_typing', handleUserStopTyping)
            socket.off('messages_seen_update', handleMessagesSeenUpdate)
            socket.off('message_status_sent', handleStatusSent)
        }
    }, [roomId, profile.id])

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOtherTyping])

    const handleSendMessage = (e) => {
        e.preventDefault()
        if (!inputValue.trim() || !roomId) return

        const socket = getSocket()
        socket.emit('stop_typing', { roomId, userId: profile.id })

        const messageData = {
            roomId,
            sender: profile.id,
            receiver: chat.user.id,
            text: inputValue,
            type: 'text'
        }

        // Optimistic update locally
        const localMsg = {
            id: `me-${Date.now()}`,
            sender: 'me',
            text: inputValue,
            status: 'sent',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            type: 'text'
        }

        setMessages(prev => [...prev, localMsg])
        setInputValue('')

        // Emit through socket
        socket.emit('send_message', messageData)
    }

    const handleInputChange = (e) => {
        setInputValue(e.target.value)
        const socket = getSocket()
        
        socket.emit('typing', { roomId, userId: profile.id })

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop_typing', { roomId, userId: profile.id })
        }, 2000)
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file || !roomId) return

        setIsUploading(true)
        try {
            const data = await messageService.uploadMedia(file)
            if (data.success) {
                const socket = getSocket()
                const messageData = {
                    roomId,
                    sender: profile.id,
                    receiver: chat.user.id,
                    text: data.name,
                    type: data.type, // 'image' or 'file'
                    payload: {
                        url: data.url,
                        name: data.name,
                        mimeType: data.mimeType
                    }
                }

                // Optimistic local update
                const localMsg = {
                    id: `me-${Date.now()}`,
                    sender: 'me',
                    text: data.name,
                    type: data.type,
                    payload: { url: data.url, name: data.name },
                    status: 'sent',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                }
                setMessages(prev => [...prev, localMsg])
                
                socket.emit('send_message', messageData)
            }
        } catch (err) {
            console.error('File upload failed:', err)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSendPost = () => {
        if (!sharingPost || !roomId) return

        const type = sharingPost.media?.type === 'video' ? 'reel' : 'post'
        const socket = getSocket()
        const payload = {
            id: sharingPost.id,
            caption: sharingPost.caption,
            thumbnail: sharingPost.media?.thumbnail || sharingPost.media?.url,
            creator: {
                username: sharingPost.creator?.username,
                avatar: sharingPost.creator?.avatar
            }
        }

        const messageData = {
            roomId,
            sender: profile.id,
            receiver: chat.user.id,
            text: `Sent a ${type}`,
            type: type,
            payload
        }

        // Optimistic update locally
        const localMsg = {
            id: `me-${Date.now()}`,
            sender: 'me',
            text: `Sent a ${type}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            type: type,
            payload
        }

        setMessages(prev => [...prev, localMsg])
        
        // Emit through socket
        socket.emit('send_message', messageData)
        
        // Clear global state
        clearSharingPost?.()
    }

    const renderMessageContent = (msg) => {
        if (msg.type === 'text') {
            return (
                <div 
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${msg.sender === 'me' ? 'text-white self-end rounded-br-none' : 'bg-[var(--color-surface2)] text-[var(--color-text)] self-start rounded-bl-none'}`}
                    style={msg.sender === 'me' ? { background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))' } : {}}
                >
                    {msg.text}
                    {msg.sender === 'me' && (
                        <div className="flex justify-end mt-0.5">
                            {msg.status === 'seen' ? (
                                <div className="flex -space-x-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                </div>
                            ) : (
                                <div className="text-[10px] opacity-70">✓</div>
                            )}
                        </div>
                    )}
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
                            {msg.payload.creator.avatar ? <img src={msg.payload.creator.avatar} alt={msg.payload.creator.username} className="w-full h-full object-cover" /> : <div className="text-[10px] font-bold">{msg.payload.creator.username?.[0]?.toUpperCase() || 'U'}</div>}
                        </div>
                        <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--color-text)' }}>{msg.payload.creator.username}</span>
                    </div>

                    {/* Content thumbnail */}
                    <div 
                        className="relative aspect-square w-full bg-black/5 cursor-pointer"
                        onClick={() => navigate(`/home?view=${msg.type === 'reel' ? 'reels' : 'explore'}&post=${msg.payload.id}`)}
                    >
                        {msg.type === 'reel' ? (
                            <video 
                                src={msg.payload.thumbnail} 
                                poster={msg.payload.thumbnail?.includes('cloudinary') ? msg.payload.thumbnail.replace(/\.[^/.]+$/, ".jpg") : ""} 
                                className="w-full h-full object-cover" 
                                muted 
                                playsInline 
                                preload="metadata" 
                            />
                        ) : (
                            <img 
                                src={msg.payload.thumbnail} 
                                alt={msg.payload.caption} 
                                className="w-full h-full object-cover" 
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                        )}
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

        if (msg.type === 'image') {
            return (
                <div 
                    className={`max-w-[70%] rounded-2xl overflow-hidden border ${msg.sender === 'me' ? 'self-end' : 'self-start'}`}
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                    <img src={msg.payload.url} alt="shared image" className="max-w-full h-auto object-cover max-h-60" />
                    {msg.sender === 'me' && (
                        <div className="flex justify-end p-1 absolute bottom-1 right-1">
                             {msg.status === 'seen' ? '✓✓' : '✓'}
                        </div>
                    )}
                </div>
            )
        }

        if (msg.type === 'file') {
            return (
                <div 
                    className={`max-w-[70%] px-4 py-3 rounded-2xl flex items-center gap-3 ${msg.sender === 'me' ? 'text-white self-end rounded-br-none' : 'bg-[var(--color-surface2)] text-[var(--color-text)] self-start rounded-bl-none'}`}
                    style={msg.sender === 'me' ? { background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))' } : {}}
                >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/20">
                        <Paperclip size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{msg.payload.name}</p>
                        <a href={msg.payload.url} target="_blank" rel="noreferrer" className="text-[10px] underline opacity-80 decoration-white/30">Download</a>
                    </div>
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
                        <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{chat.isOnline ? 'Active now' : 'Seen last 2h'}</p>
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

                <div className="text-center text-[11px] py-4" style={{ color: 'var(--color-muted)' }}>CHAT HISTORY</div>

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col w-full ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                        {renderMessageContent(msg)}
                    </div>
                ))}

                {isOtherTyping && (
                    <div className="flex items-center gap-2 text-[10px] font-semibold italic p-2" style={{ color: 'var(--color-muted)' }}>
                        <div className="flex gap-1">
                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 rounded-full bg-current" />
                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 rounded-full bg-current" />
                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 rounded-full bg-current" />
                        </div>
                        {chat.user.username} is typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: 'var(--color-border)' }}>
                {/* Share Post Toolbar */}
                <AnimatePresence>
                    {sharingPost && (
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="p-3 rounded-2xl flex items-center justify-between"
                            style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-primary)' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={sharingPost.media?.url} alt="shared post" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>Share this {sharingPost.media?.type === 'video' ? 'Reel' : 'Post'}?</p>
                                    <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>To: {chat.user.username}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={clearSharingPost}
                                    className="p-2 rounded-lg text-xs font-bold"
                                    style={{ color: 'var(--color-muted)' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSendPost}
                                    className="px-4 py-2 rounded-lg text-xs font-bold"
                                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                                >
                                    Share
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                        onChange={handleInputChange}
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
                                <button 
                                    type="button" 
                                    className={`p-1 rounded-full hover:bg-[var(--color-surface2)] ${isUploading ? 'animate-pulse opacity-50' : ''}`}
                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    <ImageIcon size={19} style={{ color: 'var(--color-text)' }} />
                                </button>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    accept="image/*,video/*,application/pdf"
                                />
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
