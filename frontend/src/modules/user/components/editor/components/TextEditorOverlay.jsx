import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Type, AlignLeft, AlignCenter, AlignRight, Check } from 'lucide-react';
import { TEXT_STYLES } from '../constants/textStyles';

const TextEditorOverlay = ({ initialText = '', initialStyleIndex = 0, initialAlignment = 'center', onSave, onCancel }) => {
    const [text, setText] = useState(initialText);
    const [styleIndex, setStyleIndex] = useState(initialStyleIndex);
    const [alignment, setAlignment] = useState(initialAlignment);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            textareaRef.current.setSelectionRange(text.length, text.length);
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, []);

    const handleSave = () => {
        if (text.trim()) {
            onSave({
                content: text,
                styleIndex,
                alignment
            });
        } else {
            onCancel();
        }
    };

    const currentStyle = TEXT_STYLES[styleIndex].style;

    const cycleAlignment = () => {
        const alignments = ['left', 'center', 'right'];
        const nextIndex = (alignments.indexOf(alignment) + 1) % alignments.length;
        setAlignment(alignments[nextIndex]);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-xl flex flex-col pt-safe px-6 pb-12 overflow-hidden touch-none"
        >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between h-16 pointer-events-auto">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={cycleAlignment}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-all border border-white/10"
                    >
                        {alignment === 'left' && <AlignLeft size={20} />}
                        {alignment === 'center' && <AlignCenter size={20} />}
                        {alignment === 'right' && <AlignRight size={20} />}
                    </button>
                    <button 
                        onClick={() => setStyleIndex((styleIndex + 1) % TEXT_STYLES.length)}
                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-90 transition-all font-black text-xs"
                    >
                        A
                    </button>
                </div>

                <button 
                    onClick={handleSave}
                    className="px-6 py-2 rounded-full bg-white text-black font-black text-sm uppercase tracking-widest active:scale-90 transition-all shadow-xl shadow-white/20"
                >
                    Done
                </button>
            </div>

            {/* Input Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-[90%] mx-auto">
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    placeholder="Type something..."
                    className="w-full bg-transparent outline-none resize-none placeholder:text-white/20 transition-all duration-300 overflow-hidden"
                    style={{
                        ...currentStyle,
                        fontSize: '36px',
                        textAlign: alignment,
                        lineHeight: '1.2',
                        height: 'auto',
                        minHeight: '60px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                    }}
                />
            </div>

            {/* Bottom Font Selector Overlay */}
            <div className="h-24 flex items-center justify-center gap-3 overflow-x-auto no-scrollbar pointer-events-auto snap-x px-4">
                {TEXT_STYLES.map((style, index) => (
                    <button
                        key={style.id}
                        onClick={() => setStyleIndex(index)}
                        className={`px-4 py-2 rounded-full shrink-0 snap-center transition-all ${
                            styleIndex === index 
                            ? 'bg-white text-black scale-110 font-bold shadow-xl shadow-white/20' 
                            : 'bg-white/10 text-white/60 backdrop-blur-sm border border-white/5'
                        }`}
                        style={{ fontFamily: style.style.fontFamily }}
                    >
                        {style.name}
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

export default TextEditorOverlay;
