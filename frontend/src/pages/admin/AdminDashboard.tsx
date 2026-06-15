import { useState, useEffect } from 'react';
import { 
  Shield, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Layers, 
  Users, 
  Clock, 
  Check, 
  ExternalLink,
  Loader2,
  Calendar,
  Settings,
  Trash2,
  Archive,
  ArchiveRestore,
  Filter,
  FileSpreadsheet,
  Layers2,
  AlertOctagon,
  Tag
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { GlassCard } from '@/components/ui/glass-card';

export function AdminDashboard() {
  // Tabs: 'gaps' | 'upload' | 'approvals' | 'policies' | 'orphans'
  const [activeTab, setActiveTab] = useState<'gaps' | 'upload' | 'approvals' | 'policies' | 'orphans'>('gaps');
  
  // Data states
  const [gaps, setGaps] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [employeesByDept, setEmployeesByDept] = useState<Record<string, any[]>>({});
  const [orphanedDirectives, setOrphanedDirectives] = useState<any[]>([]);
  
  // Filtering states
  const [filterDept, setFilterDept] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [groupByDay, setGroupByDay] = useState(false);
  
  // Selection states (for Bulk Actions)
  const [selectedGapIds, setSelectedGapIds] = useState<string[]>([]);
  
  // Loading & Action states
  const [loadingGaps, setLoadingGaps] = useState(false);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Upload states
  const [circularFile, setCircularFile] = useState<File | null>(null);
  const [uploadingCircular, setUploadingCircular] = useState(false);
  
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyDept, setPolicyDept] = useState('DEPT-COMPLIANCE');
  const [policyVersion, setPolicyVersion] = useState('1.0.0');
  const [uploadingPolicy, setUploadingPolicy] = useState(false);

  // Message banners
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Reassignment inline modal/state
  const [reassigningGapId, setReassigningGapId] = useState<string | null>(null);
  const [selectedNewEmpId, setSelectedNewEmpId] = useState('');
  
  // Bulk controls
  const [bulkHOD, setBulkHOD] = useState('');
  const [bulkSeverity, setBulkSeverity] = useState('');
  const [bulkEmployee, setBulkEmployee] = useState('');

  // Manual routing for orphans
  const [routingOrphanId, setRoutingOrphanId] = useState<string | null>(null);
  const [orphanRouteDept, setOrphanRouteDept] = useState('DEPT-COMPLIANCE');

  const fetchGaps = async () => {
    setLoadingGaps(true);
    try {
      const res = await apiClient.get('/api/gaps/all');
      setGaps(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGaps(false);
    }
  };

  const fetchPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const res = await apiClient.get('/api/admin/policies/');
      setPolicies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/api/gaps/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrphans = async () => {
    try {
      const res = await apiClient.get('/api/gaps/orphaned');
      setOrphanedDirectives(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Seed list of employees per department for reassign dropdown
  const seedEmployeeList = async () => {
    try {
      const depts = [
        "DEPT-COMPLIANCE", "DEPT-LEGAL", "DEPT-RISK", "DEPT-OPS", 
        "DEPT-IT-CYBER", "DEPT-HR", "DEPT-FINANCE", "DEPT-CREDIT"
      ];
      const mapping: Record<string, any[]> = {};
      for (const dId of depts) {
        const cleanCode = dId.replace("DEPT-", "");
        mapping[dId] = [
          { emp_id: `EMP-${cleanCode}-001`, name: `${cleanCode} Officer A` },
          { emp_id: `EMP-${cleanCode}-002`, name: `${cleanCode} Officer B` },
          { emp_id: `EMP-${cleanCode}-HEAD`, name: `${cleanCode} Head` }
        ];
      }
      setEmployeesByDept(mapping);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGaps();
    fetchPolicies();
    fetchNotifications();
    seedEmployeeList();
    fetchOrphans();
  }, []);

  const triggerToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4500);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4500);
    }
  };

  const handleUploadCircular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circularFile) return;
    setUploadingCircular(true);
    const formData = new FormData();
    formData.append('file', circularFile);

    try {
      const res = await apiClient.post('/api/circulars/upload', formData, {
        timeout: 120000,
      });
      if (res.data.status === 'duplicate') {
        triggerToast('Circular already uploaded: Linked as duplicate.', true);
      } else {
        const supersededMsg = res.data.superseded_gaps_count > 0 
          ? ` (superseded ${res.data.superseded_gaps_count} old gaps)` 
          : '';
        triggerToast(`RBI Circular ingested successfully! Intent: ${res.data.intent.toUpperCase()}${supersededMsg}. Detected ${res.data.new_gaps_detected} gaps.`);
        setCircularFile(null);
        fetchGaps();
        fetchNotifications();
        fetchOrphans();
      }
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Circular upload failed', true);
    } finally {
      setUploadingCircular(false);
    }
  };

  const handleUploadPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyFile || !policyTitle) return;
    setUploadingPolicy(true);
    const formData = new FormData();
    formData.append('file', policyFile);
    formData.append('title', policyTitle);
    formData.append('department', policyDept);
    formData.append('version', policyVersion);

    try {
      await apiClient.post('/api/admin/policies/upload', formData, {
        timeout: 120000,
      });
      triggerToast('Bank Policy document ingested and compiled successfully.');
      setPolicyFile(null);
      setPolicyTitle('');
      fetchPolicies();
      fetchNotifications();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Policy upload failed', true);
    } finally {
      setUploadingPolicy(false);
    }
  };

  const handleReassign = async (gapId: string) => {
    if (!selectedNewEmpId) return;
    setActionLoading(gapId);
    try {
      const formData = new FormData();
      formData.append('new_employee_id', selectedNewEmpId);
      await apiClient.patch(`/api/gaps/${gapId}/reassign`, formData);
      triggerToast(`Task successfully reassigned to ${selectedNewEmpId}.`);
      setReassigningGapId(null);
      setSelectedNewEmpId('');
      fetchGaps();
      fetchNotifications();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Reassignment failed', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelGap = async (gapId: string) => {
    const reason = prompt('Please enter a cancellation justification (Mandatory):');
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      alert('Cancellation reason is mandatory!');
      return;
    }
    setActionLoading(gapId);
    try {
      const formData = new FormData();
      formData.append('reason', reason);
      await apiClient.patch(`/api/gaps/${gapId}/cancel`, formData);
      triggerToast('Gap cancelled successfully.');
      fetchGaps();
      fetchNotifications();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Cancel request failed', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveFix = async (gapId: string) => {
    setActionLoading(gapId);
    try {
      await apiClient.post(`/api/gaps/${gapId}/approve-fix`);
      triggerToast('Revisions approved! Core policy updated.');
      fetchGaps();
      fetchPolicies();
      fetchNotifications();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Approval failed', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveOrphan = async (gapId: string) => {
    setActionLoading(gapId);
    try {
      const formData = new FormData();
      formData.append('department_id', orphanRouteDept);
      await apiClient.put(`/api/gaps/admin/circulars/${gapId}/resolve-orphan`, formData);
      triggerToast(`Directive successfully routed to ${orphanRouteDept}.`);
      setRoutingOrphanId(null);
      fetchGaps();
      fetchOrphans();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Routing failed', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchivePolicy = async (policyId: string) => {
    setActionLoading(policyId);
    try {
      await apiClient.patch(`/api/admin/policies/${policyId}/archive`);
      triggerToast('Policy archived successfully.');
      fetchPolicies();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Archive failed', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnarchivePolicy = async (policyId: string) => {
    setActionLoading(policyId);
    try {
      await apiClient.patch(`/api/admin/policies/${policyId}/unarchive`);
      triggerToast('Policy restored.');
      fetchPolicies();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Unarchive failed', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to permanently delete this policy?')) return;
    setActionLoading(policyId);
    try {
      await apiClient.delete(`/api/admin/policies/${policyId}`);
      triggerToast('Policy deleted permanently.');
      fetchPolicies();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Delete failed', true);
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk Actions
  const handleBulkAssign = async () => {
    if (selectedGapIds.length === 0 || !bulkHOD) return;
    try {
      const formData = new FormData();
      selectedGapIds.forEach(id => formData.append('gap_ids', id));
      formData.append('hod_id', bulkHOD);
      if (bulkEmployee) formData.append('employee_id', bulkEmployee);

      await apiClient.post('/api/gaps/bulk-assign', formData);
      triggerToast(`Bulk reassigned ${selectedGapIds.length} gaps.`);
      setSelectedGapIds([]);
      fetchGaps();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Bulk assignment failed', true);
    }
  };

  const handleBulkSeverity = async () => {
    if (selectedGapIds.length === 0 || !bulkSeverity) return;
    try {
      const formData = new FormData();
      selectedGapIds.forEach(id => formData.append('gap_ids', id));
      formData.append('severity', bulkSeverity);

      await apiClient.post('/api/gaps/bulk-severity', formData);
      triggerToast(`Bulk updated severity for ${selectedGapIds.length} gaps.`);
      setSelectedGapIds([]);
      fetchGaps();
    } catch (err: any) {
      triggerToast(err.response?.data?.detail || 'Bulk severity update failed', true);
    }
  };

  const exportSelectedToCSV = () => {
    if (selectedGapIds.length === 0) return;
    const selectedGaps = gaps.filter(g => selectedGapIds.includes(g.gap_id));
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Gap ID,Circular Title,Clause Text,Severity,Department,Assignee,Status,Due Date\n";
    
    selectedGaps.forEach(g => {
      const row = [
        g.gap_id,
        `"${(g.circular_title || '').replace(/"/g, '""')}"`,
        `"${(g.clause_text || '').replace(/"/g, '""')}"`,
        g.severity,
        g.department_id || 'N/A',
        g.assigned_employee || 'Unassigned',
        g.triage_status,
        g.due_date ? new Date(g.due_date).toLocaleDateString() : 'N/A'
      ].join(",");
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `suraksha_gaps_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle selection
  const toggleSelectGap = (gapId: string) => {
    setSelectedGapIds(prev => 
      prev.includes(gapId) ? prev.filter(id => id !== gapId) : [...prev, gapId]
    );
  };

  const toggleSelectAll = (visibleGaps: any[]) => {
    const visibleIds = visibleGaps.map(g => g.gap_id);
    const allSelected = visibleIds.every(id => selectedGapIds.includes(id));
    if (allSelected) {
      setSelectedGapIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedGapIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Analytics Calculation
  const getDeptAnalyticsData = () => {
    const depts = ["Compliance", "IT Security", "Risk Management", "Finance", "Operations", "Credit", "HR"];
    const mapper: Record<string, string> = {
      "Compliance": "DEPT-COMPLIANCE",
      "IT Security": "DEPT-IT-CYBER",
      "Risk Management": "DEPT-RISK",
      "Finance": "DEPT-FINANCE",
      "Operations": "DEPT-OPS",
      "Credit": "DEPT-CREDIT",
      "HR": "DEPT-HR"
    };
    return depts.map(d => {
      const code = mapper[d];
      return {
        name: d,
        value: gaps.filter(g => g.department_id === code).length
      };
    }).filter(d => d.value > 0);
  };

  const getSeverityAnalyticsData = () => {
    const levels = ["critical", "high", "medium", "low"];
    return levels.map(l => ({
      name: l.toUpperCase(),
      value: gaps.filter(g => g.severity === l).length
    }));
  };

  // Filter Gaps
  const getFilteredGaps = () => {
    return gaps.filter(g => {
      if (filterDept && g.department_id !== filterDept) return false;
      if (filterSeverity && g.severity !== filterSeverity) return false;
      if (filterStatus && g.triage_status !== filterStatus) return false;
      return true;
    });
  };

  const filteredGaps = getFilteredGaps();

  // Timeline view calculation
  const getGapsGroupedByDay = () => {
    const groups: Record<string, any[]> = {};
    filteredGaps.forEach(g => {
      const dateStr = new Date(g.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(g);
    });
    return groups;
  };

  const activeGapsCount = gaps.filter(g => g.triage_status === 'assigned' || g.triage_status === 'open').length;
  const resolvedGapsPendingApproval = gaps.filter(g => g.triage_status === 'resolved' && g.is_fixed).length;
  const newPolicyRequiredGaps = gaps.filter(g => g.gap_type === 'new_policy_required');

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-cyan/15 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-cyber-cyan flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyber-cyan animate-pulse-glow" />
            ADMINISTRATOR COMMAND CENTER
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Real-time compliance monitoring, prefix-based category routing, and cross-reference regression logs.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { fetchGaps(); fetchPolicies(); fetchNotifications(); fetchOrphans(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-cyber-cyan/35 hover:border-cyber-cyan bg-obsidian-950 hover:bg-cyber-cyan/5 rounded text-xs font-mono text-cyber-cyan"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync Data
          </button>
        </div>
      </div>

      {/* Notifications Banners */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 text-emerald-400 text-xs font-mono rounded">
          {successMsg.toUpperCase()}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-950/30 border border-red-500/40 text-red-400 text-xs font-mono rounded">
          {errorMsg.toUpperCase()}
        </div>
      )}

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 border-cyber-cyan/15">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Policy Gaps</span>
          <h3 className="text-3xl font-bold font-mono text-cyber-cyan mt-1">{activeGapsCount}</h3>
        </GlassCard>
        <GlassCard className="p-4 border-cyber-magenta/15">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Awaiting HOD Approvals</span>
          <h3 className="text-3xl font-bold font-mono text-cyber-magenta mt-1">{resolvedGapsPendingApproval}</h3>
        </GlassCard>
        <GlassCard className="p-4 border-amber-500/15">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">New Policies Required</span>
          <h3 className="text-3xl font-bold font-mono text-amber-400 mt-1">{newPolicyRequiredGaps.length}</h3>
        </GlassCard>
        <GlassCard className="p-4 border-cyber-green/15">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Orphaned Directives</span>
          <h3 className="text-3xl font-bold font-mono text-cyber-green mt-1">{orphanedDirectives.length}</h3>
        </GlassCard>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-cyber-cyan/10">
        {(['gaps', 'upload', 'approvals', 'policies', 'orphans'] as const).map(tab => {
          const active = activeTab === tab;
          const labels = {
            gaps: 'Remediation Queue',
            upload: 'Ingest Center',
            approvals: `Pending Updates (${resolvedGapsPendingApproval})`,
            policies: 'Core Policy Repository',
            orphans: `Orphaned Directives (${orphanedDirectives.length})`
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 font-mono text-xs font-bold transition-all border-b-2 ${
                active 
                  ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* GAPS PANEL */}
      {activeTab === 'gaps' && (
        <div className="space-y-6">
          {/* SVG Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard className="p-4 border-cyber-cyan/10">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase mb-3">Gaps by Department</h3>
              <div className="flex justify-center items-center h-48">
                {getDeptAnalyticsData().length === 0 ? (
                  <span className="text-xs text-slate-500 font-mono">No active gaps to chart</span>
                ) : (
                  <svg width="100%" height="100%" viewBox="0 0 400 180">
                    {getDeptAnalyticsData().map((item, idx) => {
                      const barWidth = (item.value / Math.max(...getDeptAnalyticsData().map(d => d.value))) * 220;
                      const yPos = idx * 24 + 10;
                      return (
                        <g key={item.name}>
                          <text x="10" y={yPos + 14} fill="#94a3b8" className="text-[10px] font-mono">{item.name}</text>
                          <rect x="130" y={yPos} width={barWidth} height="16" fill="#06b6d4" rx="2" className="transition-all hover:fill-[#d946ef]" />
                          <text x={135 + barWidth} y={yPos + 12} fill="#06b6d4" className="text-[10px] font-mono font-bold">{item.value}</text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </GlassCard>
            
            <GlassCard className="p-4 border-cyber-cyan/10">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase mb-3">Gaps by Severity</h3>
              <div className="flex justify-center items-center h-48">
                {getSeverityAnalyticsData().filter(d => d.value > 0).length === 0 ? (
                  <span className="text-xs text-slate-500 font-mono">No active gaps to chart</span>
                ) : (
                  <svg width="100%" height="100%" viewBox="0 0 400 180">
                    {getSeverityAnalyticsData().map((item, idx) => {
                      const barHeight = (item.value / Math.max(1, ...getSeverityAnalyticsData().map(d => d.value))) * 110;
                      const xPos = idx * 80 + 50;
                      const severityColors = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"];
                      return (
                        <g key={item.name}>
                          <rect x={xPos} y={130 - barHeight} width="40" height={barHeight} fill={severityColors[idx]} rx="2" />
                          <text x={xPos + 20} y={145} textAnchor="middle" fill="#94a3b8" className="text-[9px] font-mono">{item.name}</text>
                          <text x={xPos + 20} y={125 - barHeight} textAnchor="middle" fill="#f8fafc" className="text-[10px] font-mono font-bold">{item.value}</text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Filters and Controls */}
          <GlassCard className="p-4 border-cyber-cyan/10 font-mono text-xs flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-cyber-cyan" />
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-obsidian-950 border border-cyber-cyan/20 text-slate-300 p-1.5 rounded"
              >
                <option value="">All Departments</option>
                <option value="DEPT-COMPLIANCE">Compliance</option>
                <option value="DEPT-IT-CYBER">IT Security</option>
                <option value="DEPT-RISK">Risk Management</option>
                <option value="DEPT-FINANCE">Finance</option>
                <option value="DEPT-OPS">Operations</option>
                <option value="DEPT-CREDIT">Credit</option>
                <option value="DEPT-HR">HR</option>
              </select>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-obsidian-950 border border-cyber-cyan/20 text-slate-300 p-1.5 rounded"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-obsidian-950 border border-cyber-cyan/20 text-slate-300 p-1.5 rounded"
              >
                <option value="">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="open">Open (Unassigned)</option>
                <option value="resolved">Resolved</option>
                <option value="superseded">Superseded</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 ml-2">
                <input 
                  type="checkbox" 
                  checked={groupByDay} 
                  onChange={(e) => setGroupByDay(e.target.checked)} 
                  className="rounded border-cyber-cyan/20 bg-obsidian-950" 
                />
                Group by Day (Timeline)
              </label>
            </div>
            {selectedGapIds.length > 0 && (
              <div className="flex gap-2 items-center bg-cyber-cyan/5 border border-cyber-cyan/25 px-3 py-1 rounded">
                <span className="font-bold text-cyber-cyan text-[10px] uppercase">{selectedGapIds.length} Selected</span>
                <button
                  onClick={exportSelectedToCSV}
                  className="p-1 bg-obsidian-950 hover:bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan rounded flex items-center gap-1 text-[10px]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
                </button>
                <div className="h-4 w-px bg-cyber-cyan/20" />
                <select
                  value={bulkHOD}
                  onChange={(e) => setBulkHOD(e.target.value)}
                  className="bg-obsidian-950 border border-cyber-cyan/25 text-slate-300 text-[10px] p-1 rounded"
                >
                  <option value="">Bulk Assign HOD</option>
                  <option value="DEPT-COMPLIANCE">Compliance HOD</option>
                  <option value="DEPT-IT-CYBER">IT Security HOD</option>
                  <option value="DEPT-RISK">Risk Management HOD</option>
                  <option value="DEPT-FINANCE">Finance HOD</option>
                  <option value="DEPT-OPS">Operations HOD</option>
                  <option value="DEPT-CREDIT">Credit HOD</option>
                  <option value="DEPT-HR">HR HOD</option>
                </select>
                <button
                  onClick={handleBulkAssign}
                  disabled={!bulkHOD}
                  className="px-2 py-1 bg-cyber-cyan hover:scale-105 transition-transform text-obsidian-950 font-bold rounded text-[10px]"
                >
                  Apply
                </button>
                <select
                  value={bulkSeverity}
                  onChange={(e) => setBulkSeverity(e.target.value)}
                  className="bg-obsidian-950 border border-cyber-cyan/25 text-slate-300 text-[10px] p-1 rounded"
                >
                  <option value="">Bulk Severity</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button
                  onClick={handleBulkSeverity}
                  disabled={!bulkSeverity}
                  className="px-2 py-1 bg-cyber-cyan hover:scale-105 transition-transform text-obsidian-950 font-bold rounded text-[10px]"
                >
                  Set
                </button>
              </div>
            )}
          </GlassCard>

          {/* New Policy Required Alert */}
          {newPolicyRequiredGaps.length > 0 && (
            <div className="p-4 bg-amber-950/20 border border-amber-500/35 rounded-xl font-mono text-xs text-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-500 animate-bounce" />
                <div>
                  <p className="font-bold">⚠️ NEW REGULATORY DOMAINS DETECTED</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">The engine parsed {newPolicyRequiredGaps.length} circular guidelines that do not map to any existing policies. New bank policies need to be created.</p>
                </div>
              </div>
              <button 
                onClick={() => { setFilterStatus(''); setFilterSeverity(''); setFilterDept(''); }}
                className="px-3 py-1 bg-amber-500 text-obsidian-950 font-bold rounded hover:scale-105 transition-transform"
              >
                Inspect Guidelines
              </button>
            </div>
          )}

          {/* Gaps Queue */}
          <GlassCard className="p-6 border-cyber-cyan/10">
            {loadingGaps ? (
              <div className="text-center py-12 text-slate-400 font-mono text-xs animate-pulse">Syncing ledger data...</div>
            ) : filteredGaps.length === 0 ? (
              <div className="text-center py-16 text-slate-500 font-mono text-xs">No matching gaps found. Adjust filters or upload a circular to verify compliance.</div>
            ) : groupByDay ? (
              // Grouped chronological view
              <div className="space-y-6">
                {Object.entries(getGapsGroupedByDay()).map(([day, items]) => (
                  <div key={day} className="space-y-2">
                    <h3 className="text-xs font-mono font-bold text-cyber-cyan border-b border-cyber-cyan/15 pb-1 flex items-center gap-1.5 uppercase">
                      <Clock className="w-3.5 h-3.5" /> {day}
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {items.map(gap => (
                        <div key={gap.gap_id} className="p-3 bg-obsidian-950/60 border border-cyber-cyan/10 rounded-lg flex flex-wrap justify-between items-center gap-4 text-xs font-mono">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={selectedGapIds.includes(gap.gap_id)}
                              onChange={() => toggleSelectGap(gap.gap_id)}
                              className="rounded border-cyber-cyan/20 bg-obsidian-950 text-cyber-cyan"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-cyber-magenta">{gap.gap_id}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                                  gap.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                                  gap.severity === 'high' ? 'bg-amber-500/10 text-amber-400' :
                                  'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {gap.severity.toUpperCase()}
                                </span>
                                {gap.source === 'fix_regression' && (
                                  <span className="px-1.5 py-0.2 bg-purple-500/15 text-purple-400 rounded text-[8px] font-bold">REGRESSION</span>
                                )}
                              </div>
                              <p className="text-slate-200 mt-1 font-sans">{gap.circular_title}</p>
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5" title={gap.clause_text}>{gap.clause_text}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-cyber-blue font-bold">{gap.department_id?.replace("DEPT-", "")}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{gap.assigned_employee || 'Unassigned'}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              gap.triage_status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              gap.triage_status === 'superseded' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              gap.triage_status === 'cancelled' ? 'bg-slate-700/20 text-slate-500' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {gap.triage_status.toUpperCase()}
                            </span>
                            <div className="flex gap-1">
                              {gap.triage_status === 'assigned' && (
                                <button 
                                  onClick={() => handleCancelGap(gap.gap_id)}
                                  className="p-1 hover:text-red-400 text-slate-400 rounded hover:bg-white/5"
                                  title="Cancel Gap"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Table List View
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-cyber-cyan/20 text-slate-400 text-[10px] uppercase">
                      <th className="pb-3 pl-2">
                        <input 
                          type="checkbox" 
                          checked={filteredGaps.length > 0 && filteredGaps.every(g => selectedGapIds.includes(g.gap_id))}
                          onChange={() => toggleSelectAll(filteredGaps)}
                          className="rounded border-cyber-cyan/20 bg-obsidian-950"
                        />
                      </th>
                      <th className="pb-3">Gap ID</th>
                      <th className="pb-3">Circular Guideline</th>
                      <th className="pb-3 text-center">Page</th>
                      <th className="pb-3">Policy Match</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Assignee</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-cyan/5">
                    {filteredGaps.map(gap => (
                      <tr key={gap.gap_id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 pl-2">
                          <input 
                            type="checkbox" 
                            checked={selectedGapIds.includes(gap.gap_id)}
                            onChange={() => toggleSelectGap(gap.gap_id)}
                            className="rounded border-cyber-cyan/20 bg-obsidian-950 text-cyber-cyan"
                          />
                        </td>
                        <td className="py-4 font-bold text-cyber-magenta">
                          {gap.gap_id}
                          <div className="mt-0.5">
                            <span className={`px-1 rounded text-[8px] font-bold uppercase ${
                              gap.severity === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              gap.severity === 'high' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-blue-500/10 text-blue-400'
                            }`}>
                              {gap.severity}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 max-w-[320px]">
                          <p className="text-slate-200 font-semibold truncate" title={gap.circular_title}>{gap.circular_title}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5" title={gap.clause_text}>{gap.clause_text}</p>
                        </td>
                        <td className="py-4 text-center font-bold text-cyber-cyan">{gap.page_number}</td>
                        <td className="py-4 text-slate-300 font-medium">{gap.top_policy_title || 'N/A'}</td>
                        <td className="py-4 text-cyber-blue font-bold">
                          {gap.department_id?.replace("DEPT-", "")}
                          {gap.is_ambiguous && (
                            <span className="block text-[8px] text-purple-400 font-bold uppercase mt-0.5">Ambiguous</span>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="text-slate-300 font-semibold">{gap.assigned_employee || 'Unassigned'}</div>
                          {gap.due_date && (
                            <div className="text-[9px] text-slate-500">Due: {new Date(gap.due_date).toLocaleDateString()}</div>
                          )}
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            gap.triage_status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            gap.triage_status === 'superseded' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            gap.triage_status === 'cancelled' ? 'bg-slate-700/20 text-slate-500' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {gap.triage_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 text-right pr-2">
                          <div className="flex gap-2 justify-end">
                            {(gap.triage_status === 'assigned' || gap.triage_status === 'open') && (
                              <>
                                <button 
                                  onClick={() => setReassigningGapId(gap.gap_id)}
                                  className="px-2 py-1 bg-cyber-blue/10 hover:bg-cyber-blue text-cyber-blue hover:text-white border border-cyber-blue/30 rounded text-[10px] font-bold transition-all"
                                >
                                  Assign
                                </button>
                                <button 
                                  onClick={() => handleCancelGap(gap.gap_id)}
                                  disabled={actionLoading === gap.gap_id}
                                  className="px-2 py-1 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/25 rounded text-[10px] font-bold transition-all"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                          {reassigningGapId === gap.gap_id && (
                            <div className="mt-2 flex gap-1 justify-end items-center">
                              <select
                                value={selectedNewEmpId}
                                onChange={(e) => setSelectedNewEmpId(e.target.value)}
                                className="bg-obsidian-950 border border-cyber-cyan/30 text-slate-300 text-[10px] px-1 py-0.5 rounded outline-none"
                              >
                                <option value="">Select Employee</option>
                                {(employeesByDept[gap.department_id] || []).map(emp => (
                                  <option key={emp.emp_id} value={emp.emp_id}>{emp.name} ({emp.emp_id})</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => handleReassign(gap.gap_id)}
                                className="p-1 bg-cyber-cyan text-obsidian-950 rounded hover:scale-105 transition-transform"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* ORPHANS TAB */}
      {activeTab === 'orphans' && (
        <GlassCard className="p-6 border-cyber-cyan/10 font-mono text-xs">
          <h2 className="text-sm font-bold text-cyber-cyan uppercase mb-4">Orphaned Directives (Require Manual Department Routing)</h2>
          {orphanedDirectives.length === 0 ? (
            <div className="text-center py-16 text-slate-500">No orphaned directives in queue. All circular directives auto-routed successfully.</div>
          ) : (
            <div className="space-y-4">
              {orphanedDirectives.map(gap => (
                <div key={gap.gap_id} className="p-4 bg-obsidian-950 border border-cyber-magenta/20 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div>
                      <span className="px-2 py-0.5 bg-cyber-magenta/15 text-cyber-magenta border border-cyber-magenta/30 rounded text-[9px] font-bold uppercase mr-2">Orphaned</span>
                      <span className="font-bold text-slate-200">{gap.gap_id}</span>
                      <h4 className="text-slate-300 font-bold mt-1">Circular: {gap.circular_title} (Page {gap.page_number})</h4>
                    </div>
                    <div className="flex gap-2 items-center">
                      <select
                        value={orphanRouteDept}
                        onChange={(e) => setOrphanRouteDept(e.target.value)}
                        className="bg-obsidian-950 border border-cyber-cyan/25 text-slate-300 p-1.5 rounded"
                      >
                        <option value="DEPT-COMPLIANCE">Compliance</option>
                        <option value="DEPT-IT-CYBER">IT Security</option>
                        <option value="DEPT-RISK">Risk Management</option>
                        <option value="DEPT-FINANCE">Finance</option>
                        <option value="DEPT-OPS">Operations</option>
                        <option value="DEPT-CREDIT">Credit</option>
                        <option value="DEPT-HR">HR</option>
                      </select>
                      <button
                        onClick={() => { setRoutingOrphanId(gap.gap_id); handleResolveOrphan(gap.gap_id); }}
                        disabled={actionLoading === gap.gap_id}
                        className="px-3 py-1.5 bg-cyber-cyan hover:bg-cyber-cyan/95 text-obsidian-950 font-bold rounded hover:scale-105 transition-transform"
                      >
                        Route Gap
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-obsidian-900 border border-cyber-cyan/5 rounded text-[11px] text-slate-300">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">RBI Directive text:</p>
                    <p className="mt-0.5 font-sans leading-relaxed text-slate-200">{gap.clause_text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* UPLOAD CENTER */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-6 border-cyber-cyan/10">
            <h2 className="text-sm font-bold font-mono text-cyber-cyan mb-4 uppercase flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyber-cyan" />
              Upload RBI Circular
            </h2>
            <form onSubmit={handleUploadCircular} className="space-y-4 font-mono text-xs">
              <div className="border border-dashed border-cyber-cyan/30 hover:border-cyber-cyan/70 p-6 rounded-xl flex flex-col items-center justify-center bg-obsidian-950/40 cursor-pointer">
                <FileText className="w-10 h-10 text-slate-400 mb-2" />
                <input 
                  type="file" 
                  accept=".pdf,.txt,.docx" 
                  onChange={(e) => setCircularFile(e.target.files?.[0] || null)}
                  className="text-slate-300 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-2">PDF, DOCX, TXT (Max 50MB)</span>
              </div>
              {circularFile && (
                <p className="text-cyber-green text-[10px] font-bold">Selected: {circularFile.name}</p>
              )}
              <button
                type="submit"
                disabled={uploadingCircular || !circularFile}
                className="w-full py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-blue text-obsidian-950 font-bold rounded-lg hover:shadow-glow-cyan transition-all flex items-center justify-center gap-2 text-xs"
              >
                {uploadingCircular ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Ingesting & Segmenting RBI Circular...</>
                ) : (
                  <>Ingest Circular</>
                )}
              </button>
            </form>
          </GlassCard>

          <GlassCard className="p-6 border-cyber-cyan/10">
            <h2 className="text-sm font-bold font-mono text-cyber-cyan mb-4 uppercase flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyber-cyan" />
              Upload Core Bank Policy
            </h2>
            <form onSubmit={handleUploadPolicy} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Policy Title</label>
                <input 
                  type="text" 
                  value={policyTitle}
                  onChange={(e) => setPolicyTitle(e.target.value)}
                  placeholder="e.g. KYC Compliance Policy"
                  className="w-full p-2 bg-obsidian-950 border border-cyber-cyan/20 focus:border-cyber-cyan rounded text-slate-200 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Department Owner</label>
                  <select 
                    value={policyDept}
                    onChange={(e) => setPolicyDept(e.target.value)}
                    className="w-full p-2 bg-obsidian-950 border border-cyber-cyan/20 rounded text-slate-200 outline-none"
                  >
                    <option value="DEPT-COMPLIANCE">Compliance</option>
                    <option value="DEPT-LEGAL">Legal</option>
                    <option value="DEPT-RISK">Risk Management</option>
                    <option value="DEPT-OPS">Operations</option>
                    <option value="DEPT-FINANCE">Finance</option>
                    <option value="DEPT-IT-CYBER">IT Security</option>
                    <option value="DEPT-CREDIT">Credit</option>
                    <option value="DEPT-HR">HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Version tag</label>
                  <input 
                    type="text" 
                    value={policyVersion}
                    onChange={(e) => setPolicyVersion(e.target.value)}
                    className="w-full p-2 bg-obsidian-950 border border-cyber-cyan/20 rounded text-slate-200 outline-none"
                  />
                </div>
              </div>
              <div className="border border-dashed border-cyber-cyan/30 hover:border-cyber-cyan/70 p-4 rounded-xl flex flex-col items-center justify-center bg-obsidian-950/40 cursor-pointer">
                <input 
                  type="file" 
                  accept=".pdf,.txt,.docx"
                  onChange={(e) => setPolicyFile(e.target.files?.[0] || null)}
                  className="text-slate-300 font-mono text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={uploadingPolicy || !policyFile || !policyTitle}
                className="w-full py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-blue text-obsidian-950 font-bold rounded-lg hover:shadow-glow-cyan transition-all flex items-center justify-center gap-2 text-xs"
              >
                {uploadingPolicy ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Ingesting & Segmenting Policy...</>
                ) : (
                  <>Ingest Core Policy</>
                )}
              </button>
            </form>
          </GlassCard>
        </div>
      )}

      {/* CORE POLICY APPROVALS */}
      {activeTab === 'approvals' && (
        <GlassCard className="p-6 border-cyber-cyan/10">
          <h2 className="text-sm font-bold font-mono text-cyber-cyan uppercase mb-4">Gaps Resolved Pending Core Policy Integration</h2>
          {gaps.filter(g => g.triage_status === 'resolved' && g.is_fixed).length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-mono text-xs">No resolved gaps require core policy integration. Gaps fixed by staff will appear here.</div>
          ) : (
            <div className="space-y-4">
              {gaps.filter(g => g.triage_status === 'resolved' && g.is_fixed).map(gap => (
                <div key={gap.gap_id} className="p-4 bg-obsidian-950 border border-cyber-green/35 rounded-xl font-mono text-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold uppercase mr-2">Resolved</span>
                      <span className="text-cyber-cyan font-bold">{gap.gap_id}</span>
                      <h4 className="text-slate-200 font-bold mt-1">Core Policy Target: {gap.top_policy_title}</h4>
                    </div>
                    <button
                      onClick={() => handleApproveFix(gap.gap_id)}
                      disabled={actionLoading === gap.gap_id}
                      className="px-4 py-2 bg-cyber-green hover:bg-cyber-green/90 text-obsidian-950 font-bold rounded flex items-center gap-1 hover:scale-105 transition-all text-xs"
                    >
                      {actionLoading === gap.gap_id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Change Core Policy
                    </button>
                  </div>
                  <div className="p-3 bg-obsidian-900 border border-cyber-cyan/5 rounded text-[11px] text-slate-300">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Guideline Obligation:</p>
                    <p className="mt-0.5 font-sans leading-relaxed text-slate-200">{gap.clause_text}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-2">Employee Revised Policy Text:</p>
                    <p className="mt-0.5 font-sans whitespace-pre-line bg-obsidian-950 p-2 rounded text-slate-200 italic leading-relaxed border border-cyber-cyan/10">{gap.fixed_policy_content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* CORE POLICIES LIST */}
      {activeTab === 'policies' && (
        <GlassCard className="p-6 border-cyber-cyan/10">
          <h2 className="text-sm font-bold font-mono text-cyber-cyan uppercase mb-4">Core Active Bank Policies</h2>
          {policies.length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-mono text-xs">No active policies found in the database registry.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map(policy => {
                const pid = policy.policy_id || policy.id;
                const isArchived = policy.status === 'archived';
                return (
                  <div key={pid} className="p-4 bg-obsidian-950/60 border border-cyber-cyan/10 rounded-xl font-mono text-xs flex flex-col justify-between h-48 hover:border-cyber-cyan/40 transition-colors">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-slate-200 font-bold text-sm truncate max-w-[200px]" title={policy.title}>{policy.title}</h4>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold ${
                            isArchived 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {(policy.status || 'active').toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20 rounded-[4px] text-[9px] font-bold uppercase">{policy.version}</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 bg-obsidian-900 px-2 py-0.5 rounded inline-block mt-1 font-bold">Owner: {policy.department}</span>
                      <p className="text-slate-400 mt-3 line-clamp-3 leading-relaxed font-sans">{policy.content}</p>
                    </div>
                    <div className="border-t border-cyber-cyan/5 pt-2 mt-2 flex justify-between items-center text-[10px] text-slate-500">
                      <span>Active from: {new Date(policy.valid_from).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        {isArchived ? (
                          <button
                            onClick={() => handleUnarchivePolicy(pid)}
                            disabled={actionLoading === pid}
                            className="p-1 hover:text-cyber-green text-slate-400 hover:scale-110 transition-all disabled:opacity-50"
                            title="Restore to Active"
                          >
                            <ArchiveRestore className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchivePolicy(pid)}
                            disabled={actionLoading === pid}
                            className="p-1 hover:text-amber-400 text-slate-400 hover:scale-110 transition-all disabled:opacity-50"
                            title="Archive Policy"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePolicy(pid)}
                          disabled={actionLoading === pid}
                          className="p-1 hover:text-red-400 text-slate-400 hover:scale-110 transition-all disabled:opacity-50"
                          title="Delete Policy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}