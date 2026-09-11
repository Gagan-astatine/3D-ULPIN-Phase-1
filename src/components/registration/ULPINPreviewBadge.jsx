import React, { useState, useEffect } from 'react';
import { Fingerprint } from 'lucide-react';

export default function ULPINPreviewBadge({ ulpin }) {
  const [displayText, setDisplayText] = useState(ulpin);

  useEffect(() => {
    if (!ulpin) return;
    
    let iterations = 0;
    const maxIterations = 20;
    
    const interval = setInterval(() => {
      setDisplayText(ulpin.split('').map((char, index) => {
        // Keep hyphens fixed
        if (char === '-') return '-';
        
        // Gradually reveal the correct characters from left to right
        if (index < (iterations / maxIterations) * ulpin.length) {
          return ulpin[index];
        }
        
        // Show random numbers for the unrevealed parts
        return Math.floor(Math.random() * 10).toString();
      }).join(''));
      
      iterations++;
      
      if (iterations > maxIterations) {
        clearInterval(interval);
        setDisplayText(ulpin);
      }
    }, 40);
    
    return () => clearInterval(interval);
  }, [ulpin]);

  if (!ulpin) return null;
  
  return (
    <div className="flex items-center justify-center p-4 mb-6 bg-[#008dff]/10 border border-[#008dff]/30 rounded-lg shadow-inner relative overflow-hidden group">
      {/* Scanning light effect */}
      <div className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-[#00aaff]/20 to-transparent -translate-x-32 group-hover:animate-[spin_3s_linear_infinite]" style={{ animation: 'shimmer 2.5s infinite linear' }}></div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-200px) skewX(-15deg); }
          100% { transform: translateX(500px) skewX(-15deg); }
        }
      `}</style>
      
      <Fingerprint className="text-[#00aaff] mr-3 animate-pulse" size={24} />
      <div className="font-mono text-xl font-bold tracking-wider text-[#00aaff]">
        {displayText}
      </div>
    </div>
  );
}
