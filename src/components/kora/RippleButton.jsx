import { useState } from "react";
import { cn } from "@/lib/utils";

export default function RippleButton({ onClick, children, className, style, disabled }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (disabled) return;
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, size, id }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 700);

    if (onClick) onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn("relative overflow-hidden select-none", className)}
      style={{ ...style, animation: 'breatheShadow 2.8s ease-in-out infinite' }}
    >
      {/* Breathing ring 1 - inner glow */}
      <span
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          animation: 'breathe1 3.2s ease-in-out infinite',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
        }}
      />
      {/* Breathing ring 2 */}
      <span
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '-8px',
          animation: 'breathe2 3.2s ease-in-out infinite',
          border: '1.5px solid rgba(255,255,255,0.2)',
          borderRadius: '50%',
        }}
      />
      {/* Breathing ring 3 */}
      <span
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '-16px',
          animation: 'breathe3 3.2s ease-in-out infinite',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '50%',
        }}
      />
      {/* Wave 1 - slow expanding */}
      <span
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: 0,
          borderRadius: '50%',
          background: 'rgba(75,200,150,0.18)',
          animation: 'wave1 3.2s ease-out infinite',
        }}
      />
      {/* Wave 2 - offset */}
      <span
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: 0,
          borderRadius: '50%',
          background: 'rgba(75,200,150,0.12)',
          animation: 'wave1 3.2s ease-out infinite 1.6s',
        }}
      />
      <style>{`
        @keyframes breathe1 {
          0%, 100% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.02); opacity: 1; }
        }
        @keyframes breathe2 {
          0%, 100% { transform: scale(0.93); opacity: 0.25; }
          50% { transform: scale(1.04); opacity: 0.65; }
        }
        @keyframes breathe3 {
          0%, 100% { transform: scale(0.91); opacity: 0.1; }
          50% { transform: scale(1.06); opacity: 0.35; }
        }
        @keyframes breatheShadow {
          0%, 100% { box-shadow: 0 0 0 14px rgba(75,200,150,0.1), 0 0 0 26px rgba(75,200,150,0.05), 0 8px 40px rgba(75,200,150,0.35); }
          50% { box-shadow: 0 0 0 20px rgba(75,200,150,0.15), 0 0 0 36px rgba(75,200,150,0.07), 0 10px 50px rgba(75,200,150,0.5); }
        }
        @keyframes wave1 {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="animate-ripple absolute rounded-full bg-white/40 pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
      {children}
    </button>
  );
}