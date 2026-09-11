import React, { useState } from 'react';
import '../styles/features.css';
import { ArrowLeft } from 'lucide-react';
import DropZone from '../components/upload/DropZone';
import ProcessingPipeline from '../components/upload/ProcessingPipeline';

export default function Upload() {
  const [files, setFiles] = useState([]);

  const handleHome = () => window.location.hash = '#/';

  const handleFilesAdded = (newFilesList) => {
    const validExtensions = ['.jpg', '.png', '.pdf', '.las', '.laz', '.dxf', '.tif'];
    
    const validFiles = Array.from(newFilesList).filter(file => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      return validExtensions.includes(ext);
    }).map(file => ({
      file,
      id: Math.random().toString(36).substring(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemove = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 py-10 px-4 md:px-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-8">
          <button onClick={handleHome} className="flex items-center text-gray-400 hover:text-[#00aaff] transition-colors">
            <ArrowLeft className="mr-2" size={20} />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold">Data Upload Panel</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        <div className="grid grid-cols-1 gap-8">
          <DropZone onFilesAdded={handleFilesAdded} />
          
          <ProcessingPipeline files={files} onRemove={handleRemove} />
        </div>
      </div>
    </div>
  );
}
