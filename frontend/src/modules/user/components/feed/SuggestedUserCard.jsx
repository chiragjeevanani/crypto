import { useState } from 'react'
import { Check, UserPlus, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useFeedStore } from '../../store/useFeedStore'
import Avatar from '../shared/Avatar'

const AVATAR_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f97316']

function getColor(id) {
    if (!id) return '#f59e0b';
    const idx = parseInt(String(id).replace(/\D/g, ''), 10) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx] || '#f59e0b';
}

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
            onClick={() => navigate(`/user/${user.id || user._id}`)}
        >
            {/* Remove Button */}
            <button
                onClick={handleRemove}
                className="absolute top-1 right-1 p-1 rounded-full bg-zinc-800/20 text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300 transition-colors z-10"
                aria-label="Remove suggestion"
            >
                <X size={12} strokeWidth={3} />
            </button>
            <div className="w-20 h-20 rounded-full mb-2 flex-shrink-0">
                <div 
                    className="w-full h-full rounded-full overflow-hidden shadow-sm"
                    style={{ background: getColor(user.id || user._id) }}
                >
                    <Avatar src={user.avatar} alt={user.username} className="w-full h-full" size="w-full h-full" />
                </div>
            </div>
            <div className="flex items-center gap-1 w-full justify-center">
                <p className="text-[11px] font-bold truncate" style={{ color: 'inherit' }}>{user.username}</p>
                {user.isPremium && (
                    <div className="w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center p-0.5">
                        <Check size={8} className="text-white" strokeWidth={5} />
                    </div>
                )}
            </div>
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
