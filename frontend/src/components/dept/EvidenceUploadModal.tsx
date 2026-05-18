import React, { useState } from 'react';

export function EvidenceUploadModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-bold">Upload Evidence</h2>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 p-1 rounded">✕</button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Select Evidence Type</label>
            <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              <option>Config File (JSON/XML)</option>
              <option>PDF Document</option>
              <option>Screenshot (PNG/JPG)</option>
              <option>ITSM Ticket ID</option>
            </select>
            <button className="w-full bg-blue-600 text-white rounded py-2 mt-4 hover:bg-blue-700" onClick={() => setStep(2)}>Next</button>
          </div>
        )}

        {step === 2 && (
           <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Upload File</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
              </div>
            </div>
            <div className="flex justify-between mt-4">
               <button className="px-4 py-2 border border-gray-300 rounded text-gray-700" onClick={() => setStep(1)}>Back</button>
               <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setStep(3)}>Simulate Upload</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-bold text-green-600">Validation Passed!</h3>
            <p className="text-gray-600">The evidence has been processed by the Validator Module and passed all checks with 94% confidence.</p>
            <div className="bg-gray-50 p-3 text-left font-mono text-xs rounded border my-4">
              <div>&gt; checking file signature... OK</div>
              <div>&gt; running OCR... OK</div>
              <div>&gt; extracting keywords: 'AES-256'... FOUND</div>
              <div>&gt; verifying dates... VALID</div>
            </div>
            <button className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700" onClick={() => { setStep(1); onClose(); }}>Close</button>
          </div>
        )}

      </div>
    </div>
  );
}