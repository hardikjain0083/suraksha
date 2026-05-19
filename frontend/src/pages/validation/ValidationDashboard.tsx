import React, { useState } from 'react';
import { ValidationBadge } from '../../components/common/ValidationBadge';
import { GlassCard } from '@/components/ui/glass-card';
import { Shield, FileCode, CheckCircle, XCircle, AlertTriangle, Eye, Loader2, Cpu, RefreshCw } from 'lucide-react';

const mockQueue = [
  { id: 'ev_101', mapId: 'MAP-2026-042', type: 'PDF Document', fileName: 'vuln-scan-q2-2026.pdf', uploader: 'Emp 045', uploadedAt: '10 mins ago', status: 'pass', confidence: 0.89, details: [{name: 'File Type Check', status: 'pass'}, {name: 'Date Check', status: 'pass'}, {name: 'Keyword Presence', status: 'pass'}] },
  { id: 'ev_102', mapId: 'MAP-2026-015', type: 'Config File (JSON)', fileName: 'invalid-config.json', uploader: 'Emp 012', uploadedAt: '15 mins ago', status: 'fail', confidence: 0.30, reason: 'Invalid JSON format (line 4)', details: [{name: 'JSON Format', status: 'fail', reason: 'Syntax error line 4'}, {name: 'Schema Check', status: 'fail', reason: 'Not evaluated due to format error'}] },
  { id: 'ev_103', mapId: 'MAP-2026-033', type: 'Screenshot', fileName: 'router-setting.png', uploader: 'Emp 008', uploadedAt: '1 hour ago', status: 'manual_review', confidence: 0.65, reason: 'EXIF timestamp missing', details: [{name: 'Resolution Check', status: 'pass'}, {name: 'Timestamp Auth', status: 'fail', reason: 'Missing EXIF'}] },
  { id: 'ev_104', mapId: 'MAP-2026-091', type: 'PDF Document', fileName: 'pentest-report-q2-2026.pdf', uploader: 'Emp 022', uploadedAt: '2 hours ago', status: 'pass', confidence: 0.91, details: [{name: 'File Type Check', status: 'pass'}, {name: 'Keyword Check', status: 'pass'}] },
  { id: 'ev_105', mapId: 'MAP-2026-024', type: 'PDF Document', fileName: 'old-scan.pdf', uploader: 'Emp 018', uploadedAt: '3 hours ago', status: 'fail', confidence: 0.20, reason: 'Date before MAP creation', details: [{name: 'File Type Check', status: 'pass'}, {name: 'Date Check', status: 'fail', reason: 'Created in 2024'}] },
];

