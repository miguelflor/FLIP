import {CheckCircle, XCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
interface NotificationProps {
    type: 'success' | 'error';
    message: string;
    onClose: () => void;
}

export default function Notification({ type, message, onClose }: NotificationProps) {
    const [progress, setProgress] = useState(100);
    const [isVisible, setIsVisible] = useState(true);
    const duration = 2000; // 2 seconds

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            // Wait for fade-out animation to complete before calling onClose
            setTimeout(() => {
                onClose();
            }, 300); // Match the transition duration
        }, duration);

        // Update progress bar every 50ms for smooth animation
        const interval = setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev - (100 / (duration / 50));
                return newProgress <= 0 ? 0 : newProgress;
            });
        }, 50);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    return (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full shadow-lg rounded-lg overflow-hidden transform transition-all duration-300 ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } ${
            type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
            <div className="p-4 flex items-center gap-3">
                {type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
                <span className="flex-1 text-sm font-medium">{message}</span>
                <button
                    onClick={handleClose}
                    className={`flex-shrink-0 p-1 rounded-full transition-colors ${
                        type === 'success' 
                            ? 'hover:bg-green-100 text-green-600 hover:text-green-700' 
                            : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                    }`}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            {/* Progress bar */}
            <div className={`h-1 w-full ${
                type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
                <div 
                    className={`h-full transition-all duration-75 ease-linear ${
                        type === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
