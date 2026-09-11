import React from 'react';
import { Map, Building2, MoveDown, Cloud } from 'lucide-react';

export default function ParcelTypeSelector({ value, onChange }) {
  const types = [
    { id: 'SRF', label: 'Surface', icon: Map, desc: 'Standard land parcel' },
    { id: 'APT', label: 'Apartment', icon: Building2, desc: 'Multi-unit building' },
    { id: 'UGD', label: 'Underground', icon: MoveDown, desc: 'Subterranean space' },
    { id: 'AIR', label: 'Air-right', icon: Cloud, desc: 'Above ground space' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {types.map(t => {
        const Icon = t.icon;
        const isActive = value === t.id;
        return (
          <button 
            key={t.id} 
            type="button"
            onClick={() => onChange(t.id)}
            className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all duration-200
              ${isActive ? 'border-[#008dff] bg-[#008dff]/10 shadow-md transform scale-[1.02]' : 'border-[#333333] bg-[#0a0a0a] hover:border-[#008dff]/50 hover:bg-[#12517a66]/50'}
            `}
          >
            <Icon size={40} className={`mb-3 ${isActive ? 'text-[#00aaff]' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-semibold ${isActive ? 'text-gray-100' : 'text-gray-400'}`}>{t.label}</h3>
            <p className="text-sm text-gray-400 mt-1 text-center">{t.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
