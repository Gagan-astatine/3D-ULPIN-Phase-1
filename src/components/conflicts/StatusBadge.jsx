import React from 'react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export default function StatusBadge({ status }) {
  if (status === 'unresolved') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
        <AlertCircle size={14} className="mr-1.5" />
        Unresolved
      </span>
    );
  }
  
  if (status === 'under review') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        <Clock size={14} className="mr-1.5" />
        Under Review
      </span>
    );
  }
  
  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 size={14} className="mr-1.5" />
        Resolved
      </span>
    );
  }
  
  return null;
}
