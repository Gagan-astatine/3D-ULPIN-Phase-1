import React, { useEffect, useState } from 'react';
import FileStatusRow from './FileStatusRow';

export default function ProcessingPipeline({ files, onRemove }) {
  // We need to manage the simulated status locally based on timers
  const [fileStates, setFileStates] = useState([]);

  useEffect(() => {
    // Sync incoming files with our state
    const newStates = files.map(f => {
      const existing = fileStates.find(fs => fs.id === f.id);
      if (existing) return existing;
      return { ...f, status: 'Pending', timerStarted: Date.now() };
    });
    
    // Only update if length changed or new files were added
    if (newStates.length !== fileStates.length || newStates.some(n => !fileStates.find(f => f.id === n.id))) {
      setFileStates(newStates);
    }
  }, [files]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFileStates(current => {
        let changed = false;
        const now = Date.now();
        const updated = current.map(f => {
          if (f.status === 'Registered') return f;
          
          const elapsed = now - f.timerStarted;
          let newStatus = f.status;
          
          if (elapsed > 5000) newStatus = 'Registered';
          else if (elapsed > 4000) newStatus = 'Validated';
          else if (elapsed > 2000) newStatus = 'AI Processing';
          
          if (newStatus !== f.status) {
            changed = true;
            return { ...f, status: newStatus };
          }
          return f;
        });
        
        return changed ? updated : current;
      });
    }, 500); // Check every half second

    return () => clearInterval(interval);
  }, []);

  const handleRemove = (id) => {
    setFileStates(current => current.filter(f => f.id !== id));
    onRemove(id);
  };

  if (fileStates.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-gray-100 mb-4 border-b border-[#333333] pb-2">Processing Queue ({fileStates.length})</h3>
      <div className="space-y-3">
        {fileStates.map(fs => (
          <FileStatusRow key={fs.id} fileObj={fs} onRemove={handleRemove} />
        ))}
      </div>
    </div>
  );
}
