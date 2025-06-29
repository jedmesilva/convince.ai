import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

// Interface para cada tentativa falha
interface FailedAttempt {
  id: number;
  name: string;
  timestamp: Date;
}

// Dados de exemplo para popular a lista
const initialAttempts: FailedAttempt[] = [
  { id: 1, name: "Lucas", timestamp: new Date(Date.now() - 10000) }, // 10 segundos atrás
  { id: 2, name: "Maria", timestamp: new Date(Date.now() - 1 * 60000) }, // 1 minuto atrás
  { id: 3, name: "João", timestamp: new Date(Date.now() - 3 * 60000) }, // 3 minutos atrás
  { id: 4, name: "Camila", timestamp: new Date(Date.now() - 10 * 60000) }, // 10 minutos atrás
  { id: 5, name: "Pedro", timestamp: new Date(Date.now() - 30 * 60000) }, // 30 minutos atrás
  { id: 6, name: "Ana", timestamp: new Date(Date.now() - 1 * 60 * 60000) }, // 1 hora atrás
  { id: 7, name: "Rafael", timestamp: new Date(Date.now() - 3 * 60 * 60000) }, // 3 horas atrás
  { id: 8, name: "Clara", timestamp: new Date(Date.now() - 12 * 60 * 60000) }, // 12 horas atrás
];

// Nomes para selecionar aleatoriamente quando novos usuários "tentam"
const randomNames = [
  "Miguel", "Sophia", "Arthur", "Helena", "Bernardo", 
  "Valentina", "Heitor", "Laura", "Davi", "Isabella", 
  "Lorenzo", "Manuela", "Théo", "Júlia", "Gabriel", 
  "Alice", "Pedro", "Giovanna", "Benjamin", "Beatriz",
  "Lucas", "Maria", "João", "Ana", "Carlos",
  "Mariana", "Ricardo", "Fernanda", "Diego", "Camila"
];

const FailedAttemptsList: React.FC = () => {
  const [attempts, setAttempts] = useState<FailedAttempt[]>(initialAttempts);

  // Adiciona uma nova tentativa aleatória a cada 15-45 segundos
  useEffect(() => {
    const addRandomAttempt = () => {
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const newAttempt = {
        id: Date.now(),
        name: randomName,
        timestamp: new Date()
      };

      setAttempts(prevAttempts => [newAttempt, ...prevAttempts.slice(0, 19)]);
    };

    // Define um intervalo aleatório entre 15 e 45 segundos
    const randomInterval = Math.floor(Math.random() * (45000 - 15000) + 15000);
    const intervalId = setInterval(addRandomAttempt, randomInterval);

    return () => clearInterval(intervalId);
  }, []);

  // Para garantir que os timestamps sejam atualizados a cada 30 segundos
  const [timeUpdate, setTimeUpdate] = useState(0);
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeUpdate(prev => prev + 1);
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Função para formatar a mensagem com base no tempo decorrido
  const formatTimestamp = (timestamp: Date) => {
    try {
      const distance = formatDistanceToNow(timestamp, { 
        locale: pt,
        addSuffix: false 
      });
      
      if (distance.includes('segundo') || distance === 'menos de um minuto') {
        return 'agora mesmo';
      }
      
      return `há ${distance}`;
    } catch (error) {
      return 'recentemente';
    }
  };

  const listRef = useRef<HTMLDivElement>(null);
  
  // Efeito para rolar para o topo quando uma nova tentativa é adicionada
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [attempts.length]);
  
  return (
    <div className="mt-4 mb-12 max-w-xl mx-auto bg-theme-dark-purple bg-opacity-50 rounded-lg p-4 backdrop-blur-sm border border-theme-purple">
      <h3 className="text-theme-light-purple text-center text-lg font-semibold mb-3">
        Tentativas Recentes
      </h3>
      <div 
        ref={listRef}
        className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar"
      >
        {attempts.map((attempt, index) => (
          <div 
            key={attempt.id}
            className={`p-3 rounded-lg transition-all duration-300 ${
              index === 0 
                ? 'bg-theme-purple bg-opacity-30 border-l-4 border-theme-vivid-purple animate-pulse' 
                : 'bg-theme-dark-bg bg-opacity-60 hover:bg-opacity-80 border-l-4 border-theme-purple border-opacity-40'
            }`}
          >
            <div className="text-sm">
              <span className="text-theme-light-purple font-medium">
                <strong className="text-theme-bright-purple">{attempt.name}</strong> tentou {formatTimestamp(attempt.timestamp)}, mas fracassou!
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FailedAttemptsList;

// Renomeando o componente para AttemptsList (será feito em novo arquivo)