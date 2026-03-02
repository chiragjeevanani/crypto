import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function TransparencyPortal() {
    return (
        <div className="space-y-10 pb-20">
            <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold">Public Transparency &amp; Audit</h1>
                <p className="text-base text-muted">
                    Open access to campaign results, voting statistics and audit logs so that everyone can verify
                    the integrity of our platform.
                </p>
                <nav className="flex gap-4">
                    <Link to="winners" className="text-primary underline">Winner announcements</Link>
                    <Link to="voting" className="text-primary underline">Voting statistics</Link>
                    <Link to="logs" className="text-primary underline">Audit logs</Link>
                </nav>
            </div>

            {/* render nested pages */}
            <Outlet />
        </div>
    );
}