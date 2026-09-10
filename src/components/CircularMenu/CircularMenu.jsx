import React, { useState } from 'react';
import { Plus, Map, Building2, Layers, Search, Wrench, Activity } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation.js';
import './CircularMenu.css';

export default function CircularMenu({ items, onOpenChange }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(value => {
      const nextValue = !value;
      onOpenChange?.(nextValue);
      return nextValue;
    });
  };

  // Define radius for the circle
  const radius = 100;
  const totalItems = items.length;
  // Starting angle offset (e.g. 180 is left, 270 is top, 0 is right)
  // Let's arrange them in a semi-circle or full circle.
  // The background is a full circle centered slightly above bottom.
  // We'll span them across a half-circle on the top. 180deg to 360deg.
  // Actually, a full circle distribution looks better for a true circular menu.
  
  // Calculate positions
  const getStyle = (index) => {
    // If it's a full circle:
    const angle = (Math.PI * 2) * (index / totalItems) - (Math.PI / 2); 
    
    // Position
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return {
      transform: `translate(${x}px, ${y}px)`
    };
  };

  return (
    <div className="circular-menu-wrapper">
      <div className={`circular-menu ${isOpen ? 'is-active' : ''}`}>
        <button 
          className="circular-menu-btn" 
          onClick={toggleMenu}
          aria-label={t('common.toggleMenu')}
        >
          <Plus size={32} />
        </button>
        
        <div className="circular-menu-bg">
          <ul className="circular-menu-items">
            {items.map((item, i) => (
              <li 
                key={item.label} 
                className={`circular-menu-item ${item.isActive ? 'active-item' : ''}`}
                style={getStyle(i)}
              >
                <button onClick={() => { item.onClick(); setIsOpen(false); onOpenChange?.(false); }}>
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
