import React from 'react';
import { FILTERS } from '../constants/filters';
import { motion } from 'framer-motion';

const FilterSelector = ({ selectedFilter, onSelectFilter, imageSrc, onClose }) => {
    return (
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-24 left-0 right-0 z-50 flex flex-col gap-4 pointer-events-auto px-4 bg-black/85 backdrop-blur-md py-4 rounded-t-3xl border-t border-white/10"
        >
            <div className="flex items-center justify-between px-2 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">Choose Filter</span>
                <button
                    onClick={onClose}
                    className="px-4 py-1.5 bg-white text-black font-bold text-xs rounded-full shadow-md hover:bg-white/90 active:scale-95 transition-all"
                >
                    Done
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x no-scrollbar">
                {FILTERS.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => onSelectFilter(filter.id)}
                        className={`flex flex-col items-center gap-2 snap-center transition-all ${
                            selectedFilter === filter.id ? 'scale-110' : 'opacity-60 grayscale-[0.5]'
                        }`}
                    >
                        <div 
                            className={`w-14 h-14 rounded-xl overflow-hidden border-2 shadow-lg transition-colors ${
                                selectedFilter === filter.id ? 'border-primary' : 'border-white/10'
                             }`}
                        >
                            <img 
                                src={imageSrc} 
                                alt={filter.name}
                                className="w-full h-full object-cover"
                                style={{ filter: filter.filter }}
                            />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            selectedFilter === filter.id ? 'text-primary' : 'text-zinc-400'
                        }`}>
                            {filter.name}
                        </span>
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

export default FilterSelector;
