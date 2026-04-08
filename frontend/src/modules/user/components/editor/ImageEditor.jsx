import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn, RotateCw, Sun, Contrast, Droplets, Image as ImageIcon, Frame, RotateCcw, Trash2 } from 'lucide-react';

const ImageEditor = ({ file, onSave }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [aspect, setAspect] = useState(4 / 5);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [imageSrc] = useState(URL.createObjectURL(file));

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc, pixelCrop, rotation, brightness, contrast, saturation) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        const rotRad = (rotation * Math.PI) / 180;
        const bWidth = Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height);
        const bHeight = Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height);

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = bWidth;
        tempCanvas.height = bHeight;

        tempCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        tempCtx.translate(bWidth / 2, bHeight / 2);
        tempCtx.rotate(rotRad);
        tempCtx.translate(-image.width / 2, -image.height / 2);
        tempCtx.drawImage(image, 0, 0);

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        ctx.drawImage(
            tempCanvas,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const editedFile = new File([blob], file.name, { type: 'image/jpeg' });
                resolve(editedFile);
            }, 'image/jpeg');
        });
    };

    const handleApply = async () => {
        const editedFile = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, brightness, contrast, saturation);
        onSave(editedFile);
    };

    const handleRotate90 = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
    };

    return (
        <div className="flex flex-col h-full bg-black text-white">
            <div className="relative flex-1 bg-zinc-900 group">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    showGrid={true}
                />
                
                {/* Overlay controls for quick rotation/reset */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleRotate90}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white"
                        title="Rotate 90°"
                    >
                        <RotateCw size={20} />
                    </button>
                    <button 
                        onClick={handleReset}
                        className="w-12 h-12 rounded-full bg-red-500/10 backdrop-blur-md flex items-center justify-center border border-red-500/20 text-red-500"
                        title="Reset All"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>

                {/* Aspect Ratio Selector Overlay */}
                <div className="absolute top-6 left-6 flex gap-2">
                    {[
                        { label: '4:5', value: 4/5 },
                        { label: '1:1', value: 1/1 },
                        { label: '16:9', value: 16/9 }
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={() => setAspect(item.value)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-tighter uppercase transition-all ${aspect === item.value ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-black/60 text-zinc-400 backdrop-blur-md'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6 bg-zinc-950 border-t border-zinc-800 space-y-6 max-h-[50%] overflow-y-auto hide-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Zoom */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><ZoomIn size={14} className="text-primary" /> Zoom</span>
                            <span className="text-white font-mono">{zoom.toFixed(1)}x</span>
                        </div>
                        <input
                            type="range"
                            min={1} max={3} step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>

                    {/* Rotation */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><RotateCw size={14} className="text-primary" /> Rotation</span>
                            <span className="text-white font-mono">{rotation}°</span>
                        </div>
                        <input
                            type="range"
                            min={0} max={360}
                            value={rotation}
                            onChange={(e) => setRotation(Number(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>

                    {/* Brightness */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Sun size={14} className="text-orange-400" /> Brightness</span>
                            <span className="text-white font-mono">{brightness}%</span>
                        </div>
                        <input
                            type="range"
                            min={50} max={150}
                            value={brightness}
                            onChange={(e) => setBrightness(Number(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-400"
                        />
                    </div>

                    {/* Contrast */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Contrast size={14} className="text-blue-400" /> Contrast</span>
                            <span className="text-white font-mono">{contrast}%</span>
                        </div>
                        <input
                            type="range"
                            min={50} max={150}
                            value={contrast}
                            onChange={(e) => setContrast(Number(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
                        />
                    </div>

                    {/* Saturation */}
                    <div className="space-y-3 md:col-span-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Droplets size={14} className="text-pink-400" /> Saturation</span>
                            <span className="text-white font-mono">{saturation}%</span>
                        </div>
                        <input
                            type="range"
                            min={0} max={200}
                            value={saturation}
                            onChange={(e) => setSaturation(Number(e.target.value))}
                            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-400"
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-2">
                    <button
                        onClick={handleApply}
                        className="flex-1 py-4 px-6 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] hover:opacity-90 shadow-xl shadow-primary/20"
                    >
                        Apply Edits
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-4 bg-zinc-900 text-zinc-400 rounded-2xl transition-all hover:text-red-400"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
