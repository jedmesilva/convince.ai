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
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
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
  
  // Função de animação usando requestAnimationFrame
  const animate = React.useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - startTimeRef.current;
    const totalDuration = duration * 1000;
    const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
    
    setProgress(newProgress);
    
    if (newProgress < 100) {
      // Continuar animação
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Timer completo
      if (onTimeEnd) {
        onTimeEnd();
      }
    }
  }, [duration, onTimeEnd]);
  
  // Iniciar ou parar animação baseado no isActive
  useEffect(() => {
    if (isActive && !animationFrameRef.current) {
      // Iniciar animação apenas se não estiver já em execução
      startTimeRef.current = null; // Resetar o tempo de início
      animationFrameRef.current = requestAnimationFrame(animate);
    } else if (!isActive) {
      // Parar animação se não estiver ativo
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setProgress(0);
    }
    
    // Cleanup na desmontagem
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]); // Dependência apenas de isActive para impedir re-renders desnecessários
  
  // Calcula o tamanho e posição dos segmentos de borda para o percurso completo
  const calculateSegments = () => {
    const { width, height } = dimensions;
    const perimeter = 2 * (width + height);
    
    // Calcule a distância total percorrida em pixels
    const progressDistance = (perimeter * progress) / 100;
    
    // Inicialize valores para cada segmento
    let topWidth = 0;
    let rightHeight = 0;
    let bottomWidth = 0;
    let leftHeight = 0;
    
    // Segmento 1: Superior (da esquerda para a direita)
    if (progressDistance <= width) {
      // Apenas a parte superior está visível
      topWidth = progressDistance;
    } else {
      // A parte superior está totalmente visível
      topWidth = width;
      
      // Segmento 2: Lateral direita (de cima para baixo)
      if (progressDistance <= width + height) {
        // Apenas parte do lado direito está visível
        rightHeight = progressDistance - width;
      } else {
        // O lado direito está totalmente visível
        rightHeight = height;
        
        // Segmento 3: Inferior (da direita para a esquerda)
        if (progressDistance <= 2 * width + height) {
          // Apenas parte do lado inferior está visível
          bottomWidth = progressDistance - (width + height);
        } else {
          // O lado inferior está totalmente visível
          bottomWidth = width;
          
          // Segmento 4: Lateral esquerda (de baixo para cima)
          if (progressDistance <= 2 * width + 2 * height) {
            // Apenas parte do lado esquerdo está visível
            leftHeight = progressDistance - (2 * width + height);
          } else {
            // O percurso completo está visível
            leftHeight = height;
          }
        }
      }
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
          display: segments.top.display
        }}
      />
      
      {/* Segmento direito - de cima para baixo */}
      <div 
        className="absolute top-0 right-0 w-[3px] bg-theme-vivid-purple shadow-[0_0_8px_rgba(192,90,255,0.8)]"
        style={{ 
          height: `${segments.right.height}px`,
          display: segments.right.display
        }}
      />
      
      {/* Segmento inferior - da direita para a esquerda */}
      <div 
        className="absolute bottom-0 right-0 h-[3px] bg-theme-vivid-purple shadow-[0_0_8px_rgba(192,90,255,0.8)]"
        style={{ 
          width: `${segments.bottom.width}px`,
          display: segments.bottom.display
        }}
      />
      
      {/* Segmento esquerdo - de baixo para cima */}
      <div 
        className="absolute bottom-0 left-0 w-[3px] bg-theme-vivid-purple shadow-[0_0_8px_rgba(192,90,255,0.8)]"
        style={{ 
          height: `${segments.left.height}px`,
          display: segments.left.display
        }}
      />
    </div>
  );
};

export default BorderTimer;