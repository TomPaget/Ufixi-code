export default function LavaLampBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #fdf6ff 0%, #fff5f0 50%, #fef0fa 100%)" }}
    >
      <style>{`
        @keyframes blob1 {
          0%   { transform: translate(10vw, 15vh) scale(1); }
          33%  { transform: translate(45vw, 35vh) scale(1.1); }
          66%  { transform: translate(25vw, 60vh) scale(0.92); }
          100% { transform: translate(10vw, 15vh) scale(1); }
        }
        @keyframes blob2 {
          0%   { transform: translate(60vw, 10vh) scale(1); }
          33%  { transform: translate(20vw, 40vh) scale(0.9); }
          66%  { transform: translate(70vw, 55vh) scale(1.08); }
          100% { transform: translate(60vw, 10vh) scale(1); }
        }
        @keyframes blob3 {
          0%   { transform: translate(30vw, 50vh) scale(1); }
          33%  { transform: translate(65vw, 20vh) scale(1.12); }
          66%  { transform: translate(15vw, 30vh) scale(0.88); }
          100% { transform: translate(30vw, 50vh) scale(1); }
        }
        @keyframes blob4 {
          0%   { transform: translate(75vw, 60vh) scale(1); }
          33%  { transform: translate(40vw, 70vh) scale(0.95); }
          66%  { transform: translate(55vw, 25vh) scale(1.05); }
          100% { transform: translate(75vw, 60vh) scale(1); }
        }
        @keyframes blob5 {
          0%   { transform: translate(50vw, 70vh) scale(1); }
          33%  { transform: translate(80vw, 40vh) scale(1.08); }
          66%  { transform: translate(35vw, 15vh) scale(0.93); }
          100% { transform: translate(50vw, 70vh) scale(1); }
        }
      `}</style>

      {/* Purple */}
      <div style={{
        position: 'absolute', width: 600, height: 600, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(124,111,224,0.52) 0%, rgba(124,111,224,0.16) 55%, transparent 100%)",
        filter: "blur(60px)",
        animation: "blob1 22s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
      {/* Soft pink — toned down */}
      <div style={{
        position: 'absolute', width: 520, height: 520, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(226,100,171,0.30) 0%, rgba(226,100,171,0.08) 55%, transparent 100%)",
        filter: "blur(55px)",
        animation: "blob2 28s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
      {/* Sunset orange — boosted */}
      <div style={{
        position: 'absolute', width: 580, height: 580, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(255,110,50,0.55) 0%, rgba(255,140,30,0.18) 55%, transparent 100%)",
        filter: "blur(65px)",
        animation: "blob3 32s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
      {/* Warm yellow-amber */}
      <div style={{
        position: 'absolute', width: 460, height: 460, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(255,200,50,0.40) 0%, rgba(255,180,20,0.12) 55%, transparent 100%)",
        filter: "blur(52px)",
        animation: "blob4 25s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
      {/* Orange-gold */}
      <div style={{
        position: 'absolute', width: 500, height: 500, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(255,150,40,0.38) 0%, rgba(255,120,20,0.10) 55%, transparent 100%)",
        filter: "blur(58px)",
        animation: "blob5 35s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
    </div>
  );
}