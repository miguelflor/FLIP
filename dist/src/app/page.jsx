"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const LoginForm_1 = __importDefault(require("../components/LoginForm"));
function Home() {
    return (<>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Playfair+Display:wght@400;600;700&display=swap');
        
        /* Angelic Title Animations */
        @keyframes gentleFloat {
          0%, 100% { 
            transform: translateY(0px);
          }
          50% { 
            transform: translateY(-8px);
          }
        }

        @keyframes softGlow {
          0%, 100% { 
            filter: drop-shadow(0 4px 15px rgba(255, 255, 255, 0.4));
          }
          50% { 
            filter: drop-shadow(0 6px 25px rgba(255, 255, 255, 0.6)) drop-shadow(0 2px 15px rgba(147, 197, 253, 0.3));
          }
        }

        @keyframes letterRise {
          0%, 100% { 
            transform: translateY(0px);
          }
          50% { 
            transform: translateY(-6px);
          }
        }

        @keyframes textShimmer {
          0% { 
            background-position: -100% center;
          }
          100% { 
            background-position: 100% center;
          }
        }

        @keyframes halo {
          0%, 100% { 
            transform: scale(0.98);
            opacity: 0.2;
          }
          50% { 
            transform: scale(1.02);
            opacity: 0.4;
          }
        }

        /* Beautiful Gradient Background */
        @keyframes backgroundShift {
          0%, 100% { 
            background-position: 0% 50%;
          }
          50% { 
            background-position: 100% 50%;
          }
        }

        @keyframes cloudFloat1 {
          0%, 100% { 
            transform: translateX(-20px) translateY(0px) scale(1);
            opacity: 0.3;
          }
          50% { 
            transform: translateX(20px) translateY(-10px) scale(1.05);
            opacity: 0.5;
          }
        }

        @keyframes cloudFloat2 {
          0%, 100% { 
            transform: translateX(30px) translateY(-5px) scale(1);
            opacity: 0.2;
          }
          50% { 
            transform: translateX(-10px) translateY(15px) scale(0.95);
            opacity: 0.4;
          }
        }

        @keyframes cloudFloat3 {
          0%, 100% { 
            transform: translateX(10px) translateY(10px) scale(1);
            opacity: 0.25;
          }
          50% { 
            transform: translateX(-25px) translateY(-5px) scale(1.08);
            opacity: 0.45;
          }
        }

        @keyframes sparkle {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes formShimmer {
          0%, 100% { 
            background-position: -100% -100%;
            opacity: 0.3;
          }
          50% { 
            background-position: 100% 100%;
            opacity: 0.6;
          }
        }
      `}</style>

      <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Beautiful Heavenly Background */}
        <div className="absolute inset-0 -z-10" style={{
            background: `
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 183, 197, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(147, 197, 253, 0.2) 0%, transparent 50%),
              linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)
            `,
            backgroundSize: '100% 100%, 100% 100%, 100% 100%, 300% 300%',
            animation: 'backgroundShift 20s ease-in-out infinite'
        }}>
          {/* Floating Cloud-like Orbs */}
          <div className="absolute w-96 h-96 rounded-full opacity-20" style={{
            top: '10%',
            left: '15%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(147,197,253,0.2) 50%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'cloudFloat1 15s ease-in-out infinite'
        }}/>
          <div className="absolute w-80 h-80 rounded-full opacity-15" style={{
            top: '60%',
            right: '10%',
            background: 'radial-gradient(circle, rgba(255,183,197,0.4) 0%, rgba(255,255,255,0.2) 50%, transparent 70%)',
            filter: 'blur(35px)',
            animation: 'cloudFloat2 18s ease-in-out infinite'
        }}/>
          <div className="absolute w-72 h-72 rounded-full opacity-25" style={{
            top: '30%',
            right: '25%',
            background: 'radial-gradient(circle, rgba(147,197,253,0.3) 0%, rgba(255,255,255,0.15) 50%, transparent 70%)',
            filter: 'blur(30px)',
            animation: 'cloudFloat3 12s ease-in-out infinite'
        }}/>

          {/* Twinkling Stars */}
          {[...Array(20)].map((_, i) => (<div key={i} className="absolute w-1 h-1 bg-white rounded-full" style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `sparkle ${3 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 3}s`,
                boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)'
            }}/>))}
        </div>

        <div className="max-w-md w-full space-y-8 z-10">
          {/* ANGELIC FLIP TITLE */}
          <div className="relative text-center">
            {/* Subtle Halo Effect */}
            <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 100% 50% at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
            animation: 'halo 4s ease-in-out infinite',
            filter: 'blur(20px)'
        }}/>

            <h1 className="relative font-light text-center select-none transition-all duration-500 hover:scale-105 text-white" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.8rem, 6vw, 3.5rem)',
            animation: 'gentleFloat 4s ease-in-out infinite, softGlow 3s ease-in-out infinite',
            letterSpacing: '0.05em',
            lineHeight: 1.2,
            textShadow: '0 2px 20px rgba(255, 255, 255, 0.5), 0 4px 40px rgba(147, 197, 253, 0.3)',
            position: 'relative',
            overflow: 'hidden'
        }}>
              {/* Text Shimmer Effect */}
              <span className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.8) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'textShimmer 3s linear infinite',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            zIndex: 1
        }}/>

              {/* Individual Letters with Gentle Animation */}
              <span className="relative z-10">
                {'Bem-vindo ao '.split('').map((char, index) => (<span key={index} className="inline-block" style={{
                animation: `letterRise 3s ease-in-out infinite ${index * 0.08}s`,
                fontWeight: char === ' ' ? 'normal' : '300'
            }}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>))}
                <br />
                {'FLIP'.split('').map((char, index) => (<span key={`flip-${index}`} className="inline-block" style={{
                fontSize: '1.3em',
                fontWeight: '600',
                animation: `letterRise 2.5s ease-in-out infinite ${index * 0.1}s`,
                textShadow: '0 2px 8px rgba(255, 255, 255, 0.3)'
            }}>
                    {char}
                  </span>))}
              </span>
            </h1>

            {/* Subtle Light Particles around text only */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (<div key={i} className="absolute w-1 h-1 bg-white rounded-full opacity-60" style={{
                top: `${25 + (i * 8)}%`,
                left: `${15 + (i * 12)}%`,
                animation: `gentleFloat ${3 + i * 0.5}s ease-in-out infinite ${i * 0.8}s`,
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
                filter: 'blur(0.5px)'
            }}/>))}
            </div>
          </div>

          <div className="relative">
            {/* Beautiful Form Background */}
            <div className="absolute inset-0 -z-10" style={{
            background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.15) 0%, 
                    rgba(255, 255, 255, 0.08) 50%, 
                    rgba(147, 197, 253, 0.12) 100%
                  )
                `,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  0 0 60px rgba(147, 197, 253, 0.15)
                `
        }}/>

            {/* Subtle shimmer on form */}
            <div className="absolute inset-0 -z-5 pointer-events-none" style={{
            background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
            animation: 'formShimmer 10s linear infinite',
            borderRadius: '20px'
        }}/>

            <LoginForm_1.default />
          </div>
        </div>
      </main>
    </>);
}
