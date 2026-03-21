import { useState } from 'react'
import { Check, UserPlus, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useFeedStore } from '../../store/useFeedStore'

export default function SuggestedUserCard({ user, onRemove }) {
    const navigate = useNavigate()
    const { toggleFollow } = useFeedStore()
    const [isFollowing, setIsFollowing] = useState(user.isFollowing)

    const handleFollow = async (e) => {
        e.stopPropagation()
        try {
            await toggleFollow(user.id)
            setIsFollowing(true)
            // Dynamically remove from feed after a short delay for feedback
            setTimeout(() => {
                onRemove?.(user.id)
            }, 500)
        } catch {
            // ignore
        }
    }

    const handleRemove = (e) => {
        e.stopPropagation()
        onRemove?.(user.id)
    }

    return (
        <div 
            className="group relative flex flex-col items-center p-2 rounded-2xl shrink-0 w-32 cursor-pointer transition-all active:scale-95"
            onClick={() => navigate(`/user/${user.id}`)}
        >
            {/* Remove Button */}
            <button
                onClick={handleRemove}
                className="absolute top-1 right-1 p-1 rounded-full bg-zinc-800/20 text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300 transition-colors z-10"
                aria-label="Remove suggestion"
            >
                <X size={12} strokeWidth={3} />
            </button>
            <div className="w-20 h-20 rounded-full overflow-hidden mb-2 bg-gradient-to-tr from-yellow-400 to-purple-600 p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center p-0.5">
                    {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="w-full h-full object-cover rounded-full" />
                    ) : (
                        <div className="w-full h-full rounded-full flex items-center justify-center bg-zinc-700">
                            <span className="text-2xl font-bold text-white">{(user.username || 'U').charAt(0)}</span>
                        </div>
                    )}
                </div>
            </div>
            <p className="text-[11px] font-bold truncate w-full text-center" style={{ color: 'inherit' }}>{user.username}</p>
            <p className="text-[9px] text-zinc-500 mb-2 truncate w-full text-center">{user.handle}</p>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleFollow}
                className="w-full py-1.5 rounded-lg text-[10px] font-bold transition-all"
                style={{
                    background: isFollowing ? 'var(--color-surface2)' : 'var(--color-primary)',
                    color: isFollowing ? 'var(--color-muted)' : '#000',
                    border: '1px solid var(--color-border)'
                }}
            >
                {isFollowing ? (
                    <span className="flex items-center justify-center gap-1"><Check size={11} strokeWidth={3} /> Following</span>
                ) : (
                    <span className="flex items-center justify-center gap-1"><UserPlus size={11} strokeWidth={3} /> Follow</span>
                )}
            </motion.button>
        </div>
    )
}
