import { Star, Check, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCount, useUserCurrency } from '../../utils/formatCurrency'
import Avatar from '../shared/Avatar'
import { useNavigate } from 'react-router-dom'

export default function ProfileHeader({ profile, onEdit, onOpenFollowers, onOpenFollowing }) {
    const { format: formatLocal } = useUserCurrency()
    const navigate = useNavigate()
    return (
        <div className="px-4 pt-5 pb-4 relative">
            
            {/* Avatar + stats */}
            <div className="flex items-start gap-4">
                {/* Avatar with gradient ring */}
                <div
                    className="flex-shrink-0 p-0.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))' }}
                >
                    <Avatar 
                        src={profile.avatar} 
                        alt={profile.username} 
                        size="xl" 
                        isPremium={profile.isPremium} 
                    />
                </div>

                {/* Stats */}
                <div className="flex-1 grid grid-cols-4 gap-1 pt-2">
                    {[
                        { label: 'Posts', value: formatCount(profile.posts) },
                        { label: 'NFTs', value: formatCount(profile.nfts || 0) },
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

            {/* Name + badge + handle + bio + Logo */}
            <div className="mt-3 flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                            {profile.username}
                        </p>
                        {profile.isPremium && (
                            <div className="w-3.5 h-3.5 rounded-full bg-orange-500 flex items-center justify-center p-0.5 shadow-sm">
                                <Check size={9} className="text-white" strokeWidth={5} />
                            </div>
                        )}
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
                    {/* BIO - Now clearly visible after the name/handle */}
                    {profile.bio ? (
                        <p className="text-sm mt-2 font-medium leading-relaxed" style={{ color: 'var(--color-sub)' }}>
                            {profile.bio}
                        </p>
                    ) : (
                        <p className="text-[11px] mt-1.5 italic opacity-50" style={{ color: 'var(--color-muted)' }}>
                            Add a bio to tell people about yourself...
                        </p>
                    )}
                </div>
                <div className="flex-shrink-0 ml-3">
                    <img src="/knqlogo.jpeg" alt="KnQ Logo" className="h-14 w-14 rounded-full object-cover shadow-sm opacity-80" />
                </div>
            </div>

            {/* Earnings summary */}
            <div className="mt-3 flex gap-2">
                <div
                    onClick={() => navigate('/wallet')}
                    className="flex-1 px-4 py-2.5 rounded-xl flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                    <span className="text-[10px] font-bold uppercase tracking-tight text-muted">Earned</span>
                    <span className="text-sm font-extrabold text-primary">
                        {formatLocal(profile.totalEarnings)}
                    </span>
                </div>
                {profile.referralCode && (
                    <div
                        className="flex-1 px-4 py-2.5 rounded-xl flex items-center justify-between"
                        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-tight text-indigo-500">Ref Code</span>
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{profile.referralCode}</span>
                        </div>
                        <button
                            onClick={() => {
                                const text = `Join me on KnQ Reels! Use my referral code: ${profile.referralCode} and start earning. Download now!`;
                                if (navigator.share) {
                                    navigator.share({ title: 'KnQ Reels Referral', text, url: window.location.origin });
                                } else {
                                    navigator.clipboard.writeText(text);
                                    alert('Referral link copied to clipboard!');
                                }
                            }}
                            className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center hover:bg-indigo-500/20 transition-colors"
                        >
                            <Share2 size={14} className="text-indigo-600 dark:text-indigo-400" />
                        </button>
                    </div>
                )}
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
