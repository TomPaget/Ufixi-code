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
      style={style}
    >
      {/* Breathing ring 1 */}
      <span
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          animation: 'breathe1 2.8s ease-in-out infinite',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '50%',
        }}
      />
      {/* Breathing ring 2 - offset phase */}
      <span
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '-10px',
          animation: 'breathe2 2.8s ease-in-out infinite',
          border: '2px solid rgba(255,255,255,0.25)',
          borderRadius: '50%',
        }}
      />
      {/* Breathing ring 3 - further out */}
      <span
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '-22px',
          animation: 'breathe3 2.8s ease-in-out infinite',
          border: '2px solid rgba(255,255,255,0.12)',
          borderRadius: '50%',
        }}
      />
      <style>{`
        @keyframes breathe1 {
          0%, 100% { transform: scale(0.92); opacity: 0.6; }
          50% { transform: scale(1.04); opacity: 1; }
        }
        @keyframes breathe2 {
          0%, 100% { transform: scale(0.88); opacity: 0.2; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes breathe3 {
          0%, 100% { transform: scale(0.85); opacity: 0.1; }
          50% { transform: scale(1.12); opacity: 0.4; }
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