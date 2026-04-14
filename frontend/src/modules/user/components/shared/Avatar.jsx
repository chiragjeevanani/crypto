import { Check } from 'lucide-react';
import { optimizeCloudinaryUrl } from '../../../../utils/mediaOptimization';

export const NO_IMAGE_AVATAR = '/person.png';

export default function Avatar({ src, alt = 'user', className = '', size = 'md', isPremium = false, ...props }) {
    const sizeClasses = {
        'xs': 'w-6 h-6',
        'sm': 'w-8 h-8',
        'md': 'w-10 h-10',
        'lg': 'w-14 h-14',
        'xl': 'w-20 h-20',
        '2xl': 'w-32 h-32'
    };

    const handleError = (e) => {
        e.target.src = NO_IMAGE_AVATAR;
        e.target.classList.add('opacity-60');
    };

    return (
        <div className={`relative flex-shrink-0 ${className}`}>
            <div className={`${sizeClasses[size] || size} rounded-full overflow-hidden bg-surface2/30`}>
                <img 
                    src={optimizeCloudinaryUrl(src || NO_IMAGE_AVATAR, { width: 200, quality: '80' })} 
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-200 ${!src ? 'opacity-60' : ''}`}
                    onError={handleError}
                    {...props}
                />
            </div>
            {isPremium && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-orange-500 rounded-full flex items-center justify-center p-0.5 shadow-sm border border-surface z-10 animate-in fade-in zoom-in duration-300">
                    <Check size={size === 'xs' ? 6 : size === 'sm' ? 7 : 8} className="text-white" strokeWidth={5} />
                </div>
            )}
        </div>
    );
}
