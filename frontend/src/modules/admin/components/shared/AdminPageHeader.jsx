import React from 'react';
import { motion } from 'framer-motion';
import { simplifyAdminCopy } from '../../utils/simplifyCopy';

export default function AdminPageHeader({ title, subtitle, actions }) {
    const simpleTitle = simplifyAdminCopy(title);
    const simpleSubtitle = simplifyAdminCopy(subtitle);

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-lg font-semibold text-text leading-none">{simpleTitle}</h1>
                {simpleSubtitle && (
                    <p className="text-muted text-[10px] font-medium uppercase tracking-wider mt-1.5">{simpleSubtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
