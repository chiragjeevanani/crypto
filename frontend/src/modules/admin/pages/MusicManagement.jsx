import React, { useState, useEffect } from 'react';
import { 
    Music, 
    Upload, 
    Search, 
    Trash2, 
    Plus, 
    Check, 
    X, 
    Play, 
    Pause, 
    MoreVertical,
    ToggleRight,
    ToggleLeft,
    Loader2,
    Music2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function MusicManagement() {
    const [music, setMusic] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [playingId, setPlayingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newTrack, setNewTrack] = useState({
        title: '',
        artist: '',
        audioFile: null,
        thumbnailFile: null
    });

    const audioRef = React.useRef(null);

    useEffect(() => {
        fetchMusic();
    }, []);

    const fetchMusic = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('crypto_auth_token');
            const res = await fetch(`${API_BASE}/admin/music/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMusic(data.music);
            }
        } catch (err) {
            console.error('Failed to fetch music:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!newTrack.title || !newTrack.artist || !newTrack.audioFile) {
            setError('Please fill all required fields and select an audio file.');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('crypto_auth_token');
            const formData = new FormData();
            formData.append('title', newTrack.title);
            formData.append('artist', newTrack.artist);
            formData.append('audio', newTrack.audioFile);
            if (newTrack.thumbnailFile) {
                formData.append('thumbnail', newTrack.thumbnailFile);
            }

            const res = await fetch(`${API_BASE}/admin/music/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                setSuccess('Music uploaded successfully!');
                setNewTrack({ title: '', artist: '', audioFile: null, thumbnailFile: null });
                setIsUploadModalOpen(false);
                fetchMusic();
            } else {
                setError(data.message || 'Upload failed');
            }
        } catch (err) {
            setError('System error during upload');
        } finally {
            setUploading(false);
        }
    };

    const toggleStatus = async (id) => {
        try {
            const token = localStorage.getItem('crypto_auth_token');
            const res = await fetch(`${API_BASE}/admin/music/${id}/toggle`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMusic(music.map(m => m._id === id ? { ...m, isActive: !m.isActive } : m));
            }
        } catch (err) {
            console.error('Failed to toggle status');
        }
    };

    const deleteTrack = async (id) => {
        if (!window.confirm('Are you sure you want to delete this track?')) return;
        try {
            const token = localStorage.getItem('crypto_auth_token');
            const res = await fetch(`${API_BASE}/admin/music/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMusic(music.filter(m => m._id !== id));
            }
        } catch (err) {
            console.error('Failed to delete track');
        }
    };

    const togglePlay = (track) => {
        if (playingId === track._id) {
            audioRef.current.pause();
            setPlayingId(null);
        } else {
            audioRef.current.src = track.audioUrl;
            audioRef.current.play();
            setPlayingId(track._id);
        }
    };

    const filteredMusic = music.filter(m => 
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-text flex items-center gap-2 uppercase">
                        <Music className="text-primary w-6 h-6" />
                        Music Library
                    </h1>
                    <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1 opacity-60">Manage background music for creators</p>
                </div>
                <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-wider hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
                >
                    <Plus size={16} strokeWidth={3} />
                    Upload Track
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-surface border border-surface rounded-2xl p-4 flex items-center gap-3">
                        <Search className="text-muted" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by title or artist..." 
                            className="bg-transparent border-none outline-none text-sm w-full font-semibold placeholder:text-muted/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="bg-surface border border-surface rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface2/30 border-b border-surface">
                                    <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Track</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Duration</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-muted font-bold animate-pulse uppercase tracking-wider">
                                            Loading Library...
                                        </td>
                                    </tr>
                                ) : filteredMusic.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-muted font-bold uppercase tracking-wider">
                                            No tracks found
                                        </td>
                                    </tr>
                                ) : filteredMusic.map((m) => (
                                    <tr key={m._id} className="border-b border-surface hover:bg-surface2/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    onClick={() => togglePlay(m)}
                                                    className="w-10 h-10 rounded-lg overflow-hidden bg-bg border border-surface relative group cursor-pointer flex-shrink-0"
                                                >
                                                    {m.thumbnail ? (
                                                        <img src={m.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted">
                                                            <Music size={16} />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 flex items-center justify-center text-white">
                                                        {playingId === m._id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-text truncate uppercase tracking-tight">{m.title}</p>
                                                    <p className="text-[10px] font-bold text-muted truncate uppercase tracking-widest">{m.artist}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-mono text-muted">{Math.floor(m.duration / 60)}:{(m.duration % 60).toString().padStart(2, '0')}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => toggleStatus(m._id)}
                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${m.isActive ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'}`}
                                            >
                                                {m.isActive ? <Check size={10} strokeWidth={4} /> : <X size={10} strokeWidth={4} />}
                                                {m.isActive ? 'Active' : 'Disabled'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => deleteTrack(m._id)}
                                                className="p-2 text-muted hover:text-danger rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-surface border border-surface rounded-3xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-bg border border-surface">
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Tracks</p>
                                <p className="text-2xl font-black text-text">{music.length}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-bg border border-surface">
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Active Now</p>
                                <p className="text-2xl font-black text-success">{music.filter(m => m.isActive).length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-surface border border-surface w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-surface flex items-center justify-between">
                                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                    <Upload size={20} className="text-primary" />
                                    Upload Track
                                </h3>
                                <button onClick={() => setIsUploadModalOpen(false)} className="text-muted hover:text-text">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUpload} className="p-6 space-y-5">
                                {error && <div className="p-3 bg-danger/10 text-danger text-xs font-bold rounded-xl border border-danger/20">{error}</div>}
                                {success && <div className="p-3 bg-success/10 text-success text-xs font-bold rounded-xl border border-success/20">{success}</div>}

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Track Title</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full bg-bg border border-surface p-3 rounded-xl text-sm font-bold focus:border-primary outline-none transition-all"
                                        placeholder="E.g. Summer Vibes"
                                        value={newTrack.title}
                                        onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Artist Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full bg-bg border border-surface p-3 rounded-xl text-sm font-bold focus:border-primary outline-none transition-all"
                                        placeholder="E.g. DJ Khaleed"
                                        value={newTrack.artist}
                                        onChange={(e) => setNewTrack({ ...newTrack, artist: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Audio File (MP3/WAV)</label>
                                        <div className="relative group">
                                            <input 
                                                type="file" 
                                                accept="audio/*" 
                                                required
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={(e) => setNewTrack({ ...newTrack, audioFile: e.target.files[0] })}
                                            />
                                            <div className="w-full bg-bg border-2 border-dashed border-surface p-4 rounded-xl flex flex-col items-center gap-2 group-hover:border-primary transition-all">
                                                <Music2 size={24} className="text-muted group-hover:text-primary" />
                                                <span className="text-[10px] font-bold text-muted truncate max-w-full">
                                                    {newTrack.audioFile ? newTrack.audioFile.name : 'Choose File'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Cover Art (Optional)</label>
                                        <div className="relative group">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={(e) => setNewTrack({ ...newTrack, thumbnailFile: e.target.files[0] })}
                                            />
                                            <div className="w-full bg-bg border-2 border-dashed border-surface p-4 rounded-xl flex flex-col items-center gap-2 group-hover:border-primary transition-all">
                                                <Plus size={24} className="text-muted group-hover:text-primary" />
                                                <span className="text-[10px] font-bold text-muted truncate max-w-full">
                                                    {newTrack.thumbnailFile ? newTrack.thumbnailFile.name : 'Choose Art'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={uploading}
                                    className="w-full py-4 bg-primary text-black font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {uploading ? <Loader2 className="animate-spin" size={18} /> : 'Publish to Library'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
        </div>
    );
}
