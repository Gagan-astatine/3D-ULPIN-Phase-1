import React from 'react';
import StatusBadge from './StatusBadge';
import { MapPin, Calendar } from 'lucide-react';

export default function ConflictTable({ conflicts, activeId, onSelect }) {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-[#333333] rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#333333] bg-[#12517a66]/30">
        <h3 className="font-semibold text-gray-100">Active Conflicts ({conflicts.length})</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-border">
          {conflicts.map(conflict => (
            <li 
              key={conflict.id}
              onClick={() => onSelect(conflict)}
              className={`p-4 cursor-pointer transition-colors hover:bg-[#12517a66]/50 ${activeId === conflict.id ? 'bg-[#008dff]/5 border-l-4 border-[#008dff]' : 'border-l-4 border-transparent'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-gray-100">{conflict.id}</span>
                <StatusBadge status={conflict.status} />
              </div>
              <p className="text-sm font-medium text-gray-100 mb-3">{conflict.type}</p>
              
              <div className="flex flex-col space-y-1.5 text-xs text-gray-400">
                <div className="flex items-center">
                  <MapPin size={14} className="mr-1.5" />
                  {conflict.area}
                </div>
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1.5" />
                  Flagged: {conflict.flaggedDate}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
