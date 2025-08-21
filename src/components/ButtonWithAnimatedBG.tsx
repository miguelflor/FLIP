import React, { useState } from "react";

// ButtonWithAnimatedBG: Artful, conic-gradient, glowing, glassy button
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
            const timeout = setTimeout(() => setClicked(false), 500);
            return () => clearTimeout(timeout);
        }
    }, [clicked]);

    return (
        <div className="art-btn-container">
            <button
                type="submit"
                className={`art-btn${clicked ? " clicked" : ""}`}
                disabled={loading}
                onClick={handleClick}
            >
                <span>{loading ? "A entrar..." : "Entrar"}</span>
            </button>
            <style jsx global>{`
                :root {
                    --border: 0.35em;
                    --radius: 1.7em;
                }
                .art-btn-container {
                    width: 220px;
                    height: 56px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .art-btn {
                    width: 200px;
                    height: 48px;
                    padding: 0;
                    background: #000;
                    color: #fff;
                    font-family: monospace;
                    border-radius: var(--radius);
                    border: none;
                    cursor: pointer;
                    overflow: hidden;
                    animation: glow linear 2s infinite;
                    position: relative;
                    outline: none;
                    box-shadow: 0 0 18px 0 #a78bfa55, 0 0 0 0 #4094;
                    transition: box-shadow 0.3s;
                }
                .art-btn:focus {
                    box-shadow: 0 0 0 8px #60a5fa55, 0 0 24px 0 #a78bfa55;
                }
                .art-btn::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    aspect-ratio: 1/1;
                    width: 120%;
                    height: auto;
                    border-radius: 50%;
                    background: conic-gradient(#fff 0%, #60a5fa 10%, #818cf8 60%, #a78bfa 90%, #fff 100%);
                    animation: spin linear 2.5s infinite;
                    filter: blur(2px) brightness(1.2) saturate(1.2);
                    opacity: 0.7;
                    transform: translate(-50%, -50%);
                    z-index: 0;
                }
                .art-btn.clicked::before {
                    animation: spin-click 0.5s cubic-bezier(0.4,2,0.6,1) forwards;
                }
                .art-btn::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: calc(100% - var(--border));
                    height: calc(100% - var(--border));
                    background: #000c;
                    transform: translate(-50%, -50%);
                    border-radius: var(--radius);
                    backdrop-filter: blur(0.7em);
                    z-index: 1;
                }
                .art-btn span {
                    display: block;
                    width: 100%;
                    position: absolute;
                    z-index: 2;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-family: 'Geo', monospace;
                    font-size: 1.1em;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    pointer-events: none;
                    text-shadow: 0 2px 8px #a78bfa88, 0 0 2px #fff;
                }
                .art-btn.clicked span {
                    animation: pop 0.5s cubic-bezier(0.4,2,0.6,1);
                }
                @keyframes spin {
                    0% {
                        transform: translate(-50%, -50%) rotate(0deg);
                    }
                    100% {
                        transform: translate(-50%, -50%) rotate(360deg);
                    }
                }
                @keyframes spin-click {
                    0% {
                        transform: translate(-50%, -50%) rotate(0deg) scale(1);
                    }
                    80% {
                        transform: translate(-50%, -50%) rotate(720deg) scale(1.15);
                    }
                    100% {
                        transform: translate(-50%, -50%) rotate(720deg) scale(1);
                    }
                }
                @keyframes pop {
                    0% {
                        transform: translate(-50%, -50%) scale(1);
                    }
                    60% {
                        transform: translate(-50%, -50%) scale(1.18);
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
                @keyframes glow {
                    0% {
                        box-shadow: 0 0 24px 0 #a78bfa55, 0 0 0 0 #4094;
                    }
                    25% {
                        box-shadow: 0 0 32px 8px #60a5fa44, 0 0 0 0 #4094;
                    }
                    50% {
                        box-shadow: 0 0 40px 16px #818cf844, 0 0 0 0 #4094;
                    }
                    100% {
                        box-shadow: 0 0 24px 0 #a78bfa55, 0 0 0 0 #4094;
                    }
                }
            `}</style>
            {/* Geo font for artful look */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Geo&display=swap" rel="stylesheet" />
        </div>
    );
}
