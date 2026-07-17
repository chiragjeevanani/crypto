import React, { useRef, useEffect, useState } from 'react';

const LazyVideo = ({ src, poster, className, style, autoPlay = true, loop = true, playsInline = true, muted = true, controls = false }) => {
    const videoRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (autoPlay && videoRef.current) {
                        videoRef.current.play().catch(e => console.log('Autoplay prevented', e));
                    }
                } else {
                    setIsVisible(false);
                    if (videoRef.current) {
                        videoRef.current.pause();
                    }
                }
            },
            {
                rootMargin: '200px', // Pre-load slightly before it enters viewport
                threshold: 0.1
            }
        );

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current);
            }
        };
    }, [autoPlay]);

    return (
        <video
            ref={videoRef}
            src={isVisible ? src : ""}
            poster={poster}
            className={className}
            style={style}
            autoPlay={isVisible && autoPlay}
            loop={loop}
            playsInline={playsInline}
            muted={muted}
            controls={controls}
            preload="none"
        />
    );
};

export default LazyVideo;
