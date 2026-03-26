
import React, { useRef, useState, useEffect } from 'react';
import { XIcon, CheckCircleIcon, RefreshIcon, UndoIcon, RedoIcon, TrashIcon } from './icons';

interface PhotoEditorModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (newBase64: string) => void;
  onDelete?: () => void;
}

const COLORS = [
  '#FF0000', // Red
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#FFFFFF', // White
  '#000000', // Black
];

const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({ isOpen, imageSrc, onClose, onSave, onDelete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState('#FF0000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineWidth, setLineWidth] = useState(5);
  
  // Undo/Redo History
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (isOpen && canvasRef.current && imageSrc) {
      // Clear history when opening new image
      setHistory([]);
      setHistoryIndex(-1);
      loadImageToCanvas();
    }
  }, [isOpen, imageSrc]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // If we are in the middle of history (undid something), truncate the future
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Add new state
    newHistory.push(data);
    
    // Limit history size to prevent memory issues on mobile
    if (newHistory.length > 20) {
        newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const loadImageToCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      // Set canvas size to match image resolution
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Setup default styles
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      
      // Save initial clean state
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([data]);
      setHistoryIndex(0);
    };
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
        setIsDrawing(false);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.closePath();
            // Save state after stroke is finished
            saveToHistory();
        }
    }
  };

  const handleSave = () => {
    if (canvasRef.current) {
      const newBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
      onSave(newBase64);
    }
  };

  const handleClear = () => {
      // Reset to index 0 (the clean photo)
      if (history.length > 0) {
        const cleanState = history[0];
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.putImageData(cleanState, 0, 0);
            // We keep the clean state as index 0, clear everything after
            setHistory([cleanState]);
            setHistoryIndex(0);
        }
      } else {
        loadImageToCanvas();
      }
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) {
        const prevIndex = historyIndex - 1;
        const prevState = history[prevIndex];
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.putImageData(prevState, 0, 0);
            setHistoryIndex(prevIndex);
        }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        const nextState = history[nextIndex];
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.putImageData(nextState, 0, 0);
            setHistoryIndex(nextIndex);
        }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
        <button onClick={onClose} className="text-white p-2 rounded-full hover:bg-white/10">
          <XIcon />
        </button>
        <h3 className="text-white font-bold ml-12">Edit Photo</h3>
        <div className="flex items-center gap-2">
            {onDelete && (
                <button 
                    onClick={onDelete} 
                    className="text-red-500 p-2 rounded-full hover:bg-red-900/30 transition-colors"
                    title="Delete Photo"
                >
                    <TrashIcon />
                </button>
            )}
            <button onClick={handleSave} className="text-brand-primary p-2 rounded-full hover:bg-white/10 font-bold flex items-center gap-2">
            <CheckCircleIcon /> Save
            </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef} 
        className="flex-grow flex items-center justify-center overflow-hidden p-4 touch-none"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="max-w-full max-h-[80vh] shadow-2xl border border-gray-800 touch-none"
          style={{ touchAction: 'none' }} // Critical for preventing scroll while drawing
        />
      </div>

      {/* Toolbar */}
      <div className="bg-base-200 p-4 pb-8 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Colors */}
            <div className="flex gap-4">
            {COLORS.map(c => (
                <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-brand-primary scale-125' : 'border-gray-600'}`}
                style={{ backgroundColor: c }}
                />
            ))}
            </div>

            {/* Actions */}
            <div className="flex gap-4 items-center">
                <button 
                    onClick={handleUndo} 
                    disabled={historyIndex <= 0}
                    className="text-gray-400 hover:text-white flex flex-col items-center text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <div className="p-2 bg-base-300 rounded-full mb-1"><UndoIcon /></div>
                    Undo
                </button>
                
                <button 
                    onClick={handleRedo} 
                    disabled={historyIndex >= history.length - 1}
                    className="text-gray-400 hover:text-white flex flex-col items-center text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <div className="p-2 bg-base-300 rounded-full mb-1"><RedoIcon /></div>
                    Redo
                </button>

                <div className="w-px h-8 bg-gray-600 mx-2"></div>

                <button onClick={handleClear} className="text-gray-400 hover:text-red-400 flex flex-col items-center text-xs">
                    <div className="p-2 bg-base-300 rounded-full mb-1"><RefreshIcon /></div>
                    Reset Markup
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoEditorModal;
