import React, { useEffect, useState, useRef } from 'react';
import { Plus, X, Music, Check, Camera, Image as ImageIcon, Type, Sparkles, Volume2, VolumeX, Play, Pause, ArrowRight, MoreVertical, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { storyService } from '../../services/storyService';
import { musicService } from '../../services/musicService';
import { useUserStore } from '../../store/useUserStore';

const STORY_AUDIO_TRACKS = [
    { id: '1', title: 'Trending Now' },
    { id: '2', title: 'Summer Hit 2026' },
    { id: '3', title: 'Chill Vibes' }
];

// Default avatar when user has not uploaded a profile photo.
// `person.png` is placed in the Vite `public` folder, so it is served from `/person.png`.
const NO_IMAGE_AVATAR = '/person.png';

export default function Stories() {
    const { profile } = useUserStore();
    const [stories, setStories] = useState([]);
    const [myStory, setMyStory] = useState(null);
    const [feedStories, setFeedStories] = useState([]);
    const [selectedStory, setSelectedStory] = useState(null);
    const [activeStoryIndex, setActiveStoryIndex] = useState(0);

    const [musicList, setMusicList] = useState([]);
    const viewerAudioRef = useRef(null);
    const lastAudioId = useRef(null);
    const previewAudioRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCreatingStory, setIsCreatingStory] = useState(false);
    const [storyMedia, setStoryMedia] = useState(null);
    const [storyFile, setStoryFile] = useState(null);
    const [storyMusic, setStoryMusic] = useState(null);
    const [showMusicPicker, setShowMusicPicker] = useState(false);
    const [isPlayingViewer, setIsPlayingViewer] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [storyCaption, setStoryCaption] = useState('');
    const [storyMusicStartTime, setStoryMusicStartTime] = useState(0);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [storyFilter, setStoryFilter] = useState('none');
    const [isVideoPreview, setIsVideoPreview] = useState(false);
    const [isTextMode, setIsTextMode] = useState(false);
    const [captionPos, setCaptionPos] = useState({ x: 0.5, y: 0.8 });
    const [captionTextColor, setCaptionTextColor] = useState('#ffffff');
    const [captionBgColor, setCaptionBgColor] = useState('#000000');
    const storyCanvasRef = useRef(null);
    const [uploadError, setUploadError] = useState('');
    const [imageScale, setImageScale] = useState(1);
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    
    useEffect(() => {
        return () => {
            if (storyMedia && storyMedia.startsWith('blob:')) {
                URL.revokeObjectURL(storyMedia);
            }
        };
    }, [storyMedia]);

    useEffect(() => {
        const currentStory = selectedStory?.stories?.[activeStoryIndex];
        if (currentStory && currentStory.musicData && viewerAudioRef.current) {
            const audio = viewerAudioRef.current;
            const targetTime = currentStory.musicStartTime || 0;
            
            // Re-sync if it's a new audio source or new story
            audio.currentTime = targetTime;
            if (isPlayingViewer) {
                audio.play().catch(() => {});
            }
        }
    }, [selectedStory, activeStoryIndex, isPlayingViewer]);

    const loadStories = async () => {
        try {
            const feed = await storyService.getFeedStories();
            setFeedStories(feed);

            // Flatten feed stories into a simple structure
            const mapped = feed.map((s) => ({
                id: s.id,
                userId: s.user.id,
                username: s.user.username || s.user.handle || 'User',
                avatar: s.user.avatar || NO_IMAGE_AVATAR,
                hasUnseen: true,
                isMe: s.isMe,
                mediaUrl: s.media?.url,
                mediaType: s.media?.type || 'image',
                caption: s.caption || '',
                captionStyle: s.captionStyle || null,
                musicData: s.musicData || null,
                musicStartTime: s.musicStartTime || 0,
                createdAt: s.createdAt,
            }));

            // Track whether current user has at least one story
            const mine = mapped.find((s) => s.isMe) || null;

            // Group other users so each user appears only once in the strip,
            // but may have multiple stories in the viewer.
            const groupedByUser = Object.values(
                mapped.reduce((acc, story) => {
                    if (story.isMe) {
                        return acc;
                    }
                    const key = story.userId;
                    const existing = acc[key];
                    // Keep the newest story's tile info (avatar, username, etc.)
                    if (
                        !existing ||
                        new Date(story.createdAt) > new Date(existing.createdAt)
                    ) {
                        acc[key] = story;
                    }
                    return acc;
                }, /** @type {Record<string, any>} */ ({}))
            );

            const baseTile = {
                id: 'me',
                username: 'Your Story',
                avatar: profile?.avatar || NO_IMAGE_AVATAR,
                hasUnseen: !!mine,
                isMe: true,
            };
            setMyStory(mine);
            setStories([baseTile, ...groupedByUser]);
        } catch {
            const baseTile = {
                id: 'me',
                username: 'Your Story',
                avatar: profile?.avatar || NO_IMAGE_AVATAR,
                hasUnseen: false,
                isMe: true,
            };
            setMyStory(null);
            setStories([baseTile]);
        }
    };

    const loadMusic = async () => {
        try {
            const data = await musicService.getActiveMusic();
            setMusicList(data.music || []);
        } catch { /* ignore */ }
    }

    useEffect(() => {
        loadStories();
        loadMusic();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.id, profile?.avatar]);

    const handleStoryClick = (story) => {
        // Find ALL stories for this user
        let userStories = [];
        let isMe = false;
        
        if (story.isMe) {
            userStories = feedStories.filter((s) => s.isMe);
            isMe = true;
        } else {
            userStories = feedStories.filter((s) => s.user.id === story.userId || s.userId === story.userId);
            isMe = story.isMe || userStories.some(s => s.isMe);
        }

        // Sort by date oldest to newest
        userStories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        if (!userStories.length && story.isMe) {
            setIsCreatingStory(true);
            return;
        }

        if (userStories.length) {
            const first = userStories[0];
            setSelectedStory({
                user: {
                    id: first.user?.id || first.userId,
                    username: first.user?.username || first.user?.handle || (isMe ? 'You' : 'User'),
                    avatar: first.user?.avatar || first.avatar || NO_IMAGE_AVATAR,
                    isMe: isMe
                },
                stories: userStories.map((s) => ({
                    id: s.id,
                    mediaUrl: s.media?.url || s.mediaUrl,
                    mediaType: s.media?.type || s.mediaType || 'image',
                    caption: s.caption || '',
                    captionStyle: s.captionStyle || null,
                    musicData: s.musicData || null,
                    musicStartTime: s.musicStartTime || 0,
                    createdAt: s.createdAt,
                })),
            });
            setActiveStoryIndex(0);
        }
    };

    const handleCreateStory = async () => {
        if (!storyFile || isSubmitting) return;
        setIsSubmitting(true);
        setUploadError('');
        try {
            await storyService.createStory({
                file: storyFile,
                caption: storyCaption,
                musicId: storyMusic?._id || storyMusic?.id,
                musicTrackId: storyMusic?.title || 'none',
                musicStartTime: storyMusicStartTime,
                captionPosX: captionPos.x,
                captionPosY: captionPos.y,
                captionTextColor,
                captionBgColor,
            });
            await loadStories();
            setIsCreatingStory(false);
            setStoryMedia(null);
            setStoryMusic(null);
            setStoryFile(null);
            setStoryCaption('');
            setStoryMusicStartTime(0);
            setStoryFilter('none');
            setIsVideoPreview(false);
            setIsTextMode(false);
            setCaptionPos({ x: 0.5, y: 0.8 });
            setImageScale(1);
            setImagePosition({ x: 0, y: 0 });
        } catch (err) {
            setUploadError(err?.message || 'Failed to share. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStory = async () => {
        const current = selectedStory?.stories?.[activeStoryIndex];
        if (!current?.id) return;
        setIsDeleting(true);
        try {
            await storyService.deleteStory(current.id);
            setSelectedStory(null);
            setActiveStoryIndex(0);
            setIsMoreMenuOpen(false);
            setIsDeleting(false);
            await loadStories();
        } catch {
            setSelectedStory(null);
            setActiveStoryIndex(0);
            setIsMoreMenuOpen(false);
            setIsDeleting(false);
        }
    };

    const handleDownload = async () => {
        const current = selectedStory?.stories?.[activeStoryIndex];
        if (!current?.mediaUrl) return;
        try {
            const response = await fetch(current.mediaUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `story-${current.id}.${current.mediaType === 'video' ? 'mp4' : 'jpg'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setIsMoreMenuOpen(false);
        } catch (err) {
            console.error('Download failed', err);
        }
    };

    const goToNextStory = () => {
        if (!selectedStory?.stories || !selectedStory.stories.length) return;
        if (activeStoryIndex < selectedStory.stories.length - 1) {
            setActiveStoryIndex((prev) => prev + 1);
        } else {
            setSelectedStory(null);
            setActiveStoryIndex(0);
        }
    };

    const goToPrevStory = () => {
        if (!selectedStory?.stories || !selectedStory.stories.length) return;
        if (activeStoryIndex > 0) {
            setActiveStoryIndex((prev) => prev - 1);
        } else {
            setSelectedStory(null);
            setActiveStoryIndex(0);
        }
    };

    return (
        <>
            <div
                className="w-full py-3 mb-2 border-b overflow-x-auto hide-scrollbar flex items-center gap-4 px-4 desktop-stories-container"
                style={{
                    background: 'var(--color-bg)',
                    borderColor: 'var(--color-border)',
                }}
            >
                {stories.map((story) => (
                    <div
                        key={story.id}
                        className="flex flex-col items-center gap-1 cursor-pointer min-w-[70px] max-w-[70px]"
                        onClick={() => handleStoryClick(story)}
                    >
                        <div className="relative">
                            <div
                                className={`w-16 h-16 rounded-full p-[2px] ${story.hasUnseen
                                    ? 'bg-gradient-to-tr from-yellow-400 via-orange-500 to-purple-600'
                                    : 'bg-gray-300 dark:bg-zinc-700'
                                    }`}
                            >
                                <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-black">
                                    <img
                                        src={story.avatar}
                                        alt={story.username}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </div>

                            {story.isMe && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCreatingStory(true);
                                    }}
                                    className="absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center bg-blue-500 text-white"
                                >
                                    <Plus size={12} />
                                </button>
                            )}
                        </div>
                        <span
                            className="text-[10px] truncate w-full text-center"
                            style={{
                                color: story.hasUnseen ? 'var(--color-text)' : 'var(--color-muted)',
                                fontWeight: story.hasUnseen ? '600' : '400'
                            }}
                        >
                            {story.username}
                        </span>
                    </div>
                ))}
            </div>

            {/* Story Viewer Modal */}
            <AnimatePresence>
                {selectedStory && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setSelectedStory(null)}
                    >
                        <div
                            className="w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden relative"
                            style={{ background: 'var(--color-surface2)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Tap zones for previous / next story (behind header and controls) */}
                            <div className="absolute inset-0 flex">
                                <button
                                    type="button"
                                    className="flex-1"
                                    onClick={goToPrevStory}
                                />
                                <button
                                    type="button"
                                    className="flex-1"
                                    onClick={goToNextStory}
                                />
                            </div>

                             {/* Story Content Background */}
                             {selectedStory.stories?.[activeStoryIndex] && (
                                <>
                                    {selectedStory.stories[activeStoryIndex].musicData && (
                                        <audio
                                            key={`story-audio-${selectedStory.stories[activeStoryIndex].id}`}
                                            ref={viewerAudioRef}
                                            src={selectedStory.stories[activeStoryIndex].musicData.audioUrl}
                                            muted={isMuted}
                                            loop
                                        />
                                    )}
                                    {selectedStory.stories[activeStoryIndex].mediaType === 'video' ? (
                                        <video
                                            key={`story-video-${selectedStory.stories[activeStoryIndex].id}`}
                                            src={selectedStory.stories[activeStoryIndex].mediaUrl || ''}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            muted={isMuted || !!selectedStory.stories[activeStoryIndex].musicData}
                                            loop
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            key={`story-img-${selectedStory.stories[activeStoryIndex].id}`}
                                            src={selectedStory.stories[activeStoryIndex].mediaUrl || ''}
                                            alt="Story Content"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </>
                             )}

                            {/* Story Progress Bar */}
                            <div className="absolute top-2 left-2 right-2 flex gap-1">
                                {selectedStory.stories?.map((s, idx) => (
                                    <div
                                        key={s.id || idx}
                                        className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                                    >
                                        {idx === activeStoryIndex && (
                                            <motion.div
                                                key={idx}
                                                initial={{ width: '0%' }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 5, ease: 'linear' }}
                                                onAnimationComplete={goToNextStory}
                                                className="h-full bg-white"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Caption overlay with saved position and colors */}
                            {selectedStory.stories?.[activeStoryIndex]?.caption && (() => {
                                const current = selectedStory.stories[activeStoryIndex];
                                const style = current.captionStyle || {};
                                const x = typeof style.x === 'number' ? style.x : 0.5;
                                const y = typeof style.y === 'number' ? style.y : 0.8;
                                const textColor = style.textColor || '#ffffff';
                                const bgColor = style.backgroundColor || '#000000';
                                return (
                                    <div
                                        className="absolute z-20 px-3 py-1 rounded-lg text-sm font-semibold break-words text-center"
                                        style={{
                                            left: `${x * 100}%`,
                                            top: `${y * 100}%`,
                                            transform: 'translate(-50%, -50%)',
                                            color: textColor,
                                            backgroundColor: bgColor,
                                        }}
                                    >
                                        {current.caption}
                                    </div>
                                );
                            })()}

                            {/* Story Header */}
                            <div className="absolute top-4 left-3 right-3 flex items-center gap-2 z-20">
                                <img
                                    src={selectedStory.user?.avatar || NO_IMAGE_AVATAR}
                                    className="w-8 h-8 rounded-full border border-white/50"
                                    alt=""
                                />
                                <span className="text-white text-xs font-bold drop-shadow-md">
                                    {selectedStory.user?.username}
                                </span>
                                <span className="text-white/70 text-xs ml-2">Story</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMuted(!isMuted);
                                    }}
                                    className="ml-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsPlayingViewer(!isPlayingViewer);
                                    }}
                                    className="ml-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    {isPlayingViewer ? <Pause size={14} /> : <Play size={14} />}
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMoreMenuOpen(true);
                                    }}
                                    className="ml-auto p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <MoreVertical size={14} />
                                </button>
                            </div>

                            {/* Options Menu Modal */}
                            <AnimatePresence>
                                {isMoreMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 100 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 100 }}
                                        className="absolute inset-0 z-[60] bg-black/60 flex items-end"
                                        onClick={() => setIsMoreMenuOpen(false)}
                                    >
                                        <div 
                                            className="w-full bg-surface2 rounded-t-3xl overflow-hidden pb-8"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="w-12 h-1 bg-muted/20 rounded-full mx-auto my-3" />
                                            <div className="flex flex-col">
                                                <button
                                                    onClick={handleDownload}
                                                    className="w-full py-4 px-6 flex items-center gap-4 hover:bg-white/5 text-white border-b border-white/5 active:bg-white/10"
                                                >
                                                    <Download size={20} />
                                                    <span className="font-semibold text-sm">Download Content</span>
                                                </button>
                                                {selectedStory.user?.isMe && (
                                                    <button
                                                        onClick={() => {
                                                            setIsMoreMenuOpen(false);
                                                            setIsDeleting(true);
                                                        }}
                                                        className="w-full py-4 px-6 flex items-center gap-4 hover:bg-red-500/10 text-red-400 active:bg-red-500/20"
                                                    >
                                                        <Trash2 size={20} />
                                                        <span className="font-semibold text-sm">Delete Story</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setIsMoreMenuOpen(false)}
                                                    className="w-full py-4 px-6 flex items-center justify-center font-bold text-sm text-muted uppercase tracking-widest mt-2"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Delete Confirmation Modal */}
                            <AnimatePresence>
                                {isDeleting && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-[70] bg-black/80 flex items-center justify-center p-6"
                                        onClick={() => setIsDeleting(false)}
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-surface2 w-full max-w-sm rounded-3xl p-6 text-center"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="w-16 h-16 bg-red-400/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                                <Trash2 size={32} />
                                            </div>
                                            <h3 className="text-white font-bold text-lg mb-2">Delete Story?</h3>
                                            <p className="text-muted text-sm mb-6">This action cannot be undone. Your story will be permanently removed.</p>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={handleDeleteStory}
                                                    className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
                                                >
                                                    Yes, Delete
                                                </button>
                                                <button
                                                    onClick={() => setIsDeleting(false)}
                                                    className="w-full py-3 bg-white/5 text-muted rounded-xl font-bold text-sm hover:bg-white/10 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Close hint */}
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <span className="text-white/50 text-[10px] tracking-widest uppercase">Tap to close</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Story Modal */}
            <AnimatePresence>
                {isCreatingStory && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col"
                    >
                        {/* Header Controls */}
                        <div className="flex items-center justify-between p-4 z-10 w-full absolute top-0 left-0">
                            <button onClick={() => setIsCreatingStory(false)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                                <X size={24} />
                            </button>
                            <div className="flex gap-4">
                                <button onClick={() => setShowMusicPicker(!showMusicPicker)} className={`w-10 h-10 ${storyMusic ? 'bg-primary' : 'bg-black/40'} rounded-full flex items-center justify-center text-white backdrop-blur-md`}>
                                    <Music size={20} />
                                </button>
                                <button className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                                    <Sparkles size={20} />
                                </button>
                                <button
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white backdrop-blur-md ${
                                        isTextMode ? 'bg-primary' : 'bg-black/40'
                                    }`}
                                    type="button"
                                    onClick={() => setIsTextMode((prev) => !prev)}
                                >
                                    <Type size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Story Content Area */}
                        <div
                            ref={storyCanvasRef}
                            className="flex-1 relative rounded-b-3xl overflow-hidden bg-zinc-900 mt-16 mx-2 mb-2"
                        >
                            {storyMedia ? (
                                <div className="absolute inset-0 overflow-hidden">
                                    {isVideoPreview ? (
                                        <video
                                            src={storyMedia}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            muted
                                            loop
                                        />
                                    ) : (
                                        <img
                                            src={storyMedia}
                                            className={`w-full h-full object-cover transition-transform duration-150 ${
                                                storyFilter === 'grayscale'
                                                    ? 'filter grayscale'
                                                    : storyFilter === 'sepia'
                                                    ? 'filter sepia'
                                                    : storyFilter === 'vivid'
                                                    ? 'filter contrast-125 saturate-150'
                                                    : ''
                                            }`}
                                            alt="Preview"
                                            style={{
                                                transform: `scale(${imageScale}) translate(${imagePosition.x}%, ${imagePosition.y}%)`,
                                            }}
                                            draggable={false}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/50 flex-col gap-4">
                                    <Camera size={64} className="opacity-20" />
                                    <p className="text-sm font-semibold tracking-wider uppercase">Camera View</p>
                                </div>
                            )}

                            {/* Music Sticker Overlay */}
                            {storyMusic && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 text-black px-4 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-2xl skew-y-[-2deg]"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black shadow-lg">
                                        <Music size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold truncate max-w-[120px]">{storyMusic.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-bold text-black/50">{Math.floor(storyMusicStartTime)}s</span>
                                            <input 
                                                type="range"
                                                min="0"
                                                max={Math.max(0, (storyMusic.duration || 60) - 15)}
                                                value={storyMusicStartTime}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setStoryMusicStartTime(val);
                                                    if (isPlayingPreview && previewAudioRef.current) {
                                                        previewAudioRef.current.currentTime = val;
                                                    }
                                                }}
                                                className="flex-1 h-1 bg-black/10 rounded-full appearance-none accent-black"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Draggable, editable caption (no separate input field) */}
                            {isTextMode && (
                                <motion.div
                                    drag
                                    dragMomentum={false}
                                    onDragEnd={(_, info) => {
                                        const bounds = storyCanvasRef.current?.getBoundingClientRect();
                                        if (!bounds) return;
                                        const x = (info.point.x - bounds.left) / bounds.width;
                                        const y = (info.point.y - bounds.top) / bounds.height;
                                        setCaptionPos({
                                            x: Math.min(Math.max(x, 0.05), 0.95),
                                            y: Math.min(Math.max(y, 0.05), 0.95),
                                        });
                                    }}
                                    style={{
                                        position: 'absolute',
                                        left: `${captionPos.x * 100}%`,
                                        top: `${captionPos.y * 100}%`,
                                        transform: 'translate(-50%, -50%)',
                                        backgroundColor: captionBgColor,
                                        color: captionTextColor,
                                        minWidth: '40%',
                                        maxWidth: '80%',
                                    }}
                                    className="px-3 py-1 rounded-lg text-sm font-semibold whitespace-pre-wrap text-center cursor-text z-20"
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={(e) => {
                                        setStoryCaption(e.currentTarget.textContent || '');
                                    }}
                                >
                                    {storyCaption || 'Type your text'}
                                </motion.div>
                            )}

                            {/* Text + Filter + Color controls */}
                            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 z-10">
                                {isTextMode && (
                                    <div className="flex items-center justify-between gap-2 mt-1">
                                        <label className="flex items-center gap-1 text-[10px] text-white/70">
                                            <span>Text</span>
                                            <input
                                                type="color"
                                                value={captionTextColor}
                                                onChange={(e) => setCaptionTextColor(e.target.value)}
                                                className="w-6 h-6 rounded-full overflow-hidden border-none p-0 bg-transparent"
                                            />
                                        </label>
                                        <label className="flex items-center gap-1 text-[10px] text-white/70">
                                            <span>Background</span>
                                            <input
                                                type="color"
                                                value={captionBgColor}
                                                onChange={(e) => setCaptionBgColor(e.target.value)}
                                                className="w-6 h-6 rounded-full overflow-hidden border-none p-0 bg-transparent"
                                            />
                                        </label>
                                    </div>
                                )}
                                {storyMedia && !isVideoPreview && (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-white/60 text-[10px] uppercase tracking-wider">Size</span>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="2"
                                                step="0.1"
                                                value={imageScale}
                                                onChange={(e) => setImageScale(Number(e.target.value))}
                                                className="flex-1 h-2 rounded-full bg-white/20 accent-white"
                                            />
                                            <span className="text-white/70 text-[10px] w-8">{Math.round(imageScale * 100)}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white/60 text-[10px] uppercase tracking-wider shrink-0">Position</span>
                                            <input
                                                type="range"
                                                min="-30"
                                                max="30"
                                                value={imagePosition.x}
                                                onChange={(e) => setImagePosition((p) => ({ ...p, x: Number(e.target.value) }))}
                                                className="flex-1 h-2 rounded-full bg-white/20 accent-white"
                                            />
                                            <input
                                                type="range"
                                                min="-30"
                                                max="30"
                                                value={imagePosition.y}
                                                onChange={(e) => setImagePosition((p) => ({ ...p, y: Number(e.target.value) }))}
                                                className="flex-1 h-2 rounded-full bg-white/20 accent-white"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-white/60 text-[10px] uppercase tracking-wider">
                                        Filter
                                    </span>
                                    <select
                                        value={storyFilter}
                                        onChange={(e) => setStoryFilter(e.target.value)}
                                        className="flex-1 px-3 py-1 rounded-full bg-black/40 text-white text-xs outline-none border border-white/20"
                                    >
                                        <option value="none">None</option>
                                        <option value="grayscale">Grayscale</option>
                                        <option value="sepia">Warm</option>
                                        <option value="vivid">Vivid</option>
                                    </select>
                                </div>
                            </div>

                            {/* Music Picker Bottom Sheet */}
                            <AnimatePresence>
                                {showMusicPicker && (
                                    <motion.div
                                        initial={{ y: '100%' }}
                                        animate={{ y: 0 }}
                                        exit={{ y: '100%' }}
                                        className="absolute bottom-0 inset-x-0 bg-black/90 backdrop-blur-xl rounded-t-3xl p-4 z-20 h-1/2 flex flex-col"
                                    >
                                        <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />
                                        <h3 className="text-white font-bold text-center mb-4">Choose Audio</h3>
                                        <div className="flex flex-col gap-2 overflow-y-auto hide-scrollbar pb-20">
                                            {musicList.map(track => (
                                                <div
                                                    key={track._id || track.id}
                                                    onClick={() => {
                                                        setStoryMusic(track);
                                                        setStoryMusicStartTime(0);
                                                        setShowMusicPicker(false);
                                                        if (previewAudioRef.current) previewAudioRef.current.pause();
                                                        setIsPlayingPreview(false);
                                                    }}
                                                    className="flex items-center justify-between p-4 bg-white/10 rounded-2xl text-left hover:bg-white/20 transition-all cursor-pointer group border border-transparent hover:border-white/10"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            className="relative group/play shrink-0" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const isThisPlaying = isPlayingPreview && previewAudioRef.current?.src === track.audioUrl;
                                                                if (isThisPlaying) {
                                                                    previewAudioRef.current.pause();
                                                                    setIsPlayingPreview(false);
                                                                } else {
                                                                    previewAudioRef.current.src = track.audioUrl;
                                                                    previewAudioRef.current.play().catch(() => {});
                                                                    setIsPlayingPreview(true);
                                                                }
                                                            }}
                                                        >
                                                            {track.thumbnail ? (
                                                                <img src={track.thumbnail} className="w-10 h-10 rounded-lg object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-orange-500 rounded-lg flex items-center justify-center text-white">
                                                                    <Music size={18} />
                                                                </div>
                                                            )}
                                                            <div className={`absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-white transition-opacity ${(isPlayingPreview && previewAudioRef.current?.src === track.audioUrl) ? 'opacity-100' : 'opacity-0 group-hover/play:opacity-100'}`}>
                                                                {(isPlayingPreview && previewAudioRef.current?.src === track.audioUrl) ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" />}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-semibold text-sm">{track.title}</p>
                                                            <p className="text-white/50 text-[10px]">{track.artist}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {(storyMusic?._id === track._id || storyMusic?.id === track.id) ? (
                                                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black shadow-lg">
                                                                <Check size={16} strokeWidth={3} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ArrowRight size={14} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    setStoryMusic(null);
                                                    setShowMusicPicker(false);
                                                    if (previewAudioRef.current) previewAudioRef.current.pause();
                                                }}
                                                className="p-4 bg-white/5 rounded-2xl text-white text-sm text-center font-semibold mt-2"
                                            >
                                                Remove Audio
                                            </button>
                                        </div>
                                        <audio ref={previewAudioRef} onEnded={() => setIsPlayingPreview(false)} className="hidden" loop />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Bottom Actions - always on top and visible */}
                        <div className="flex-shrink-0 relative z-20 p-4 py-6 flex items-center justify-between bg-black">
                            <label className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white/20 bg-white/10 text-white cursor-pointer relative overflow-hidden shrink-0">
                                {storyMedia ? (
                                    <img src={storyMedia} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <ImageIcon size={24} />
                                )}
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (storyMedia && storyMedia.startsWith('blob:')) {
                                                URL.revokeObjectURL(storyMedia);
                                            }
                                            const url = URL.createObjectURL(file);
                                            setStoryMedia(url);
                                            setStoryFile(file);
                                            setIsVideoPreview(file.type.startsWith('video/'));
                                            setImageScale(1);
                                            setImagePosition({ x: 0, y: 0 });
                                            setUploadError('');
                                        }
                                        e.target.value = '';
                                    }}
                                />
                            </label>

                            <span className="text-white/50 text-xs max-w-[80px] text-center">Add photo or video</span>

                            <div className="flex flex-col items-end gap-1">
                                {uploadError && (
                                    <p className="text-red-400 text-[10px] max-w-[140px] text-right">{uploadError}</p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleCreateStory}
                                    disabled={!storyFile || isSubmitting}
                                    className="px-6 py-4 bg-white text-black font-bold rounded-full text-sm shadow-[0_0_20px_rgba(255,255,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-manipulation select-none"
                                >
                                    {isSubmitting ? 'Sharing…' : 'Share →'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

