import React from 'react';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TaskBuilder({ tasks = [], onChange, maxTasks = 5 }) {
    const [expandedTask, setExpandedTask] = React.useState(null);

    const addTask = () => {
        if (tasks.length < maxTasks) {
            const newTask = {
                id: Date.now(),
                name: '',
                description: '',
                instructions: '',
                reward: 0,
                rewardType: 'points', // points, coins, nft
                participantLimit: null,
                completionProof: 'text', // text, file, screenshot
            };
            onChange([...tasks, newTask]);
            setExpandedTask(newTask.id);
        }
    };

    const updateTask = (id, updates) => {
        onChange(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteTask = (id) => {
        onChange(tasks.filter(t => t.id !== id));
        setExpandedTask(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                    📋 Campaign Tasks ({tasks.length}/{maxTasks})
                </h3>
                {tasks.length < maxTasks && (
                    <button
                        onClick={addTask}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-all"
                    >
                        <Plus className="w-3 h-3" /> Add Task
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {tasks.map((task, idx) => (
                    <motion.div
                        key={task.id}
                        layout
                        className="bg-bg border border-surface rounded-lg overflow-hidden"
                    >
                        <button
                            onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-surface/50 transition-all"
                        >
                            <div className="flex items-center gap-3 flex-1 text-left">
                                <div className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded text-[10px] font-bold">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-semibold text-text truncate">
                                        {task.name || 'Untitled Task'}
                                    </p>
                                    <p className="text-[9px] text-muted truncate">
                                        Reward: {task.reward} {task.rewardType}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {expandedTask === task.id ? (
                                    <ChevronUp className="w-4 h-4 text-muted" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-muted" />
                                )}
                            </div>
                        </button>

                        <AnimatePresence>
                            {expandedTask === task.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-surface bg-surface/30 p-4 space-y-4"
                                >
                                    {/* Task Name */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-muted uppercase tracking-widest">Task Name *</label>
                                        <input
                                            type="text"
                                            value={task.name}
                                            onChange={(e) => updateTask(task.id, { name: e.target.value })}
                                            placeholder="e.g., Share & Like Instagram Post"
                                            className="w-full bg-bg border border-surface rounded-lg py-2 px-3 text-xs font-medium text-text placeholder-muted/50 focus:ring-1 focus:ring-primary/30 outline-none"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-muted uppercase tracking-widest">Description</label>
                                        <textarea
                                            value={task.description}
                                            onChange={(e) => updateTask(task.id, { description: e.target.value })}
                                            placeholder="Brief description of what users need to do"
                                            rows="2"
                                            className="w-full bg-bg border border-surface rounded-lg py-2 px-3 text-xs font-medium text-text placeholder-muted/50 focus:ring-1 focus:ring-primary/30 outline-none resize-none"
                                        />
                                    </div>

                                    {/* Instructions */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-muted uppercase tracking-widest">Detailed Instructions *</label>
                                        <textarea
                                            value={task.instructions}
                                            onChange={(e) => updateTask(task.id, { instructions: e.target.value })}
                                            placeholder="Step-by-step instructions for users"
                                            rows="3"
                                            className="w-full bg-bg border border-surface rounded-lg py-2 px-3 text-xs font-medium text-text placeholder-muted/50 focus:ring-1 focus:ring-primary/30 outline-none resize-none"
                                        />
                                    </div>

                                    {/* Reward Section */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-muted uppercase tracking-widest">Reward Amount *</label>
                                            <input
                                                type="number"
                                                value={task.reward}
                                                onChange={(e) => updateTask(task.id, { reward: parseFloat(e.target.value) || 0 })}
                                                placeholder="0"
                                                min="0"
                                                className="w-full bg-bg border border-surface rounded-lg py-2 px-3 text-xs font-medium text-text placeholder-muted/50 focus:ring-1 focus:ring-primary/30 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-muted uppercase tracking-widest">Reward Type</label>
                                            <select
                                                value={task.rewardType}
                                                onChange={(e) => updateTask(task.id, { rewardType: e.target.value })}
                                                className="w-full bg-bg border border-surface rounded-lg py-2 px-3 text-xs font-medium text-text focus:ring-1 focus:ring-primary/30 outline-none"
                                            >
                                                <option value="points">Points</option>
                                                <option value="coins">Coins</option>
                                                <option value="nft">NFT</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Completion Proof */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-muted uppercase tracking-widest">Proof Type</label>
                                            <select
                                                value={task.completionProof}
                                                onChange={(e) => updateTask(task.id, { completionProof: e.target.value })}
                                                className="w-full bg-bg border border-surface rounded-lg py-2 px-3 text-xs font-medium text-text focus:ring-1 focus:ring-primary/30 outline-none"
                                            >
                                                <option value="text">Text Input</option>
                                                <option value="screenshot">Screenshot</option>
                                                <option value="file">File Upload</option>
                                                <option value="verified">Auto-Verified (Social)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-muted uppercase tracking-widest">Participant Limit</label>
                                            <input
                                                type="number"
                                                value={task.participantLimit || ''}
                                                onChange={(e) => updateTask(task.id, { participantLimit: e.target.value ? parseInt(e.target.value) : null })}
                                                placeholder="No limit"
                                                min="1"
                                                className="w-full bg-bg border border-surface rounded-lg py-2 px-3 text-xs font-medium text-text placeholder-muted/50 focus:ring-1 focus:ring-primary/30 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 text-rose-500 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-rose-500/20 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" /> Delete Task
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {tasks.length === 0 && (
                <div className="p-6 text-center bg-surface/30 rounded-lg border border-dashed border-surface">
                    <p className="text-[10px] text-muted font-medium uppercase">No tasks yet. Add one to get started.</p>
                </div>
            )}
        </div>
    );
}
