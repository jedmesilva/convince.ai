import React, { useEffect, useState, CSSProperties } from 'react';

interface BorderTimerProps {
  isActive: boolean;
  duration: number; // duração em segundos
  onTimeEnd?: () => void;
}

const BorderTimer: React.FC<BorderTimerProps> = ({ isActive, duration, onTimeEnd }) => {
  const [progress, setProgress] = useState(0);
  
  // Inicia o temporizador quando isActive se torna true
  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }
    
    const startTime = Date.now();
    const totalDuration = duration * 1000;
    
    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(intervalId);
        if (onTimeEnd) onTimeEnd();
      }
    }, 16); // ~60fps para animação suave
    
    return () => clearInterval(intervalId);
  }, [isActive, duration, onTimeEnd]);
  
  // Define o estilo como objeto CSS válido
  const timerStyle: CSSProperties = {
    position: 'absolute',
    top: '-1px',
    right: '-1px',
    bottom: '-1px',
    left: '-1px',
    borderRadius: 'inherit',
    padding: '1px',
    background: `conic-gradient(
      #c05aff ${progress}%, 
      transparent ${progress}%, 
      transparent 100%
    )`,
    zIndex: 10,
    boxShadow: '0 0 8px rgba(192, 90, 255, 0.8)',
    pointerEvents: 'none'
  };
  
  return (
    <div 
      style={timerStyle}
      className="border-timer"
      aria-hidden={true}
    />
  );
};

export default BorderTimer;