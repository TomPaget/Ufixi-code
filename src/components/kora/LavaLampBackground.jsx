import { useEffect, useRef } from "react";

export default function LavaLampBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const blobs = containerRef.current?.querySelectorAll(".blob");
    if (!blobs) return;

    const animations = [];

    blobs.forEach((blob, i) => {
      // Each blob has its own position, velocity, scale, and phase for organic pulsing
      let x = 10 + Math.random() * 60;
      let y = 10 + Math.random() * 60;
      let vx = (Math.random() - 0.5) * 0.22;
      let vy = (Math.random() - 0.5) * 0.22;
      let scale = 1;
      let scaleDir = 1;
      let scaleSpeed = 0.0008 + Math.random() * 0.0012;
      let wobbleAngle = Math.random() * Math.PI * 2;
      let wobbleSpeed = 0.008 + Math.random() * 0.01;
      let borderRadiusPhase = Math.random() * Math.PI * 2;

      const animate = () => {
        x += vx;
        y += vy;

        // Add gentle sinusoidal wobble to velocity for fluid, organic movement
        wobbleAngle += wobbleSpeed;
        vx += Math.sin(wobbleAngle) * 0.008;
        vy += Math.cos(wobbleAngle * 0.7) * 0.008;

        // Dampen velocity to prevent runaway acceleration
        const speed = Math.sqrt(vx * vx + vy * vy);
        const maxSpeed = 0.38;
        if (speed > maxSpeed) {
          vx = (vx / speed) * maxSpeed;
          vy = (vy / speed) * maxSpeed;
        }

        // Bounce off edges softly
        if (x < -5) { vx = Math.abs(vx); }
        if (x > 80) { vx = -Math.abs(vx); }
        if (y < -5) { vy = Math.abs(vy); }
        if (y > 80) { vy = -Math.abs(vy); }

        // Pulse scale for breathing/lava lamp effect
        scale += scaleDir * scaleSpeed;
        if (scale > 1.25) scaleDir = -1;
        if (scale < 0.78) scaleDir = 1;

        // Morph border radius for liquid blob shape
        borderRadiusPhase += 0.012;
        const r1 = 40 + Math.sin(borderRadiusPhase) * 15;
        const r2 = 40 + Math.cos(borderRadiusPhase * 0.8) * 18;
        const r3 = 40 + Math.sin(borderRadiusPhase * 1.3) * 12;
        const r4 = 40 + Math.cos(borderRadiusPhase * 0.6) * 20;

        blob.style.transform = `translate(${x}vw, ${y}vh) scale(${scale})`;
        blob.style.borderRadius = `${r1}% ${100 - r1}% ${r3}% ${100 - r3}% / ${r2}% ${r4}% ${100 - r4}% ${100 - r2}%`;

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
      <div className="blob absolute w-[680px] h-[680px]"
        style={{ background: "radial-gradient(circle, rgba(124,111,224,0.62) 0%, rgba(124,111,224,0.22) 55%, transparent 100%)", filter: "blur(72px)", top: 0, left: 0 }} />
      {/* Coral pink blob */}
      <div className="blob absolute w-[560px] h-[560px]"
        style={{ background: "radial-gradient(circle, rgba(226,100,171,0.58) 0%, rgba(226,100,171,0.18) 55%, transparent 100%)", filter: "blur(62px)", top: 0, left: 0 }} />
      {/* Sunset orange blob */}
      <div className="blob absolute w-[620px] h-[620px]"
        style={{ background: "radial-gradient(circle, rgba(255,110,50,0.52) 0%, rgba(255,110,50,0.15) 55%, transparent 100%)", filter: "blur(78px)", top: 0, left: 0 }} />
      {/* Deep purple blob */}
      <div className="blob absolute w-[480px] h-[480px]"
        style={{ background: "radial-gradient(circle, rgba(150,100,240,0.55) 0%, rgba(150,100,240,0.15) 55%, transparent 100%)", filter: "blur(58px)", top: 0, left: 0 }} />
      {/* Warm pink-orange blob */}
      <div className="blob absolute w-[520px] h-[520px]"
        style={{ background: "radial-gradient(circle, rgba(255,80,120,0.48) 0%, rgba(255,80,120,0.12) 55%, transparent 100%)", filter: "blur(68px)", top: 0, left: 0 }} />
    </div>
  );
}