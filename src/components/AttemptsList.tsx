import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

// Interface para cada tentativa
interface Attempt {
  id: number;
  name: string;
  timestamp: Date;
}

// Dados de exemplo para popular a lista
const initialAttempts: Attempt[] = [
  { id: 1, name: "Lucas", timestamp: new Date(Date.now() - 10000) }, // 10 segundos atrás
  { id: 2, name: "Maria", timestamp: new Date(Date.now() - 1 * 60000) }, // 1 minuto atrás
  { id: 3, name: "João", timestamp: new Date(Date.now() - 3 * 60000) }, // 3 minutos atrás
  { id: 4, name: "Camila", timestamp: new Date(Date.now() - 10 * 60000) }, // 10 minutos atrás
  { id: 5, name: "Pedro", timestamp: new Date(Date.now() - 30 * 60000) }, // 30 minutos atrás
  { id: 6, name: "Ana", timestamp: new Date(Date.now() - 1 * 60 * 60000) }, // 1 hora atrás
  { id: 7, name: "Rafael", timestamp: new Date(Date.now() - 3 * 60 * 60000) }, // 3 horas atrás
  { id: 8, name: "Clara", timestamp: new Date(Date.now() - 12 * 60 * 60000) }, // 12 horas atrás
  { id: 9, name: "Bruno", timestamp: new Date(Date.now() - 18 * 60 * 60000) }, // 18 horas atrás
  { id: 10, name: "Carla", timestamp: new Date(Date.now() - 24 * 60 * 60000) }, // 24 horas atrás
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

const AttemptsList: React.FC = () => {
  const [attempts, setAttempts] = useState<Attempt[]>(initialAttempts);
  // Contador para o número de tentativas total
  const [attemptCount, setAttemptCount] = useState<number>(540); // Começamos com 540 tentativas

  // Adiciona uma nova tentativa aleatória a cada 15-45 segundos
  useEffect(() => {
    const addRandomAttempt = () => {
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      // Incrementa o contador de tentativas
      setAttemptCount(prevCount => prevCount + 1);
      
      const newAttempt = {
        id: Date.now(),
        name: randomName,
        timestamp: new Date()
      };

      // Manter apenas as 10 tentativas mais recentes
      setAttempts(prevAttempts => [newAttempt, ...prevAttempts.slice(0, 9)]);
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

  return (
    <div className="bg-theme-dark-purple bg-opacity-50 rounded-xl p-5 backdrop-blur-sm border border-theme-purple shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-theme-light-purple text-lg font-semibold">
          Tentativas Recentes
        </h3>
        <div className="text-sm text-theme-soft-purple bg-theme-purple bg-opacity-20 px-2 py-1 rounded-full">
          {attemptCount} total
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {attempts.map((attempt, index) => (
          <div 
            key={attempt.id}
            className={`p-3 rounded-lg transition-all duration-300 ${
              index === 0 
                ? 'bg-theme-purple bg-opacity-30 border-l-4 border-theme-vivid-purple animate-pulse-slow shadow-md' 
                : 'bg-theme-dark-bg bg-opacity-60 hover:bg-opacity-80 border-l-4 border-theme-purple border-opacity-40'
            }`}
          >
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-theme-bright-purple font-bold text-sm">
                  #{attemptCount - index}
                </span>
                <span className="text-xs text-theme-soft-purple">
                  {formatTimestamp(attempt.timestamp)}
                </span>
              </div>
              <div className="text-sm text-theme-light-purple">
                <strong className="text-theme-bright-purple">{attempt.name}</strong> tentou persuadir, mas fracassou!
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-theme-purple border-opacity-30">
        <p className="text-xs text-center text-theme-soft-purple">
          Lista atualizada em tempo real
        </p>
      </div>
    </div>
  );
};

export default AttemptsList;