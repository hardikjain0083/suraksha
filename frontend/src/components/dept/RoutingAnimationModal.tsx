import React, { useEffect, useState } from 'react';

export function RoutingAnimationModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(0);

  const steps = [
    "Analyzing organizational graph...",
    "Identifying owner department...",
    "Checking workload distribution...",
    "Assigned to: Emp 001 (IT / Security Admin)"
  ];

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      const timers = [];
      for (let i = 1; i <= steps.length; i++) {
        timers.push(setTimeout(() => setStep(i), i * 1500));
      }
      timers.push(setTimeout(onClose, (steps.length + 1) * 1500));

      return () => timers.forEach(clearTimeout);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md p-8 space-y-6 text-center text-white">
        <h2 className="text-2xl font-mono text-green-400 mb-6">MAP Routing Protocol</h2>
        
        <div className="space-y-4 font-mono text-sm text-left">
          {steps.map((text, index) => (
            <div key={index} className={`transition-opacity duration-500 ${index < step ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-blue-400">&gt; </span> {text}
              {index === step - 1 && index !== steps.length - 1 && <span className="animate-pulse">_</span>}
              {index === steps.length - 1 && index < step && <span className="ml-2 text-green-400 font-bold">[SUCCESS]</span>}
            </div>
          ))}
        </div>

        {step > steps.length && (
            <div className="mt-8 text-green-400 font-bold animate-pulse">Routing Complete.</div>
        )}
      </div>
    </div>
  );
}