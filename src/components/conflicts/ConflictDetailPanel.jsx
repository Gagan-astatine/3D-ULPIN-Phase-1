import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowRight, CheckCircle, Clock, XCircle, MapPin, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function ConflictDetailPanel({ conflict, onUpdateStatus }) {
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleAction = (status) => {
    onUpdateStatus(conflict.id, status);
    setToastMessage(`Conflict marked as ${status}`);
  };

  if (!conflict) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a] border border-[#333333] rounded-xl p-8 text-center text-gray-400">
        <ShieldAlert size={48} className="mb-4 opacity-20" />
        <p>Select a conflict from the list to view details and resolve</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] border border-[#333333] rounded-xl shadow-sm overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 bg-foreground text-background px-4 py-2 rounded-md shadow-lg font-medium text-sm z-10 animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      <div className="p-6 border-b border-[#333333] bg-[#12517a66]/30 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 mb-1">{conflict.id}</h2>
          <p className="text-gray-400 font-medium">{conflict.type}</p>
        </div>
        <StatusBadge status={conflict.status} />
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-black border border-[#333333] p-4 rounded-lg">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Location</h4>
            <div className="flex items-center text-gray-100 font-medium">
              <MapPin size={18} className="mr-2 text-[#00aaff]" />
              {conflict.area}
            </div>
          </div>
          <div className="bg-black border border-[#333333] p-4 rounded-lg">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Flagged Date</h4>
            <div className="flex items-center text-gray-100 font-medium">
              <Calendar size={18} className="mr-2 text-[#00aaff]" />
              {conflict.flaggedDate}
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-100 mb-4">Conflicting Entities</h3>
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-4 mb-8">
          {/* ULPIN 1 */}
          <div className="flex-1 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-5 rounded-xl">
            <h4 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2">Existing Record</h4>
            <code className="block bg-black px-3 py-2 rounded border border-[#333333] text-gray-100 font-mono mb-3">
              {conflict.ulpin1}
            </code>
            <p className="text-sm text-gray-400">This registration was recorded prior to the conflicting entry.</p>
          </div>
          
          <div className="hidden lg:flex items-center justify-center">
            <div className="bg-[#12517a66] rounded-full p-2 text-gray-400">
              <ArrowRight size={24} />
            </div>
          </div>

          {/* ULPIN 2 */}
          <div className="flex-1 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 p-5 rounded-xl">
            <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-400 mb-2">New Submission</h4>
            <code className="block bg-black px-3 py-2 rounded border border-[#333333] text-gray-100 font-mono mb-3">
              {conflict.ulpin2}
            </code>
            <p className="text-sm text-gray-400">This submission overlaps spatially or has identical attributes.</p>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-100 mb-4">Resolution Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => handleAction('resolved')}
            disabled={conflict.status === 'resolved'}
            className="flex-1 min-w-[150px] flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle size={18} className="mr-2" />
            Approve Resolution
          </button>
          
          <button 
            onClick={() => handleAction('under review')}
            disabled={conflict.status === 'under review'}
            className="flex-1 min-w-[150px] flex items-center justify-center px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Clock size={18} className="mr-2" />
            Mark Under Review
          </button>
          
          <button 
            onClick={() => handleAction('unresolved')}
            disabled={conflict.status === 'unresolved'}
            className="flex-1 min-w-[150px] flex items-center justify-center px-4 py-3 border border-red-200 text-red-600 dark:border-red-900 dark:text-red-400 bg-transparent hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <XCircle size={18} className="mr-2" />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
