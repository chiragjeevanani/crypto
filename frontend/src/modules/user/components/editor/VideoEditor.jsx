import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Scissors, Columns2, Rows2, RotateCw, Volume2, VolumeX, FastForward, Timer, Music, SlidersHorizontal } from 'lucide-react';
import MusicSelectionModal from '../feed/MusicSelectionModal';

const VideoEditor = ({ file, onSave }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [layout, setLayout] = useState('single');
    const [rotation, setRotation] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [videoSrc] = useState(URL.createObjectURL(file));
    
    const [secondVideo, setSecondVideo] = useState(null);
    const [secondVideoSrc, setSecondVideoSrc] = useState(null);

    const [splitRatio, setSplitRatio] = useState(50);
    const [selectedMusic, setSelectedMusic] = useState(null);
    const [showMusicPicker, setShowMusicPicker] = useState(false);
    const [error, setError] = useState('');
    const musicAudioRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
                const dur = videoRef.current.duration;
                setDuration(dur);
                setEndTime(dur);
            };
        }
    }, [videoSrc]);

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                if (musicAudioRef.current) musicAudioRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                if (musicAudioRef.current) {
                    musicAudioRef.current.currentTime = (videoRef.current.currentTime % (musicAudioRef.current.duration || 60));
                    musicAudioRef.current.play().catch(() => {});
                }
                setIsPlaying(true);
            }
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            setCurrentTime(current);
            if (current >= endTime) {
                videoRef.current.currentTime = startTime;
            }
        }
    };

    const handleApply = async () => {
        const editParams = {
            file,
            secondFile: secondVideo,
            trim: { start: startTime, end: endTime },
            layout: layout,
            rotation: rotation,
            splitRatio: splitRatio,
            music: selectedMusic,
            type: 'video'
        };
        onSave(editParams);
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    return (
        <div className="flex flex-col h-full bg-black text-white">
            <div className="relative flex-1 bg-zinc-900 overflow-hidden flex items-center justify-center p-4">
                <div 
                    className={`w-full max-w-sm rounded-3xl overflow-hidden aspect-[9/16] relative bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 transition-all duration-500 ${layout === 'side-by-side' ? 'flex' : layout === 'top-bottom' ? 'flex flex-col' : ''}`}
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        className={`object-cover transition-all duration-300`}
                        style={{ 
                            width: layout === 'side-by-side' ? `${splitRatio}%` : '100%',
                            height: layout === 'top-bottom' ? `${splitRatio}%` : '100%'
                        }}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => {
                            if (videoRef.current) {
                                videoRef.current.currentTime = startTime;
                                videoRef.current.play();
                                if (musicAudioRef.current) {
                                    musicAudioRef.current.currentTime = 0;
                                    musicAudioRef.current.play().catch(() => {});
                                }
                            }
                        }}
                        muted={isMuted}
                        playsInline
                    />
                    {secondVideoSrc && (
                         <video
                             src={secondVideoSrc}
                             className={`object-cover transition-all duration-300`}
                             style={{ 
                                width: layout === 'side-by-side' ? `${100 - splitRatio}%` : '100%',
                                height: layout === 'top-bottom' ? `${100 - splitRatio}%` : '100%'
                            }}
                             muted={isMuted}
                             playsInline
                             autoPlay
                             loop
                         />
                    )}
                    
                    {/* Split Adjustment Overlay */}
                    {layout !== 'single' && secondVideoSrc && (
                        <div 
                            className={`absolute z-20 pointer-events-none flex items-center justify-center transition-all duration-300`}
                            style={{
                                top: layout === 'top-bottom' ? `${splitRatio}%` : 0,
                                left: layout === 'side-by-side' ? `${splitRatio}%` : 0,
                                width: layout === 'side-by-side' ? '2px' : '100%',
                                height: layout === 'top-bottom' ? '2px' : '100%',
                                background: 'rgba(255,255,255,0.5)',
                                boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center pointer-events-auto cursor-pointer shadow-lg active:scale-90 transition-transform">
                                <div className="w-1 h-4 bg-white rounded-full mx-0.5"></div>
                                <div className="w-1 h-4 bg-white rounded-full mx-0.5"></div>
                            </div>
                        </div>
                    )}
                    
                    <button 
                        onClick={handlePlayPause}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 group hover:bg-black/20 transition-all"
                    >
                        {!isPlaying && <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center scale-90 group-hover:scale-100 transition-transform border border-white/20"><Play size={32} fill="white" /></div>}
                        {isPlaying && <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 p-4 rounded-full backdrop-blur-sm"><Pause size={32} fill="white" /></div>}
                    </button>

                    {/* Quick Controls Overlay */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white"
                        >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowMusicPicker(true); }}
                            className={`w-10 h-10 rounded-full ${selectedMusic ? 'bg-primary border-primary/50' : 'bg-black/40 border-white/10'} backdrop-blur-md border flex items-center justify-center text-white`}
                        >
                            <Music size={18} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRotate(); }}
                            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white"
                        >
                            <RotateCw size={18} />
                        </button>
                    </div>

                    {selectedMusic && (
                        <div className="absolute bottom-4 left-4 z-20 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 max-w-[200px]">
                            <Music size={12} className="text-primary animate-pulse" />
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[10px] font-bold text-white truncate">{selectedMusic.title}</span>
                                <span className="text-[8px] text-white/60 truncate">{selectedMusic.artist}</span>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedMusic(null); }}
                                className="ml-1 p-1 hover:text-red-400 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 bg-zinc-950 border-t border-zinc-800 space-y-8 pb-10">
                {/* Trim Slider */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-primary/10 rounded-lg"><Scissors size={14} className="text-primary" /></div>
                             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Precision Trim</span>
                        </div>
                        <div className="px-3 py-1 bg-zinc-900 rounded-full border border-white/5 font-mono text-[11px] text-primary">
                            {startTime.toFixed(1)}s — {endTime.toFixed(1)}s
                        </div>
                    </div>
                    
                    <div className="relative h-14 flex items-center group">
                        <div className="absolute inset-0 bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 shadow-inner">
                             <div className="absolute h-full bg-primary/20 backdrop-blur-[2px] transition-all border-x border-primary/50" style={{ left: `${(startTime / duration) * 100}%`, right: `${100 - (endTime / duration) * 100}%` }}>
                                 <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0"></div>
                             </div>
                             <div className="absolute h-full w-[2px] bg-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10" style={{ left: `${(currentTime / duration) * 100}%` }}></div>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={duration}
                            step={0.1}
                            value={startTime}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val < endTime) setStartTime(val);
                            }}
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto"
                        />
                        <input
                            type="range"
                            min={0}
                            max={duration}
                            step={0.1}
                            value={endTime}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val > startTime) setEndTime(val);
                            }}
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto"
                        />
                    </div>
                </div>

                {/* Layout & More */}
                <div className="space-y-4">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-zinc-900 rounded-lg"><Columns2 size={14} className="text-zinc-400" /></div>
                             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Composition</span>
                         </div>
                         {layout !== 'single' && !secondVideo && (
                             <div className="flex flex-col gap-2">
                                 {error && (
                                     <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-500">
                                         {error}
                                     </div>
                                 )}
                                 <label className="text-[10px] font-bold text-primary cursor-pointer hover:text-primary/80 transition-colors flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 w-fit">
                                     <FastForward size={12} /> Add Fusion Multi-Cam
                                     <input 
                                         type="file" 
                                         accept="video/*" 
                                         className="hidden" 
                                         onChange={(e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                                 if (file.size > 10 * 1024 * 1024) {
                                                     setError('File size exceeds 10MB limit. Please select a smaller file.');
                                                     return;
                                                 }
                                                 setError('');
                                                 setSecondVideo(file);
                                                 setSecondVideoSrc(URL.createObjectURL(file));
                                             }
                                         }}
                                     />
                                 </label>
                             </div>
                         )}
                         {secondVideo && (
                             <button 
                                 onClick={() => {
                                     setSecondVideo(null);
                                     setSecondVideoSrc(null);
                                     setLayout('single');
                                 }}
                                 className="text-[10px] font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 bg-red-500/5 px-3 py-1.5 rounded-full border border-red-500/10"
                             >
                                 Reset Multi-Cam
                             </button>
                         )}
                     </div>
                     <div className="flex gap-3">
                         {[
                             { id: 'single', label: 'Classic', icon: Timer },
                             { id: 'side-by-side', label: 'Split', icon: Columns2 },
                             { id: 'top-bottom', label: 'Stack', icon: Rows2 }
                         ].map(item => (
                             <button 
                                 key={item.id}
                                 onClick={() => {
                                     setLayout(item.id);
                                     if (item.id === 'single') setSplitRatio(50);
                                 }}
                                 className={`flex-1 py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex flex-col items-center gap-2 ${layout === item.id ? 'border-primary bg-primary/10 text-primary shadow-xl shadow-primary/10' : 'border-white/5 bg-zinc-900 text-zinc-500'}`}
                             >
                                 <item.icon size={16} />
                                 {item.label}
                             </button>
                         ))}
                     </div>

                     {layout !== 'single' && (
                         <div className="space-y-3 pt-2">
                             <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                                 <span className="flex items-center gap-2"><SlidersHorizontal size={14} className="text-primary" /> Adjusted {layout === 'side-by-side' ? 'Width' : 'Height'} Split</span>
                                 <span className="text-white font-mono">{splitRatio}% / {100 - splitRatio}%</span>
                             </div>
                             <input
                                 type="range"
                                 min={20} max={80}
                                 value={splitRatio}
                                 onChange={(e) => setSplitRatio(Number(e.target.value))}
                                 className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-primary border border-white/5"
                             />
                         </div>
                     )}
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        onClick={handleApply}
                        className="flex-1 py-5 px-6 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(var(--color-primary-rgb),0.3)] active:scale-[0.98] transition-all hover:brightness-110"
                    >
                        Initialize Final Render
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showMusicPicker && (
                    <MusicSelectionModal 
                        onSelect={(music) => {
                            setSelectedMusic(music);
                            setShowMusicPicker(false);
                            if (isPlaying && videoRef.current) {
                                // Will be auto-resynced or played via handlePlayPause logic
                            }
                        }}
                        onClose={() => setShowMusicPicker(false)}
                        currentSelected={selectedMusic}
                    />
                )}
            </AnimatePresence>
            
            {selectedMusic && (
                <audio 
                    ref={musicAudioRef}
                    src={selectedMusic.audioUrl}
                    muted={isMuted}
                    loop
                    className="hidden"
                />
            )}
        </div>
    );
};

export default VideoEditor;
