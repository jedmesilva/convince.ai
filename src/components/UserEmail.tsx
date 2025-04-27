
import React from 'react';
import { ChevronRight } from 'lucide-react';

const UserEmail = () => {
  // Placeholder email - in a real app this would come from auth state
  const userEmail = "user@example.com";

  return (
    <div className="flex items-center justify-center gap-2 text-theme-soft-purple hover:text-theme-bright-purple transition-colors cursor-pointer mb-4">
      <span className="text-sm font-medium">{userEmail}</span>
      <ChevronRight className="h-4 w-4" />
    </div>
  );
};

export default UserEmail;
