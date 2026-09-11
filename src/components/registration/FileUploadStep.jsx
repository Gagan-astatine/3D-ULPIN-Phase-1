import React, { useCallback, useState } from 'react';
import { UploadCloud, File, X, Image as ImageIcon } from 'lucide-react';

export default function FileUploadStep({ files, onFilesChange }) {
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

  const processFiles = (newFiles) => {
    const validExtensions = ['.jpg', '.png', '.pdf', '.las', '.laz', '.dxf'];
    const validFiles = Array.from(newFiles).filter(file => {
      return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    }).map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    
    onFilesChange([...files, ...validFiles]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  }, [files, onFilesChange]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id) => {
    onFilesChange(files.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div 
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors
          ${dragActive ? 'border-[#008dff] bg-[#008dff]/5' : 'border-[#333333] bg-[#0a0a0a] hover:border-[#008dff]/50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-100 mb-1">Drag and drop your files here</p>
        <p className="text-sm text-gray-400 mb-4">Accepts .jpg, .png, .pdf, .las, .laz, .dxf</p>
        <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-[#082a42] text-white rounded-md font-medium hover:bg-[#082a42]/80 transition-colors">
          <span>Browse Files</span>
          <input type="file" className="hidden" multiple accept=".jpg,.png,.pdf,.las,.laz,.dxf" onChange={handleChange} />
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-100">Attached Files ({files.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {files.map(f => (
              <div key={f.id} className="flex items-center p-3 bg-[#0a0a0a] border border-[#333333] rounded-lg shadow-sm">
                <div className="flex-shrink-0 mr-3 h-10 w-10 bg-[#12517a66] rounded overflow-hidden flex items-center justify-center">
                  {f.preview ? (
                    <img src={f.preview} alt={f.file.name} className="h-full w-full object-cover" />
                  ) : (
                    <File className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate">{f.file.name}</p>
                  <p className="text-xs text-gray-400">{(f.file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                  onClick={() => removeFile(f.id)}
                  className="ml-2 p-1.5 text-gray-400 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
