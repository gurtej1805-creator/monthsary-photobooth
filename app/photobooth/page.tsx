"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Completely upgraded to 90s/Vintage aesthetics
const FILTERS = [
  { name: "Normal", filter: "" },
  { name: "90s Disposable", filter: "sepia(30%) contrast(95%) brightness(105%) saturate(85%) hue-rotate(-5deg)" },
  { name: "Faded Film", filter: "sepia(40%) contrast(85%) brightness(115%) saturate(75%)" },
  { name: "Warm Polaroid", filter: "sepia(50%) contrast(110%) brightness(105%) saturate(120%)" },
  { name: "Classic B&W", filter: "grayscale(100%) contrast(110%) brightness(105%)" },
];

export default function Photobooth() {
  const [peerId, setPeerId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [peerInstance, setPeerInstance] = useState<any>(null);
  
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [sequenceStatus, setSequenceStatus] = useState({ isSequencing: false, count: 0, total: 3, currentText: "" });
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    import("peerjs").then(({ default: Peer }) => {
      const customShortId = Math.floor(10000 + Math.random() * 90000).toString();
      const peer = new Peer(customShortId);
      
      peer.on("open", (id) => setPeerId(id));

      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          peer.on("call", (call) => {
            call.answer(stream);
            call.on("stream", (remoteStream) => {
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            });
          });
        })
        .catch((err) => console.error("Failed to get local stream", err));

      setPeerInstance(peer);
      return () => peer.destroy();
    });
  }, []);

  const callPartner = () => {
    if (!peerInstance || !partnerId) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        const call = peerInstance.call(partnerId, stream);
        call.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        });
      });
  };

  const drawCombinedMoment = useCallback((ctx: CanvasRenderingContext2D, yOffset: number) => {
    const localVideo = localVideoRef.current;
    const remoteVideo = remoteVideoRef.current;
    if (!localVideo || !remoteVideo) return;

    // Apply the vintage filter to the photos
    ctx.filter = activeFilter.filter;
    ctx.drawImage(localVideo, 0, yOffset, 640, 480);
    ctx.drawImage(remoteVideo, 640, yOffset, 640, 480);
    ctx.filter = ""; 

    // Add the retro orange date stamp if a vintage filter is selected
    if (activeFilter.name !== "Normal") {
      const today = new Date();
      const dateString = `${today.getFullYear().toString().split('').join(' ')} . ${today.getMonth() + 1} . ${today.getDate()}`;
      
      ctx.font = "bold 22px 'Courier New', Courier, monospace";
      ctx.fillStyle = "#ff9900"; 
      ctx.shadowColor = "rgba(255, 153, 0, 0.6)";
      ctx.shadowBlur = 8;
      
      // Stamp on the bottom right of the combined image (Her side)
      ctx.textAlign = "right";
      ctx.fillText(dateString, 1250, yOffset + 450);
      
      // Stamp on the bottom right of Your side too
      ctx.fillText(dateString, 610, yOffset + 450);
      
      // Reset shadow so it doesn't mess up the hearts later
      ctx.shadowBlur = 0; 
    }
  }, [activeFilter]);

  const takePhotoStripSequence = async () => {
    const canvas = canvasRef.current;
    if (!canvas || sequenceStatus.isSequencing) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const numPhotos = 3;
    const individualWidth = 640;
    const individualHeight = 480;

    canvas.width = individualWidth * 2; 
    canvas.height = individualHeight * numPhotos;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSequenceStatus(prev => ({ ...prev, isSequencing: true, currentText: `Get Ready!` }));

    for (let i = 0; i < numPhotos; i++) {
      for (let countdown = 3; countdown > 0; countdown--) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSequenceStatus(prev => ({ ...prev, count: i + 1, currentText: `${countdown}...` }));
      }

      drawCombinedMoment(ctx, i * individualHeight);
      setSequenceStatus(prev => ({ ...prev, currentText: `Snapped! ${i+1}/3` }));
      
      const flash = document.createElement("div");
      flash.className = "fixed inset-0 bg-white z-[100] animate-[flash_0.2s_ease-out]";
      document.body.appendChild(flash);
      setTimeout(() => document.body.removeChild(flash), 200);

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Add the minimal hearts
    ctx.font = "60px Arial";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    
    // Top Left Heart
    ctx.textAlign = "left";
    ctx.fillText("💖", 30, 80);
    
    // Bottom Right Heart (Fixed!)
    ctx.textAlign = "right";
    ctx.fillText("💖", canvas.width - 30, canvas.height - 30);

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `our-monthsary-photostrip-${activeFilter.name.toLowerCase().replace(' ', '-')}.png`;
    link.href = dataUrl;
    link.click();
    
    setSequenceStatus(prev => ({ ...prev, isSequencing: false, currentText: "Downloaded!" }));
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white p-4 md:p-8 overflow-x-hidden relative">
      
      {sequenceStatus.isSequencing && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none bg-black/70 px-4 text-center">
          <h2 className="text-[80px] md:text-[150px] font-extrabold text-white font-mono drop-shadow-[0_0_20px_rgba(255,255,255,0.7)] animate-pulse">
            {sequenceStatus.currentText}
          </h2>
        </div>
      )}

      <h1 className="text-3xl md:text-5xl font-bold mb-6 md:mb-10 text-pink-400 font-serif text-center drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
        Our Secret Photobooth 📸
      </h1>
      
      <div className="flex flex-row flex-wrap justify-center gap-4 md:gap-6 mb-8 w-full max-w-4xl">
        <div className="flex flex-col items-center w-[45%] md:w-auto">
          <p className="mb-2 font-semibold text-gray-300 text-sm md:text-base">You</p>
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full max-w-[320px] aspect-video bg-black rounded-2xl border-4 md:border-8 border-pink-500 object-cover shadow-[0_0_25px_rgba(236,72,153,0.7)] transform scale-x-[-1]" />
        </div>
        <div className="flex flex-col items-center w-[45%] md:w-auto">
          <p className="mb-2 font-semibold text-gray-300 text-sm md:text-base">Her</p>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full max-w-[320px] aspect-video bg-black rounded-2xl border-4 md:border-8 border-pink-500 object-cover shadow-[0_0_25px_rgba(236,72,153,0.7)] transform scale-x-[-1]" />
        </div>
      </div>

      <div className="bg-gray-900 p-6 md:p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center gap-5 md:gap-6 w-full max-w-lg border border-gray-800">
        <p className="text-sm text-gray-400 text-center">Your Room PIN: <br className="block sm:hidden" /><span className="font-mono text-pink-400 bg-gray-950 px-3 py-1.5 rounded select-all shadow-inner text-xl font-bold tracking-widest mt-2 sm:mt-0 inline-block">{peerId || "..."}</span></p>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <input 
            type="text" 
            placeholder="Her 5-digit PIN..." 
            className="flex-1 p-3 md:p-4 rounded-xl bg-gray-950 text-white border border-gray-700 focus:outline-none focus:border-pink-500 transition-colors shadow-inner text-center text-lg tracking-widest font-mono"
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            maxLength={5}
          />
          <button 
            onClick={callPartner}
            className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-pink-600 rounded-xl hover:bg-pink-500 font-bold transition-colors shadow-[0_4px_10px_rgba(219,39,119,0.4)]"
          >
            Connect
          </button>
        </div>

        <div className="w-full flex flex-col gap-2 mt-2">
            <p className="text-sm font-semibold text-gray-400 text-center sm:text-left">Select Strip Filter:</p>
            <div className="flex flex-wrap justify-center sm:grid sm:grid-cols-3 gap-2">
                {FILTERS.map(f => (
                    <button key={f.name} onClick={() => setActiveFilter(f)} className={`px-3 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${activeFilter.name === f.name ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 flex-1 sm:flex-none'}`}>
                        {f.name}
                    </button>
                ))}
            </div>
        </div>

        <button 
          onClick={takePhotoStripSequence}
          disabled={sequenceStatus.isSequencing}
          className="w-full mt-2 px-6 py-4 md:px-8 md:py-5 bg-white text-pink-600 rounded-2xl font-extrabold text-lg md:text-2xl hover:bg-pink-50 transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-[1.03] active:scale-[0.97] disabled:bg-gray-600 disabled:text-gray-400 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {sequenceStatus.isSequencing ? "📸 Running..." : "📸 Start Photobooth!"}
        </button>
      </div>

      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      
      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}








