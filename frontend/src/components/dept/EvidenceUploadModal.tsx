import React, { useState } from 'react';
import { apiClient } from '../../lib/api';
import { Cpu, Upload, Check, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';

export function EvidenceUploadModal({
  isOpen,
  onClose,
  mapId,
  onUploadSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  mapId: string;
  onUploadSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [evidenceType, setEvidenceType] = useState('pdf_document');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Policy Diff state
  const [includeDiff, setIncludeDiff] = useState(false);
  const [origVersion, setOrigVersion] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const [origText, setOrigText] = useState('');
  const [newText, setNewText] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('evidence_type', evidenceType);
    if (description) {
      formData.append('description', description);
    }

    if (includeDiff) {
      if (origVersion) formData.append('original_policy_version', origVersion);
      if (newVersion) formData.append('new_policy_version', newVersion);
      if (origText) formData.append('original_policy_text', origText);
      if (newText) formData.append('new_policy_text', newText);
    }

    try {
      const res = await apiClient.post(`/api/dept/maps/${mapId}/upload-evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(res.data);
      setStep(3);
      onUploadSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail?.message || err.response?.data?.detail || 'Upload and validation failed.');
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setEvidenceType('pdf_document');
    setDescription('');
    setSelectedFile(null);
    setIncludeDiff(false);
    setOrigVersion('');
    setNewVersion('');
    setOrigText('');
    setNewText('');
    setError(null);
    setResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <GlassCard className="w-full max-w-lg p-6 bg-obsidian-950 border-cyber-cyan/30 flex flex-col gap-4 max-h-[95vh] overflow-y-auto font-mono text-xs text-slate-300">
        <div className="flex justify-between items-center border-b border-cyber-cyan/15 pb-3">
          <h2 className="text-sm font-bold text-cyber-cyan tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyber-cyan animate-pulse" />
            EVIDENCE SUBMISSION CONSOLE
          </h2>
          <button onClick={handleClose} className="text-slate-500 hover:text-white transition-all text-base">&times;</button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Evidence Obligation Type</label>
              <select 
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="w-full bg-obsidian-900 border border-cyber-cyan/20 rounded p-2 text-white focus:outline-none focus:border-cyber-cyan"
              >
                <option value="pdf_document">PDF Document (Policy / Report)</option>
                <option value="screenshot">Screenshot (PNG/JPG Proof)</option>
                <option value="config_file">Config File (JSON/XML Rules)</option>
                <option value="ticket_id">ITSM Ticket (Change / Incident ID)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Description / Memo</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this evidence block..."
                rows={3}
                className="w-full bg-obsidian-900 border border-cyber-cyan/20 rounded p-2 text-white focus:outline-none focus:border-cyber-cyan resize-none"
              />
            </div>

            <button 
              onClick={() => setStep(2)}
              className="w-full py-2.5 bg-cyber-cyan text-obsidian-950 font-bold hover:bg-cyber-cyan/80 transition-all rounded"
            >
              PROCEED TO PAYLOAD UPLOAD
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {/* File Drag Drop Area */}
            <div className="space-y-2">
              <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Select Binary File</label>
              <div className="border border-dashed border-cyber-cyan/30 rounded-lg p-6 bg-obsidian-900/40 text-center relative hover:border-cyber-cyan/60 transition-all">
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-cyber-cyan mx-auto" />
                  <p className="text-slate-300 font-bold">
                    {selectedFile ? selectedFile.name : 'Select file or drag here'}
                  </p>
                  <p className="text-[10px] text-slate-500">PDF, PNG, JPG, JSON up to 50MB</p>
                </div>
              </div>
            </div>

            {/* Optional Policy Diff Block */}
            <div className="border border-cyber-cyan/15 rounded p-3 bg-obsidian-900/20 space-y-2.5">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeDiff}
                  onChange={(e) => setIncludeDiff(e.target.checked)}
                  className="rounded border-cyber-cyan/20 bg-obsidian-900 text-cyber-cyan focus:ring-0 focus:ring-offset-0"
                />
                <span className="font-bold uppercase tracking-wider text-[10px]">Include Policy Version Diff</span>
              </label>

              {includeDiff && (
                <div className="space-y-3 pt-2 border-t border-cyber-cyan/10">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400">ORIGINAL VERSION</label>
                      <input 
                        type="text" 
                        value={origVersion}
                        onChange={(e) => setOrigVersion(e.target.value)}
                        placeholder="v1.0.0"
                        className="w-full bg-obsidian-900 border border-cyber-cyan/20 rounded p-1.5 text-white focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400">NEW VERSION</label>
                      <input 
                        type="text" 
                        value={newVersion}
                        onChange={(e) => setNewVersion(e.target.value)}
                        placeholder="v2.0.0"
                        className="w-full bg-obsidian-900 border border-cyber-cyan/20 rounded p-1.5 text-white focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">ORIGINAL POLICY CONTENT</label>
                    <textarea 
                      value={origText}
                      onChange={(e) => setOrigText(e.target.value)}
                      rows={3}
                      className="w-full bg-obsidian-900 border border-cyber-cyan/20 rounded p-1.5 text-white focus:outline-none focus:border-cyber-cyan resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">REVISED POLICY CONTENT</label>
                    <textarea 
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      rows={3}
                      className="w-full bg-obsidian-900 border border-cyber-cyan/20 rounded p-1.5 text-white focus:outline-none focus:border-cyber-cyan resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-cyber-cyan/30 text-cyber-cyan font-bold hover:bg-cyber-cyan/10 transition-all rounded flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> BACK
              </button>
              <button 
                type="button"
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="flex-1 py-2 bg-cyber-green text-obsidian-950 font-bold hover:bg-cyber-green/80 transition-all rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> UPLOADING...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> INGEST & VALIDATE
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && result && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-cyber-green/10 border border-cyber-green/40 flex items-center justify-center mx-auto text-cyber-green">
              <Check className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-cyber-green uppercase tracking-widest">
                PAYLOAD UPLOADED & PARSED
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                The evidence document has been validated and saved.
              </p>
            </div>

            <div className="p-3 bg-obsidian-900 text-left font-mono text-[10px] rounded border border-cyber-cyan/10 space-y-1">
              <div>STATUS: <span className="text-cyber-cyan font-bold uppercase">{result.validation_status}</span></div>
              <div>CONFIDENCE SCORE: <span className="text-cyber-green font-bold">{Math.round(result.confidence_score * 100)}%</span></div>
              <div className="border-t border-cyber-cyan/5 my-2 pt-2 text-slate-400 leading-relaxed max-h-24 overflow-y-auto">
                {result.validation_notes || 'All checks compiled successfully.'}
              </div>
            </div>

            <button 
              onClick={handleClose}
              className="w-full py-2.5 bg-cyber-cyan text-obsidian-950 font-bold hover:bg-cyber-cyan/80 transition-all rounded"
            >
              CLOSE
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}