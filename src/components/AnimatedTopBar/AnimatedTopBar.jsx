import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import './AnimatedTopBar.css';

export function AnimatedTopBar({ items, activeId, onSelect, className = '' }) {
  const [active, setActive] = useState(activeId || items[0]?.id);

  useEffect(() => {
    if (activeId !== undefined) {
      setActive(activeId);
    }
  }, [activeId]);

  const handleSelect = (item) => {
    setActive(item.id);
    if (item.onClick) {
      item.onClick();
    }
    if (onSelect) {
      onSelect(item.id);
    }
  };

  return (
    <div className={`animated-top-bar ${className}`}>
      <div className="atb-items-container">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              className={`atb-item ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(item)}
              title={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="atb-indicator"
                  className="atb-indicator-wrapper"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8
                  }}
                >
                  <div className="atb-indicator" />
                </motion.div>
              )}
              
              <div className="atb-item-icon">
                {item.icon}
              </div>
              <span className="atb-item-text">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
