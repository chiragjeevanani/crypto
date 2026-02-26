import React from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck,
    Image as ImageIcon,
    ExternalLink,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
    Hash,
    MoreHorizontal
} from 'lucide-react';
import { AdminPageHeader } from '../components/shared';

const pendingNfts = [
    {
        id: 'NFT-901',
        name: 'CyberPunk #442',
        creator: 'PixelArtist',
        collection: 'CyberVibe',
        originalityScore: '98%',
        status: 'Reviewing',
        image: 'https://images.unsplash.com/photo-1620712943543-bcc4628c6bb5?w=500&h=500&fit=crop'
    },
    {
        id: 'NFT-902',
        name: 'Neon Skater',
        creator: 'StreetArt_X',
        collection: 'UrbanLegends',
        originalityScore: '42%',
        status: 'Alert',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&h=500&fit=crop'
    }
];

export default function NFTModeration() {
    return (
        <div className="space-y-10 pb-20">
            <AdminPageHeader
                title="NFT Moderation"
                subtitle="Verify digital assets, originality score, and collection authenticity metrics."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pendingNfts.map((nft, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={nft.id}
                        className="bg-surface border border-surface rounded-lg overflow-hidden group hover:border-primary/20 transition-all shadow-sm"
                    >
                        <div className="flex flex-col sm:flex-row h-full">
                            <div className="sm:w-2/5 aspect-square sm:aspect-auto relative bg-bg">
                                <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                                {nft.status === 'Alert' && (
                                    <div className="absolute top-3 left-3 p-1.5 bg-rose-500 text-white rounded-md shadow-lg animate-pulse">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                    </div>
                                )}
                            </div>
                            <div className="p-5 sm:w-3/5 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[9px] font-semibold text-primary uppercase tracking-wider mb-0.5">{nft.collection}</p>
                                            <h3 className="text-sm font-semibold text-text truncate max-w-[150px]">{nft.name}</h3>
                                        </div>
                                        <span className="text-[9px] font-mono text-muted uppercase">{nft.id}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="p-2.5 bg-bg rounded-lg border border-surface">
                                            <p className="text-[9px] text-muted mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider">
                                                <Hash className="w-2.5 h-2.5" /> Originality
                                            </p>
                                            <p className={`text-base font-semibold ${parseFloat(nft.originalityScore) > 80 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {nft.originalityScore}
                                            </p>
                                        </div>
                                        <div className="p-2.5 bg-bg rounded-lg border border-surface">
                                            <p className="text-[9px] text-muted mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider">
                                                <Clock className="w-2.5 h-2.5" /> Age
                                            </p>
                                            <p className="text-base font-semibold text-text">14m</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button className="flex-1 py-2 bg-emerald-500 text-black rounded-lg font-semibold text-[10px] uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                    </button>
                                    <button className="flex-1 py-2 bg-surface2 text-rose-500 rounded-lg font-semibold text-[10px] uppercase tracking-wider hover:bg-rose-500/5 transition-all flex items-center justify-center gap-1.5 border border-surface">
                                        <XCircle className="w-3.5 h-3.5" /> Reject
                                    </button>
                                    <button className="p-2 bg-surface2 rounded-lg text-muted hover:text-text border border-surface transition-all">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-surface/50 border border-dashed border-surface rounded-lg p-10 text-center">
                <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                    <ShieldCheck className="w-8 h-8 text-muted/30" />
                    <p className="text-xs font-medium italic text-muted leading-relaxed">"Assets undergo multi-layer metadata uniqueness validation to ensure platform authenticity and IP compliance."</p>
                    <button className="text-[10px] font-semibold text-primary hover:text-primary/80 uppercase tracking-wider mt-2">Protocol Settings</button>
                </div>
            </div>
        </div>
    );
}
