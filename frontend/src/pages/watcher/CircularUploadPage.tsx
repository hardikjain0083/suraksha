import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadZone } from '../../components/watcher/UploadZone';
import { JudgeModeNarrator } from '../../components/watcher/JudgeModeNarrator';
import { ShieldAlert, CheckCircle, AlertTriangle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

const STAGES = [
  "Uploading...",
  "Extracting text...",
  "Parsing clauses...",
  "Analyzing obligations...",
  "Complete"
];

export const CircularUploadPage = () => {
  const navigate = useNavigate();
  const [, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState(0); // 0=idle, 1=upload, 2=extract, 3=parse, 4=analyze, 5=complete
  const [result, setResult] = useState<any>(null);
  const [judgeMode, setJudgeMode] = useState(false);

  const handleUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setStage(1);
    
    // Simulate progression for the demo visually while real upload happens
    const timers = [
      setTimeout(() => setStage(2), 1000),
      setTimeout(() => setStage(3), 2000),
      setTimeout(() => setStage(4), 3000),
    ];

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await apiClient.post('/api/circulars/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      timers.forEach(clearTimeout);
      setStage(6);
      setResult(res.data);
    } catch (error: any) {
      timers.forEach(clearTimeout);
      if (import.meta.env.DEV) console.error(error);
      setStage(0);
      alert(error?.response?.data?.detail || 'Upload failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Main Upload Area */}
        <div className={`flex-1 transition-all duration-500 ${judgeMode ? 'lg:max-w-2xl' : 'max-w-3xl mx-auto'}`}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-canara-primary" />
              Regulatory Ingestion Pipeline
            </h1>
            <p className="text-slate-600">
              Upload RBI, SEBI, or CERT-In circulars. Our deterministic parser will extract obligations, map severities, and generate vector embeddings automatically.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
            {stage === 0 && (
              <UploadZone onFileSelect={handleUpload} />
            )}
            
            {stage > 0 && stage < 5 && (
              <div className="py-12 flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-canara-primary animate-spin mb-6" />
                <h3 className="text-xl font-semibold text-slate-800 mb-8">{STAGES[stage - 1]}</h3>
                
                <div className="w-full max-w-md">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>Progress</span>
                    <span>{Math.round((stage / 5) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-canara-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stage / 5) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {stage >= 5 && result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-canara-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-canara-success" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Ingestion Complete</h2>
                <p className="text-slate-500 mb-8">Circular parsed and vectorized successfully.</p>
                
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-left mb-8 max-w-md mx-auto">
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="text-slate-500">Circular ID:</div>
                    <div className="font-semibold text-slate-900">{result.circular_id}</div>
                    
                    <div className="text-slate-500">Status:</div>
                    <div>
                      {result.ingestion_status === 'fully_parsed' && (
                        <span className="px-2 py-1 bg-canara-success/10 text-canara-success rounded text-xs font-semibold flex items-center w-max gap-1">
                          <CheckCircle className="w-3 h-3" /> Fully Parsed
                        </span>
                      )}
                      {result.ingestion_status === 'partially_parsed' && (
                        <span className="px-2 py-1 bg-[#FF6B35]/10 text-[#FF6B35] rounded text-xs font-semibold flex items-center w-max gap-1">
                          <AlertTriangle className="w-3 h-3" /> Partially Parsed
                        </span>
                      )}
                      {result.ingestion_status === 'failed' && (
                        <span className="px-2 py-1 bg-canara-danger/10 text-canara-danger rounded text-xs font-semibold flex items-center w-max gap-1">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </div>

                    <div className="text-slate-500">Clauses Extracted:</div>
                    <div className="font-semibold text-slate-900">{result.clauses_extracted}</div>
                    
                    <div className="text-slate-500">Processing Time:</div>
                    <div className="font-mono text-slate-700">{result.processing_time_ms} ms</div>

                    <div className="text-slate-500">Extraction Quality:</div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${result.extraction_confidence > 0.8 ? 'bg-canara-success' : result.extraction_confidence > 0.6 ? 'bg-amber-400' : 'bg-canara-danger'}`}
                            style={{ width: `${result.extraction_confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold font-mono text-slate-500">
                          {Math.round((result.extraction_confidence || 0) * 100)}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 italic">
                        Multi-strategy engine (pymupdf + pdfplumber)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => { setStage(0); setFile(null); setResult(null); }}
                    className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                  >
                    Upload Another
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/circulars/${result.circular_id}`)}
                    className="px-6 py-2 bg-canara-primary text-white rounded-lg hover:bg-canara-primary/90 transition-colors font-medium flex items-center gap-2 shadow-sm"
                  >
                    View Details <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
          
          <button 
            onClick={() => setJudgeMode(!judgeMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${judgeMode ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            {judgeMode ? 'Hide Judge Mode' : 'Enable Judge Mode'}
          </button>
        </div>

        {/* Judge Mode Slide-out Panel */}
        <AnimatePresence>
          {judgeMode && (
            <motion.div 
              initial={{ opacity: 0, width: 0, x: 50 }}
              animate={{ opacity: 1, width: 400, x: 0 }}
              exit={{ opacity: 0, width: 0, x: 50 }}
              className="lg:block overflow-hidden"
            >
              <JudgeModeNarrator currentStage={stage} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
