import React from 'react';
import { Check } from 'lucide-react';

export default function StepIndicator({ currentStep }) {
  const steps = [
    { id: 1, label: 'Parcel Type' },
    { id: 2, label: 'Details' },
    { id: 3, label: 'Uploads' },
    { id: 4, label: 'Review' }
  ];

  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold 
              ${isActive ? 'border-[#008dff] bg-[#008dff] text-white' : 
                isCompleted ? 'border-[#008dff] bg-[#008dff] text-white' : 
                'border-muted-foreground/30 text-gray-400'}`}>
              {isCompleted ? <Check size={16} /> : step.id}
            </div>
            <span className={`ml-2 text-sm font-medium hidden md:block ${isActive ? 'text-gray-100' : isCompleted ? 'text-gray-100' : 'text-gray-400'}`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-8 md:w-12 h-0.5 mx-2 md:mx-4 ${isCompleted ? 'bg-[#008dff]' : 'bg-muted-foreground/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
