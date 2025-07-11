
import React, { useState } from 'react';
import { ArrowUpRight, User } from 'lucide-react';

interface UserEmailProps {
  email?: string;
  compact?: boolean;
  onClick?: () => void;
}

const UserEmail: React.FC<UserEmailProps> = ({ 
  email = "Lucas@email.com", 
  compact = false,
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      data-user-email
      className={`
        flex items-center gap-2 
        text-violet-300/80 
        hover:text-violet-200 
        transition-all duration-200 
        cursor-pointer
        ${compact ? 'text-xs' : 'text-sm'}
        ${compact ? 'py-1 px-2' : 'py-2 px-3'}
        rounded-lg 
        ${compact ? 'bg-slate-700/50 hover:bg-slate-600/60' : 'bg-violet-500/10 hover:bg-violet-500/20'}
        border border-slate-600/30 hover:border-violet-500/40
        group
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
    >
      <User className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-violet-400`} />
      <span className="font-medium truncate max-w-24">{email}</span>
      <ArrowUpRight className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} transition-transform ${isHovered ? 'translate-x-0.5 -translate-y-0.5' : ''}`} />
    </div>
  );
};

export default UserEmail;
