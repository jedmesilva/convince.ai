
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const UserEmail = () => {
  const [isPressed, setIsPressed] = useState(false);
  const userEmail = "user@example.com";

  return (
    <div 
      className={`
        flex items-center justify-center gap-2 
        text-theme-soft-purple 
        hover:text-theme-bright-purple 
        transition-all duration-200 
        cursor-pointer mb-4
        transform hover:scale-105
        active:scale-95
        ${isPressed ? 'scale-95' : ''}
      `}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      <span className="text-sm font-medium">{userEmail}</span>
      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </div>
  );
};

export default UserEmail;
