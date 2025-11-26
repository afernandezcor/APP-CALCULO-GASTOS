
import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableItemProps {
  children: React.ReactNode;
  onSwipe: () => void;
  onClick?: () => void;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({ children, onSwipe, onClick }) => {
    const [startX, setStartX] = useState<number | null>(null);
    const [offset, setOffset] = useState(0);
    const isSwiping = useRef(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.targetTouches[0].clientX);
        isSwiping.current = false;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX === null) return;
        const currentX = e.targetTouches[0].clientX;
        const diff = currentX - startX;
        
        // Only detect left swipe
        if (diff < -5) { 
            isSwiping.current = true;
            // Limit max slide to -150px
            if (diff > -150) setOffset(diff);
            else setOffset(-150);
        }
    };

    const handleTouchEnd = () => {
        if (offset < -75) {
            onSwipe();
        }
        setOffset(0);
        setStartX(null);
        // Small delay to prevent click from firing immediately after swipe release
        setTimeout(() => { isSwiping.current = false; }, 100);
    };

    return (
        <div className="relative overflow-hidden bg-white border-b border-gray-100 last:border-0 select-none rounded-lg md:rounded-none">
             {/* Background Layer (Red) */}
             <div className="absolute inset-y-0 right-0 w-full bg-red-600 flex items-center justify-end px-6">
                 <span className="text-white font-bold flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Delete
                 </span>
            </div>

            {/* Foreground Content */}
            <div
                className="relative bg-white hover:bg-gray-50 transition-colors p-4 flex items-center justify-between w-full"
                style={{ 
                    transform: `translateX(${offset}px)`, 
                    transition: startX === null ? 'transform 0.3s ease-out' : 'none' 
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={(e) => {
                    if (isSwiping.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                    if (onClick) onClick();
                }}
            >
                {children}
            </div>
        </div>
    );
};
