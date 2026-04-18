import React from 'react';
import { motion } from 'framer-motion';
import { TEXT_STYLES } from '../constants/textStyles';

const TextLayer = ({ texts = [], onEditText, onSelectText, activeId }) => {
    return (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            {texts.map((text) => {
                const textStyle = TEXT_STYLES[text.styleIndex || 0].style;
                
                return (
                    <motion.div
                        key={text.id}
                        drag
                        dragMomentum={false}
                        onDragStart={() => onSelectText(text.id)}
                        initial={{ x: text.x, y: text.y, scale: text.scale || 1, rotate: text.rotate || 0 }}
                        className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing px-2 transition-shadow ${
                            activeId === text.id ? 'ring-1 ring-white/50 shadow-2xl' : ''
                        }`}
                        style={{
                            ...textStyle,
                            fontSize: `${text.fontSize || 24}px`,
                            textAlign: text.alignment || 'center',
                            maxWidth: '80vw',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            userSelect: 'none',
                            transformOrigin: 'center center'
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectText(text.id);
                            // Tap to Edit (Instagram style)
                            onEditText(text);
                        }}
                    >
                        {text.content}
                    </motion.div>
                );
            })}
        </div>
    );
};

export default TextLayer;
