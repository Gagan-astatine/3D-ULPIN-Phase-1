import React from 'react';
import guardImg from '../assets/guard.jpg';

export default function Unauthorized() {
  const handleGoHome = () => {
    window.location.href = window.location.pathname;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-white text-[#1e234c] p-10 font-sans">
      <div className="flex-1 max-w-lg space-y-6 md:pr-10">
        <h1 className="text-5xl md:text-6xl font-light text-[#232b53]">
          401! Hold up!
        </h1>
        
        <p className="text-lg text-gray-500 font-medium pb-4">
          Sorry, but you are not authorized to view this page.
        </p>

        <button 
          onClick={handleGoHome}
          className="py-3 px-8 rounded font-semibold bg-[#232b53] text-white hover:bg-[#1a2040] transition-colors shadow-md"
        >
          Back To Home Page
        </button>
      </div>

      <div className="flex-1 mt-12 md:mt-0 max-w-xl">
        <img src={guardImg} alt="Security guard and dog" className="w-full h-auto object-contain" />
      </div>
    </div>
  );
}
