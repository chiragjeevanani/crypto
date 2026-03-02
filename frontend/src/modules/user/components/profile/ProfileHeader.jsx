import { Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCount, formatINR } from '../../utils/formatCurrency'

export default function ProfileHeader({ profile, onEdit, onOpenFollowers, onOpenFollowing }) {
    return (
        <div className="px-4 pt-5 pb-4">
            {/* Avatar + stats */}
            <div className="flex items-start gap-4">
                {/* Avatar with gradient ring */}
                <div
                    className="flex-shrink-0 p-0.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))' }}
                >
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
                        style={{ background: 'var(--color-surface2)' }}
                    >
                        {profile.avatar ? (
                            <img src={profile.avatar} alt={profile.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            profile.username.charAt(0)
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="flex-1 grid grid-cols-3 gap-2 pt-2">
                    {[
                        { label: 'Posts', value: formatCount(profile.posts) },
                        { label: 'Followers', value: formatCount(profile.followers) },
                        { label: 'Following', value: formatCount(profile.following) },
                    ].map((stat) => (
                        <button
                            key={stat.label}
                            onClick={() => {
                                if (stat.label === 'Followers') onOpenFollowers?.()
                                if (stat.label === 'Following') onOpenFollowing?.()
                            }}
                            className="flex flex-col items-center cursor-pointer"
                            disabled={stat.label === 'Posts'}
                        >
                            <span className="text-base font-extrabold" style={{ color: 'var(--color-text)' }}>
                                {stat.value}
                            </span>
                            <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                                {stat.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Name + badge */}
            <div className="mt-3">
                <div className="flex items-center gap-2">
                    <p className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                        {profile.username}
                    </p>
                    {profile.badge && (
                        <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-primary)' }}
                        >
                            <Star size={9} strokeWidth={2.5} fill="var(--color-primary)" />
                            {profile.badge}
                        </span>
                    )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {profile.handle}
                </p>
                <p className="text-sm mt-1.5" style={{ color: 'var(--color-sub)' }}>
                    {profile.bio}
                </p>
            </div>

            {/* Earnings summary */}
            <div
                className="mt-3 px-4 py-2.5 rounded-xl flex items-center justify-between"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
                <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>Total Earned</span>
                <span className="text-sm font-extrabold" style={{ color: 'var(--color-primary)' }}>
                    {formatINR(profile.totalEarnings)}
                </span>
            </div>

            {/* Edit profile button */}
            <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onEdit}
                className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            >
                Edit Profile
            </motion.button>
        </div>
    )
}
