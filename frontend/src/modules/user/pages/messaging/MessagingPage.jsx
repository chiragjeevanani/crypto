import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Search, MoreVertical, Send, Image as ImageIcon, Smile, Paperclip } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import ConversationList from './ConversationList'
import ChatWindow from './ChatWindow'
import { useUserStore } from '../../store/useUserStore'

export default function MessagingPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { profile } = useUserStore()
    const [selectedChat, setSelectedChat] = useState(null)
    const [showChatMobile, setShowChatMobile] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const [sharingPost, setSharingPost] = useState(null)

    useEffect(() => {
        const state = location.state
        const searchParams = new URLSearchParams(location.search)
        
        const paramText = searchParams.get('text') || searchParams.get('sharedText') || searchParams.get('title') || searchParams.get('caption')
        const paramUrl = searchParams.get('url') || searchParams.get('sharedUrl')
        const paramImage = searchParams.get('image') || searchParams.get('sharedImage') || searchParams.get('media') || searchParams.get('sharedMedia') || searchParams.get('mediaUrl')

        let localIntent = null
        try {
            const raw = localStorage.getItem('knq_shared_intent') || localStorage.getItem('knq_share_data')
            if (raw) {
                localIntent = JSON.parse(raw)
                localStorage.removeItem('knq_shared_intent')
                localStorage.removeItem('knq_share_data')
            }
        } catch {
            // ignore
        }

        const sharedMediaUrl = paramImage || localIntent?.image || localIntent?.mediaUrl || localIntent?.url
        const sharedTextContent = paramText || localIntent?.text || localIntent?.caption || (paramUrl && paramUrl !== sharedMediaUrl ? paramUrl : '')

        if (state?.openChat) {
            setSelectedChat({
                id: null,
                user: state.openChat,
                lastMessage: { text: state.initialMessage || sharedTextContent || '', timestamp: '' },
                isOnline: false,
                initialMessage: state.initialMessage || sharedTextContent,
                autoSharePost: state.sharedPost
            })
            if (isMobile) {
                setShowChatMobile(true)
            }
        }

        if (state?.sharePost || state?.sharedPost) {
            setSharingPost(state.sharePost || state.sharedPost)
        } else if (sharedMediaUrl || sharedTextContent) {
            setSharingPost({
                id: `shared_${Date.now()}`,
                type: sharedMediaUrl ? 'image' : 'text',
                url: sharedMediaUrl || null,
                media: sharedMediaUrl ? { url: sharedMediaUrl, type: 'image' } : null,
                caption: sharedTextContent || '',
                text: sharedTextContent || '',
                creator: {
                    username: profile?.username || 'User',
                    avatar: profile?.avatar
                }
            })
        }

        if (state || searchParams.toString() || localIntent) {
            navigate(location.pathname, { replace: true, state: null })
        }
    }, [location.state, location.search, isMobile, location.pathname, navigate, profile?.username, profile?.avatar])

    const handleSelectChat = (chat) => {
        setSelectedChat(chat)
        if (isMobile) {
            setShowChatMobile(true)
        }
    }

    const handleBackToList = () => {
        setShowChatMobile(false)
    }

    return (
        <div className="flex w-full h-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>
            {/* Desktop: Sidebar + Chat */}
            {!isMobile && (
                <>
                    <div className="w-56 lg:w-72 xl:w-80 shrink-0 border-r" style={{ borderColor: 'var(--color-border)' }}>
                        <ConversationList
                            onSelectChat={handleSelectChat}
                            selectedChatId={selectedChat?.id || selectedChat?.user?.id}
                        />
                    </div>
                    <div className="flex-1 flex flex-col">
                        {selectedChat ? (
                            <ChatWindow
                                chat={selectedChat}
                                sharingPost={sharingPost}
                                clearSharingPost={() => setSharingPost(null)}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                                    style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}>
                                    <Send size={40} />
                                </div>
                                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Your Messages</h3>
                                <p className="text-sm max-w-xs" style={{ color: 'var(--color-muted)' }}>
                                    Send private photos and messages to a friend or group.
                                </p>
                                <button
                                    className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
                                    style={{ background: 'var(--color-primary)', color: '#fff' }}
                                >
                                    Send Message
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Mobile: Animated transition between List and Chat */}
            {isMobile && (
                <div className="relative w-full h-full overflow-hidden">
                    <AnimatePresence initial={false}>
                        {!showChatMobile ? (
                            <motion.div
                                key="list"
                                initial={{ x: 0 }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="absolute inset-0 w-full h-full"
                            >
                                <ConversationList
                                    onSelectChat={handleSelectChat}
                                    selectedChatId={selectedChat?.id || selectedChat?.user?.id}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="chat"
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="absolute inset-0 w-full h-full z-[80]"
                            >
                                <ChatWindow
                                    chat={selectedChat}
                                    onBack={handleBackToList}
                                    sharingPost={sharingPost}
                                    clearSharingPost={() => setSharingPost(null)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