export function ValidationDashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [fileFilter, setFileFilter] = useState('All Types');

  const filterQueue = () => {
    let items = mockQueue;
    if (activeTab === 'failed') items = mockQueue.filter(q => q.status === 'fail');
    else if (activeTab === 'manual') items = mockQueue.filter(q => q.status === 'manual_review');
    
    if (fileFilter !== 'All Types') {
      if (fileFilter === 'JSON Config') {
        items = items.filter(q => q.type.includes('JSON'));
      } else if (fileFilter === 'PDF Documents') {
        items = items.filter(q => q.type.includes('PDF'));
      }
    }
    return items;
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] font-mono text-xs text-slate-300">
      {/* LEFT: Queue List Console */}
      <GlassCard className="w-1/2 flex flex-col border-cyber-cyan/15 overflow-hidden">
        {/* Console Header */}
        <div className="p-4 border-b border-cyber-cyan/10 bg-obsidian-950/60 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyber-cyan animate-pulse" />
            <h1 className="text-sm font-bold text-cyber-cyan tracking-wider">EVIDENCE INGESTION QUEUE</h1>
          </div>
          <div className="relative">
            <select 
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              className="bg-obsidian-900 border border-cyber-cyan/25 text-slate-300 rounded px-2.5 py-1 text-[10px] focus:outline-none focus:border-cyber-cyan transition-colors appearance-none pr-6"
            >
              <option>All Types</option>
              <option>JSON Config</option>
              <option>PDF Documents</option>
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</span>
          </div>
        </div>
        
        {/* Tabs switcher */}
        <div className="flex border-b border-cyber-cyan/10 bg-obsidian-950/20 text-[10px] font-bold shrink-0">
          {[
            { id: 'all', label: 'ALL FILES' },
            { id: 'failed', label: 'CHECKSUM FAILS' },
            { id: 'manual', label: 'ANALYST ESCALATIONS' }
          ].map(tab => (
            <button 
              key={tab.id}
              className={`flex-1 py-3 text-center border-b-2 transition-all ${
                activeTab === tab.id 
                  ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/5 shadow-glow-cyan' 
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`} 
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scroll List container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-obsidian-950/30 scrollbar-thin">
          {filterQueue().map(item => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className={`p-3.5 border rounded-xl cursor-pointer transition-all duration-200 flex flex-col gap-2.5 ${
                selectedItem?.id === item.id 
                  ? 'border-cyber-cyan bg-cyber-cyan/5 shadow-glow-cyan' 
                  : 'border-cyber-cyan/10 bg-obsidian-950/50 hover:border-cyber-cyan/30 hover:bg-cyber-cyan/5/10'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                   <span className="text-[10px] font-bold text-cyber-blue">{item.mapId}</span>
                   <h3 className="font-sans font-bold text-slate-200 mt-0.5 truncate pr-2" title={item.fileName}>{item.fileName}</h3>
                </div>
                <ValidationBadge status={item.status} confidence={item.confidence} reason={item.reason} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 border-t border-white/5 pt-2">
                <span>{item.type.toUpperCase()}</span>
                <span>{item.uploader} • {item.uploadedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* RIGHT: Detail View Workspace */}
      <GlassCard className="w-1/2 flex flex-col border-cyber-cyan/15 overflow-hidden">
        {selectedItem ? (
          <div className="flex flex-col h-full">
            {/* Header info */}
            <div className="p-6 border-b border-cyber-cyan/10 bg-obsidian-950/40 shrink-0">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-200 font-sans tracking-tight leading-tight">{selectedItem.fileName}</h2>
                  <p className="text-slate-500 text-[10px] mt-1 font-mono">{selectedItem.id} // SECURE LINK TO {selectedItem.mapId}</p>
                </div>
                <ValidationBadge status={selectedItem.status} confidence={selectedItem.confidence} />
              </div>

               <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-obsidian-900 border border-cyber-cyan/5 p-2.5 rounded-lg">
                    <span className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">Evidence Type</span>
                    <span className="font-bold text-cyber-cyan">{selectedItem.type}</span>
                  </div>
                  <div className="bg-obsidian-900 border border-cyber-cyan/5 p-2.5 rounded-lg">
                    <span className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">Uploaded By</span>
                    <span className="font-bold text-slate-200">{selectedItem.uploader}</span>
                  </div>
               </div>
            </div>
            
            {/* Checks breakdown list */}
            <div className="flex-1 p-6 overflow-y-auto bg-obsidian-950/20 space-y-4 scrollbar-thin">
               <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest border-b border-cyber-cyan/5 pb-2">// AUTOMATED AUDIT CHECK LISTS</h3>
               
               <div className="space-y-3">
                 {selectedItem.details.map((detail: any, i: number) => {
                    const isPass = detail.status === 'pass';
                    return (
                      <div 
                        key={i} 
                        className={`p-3 rounded-xl border flex justify-between items-center transition-all bg-obsidian-950/80 ${
                          isPass 
                            ? 'border-cyber-green/20 hover:border-cyber-green/40 shadow-glow-green/5' 
                            : 'border-red-500/20 hover:border-red-500/40 shadow-glow-red/5'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-200">{detail.name.toUpperCase()}</div>
                          {detail.reason && <div className="text-[10px] text-red-400 mt-1 font-mono">{detail.reason}</div>}
                        </div>
                        <div>
                          {isPass ? (
                            <span className="text-cyber-green bg-cyber-green/10 px-2.5 py-0.5 rounded text-[9px] font-bold border border-cyber-green/30 shadow-glow-green/10">PASS</span>
                          ) : (
                            <span className="text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded text-[9px] font-bold border border-red-500/30 shadow-glow-red/10">FAIL</span>
                          )}
                        </div>
                      </div>
                    );
                 })}
               </div>
            </div>

            {/* Verification override panel footer */}
            <div className="p-4 border-t border-cyber-cyan/10 bg-obsidian-950/60 shrink-0">
               <div className="flex gap-3">
                 {selectedItem.status !== 'pass' && (
                    <button className="flex-1 bg-cyber-green hover:bg-cyber-green/90 text-obsidian-950 font-bold py-2 px-3 rounded-lg transition-all flex justify-center items-center gap-1.5 shadow-glow-green">
                       <CheckCircle className="w-4 h-4 text-obsidian-900" />
                       OVERRIDE & APPROVE
                    </button>
                 )}
                 {selectedItem.status !== 'fail' && (
                    <button className="flex-1 bg-cyber-magenta hover:bg-cyber-magenta/90 text-obsidian-950 font-bold py-2 px-3 rounded-lg transition-all flex justify-center items-center gap-1.5 shadow-glow-magenta">
                       <XCircle className="w-4 h-4 text-obsidian-900" />
                       OVERRIDE & REJECT
                    </button>
                 )}
                 <button className="flex-1 bg-obsidian-900 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10 font-bold py-2 px-3 rounded-lg transition-all">
                    REQUEST RE-UPLOAD
                 </button>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
             <div className="w-16 h-16 rounded-full bg-cyber-cyan/5 border border-cyber-cyan/10 flex items-center justify-center shadow-glow-cyan/5">
               <Shield className="w-8 h-8 text-cyber-cyan/30 animate-pulse" />
             </div>
             <p className="font-bold text-[10px] tracking-widest text-slate-400 uppercase">// REQUEST EVIDENCE RESOLUTION</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}