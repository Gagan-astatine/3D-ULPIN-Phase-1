import React, { useState } from 'react';
import '../styles/features.css';
import { ArrowLeft } from 'lucide-react';
import ConflictTable from '../components/conflicts/ConflictTable';
import ConflictDetailPanel from '../components/conflicts/ConflictDetailPanel';
import { mockConflicts as initialData } from '../data/mockConflicts';

export default function Conflicts() {
  const [conflicts, setConflicts] = useState(initialData);
  const [activeConflictId, setActiveConflictId] = useState(null);

  const handleHome = () => window.location.hash = '#/';

  const handleUpdateStatus = (id, newStatus) => {
    setConflicts(current => 
      current.map(c => c.id === id ? { ...c, status: newStatus } : c)
    );
  };

  const activeConflict = conflicts.find(c => c.id === activeConflictId) || null;

  return (
    <div className="min-h-screen bg-black text-gray-100 py-10 px-4 md:px-8 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto pb-10 h-[calc(100vh-120px)] flex flex-col">
        <div className="flex items-center justify-between mb-8 flex-shrink-0">
          <button onClick={handleHome} className="flex items-center text-gray-400 hover:text-[#00aaff] transition-colors">
            <ArrowLeft className="mr-2" size={20} />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold">Conflict Detection Panel</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          {/* Left Panel - List */}
          <div className="w-full lg:w-1/3 xl:w-1/4 h-full">
            <ConflictTable 
              conflicts={conflicts} 
              activeId={activeConflictId} 
              onSelect={(c) => setActiveConflictId(c.id)} 
            />
          </div>
          
          {/* Right Panel - Details */}
          <div className="w-full lg:w-2/3 xl:w-3/4 h-full">
            <ConflictDetailPanel 
              conflict={activeConflict} 
              onUpdateStatus={handleUpdateStatus} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
