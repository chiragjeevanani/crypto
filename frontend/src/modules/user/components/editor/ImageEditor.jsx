import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
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
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState(9 / 16);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [imageSrc] = useState(URL.createObjectURL(file));
    
    // Tools State
    const [activeTool, setActiveTool] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState('normal');
    const [texts, setTexts] = useState([]);
    const [activeTextId, setActiveTextId] = useState(null);
    const [editingText, setEditingText] = useState(null);
    
    const drawingCanvasRef = useRef(null);

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
            ctx.drawImage(drawingCanvas, 0, 0, pixelCrop.width, pixelCrop.height);
        }

        // Text Layer Merge
        texts.forEach(text => {
            const style = TEXT_STYLES[text.styleIndex || 0].style;
            ctx.font = `bold ${text.fontSize}px sans-serif`;
            ctx.textAlign = text.alignment || 'center';
            
            const lines = text.content.split('\n');
            const lineHeight = text.fontSize * 1.2;
            
            lines.forEach((line, index) => {
                const textWidth = ctx.measureText(line).width;
                const canvasX = text.alignment === 'left' ? text.x : 
                               text.alignment === 'right' ? text.x + textWidth : 
                               text.x + (textWidth / 2);
                const canvasY = text.y + (index * lineHeight);

                // Draw styled background if exists
                if (style.backgroundColor && style.backgroundColor !== 'transparent') {
                    ctx.fillStyle = style.backgroundColor;
                    const padding = 12;
                    const radius = style.borderRadius ? parseInt(style.borderRadius) : 0;
                    
                    const bgX = text.alignment === 'left' ? text.x - padding : 
                               text.alignment === 'right' ? text.x - textWidth - padding : 
                               text.x - (textWidth / 2) - padding;
                    const bgY = canvasY - text.fontSize;
                    const bgW = textWidth + padding * 2;
                    const bgH = text.fontSize + padding;

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
                    ctx.shadowBlur = 4;
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
        const editedFile = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, selectedFilter, texts);
        onSave(editedFile);
    };

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
                x: 100, y: 150,
                fontSize: 32,
                scale: 1,
                rotate: 0
            };
            setTexts([...texts, newText]);
        }
        setEditingText(null);
        setActiveTool(null);
    };

    const activeFilterCSS = FILTERS.find(f => f.id === selectedFilter)?.filter || 'none';

    return (
        <div className="flex flex-col h-full bg-black text-white relative overflow-hidden">
            {/* Immersive Tool Bar */}
            <StoryToolBar 
                activeTool={activeTool}
                onSelectTool={(tool) => {
                    setActiveTool(tool);
                    if (tool === 'text') setEditingText(null); // Clear for new text
                }}
                onClose={onClose}
                onClearDrawing={() => drawingCanvasRef.current?.clear()}
            />

            {/* Immersive Preview */}
            <div className="flex-1 relative bg-black flex items-center justify-center p-4">
                <div className="w-full h-full max-w-[450px] aspect-[9/16] relative rounded-[40px] overflow-hidden shadow-2xl border border-white/5 bg-zinc-900">
                    <div className="w-full h-full" style={{ filter: activeFilterCSS }}>
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={aspect}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            showGrid={false}
                            style={{ containerStyle: { background: '#111' } }}
                        />
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
                    />
                </div>
            </div>

            {/* Tool Specific Selectors */}
            {activeTool === 'filters' && (
                <FilterSelector 
                    selectedFilter={selectedFilter}
                    onSelectFilter={setSelectedFilter}
                    imageSrc={imageSrc}
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
