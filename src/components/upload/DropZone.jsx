import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function DropZone({ onFilesAdded }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(e.dataTransfer.files);
    }
  }, [onFilesAdded]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(e.target.files);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer
        ${dragActive ? 'border-[#008dff] bg-[#008dff]/10 scale-[1.02]' : 'border-[#333333] bg-[#0a0a0a] hover:border-[#008dff]/50 hover:bg-[#12517a66]/30'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload-input').click()}
    >
      <UploadCloud className={`mx-auto h-16 w-16 mb-4 transition-colors ${dragActive ? 'text-[#00aaff]' : 'text-gray-400'}`} />
      <h3 className="text-xl font-bold text-gray-100 mb-2">Upload Data & Documents</h3>
      <p className="text-base text-gray-400 mb-6">Drag and drop files here, or click to browse</p>
      
      <div className="flex justify-center space-x-2 text-xs text-gray-400 mb-6">
        <span className="bg-[#12517a66] px-2 py-1 rounded">.las</span>
        <span className="bg-[#12517a66] px-2 py-1 rounded">.laz</span>
        <span className="bg-[#12517a66] px-2 py-1 rounded">.dxf</span>
        <span className="bg-[#12517a66] px-2 py-1 rounded">.pdf</span>
        <span className="bg-[#12517a66] px-2 py-1 rounded">.jpg</span>
        <span className="bg-[#12517a66] px-2 py-1 rounded">.png</span>
        <span className="bg-[#12517a66] px-2 py-1 rounded">.tif</span>
      </div>

      <input 
        id="file-upload-input" 
        type="file" 
        className="hidden" 
        multiple 
        accept=".jpg,.png,.pdf,.las,.laz,.dxf,.tif" 
        onChange={handleChange} 
      />
      <button 
        className="inline-flex items-center justify-center px-6 py-2.5 bg-[#008dff] text-white rounded-lg font-semibold hover:bg-[#008dff]/90 transition-colors pointer-events-none"
      >
        Select Files
      </button>
    </div>
  );
}
