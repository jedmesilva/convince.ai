import React, { useEffect, useState, useRef } from 'react';

interface BorderTimerProps {
  isActive: boolean;
  duration: number; // duração em segundos
  onTimeEnd?: () => void;
}

const BorderTimer: React.FC<BorderTimerProps> = ({ 
  isActive, 
  duration, 
  onTimeEnd 
}) => {
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Obtenha as dimensões do container quando ele for montado ou redimensionado
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    
    // Atualiza dimensões iniciais
    updateDimensions();
    
    // Adiciona listener para redimensionamento da janela
    window.addEventListener('resize', updateDimensions);
    
    // Cria um observer para monitorar mudanças no tamanho do contêiner
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (containerRef.current) resizeObserver.unobserve(containerRef.current);
      resizeObserver.disconnect();
    };
  }, []);
  
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
  
  // Calcula o tamanho e posição dos segmentos de borda
  const calculateSegments = () => {
    const { width, height } = dimensions;
    const perimeter = 2 * (width + height);
    
    // Calcule quanto do caminho total já foi percorrido
    const progressDistance = (perimeter * progress) / 100;
    
    // Segmento superior (da esquerda para a direita)
    const topSegmentDistance = Math.min(progressDistance, width);
    const topWidth = topSegmentDistance;
    
    // Segmento direito (de cima para baixo)
    const rightSegmentDistance = progressDistance > width 
      ? Math.min(progressDistance - width, height) 
      : 0;
    const rightHeight = rightSegmentDistance;
    
    // Segmento inferior (da direita para a esquerda)
    // Parte inferior percorre da direita para a esquerda
    let bottomWidth = 0;
    if (progressDistance > (width + height)) {
      const progress = Math.min(progressDistance - (width + height), width);
      bottomWidth = progress; // Largura aumenta da direita para a esquerda
    }
    
    // Segmento esquerdo (de baixo para cima)
    let leftHeight = 0;
    if (progressDistance > (2 * width + height)) {
      leftHeight = Math.min(progressDistance - (2 * width + height), height);
    }
    
    return {
      top: {
        width: topWidth,
        display: topWidth > 0 ? 'block' : 'none'
      },
      right: {
        height: rightHeight,
        display: rightHeight > 0 ? 'block' : 'none'
      },
      bottom: {
        width: bottomWidth,
        display: bottomWidth > 0 ? 'block' : 'none'
      },
      left: {
        height: leftHeight,
        display: leftHeight > 0 ? 'block' : 'none'
      }
    };
  };
  
  const segments = calculateSegments();
  
  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-10"
    >
      {/* Segmento superior - da esquerda para a direita */}
      <div 
        className="absolute top-0 left-0 h-[3px] bg-theme-vivid-purple shadow-[0_0_8px_rgba(192,90,255,0.8)]"
        style={{ 
          width: `${segments.top.width}px`,
          display: segments.top.display,
          transition: 'width 0.05s linear'
        }}
      />
      
      {/* Segmento direito - de cima para baixo */}
      <div 
        className="absolute top-0 right-0 w-[3px] bg-theme-vivid-purple shadow-[0_0_8px_rgba(192,90,255,0.8)]"
        style={{ 
          height: `${segments.right.height}px`,
          display: segments.right.display,
          transition: 'height 0.05s linear'
        }}
      />
      
      {/* Segmento inferior - da direita para a esquerda */}
      <div 
        className="absolute bottom-0 h-[3px] bg-theme-vivid-purple shadow-[0_0_8px_rgba(192,90,255,0.8)]"
        style={{ 
          width: `${segments.bottom.width}px`,
          display: segments.bottom.display,
          right: '0px', // Ancorado à direita
          transition: 'width 0.05s linear'
        }}
      />
      
      {/* Segmento esquerdo - de baixo para cima */}
      <div 
        className="absolute bottom-0 left-0 w-[3px] bg-theme-vivid-purple shadow-[0_0_8px_rgba(192,90,255,0.8)]"
        style={{ 
          height: `${segments.left.height}px`,
          display: segments.left.display,
          transition: 'height 0.05s linear'
        }}
      />
    </div>
  );
};

export default BorderTimer;