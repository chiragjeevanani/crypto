import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { mockTasks } from '../data/mockTasks'
import TaskCard from '../components/tasks/TaskCard'
import TaskDetail from '../components/tasks/TaskDetail'

const FILTERS = ['All', 'Active', 'Joined']

export default function TasksPage() {
    const [activeFilter, setActiveFilter] = useState('All')
    const [selectedTask, setSelectedTask] = useState(null)

    const filtered = mockTasks.filter((t) => {
        if (activeFilter === 'Joined') return t.joined
        return true
    })

    return (
        <div className="px-4 pt-4">
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--color-text)' }}>Earn</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    Complete tasks, get paid
                </p>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
                {FILTERS.map((f) => {
                    const active = f === activeFilter
                    return (
                        <motion.button
                            key={f}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setActiveFilter(f)}
                            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-all duration-150"
                            style={{
                                background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                                color: active ? '#fff' : 'var(--color-muted)',
                                border: active ? 'none' : '1px solid var(--color-border)',
                            }}
                        >
                            {f}
                        </motion.button>
                    )
                })}
            </div>

            {/* Task list */}
            <div>
                {filtered.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                ))}
                {filtered.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No tasks found</p>
                    </div>
                )}
            </div>

            {/* Task detail bottom sheet */}
            <AnimatePresence>
                {selectedTask && (
                    <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
                )}
            </AnimatePresence>
        </div>
    )
}
