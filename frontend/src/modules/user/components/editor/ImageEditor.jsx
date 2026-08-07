import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DrawingCanvas from './components/DrawingCanvas';
import TextLayer from './components/TextLayer';
import StoryToolBar from './components/StoryToolBar';
import StoryBottomActions from './components/StoryBottomActions';
import FilterSelector from './components/FilterSelector';
import TextEditorOverlay from './components/TextEditorOverlay';
import { FILTERS } from './constants/filters';
import { TEXT_STYLES } from './constants/textStyles';

const ImageEditor = ({ file, onClose, onSave }) => {
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState('original');
    const [imageSrc] = useState(URL.createObjectURL(file));

    const aspectMap = {
        '9/16': 9 / 16,
        '1:1': 1,
        '1/1': 1,
        '4:5': 4 / 5,
        '4/5': 4 / 5,
        '16:9': 16 / 9,
        '16/9': 16 / 9
    };
    
    const getAspectValue = useCallback((selectedAspectStr) => {
        if (selectedAspectStr === 'free') return null;
        if (selectedAspectStr === 'original') {
            const img = imgRef.current;
            if (img) return img.naturalWidth / img.naturalHeight;
            return 1; // fallback before image load
        }
        return aspectMap[selectedAspectStr] || 9 / 16;
    }, []);
    
    // Tools State
    const [activeTool, setActiveTool] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('normal');
    const [texts, setTexts] = useState([]);
    const [activeTextId, setActiveTextId] = useState(null);
    const [editingText, setEditingText] = useState(null);
    
    const drawingCanvasRef = useRef(null);
    const imgRef = useRef(null);

    // Custom resizable crop box state
    const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 });
    const dragStartRef = useRef({ x: 0, y: 0 });
    const startBoxRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
    const activeActionRef = useRef(null); // 'drag' or 'resize-top-left', etc.

    // Reset crop box on aspect ratio change
    const resetCropBox = useCallback((selectedAspectStr) => {
        const img = imgRef.current;
        if (!img) return;
        const imgWidth = img.naturalWidth || img.clientWidth || 300;
        const imgHeight = img.naturalHeight || img.clientHeight || 400;
        const imgAspect = imgWidth / imgHeight;
        
        const aspectVal = getAspectValue(selectedAspectStr);
        
        let w, h;
        if (aspectVal === null) {
            // 'free' ratio: default to a large crop covering 80%
            w = 80;
            h = 80;
        } else if (imgAspect > aspectVal) {
            h = 80;
            w = h * (aspectVal / imgAspect);
        } else {
            w = 80;
            h = w * (imgAspect / aspectVal);
        }
        
        setCropBox({
            x: (100 - w) / 2,
            y: (100 - h) / 2,
            w: w,
            h: h
        });
    }, [getAspectValue]);

    const handleAspectChange = (newRatio) => {
        setAspect(newRatio);
        resetCropBox(newRatio);
    };

    const handlePointerDown = (e, action) => {
        e.preventDefault();
        e.stopPropagation();
        activeActionRef.current = action;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        startBoxRef.current = { ...cropBox };
    };

    const handlePointerMove = useCallback((e) => {
        if (!activeActionRef.current) return;
        const img = imgRef.current;
        if (!img) return;
        
        const rect = img.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        
        const dxPct = (dx / containerWidth) * 100;
        const dyPct = (dy / containerHeight) * 100;
        
        const startBox = startBoxRef.current;
        const imgAspect = img.naturalWidth / img.naturalHeight;
        
        if (activeActionRef.current === 'drag') {
            const x = Math.max(0, Math.min(100 - startBox.w, startBox.x + dxPct));
            const y = Math.max(0, Math.min(100 - startBox.h, startBox.y + dyPct));
            setCropBox(prev => ({ ...prev, x, y }));
        } else {
            const handle = activeActionRef.current;
            let newW = startBox.w;
            let newH = startBox.h;
            let newX = startBox.x;
            let newY = startBox.y;

            if (aspect === 'free') {
                // Freeform dragging (each side moves independently)
                if (handle === 'resize-bottom-right') {
                    newW = Math.max(15, Math.min(100 - startBox.x, startBox.w + dxPct));
                    newH = Math.max(15, Math.min(100 - startBox.y, startBox.h + dyPct));
                } else if (handle === 'resize-top-left') {
                    newW = Math.max(15, Math.min(startBox.w + startBox.x, startBox.w - dxPct));
                    newH = Math.max(15, Math.min(startBox.h + startBox.y, startBox.h - dyPct));
                    newX = startBox.x + startBox.w - newW;
                    newY = startBox.y + startBox.h - newH;
                } else if (handle === 'resize-top-right') {
                    newW = Math.max(15, Math.min(100 - startBox.x, startBox.w + dxPct));
                    newH = Math.max(15, Math.min(startBox.h + startBox.y, startBox.h - dyPct));
                    newY = startBox.y + startBox.h - newH;
                } else if (handle === 'resize-bottom-left') {
                    newW = Math.max(15, Math.min(startBox.w + startBox.x, startBox.w - dxPct));
                    newH = Math.max(15, Math.min(100 - startBox.y, startBox.h + dyPct));
                    newX = startBox.x + startBox.w - newW;
                }
            } else {
                // Keep aspect ratio constraint
                const aspectVal = getAspectValue(aspect);
                const aspectPercentRatio = aspectVal / imgAspect;
                
                if (handle === 'resize-bottom-right') {
                    const delta = Math.abs(dxPct) > Math.abs(dyPct) ? dxPct : dyPct * aspectPercentRatio;
                    newW = Math.max(15, Math.min(100 - startBox.x, startBox.w + delta));
                    newH = newW / aspectPercentRatio;
                    if (startBox.y + newH > 100) {
                        newH = 100 - startBox.y;
                        newW = newH * aspectPercentRatio;
                    }
                } else if (handle === 'resize-top-left') {
                    const delta = Math.abs(dxPct) > Math.abs(dyPct) ? -dxPct : -dyPct * aspectPercentRatio;
                    newW = Math.max(15, Math.min(startBox.w + startBox.x, startBox.w + delta));
                    newH = newW / aspectPercentRatio;
                    if (startBox.y + startBox.h - newH < 0) {
                        newH = startBox.y + startBox.h;
                        newW = newH * aspectPercentRatio;
                    }
                    newX = startBox.x + startBox.w - newW;
                    newY = startBox.y + startBox.h - newH;
                } else if (handle === 'resize-top-right') {
                    const delta = Math.abs(dxPct) > Math.abs(dyPct) ? dxPct : -dyPct * aspectPercentRatio;
                    newW = Math.max(15, Math.min(100 - startBox.x, startBox.w + delta));
                    newH = newW / aspectPercentRatio;
                    if (startBox.y + startBox.h - newH < 0) {
                        newH = startBox.y + startBox.h;
                        newW = newH * aspectPercentRatio;
                    }
                    newY = startBox.y + startBox.h - newH;
                } else if (handle === 'resize-bottom-left') {
                    const delta = Math.abs(dxPct) > Math.abs(dyPct) ? -dxPct : dyPct * aspectPercentRatio;
                    newW = Math.max(15, Math.min(startBox.w + startBox.x, startBox.w + delta));
                    newH = newW / aspectPercentRatio;
                    if (startBox.y + newH > 100) {
                        newH = 100 - startBox.y;
                        newW = newH * aspectPercentRatio;
                    }
                    newX = startBox.x + startBox.w - newW;
                }
            }
            
            setCropBox({ x: newX, y: newY, w: newW, h: newH });
        }
    }, [aspect, getAspectValue, cropBox]);

    const handlePointerUp = () => {
        activeActionRef.current = null;
    };

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            if (url && !url.startsWith('blob:')) {
                image.setAttribute('crossOrigin', 'anonymous');
            }
            image.src = url;
        });

    const handleDownload = async () => {
        const img = imgRef.current;
        if (!img) return;
        const oW = img.naturalWidth || img.clientWidth;
        const oH = img.naturalHeight || img.clientHeight;
        const pixelCrop = {
            x: Math.round((cropBox.x / 100) * oW),
            y: Math.round((cropBox.y / 100) * oH),
            width: Math.round((cropBox.w / 100) * oW),
            height: Math.round((cropBox.h / 100) * oH),
        };
        const editedFile = await getCroppedImg(imageSrc, pixelCrop, rotation, selectedFilter, texts);
        if (!editedFile) return;

        const downloadUrl = URL.createObjectURL(editedFile);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `story_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    };

    const getCroppedImg = async (imageSrc, pixelCrop, rotation, filterId, texts) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        // Base Image Rendering
        const rotRad = (rotation * Math.PI) / 180;
        const bWidth = Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height);
        const bHeight = Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height);

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = bWidth;
        tempCanvas.height = bHeight;

        // Apply Filter to Base Image
        const currentFilter = FILTERS.find(f => f.id === filterId)?.filter || 'none';
        tempCtx.filter = currentFilter;

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

        // Drawing Layer Merge
        if (drawingCanvasRef.current) {
            const drawingCanvas = drawingCanvasRef.current.getCanvas();
            const sx = (cropBox.x / 100) * drawingCanvas.width;
            const sy = (cropBox.y / 100) * drawingCanvas.height;
            const sWidth = (cropBox.w / 100) * drawingCanvas.width;
            const sHeight = (cropBox.h / 100) * drawingCanvas.height;
            
            ctx.drawImage(
                drawingCanvas,
                sx,
                sy,
                sWidth,
                sHeight,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );
        }

        // Text Layer Merge
        const displayedWidth = imgRef.current?.clientWidth || 1;
        const displayedHeight = imgRef.current?.clientHeight || 1;
        const displayCropX = (cropBox.x / 100) * displayedWidth;
        const displayCropY = (cropBox.y / 100) * displayedHeight;
        const displayCropW = (cropBox.w / 100) * displayedWidth;
        const scaleFactor = pixelCrop.width / (displayCropW || 1);

        texts.forEach(text => {
            const style = TEXT_STYLES[text.styleIndex || 0].style;
            const finalFontSize = (text.fontSize || 24) * scaleFactor;
            ctx.font = `bold ${finalFontSize}px ${style.fontFamily || 'sans-serif'}`;
            ctx.textAlign = text.alignment || 'center';
            
            // Map text position relative to cropped container
            const relX = text.x - displayCropX;
            const relY = text.y - displayCropY;
            const textX = relX * scaleFactor;
            const textY = relY * scaleFactor;

            const lines = text.content.split('\n');
            const lineHeight = finalFontSize * 1.2;
            
            lines.forEach((line, index) => {
                const textWidth = ctx.measureText(line).width;
                const canvasX = text.alignment === 'left' ? textX : 
                               text.alignment === 'right' ? textX + textWidth : 
                               textX + (textWidth / 2);
                const canvasY = textY + (index * lineHeight);

                // Draw styled background if exists
                if (style.backgroundColor && style.backgroundColor !== 'transparent') {
                    ctx.fillStyle = style.backgroundColor;
                    const padding = 12 * scaleFactor;
                    const radius = style.borderRadius ? parseInt(style.borderRadius) * scaleFactor : 0;
                    
                    const bgX = text.alignment === 'left' ? textX - padding : 
                               text.alignment === 'right' ? textX - textWidth - padding : 
                               textX - (textWidth / 2) - padding;
                    const bgY = canvasY - finalFontSize;
                    const bgW = textWidth + padding * 2;
                    const bgH = finalFontSize + padding;

                    ctx.beginPath();
                    ctx.moveTo(bgX + radius, bgY);
                    ctx.lineTo(bgX + bgW - radius, bgY);
                    ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + radius);
                    ctx.lineTo(bgX + bgW, bgY + bgH - radius);
                    ctx.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - radius, bgY + bgH);
                    ctx.lineTo(bgX + radius, bgY + bgH);
                    ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - radius);
                    ctx.lineTo(bgX, bgY + radius);
                    ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
                    ctx.closePath();
                    ctx.fill();
                }

                // Draw text with shadow if exists
                if (style.textShadow) {
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 4 * scaleFactor;
                }

                ctx.fillStyle = style.color || 'white';
                ctx.fillText(line, canvasX, canvasY);
                
                // Reset shadows
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            });
        });

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const editedFile = new File([blob], file.name, { type: 'image/jpeg' });
                resolve(editedFile);
            }, 'image/jpeg');
        });
    };

    const handleApply = async () => {
        const img = imgRef.current;
        if (!img) return;
        const oW = img.naturalWidth;
        const oH = img.naturalHeight;
        const pixelCrop = {
            x: Math.round((cropBox.x / 100) * oW),
            y: Math.round((cropBox.y / 100) * oH),
            width: Math.round((cropBox.w / 100) * oW),
            height: Math.round((cropBox.h / 100) * oH),
        };
        const editedFile = await getCroppedImg(imageSrc, pixelCrop, rotation, selectedFilter, texts);
        const saveAspectStr = aspect === 'free' ? `${pixelCrop.width}/${pixelCrop.height}` : 
                              aspect === 'original' ? `${oW}/${oH}` : 
                              aspect;
        onSave(editedFile, saveAspectStr);
    };

    // Handler for saving text data
    const handleSaveText = (textData) => {
        if (editingText) {
            // Updating existing text
            setTexts(prev => prev.map(t => 
                t.id === editingText.id ? { ...t, ...textData } : t
            ));
        } else {
            // Adding new text
            const newText = {
                id: Date.now(),
                ...textData,
                x: 50, y: 100, // Safe default starting point relative to parent container
                fontSize: 32,
                scale: 1,
                rotate: 0
            };
            setTexts([...texts, newText]);
        }
        setEditingText(null);
        setActiveTool(null);
    };

    const handleUpdateTextPosition = (id, x, y) => {
        setTexts(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
    };

    const activeFilterCSS = FILTERS.find(f => f.id === selectedFilter)?.filter || 'none';

    return (
        <div 
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="flex flex-col h-full bg-black text-white relative overflow-hidden"
        >
            <StoryToolBar 
                activeTool={activeTool}
                onSelectTool={(tool) => {
                    setActiveTool(tool);
                    if (tool === 'text') setEditingText(null); // Clear for new text
                }}
                onClose={onClose}
                onClearDrawing={() => drawingCanvasRef.current?.clear()}
                onDownload={handleDownload}
            />

            {!activeTool && (
                <div className="absolute top-24 left-0 right-0 flex justify-start sm:justify-center gap-2 z-40 overflow-x-auto no-scrollbar px-4 w-full flex-nowrap shrink-0">
                    {[
                        { label: 'Original', value: 'original' },
                        { label: 'Free', value: 'free' },
                        { label: '9:16', value: '9/16' },
                        { label: '1:1', value: '1/1' },
                        { label: '4:5', value: '4/5' },
                        { label: '16:9', value: '16/9' }
                    ].map((ratio) => (
                        <button
                            key={ratio.label}
                            onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAspectChange(ratio.value);
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAspectChange(ratio.value);
                            }}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg backdrop-blur-md shrink-0 ${aspect === ratio.value ? 'bg-white text-black scale-105' : 'bg-black/60 text-white border border-white/20 hover:bg-black/80'}`}
                        >
                            {ratio.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Immersive Preview */}
            <div className="flex-1 relative bg-black flex items-center justify-center p-4">
                <div className="w-full h-full max-w-[450px] aspect-[9/16] relative rounded-[40px] overflow-hidden shadow-2xl border border-white/5 bg-zinc-900 flex items-center justify-center">
                    <div className="relative inline-block select-none pointer-events-auto" style={{ filter: activeFilterCSS }}>
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Crop Target"
                            className="max-w-full max-h-[60vh] object-contain pointer-events-none"
                            onLoad={() => resetCropBox(aspect)}
                        />
                        {/* Crop Box Overlay */}
                        <div
                            style={{
                                position: 'absolute',
                                left: `${cropBox.x}%`,
                                top: `${cropBox.y}%`,
                                width: `${cropBox.w}%`,
                                height: `${cropBox.h}%`,
                                border: '2px solid #fff',
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                                cursor: 'move',
                                touchAction: 'none',
                                zIndex: 10,
                                pointerEvents: activeTool ? 'none' : 'auto'
                            }}
                            onPointerDown={(e) => handlePointerDown(e, 'drag')}
                        >
                            {/* Grid lines inside crop box */}
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                                <div className="border-r border-dashed border-white col-span-1 row-span-3" />
                                <div className="border-r border-dashed border-white col-span-1 row-span-3" />
                                <div className="border-b border-dashed border-white col-span-3 row-span-1" />
                                <div className="border-b border-dashed border-white col-span-3 row-span-1" />
                            </div>

                            {/* Draggable Corner Handles */}
                            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(handle => {
                                const style = {};
                                if (handle.includes('top')) style.top = '-6px';
                                else style.bottom = '-6px';
                                if (handle.includes('left')) style.left = '-6px';
                                else style.right = '-6px';
                                
                                return (
                                    <div
                                        key={handle}
                                        style={{
                                            position: 'absolute',
                                            width: '16px',
                                            height: '16px',
                                            backgroundColor: '#fff',
                                            border: '2px solid #000',
                                            borderRadius: '50%',
                                            cursor: `${handle === 'top-left' || handle === 'bottom-right' ? 'nwse-resize' : 'nesw-resize'}`,
                                            touchAction: 'none',
                                            ...style,
                                            zIndex: 20
                                        }}
                                        onPointerDown={(e) => handlePointerDown(e, `resize-${handle}`)}
                                    />
                                );
                            })}
                        </div>

                        {/* Layer 1: Drawing */}
                        <DrawingCanvas 
                            ref={drawingCanvasRef}
                            isActive={activeTool === 'draw'}
                            color="white"
                        />

                        {/* Layer 2: Text */}
                        <TextLayer 
                            texts={texts}
                            activeId={activeTextId}
                            onSelectText={setActiveTextId}
                            onEditText={(text) => setEditingText(text)}
                            onUpdateTextPosition={handleUpdateTextPosition}
                        />
                    </div>
                </div>
            </div>

            {activeTool === 'filters' && (
                <FilterSelector 
                    selectedFilter={selectedFilter}
                    onSelectFilter={setSelectedFilter}
                    imageSrc={imageSrc}
                    onClose={() => setActiveTool(null)}
                />
            )}

            {/* Immersive Bottom Actions */}
            <StoryBottomActions onApply={handleApply} />

            {/* Text Input Modal Overlay (Instagram Style) */}
            <AnimatePresence>
                {(activeTool === 'text' || editingText) && (
                    <TextEditorOverlay 
                        initialText={editingText?.content || ''}
                        initialStyleIndex={editingText?.styleIndex || 0}
                        initialAlignment={editingText?.alignment || 'center'}
                        onSave={handleSaveText}
                        onCancel={() => {
                            setEditingText(null);
                            setActiveTool(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ImageEditor;
