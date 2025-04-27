
import React, { useEffect, useState } from 'react';

interface BorderTimerProps {
  isRunning: boolean;
  duration: number; // in milliseconds
  onComplete?: () => void;
}

const BorderTimer: React.FC<BorderTimerProps> = ({ isRunning, duration, onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setProgress(0);
      return;
    }

    let animationFrameId: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / duration) * 100;
      
      if (newProgress >= 100) {
        setProgress(100);
        onComplete?.();
      } else {
        setProgress(newProgress);
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRunning, duration, onComplete]);

  const gradientDeg = progress * 3.6; // 360 degrees / 100%
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div 
        className="absolute inset-0 border-2 border-transparent"
        style={{
          background: `
            linear-gradient(${gradientDeg}deg, theme-vivid-purple ${progress}%, transparent ${progress}%) top right/50% 50% no-repeat,
            linear-gradient(${gradientDeg + 90}deg, theme-vivid-purple ${progress}%, transparent ${progress}%) bottom right/50% 50% no-repeat,
            linear-gradient(${gradientDeg + 180}deg, theme-vivid-purple ${progress}%, transparent ${progress}%) bottom left/50% 50% no-repeat,
            linear-gradient(${gradientDeg + 270}deg, theme-vivid-purple ${progress}%, transparent ${progress}%) top left/50% 50% no-repeat
          `,
          clipPath: 'inset(0 round 0.5rem)',
        }}
      />
    </div>
  );
};

export default BorderTimer;
