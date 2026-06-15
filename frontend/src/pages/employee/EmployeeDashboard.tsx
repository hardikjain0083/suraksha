import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Upload, 
  FileText, 
  RefreshCw, 
  Send,
  Loader2,
  XCircle,
  FileCheck
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '@/components/ui/glass-card';

export function EmployeeDashboard() {
  const { user } = useAuth();
  const [gaps, setGaps] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected gap for fixing
  const [selectedGap, setSelectedGap] = useState<any | null>(null);
  const [fixedText, setFixedText] = useState('');
  const [fixedFile, setFixedFile] = useState<File | null>(null);
  
  // Submit fix feedback
  const [submitting, setSubmitting] = useState(false);
  const [recheckResult, setRecheckResult] = useState<any | null>(null);

  // Regression check state
  const [checkingRegressions, setCheckingRegressions] = useState(false);
  const [regressionCheckResult, setRegressionCheckResult] = useState<any | null>(null);

  // Message notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTasks = async () => {
    if (!user?.empId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/gaps/employee/${user.empId}`);
      setGaps(res.data);
      
      const notifRes = await apiClient.get('/api/gaps/notifications');
      setNotifications(notifRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user?.empId]);

  const triggerToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
    }
  };

  const handleSelectGap = async (gap: any) => {
    setSelectedGap(gap);
    setRecheckResult(null);
    setRegressionCheckResult(null);
    setFixedFile(null);
    
    // Attempt to seed text area with the target policy's current content
    try {
      const res = await apiClient.get(`/api/admin/policies/`);
      const targetPolicy = res.data.find((p: any) => p.policy_id === gap.top_policy_id);
      if (targetPolicy) {
        setFixedText(targetPolicy.content);
      } else {
        setFixedText('');
      }
    } catch {
      setFixedText('');
    }
  };

  const handleCheckRegressions = async () => {
    if (!selectedGap) return;
    if (!fixedText.trim()) {
      triggerToast('Please type updated policy text in the editor first.', true);
      return;
    }
    setCheckingRegressions(true);
    setRegressionCheckResult(null);
    try {
      const formData = new FormData();
      formData.append('updated_text', fixedText);
      const res = await apiClient.post(`/api/gaps/employee/gaps/${selectedGap.gap_id}/check-regression`, formData);
      setRegressionCheckResult(res.data);
      if (res.data.original_resolved) {
        if (res.data.has_regressions) {
          triggerToast('Original gap resolved, but regressions were detected!', true);
        } else {
          triggerToast('Compliance check passed! No regressions detected.');
        }
      } else {
        triggerToast('Original gap is still not resolved.', true);
      }
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Regression check failed', true);
    } finally {
      setCheckingRegressions(false);
    }
  };

  const handleSubmitFix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGap) return;
    setSubmitting(true);
    setRecheckResult(null);

    const formData = new FormData();
    if (fixedFile) {
      formData.append('file', fixedFile);
    } else if (fixedText) {
      formData.append('updated_text', fixedText);
    } else {
      triggerToast('Please upload a policy file or provide revised policy text.', true);
      setSubmitting(false);
      return;
    }

    try {
      const res = await apiClient.post(`/api/gaps/${selectedGap.gap_id}/submit-fix`, formData);
      const data = res.data;
      
      setRecheckResult(data);
      if (data.resolved) {
        triggerToast('Compliance check passed! Gap has been successfully resolved and sent to HOD/Admin.');
        fetchTasks();
        setSelectedGap(null);
      } else {
        triggerToast('Compliance check failed. Guideline mismatches are still present in the updated text.', true);
      }
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Fix submission failed', true);
    } finally {
      setSubmitting(false);
    }
  };

  const getDueColorClass = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const today = new Date();
    // Reset hours to compare calendar days
    due.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'border-red-500/40 hover:border-red-500 bg-red-950/20 text-red-200';
    } else if (diffDays <= 2) {
      return 'border-amber-500/40 hover:border-amber-500 bg-amber-950/20 text-amber-200';
    } else {
      return 'border-emerald-500/40 hover:border-emerald-500 bg-emerald-950/20 text-emerald-200';
    }
  };

  const activeTasks = gaps.filter(g => g.triage_status === 'assigned');
  const completedTasks = gaps.filter(g => g.triage_status === 'resolved');

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-cyan/15 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-cyber-cyan flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-cyber-cyan animate-pulse-glow" />
            MY COMPLIANCE TASKS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Welcome back, <span className="font-semibold text-slate-200">{user?.name || user?.empId}</span>. Review assigned gaps and submit policy fixes.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchTasks}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-cyber-cyan/35 hover:border-cyber-cyan bg-obsidian-950 hover:bg-cyber-cyan/5 rounded text-xs font-mono text-cyber-cyan"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Task List
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 border-cyber-cyan/15">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Assigned Gaps</span>
          <h3 className="text-3xl font-bold font-mono text-cyber-cyan mt-1">{activeTasks.length}</h3>
        </GlassCard>
        <GlassCard className="p-5 border-cyber-green/15">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Resolved Gaps</span>
          <h3 className="text-3xl font-bold font-mono text-cyber-green mt-1">{completedTasks.length}</h3>
        </GlassCard>
        <GlassCard className="p-5 border-cyber-magenta/15">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Department Notifications</span>
          <h3 className="text-3xl font-bold font-mono text-cyber-magenta mt-1">{notifications.length}</h3>
        </GlassCard>
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Tasks queue and alerts */}
        <div className="xl:col-span-1 space-y-6">
          {/* Tasks List */}
          <GlassCard className="p-5 border-cyber-cyan/10">
            <h3 className="text-xs font-bold font-mono text-cyber-cyan uppercase border-b border-cyber-cyan/10 pb-2 mb-3">
              Assigned Gaps Ledger
            </h3>
            
            {loading ? (
              <div className="text-center py-10 font-mono text-xs text-slate-400 animate-pulse">Syncing tasks...</div>
            ) : activeTasks.length === 0 ? (
              <div className="text-center py-12 font-mono text-xs text-slate-500">🎉 No pending compliance tasks! You are fully compliant.</div>
            ) : (
              <div className="space-y-3">
                {activeTasks.map(gap => (
                  <div 
                    key={gap.gap_id}
                    onClick={() => handleSelectGap(gap)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:scale-[1.01] ${getDueColorClass(gap.due_date)} ${
                      selectedGap?.gap_id === gap.gap_id ? 'ring-2 ring-cyber-cyan shadow-glow-cyan' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start font-mono text-xs">
                      <span className="text-cyber-magenta font-bold">{gap.gap_id}</span>
                      <span className="text-slate-400 flex items-center gap-1 font-semibold"><Clock className="w-3 h-3" /> {new Date(gap.due_date).toLocaleDateString()}</span>
                    </div>
                    {/* Due Date Status Badge */}
                    {(() => {
                      const due = new Date(gap.due_date);
                      const today = new Date();
                      due.setHours(0,0,0,0);
                      today.setHours(0,0,0,0);
                      const diffTime = due.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      if (diffDays < 0) {
                        return <span className="inline-block text-[8px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-1 py-0.5 rounded mt-1 font-mono uppercase">OVERDUE</span>;
                      } else if (diffDays <= 2) {
                        return <span className="inline-block text-[8px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1 py-0.5 rounded mt-1 font-mono uppercase">DUE SOON</span>;
                      } else {
                        return <span className="inline-block text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1 py-0.5 rounded mt-1 font-mono uppercase">ON TRACK</span>;
                      }
                    })()}
                    <h4 className="text-slate-100 font-bold text-xs mt-1.5 truncate" title={gap.top_policy_title}>Target: {gap.top_policy_title}</h4>
                    <p className="text-[10px] text-slate-300 line-clamp-2 mt-1 leading-normal font-sans">{gap.mismatch_description || gap.clause_text}</p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Notifications feed */}
          <GlassCard className="p-5 border-cyber-cyan/10">
            <h3 className="text-xs font-bold font-mono text-cyber-cyan uppercase border-b border-cyber-cyan/10 pb-2 mb-3">
              My Alerts & Logs
            </h3>
            <div className="space-y-3 font-mono text-[10px] max-h-[200px] overflow-y-auto scrollbar-none">
              {notifications.length === 0 ? (
                <p className="text-slate-500 italic">No logs recorded.</p>
              ) : (
                notifications.map((notif, idx) => (
                  <div key={idx} className="p-2.5 bg-obsidian-950/40 rounded border border-cyber-cyan/5">
                    <p className="text-cyber-cyan font-bold uppercase">{notif.title}</p>
                    <p className="text-slate-400 mt-0.5">{notif.message}</p>
                    <span className="text-slate-600 block mt-1">{new Date(notif.created_at).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Side: Fix Workspace */}
        <div className="xl:col-span-2">
          {selectedGap ? (
            <GlassCard className="p-6 border-cyber-cyan/15 space-y-4">
              <div className="border-b border-cyber-cyan/10 pb-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Workspace // Fixing</span>
                <h2 className="text-base font-bold font-mono text-cyber-cyan mt-0.5">{selectedGap.gap_id} in {selectedGap.top_policy_title}</h2>
              </div>

              {/* Feedback messages */}
              {successMsg && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 text-emerald-400 text-xs font-mono rounded flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  {successMsg.toUpperCase()}
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-950/30 border border-red-500/40 text-red-400 text-xs font-mono rounded flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  {errorMsg.toUpperCase()}
                </div>
              )}

              {/* Guideline Mismatch details (Side-by-Side Workspace) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-obsidian-950 border border-cyber-cyan/15 rounded-lg text-xs font-mono leading-normal h-full">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">RBI Guideline Clause (Page {selectedGap.page_number}):</p>
                  <p className="text-slate-300 mt-1.5 leading-relaxed font-sans">{selectedGap.clause_text}</p>
                </div>
                <div className="p-3.5 bg-obsidian-950 border border-cyber-magenta/15 rounded-lg text-xs font-mono leading-normal h-full">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Detected Policy Gap / Mismatch:</p>
                  <p className="text-cyber-magenta font-bold mt-1.5 leading-relaxed font-sans">{selectedGap.mismatch_description || selectedGap.classification_reason}</p>
                </div>
              </div>

              {/* Upload or Inline text Form */}
              <form onSubmit={handleSubmitFix} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload Option */}
                  <div className="border border-dashed border-cyber-cyan/25 hover:border-cyber-cyan/60 p-4 rounded-xl flex flex-col items-center justify-center bg-obsidian-950/20 cursor-pointer">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400">Upload Updated Policy File</span>
                    <input 
                      type="file" 
                      accept=".pdf,.txt,.docx" 
                      onChange={(e) => setFixedFile(e.target.files?.[0] || null)}
                      className="mt-2 text-slate-400 text-[10px]"
                    />
                    <span className="text-[8px] text-slate-600 mt-1">PDF, DOCX, TXT</span>
                  </div>

                  {/* Inline text area info */}
                  <div className="p-4 bg-obsidian-950/40 border border-cyber-cyan/5 rounded-xl flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Compliance Verification Checklist:</p>
                    <ul className="list-disc list-inside text-[9px] text-slate-500 space-y-1 mt-1.5 leading-relaxed">
                      <li>Review the RBI clause mismatch</li>
                      <li>Incorporate correct terminology/values</li>
                      <li>Upload document or paste text below</li>
                      <li>Submit to trigger re-verification</li>
                    </ul>
                  </div>
                </div>

                {fixedFile && (
                  <p className="text-cyber-green text-[10px] font-bold">Using file: {fixedFile.name} (This will overwrite editor text)</p>
                )}

                {/* Inline Editor */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Edit Policy Content Directly</label>
                  <textarea
                    value={fixedText}
                    onChange={(e) => {
                      setFixedText(e.target.value);
                      if (fixedFile) setFixedFile(null); // Clear file if text edited
                    }}
                    rows={8}
                    className="w-full p-3 bg-obsidian-950 border border-cyber-cyan/20 focus:border-cyber-cyan rounded-lg text-slate-200 outline-none font-sans leading-relaxed"
                    placeholder="Paste or write the entire updated policy here..."
                    required={!fixedFile}
                  />
                </div>

                {recheckResult && !recheckResult.resolved && (
                  <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded-lg font-mono">
                    <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> RE-VERIFICATION FAILURE</p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-[10px]">
                      {recheckResult.remaining_gaps.map((g: string, i: number) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {regressionCheckResult && (
                  <div className={`p-3.5 border rounded-lg font-mono text-xs ${
                    regressionCheckResult.original_resolved && !regressionCheckResult.has_regressions
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-red-950/20 border-red-500/40 text-red-400'
                  }`}>
                    <p className="font-bold uppercase tracking-wider">
                      Regression Check Status // Score: {(regressionCheckResult.original_score * 100).toFixed(1)}%
                    </p>
                    <p className="mt-1">
                      Original Gap Resolution: {regressionCheckResult.original_resolved ? "✅ SUCCESS" : "❌ FAILED"}
                    </p>
                    {regressionCheckResult.has_regressions ? (
                      <div className="mt-2 text-red-400 font-sans leading-normal">
                        <p className="font-bold font-mono text-[10px] text-red-500 uppercase">⚠️ Regressions Introduced:</p>
                        <ul className="list-disc list-inside space-y-1 mt-1 text-[10px]">
                          {regressionCheckResult.regressions.map((reg: any, i: number) => (
                            <li key={i}>
                              <strong>{reg.circular_title}</strong>: "{reg.clause_text}" (Similarity drops to {(reg.score * 100).toFixed(1)}%)
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      regressionCheckResult.original_resolved && (
                        <p className="text-emerald-400 mt-1">✅ Verified: No regulatory regressions introduced.</p>
                      )
                    )}
                  </div>
                )}

                <div className="flex gap-2 justify-end flex-wrap">
                  <button
                    type="button"
                    onClick={() => { 
                      setSelectedGap(null); 
                      setRecheckResult(null); 
                      setRegressionCheckResult(null); 
                    }}
                    className="px-4 py-2 bg-obsidian-900 border border-slate-700 text-slate-300 rounded font-bold hover:bg-slate-800 transition-colors"
                  >
                    Close Workspace
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckRegressions}
                    disabled={checkingRegressions || submitting || !fixedText}
                    className="px-4 py-2 bg-obsidian-950 border border-amber-500/40 hover:border-amber-500 text-amber-400 rounded font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {checkingRegressions ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400" />
                    )}
                    Check Regressions
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-gradient-to-r from-cyber-cyan to-cyber-blue text-obsidian-950 font-bold rounded hover:shadow-glow-cyan transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Verifying Revisions...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Submit Fix</>
                    )}
                  </button>
                </div>
              </form>
            </GlassCard>
          ) : (
            <GlassCard className="p-12 border-cyber-cyan/5 flex flex-col items-center justify-center text-center h-[400px]">
              <FileCheck className="w-16 h-16 text-slate-600 mb-4 animate-pulse-glow" />
              <h3 className="text-slate-300 font-bold font-mono">WORKSPACE EMPTY</h3>
              <p className="text-xs text-slate-500 font-mono mt-1 max-w-sm">Select an assigned compliance gap from the left ledger to review revisions and submit policy fixes.</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
