import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X, Music, Check, Camera, Image as ImageIcon, Type, Sparkles, Volume2, VolumeX, Play, Pause, ArrowRight, MoreVertical, Download, Trash2, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { storyService } from '../../services/storyService';
import { musicService } from '../../services/musicService';
import { useUserStore } from '../../store/useUserStore';
import { optimizeCloudinaryUrl } from '../../../../utils/mediaOptimization';
import EditorModal from '../editor/EditorModal';
import { videoService } from '../../services/videoService';
import { Loader2 } from 'lucide-react';
import Avatar from '../shared/Avatar';
import MusicSelectionModal from './MusicSelectionModal';
import { useFeedStore } from '../../store/useFeedStore';

const STORY_AUDIO_TRACKS = [
    { id: '1', title: 'Trending Now' },
    { id: '2', title: 'Summer Hit 2026' },
    { id: '3', title: 'Chill Vibes' }
];

// `person.png` is placed in the Vite `public` folder, so it is served from `/person.png`.
const NO_IMAGE_AVATAR = '/person.png';

const FILTERS = [
    { name: 'Normal', value: 'none' },
    { name: 'Clarendon', value: 'contrast(1.2) saturate(1.35)' },
    { name: 'Gingham', value: 'brightness(1.05) hue-rotate(-10deg)' },
    { name: 'Moon', value: 'grayscale(1) contrast(1.1) brightness(1.1)' },
    { name: 'Lark', value: 'contrast(0.9)' },
    { name: 'Reyes', value: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)' },
    { name: 'Juno', value: 'saturate(1.3)' },
    { name: 'Slumber', value: 'saturate(0.66) hue-rotate(350deg)' },
    { name: 'Crema', value: 'sepia(0.5) contrast(1.25)' },
];

