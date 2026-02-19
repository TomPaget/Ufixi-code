import { useEffect, useRef } from "react";

export default function LavaLampBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const blobs = containerRef.current?.querySelectorAll(".blob");
    if (!blobs) return;

    const animations = [];
    blobs.forEach((blob, i) => {
      let x = Math.random() * 80;
      let y = Math.random() * 80;
      let vx = (Math.random() - 0.5) * 0.15;
      let vy = (Math.random() - 0.5) * 0.15;

      const animate = () => {
        x += vx;
        y += vy;
        if (x < 0 || x > 80) vx *= -1;
        if (y < 0 || y > 80) vy *= -1;
        blob.style.transform = `translate(${x}vw, ${y}vh)`;
        animations[i] = requestAnimationFrame(animate);
      };

      blob.style.transform = `translate(${x}vw, ${y}vh)`;
      animations[i] = requestAnimationFrame(animate);
    });

    return () => animations.forEach(id => cancelAnimationFrame(id));
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* Blobs */}
      <div className="blob absolute w-[420px] h-[420px] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, #b8e8d4 0%, #6ECBA6 60%, transparent 100%)", filter: "blur(60px)", top: 0, left: 0 }} />
      <div className="blob absolute w-[320px] h-[320px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #c8edd8 0%, #6ECBA6 60%, transparent 100%)", filter: "blur(50px)", top: 0, left: 0 }} />
      <div className="blob absolute w-[500px] h-[500px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #d4f0e6 0%, #6ECBA6 50%, transparent 100%)", filter: "blur(80px)", top: 0, left: 0 }} />
      <div className="blob absolute w-[280px] h-[280px] rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, #e0f5ec 0%, #4faf8a 60%, transparent 100%)", filter: "blur(45px)", top: 0, left: 0 }} />
      <div className="blob absolute w-[360px] h-[360px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #c0e8d4 0%, #6ECBA6 55%, transparent 100%)", filter: "blur(65px)", top: 0, left: 0 }} />
    </div>
  );
}