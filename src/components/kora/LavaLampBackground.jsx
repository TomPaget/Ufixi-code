export default function LavaLampBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "#FDF6EE" }}
    >
      <style>{`
        @keyframes blob1 {
          0%   { transform: translate(5vw, 5vh) scale(1); }
          20%  { transform: translate(70vw, 30vh) scale(1.15); }
          40%  { transform: translate(40vw, 75vh) scale(0.9); }
          60%  { transform: translate(80vw, 85vh) scale(1.1); }
          80%  { transform: translate(15vw, 55vh) scale(0.88); }
          100% { transform: translate(5vw, 5vh) scale(1); }
        }
        @keyframes blob2 {
          0%   { transform: translate(75vw, 5vh) scale(1); }
          20%  { transform: translate(10vw, 45vh) scale(0.88); }
          40%  { transform: translate(85vw, 70vh) scale(1.12); }
          60%  { transform: translate(30vw, 90vh) scale(0.95); }
          80%  { transform: translate(60vw, 20vh) scale(1.08); }
          100% { transform: translate(75vw, 5vh) scale(1); }
        }
        @keyframes blob3 {
          0%   { transform: translate(40vw, 80vh) scale(1); }
          20%  { transform: translate(80vw, 10vh) scale(1.1); }
          40%  { transform: translate(5vw, 30vh) scale(0.85); }
          60%  { transform: translate(55vw, 60vh) scale(1.15); }
          80%  { transform: translate(20vw, 90vh) scale(0.9); }
          100% { transform: translate(40vw, 80vh) scale(1); }
        }
        @keyframes blob4 {
          0%   { transform: translate(60vw, 50vh) scale(1); }
          25%  { transform: translate(5vw, 85vh) scale(1.1); }
          50%  { transform: translate(75vw, 15vh) scale(0.88); }
          75%  { transform: translate(35vw, 40vh) scale(1.05); }
          100% { transform: translate(60vw, 50vh) scale(1); }
        }
      `}</style>

      {/* Orange */}
      <div style={{
        position: 'absolute', width: 600, height: 600, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(232,83,10,0.28) 0%, rgba(232,83,10,0.08) 55%, transparent 100%)",
        filter: "blur(70px)",
        animation: "blob1 14s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
      {/* Pink/Red */}
      <div style={{
        position: 'absolute', width: 520, height: 520, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(217,56,112,0.22) 0%, rgba(217,56,112,0.06) 55%, transparent 100%)",
        filter: "blur(65px)",
        animation: "blob2 17s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
      {/* Amber */}
      <div style={{
        position: 'absolute', width: 540, height: 540, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(240,144,10,0.25) 0%, rgba(240,144,10,0.07) 55%, transparent 100%)",
        filter: "blur(60px)",
        animation: "blob3 13s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
      {/* Warm peach */}
      <div style={{
        position: 'absolute', width: 460, height: 460, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(255,180,80,0.18) 0%, rgba(255,140,40,0.05) 55%, transparent 100%)",
        filter: "blur(55px)",
        animation: "blob4 16s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
    </div>
  );
}