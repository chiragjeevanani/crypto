import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Edit2,
    Users,
    UserPlus,
    FileImage,
    Image,
    Mail,
    Calendar,
    Ban,
    AlertTriangle,
    ExternalLink,
} from 'lucide-react';
import { AdminPageHeader } from '../components/shared';
import { formatCurrency } from '../utils/currency';
import { userService } from '../services/userService';
import { moderationService } from '../services/moderationService';

const SECTIONS = { posts: 'posts', followers: 'followers', following: 'following', nfts: 'nfts' };

export default function UserDetailPage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState(SECTIONS.posts);
    const [userPosts, setUserPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [userNfts, setUserNfts] = useState([]);
    const [nftsLoading, setNftsLoading] = useState(false);
    const nftsRef = useRef(null);
    const [followersList, setFollowersList] = useState(null);
    const [followingList, setFollowingList] = useState(null);
    const [followersCountFromApi, setFollowersCountFromApi] = useState(null);
    const [followingCountFromApi, setFollowingCountFromApi] = useState(null);
    const followersRef = useRef(null);
    const followingRef = useRef(null);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        setError(null);
        setFollowersList(null);
        setFollowingList(null);
        setFollowersCountFromApi(null);
        setFollowingCountFromApi(null);
        (async () => {
            try {
                const data = await userService.fetchUserDetail(userId);
                if (!cancelled) setDetail(data && typeof data === 'object' ? data : null);
            } catch (e) {
                if (!cancelled) setError(e.message || 'Failed to load user');
            }
        })();
        return () => { cancelled = true; };
    }, [userId]);

    useEffect(() => {
        if (!detail?.id || !userId) return;
        let cancelled = false;
        userService.fetchUserFollowers(userId).then((r) => {
            if (!cancelled) {
                const list = Array.isArray(r.followers) ? [...r.followers] : [];
                setFollowersList(list);
                setFollowersCountFromApi(r.count ?? list.length);
            }
        }).catch(() => { if (!cancelled) { setFollowersList([]); setFollowersCountFromApi(0); } });
        userService.fetchUserFollowing(userId).then((r) => {
            if (!cancelled) {
                const list = Array.isArray(r.following) ? [...r.following] : [];
                setFollowingList(list);
                setFollowingCountFromApi(r.count ?? list.length);
            }
        }).catch(() => { if (!cancelled) { setFollowingList([]); setFollowingCountFromApi(0); } });
        return () => { cancelled = true; };
    }, [detail?.id, userId]);

    useEffect(() => {
        if (activeSection !== SECTIONS.posts || !userId) return;
        let cancelled = false;
        setPostsLoading(true);
        setUserPosts([]);
        moderationService.fetchPosts({ creator: userId })
            .then((posts) => { if (!cancelled) setUserPosts(posts || []); })
            .catch(() => { if (!cancelled) setUserPosts([]); })
            .finally(() => { if (!cancelled) setPostsLoading(false); });
        return () => { cancelled = true; };
    }, [activeSection, userId]);

    useEffect(() => {
        if (activeSection !== SECTIONS.nfts || !userId) return;
        let cancelled = false;
        setNftsLoading(true);
        setUserNfts([]);
        moderationService.fetchPosts({ creator: userId, isNFT: true })
            .then((posts) => { if (!cancelled) setUserNfts(posts || []); })
            .catch(() => { if (!cancelled) setUserNfts([]); })
            .finally(() => { if (!cancelled) setNftsLoading(false); });
        return () => { cancelled = true; };
    }, [activeSection, userId]);

    if (error) {
        return (
            <div className="space-y-6">
                <AdminPageHeader
                    title="User not found"
                    subtitle={error}
                    actions={
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider text-text"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Users
                        </button>
                    }
                />
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="min-h-[40vh] flex items-center justify-center text-muted text-sm">
                Loading user...
            </div>
        );
    }

    const u = detail || {};
    const followers = followersList !== null ? followersList : (Array.isArray(u.followers) ? u.followers : []);
    const following = followingList !== null ? followingList : (Array.isArray(u.following) ? u.following : []);
    const followersCount = followersCountFromApi ?? u.followersCount ?? followers.length;
    const followingCount = followingCountFromApi ?? u.followingCount ?? following.length;
    const postsCount = Math.max(0, Number(u.postsCount) || 0);
    const nftsCount = Math.max(0, Number(u.nftsCount) || 0);

    return (
        <div className="space-y-8 pb-20">
            <AdminPageHeader
                title={`User: @${u.name || u.id}`}
                subtitle={u.email ? `${u.email} · ${u.id}` : u.id}
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-surface rounded-lg text-[10px] font-semibold uppercase tracking-wider text-text"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Users
                        </button>
                        <button
                            onClick={() => navigate(`/admin/users/edit/${u.id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg text-[10px] font-bold uppercase tracking-wider"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit User
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Profile card */}
                <div className="xl:col-span-1 space-y-4">
                    <div className="bg-surface border border-surface rounded-2xl p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-2xl bg-surface2 border border-surface overflow-hidden mb-4">
                                <img
                                    src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <h2 className="text-lg font-bold text-text">@{u.name || 'User'}</h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1 mt-1">
                                <Mail className="w-3 h-3" /> {u.email || '—'}
                            </p>
                            <p className="text-[9px] text-muted mt-1">{u.id}</p>
                            {u.joined && (
                                <p className="text-[9px] text-muted flex items-center gap-1 mt-1">
                                    <Calendar className="w-3 h-3" /> Joined {u.joined}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold border ${u.kycVerified ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    {u.kycVerified ? 'KYC VERIFIED' : 'KYC PENDING'}
                                </span>
                                <span className="text-[8px] font-bold text-muted uppercase">{u.role}</span>
                                {u.isSuspicious && (
                                    <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> FLAGGED
                                    </span>
                                )}
                                {u.isBanned && (
                                    <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1">
                                        <Ban className="w-3 h-3" /> BANNED
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-surface">
                            <div className="p-3 bg-bg/50 border border-surface rounded-xl text-center">
                                <p className="text-[9px] font-bold text-muted uppercase">Wallet</p>
                                <p className="text-sm font-bold text-text">{formatCurrency(u.walletBalance ?? 0)}</p>
                            </div>
                            <div className="p-3 bg-bg/50 border border-surface rounded-xl text-center">
                                <p className="text-[9px] font-bold text-muted uppercase">Earnings</p>
                                <p className="text-sm font-bold text-primary">{formatCurrency(u.totalEarnings ?? 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats + clickable sections: Posts / Followers / Following */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Stats row – clickable to show section */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <button
                            type="button"
                            onClick={() => { setActiveSection(SECTIONS.followers); followersRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                            className={`bg-surface border rounded-xl p-4 flex items-center gap-3 text-left transition-all hover:border-primary/30 ${activeSection === SECTIONS.followers ? 'border-primary/50 ring-1 ring-primary/20' : 'border-surface'}`}
                        >
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-muted uppercase">Followers</p>
                                <p className="text-lg font-bold text-text">{followersCount}</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveSection(SECTIONS.following); followingRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                            className={`bg-surface border rounded-xl p-4 flex items-center gap-3 text-left transition-all hover:border-primary/30 ${activeSection === SECTIONS.following ? 'border-primary/50 ring-1 ring-primary/20' : 'border-surface'}`}
                        >
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <UserPlus className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-muted uppercase">Following</p>
                                <p className="text-lg font-bold text-text">{followingCount}</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSection(SECTIONS.posts)}
                            className={`bg-surface border rounded-xl p-4 flex items-center gap-3 text-left transition-all hover:border-primary/30 ${activeSection === SECTIONS.posts ? 'border-primary/50 ring-1 ring-primary/20' : 'border-surface'}`}
                        >
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                <FileImage className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-muted uppercase">Posts</p>
                                <p className="text-lg font-bold text-text">{postsCount}</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveSection(SECTIONS.nfts); nftsRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                            className={`bg-surface border rounded-xl p-4 flex items-center gap-3 text-left transition-all hover:border-primary/30 ${activeSection === SECTIONS.nfts ? 'border-primary/50 ring-1 ring-primary/20' : 'border-surface'}`}
                        >
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                <Image className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-muted uppercase">NFTs</p>
                                <p className="text-lg font-bold text-text">{nftsCount}</p>
                            </div>
                        </button>
                    </div>

                    {/* NFTs section – shown when NFTs is selected */}
                    {activeSection === SECTIONS.nfts && (
                        <div ref={nftsRef} className="bg-surface border border-surface rounded-2xl overflow-hidden">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted px-5 py-4 border-b border-surface flex items-center gap-2">
                                <Image className="w-4 h-4" /> NFTs by @{u.name || 'User'} ({userNfts.length})
                            </h3>
                            <div className="p-4 max-h-[400px] overflow-y-auto">
                                {nftsLoading ? (
                                    <p className="text-[10px] text-muted uppercase tracking-wider">Loading NFTs...</p>
                                ) : userNfts.length === 0 ? (
                                    <p className="text-[10px] text-muted uppercase tracking-wider">No NFTs</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {userNfts.map((post) => {
                                            const isVideo = (post.type || '').toLowerCase() === 'video';
                                            const mediaUrl = post.mediaUrl || post.thumbnail;
                                            return (
                                                <li key={post.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/admin/content/${post.id}`)}
                                                        className="w-full flex items-center gap-4 p-3 rounded-xl bg-bg/50 border border-surface hover:border-primary/30 text-left transition-colors"
                                                    >
                                                        <div className="w-14 h-14 rounded-lg bg-surface2 border border-surface overflow-hidden flex-shrink-0">
                                                            {isVideo && mediaUrl ? (
                                                                <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                                                            ) : mediaUrl ? (
                                                                <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-indigo-500">
                                                                    <Image className="w-6 h-6" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-bold text-muted uppercase">NFT · {post.type || 'Image'} · {post.status}</p>
                                                            <p className="text-xs font-medium text-text truncate">{post.content || post.caption || '—'}</p>
                                                            <p className="text-[9px] text-muted mt-0.5">ID: {post.id}</p>
                                                        </div>
                                                        <ExternalLink className="w-4 h-4 text-primary flex-shrink-0" />
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Posts section – shown when Posts is selected */}
                    {activeSection === SECTIONS.posts && (
                        <div className="bg-surface border border-surface rounded-2xl overflow-hidden">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted px-5 py-4 border-b border-surface flex items-center gap-2">
                                <FileImage className="w-4 h-4" /> Posts by @{u.name || 'User'} ({userPosts.length})
                            </h3>
                            <div className="p-4 max-h-[400px] overflow-y-auto">
                                {postsLoading ? (
                                    <p className="text-[10px] text-muted uppercase tracking-wider">Loading posts...</p>
                                ) : userPosts.length === 0 ? (
                                    <p className="text-[10px] text-muted uppercase tracking-wider">No posts</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {userPosts.map((post) => {
                                            const isVideo = (post.type || '').toLowerCase() === 'video';
                                            const isAudio = (post.type || '').toLowerCase() === 'audio';
                                            const mediaUrl = post.mediaUrl || post.thumbnail;
                                            return (
                                                <li key={post.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/admin/content/${post.id}`)}
                                                        className="w-full flex items-center gap-4 p-3 rounded-xl bg-bg/50 border border-surface hover:border-primary/30 text-left transition-colors"
                                                    >
                                                        <div className="w-14 h-14 rounded-lg bg-surface2 border border-surface overflow-hidden flex-shrink-0">
                                                            {isVideo && mediaUrl ? (
                                                                <video
                                                                    src={mediaUrl}
                                                                    className="w-full h-full object-cover"
                                                                    muted
                                                                    playsInline
                                                                    preload="metadata"
                                                                    onMouseEnter={(e) => e.target.play().catch(() => {})}
                                                                    onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                                                                />
                                                            ) : isAudio && mediaUrl ? (
                                                                <div className="w-full h-full flex items-center justify-center text-primary">
                                                                    <FileImage className="w-6 h-6" />
                                                                </div>
                                                            ) : mediaUrl ? (
                                                                <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-muted">
                                                                    <FileImage className="w-6 h-6" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-bold text-muted uppercase">{post.type || 'Image'} · {post.status}</p>
                                                            <p className="text-xs font-medium text-text truncate">{post.content || post.caption || '—'}</p>
                                                            <p className="text-[9px] text-muted mt-0.5">ID: {post.id}</p>
                                                        </div>
                                                        <ExternalLink className="w-4 h-4 text-primary flex-shrink-0" />
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Followers list – click Followers card to show / scroll here */}
                    <div ref={followersRef} className="bg-surface border border-surface rounded-2xl overflow-hidden">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted px-5 py-4 border-b border-surface flex items-center gap-2">
                            <Users className="w-4 h-4" /> Followers ({followersCount})
                        </h3>
                        <div className="p-4 max-h-[280px] overflow-y-auto">
                            {followers.length === 0 ? (
                                <p className="text-[10px] text-muted uppercase tracking-wider">No followers</p>
                            ) : (
                                <ul className="space-y-2">
                                    {followers.map((f) => (
                                        <li
                                            key={f.id}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-bg/50 border border-surface hover:border-primary/20 transition-colors"
                                        >
                                            <img
                                                src={f.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop'}
                                                alt=""
                                                className="w-10 h-10 rounded-lg object-cover border border-surface"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-text truncate">{f.name || 'User'}</p>
                                                <p className="text-[9px] text-muted truncate">{f.handle ? `@${f.handle}` : f.id}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/admin/users/view/${f.id}`)}
                                                className="text-[9px] font-bold uppercase tracking-wider text-primary hover:underline"
                                            >
                                                View
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Following list – click Following card to show / scroll here */}
                    <div ref={followingRef} className="bg-surface border border-surface rounded-2xl overflow-hidden">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted px-5 py-4 border-b border-surface flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Following ({followingCount})
                        </h3>
                        <div className="p-4 max-h-[280px] overflow-y-auto">
                            {following.length === 0 ? (
                                <p className="text-[10px] text-muted uppercase tracking-wider">Not following anyone</p>
                            ) : (
                                <ul className="space-y-2">
                                    {following.map((f) => (
                                        <li
                                            key={f.id}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-bg/50 border border-surface hover:border-primary/20 transition-colors"
                                        >
                                            <img
                                                src={f.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop'}
                                                alt=""
                                                className="w-10 h-10 rounded-lg object-cover border border-surface"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-text truncate">{f.name || 'User'}</p>
                                                <p className="text-[9px] text-muted truncate">{f.handle ? `@${f.handle}` : f.id}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/admin/users/view/${f.id}`)}
                                                className="text-[9px] font-bold uppercase tracking-wider text-primary hover:underline"
                                            >
                                                View
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
