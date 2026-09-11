import React from 'react';

export default function CoordinateForm({ data, onChange }) {
  const handleChange = (e) => {
    onChange({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0a0a0a] p-6 rounded-xl border border-[#333333] shadow-sm">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-100">Building ID</label>
        <input 
          type="text" 
          name="buildingId" 
          value={data.buildingId} 
          onChange={handleChange} 
          placeholder="e.g. B042"
          className="w-full p-2.5 bg-black border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-100"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-100">Floor Number</label>
        <input 
          type="text" 
          name="floor" 
          value={data.floor} 
          onChange={handleChange} 
          placeholder="e.g. 03"
          className="w-full p-2.5 bg-black border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-100"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-100">Unit Number</label>
        <input 
          type="text" 
          name="unit" 
          value={data.unit} 
          onChange={handleChange} 
          placeholder="e.g. 07"
          className="w-full p-2.5 bg-black border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-100"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-100">Elevation (meters)</label>
        <input 
          type="number" 
          name="elevation" 
          value={data.elevation} 
          onChange={handleChange} 
          placeholder="e.g. 15.5"
          className="w-full p-2.5 bg-black border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-100"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-100">Latitude</label>
        <input 
          type="number" 
          name="lat" 
          value={data.lat} 
          onChange={handleChange} 
          placeholder="e.g. 19.0760"
          className="w-full p-2.5 bg-black border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-100"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-100">Longitude</label>
        <input 
          type="number" 
          name="lon" 
          value={data.lon} 
          onChange={handleChange} 
          placeholder="e.g. 72.8777"
          className="w-full p-2.5 bg-black border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-100"
        />
      </div>
    </div>
  );
}
