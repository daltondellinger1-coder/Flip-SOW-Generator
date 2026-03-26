
import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, XIcon, SparklesIcon } from './icons';
import { connectLiveWalkthrough } from '../services/geminiService';
import { createPcmBlob, decodeAudioData, decode } from '../services/audioProcessing';

interface WalkthroughModalProps {
  onClose: () => void;
  onComplete: (data: any) => Promise<void>;
  isProcessing: boolean;
}

const WalkthroughModal: React.FC<WalkthroughModalProps> = ({ onClose, onComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState<{text: string, role: 'user' | 'model'}[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inCtx;
      outputAudioContextRef.current = outCtx;

      const source = inCtx.createMediaStreamSource(stream);
      const analyzer = inCtx.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateVisuals = () => {
        analyzer.getByteFrequencyData(dataArray);
        let sum = 0;
        for(let i=0; i<bufferLength; i++) sum += dataArray[i];
        setAudioLevel(sum / bufferLength);
        animationFrameRef.current = requestAnimationFrame(updateVisuals);
      };
      updateVisuals();

      sessionPromiseRef.current = connectLiveWalkthrough({
        onItemFound: (item) => console.log("Item:", item),
        onDimensionsFound: (dim) => console.log("Dim:", dim),
        onTranscript: (text, role) => setTranscripts(prev => [...prev, { text, role }]),
        onAudioChunk: async (base64) => {
            if (!outputAudioContextRef.current) return;
            const ctx = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
        }
      });

      const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        sessionPromiseRef.current?.then((session: any) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };
      
      source.connect(scriptProcessor);
      scriptProcessor.connect(inCtx.destination);
      
      setIsActive(true);
    } catch (err) {
      console.error("Live session failed", err);
      alert("Microphone access is required for Live Walkthrough.");
    }
  };

  const stopSession = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    sessionPromiseRef.current?.then((session: any) => session.close());
    setIsActive(false);
  };

  return (
    <div className="fixed inset-0 bg-base-100 flex flex-col z-50 p-4 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Gemini Antigravity</h2>
            <p className="text-[10px] text-brand-primary font-black uppercase tracking-[0.2em] mt-1">Live Multi-Modal Stream</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white p-2"><XIcon /></button>
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-center space-y-12">
        <div className="text-center w-full max-w-lg">
            {isActive ? (
                <div className="space-y-8">
                    <div className="flex justify-center gap-1.5 items-end h-24">
                         {[...Array(20)].map((_, i) => (
                             <div 
                                key={i} 
                                className="w-2 bg-brand-primary rounded-full transition-all duration-75"
                                style={{ height: `${Math.max(10, (audioLevel * (0.5 + Math.random()))) * (1 + Math.sin(i / 3))}%` }}
                             />
                         ))}
                    </div>
                    
                    <div className="bg-base-200 p-4 rounded-xl border border-base-300 h-48 overflow-y-auto text-left space-y-2 no-scrollbar">
                        {transcripts.map((t, i) => (
                            <div key={i} className={`text-sm ${t.role === 'model' ? 'text-brand-primary font-bold' : 'text-gray-300'}`}>
                                <span className="uppercase text-[9px] font-black mr-2 opacity-50">{t.role}:</span>
                                {t.text}
                            </div>
                        ))}
                        {transcripts.length === 0 && <p className="text-gray-600 italic animate-pulse">Waiting for speech...</p>}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-brand-primary/10 p-6 rounded-2xl border border-brand-primary/20">
                        <p className="text-gray-300 text-sm font-medium leading-relaxed">
                            Open a real-time channel with Gemini. Just talk naturally while you walk. The AI will hear you, respond, and build your project scope instantly.
                        </p>
                    </div>
                </div>
            )}
        </div>

        <button
            onClick={isActive ? stopSession : startSession}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl active:scale-95 border-8 ${
                isActive ? 'bg-red-600 border-red-900/30' : 'bg-brand-primary border-brand-primary/20'
            }`}
        >
            <div className="scale-150 mb-2">{isActive ? <div className="w-8 h-8 bg-white rounded-sm" /> : <MicrophoneIcon />}</div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{isActive ? 'GO OFFLINE' : 'GO LIVE'}</span>
        </button>
      </div>

      <div className="p-6 bg-base-200 rounded-xl border border-base-300 mb-4 flex items-start gap-4">
          <div className="text-brand-primary mt-1"><SparklesIcon /></div>
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">
             Native Audio Engine Enabled. Latency minimized for Field Operations.
          </div>
      </div>
    </div>
  );
};

export default WalkthroughModal;
