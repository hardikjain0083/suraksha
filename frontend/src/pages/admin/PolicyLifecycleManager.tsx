import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { Upload, X, Loader2 } from 'lucide-react';

export function PolicyLifecycleManager() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('DEPT-INFOSEC');
  const [version, setVersion] = useState('1.0');
  const [uploading, setUploading] = useState(false);

  const fetchPolicies = () => {
    apiClient.get('/api/admin/policies')
      .then(res => setPolicies(res.data))
      .catch(err => {
        if (import.meta.env.DEV) console.error(err);
      });
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please select a file');
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('department', department);
    formData.append('version', version);

    try {
      await apiClient.post('/api/admin/policies/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsModalOpen(false);
      setFile(null);
      setTitle('');
      fetchPolicies();
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      alert(err?.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold font-mono text-slate-800">Policy Lifecycle Manager</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-canara-primary text-white px-4 py-2 rounded-lg shadow font-medium hover:bg-canara-primary/90 flex items-center gap-2"
        >
          <Upload className="w-4 h-4" /> Upload Company Policy
        </button>
      </div>

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
             {policies.length === 0 && (
               <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No policies found. Upload one to get started.</td></tr>
             )}
             {policies.map(pol => (
               <tr key={pol.id} className="hover:bg-slate-50">
                 <td className="px-6 py-4 font-mono text-canara-primary font-medium">{pol.id}</td>
                 <td className="px-6 py-4 font-semibold text-slate-800">{pol.title}</td>
                 <td className="px-6 py-4 text-slate-600">{pol.version}</td>
                 <td className="px-6 py-4">
                   <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">{pol.department}</span>
                 </td>
                 <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded text-xs font-bold ${
                     pol.status.toLowerCase() === 'active' ? 'bg-canara-success/10 text-canara-success' : 'bg-amber-100 text-amber-800'
                   }`}>{pol.status}</span>
                 </td>
                 <td className="px-6 py-4 space-x-3">
                   <button className="text-blue-500 hover:underline font-medium">Edit</button>
                   <button className="text-slate-500 hover:underline font-medium">Archive</button>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg text-slate-800">Upload Company Document</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Policy Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-canara-primary/30"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Acme Corp Cryptography Standard"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Version</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-canara-primary/30"
                    value={version}
                    onChange={e => setVersion(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                  <select 
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-canara-primary/30"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                  >
                    <option value="DEPT-INFOSEC">InfoSec</option>
                    <option value="DEPT-IT">IT</option>
                    <option value="DEPT-COMPLIANCE">Compliance</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Document (PDF/TXT)</label>
                <input 
                  type="file" 
                  required
                  accept=".txt,.pdf"
                  className="w-full border rounded-lg px-3 py-2 text-sm text-slate-600 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border rounded-lg font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2 bg-canara-primary text-white rounded-lg font-medium hover:bg-canara-primary/90 flex justify-center items-center gap-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}