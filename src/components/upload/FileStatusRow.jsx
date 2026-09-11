import React from 'react';
import { File, FileText, Image as ImageIcon, Map, X, CheckCircle, Loader2, Clock, CheckCircle2 } from 'lucide-react';

export default function FileStatusRow({ fileObj, onRemove }) {
  const { file, id, status, preview } = fileObj;
  
  const getIcon = () => {
    if (preview) return null; // We'll show preview image instead
    const ext = file.name.split('.').pop().toLowerCase();
    if (['las', 'laz'].includes(ext)) return <Map className="h-6 w-6 text-blue-500" />;
    if (ext === 'dxf') return <Map className="h-6 w-6 text-orange-500" />;
    if (ext === 'pdf') return <FileText className="h-6 w-6 text-red-500" />;
    return <File className="h-6 w-6 text-gray-400" />;
  };

  const getLabel = () => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (['las', 'laz'].includes(ext)) return "LiDAR Point Cloud";
    if (ext === 'dxf') return "Floor Plan Drawing";
    if (ext === 'pdf') return "PDF Document";
    if (['jpg', 'png'].includes(ext)) return "Image Document";
    return "File";
  };

  const getStatusBadge = () => {
    switch(status) {
      case 'Pending':
        return <span className="flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#082a42] text-white"><Clock size={14} className="mr-1.5" /> Pending</span>;
      case 'AI Processing':
        return <span className="flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><Loader2 size={14} className="mr-1.5 animate-spin" /> AI Processing</span>;
      case 'Validated':
        return <span className="flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle size={14} className="mr-1.5" /> Validated</span>;
      case 'Registered':
        return <span className="flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-green-600 text-white shadow-sm"><CheckCircle2 size={16} className="mr-1.5" /> Registered</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center p-4 bg-[#0a0a0a] border border-[#333333] rounded-xl shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex-shrink-0 mr-4 h-12 w-12 bg-[#12517a66]/50 rounded-lg overflow-hidden flex items-center justify-center border border-[#333333]">
        {preview ? (
          <img src={preview} alt={file.name} className="h-full w-full object-cover" />
        ) : (
          getIcon()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline">
          <p className="text-base font-semibold text-gray-100 truncate mr-3">{file.name}</p>
          <span className="text-xs text-gray-400 bg-[#12517a66] px-2 py-0.5 rounded">{getLabel()}</span>
        </div>
        <p className="text-sm text-gray-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      <div className="flex items-center space-x-4 ml-4">
        <div className="min-w-[120px] flex justify-end">
          {getStatusBadge()}
        </div>
        <button 
          onClick={() => onRemove(id)}
          className="p-2 text-gray-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          title="Remove file"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
