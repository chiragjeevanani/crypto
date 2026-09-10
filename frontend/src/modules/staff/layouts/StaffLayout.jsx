import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';
import StaffTopbar from '../components/StaffTopbar';
import { motion, AnimatePresence } from 'framer-motion';

export default function StaffLayout() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-bg text-text selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
            {/* Mobile sidebar overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 lg:relative lg:block transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <StaffSidebar
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    closeMobile={() => setIsMobileMenuOpen(false)}
                />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                <StaffTopbar
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 hide-scrollbar">
                    <div className="max-w-[1500px] mx-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={window.location.pathname}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
}
