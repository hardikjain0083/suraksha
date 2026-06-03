import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Send, ShieldAlert, CheckCircle, Edit, ListFilter, RefreshCw } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function IncidentReportDraft() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    title: '',
    severity: 'high',
    systems_affected: '',
    incident_details: '',
    mitigation_actions: '',
    reporter_name: '',
    reporter_email: ''
  });

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/incidents');
      setIncidents(res.data);
      if (res.data.length > 0 && !selectedIncident) {
        setSelectedIncident(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching incident drafts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Run the SLA monitor check on load to sync any breaches
  useEffect(() => {
    apiClient.post('/api/incidents/monitor/check')
      .then(() => fetchIncidents())
      .catch(err => console.error(err));
  }, []);

  const selectIncident = (incident: any) => {
    setSelectedIncident(incident);
    setIsEditing(false);
    setEditForm({
      title: incident.title || '',
      severity: incident.severity || 'high',
      systems_affected: (incident.systems_affected || []).join(', '),
      incident_details: incident.incident_details || '',
      mitigation_actions: incident.mitigation_actions || '',
      reporter_name: incident.reporter_name || '',
      reporter_email: incident.reporter_email || ''
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...editForm,
        systems_affected: editForm.systems_affected.split(',').map(s => s.trim()).filter(Boolean)
      };
      const res = await apiClient.put(`/api/incidents/${selectedIncident.report_id}`, payload);
      alert('Incident draft updated successfully.');
      setSelectedIncident(res.data);
      setIsEditing(false);
      fetchIncidents();
    } catch (err) {
      console.error(err);
      alert('Failed to update incident draft.');
    }
  };

  const handleSubmitReport = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to submit this incident report to CERT-In (Form 1)? This action is immutable.')) {
      return;
    }
    try {
      await apiClient.post(`/api/incidents/${reportId}/submit`);
      alert('Incident report formally dispatched to CERT-In. Audi-chain transaction logged.');
      fetchIncidents();
      const updated = await apiClient.get(`/api/incidents/${reportId}`);
      setSelectedIncident(updated.data);
    } catch (err) {
      console.error(err);
      alert('Failed to submit incident report.');
    }
  };

  // Timer Calculation Helper
  const getSlaTimeLeft = (deadlineStr: string, status: string) => {
    if (status === 'submitted') return { text: 'Submitted in SLA', style: 'text-green-400 bg-green-950/30 border-green-500/30' };
    if (status === 'sla_breached') return { text: 'SLA BREACHED', style: 'text-red-400 bg-red-950/40 border-red-500/30 animate-pulse' };
    
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { text: 'SLA BREACHED', style: 'text-red-400 bg-red-950/40 border-red-500/30 animate-pulse' };
    }
    
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    return {
      text: `${diffHrs}h ${diffMins}m remaining`,
      style: diffHrs < 2 ? 'text-orange-400 bg-orange-950/30 border-orange-500/30 animate-pulse' : 'text-cyan-400 bg-cyan-950/30 border-cyan-500/30'
    };
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-cyber-cyan animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading incident drafts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-obsidian-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-cyber-cyan">
            CERT-In Incident Report Drafting
          </h1>
          <p className="text-slate-400 mt-2">
            Draft, review, and dispatch regulatory Form 1 incident reports within the required 6-hour SLA window.
          </p>
        </div>
        <button 
          onClick={fetchIncidents} 
          className="p-2 border border-obsidian-850 hover:bg-obsidian-900 rounded-lg text-slate-400 hover:text-cyber-cyan transition-colors"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Checklist */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wide px-1">
            <span className="flex items-center gap-1.5"><ListFilter size={14} /> Active Reports</span>
            <span>{incidents.length} Found</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
            {incidents.map((incident) => {
              const timer = getSlaTimeLeft(incident.sla_deadline, incident.status);
              const isSelected = selectedIncident?.report_id === incident.report_id;
              
              return (
                <div
                  key={incident.report_id}
                  onClick={() => selectIncident(incident)}
                  className={`glass-dark rounded-xl p-4 border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-red-500 bg-red-500/5 shadow-glow-red' 
                      : 'border-obsidian-850 hover:border-slate-700 bg-obsidian-950/20'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-bold text-foreground truncate">{incident.title}</h3>
                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                      incident.severity === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      incident.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                      'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                    }`}>
                      {incident.severity}
                    </span>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span className="font-mono">{incident.report_id}</span>
                    <span className={`flex items-center gap-1 border px-2 py-0.5 rounded-full ${timer.style}`}>
                      <Clock size={10} /> {timer.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Viewer / Editor */}
        <div className="lg:col-span-2 space-y-6">
          {selectedIncident ? (
            <Card className="bg-obsidian-950/30 border-obsidian-850">
              <CardHeader className="flex flex-row justify-between items-center border-b border-obsidian-850 pb-4">
                <div>
                  <CardTitle className="text-lg font-mono flex items-center gap-2">
                    <ShieldAlert className="text-red-500" />
                    {selectedIncident.report_id}
                  </CardTitle>
                  <span className="text-xs text-slate-500 mt-1 block">Created at: {new Date(selectedIncident.created_at).toLocaleString()}</span>
                </div>
                
                <div className="flex gap-2">
                  {selectedIncident.status !== 'submitted' && (
                    <>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="btn-cyber-secondary flex items-center gap-1.5 px-4 py-2 text-xs"
                      >
                        <Edit size={14} />
                        {isEditing ? 'Cancel Edit' : 'Edit Report'}
                      </button>
                      <button
                        onClick={() => handleSubmitReport(selectedIncident.report_id)}
                        className="bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-lg px-5 py-2 text-xs hover:shadow-glow-red hover:scale-105 transition-all flex items-center gap-1.5"
                      >
                        <Send size={14} />
                        Dispatch to CERT-In
                      </button>
                    </>
                  )}
                  {selectedIncident.status === 'submitted' && (
                    <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-950/20 border border-green-500/20 px-3 py-1.5 rounded-lg">
                      <CheckCircle size={14} /> Formally Submitted
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {isEditing ? (
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Report Title</label>
                        <input
                          type="text"
                          required
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full bg-obsidian-900 border border-obsidian-800 rounded-lg p-2.5 text-sm text-foreground focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Severity Rating</label>
                        <select
                          value={editForm.severity}
                          onChange={(e) => setEditForm({ ...editForm, severity: e.target.value })}
                          className="w-full bg-obsidian-900 border border-obsidian-800 rounded-lg p-2.5 text-sm text-foreground focus:border-red-500 focus:outline-none"
                        >
                          <option value="critical">Critical</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Systems Affected (comma-separated)</label>
                      <input
                        type="text"
                        required
                        value={editForm.systems_affected}
                        onChange={(e) => setEditForm({ ...editForm, systems_affected: e.target.value })}
                        className="w-full bg-obsidian-900 border border-obsidian-800 rounded-lg p-2.5 text-sm text-foreground focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Technical Incident Details</label>
                      <textarea
                        required
                        rows={4}
                        value={editForm.incident_details}
                        onChange={(e) => setEditForm({ ...editForm, incident_details: e.target.value })}
                        className="w-full bg-obsidian-900 border border-obsidian-800 rounded-lg p-2.5 text-sm text-foreground focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Planned / Implemented Mitigation Actions</label>
                      <textarea
                        required
                        rows={3}
                        value={editForm.mitigation_actions}
                        onChange={(e) => setEditForm({ ...editForm, mitigation_actions: e.target.value })}
                        className="w-full bg-obsidian-900 border border-obsidian-800 rounded-lg p-2.5 text-sm text-foreground focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Reporter Name</label>
                        <input
                          type="text"
                          required
                          value={editForm.reporter_name}
                          onChange={(e) => setEditForm({ ...editForm, reporter_name: e.target.value })}
                          className="w-full bg-obsidian-900 border border-obsidian-800 rounded-lg p-2.5 text-sm text-foreground focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Reporter Email</label>
                        <input
                          type="email"
                          required
                          value={editForm.reporter_email}
                          onChange={(e) => setEditForm({ ...editForm, reporter_email: e.target.value })}
                          className="w-full bg-obsidian-900 border border-obsidian-800 rounded-lg p-2.5 text-sm text-foreground focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-3">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-lg text-sm hover:shadow-glow-red hover:scale-105 transition-all"
                      >
                        Save Draft Updates
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-obsidian-850 pb-4">
                      <div>
                        <span className="text-xs text-slate-500 block font-bold">Document Title:</span>
                        <span className="text-sm font-semibold">{selectedIncident.title}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block font-bold">Severity:</span>
                        <span className="text-sm font-semibold capitalize">{selectedIncident.severity}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block font-bold mb-1">Systems / Products Affected:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedIncident.systems_affected || []).map((sys: string, idx: number) => (
                          <span key={idx} className="text-xs bg-obsidian-900 border border-obsidian-800 px-2.5 py-1 rounded-md">
                            {sys}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block font-bold">Technical Description of Threat:</span>
                      <p className="text-sm text-slate-300 bg-obsidian-950/40 p-4 rounded-xl border border-obsidian-850 mt-1 whitespace-pre-wrap leading-relaxed font-mono text-[11px]">
                        {selectedIncident.incident_details}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block font-bold">Remediation Action Plan:</span>
                      <p className="text-sm text-slate-300 bg-obsidian-950/40 p-4 rounded-xl border border-obsidian-850 mt-1 whitespace-pre-wrap leading-relaxed font-mono text-[11px]">
                        {selectedIncident.mitigation_actions}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-obsidian-850 pt-4 text-xs text-slate-400">
                      <div>
                        <span className="text-slate-500 font-bold block">Officer Signature:</span>
                        <span>{selectedIncident.reporter_name} ({selectedIncident.reporter_email})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold block">Regulatory Status:</span>
                        <span className={selectedIncident.status === 'submitted' ? 'text-green-400' : 'text-orange-400'}>
                          {selectedIncident.status === 'submitted' ? 'Filed with CERT-In' : 'Pending Filing'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 rounded-xl bg-obsidian-950/20 border border-obsidian-850/40 text-slate-400">
              <ShieldAlert className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
              <p className="text-sm font-semibold">Select an incident from the list or ingest a CERT-In advisory to generate a draft report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
