import React from 'react';
import { motion } from 'framer-motion';

export default function AdminPageHeader({ title, subtitle, actions }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-lg font-semibold text-text leading-none">{title}</h1>
                {subtitle && (
                    <p className="text-muted text-[10px] font-medium uppercase tracking-wider mt-1.5">{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
