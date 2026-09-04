import { useState } from 'react'
import { Star, Check, Share2, ChevronLeft, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCount, useUserCurrency } from '../../utils/formatCurrency'
import Avatar from '../shared/Avatar'
import { useNavigate } from 'react-router-dom'

function ShareModal({ isOpen, onClose, referralCode }) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://knqreels.com';
  const url = `${origin}/?ref=${referralCode || ''}`;
  const text = `Join me on KnQ Reels! Use my referral code: ${referralCode || ''} and start earning. Download now:`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      color: '#25D366',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.022-5.11-2.885-6.974C16.586 1.81 14.113.784 11.48.784c-5.437 0-9.862 4.421-9.866 9.86-.001 1.902.504 3.753 1.464 5.378L2.016 22.03l6.19-1.624-.559-.252z" />
        </svg>
      ),
      link: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`
    },
    {
      name: 'Telegram',
      color: '#0088cc',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.24-.213-.054-.33-.373-.117l-6.87 4.326-2.96-.924c-.643-.203-.657-.643.136-.953l11.57-4.46c.536-.203.996.124.8.982z" />
        </svg>
      ),
      link: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    },
    {
      name: 'Facebook',
      color: '#1877F2',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    }
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1c1c1e] border border-white/10 w-full max-w-sm rounded-[24px] p-6 shadow-2xl relative overflow-hidden text-white" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 transition-colors text-white/50 hover:text-white">
          <X size={18} />
        </button>
        <h3 className="text-base font-black tracking-tight text-white mb-4 uppercase">Share Referral</h3>
        <p className="text-xs text-white/50 mb-5 font-medium leading-relaxed">
          Invite friends to earn. Copy your link or share directly to your social and messaging apps.
        </p>

        {/* Input + copy button */}
        <div className="flex gap-2 p-1.5 rounded-xl border border-white/10 bg-black/30 mb-6">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 min-w-0 bg-transparent text-xs font-semibold px-2 outline-none text-white select-all"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${copied ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black hover:bg-amber-400'}`}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {shareOptions.map(opt => (
            <a
              key={opt.name}
              href={opt.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-white/5 border border-white/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-sm" style={{ backgroundColor: opt.color, color: '#fff' }}>
                {opt.icon}
              </div>
              <span className="text-[10px] font-bold text-white/80">{opt.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfileHeader({ profile, onEdit, onOpenFollowers, onOpenFollowing, onAvatarClick }) {
  const { format: formatLocal } = useUserCurrency()
  const navigate = useNavigate()
  const [isShareOpen, setIsShareOpen] = useState(false)
  return (
    <div className="px-4 pt-2 pb-3 relative">
      {/* Top Bar with Back Button */}
      <div className="flex items-center mb-1">
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 rounded-full hover:bg-[var(--color-surface2)] transition-colors cursor-pointer"
        >
          <ChevronLeft size={22} style={{ color: 'var(--color-text)' }} />
        </button>
      </div>

      {/* Avatar + stats */}
      <div className="flex items-start gap-4">
        {/* Avatar with gradient ring */}
        <div
          className="flex-shrink-0 p-0.5 rounded-full cursor-pointer transition-transform active:scale-95"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary2))' }}
          onClick={onAvatarClick}
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
            {profile.isMonetized && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}
              >
                <Star size={9} strokeWidth={2.5} fill="#10b981" />
                Monetized
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
              onClick={() => setIsShareOpen(true)}
              className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center hover:bg-indigo-500/20 transition-colors"
            >
              <Share2 size={14} className="text-indigo-600 dark:text-indigo-400" />
            </button>
          </div>
        )}
      </div>

      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} referralCode={profile.referralCode} />

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
