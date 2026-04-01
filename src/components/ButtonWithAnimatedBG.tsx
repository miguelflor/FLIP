import React, { useState } from "react";
// ButtonWithAnimatedBG: Angelic, heavenly, elegant button
export default function ButtonWithAnimatedBG({ loading }: { loading: boolean }) {
    const [clicked, setClicked] = useState(false);

    const handleClick = () => {
        if (!loading) {
            setClicked(true);
        }
    };

    // Remove clicked state after animation
    React.useEffect(() => {
        if (clicked) {
            const timeout = setTimeout(() => setClicked(false), 600);
            return () => clearTimeout(timeout);
        }
    }, [clicked]);

    return (
        <div className="angelic-btn-container">
            <button
                type="submit"
                className={`angelic-btn${clicked ? " clicked" : ""}${loading ? " loading" : ""}`}
                disabled={loading}
                onClick={handleClick}
            >
                {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                        <div className="loading-animation" style={{ left: "50%", transform: "translate(-50%, -50%)" }}>
                            <div className="orb orb-1"></div>
                            <div className="orb orb-2"></div>
                            <div className="orb orb-3"></div>
                        </div>
                    </span>
                ) : (
                    <span>
                        <span className="text fade-in">Entrar</span>
                    </span>
                )}
            </button>
            <style jsx global>{`
                .angelic-btn-container {
                    width: 220px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                
                .angelic-btn {
                    width: 200px;
                    height: 52px;
                    padding: 0;
                    background: rgba(255, 255, 255, 0.08);
                    color: #fff;
                    font-family: 'Playfair Display', serif;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    cursor: pointer;
                    overflow: hidden;
                    position: relative;
                    outline: none;
                    backdrop-filter: blur(20px);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3),
                        0 0 40px rgba(255, 255, 255, 0.15);
                }
                
                .angelic-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 
                        0 12px 40px rgba(0, 0, 0, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.4),
                        0 0 60px rgba(255, 255, 255, 0.25);
                    background: rgba(255, 255, 255, 0.12);
                    border-color: rgba(255, 255, 255, 0.3);
                }
                
                .angelic-btn:disabled {
                    opacity: 1;
                    cursor: not-allowed;
                    background: rgba(255, 255, 255, 0.06);
                }

                .angelic-btn.loading::before {
                    animation: heavenlyGlow 3s linear infinite;
                    opacity: 1;
                    filter: blur(6px);
                }

                /* Loading Animation - Floating Orbs */
                .loading-animation {
                    position: absolute;
                    left: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    display: flex;
                    gap: 4px;
                    z-index: 3;
                }

                .orb {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(147,197,253,0.6) 100%);
                    box-shadow: 
                        0 0 10px rgba(255, 255, 255, 0.8),
                        0 0 20px rgba(147, 197, 253, 0.4);
                    animation: angelicFloat 2s ease-in-out infinite;
                }

                .orb-1 {
                    animation-delay: 0s;
                }

                .orb-2 {
                    animation-delay: 0.3s;
                }

                .orb-3 {
                    animation-delay: 0.6s;
                }

                .text {
                    transition: opacity 0.4s ease, transform 0.4s ease;
                }

                .text.fade-out {
                    opacity: 0.8;
                    transform: translateX(15px);
                }

                .text.fade-in {
                    opacity: 1;
                    transform: translateX(0);
                }

                /* Gentle rotating halo */
                .angelic-btn::before {
                    content: '';
                    position: absolute;
                    top: -4px;
                    left: -4px;
                    right: -4px;
                    bottom: -4px;
                    border-radius: 20px;
                    background: linear-gradient(45deg, 
                        rgba(255, 255, 255, 0.3) 0%, 
                        rgba(147, 197, 253, 0.4) 25%,
                        rgba(255, 183, 197, 0.4) 50%,
                        rgba(196, 181, 253, 0.4) 75%,
                        rgba(255, 255, 255, 0.3) 100%);
                    animation: heavenlyGlow 8s linear infinite;
                    opacity: 0.6;
                    z-index: -1;
                    filter: blur(4px);
                }
                
                .angelic-btn:hover::before {
                    opacity: 0.8;
                    animation-duration: 4s;
                }

                .angelic-btn.clicked::before {
                    animation: heavenlyPulse 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* Soft inner glow */
                .angelic-btn::after {
                    content: '';
                    position: absolute;
                    inset: 2px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, 
                        rgba(255, 255, 255, 0.1) 0%, 
                        rgba(255, 255, 255, 0.05) 50%,
                        rgba(147, 197, 253, 0.08) 100%);
                    z-index: 0;
                    opacity: 0.8;
                }
                
                .angelic-btn span {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    z-index: 2;
                    font-weight: 600;
                    font-size: 1.1em;
                    letter-spacing: 0.5px;
                    text-shadow: 
                        0 2px 10px rgba(255, 255, 255, 0.3),
                        0 1px 3px rgba(0, 0, 0, 0.2);
                    transition: all 0.3s ease;
                }

                .angelic-btn:disabled span {
                    opacity: 0.9;
                }
                
                .angelic-btn:hover span {
                    text-shadow: 
                        0 3px 15px rgba(255, 255, 255, 0.5),
                        0 1px 5px rgba(0, 0, 0, 0.1);
                    transform: scale(1.02);
                }
                
                .angelic-btn.clicked span {
                    animation: angelicPop 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* Heavenly shimmer effect */
                .angelic-btn:not(:disabled)::after {
                    background: 
                        linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%),
                        linear-gradient(135deg, 
                            rgba(255, 255, 255, 0.1) 0%, 
                            rgba(255, 255, 255, 0.05) 50%,
                            rgba(147, 197, 253, 0.08) 100%);
                    background-size: 200% 100%, 100% 100%;
                    animation: angelicShimmer 6s linear infinite;
                }

                @keyframes heavenlyGlow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes heavenlyPulse {
                    0% { 
                        transform: rotate(0deg) scale(1);
                        opacity: 0.6;
                    }
                    50% { 
                        transform: rotate(180deg) scale(1.1);
                        opacity: 1;
                    }
                    100% { 
                        transform: rotate(360deg) scale(1);
                        opacity: 0.6;
                    }
                }

                @keyframes angelicPop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }

                @keyframes angelicFloat {
                    0%, 100% { 
                        transform: translateY(0px);
                        opacity: 0.6;
                        filter: blur(0px);
                    }
                    50% { 
                        transform: translateY(-12px);
                        opacity: 1;
                        filter: blur(0.5px);
                    }
                }

                @keyframes angelicShimmer {
                    0% { background-position: -100% center, center; }
                    100% { background-position: 100% center, center; }
                }
            `}</style>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet" />
        </div>
    );
}
