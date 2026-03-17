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
      style={{ background: "#F5F4FF" }}
    >
      {/* Blobs */}
      <div className="blob absolute w-[420px] h-[420px] rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, #c4bcf5 0%, #7C6FE0 60%, transparent 100%)", filter: "blur(70px)", top: 0, left: 0 }} />
      <div className="blob absolute w-[320px] h-[320px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #f0c0e0 0%, #E264AB 60%, transparent 100%)", filter: "blur(60px)", top: 0, left: 0 }} />
      <div className="blob absolute w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #d8d4f8 0%, #7C6FE0 50%, transparent 100%)", filter: "blur(90px)", top: 0, left: 0 }} />
      <div className="blob absolute w-[280px] h-[280px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #ffe8c0 0%, #FF6E32 60%, transparent 100%)", filter: "blur(55px)", top: 0, left: 0 }} />
      <div className="blob absolute w-[360px] h-[360px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #c8c4f4 0%, #7C6FE0 55%, transparent 100%)", filter: "blur(75px)", top: 0, left: 0 }} />
    </div>
  );
}