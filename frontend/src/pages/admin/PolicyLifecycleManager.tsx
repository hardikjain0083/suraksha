import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { Upload, X, Loader2, Pencil, Archive, ArchiveRestore, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';

interface Policy {
  id: string;
  policy_id: string;
  title: string;
  version: string;
  department: string;
  status: string;
  valid_from?: string;
  valid_until?: string;
}

type ModalMode = 'add' | 'edit' | null;

const DEPARTMENTS = [
  { value: 'DEPT-COMPLIANCE', label: 'Compliance' },
  { value: 'DEPT-LEGAL', label: 'Legal' },
  { value: 'DEPT-RISK', label: 'Risk' },
  { value: 'DEPT-OPS', label: 'Operations' },
  { value: 'DEPT-BRANCH-BANKING', label: 'Branch Banking' },
  { value: 'DEPT-IT-CYBER', label: 'IT / Cybersecurity' },
  { value: 'DEPT-FINANCE', label: 'Finance / Accounts' },
  { value: 'DEPT-HR', label: 'HR' },
  { value: 'DEPT-RECOVERY', label: 'Recovery / Collections' },
  { value: 'DEPT-TREASURY', label: 'Treasury' },
  { value: 'DEPT-SME-CREDIT', label: 'SME / Retail / Credit' },
  { value: 'DEPT-SECURITY-VIGILANCE', label: 'Security / Vigilance' },
  { value: 'DEPT-CUSTOMER-SERVICE', label: 'Customer Service' },
  { value: 'DEPT-MIS', label: 'MIS / Reporting' },
  { value: 'DEPT-AUDIT', label: 'Audit / Inspection' },
];

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    archived: 'bg-amber-100 text-amber-700 border border-amber-200',
    draft: 'bg-blue-100 text-blue-700 border border-blue-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[s] ?? 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function PolicyLifecycleManager() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload / Edit modal
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<Policy | null>(null);

  // Upload form
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('DEPT-COMPLIANCE');
  const [version, setVersion] = useState('1.0');
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Policy | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Action feedback
  const [actionLoading, setActionLoading] = useState<string | null>(null); // policy_id being acted on

  // Toast notification
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPolicies = () => {
    setLoading(true);
    apiClient.get('/api/admin/policies')
      .then(res => setPolicies(res.data))
      .catch(err => {
        if (import.meta.env.DEV) console.error(err);
        showToast('Failed to load policies', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPolicies(); }, []);

  // ── Open modals ────────────────────────────────────────────
  const openAddModal = () => {
    setEditTarget(null);
    setTitle('');
    setVersion('1.0');
    setDepartment('DEPT-COMPLIANCE');
    setFile(null);
    setModalMode('add');
  };

  const openEditModal = (pol: Policy) => {
    setEditTarget(pol);
    setTitle(pol.title);
    setVersion(pol.version);
    setDepartment(pol.department);
    setModalMode('edit');
  };

  const closeModal = () => { setModalMode(null); setEditTarget(null); };

  // ── Upload ─────────────────────────────────────────────────
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return showToast('Please select a file', 'error');
    setSaving(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('department', department);
    formData.append('version', version);
    try {
      await apiClient.post('/api/admin/policies/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      closeModal();
      fetchPolicies();
      showToast('Policy uploaded successfully');
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      showToast(err?.response?.data?.detail || 'Upload failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('version', version);
    formData.append('department', department);
    try {
      await apiClient.patch(`/api/admin/policies/${editTarget.policy_id || editTarget.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      closeModal();
      fetchPolicies();
      showToast('Policy updated successfully');
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      showToast(err?.response?.data?.detail || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Archive ────────────────────────────────────────────────
  const handleArchive = async (pol: Policy) => {
    const pid = pol.policy_id || pol.id;
    setActionLoading(pid);
    try {
      await apiClient.patch(`/api/admin/policies/${pid}/archive`);
      fetchPolicies();
      showToast('Policy archived');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Archive failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Unarchive ──────────────────────────────────────────────
  const handleUnarchive = async (pol: Policy) => {
    const pid = pol.policy_id || pol.id;
    setActionLoading(pid);
    try {
      await apiClient.patch(`/api/admin/policies/${pid}/unarchive`);
      fetchPolicies();
      showToast('Policy restored to active');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Unarchive failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const confirmDelete = (pol: Policy) => setDeleteTarget(pol);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const pid = deleteTarget.policy_id || deleteTarget.id;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/admin/policies/${pid}`);
      setDeleteTarget(null);
      fetchPolicies();
      showToast('Policy deleted permanently');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const isArchived = (pol: Policy) => pol.status?.toLowerCase() === 'archived';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Toast ─────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold font-mono text-slate-800">Policy Lifecycle Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Manage, version, archive and delete your company policies</p>
        </div>
        <button
          id="btn-add-policy"
          onClick={openAddModal}
          className="bg-canara-primary text-white px-4 py-2.5 rounded-xl shadow font-medium hover:bg-canara-primary/90 flex items-center gap-2 transition-all"
        >
          <Upload className="w-4 h-4" /> Upload Policy
        </button>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 font-mono text-xs text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">Policy ID</th>
              <th className="px-6 py-3 text-left">Title</th>
              <th className="px-6 py-3 text-left">Version</th>
              <th className="px-6 py-3 text-left">Dept</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> Loading policies…
                </td>
              </tr>
            )}
            {!loading && policies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                  No policies found. Upload one to get started.
                </td>
              </tr>
            )}
            {!loading && policies.map(pol => {
              const pid = pol.policy_id || pol.id;
              const busy = actionLoading === pid;
              return (
                <tr key={pol.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-canara-primary font-medium">{pid}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{pol.title}</td>
                  <td className="px-6 py-4 text-slate-600">{pol.version}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">{pol.department}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={pol.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {/* Edit */}
                      <button
                        id={`btn-edit-${pid}`}
                        title="Edit Policy"
                        onClick={() => openEditModal(pol)}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Archive / Unarchive toggle */}
                      {isArchived(pol) ? (
                        <button
                          id={`btn-unarchive-${pid}`}
                          title="Restore to Active"
                          disabled={busy}
                          onClick={() => handleUnarchive(pol)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        >
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArchiveRestore className="w-4 h-4" />}
                        </button>
                      ) : (
                        <button
                          id={`btn-archive-${pid}`}
                          title="Archive Policy"
                          disabled={busy}
                          onClick={() => handleArchive(pol)}
                          className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50"
                        >
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        id={`btn-delete-${pid}`}
                        title="Delete Policy"
                        onClick={() => confirmDelete(pol)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add / Edit Modal ───────────────────────────────── */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {modalMode === 'add' ? 'Upload Company Policy' : `Edit Policy — ${editTarget?.policy_id ?? editTarget?.id}`}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={modalMode === 'add' ? handleUpload : handleEdit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Policy Title</label>
                <input
                  id="input-policy-title"
                  type="text"
                  required
                  className="w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-canara-primary/30 text-sm text-gray-900 bg-white"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Cryptography Standard v2"
                />
              </div>

              {/* Version & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Version</label>
                  <input
                    id="input-policy-version"
                    type="text"
                    required
                    className="w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-canara-primary/30 text-sm text-gray-900 bg-white"
                    value={version}
                    onChange={e => setVersion(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    id="select-policy-department"
                    className="w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-canara-primary/30 text-sm text-gray-900 bg-white"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File (upload only) */}
              {modalMode === 'add' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Document (PDF / DOCX / DOC / TXT)</label>
                  <input
                    id="input-policy-file"
                    type="file"
                    required
                    accept=".txt,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="w-full border rounded-xl px-3 py-2 text-sm text-gray-700 bg-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  id="btn-modal-submit"
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-canara-primary text-white rounded-xl font-medium hover:bg-canara-primary/90 flex justify-center items-center gap-2 transition-colors text-sm disabled:opacity-60"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {modalMode === 'add' ? 'Uploading…' : 'Saving…'}</>
                    : modalMode === 'add'
                      ? <><Upload className="w-4 h-4" /> Upload Policy</>
                      : <><Pencil className="w-4 h-4" /> Save Changes</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Delete Policy?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  This will permanently remove <span className="font-semibold text-slate-700">{deleteTarget.title}</span>.
                  <br />This action <strong>cannot</strong> be undone.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  id="btn-cancel-delete"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-delete"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 flex justify-center items-center gap-2 transition-colors text-sm disabled:opacity-60"
                >
                  {deleting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
                    : <><Trash2 className="w-4 h-4" /> Delete</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}