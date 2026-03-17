import { useEffect, useRef } from "react";

export default function LavaLampBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const blobs = containerRef.current?.querySelectorAll(".blob");
    if (!blobs) return;

    const animations = [];
    blobs.forEach((blob, i) => {
      let x = Math.random() * 75;
      let y = Math.random() * 75;
      let vx = (Math.random() - 0.5) * 0.12;
      let vy = (Math.random() - 0.5) * 0.12;

      const animate = () => {
        x += vx;
        y += vy;
        if (x < 0 || x > 75) vx *= -1;
        if (y < 0 || y > 75) vy *= -1;
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
      style={{ background: "linear-gradient(135deg, #fdf6ff 0%, #fff5f0 50%, #fef0fa 100%)" }}
    >
      {/* Iris purple blob */}
      <div className="blob absolute w-[480px] h-[480px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,111,224,0.55) 0%, rgba(124,111,224,0.15) 60%, transparent 100%)", filter: "blur(65px)", top: 0, left: 0 }} />
      {/* Coral pink blob */}
      <div className="blob absolute w-[380px] h-[380px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(226,100,171,0.5) 0%, rgba(226,100,171,0.12) 60%, transparent 100%)", filter: "blur(55px)", top: 0, left: 0 }} />
      {/* Sunset orange blob */}
      <div className="blob absolute w-[420px] h-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,110,50,0.45) 0%, rgba(255,110,50,0.1) 60%, transparent 100%)", filter: "blur(70px)", top: 0, left: 0 }} />
      {/* Deep purple blob */}
      <div className="blob absolute w-[300px] h-[300px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(150,100,240,0.5) 0%, rgba(150,100,240,0.1) 60%, transparent 100%)", filter: "blur(50px)", top: 0, left: 0 }} />
      {/* Warm pink-orange blob */}
      <div className="blob absolute w-[350px] h-[350px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,80,120,0.4) 0%, rgba(255,80,120,0.08) 60%, transparent 100%)", filter: "blur(60px)", top: 0, left: 0 }} />
    </div>
  );
}