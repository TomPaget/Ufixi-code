export default function LavaLampBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #fdf6ff 0%, #fff5f0 50%, #fef0fa 100%)" }}
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
        @keyframes blob5 {
          0%   { transform: translate(20vw, 20vh) scale(1); }
          25%  { transform: translate(85vw, 75vh) scale(1.12); }
          50%  { transform: translate(50vw, 95vh) scale(0.9); }
          75%  { transform: translate(10vw, 60vh) scale(1.08); }
          100% { transform: translate(20vw, 20vh) scale(1); }
        }
      `}</style>

      {/* Purple */}
      <div style={{
        position: 'absolute', width: 600, height: 600, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(124,111,224,0.52) 0%, rgba(124,111,224,0.16) 55%, transparent 100%)",
        filter: "blur(60px)",
        animation: "blob1 8s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
      {/* Soft pink — toned down */}
      <div style={{
        position: 'absolute', width: 520, height: 520, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(226,100,171,0.30) 0%, rgba(226,100,171,0.08) 55%, transparent 100%)",
        filter: "blur(55px)",
        animation: "blob2 10s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
      {/* Sunset orange — boosted */}
      <div style={{
        position: 'absolute', width: 580, height: 580, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(255,110,50,0.55) 0%, rgba(255,140,30,0.18) 55%, transparent 100%)",
        filter: "blur(65px)",
        animation: "blob3 9s ease-in-out infinite",
        willChange: "transform",
        borderRadius: '50%',
      }} />
      {/* Warm yellow-amber */}
      <div style={{
        position: 'absolute', width: 460, height: 460, top: 0, left: 0,
        background: "radial-gradient(circle, rgba(255,200,50,0.40) 0%, rgba(255,180,20,0.12) 55%, transparent 100%)",
        filter: "blur(52px)",
        animation: "blob4 11s ease-in-out infinite",
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