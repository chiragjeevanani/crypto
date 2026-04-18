import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Save } from 'lucide-react';
import ImageEditor from './ImageEditor';
import VideoEditor from './VideoEditor';

const EditorModal = ({ file, type, onClose, onSave }) => {
    if (!file) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex flex-col bg-black text-white"
            >
                {/* Immersive Content Container */}
                <div className="flex-1 overflow-hidden relative">
                    {type === 'image' ? (
                        <ImageEditor file={file} onClose={onClose} onSave={onSave} />
                    ) : (
                        <VideoEditor file={file} onClose={onClose} onSave={onSave} />
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default EditorModal;
