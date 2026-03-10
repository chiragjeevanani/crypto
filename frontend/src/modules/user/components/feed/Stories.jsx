import React, { useState } from 'react';
import { Plus, X, Music, Check, Camera, Image as ImageIcon, Type, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data for stories. Later this could come from useFeedStore
const mockStories = [
    {
        id: 'me',
        username: 'Your Story',
        avatar: 'https://i.pravatar.cc/150?u=me',
        hasUnseen: false,
        isMe: true,
    },
    {
        id: 'user1',
        username: 'alex_crypto',
        avatar: 'https://i.pravatar.cc/150?u=alex',
        hasUnseen: true,
    },
    {
        id: 'user2',
        username: 'blockchain_dev',
        avatar: 'https://i.pravatar.cc/150?u=dev',
        hasUnseen: true,
    },
    {
        id: 'user3',
        username: 'nft_creator',
        avatar: 'https://i.pravatar.cc/150?u=nft',
        hasUnseen: true,
    },
    {
        id: 'user4',
        username: 'web3_daily',
        avatar: 'https://i.pravatar.cc/150?u=web3',
        hasUnseen: false,
    },
    {
        id: 'user5',
        username: 'crypto_news',
        avatar: 'https://i.pravatar.cc/150?u=news',
        hasUnseen: true,
    },
    {
        id: 'user6',
        username: 'eth_maximalist',
        avatar: 'https://i.pravatar.cc/150?u=eth',
        hasUnseen: false,
    },
    {
        id: 'user7',
        username: 'defi_degen',
        avatar: 'https://i.pravatar.cc/150?u=defi',
        hasUnseen: true,
    },
];

const STORY_AUDIO_TRACKS = [
    { id: '1', title: 'Trending Now' },
    { id: '2', title: 'Summer Hit 2026' },
    { id: '3', title: 'Chill Vibes' }
]

export default function Stories() {
    const [selectedStory, setSelectedStory] = useState(null);
    const [isCreatingStory, setIsCreatingStory] = useState(false);
    const [storyMedia, setStoryMedia] = useState(null);
    const [storyMusic, setStoryMusic] = useState(null);
    const [showMusicPicker, setShowMusicPicker] = useState(false);

    const handleStoryClick = (story) => {
        if (story.isMe && !story.hasUnseen) {
            setIsCreatingStory(true);
        } else {
            setSelectedStory(story);
        }
    };

    const handleCreateStory = () => {
        // Just mock visual creation
        setIsCreatingStory(false);
        setStoryMedia(null);
        setStoryMusic(null);
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
                {mockStories.map((story) => (
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
                                    />
                                </div>
                            </div>

                            {story.isMe && (
                                <div
                                    className="absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center bg-blue-500 text-white"
                                >
                                    <Plus size={12} />
                                </div>
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

            {/* Simple Story Viewer Modal */}
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
                            {/* Story Content Background */}
                            <img
                                src={`https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop`}
                                alt="Story Content"
                                className="w-full h-full object-cover opacity-80"
                            />

                            {/* Story Progress Bar */}
                            <div className="absolute top-2 left-2 right-2 flex gap-1">
                                <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: '0%' }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 5, ease: 'linear' }}
                                        onAnimationComplete={() => setSelectedStory(null)}
                                        className="h-full bg-white"
                                    />
                                </div>
                            </div>

                            {/* Story Header */}
                            <div className="absolute top-4 left-3 right-3 flex items-center gap-2">
                                <img src={selectedStory.avatar} className="w-8 h-8 rounded-full border border-white/50" alt="" />
                                <span className="text-white text-xs font-bold drop-shadow-md">{selectedStory.username}</span>
                                <span className="text-white/70 text-xs ml-2">2h</span>
                            </div>

                            {/* Mock Content */}
                            <div className="absolute inset-x-0 bottom-20 flex flex-col items-center justify-center p-4">
                                <h3 className="text-white text-2xl font-bold drop-shadow-lg mb-2 text-center">Hello World!</h3>
                                <p className="text-white/90 text-sm text-center drop-shadow-md">This is a simulated Instagram story.</p>
                            </div>

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
                                <button className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                                    <Type size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Story Content Area */}
                        <div className="flex-1 relative rounded-b-3xl overflow-hidden bg-zinc-900 mt-16 mx-2 mb-2">
                            {storyMedia ? (
                                <img src={storyMedia} className="w-full h-full object-cover" alt="Preview" />
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
                                    <div>
                                        <p className="text-sm font-bold truncate max-w-[120px]">{storyMusic.title}</p>
                                        <p className="text-[10px] opacity-70">SocialEarn Audio</p>
                                    </div>
                                </motion.div>
                            )}

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
                                            {STORY_AUDIO_TRACKS.map(track => (
                                                <button
                                                    key={track.id}
                                                    onClick={() => {
                                                        setStoryMusic(track);
                                                        setShowMusicPicker(false);
                                                    }}
                                                    className="flex items-center justify-between p-4 bg-white/10 rounded-2xl text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-orange-500 rounded-lg flex items-center justify-center text-white">
                                                            <Music size={18} />
                                                        </div>
                                                        <p className="text-white font-semibold text-sm">{track.title}</p>
                                                    </div>
                                                    {storyMusic?.id === track.id && <Check className="text-white" />}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    setStoryMusic(null);
                                                    setShowMusicPicker(false);
                                                }}
                                                className="p-4 bg-white/5 rounded-2xl text-white text-sm text-center font-semibold mt-2"
                                            >
                                                Remove Audio
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Bottom Actions */}
                        <div className="p-4 py-6 flex items-center justify-between z-10 bg-black">
                            <label className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white/20 bg-white/10 text-white cursor-pointer relative overflow-hidden">
                                {storyMedia ? (
                                    <img src={storyMedia} className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon size={24} />
                                )}
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setStoryMedia(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }}
                                />
                            </label>

                            <button className="w-20 h-20 rounded-full border-4 border-white/40 flex items-center justify-center p-1">
                                <div className="w-full h-full bg-white rounded-full"></div>
                            </button>

                            <button
                                onClick={handleCreateStory}
                                className="px-6 py-4 bg-white text-black font-bold rounded-full text-sm shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                            >
                                Share &rarr;
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
