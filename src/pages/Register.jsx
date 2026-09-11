import React, { useState, useMemo } from 'react';
import '../styles/features.css';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import StepIndicator from '../components/registration/StepIndicator';
import ParcelTypeSelector from '../components/registration/ParcelTypeSelector';
import CoordinateForm from '../components/registration/CoordinateForm';
import FileUploadStep from '../components/registration/FileUploadStep';
import ULPINPreviewBadge from '../components/registration/ULPINPreviewBadge';

export default function Register() {
  const [step, setStep] = useState(1);
  const [parcelType, setParcelType] = useState('');
  const [formData, setFormData] = useState({
    buildingId: '', floor: '', unit: '', lat: '', lon: '', elevation: ''
  });
  const [files, setFiles] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const generatedUlpin = useMemo(() => {
    if (!parcelType) return null;
    const b = formData.buildingId || 'XXXX';
    const f = formData.floor || 'XX';
    const u = formData.unit || 'XX';
    return `IN-MH-MUM-${b}-F${f}-U${u}-${parcelType}`;
  }, [parcelType, formData]);

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  const handleHome = () => window.location.hash = '#/';

  const handleSubmit = () => {
    setIsSubmitted(true);
    setTimeout(() => {
      setStep(1);
      setParcelType('');
      setFormData({ buildingId: '', floor: '', unit: '', lat: '', lon: '', elevation: '' });
      setFiles([]);
      setIsSubmitted(false);
    }, 3000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0a0a0a] p-8 rounded-2xl shadow-lg border border-[#333333] text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Registration Complete</h2>
          <p className="text-gray-400 mb-4">
            The property has been successfully registered with ULPIN:
          </p>
          <div className="font-mono font-bold text-[#00aaff] bg-[#008dff]/10 p-3 rounded-md">
            {generatedUlpin}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 py-10 px-4 md:px-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-8">
          <button onClick={handleHome} className="flex items-center text-gray-400 hover:text-[#00aaff] transition-colors">
            <ArrowLeft className="mr-2" size={20} />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold">Property Registration</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        <StepIndicator currentStep={step} />

        <div className="bg-[#0a0a0a] border border-[#333333] rounded-2xl shadow-sm p-6 md:p-8 mb-8">
          {step > 1 && <ULPINPreviewBadge ulpin={generatedUlpin} />}
          
          <div className="min-h-[300px]">
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Select Parcel Type</h2>
                <ParcelTypeSelector value={parcelType} onChange={setParcelType} />
              </div>
            )}
            
            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Property Details</h2>
                <CoordinateForm data={formData} onChange={setFormData} />
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Supporting Documents</h2>
                <FileUploadStep files={files} onFilesChange={setFiles} />
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Review Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#12517a66]/30 p-6 rounded-xl border border-[#333333]">
                  <div>
                    <h3 className="font-semibold text-gray-400 uppercase text-xs tracking-wider mb-3">Identifiers</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between"><dt className="text-gray-400">Parcel Type:</dt><dd className="font-medium">{parcelType}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-400">Building ID:</dt><dd className="font-medium">{formData.buildingId}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-400">Floor:</dt><dd className="font-medium">{formData.floor}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-400">Unit:</dt><dd className="font-medium">{formData.unit}</dd></div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-400 uppercase text-xs tracking-wider mb-3">Spatial Data</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between"><dt className="text-gray-400">Latitude:</dt><dd className="font-medium">{formData.lat}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-400">Longitude:</dt><dd className="font-medium">{formData.lon}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-400">Elevation:</dt><dd className="font-medium">{formData.elevation}m</dd></div>
                    </dl>
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-400 uppercase text-xs tracking-wider mb-3">Attachments ({files.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {files.map(f => (
                      <span key={f.id} className="px-3 py-1 bg-black border border-[#333333] rounded-full text-xs font-medium">
                        {f.file.name}
                      </span>
                    ))}
                    {files.length === 0 && <span className="text-sm text-gray-400 italic">No files attached</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button 
            onClick={handlePrev}
            disabled={step === 1}
            className="flex items-center px-6 py-2.5 rounded-lg font-medium border border-[#333333] bg-black hover:bg-[#12517a66] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          {step < 4 ? (
            <button 
              onClick={handleNext}
              disabled={step === 1 && !parcelType}
              className="flex items-center px-6 py-2.5 rounded-lg font-medium bg-[#008dff] text-white hover:bg-[#008dff]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Next
              <ArrowRight className="ml-2" size={18} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              className="flex items-center px-8 py-2.5 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-md transform hover:scale-105 duration-200"
            >
              Confirm & Register
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