export default function Stories({ hideFeed = false }) {
    const { profile } = useUserStore();
    const [stories, setStories] = useState([]);
    const [myStory, setMyStory] = useState(null);
    const [feedStories, setFeedStories] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const openStoryId = searchParams.get('openStory');
    const [selectedStory, setSelectedStory] = useState(null);
    const [activeStoryIndex, setActiveStoryIndex] = useState(0);

    const [musicList, setMusicList] = useState([]);
    const viewerAudioRef = useRef(null);
    const viewerVideoRef = useRef(null);
    const lastAudioId = useRef(null);
    const previewAudioRef = useRef(null);
    const previewVideoRef = useRef(null);
    const { globalMute: isMuted, setGlobalMute: setIsMuted, setIsStoryOpen } = useFeedStore();
    const [isCreatingStory, setIsCreatingStory] = useState(false);
    const [storyMedia, setStoryMedia] = useState(null);
    const [storyFile, setStoryFile] = useState(null);
    const [storyMusic, setStoryMusic] = useState(null);
    const [showMusicPicker, setShowMusicPicker] = useState(false);
    const [isPlayingViewer, setIsPlayingViewer] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [storyCaption, setStoryCaption] = useState('');
    const [storyMusicStartTime, setStoryMusicStartTime] = useState(0);
    const [isPlayingPreview, setIsPlayingPreview] = useState(true);

    useEffect(() => {
        if (searchParams.get('addStory') === 'true') {
            setIsCreatingStory(true);
            const params = new URLSearchParams(searchParams);
            params.delete('addStory');
            setSearchParams(params, { replace: true });
        }
    }, [searchParams, setSearchParams]);
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
    const [storyAspect, setStoryAspect] = useState('9/16');
    const [musicPos, setMusicPos] = useState({ x: 0.5, y: 0.25 });
    const [showFilters, setShowFilters] = useState(false);
    const captionRef = useRef(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [originalFile, setOriginalFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [captionBgMode, setCaptionBgMode] = useState('solid'); // 'transparent', 'semi', 'solid'
    const [isDraggingCaption, setIsDraggingCaption] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    
    const [isDraggingMusic, setIsDraggingMusic] = useState(false);
    const musicDragOffsetRef = useRef({ x: 0, y: 0 });

    const handleMusicPointerDown = (e) => {
        e.stopPropagation();
        const bounds = e.currentTarget.getBoundingClientRect();
        musicDragOffsetRef.current = {
            x: e.clientX - (bounds.left + bounds.width / 2),
            y: e.clientY - (bounds.top + bounds.height / 2)
        };
        setIsDraggingMusic(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleMusicPointerMove = (e) => {
        if (!isDraggingMusic) return;
        const canvasBounds = storyCanvasRef.current?.getBoundingClientRect();
        if (!canvasBounds) return;

        const x = (e.clientX - musicDragOffsetRef.current.x - canvasBounds.left) / canvasBounds.width;
        const y = (e.clientY - musicDragOffsetRef.current.y - canvasBounds.top) / canvasBounds.height;

        setMusicPos({
            x: Math.min(Math.max(x, 0.05), 0.95),
            y: Math.min(Math.max(y, 0.05), 0.95)
        });
    };

    const handleMusicPointerUp = (e) => {
        setIsDraggingMusic(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const getCaptionBgStyle = () => {
        if (captionBgMode === 'transparent') return 'transparent';
        if (captionBgMode === 'semi') {
            const hex = captionBgColor || '#000000';
            const r = parseInt(hex.slice(1, 3), 16) || 0;
            const g = parseInt(hex.slice(3, 5), 16) || 0;
            const b = parseInt(hex.slice(5, 7), 16) || 0;
            return `rgba(${r}, ${g}, ${b}, 0.6)`;
        }
        return captionBgColor;
    };

    const handleCaptionPointerDown = (e) => {
        e.stopPropagation();
        const bounds = e.currentTarget.getBoundingClientRect();
        dragOffsetRef.current = {
            x: e.clientX - (bounds.left + bounds.width / 2),
            y: e.clientY - (bounds.top + bounds.height / 2)
        };
        setIsDraggingCaption(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleCaptionPointerMove = (e) => {
        if (!isDraggingCaption) return;
        const canvasBounds = storyCanvasRef.current?.getBoundingClientRect();
        if (!canvasBounds) return;

        const x = (e.clientX - dragOffsetRef.current.x - canvasBounds.left) / canvasBounds.width;
        const y = (e.clientY - dragOffsetRef.current.y - canvasBounds.top) / canvasBounds.height;

        setCaptionPos({
            x: Math.min(Math.max(x, 0.05), 0.95),
            y: Math.min(Math.max(y, 0.05), 0.95)
        });
    };

    const handleCaptionPointerUp = (e) => {
        setIsDraggingCaption(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    // Auto resize textarea height when typing
    useEffect(() => {
        if (captionRef.current) {
            captionRef.current.style.height = 'auto';
            captionRef.current.style.height = captionRef.current.scrollHeight + 'px';
        }
    }, [storyCaption, isTextMode]);

    useEffect(() => {
        if (storyMedia) {
            setIsPlayingPreview(true);
            if (previewVideoRef.current) {
                previewVideoRef.current.currentTime = 0;
                previewVideoRef.current.play().catch(() => {});
            }
        }
    }, [storyMedia]);

    useEffect(() => {
        setIsStoryOpen(isCreatingStory || selectedStory !== null);
        return () => {
            setIsStoryOpen(false);
        };
    }, [isCreatingStory, selectedStory, setIsStoryOpen]);

    // Live camera states
    const [isCameraMode, setIsCameraMode] = useState(false);
    const [storyFacingMode, setStoryFacingMode] = useState('user');
    const [captureMode, setCaptureMode] = useState('photo'); // 'photo' or 'video'
    const [isRecording, setIsRecording] = useState(false);
    const storyCameraStreamRef = useRef(null);
    const storyCameraVideoRef = useRef(null);
    const storyMediaRecorderRef = useRef(null);
    const storyRecordedChunksRef = useRef([]);

    useEffect(() => {
        return () => {
            if (storyMedia && storyMedia.startsWith('blob:')) {
                URL.revokeObjectURL(storyMedia);
            }
            stopStoryCamera();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storyMedia]);

    const startStoryCamera = async (facingMode = storyFacingMode, mode = captureMode) => {
        stopStoryCamera();
        try {
            let stream;
            const videoConstraints = {
                facingMode: { ideal: facingMode },
                width: { ideal: 1080 },
                height: { ideal: 1920 },
                aspectRatio: { ideal: 0.5625 }
            };
            const requestAudio = mode === 'video';

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: requestAudio
                });
            } catch (audioErr) {
                console.warn('Could not get stream with audio, falling back to video-only:', audioErr);
                stream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: false
                });
            }
            storyCameraStreamRef.current = stream;
            if (storyCameraVideoRef.current) {
                storyCameraVideoRef.current.srcObject = stream;
                storyCameraVideoRef.current.play().catch(() => {});
            }
        } catch (err) {
            console.error('Story camera error:', err);
        }
    };

    const stopStoryCamera = () => {
        if (isRecording) {
            stopStoryRecording();
        }
        if (storyCameraStreamRef.current) {
            storyCameraStreamRef.current.getTracks().forEach(t => t.stop());
            storyCameraStreamRef.current = null;
        }
    };

    const flipStoryCamera = async () => {
        const next = storyFacingMode === 'user' ? 'environment' : 'user';
        setStoryFacingMode(next);
        await startStoryCamera(next, captureMode);
    };

    const captureStoryPhoto = () => {
        const video = storyCameraVideoRef.current;
        if (!video) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
        const ctx = canvas.getContext('2d');
        // Mirror the captured frame for front camera
        if (storyFacingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], 'story-photo.jpg', { type: 'image/jpeg' });
            setOriginalFile(file);
            setStoryFile(file);
            const url = URL.createObjectURL(file);
            setStoryMedia(url);
            setIsVideoPreview(false);
            setIsEditorOpen(true);
            setUploadError('');
            stopStoryCamera();
            setIsCameraMode(false);
        }, 'image/jpeg', 0.92);
    };

    const storyMirrorCanvasRef = useRef(null);
    const storyMirrorRafRef = useRef(null);

    const startStoryRecording = () => {
        if (!storyCameraStreamRef.current) return;
        storyRecordedChunksRef.current = [];

        const isFrontCamera = storyFacingMode === 'user';
        let recordStream = storyCameraStreamRef.current;

        // For front camera: record from a mirrored canvas so the output matches
        // the preview (which is CSS-mirrored). This also avoids 90° rotation on mobile.
        let mirrorCanvas = null;
        let mirrorCtx = null;
        if (isFrontCamera && storyCameraVideoRef.current) {
            const sourceVideo = storyCameraVideoRef.current;
            mirrorCanvas = document.createElement('canvas');
            mirrorCanvas.width = sourceVideo.videoWidth || 720;
            mirrorCanvas.height = sourceVideo.videoHeight || 1280;
            mirrorCtx = mirrorCanvas.getContext('2d');
            storyMirrorCanvasRef.current = mirrorCanvas;

            const drawFrame = () => {
                if (!mirrorCtx || !sourceVideo || sourceVideo.readyState < 2) {
                    storyMirrorRafRef.current = requestAnimationFrame(drawFrame);
                    return;
                }
                mirrorCtx.save();
                mirrorCtx.translate(mirrorCanvas.width, 0);
                mirrorCtx.scale(-1, 1);
                mirrorCtx.drawImage(sourceVideo, 0, 0, mirrorCanvas.width, mirrorCanvas.height);
                mirrorCtx.restore();
                storyMirrorRafRef.current = requestAnimationFrame(drawFrame);
            };
            storyMirrorRafRef.current = requestAnimationFrame(drawFrame);

            // Combine mirrored canvas video track with original audio tracks
            const canvasVideoTrack = mirrorCanvas.captureStream(30).getVideoTracks()[0];
            const audioTracks = storyCameraStreamRef.current.getAudioTracks();
            recordStream = new MediaStream([canvasVideoTrack, ...audioTracks]);
        }

        let selectedType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find(t => MediaRecorder.isTypeSupported(t)) || '';
        const recorder = new MediaRecorder(recordStream, selectedType ? { mimeType: selectedType } : {});
        storyMediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                storyRecordedChunksRef.current.push(e.data);
            }
        };

        recorder.onstop = () => {
            // Stop mirror canvas animation
            if (storyMirrorRafRef.current) {
                cancelAnimationFrame(storyMirrorRafRef.current);
                storyMirrorRafRef.current = null;
            }
            storyMirrorCanvasRef.current = null;

            const blob = new Blob(storyRecordedChunksRef.current, { type: selectedType || 'video/mp4' });
            const file = new File([blob], 'story-video.mp4', { type: blob.type });
            setOriginalFile(file);
            setStoryFile(file);
            const url = URL.createObjectURL(blob);
            setStoryMedia(url);
            setIsVideoPreview(true);
            setIsEditorOpen(true);
            setUploadError('');
            
            // Clean up stream *after* processing so that MediaRecorder doesn't break
            if (storyCameraStreamRef.current) {
                storyCameraStreamRef.current.getTracks().forEach(t => t.stop());
                storyCameraStreamRef.current = null;
            }
            setIsCameraMode(false);
            setIsRecording(false);
        };

        recorder.start();
        setIsRecording(true);
    };

    const stopStoryRecording = () => {
        if (storyMediaRecorderRef.current && storyMediaRecorderRef.current.state !== 'inactive') {
            storyMediaRecorderRef.current.stop();
        }
    };

    // Re-attach stream when video element mounts after isCameraMode becomes true
    useEffect(() => {
        if (isCameraMode && storyCameraVideoRef.current && storyCameraStreamRef.current) {
            storyCameraVideoRef.current.srcObject = storyCameraStreamRef.current;
            storyCameraVideoRef.current.play().catch(() => {});
        }
    }, [isCameraMode]);

    // Auto-start camera when opening the story creator without media

    useEffect(() => {
        if (isCreatingStory) {
            setIsMuted(true);
            if (!storyMedia) {
                setIsCameraMode(true);
                startStoryCamera(storyFacingMode, captureMode);
            }
        } else if (!isCreatingStory) {
            setIsCameraMode(false);
            stopStoryCamera();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCreatingStory, storyMedia]);

    // Restart camera when switching capture modes to toggle mic audio tracks
    useEffect(() => {
        if (isCameraMode && isCreatingStory && !storyMedia) {
            startStoryCamera(storyFacingMode, captureMode);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [captureMode]);


    // Set audio track time on story change
    useEffect(() => {
        const currentStory = selectedStory?.stories?.[activeStoryIndex];
        if (currentStory && currentStory.musicData && viewerAudioRef.current) {
            viewerAudioRef.current.currentTime = currentStory.musicStartTime || 0;
        }
    }, [activeStoryIndex, selectedStory]);

    // Control play/pause for audio
    useEffect(() => {
        const audio = viewerAudioRef.current;
        if (audio) {
            if (isPlayingViewer) {
                audio.play().catch(() => {});
            } else {
                audio.pause();
            }
        }
    }, [isPlayingViewer, activeStoryIndex, selectedStory]);

    // Control story viewer video playback via isPlayingViewer
    useEffect(() => {
        const video = viewerVideoRef.current;
        if (!video) return;
        if (isPlayingViewer) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    }, [isPlayingViewer, selectedStory, activeStoryIndex]);

    useEffect(() => {
        if (isMoreMenuOpen || isDeleting) {
            setIsPlayingViewer(false);
        } else {
            if (selectedStory) {
                setIsPlayingViewer(true);
            }
        }
    }, [isMoreMenuOpen, isDeleting, selectedStory]);



    const loadStories = async () => {
        try {
            const feed = await storyService.getFeedStories();
            setFeedStories(feed);

            // Flatten feed stories into a simple structure
            const mapped = feed.map((s) => ({
                id: s.id,
                userId: s.user.id,
                username: s.user.username || s.user.handle || 'User',
                avatar: (s.media?.type === 'image' && s.media?.url) ? s.media.url : (s.user.avatar || NO_IMAGE_AVATAR),
                isPremium: s.user.isPremium,
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
                avatar: mine ? mine.avatar : (profile?.avatar || NO_IMAGE_AVATAR),
                isPremium: profile?.isPremium,
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
                isPremium: profile?.isPremium,
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

    useEffect(() => {
        if (openStoryId) {
            storyService.getUserStories(openStoryId).then(userStories => {
                if (userStories.length > 0) {
                    const first = userStories[0];
                    setSelectedStory({
                        user: {
                            id: first.user?.id || first.userId,
                            username: first.user?.username || first.user?.handle || 'User',
                            avatar: first.user?.avatar || first.avatar || NO_IMAGE_AVATAR,
                            isPremium: first.user?.isPremium || first.isPremium,
                            isMe: first.isMe
                        },
                        stories: userStories.map((s) => ({
                            id: s.id,
                            mediaUrl: s.media?.url || s.mediaUrl,
                            mediaType: (() => {
                                const t = s.media?.type || s.mediaType || 'image';
                                const url = s.media?.url || s.mediaUrl || '';
                                if (t === 'image' && /\.(mp4|webm|mov|mkv|ogg)($|\?)/i.test(url)) return 'video';
                                return t;
                            })(),
                            caption: s.caption || '',
                            captionStyle: s.captionStyle || null,
                            musicData: s.musicData || null,
                            musicStartTime: s.musicStartTime || 0,
                            filter: s.filter || 'none',
                            mediaScale: s.mediaScale || 1,
                            mediaPosition: s.mediaPosition || { x: 0, y: 0 },
                            musicPosition: s.musicPosition || { x: 0.5, y: 0.25 },
                            aspectRatio: s.aspectRatio || '9/16',
                            createdAt: s.createdAt,
                        })),
                    });
                    setActiveStoryIndex(0);
                }
                searchParams.delete('openStory');
                setSearchParams(searchParams, { replace: true });
            }).catch(console.error);
        }
    }, [openStoryId]);

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
                    isPremium: first.user?.isPremium || first.isPremium,
                    isMe: isMe
                },
                stories: userStories.map((s) => ({
                    id: s.id,
                    mediaUrl: s.media?.url || s.mediaUrl,
                    mediaType: (() => {
                        const t = s.media?.type || s.mediaType || 'image';
                        const url = s.media?.url || s.mediaUrl || '';
                        // Fallback: detect video by URL extension if type is wrong
                        if (t === 'image' && /\.(mp4|webm|mov|mkv|ogg)($|\?)/i.test(url)) return 'video';
                        return t;
                    })(),
                    caption: s.caption || '',
                    captionStyle: s.captionStyle || null,
                    musicData: s.musicData || null,
                    musicStartTime: s.musicStartTime || 0,
                    filter: s.filter || 'none',
                    mediaScale: s.mediaScale || 1,
                    mediaPosition: s.mediaPosition || { x: 0, y: 0 },
                    musicPosition: s.musicPosition || { x: 0.5, y: 0.25 },
                    aspectRatio: s.aspectRatio || '9/16',
                    createdAt: s.createdAt,
                })),
            });
            setActiveStoryIndex(0);
        }
    };

    const isDraggingImageRef = useRef(false);
    const dragImageStartRef = useRef({ x: 0, y: 0 });

    const handleImagePointerDown = (e) => {
        e.preventDefault();
        isDraggingImageRef.current = true;
        dragImageStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleImagePointerMove = (e) => {
        if (!isDraggingImageRef.current) return;
        const bounds = storyCanvasRef.current?.getBoundingClientRect();
        if (!bounds) return;
        
        const dx = e.clientX - dragImageStartRef.current.x;
        const dy = e.clientY - dragImageStartRef.current.y;
        dragImageStartRef.current = { x: e.clientX, y: e.clientY };
        
        const px = (dx / bounds.width) * 100 / imageScale;
        const py = (dy / bounds.height) * 100 / imageScale;
        
        setImagePosition(prev => ({
            x: prev.x + px,
            y: prev.y + py
        }));
    };

    const handleImagePointerUp = () => {
        isDraggingImageRef.current = false;
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1080;
                    const MAX_HEIGHT = 1920;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    }, 'image/jpeg', 0.82);
                };
            };
        });
    };

    const handleCreateStory = async () => {
        if (!storyFile || isSubmitting) return;
        setIsSubmitting(true);
        setUploadError('');
        try {
            let fileToUpload = storyFile;
            if (storyFile.type.startsWith('image/')) {
                fileToUpload = await compressImage(storyFile);
            }
            await storyService.createStory({
                file: fileToUpload,
                caption: storyCaption,
                musicId: storyMusic?._id || storyMusic?.id,
                musicTrackId: storyMusic?.title || 'none',
                musicStartTime: storyMusicStartTime,
                captionPosX: captionPos.x,
                captionPosY: captionPos.y,
                captionTextColor,
                captionBgColor,
                filter: storyFilter,
                mediaScale: imageScale,
                mediaPosX: imagePosition.x,
                mediaPosY: imagePosition.y,
                musicPosX: musicPos.x,
                musicPosY: musicPos.y,
                aspectRatio: storyAspect,
                music: storyMusic,
            });
            await loadStories();
            resetStoryCreatorState();
        } catch (err) {
            setUploadError(err?.message || 'Failed to share. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetStoryCreatorState = () => {
        setIsCreatingStory(false);
        if (storyMedia && storyMedia.startsWith('blob:')) {
            URL.revokeObjectURL(storyMedia);
        }
        setStoryMedia(null);
        setStoryMusic(null);
        setStoryFile(null);
        setOriginalFile(null);
        setStoryCaption('');
        if (captionRef.current) captionRef.current.innerText = '';
        setStoryMusicStartTime(0);
        setStoryFilter('none');
        setShowFilters(false);
        setIsVideoPreview(false);
        setIsTextMode(false);
        setCaptionPos({ x: 0.5, y: 0.8 });
        setMusicPos({ x: 0.5, y: 0.25 });
        setImageScale(1);
        setImagePosition({ x: 0, y: 0 });
        setStoryAspect('9/16');
        setCaptionBgMode('solid');
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
        
        let downloadUrl = current.mediaUrl;
        setIsMoreMenuOpen(false);

        // If it's a Cloudinary URL, inject 'fl_attachment' to trigger download directly in browser (bypasses CORS)
        if (downloadUrl.includes('cloudinary.com') && downloadUrl.includes('/upload/')) {
            try {
                const formattedUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
                const a = document.createElement('a');
                a.href = formattedUrl;
                a.target = '_blank';
                a.click();
                return;
            } catch (err) {
                console.error('Cloudinary download redirect failed', err);
            }
        }

        try {
            const response = await fetch(downloadUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `story-${current.id || Date.now()}.${current.mediaType === 'video' ? 'mp4' : 'jpg'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download fetch failed, attempting fallback direct link', err);
            try {
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.download = `story-${current.id || Date.now()}.${current.mediaType === 'video' ? 'mp4' : 'jpg'}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (fallbackErr) {
                console.error('All download attempts failed', fallbackErr);
                alert('Download failed. Please try again.');
            }
        }
    };

    const goToNextStory = () => {
        if (!selectedStory?.stories || !selectedStory.stories.length) return;
        setIsPlayingViewer(true);
        if (activeStoryIndex < selectedStory.stories.length - 1) {
            setActiveStoryIndex((prev) => prev + 1);
        } else {
            setSelectedStory(null);
            setActiveStoryIndex(0);
        }
    };

    const goToPrevStory = () => {
        if (!selectedStory?.stories || !selectedStory.stories.length) return;
        setIsPlayingViewer(true);
        if (activeStoryIndex > 0) {
            setActiveStoryIndex((prev) => prev - 1);
        } else {
            setSelectedStory(null);
            setActiveStoryIndex(0);
        }
    };

    if (stories.length === 0 && !hideFeed) {
        return null;
    }

    return (
        <>
            {!hideFeed && (
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
                                <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-black flex items-center justify-center">
                                    <Avatar src={story.avatar} alt={story.username} size="w-full h-full" isPremium={story.isPremium} />
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
            )}

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
                            <div className="absolute inset-0 flex z-10">
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
                                <div className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden">
                                    <div 
                                        className="w-full relative overflow-hidden"
                                        style={{
                                            aspectRatio: selectedStory.stories[activeStoryIndex].aspectRatio === '9/16' ? undefined : selectedStory.stories[activeStoryIndex].aspectRatio,
                                            maxHeight: selectedStory.stories[activeStoryIndex].aspectRatio === '1/1' ? '100%' : selectedStory.stories[activeStoryIndex].aspectRatio === '16/9' ? '56.25vw' : '100%',
                                            height: selectedStory.stories[activeStoryIndex].aspectRatio === '9/16' ? '100%' : 'auto',
                                        }}
                                    >
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
                                                ref={viewerVideoRef}
                                                src={selectedStory.stories[activeStoryIndex].mediaUrl || ''}
                                                className="w-full h-full object-cover"
                                                autoPlay
                                                muted={isMuted || !!selectedStory.stories[activeStoryIndex].musicData}
                                                loop
                                                playsInline
                                                onLoadedData={(e) => {
                                                    if (isPlayingViewer) {
                                                        e.target.play().catch(() => {});
                                                    }
                                                }}
                                                style={{
                                                    filter: FILTERS.find(f => f.name.toLowerCase() === (selectedStory.stories[activeStoryIndex].filter || 'none').toLowerCase())?.value || 'none',
                                                    transform: `scale(${selectedStory.stories[activeStoryIndex].mediaScale || 1}) translate(${(selectedStory.stories[activeStoryIndex].mediaPosition?.x || 0)}%, ${(selectedStory.stories[activeStoryIndex].mediaPosition?.y || 0)}%)`,
                                                }}
                                            />
                                        ) : (
                                            <img
                                                key={`story-img-${selectedStory.stories[activeStoryIndex].id}`}
                                                src={optimizeCloudinaryUrl(selectedStory.stories[activeStoryIndex].mediaUrl || '', { width: 1080, quality: '80' })}
                                                alt="Story Content"
                                                className={`w-full h-full ${(selectedStory.stories[activeStoryIndex].aspectRatio || '9/16') === '9/16' ? 'object-cover' : 'object-contain'}`}
                                                style={{
                                                    filter: FILTERS.find(f => f.name.toLowerCase() === (selectedStory.stories[activeStoryIndex].filter || 'none').toLowerCase())?.value || 'none',
                                                    transform: `scale(${selectedStory.stories[activeStoryIndex].mediaScale || 1}) translate(${(selectedStory.stories[activeStoryIndex].mediaPosition?.x || 0)}%, ${(selectedStory.stories[activeStoryIndex].mediaPosition?.y || 0)}%)`,
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                             )}

                             {/* Music Sticker Viewer Overlay */}
                             {selectedStory.stories?.[activeStoryIndex]?.musicData && (
                                <div
                                    className="absolute bg-white/90 text-black px-3 py-2 rounded-xl flex items-center gap-2 backdrop-blur-md shadow-lg skew-y-[-2deg] z-20 pointer-events-none"
                                    style={{
                                        left: `${(selectedStory.stories[activeStoryIndex].musicPosition?.x || 0.5) * 100}%`,
                                        top: `${(selectedStory.stories[activeStoryIndex].musicPosition?.y || 0.25) * 100}%`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                >
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-black">
                                        <Music size={10} />
                                    </div>
                                    <p className="text-[10px] font-bold truncate max-w-[100px]">
                                        {selectedStory.stories[activeStoryIndex].musicData.title}
                                    </p>
                                </div>
                             )}

                            {/* Story Progress Bar */}
                            <div className="absolute top-2 left-2 right-2 flex gap-1">
                                {selectedStory.stories?.map((s, idx) => (
                                    <div
                                        key={s.id || idx}
                                        className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                                    >
                                        {idx === activeStoryIndex && (
                                            <>
                                                <style>{`
                                                    @keyframes storyProgress {
                                                        from { width: 0%; }
                                                        to { width: 100%; }
                                                    }
                                                `}</style>
                                                <div
                                                    key={idx}
                                                    className="h-full bg-white"
                                                    style={{
                                                        animationName: 'storyProgress',
                                                        animationDuration: '5s',
                                                        animationTimingFunction: 'linear',
                                                        animationPlayState: isPlayingViewer ? 'running' : 'paused',
                                                        animationFillMode: 'forwards'
                                                    }}
                                                    onAnimationEnd={goToNextStory}
                                                />
                                            </>
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
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Avatar 
                                        src={selectedStory.user?.avatar} 
                                        size="xs" 
                                        isPremium={selectedStory.user?.isPremium} 
                                        className="border border-white/50"
                                    />
                                    <span className="text-white text-xs font-bold drop-shadow-md truncate">
                                        {selectedStory.user?.username}
                                    </span>
                                    {selectedStory.user?.isPremium && (
                                        <div className="w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center p-0.5 shadow-sm">
                                            <Check size={8} className="text-white" strokeWidth={5} />
                                        </div>
                                    )}
                                </div>
                                <span className="text-white/70 text-xs ml-2 shrink-0">Story</span>
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
                                            className="w-full bg-zinc-900 rounded-t-3xl overflow-hidden pb-8 border-t border-white/10"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-3" />
                                            <div className="flex flex-col">
                                                <button
                                                    onClick={handleDownload}
                                                    className="w-full py-4 px-6 flex items-center gap-4 hover:bg-white/5 text-white border-b border-white/5 active:bg-white/10"
                                                >
                                                    <Download size={20} className="text-zinc-400" />
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
                                                    className="w-full py-4 px-6 flex items-center justify-center font-bold text-sm text-zinc-400 hover:text-white uppercase tracking-widest mt-2"
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
                                            className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 text-center border border-white/10"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="w-16 h-16 bg-red-400/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                                <Trash2 size={32} />
                                            </div>
                                            <h3 className="text-white font-bold text-lg mb-2">Delete Story?</h3>
                                            <p className="text-zinc-400 text-sm mb-6">This action cannot be undone. Your story will be permanently removed.</p>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={handleDeleteStory}
                                                    className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
                                                >
                                                    Yes, Delete
                                                </button>
                                                <button
                                                    onClick={() => setIsDeleting(false)}
                                                    className="w-full py-3 bg-white/10 text-white hover:bg-white/20 rounded-xl font-bold text-sm transition-colors"
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
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-lg flex items-center justify-center p-0 sm:p-4"
                    >
                        <div className="relative w-full h-full sm:max-w-[450px] sm:h-[90vh] bg-zinc-950 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                        {/* Header Controls */}
                        <div className="flex items-center justify-between p-4 z-10 w-full absolute top-0 left-0">
                            <button 
                                onClick={() => {
                                    if (storyMedia) {
                                        setShowDiscardConfirm(true);
                                    } else {
                                        resetStoryCreatorState();
                                    }
                                }} 
                                className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-md"
                            >
                                <X size={24} />
                            </button>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => {
                                        setShowMusicPicker(!showMusicPicker);
                                        setShowFilters(false);
                                        setIsTextMode(false);
                                    }} 
                                    className={`w-10 h-10 ${storyMusic ? 'bg-primary' : 'bg-black/40'} rounded-full flex items-center justify-center text-white backdrop-blur-md`}
                                >
                                    <Music size={20} />
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowFilters(!showFilters);
                                        setIsTextMode(false);
                                        setShowMusicPicker(false);
                                    }} 
                                    className={`w-10 h-10 ${showFilters ? 'bg-primary' : 'bg-black/40'} rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors`}
                                >
                                    <Sparkles size={20} />
                                </button>
                                <button
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white backdrop-blur-md ${
                                        isTextMode ? 'bg-primary' : 'bg-black/40'
                                    }`}
                                    type="button"
                                    onClick={() => {
                                        setIsTextMode(!isTextMode);
                                        setShowFilters(false);
                                        setShowMusicPicker(false);
                                    }}
                                >
                                    <Type size={20} />
                                </button>
                                {storyMedia && (
                                    <button
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white backdrop-blur-md ${
                                            isEditorOpen ? 'bg-primary' : 'bg-black/40'
                                        }`}
                                        type="button"
                                        onClick={() => {
                                            setIsEditorOpen(true);
                                            setShowFilters(false);
                                            setShowMusicPicker(false);
                                            setIsTextMode(false);
                                        }}
                                    >
                                        <Scissors size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Top Text Editing Toolbar */}
                        {isCreatingStory && isTextMode && (
                            <div className="absolute top-20 left-0 right-0 flex justify-center items-center gap-6 z-50 bg-black/70 py-2.5 px-4 backdrop-blur-md border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/70 font-semibold">Text</span>
                                    <input
                                        type="color"
                                        value={captionTextColor}
                                        onChange={(e) => setCaptionTextColor(e.target.value)}
                                        className="w-8 h-8 rounded-full overflow-hidden border border-white/20 p-0 bg-transparent cursor-pointer"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (captionBgMode === 'transparent') setCaptionBgMode('semi');
                                        else if (captionBgMode === 'semi') setCaptionBgMode('solid');
                                        else setCaptionBgMode('transparent');
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 flex items-center gap-1.5 text-white hover:bg-white/20 transition-all font-bold text-xs"
                                    title="Toggle background style"
                                >
                                    <span>Bg Mode:</span>
                                    {captionBgMode === 'transparent' && <span className="font-normal opacity-50">None</span>}
                                    {captionBgMode === 'semi' && <span className="px-1 py-0.5 bg-white/30 text-white rounded text-[10px]">A (Semi)</span>}
                                    {captionBgMode === 'solid' && <span className="px-1 py-0.5 bg-white text-black rounded text-[10px]">A (Solid)</span>}
                                </button>
                                {captionBgMode !== 'transparent' && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-white/70 font-semibold">Bg Color</span>
                                        <input
                                            type="color"
                                            value={captionBgColor}
                                            onChange={(e) => setCaptionBgColor(e.target.value)}
                                            className="w-8 h-8 rounded-full overflow-hidden border border-white/20 p-0 bg-transparent cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Story Content Area */}
                        <div
                            ref={storyCanvasRef}
                            className="flex-1 relative rounded-3xl overflow-hidden bg-zinc-950 mt-16 mx-2 mb-2"
                        >
                            {storyMedia ? (
                                <div 
                                    onClick={() => {
                                        setShowFilters(false);
                                        setIsTextMode(false);
                                        setShowMusicPicker(false);
                                    }}
                                    className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden"
                                >
                                    {storyMusic && (
                                        <audio
                                            key={`preview-audio-${storyMusic.id || storyMusic._id}`}
                                            ref={previewAudioRef}
                                            src={storyMusic.preview || storyMusic.audioUrl}
                                            autoPlay
                                            loop
                                        />
                                    )}
                                    <div 
                                        className="w-full relative overflow-hidden"
                                        style={{
                                            aspectRatio: storyAspect === '9/16' ? undefined : storyAspect,
                                            maxHeight: storyAspect === '1/1' ? '100%' : storyAspect === '16/9' ? '56.25vw' : '100%',
                                            height: storyAspect === '9/16' ? '100%' : 'auto',
                                        }}
                                    >
                                        {isVideoPreview ? (
                                            <div 
                                                className="w-full h-full relative cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (previewVideoRef.current) {
                                                        if (isPlayingPreview) {
                                                            previewVideoRef.current.pause();
                                                            setIsPlayingPreview(false);
                                                        } else {
                                                            previewVideoRef.current.play().catch(() => {});
                                                            setIsPlayingPreview(true);
                                                        }
                                                    }
                                                }}
                                            >
                                                <video
                                                    ref={previewVideoRef}
                                                    src={storyMedia}
                                                    className="w-full h-full object-cover pointer-events-none"
                                                    autoPlay
                                                    muted
                                                    loop
                                                    style={{
                                                        filter: FILTERS.find(f => f.name.toLowerCase() === storyFilter.toLowerCase())?.value || 'none',
                                                    }}
                                                />
                                                {!isPlayingPreview && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 pointer-events-none z-10">
                                                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-95 transition-transform">
                                                            <Play size={24} className="text-white translate-x-0.5" fill="currentColor" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div 
                                                onPointerDown={handleImagePointerDown}
                                                onPointerMove={handleImagePointerMove}
                                                onPointerUp={handleImagePointerUp}
                                                onPointerLeave={handleImagePointerUp}
                                                className="w-full h-full cursor-move touch-none"
                                            >
                                                <img
                                                    src={storyMedia}
                                                    className={`w-full h-full ${storyAspect === '9/16' ? 'object-cover' : 'object-contain'} pointer-events-none select-none`}
                                                    alt="Preview"
                                                    style={{
                                                        filter: FILTERS.find(f => f.name.toLowerCase() === storyFilter.toLowerCase())?.value || 'none',
                                                        transform: `scale(${imageScale}) translate(${imagePosition.x}%, ${imagePosition.y}%)`,
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : isCameraMode ? (
                                // --- Live Camera View ---
                                <div className="absolute inset-0 bg-black overflow-hidden">
                                    <video
                                        ref={storyCameraVideoRef}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        playsInline
                                        style={{ transform: storyFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                                    />
                                    {/* Flip camera button */}
                                    <button
                                        type="button"
                                        onClick={flipStoryCamera}
                                        className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>
                                            <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5"/>
                                            <circle cx="12" cy="12" r="3"/>
                                            <path d="m18 2-3 3 3 3"/>
                                            <path d="m6 22 3-3-3-3"/>
                                        </svg>
                                    </button>
                                    {/* Shutter button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (captureMode === 'photo') {
                                                captureStoryPhoto();
                                            } else {
                                                if (isRecording) {
                                                    stopStoryRecording();
                                                } else {
                                                    startStoryRecording();
                                                }
                                            }
                                        }}
                                        className={`absolute bottom-20 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white backdrop-blur-md transition-transform z-10 flex items-center justify-center ${
                                            isRecording ? 'bg-red-500 scale-110' : 'bg-white/20 active:scale-90'
                                        }`}
                                    >
                                        {isRecording && <div className="w-6 h-6 bg-white rounded-sm" />}
                                        <span className="sr-only">Capture</span>
                                    </button>

                                    {/* Capture Mode Tabs */}
                                    {!isRecording && (
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full z-10">
                                            {['photo', 'video'].map((mode) => (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() => setCaptureMode(mode)}
                                                    className={`capitalize text-sm font-semibold transition-colors ${
                                                        captureMode === mode ? 'text-white' : 'text-white/50'
                                                    }`}
                                                >
                                                    {mode}
                                                    {captureMode === mode && (
                                                        <span className="absolute left-1/2 top-full mt-1 h-1 w-1 -translate-x-1/2 rounded-full bg-white" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/50 flex-col gap-4">
                                    <button onClick={() => setIsCameraMode(true)} className="p-6 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                                        <Camera size={64} className="opacity-50" />
                                    </button>
                                    <p className="text-sm font-semibold tracking-wider uppercase">Tap Camera to start</p>
                                </div>
                            )}

                            {/* Music Sticker Overlay using pointer events */}
                            {storyMusic && (
                                <div
                                    onPointerDown={handleMusicPointerDown}
                                    onPointerMove={handleMusicPointerMove}
                                    onPointerUp={handleMusicPointerUp}
                                    onPointerCancel={handleMusicPointerUp}
                                    style={{
                                        position: 'absolute',
                                        left: `${musicPos.x * 100}%`,
                                        top: `${musicPos.y * 100}%`,
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: 50,
                                        touchAction: 'none'
                                    }}
                                    className="bg-white/90 text-black px-4 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-2xl skew-y-[-2deg] cursor-move select-none"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black shadow-lg animate-pulse">
                                        <Music size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0 pointer-events-none">
                                        <p className="text-[11px] font-bold truncate max-w-[120px]">{storyMusic.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-bold text-black/50">{Math.floor(storyMusicStartTime)}s</span>
                                            <div className="flex-1 h-1 bg-black/10 rounded-full relative">
                                                <div 
                                                    className="absolute h-full bg-primary rounded-full" 
                                                    style={{ width: `${(storyMusicStartTime / (storyMusic.duration || 60)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Draggable, editable caption using pointer events */}
                            {(isTextMode || storyCaption.trim() !== '') && (
                                <div
                                    onPointerDown={handleCaptionPointerDown}
                                    onPointerMove={handleCaptionPointerMove}
                                    onPointerUp={handleCaptionPointerUp}
                                    onPointerCancel={handleCaptionPointerUp}
                                    style={{
                                        position: 'absolute',
                                        left: `${captionPos.x * 100}%`,
                                        top: `${captionPos.y * 100}%`,
                                        transform: 'translate(-50%, -50%)',
                                        backgroundColor: getCaptionBgStyle(),
                                        minWidth: '150px',
                                        maxWidth: '80%',
                                        zIndex: 100,
                                        touchAction: 'none'
                                    }}
                                    className="p-3 rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing group select-none"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isTextMode) {
                                            setIsTextMode(true);
                                            setShowFilters(false);
                                            setShowMusicPicker(false);
                                        }
                                    }}
                                >
                                    {isTextMode ? (
                                        <textarea
                                            ref={captionRef}
                                            placeholder="Type your text"
                                            value={storyCaption}
                                            onChange={(e) => {
                                                setStoryCaption(e.target.value);
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                            className="w-full bg-transparent outline-none border-none resize-none text-center font-bold text-lg placeholder:text-white/40 overflow-hidden leading-tight pointer-events-auto"
                                            style={{
                                                color: captionTextColor,
                                                minHeight: '1.5em',
                                                display: 'block',
                                                width: '100%',
                                            }}
                                            rows={1}
                                            autoFocus
                                        />
                                    ) : (
                                        <div 
                                            className="w-full text-center font-bold text-lg break-words whitespace-pre-wrap leading-tight pointer-events-none"
                                            style={{ color: captionTextColor }}
                                        >
                                            {storyCaption}
                                        </div>
                                    )}
                                    {/* Drag handle */}
                                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus size={14} className="rotate-45" />
                                    </div>
                                </div>
                            )}

                            {/* Filter controls */}
                            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 z-10">
                                {storyMedia && !isVideoPreview && (
                                    <div className="flex flex-col gap-1.5 mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-white/60 text-[10px] uppercase tracking-wider font-bold shrink-0">Size</span>
                                            <input
                                                type="range"
                                                min="0.2"
                                                max="3"
                                                step="0.1"
                                                value={imageScale}
                                                onChange={(e) => setImageScale(Number(e.target.value))}
                                                className="flex-1 h-1 rounded-full bg-white/20 accent-white appearance-none"
                                            />
                                            <span className="text-white/70 text-[10px] font-mono w-8 text-right">{Math.round(imageScale * 100)}%</span>
                                        </div>
                                        {/* Aspect Ratio Selector */}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-white/60 text-[10px] uppercase tracking-wider font-bold shrink-0">Ratio</span>
                                            <div className="flex gap-1.5">
                                                {[
                                                    { label: '9:16', value: '9/16' },
                                                    { label: '1:1', value: '1/1' },
                                                    { label: '4:5', value: '4/5' },
                                                    { label: '16:9', value: '16/9' },
                                                ].map((ratio) => (
                                                    <button
                                                        key={ratio.label}
                                                        type="button"
                                                        onClick={() => {
                                                            setStoryAspect(ratio.value);
                                                            setImageScale(1);
                                                            setImagePosition({ x: 0, y: 0 });
                                                        }}
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                                            storyAspect === ratio.value
                                                                ? 'bg-white text-black scale-105'
                                                                : 'bg-black/50 text-white border border-white/20'
                                                        }`}
                                                    >
                                                        {ratio.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-white/40 italic">Touch image to move position</p>
                                    </div>
                                )}

                                {showFilters && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-1.5 p-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10"
                                    >
                                        <span className="text-white/60 text-[10px] uppercase tracking-wider font-bold block mb-1">
                                            Filters
                                        </span>
                                        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1.5 touch-pan-x">
                                            {FILTERS.map((f) => (
                                                <button
                                                    key={f.name}
                                                    type="button"
                                                    onClick={() => setStoryFilter(f.name.toLowerCase())}
                                                    className="flex flex-col items-center gap-1 shrink-0"
                                                >
                                                    <div 
                                                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${storyFilter === f.name.toLowerCase() ? 'border-primary ring-2 ring-primary/20' : 'border-white/10'}`}
                                                    >
                                                        {storyMedia && isVideoPreview ? (
                                                            <video 
                                                                src={storyMedia} 
                                                                className="w-full h-full object-cover"
                                                                style={{ filter: f.value }}
                                                                muted
                                                                playsInline
                                                            />
                                                        ) : (
                                                            <img 
                                                                src={storyMedia || "/person.png"} 
                                                                className="w-full h-full object-cover"
                                                                style={{ filter: f.value }}
                                                                alt=""
                                                                onError={(e) => {
                                                                    e.target.src = "/person.png";
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <span className={`text-[9px] font-bold ${storyFilter === f.name.toLowerCase() ? 'text-primary' : 'text-white/60'}`}>
                                                        {f.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Music Picker Bottom Sheet */}
                            <AnimatePresence>
                                {showMusicPicker && (
                                    <MusicSelectionModal
                                        currentSelected={storyMusic}
                                        onSelect={(track) => {
                                            setStoryMusic(track);
                                            setStoryMusicStartTime(0);
                                            setShowMusicPicker(false);
                                        }}
                                        onClose={() => setShowMusicPicker(false)}
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Bottom Actions - always on top and visible */}
                        <div className="flex-shrink-0 relative z-20 p-4 py-6 flex items-center justify-between bg-black">
                            {/* Camera toggle button */}
                            <button
                                type="button"
                                onClick={async () => {
                                    if (isCameraMode) {
                                        stopStoryCamera();
                                        setIsCameraMode(false);
                                    } else {
                                        setIsCameraMode(true);
                                        await startStoryCamera();
                                    }
                                }}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 text-white shrink-0 transition-colors ${
                                    isCameraMode ? 'border-primary bg-primary/20' : 'border-white/20 bg-white/10'
                                }`}
                            >
                                <Camera size={24} />
                            </button>

                            <label className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white/20 bg-white/10 text-white cursor-pointer relative overflow-hidden shrink-0">
                                {storyMedia ? (
                                    isVideoPreview ? (
                                        <video src={storyMedia} className="w-full h-full object-cover" muted playsInline />
                                    ) : (
                                        <img 
                                            src={storyMedia} 
                                            className="w-full h-full object-cover" 
                                            alt="Preview" 
                                            onError={(e) => {
                                                e.target.src = "/person.png";
                                            }}
                                        />
                                    )
                                ) : (
                                    <ImageIcon size={24} />
                                )}
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.webm"
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
                                            setOriginalFile(file);
                                            setIsVideoPreview(file.type.startsWith('video/'));
                                            setImageScale(1);
                                            setImagePosition({ x: 0, y: 0 });
                                            setUploadError('');
                                        }
                                        e.target.value = '';
                                    }}
                                />
                            </label>

                            {isEditorOpen && originalFile && (
                                <EditorModal
                                    file={originalFile}
                                    type={originalFile.type.startsWith('video/') ? 'video' : 'image'}
                                    onClose={() => setIsEditorOpen(false)}
                                    onSave={async (editData, selectedRatio) => {
                                        setIsEditorOpen(false);
                                        
                                        if (editData instanceof File) {
                                            if (storyMedia && storyMedia.startsWith('blob:')) {
                                                URL.revokeObjectURL(storyMedia);
                                            }
                                            const url = URL.createObjectURL(editData);
                                            setStoryMedia(url);
                                            setStoryFile(editData);
                                            
                                            // Check if it's a video file being passed directly
                                            if (editData.type && editData.type.startsWith('video/')) {
                                                setIsVideoPreview(true);
                                            } else {
                                                setIsVideoPreview(false);
                                                setImageScale(1);
                                                setImagePosition({ x: 0, y: 0 });
                                                if (selectedRatio) {
                                                    setStoryAspect(selectedRatio);
                                                }
                                            }
                                            setUploadError('');
                                        } else {
                                            // Video Editor Backend Processing
                                            setIsProcessing(true);
                                            try {
                                                const res = await videoService.processVideo({
                                                    file: editData.file,
                                                    secondFile: editData.secondFile,
                                                    trim: editData.trim,
                                                    layout: editData.layout,
                                                    rotation: editData.rotation,
                                                    splitRatio: editData.splitRatio,
                                                    music: editData.music
                                                });
                                                const response = await fetch(res.url);
                                                const blob = await response.blob();
                                                const editedFile = new File([blob], res.filename || 'edited-story.mp4', { type: 'video/mp4' });
                                                
                                                if (storyMedia && storyMedia.startsWith('blob:')) {
                                                    URL.revokeObjectURL(storyMedia);
                                                }
                                                const url = URL.createObjectURL(editedFile);
                                                setStoryMedia(url);
                                                setStoryFile(editedFile);
                                                setIsVideoPreview(true);
                                                setUploadError('');
                                            } catch (err) {
                                                console.error('Video processing failed:', err);
                                                setUploadError('Processing failed. Try again.');
                                            } finally {
                                                setIsProcessing(false);
                                            }
                                        }
                                    }}
                                />
                            )}

                            {isProcessing && (
                                <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6">
                                    <div className="relative">
                                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                                        <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse rounded-full"></div>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <p className="text-xl font-black text-white uppercase tracking-tighter">Processing Story</p>
                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest animate-pulse">Running advanced pixel computations</p>
                                    </div>
                                </div>
                            )}

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
                        {/* Discard Confirmation Modal */}
                        <AnimatePresence>
                            {showDiscardConfirm && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        exit={{ scale: 0.9, y: 20 }}
                                        className="bg-[#1c1c1c] rounded-3xl p-6 w-full max-w-sm"
                                    >
                                        <h3 className="text-xl font-bold text-white mb-2 text-center">Discard media?</h3>
                                        <p className="text-white/60 text-sm text-center mb-6">
                                            If you go back now, you will lose your selected photo or video.
                                        </p>
                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={() => {
                                                    resetStoryCreatorState();
                                                    setShowDiscardConfirm(false);
                                                }}
                                                className="w-full py-4 bg-red-500/10 text-red-500 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-colors"
                                            >
                                                Discard
                                            </button>
                                            <button
                                                onClick={() => setShowDiscardConfirm(false)}
                                                className="w-full py-4 bg-white/5 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-colors"
                                            >
                                                Keep
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

