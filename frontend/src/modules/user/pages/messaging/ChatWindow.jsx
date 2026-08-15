import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Info, Phone, Video, Send, Image as ImageIcon, Smile, Paperclip, PlayCircle, MoreHorizontal, X, Trash2, Edit2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/useUserStore'
import { useCallStore } from '../../store/useCallStore'
import { getSocket } from '../../../../socket'
import { messageService } from '../../../../services/messageService'
import Avatar from '../../components/shared/Avatar'
import ActionConfirmationModal from '../../components/shared/ActionConfirmationModal'
import { Trash2 as TrashIcon } from 'lucide-react'
import GroupDetailsModal from './GroupDetailsModal'

export default function ChatWindow({ chat, onBack, sharingPost, clearSharingPost }) {
    const navigate = useNavigate()
    const { profile } = useUserStore()
    const { setOutgoingCall } = useCallStore()
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const messagesEndRef = useRef(null)
    const [roomId, setRoomId] = useState('')
    const [isOtherTyping, setIsOtherTyping] = useState(false)
    const [isOnline, setIsOnline] = useState(chat?.isOnline || false)
    const typingTimeoutRef = useRef(null)
    const fileInputRef = useRef(null)
    const [isUploading, setIsUploading] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null)
    const [activeMessageOptions, setActiveMessageOptions] = useState(null)
    const [editingMessage, setEditingMessage] = useState(null)
    const [editInputValue, setEditInputValue] = useState('')
    const [showChatOptions, setShowChatOptions] = useState(false)
    const [isDeleteChatModalOpen, setIsDeleteChatModalOpen] = useState(false)
    const [showGroupDetails, setShowGroupDetails] = useState(false)
    const [tick, setTick] = useState(0)

    // Current Group state
    const [groupData, setGroupData] = useState({ name: chat?.user?.username, avatar: chat?.user?.avatar })

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    
    const handleCall = (type) => {
        if (chat?.isGroup) return; // Currently only 1v1 calls
        
        const otherId = chat.user.id || chat.user._id;
        // Agora channel names must be 64 bytes or less.
        const channelName = `call_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const socket = getSocket();
        
        socket.emit("initiate_call", {
            receiverId: otherId,
            channelName,
            callType: type,
            callerData: {
                id: profile.id,
                username: profile.username,
                avatar: profile.avatar
            }
        });

        setOutgoingCall({
            receiverData: { ...chat.user, id: otherId },
            channelName,
            callType: type
        });
    };

    // Set initial message if provided (e.g. from CTA redirect)
    useEffect(() => {
        if (chat?.initialMessage) {
            setInputValue(chat.initialMessage)
        }
    }, [chat?.initialMessage])

    // Sort user IDs for a consistent roomId (or use groupId directly)
    useEffect(() => {
        if (chat?.isGroup && chat?.groupId) {
            setRoomId(chat.groupId.toString())
        } else if (profile?.id && chat?.user?.id) {
            const sortedIds = [profile.id.toString(), chat.user.id.toString()].sort()
            setRoomId(`${sortedIds[0]}-${sortedIds[1]}`)
        }
    }, [profile?.id, chat?.user?.id, chat?.isGroup, chat?.groupId])

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
            socket.emit('mark_seen', { roomId, userId: chat.user.id, currentUserId: profile.id, isGroup: chat.isGroup })
        }).catch(err => console.error('Fetch messages error:', err))

        // Join room
        socket.emit('join_room', roomId)

        // Socket listeners
        const handleReceiveMessage = (msg) => {
            setMessages(prev => [...prev, msg])
            // If window is active, mark as seen
            socket.emit('mark_seen', { roomId, userId: chat.user.id, currentUserId: profile.id, isGroup: chat.isGroup })
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
                const now = new Date().toISOString();
                setMessages(prev => prev.map(m => m.sender === 'me' ? { ...m, status: 'seen', seenAt: now } : m))
            }
        }

        const handleUserStatusChanged = (data) => {
            if (data.userId && data.userId.toString() === chat?.user?.id?.toString()) {
                setIsOnline(data.status === 'online')
            }
        }

        const handleStatusSent = (data) => {
            setMessages(prev => prev.map(m => m.id === data.id ? { ...m, status: data.status } : m))
        }


        const handleOwnMessageSent = (data) => {
            // Find the optimistic message (starts with 'me-') and update its ID
            setMessages(prev => {
                // Find the index of the most recent message with 'me-' ID
                // We search from the end of the array (reverse) as it's the most likely candidate
                let index = -1;
                for (let i = prev.length - 1; i >= 0; i--) {
                    if (prev[i].id.toString().startsWith('me-') && 
                        (prev[i].text?.trim() === data.text?.trim() || prev[i].type !== 'text')) {
                        index = i;
                        break;
                    }
                }

                if (index !== -1) {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], id: data.id, status: data.status };
                    return updated;
                }
                return prev;
            });
        }

        const handleMessageDeleted = (data) => {
            if (data.roomId === roomId) {
                setMessages(prev => prev.filter(m => m.id !== data.messageId))
            }
        }

        const handleMessageEdited = (data) => {
            if (data.roomId === roomId) {
                setMessages(prev => prev.map(m => 
                    m.id === data.messageId 
                    ? { ...m, text: data.text, payload: { ...m.payload, isEdited: data.isEdited } } 
                    : m
                ))
            }
        }

        const handleChatDeleted = (data) => {
            if (data.roomId === roomId) {
                setMessages([])
                if (onBack) onBack() // Optionally redirect back if chat is deleted
            }
        }

        socket.on('receive_message', handleReceiveMessage)
        socket.on('user_typing', handleUserTyping)
        socket.on('user_stop_typing', handleUserStopTyping)
        socket.on('messages_seen_update', handleMessagesSeenUpdate)
        socket.on('message_status_sent', handleStatusSent)
        socket.on('own_message_sent', handleOwnMessageSent)
        socket.on('user_status_changed', handleUserStatusChanged)
        socket.on('message_deleted', handleMessageDeleted)
        socket.on('message_edited', handleMessageEdited)
        socket.on('chat_deleted', handleChatDeleted)
        
        // Force refresh of Edit timer every second
        const timer = setInterval(() => {
            setTick(prev => prev + 1)
        }, 1000)

        return () => {
            clearInterval(timer)
            socket.off('receive_message', handleReceiveMessage)
            socket.off('user_typing', handleUserTyping)
            socket.off('user_stop_typing', handleUserStopTyping)
            socket.off('messages_seen_update', handleMessagesSeenUpdate)
            socket.off('message_status_sent', handleStatusSent)
            socket.off('own_message_sent', handleOwnMessageSent)
            socket.off('user_status_changed', handleUserStatusChanged)
            socket.off('message_deleted', handleMessageDeleted)
            socket.off('message_edited', handleMessageEdited)
            socket.off('chat_deleted', handleChatDeleted)
        }
    }, [roomId, profile.id, chat.user.id])

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOtherTyping])

    const handleSendMessage = (e) => {
        if (e) e.preventDefault()
        if ((!inputValue.trim() && !sharingPost) || !roomId) return

        const socket = getSocket()
        socket.emit('stop_typing', { roomId, userId: profile.id })

        if (sharingPost) {
            const type = sharingPost.type === 'profile' ? 'profile' : ((sharingPost.media?.type || sharingPost.type) === 'video' ? 'reel' : 'post')
            const payload = {
                id: sharingPost.id || sharingPost._id,
                caption: sharingPost.caption || sharingPost.bio || 'Check out this profile!',
                thumbnail: sharingPost.media?.thumbnail || sharingPost.media?.url || sharingPost.thumbnail || sharingPost.avatar || '/person.png',
                creator: {
                    username: sharingPost.creator?.username || sharingPost.username || 'User',
                    avatar: sharingPost.creator?.avatar || sharingPost.avatar
                }
            }

            const messageData = {
                roomId,
                sender: profile.id,
                receiver: chat.isGroup ? null : chat.user.id,
                groupId: chat.isGroup ? chat.groupId : null,
                text: inputValue.trim() || `Sent a ${type}`,
                type: type,
                payload
            }

            // Optimistic update locally
            const localMsg = {
                id: `me-${Date.now()}`,
                sender: 'me',
                text: inputValue.trim() || `Sent a ${type}`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                createdAt: new Date().toISOString(),
                type: type,
                payload
            }

            setMessages(prev => [...prev, localMsg])
            setInputValue('')
            clearSharingPost?.()
            
            // Emit through socket
            socket.emit('send_message', messageData)
        } else {
            const messageData = {
                roomId,
                sender: profile.id,
                receiver: chat.isGroup ? null : chat.user.id,
                groupId: chat.isGroup ? chat.groupId : null,
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
                createdAt: new Date().toISOString(),
                type: 'text'
            }

            setMessages(prev => [...prev, localMsg])
            setInputValue('')

            // Emit through socket
            socket.emit('send_message', messageData)
        }
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
                    receiver: chat.isGroup ? null : chat.user.id,
                    groupId: chat.isGroup ? chat.groupId : null,
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

    const handleDeleteMessage = async (messageId) => {
        try {
            const res = await messageService.deleteMessage(messageId)
            if (res.success) {
                setMessages(prev => prev.filter(m => m.id !== messageId))
                setActiveMessageOptions(null)
            }
        } catch (err) {
            console.error('Delete message error:', err)
        }
    }

    const handleStartEdit = (msg) => {
        setEditingMessage(msg)
        setEditInputValue(msg.text)
        setActiveMessageOptions(null)
    }

    const handleSaveEdit = async () => {
        if (!editingMessage || !editInputValue.trim()) return
        try {
            const res = await messageService.editMessage(editingMessage.id, editInputValue)
            if (res.success) {
                setMessages(prev => prev.map(m => 
                    m.id === editingMessage.id 
                    ? { ...m, text: editInputValue, payload: { ...m.payload, isEdited: true } } 
                    : m
                ))
                setEditingMessage(null)
            }
        } catch (err) {
            console.error('Edit message error:', err)
        }
    }

    const handleDeleteChat = async () => {
        try {
            const res = await messageService.deleteChat(roomId)
            if (res.success) {
                setMessages([])
                setShowChatOptions(false)
                if (onBack) onBack()
            }
        } catch (err) {
            console.error('Delete chat error:', err)
        }
    }

    const renderMessageContent = (msg) => {
        if (msg.type === 'text') {
            const isMe = msg.sender === 'me'
            return (
                <div 
                    className={`max-w-[80%] min-w-[70px] px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm relative transition-all ${isMe ? 'text-white self-end rounded-br-none' : 'bg-[var(--color-surface2)] text-[var(--color-text)] self-start rounded-bl-none'}`}
                    style={isMe ? { 
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    } : {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                    }}
                >
                    <div className="mb-1 break-words">{msg.text}</div>
                    <div className="flex items-center justify-end gap-1.5 opacity-70">
                        <span className="text-[9px] font-medium">{msg.timestamp}</span>
                        {isMe && (
                            <div className="flex items-center">
                                {msg.status === 'seen' ? (
                                    <div className="text-[10px] text-blue-300 font-bold leading-none">✓✓</div>
                                ) : msg.status === 'delivered' ? (
                                    <div className="text-[10px] text-white/90 leading-none">✓✓</div>
                                ) : (
                                    <div className="text-[10px] text-white/70 leading-none">✓</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        if (msg.type === 'post' || msg.type === 'reel' || msg.type === 'profile') {
            const isMe = msg.sender === 'me'
            const routePath = msg.type === 'profile' 
                ? `/user/${msg.payload.id}` 
                : `/home?view=${msg.type === 'reel' ? 'reels' : 'explore'}&post=${msg.payload.id}`
                
            return (
                <div 
                    className={`max-w-[75%] rounded-2xl overflow-hidden shadow-sm border ${isMe ? 'self-end' : 'self-start'}`}
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                    {/* Creator header */}
                    <div className="flex items-center gap-2 p-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface2)' }}>
                            {msg.payload?.creator?.avatar ? (
                                <img src={msg.payload.creator.avatar} alt={msg.payload.creator.username} className="w-full h-full object-cover" />
                            ) : (
                                <img src="/person.png" alt={msg.payload?.creator?.username} className="w-full h-full object-cover opacity-60" />
                            )}
                        </div>
                        <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                            {msg.payload?.creator?.username || 'Unknown Creator'}
                        </span>
                    </div>

                    {/* Content thumbnail */}
                    <div 
                        className="relative aspect-square w-full bg-black/5 cursor-pointer"
                        onClick={() => msg.payload?.id && navigate(routePath)}
                    >
                        {msg.type === 'reel' ? (
                            <video 
                                src={msg.payload?.thumbnail} 
                                poster={msg.payload?.thumbnail?.includes('cloudinary') ? msg.payload.thumbnail.replace(/\.[^/.]+$/, ".jpg") : ""} 
                                className="w-full h-full object-cover" 
                                muted 
                                playsInline 
                                preload="metadata" 
                            />
                        ) : (
                            <img 
                                src={msg.payload?.thumbnail} 
                                alt={msg.payload?.caption || "post"} 
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

                    {/* Message / Caption */}
                    <div className="p-2.5">
                        {msg.text && !msg.text.startsWith('Sent a ') && (
                            <p className="text-xs font-medium mb-2 pb-2 border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                                {msg.text}
                            </p>
                        )}
                        <p className="text-[11px] font-semibold" style={{ color: 'var(--color-text)' }}>{msg.payload?.creator?.username || 'User'}</p>
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--color-muted)' }}>{msg.payload?.caption || ''}</p>
                    </div>

                    {/* Footer button */}
                    <button 
                        onClick={() => msg.payload?.id && navigate(routePath)}
                        className="w-full py-2 text-center text-xs font-semibold border-t transition-colors hover:bg-[var(--color-surface2)]"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                        View {msg.type === 'profile' ? 'Profile' : (msg.type === 'reel' ? 'Reel' : 'Post')}
                    </button>
                </div>
            )
        }

        if (msg.type === 'image') {
            return (
                <div 
                    className={`max-w-[70%] rounded-2xl overflow-hidden border cursor-pointer ${msg.sender === 'me' ? 'self-end' : 'self-start'}`}
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                    onClick={() => setSelectedImage(msg.payload.url)}
                >
                    <img src={msg.payload.url} alt="shared image" className="max-w-full h-auto object-cover max-h-60" />
                </div>
            )
        }

        if (msg.type === 'video') {
            return (
                <div 
                    className={`max-w-[80%] rounded-2xl overflow-hidden border ${msg.sender === 'me' ? 'self-end' : 'self-start'}`}
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                    <video 
                        src={msg.payload.url} 
                        controls 
                        className="max-w-full h-auto max-h-80"
                        preload="metadata"
                    />
                </div>
            )
        }

        if (msg.type === 'audio') {
            const isMe = msg.sender === 'me'
            return (
                <div 
                    className={`max-w-[80%] px-4 py-3 rounded-2xl flex flex-col gap-2 ${isMe ? 'text-white self-end rounded-br-none' : 'bg-[var(--color-surface2)] text-[var(--color-text)] self-start rounded-bl-none'}`}
                    style={isMe ? { background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))' } : {}}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                            <PlayCircle size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold truncate">{msg.payload.name || 'Audio contribution'}</p>
                        </div>
                    </div>
                    <audio 
                        src={msg.payload.url} 
                        controls 
                        className={`w-full h-8 ${isMe ? 'brightness-200 contrast-50' : ''}`}
                        style={{ filter: isMe ? 'invert(1) hue-rotate(180deg)' : 'none' }}
                    />
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

        if (msg.type === 'system') {
            if (msg.payload?.isCallLog) {
                const Icon = msg.payload.callType === 'video' ? Video : Phone;
                const isFailed = msg.payload.callStatus === 'Missed' || msg.payload.callStatus === 'Declined';
                return (
                    <div className="w-full flex justify-center my-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                            <Icon size={16} className={isFailed ? 'text-red-500' : 'text-gray-500'} />
                            <span className="text-xs font-medium">{msg.text}</span>
                        </div>
                    </div>
                )
            }
            return (
                <div className="w-full flex justify-center my-2">
                    <div className="px-3 py-1 rounded-full text-[10px] font-medium" style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}>
                        {msg.text}
                    </div>
                </div>
            )
        }

        return null
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b backdrop-blur-md" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {onBack && (
                        <button onClick={onBack} className="p-1 -ml-1 rounded-full hover:bg-[var(--color-surface2)] transition-colors shrink-0">
                            <ChevronLeft size={24} style={{ color: 'var(--color-text)' }} />
                        </button>
                    )}
                    <div className="relative shrink-0">
                        <Avatar 
                            src={chat.user.avatar} 
                            alt={chat.user.username} 
                            size="md" 
                        />
                        {isOnline && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-bg)] bg-green-500" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{chat.isGroup ? groupData.name : chat.user.username}</h4>
                        <p className="text-[10px] truncate" style={{ color: 'var(--color-muted)' }}>{chat.isGroup ? 'Group Chat' : isOnline ? 'Active now' : 'Offline'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 relative ml-2">
                    {!chat?.isGroup && (
                        <>
                            <button 
                                onClick={() => handleCall('audio')}
                                className="p-1.5 rounded-full hover:bg-[var(--color-surface2)] transition-colors"
                            >
                                <Phone size={18} style={{ color: 'var(--color-text)' }} />
                            </button>
                            <button 
                                onClick={() => handleCall('video')}
                                className="p-1.5 rounded-full hover:bg-[var(--color-surface2)] transition-colors"
                            >
                                <Video size={18} style={{ color: 'var(--color-text)' }} />
                            </button>
                        </>
                    )}
                    <button 
                        onClick={() => setShowChatOptions(!showChatOptions)}
                        className="p-1 rounded-full hover:bg-[var(--color-surface2)] transition-colors"
                    >
                        <MoreHorizontal size={20} style={{ color: 'var(--color-text)' }} />
                    </button>

                    <AnimatePresence>
                        {showChatOptions && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowChatOptions(false)} />
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-40"
                                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                                >
                                    <button 
                                        onClick={() => {
                                            setShowChatOptions(false)
                                            setIsDeleteChatModalOpen(true)
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        Delete Chat
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setShowChatOptions(false)
                                            if (chat.isGroup) {
                                                setShowGroupDetails(true)
                                            } else {
                                                // 1v1 Chat details
                                            }
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-[var(--color-surface2)] transition-colors"
                                        style={{ color: 'var(--color-text)' }}
                                    >
                                        <Info size={16} />
                                        Chat Details
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 flex flex-col gap-4">
                <div className="flex flex-col items-center py-8">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center mb-3" style={{ background: 'var(--color-surface2)' }}>
                        <img src={chat.isGroup ? (groupData.avatar || '/group-placeholder.png') : (chat.user.avatar || '/person.png')} alt={chat.isGroup ? groupData.name : chat.user.username} className={`w-full h-full object-cover ${(!chat.isGroup && !chat.user.avatar) ? 'opacity-60' : ''}`} />
                    </div>
                    <h5 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{chat.isGroup ? groupData.name : chat.user.username}</h5>
                    {!chat.isGroup && <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{chat.user.handle} &bull; KnQ Reels</p>}
                    {!chat.isGroup && (
                        <button 
                            onClick={() => navigate(`/user/${chat.user.id}`)}
                            className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                            style={{ background: 'var(--color-surface2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                        >
                            View Profile
                        </button>
                    )}
                </div>

                <div className="text-center text-[11px] py-4" style={{ color: 'var(--color-muted)' }}>CHAT HISTORY</div>

                {messages.map((msg, index) => {
                    let showDateSeparator = false;
                    let dateText = '';

                    if (msg.createdAt || msg.timestamp) {
                        const msgDate = new Date(msg.createdAt || Date.now());
                        const msgDateString = msgDate.toDateString();

                        if (index === 0) {
                            showDateSeparator = true;
                        } else {
                            const prevMsg = messages[index - 1];
                            const prevMsgDate = new Date(prevMsg.createdAt || Date.now());
                            if (msgDateString !== prevMsgDate.toDateString()) {
                                showDateSeparator = true;
                            }
                        }

                        if (showDateSeparator) {
                            const today = new Date().toDateString();
                            const yesterday = new Date(Date.now() - 86400000).toDateString();

                            if (msgDateString === today) {
                                dateText = 'Today';
                            } else if (msgDateString === yesterday) {
                                dateText = 'Yesterday';
                            } else {
                                dateText = msgDate.toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                });
                            }
                        }
                    }

                    return (
                    <div key={msg.id} className="w-full">
                        {showDateSeparator && (
                            <div className="flex justify-center my-6">
                                <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider" 
                                      style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}>
                                    {dateText}
                                </span>
                            </div>
                        )}
                        <div 
                            className={`group flex flex-col w-full relative ${msg.sender === 'me' ? 'items-end' : 'items-start'} ${!showDateSeparator ? 'mt-2' : ''}`}
                        >
                            {editingMessage?.id === msg.id ? (
                            <div className="w-full max-w-[70%] flex flex-col gap-2">
                                <textarea
                                    value={editInputValue}
                                    onChange={(e) => setEditInputValue(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-2xl text-sm bg-[var(--color-surface2)] text-[var(--color-text)] outline-none border border-[var(--color-primary)] resize-none"
                                    rows={2}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => setEditingMessage(null)}
                                        className="text-[10px] font-bold px-3 py-1 rounded-lg bg-[var(--color-surface2)]"
                                        style={{ color: 'var(--color-text)' }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSaveEdit}
                                        className="text-[10px] font-bold px-3 py-1 rounded-lg bg-[var(--color-primary)] text-white"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={`relative flex items-center gap-2 group max-w-[90%] ${msg.sender === 'me' ? 'flex-row' : 'flex-row-reverse'}`}>
                                {/* Message Options Trigger - Always visible but subtle */}
                                {msg.sender === 'me' && (
                                    <button 
                                        onClick={() => setActiveMessageOptions(activeMessageOptions === msg.id ? null : msg.id)}
                                        className={`p-1.5 rounded-full hover:bg-[var(--color-surface2)] transition-all ${activeMessageOptions === msg.id ? 'bg-[var(--color-surface2)] opacity-100' : 'opacity-30 group-hover:opacity-100 hover:opacity-100'}`}
                                        title="Message options"
                                    >
                                        <MoreHorizontal size={16} style={{ color: 'var(--color-muted)' }} />
                                    </button>
                                )}

                                {/* Message Content */}
                                <div className="flex-1 flex flex-col items-end">
                                    {renderMessageContent(msg)}
                                    {msg.payload?.isEdited && (
                                        <span className="text-[9px] mt-0.5 opacity-50 italic" style={{ color: msg.sender === 'me' ? '#fff' : 'var(--color-muted)' }}>
                                            edited
                                        </span>
                                    )}
                                </div>

                                {/* Options Menu */}
                                <AnimatePresence>
                                    {activeMessageOptions === msg.id && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveMessageOptions(null)} />
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="absolute bottom-full mb-1 z-50 rounded-xl shadow-xl border overflow-hidden min-w-[120px]"
                                                style={{ 
                                                    background: 'var(--color-surface)', 
                                                    borderColor: 'var(--color-border)',
                                                    right: msg.sender === 'me' ? '0' : 'auto',
                                                    left: msg.sender === 'me' ? 'auto' : '0'
                                                }}
                                            >
                                                {msg.sender === 'me' && (msg.type === 'text' || !msg.type) && (() => {
                                                    // Rule: Only edit if synced (has real ID from server)
                                                    const isSynced = !msg.id.toString().startsWith('me-');
                                                    if (!isSynced) return null;

                                                    // Rule: Can edit if unseen, or within 6 seconds of being seen
                                                    const isSeen = msg.status === 'seen';
                                                    const seenTooLong = isSeen && msg.seenAt && (Date.now() - new Date(msg.seenAt).getTime()) > 6000;
                                                    
                                                    if (seenTooLong) return null;

                                                    return (
                                                        <button 
                                                            onClick={() => handleStartEdit(msg)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-[var(--color-surface2)] transition-colors"
                                                            style={{ color: 'var(--color-text)' }}
                                                        >
                                                            <Edit2 size={16} />
                                                            Edit
                                                        </button>
                                                    );
                                                })()}
                                                <button 
                                                    onClick={() => !msg.id.toString().startsWith('me-') && handleDeleteMessage(msg.id)}
                                                    disabled={msg.id.toString().startsWith('me-')}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors ${msg.id.toString().startsWith('me-') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                    </div>
                    );
                })}

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
                                    <img 
                                        src={
                                            sharingPost.type === 'profile'
                                                ? (sharingPost.avatar || '/person.png')
                                                : (() => {
                                                    const rawUrl = sharingPost.media?.url || sharingPost.thumbnail;
                                                    if (!rawUrl) return '/person.png';
                                                    
                                                    const isVideo = sharingPost.media?.type === 'video' || 
                                                                    sharingPost.type === 'reel' || 
                                                                    (typeof rawUrl === 'string' && rawUrl.toLowerCase().endsWith('.mp4'));
                                                    
                                                    if (isVideo) {
                                                        const thumb = sharingPost.media?.thumbnail || sharingPost.media?.poster;
                                                        if (thumb && !thumb.endsWith('.mp4')) return thumb;
                                                        if (typeof rawUrl === 'string') {
                                                            return rawUrl.replace(/\.[^/.]+$/, ".jpg");
                                                        }
                                                        return '/video_placeholder.png';
                                                    }
                                                    return rawUrl;
                                                })()
                                        } 
                                        alt="shared content" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = '/person.png';
                                        }}
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>Share this {sharingPost.type === 'profile' ? 'Profile' : ((sharingPost.media?.type || sharingPost.type) === 'video' ? 'Reel' : 'Post')}?</p>
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
                                    onClick={() => handleSendMessage()}
                                    className="px-4 py-2 rounded-lg text-xs font-bold"
                                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                                >
                                    KnQ Reels
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
                        className="flex-1 min-w-0 bg-transparent outline-none text-sm"
                        style={{ color: 'var(--color-text)' }}
                    />
                    <div className="flex items-center gap-2 shrink-0">
                        {inputValue ? (
                            <button 
                                type="submit" 
                                className="font-bold text-sm shrink-0" 
                                style={{ color: 'var(--color-primary)' }}
                            >
                                Send
                            </button>
                        ) : (
                            <>
                                <button 
                                    type="button" 
                                    className={`p-1 rounded-full hover:bg-[var(--color-surface2)] shrink-0 ${isUploading ? 'animate-pulse opacity-50' : ''}`}
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
                                    accept="image/*,video/*,audio/*,.mp3,.wav,.m4a,application/pdf"
                                />
                                <button 
                                    type="button" 
                                    className={`p-1 rounded-full hover:bg-[var(--color-surface2)] shrink-0 ${isUploading ? 'animate-pulse opacity-50' : ''}`}
                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    <Paperclip size={19} className="-rotate-45" style={{ color: 'var(--color-text)' }} />
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>

            {/* Image Preview Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
                    >
                        <motion.button
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={24} />
                        </motion.button>
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={selectedImage}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <ActionConfirmationModal 
                isOpen={isDeleteChatModalOpen}
                onClose={() => setIsDeleteChatModalOpen(false)}
                onConfirm={handleDeleteChat}
                title="Delete Chat History?"
                message="Are you sure you want to delete this entire chat history? This cannot be undone."
                confirmText="Yes, Delete All"
                variant="danger"
                Icon={TrashIcon}
            />

            {/* Group Details Modal */}
            <GroupDetailsModal 
                isOpen={showGroupDetails}
                onClose={() => setShowGroupDetails(false)}
                groupId={chat?.groupId}
                onGroupUpdated={(updatedGroup) => {
                    setGroupData({ name: updatedGroup.name, avatar: updatedGroup.avatar });
                }}
                onLeave={() => {
                    if (onBack) onBack();
                }}
            />
        </div>
    )
}
