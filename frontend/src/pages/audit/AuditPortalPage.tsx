import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, Clock, AlertTriangle, Play, FileDown, Activity, Cpu } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';

export function AuditPortalPage() {
  const navigate = useNavigate();
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);

  const handleVerify = () => {
    setVerifyStatus('verifying');
    setTimeout(() => setVerifyStatus('verified'), 1800);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header block */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-cyber-cyan/15 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-cyber-cyan flex items-center gap-2">
            <Cpu className="w-6 h-6 text-cyber-cyan animate-pulse-glow" />
            ZERO-TRUST AUDIT & COMPLIANCE LEDGER
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Cryptographic ledger logging of circular compliance matching, manual overrides, and biometric access signatures.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleVerify} 
            className="flex items-center gap-2 px-4 py-2 border border-cyber-cyan/30 hover:border-cyber-cyan/60 text-cyber-cyan bg-cyber-cyan/5 hover:bg-cyber-cyan/10 rounded-lg text-xs font-mono font-bold transition-all shadow-glow-cyan/10"
          >
            <Activity className="w-3.5 h-3.5" />
            COMPUTE CRYPTO HASH CHAIN
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-cyber-blue/30 hover:border-cyber-blue/60 text-cyber-blue bg-cyber-blue/5 hover:bg-cyber-blue/10 rounded-lg text-xs font-mono font-bold transition-all shadow-glow-blue/10">
            <FileDown className="w-3.5 h-3.5" />
            EXPORT LEDGER REPORT
          </button>
        </div>
      </div>

      {/* Verify Chain Status Alert */}
      <AnimatePresence>
        {verifyStatus === 'verifying' && (
          <div className="bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue p-4 rounded-xl flex items-center gap-3 font-mono text-xs shadow-glow-blue/10 animate-pulse">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyber-blue border-t-transparent" />
            <span>RESOLVING CRYPTOGRAPHIC DIRECTORY TREE // COMPUTING LEDGER HASH MATCHES // INTEGRITY VERIFICATION ACTIVE...</span>
          </div>
        )}
        {verifyStatus === 'verified' && (
          <div className="bg-cyber-green/10 border border-cyber-green/30 text-cyber-green p-4 rounded-xl flex items-center gap-3 font-mono text-xs shadow-glow-green/10">
            <CheckCircle className="w-5 h-5 text-cyber-green shrink-0 animate-bounce" />
            <div className="flex-1">
              <span className="font-bold uppercase tracking-wider block">Ledger Block Chain Integrity: VERIFIED [SHA-256 MATCH]</span>
              <span className="text-[10px] opacity-75">All blocks matching signatures correctly in local DB. Root Merkle Hash: ae3b0c42f01a89c42c1...</span>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Audit Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard glowColor="cyan" className="p-4 border-cyber-cyan/10">
          <h3 className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider">Total Audit Log Entries (24h)</h3>
          <p 
            className="text-3xl font-bold font-mono mt-2 cursor-pointer text-cyber-cyan hover:underline hover:text-glow-cyan" 
            onClick={() => navigate('/audit/logs')}
          >
            1,048
          </p>
        </GlassCard>
        <GlassCard glowColor="blue" className="p-4 border-cyber-cyan/10">
          <h3 className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider">Fully Closed MAP Blocks</h3>
          <p className="text-3xl font-bold font-mono text-cyber-blue mt-2">42</p>
        </GlassCard>
        <GlassCard glowColor="magenta" className="p-4 border-cyber-cyan/10">
          <h3 className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider">Manual Override Intercepts</h3>
          <p className="text-3xl font-bold font-mono text-cyber-magenta mt-2">3</p>
        </GlassCard>
        <GlassCard glowColor="green" className="p-4 border-cyber-cyan/10">
          <h3 className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider">Avg User Behavioral Score</h3>
          <p className="text-3xl font-bold font-mono text-cyber-green mt-2">91.4</p>
        </GlassCard>
      </div>

      {/* Recent Critical Actions List */}
      <GlassCard className="p-5 border-cyber-cyan/10">
        <h2 className="font-bold font-mono text-sm text-cyber-cyan mb-4 border-b border-cyber-cyan/10 pb-2.5 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyber-cyan" />
          RECENT CRITICAL COMPLIANCE ACTIONS
        </h2>
        <div className="space-y-3 font-mono text-xs text-slate-300">
          <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-obsidian-950/60 border border-cyber-magenta/20 hover:border-cyber-magenta/40 rounded-xl transition-all">
            <span className="text-slate-500 shrink-0">2026-05-17 14:02:11</span>
            <span className="bg-cyber-magenta/10 text-cyber-magenta border border-cyber-magenta/20 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 self-start md:self-auto">OVERRIDE</span>
            <span className="text-slate-200">Compliance Officer manually approved ev_105 with low confidence threshold 0.20</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-obsidian-950/60 border border-cyber-green/20 hover:border-cyber-green/40 rounded-xl transition-all">
            <span className="text-slate-500 shrink-0">2026-05-17 13:45:00</span>
            <span className="bg-cyber-green/10 text-cyber-green border border-cyber-green/20 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 self-start md:self-auto">MAP_COMPLETE</span>
            <span className="text-slate-200">IT Head completed MAP-2026-011. Session validation score: 95</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-obsidian-950/60 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all">
            <span className="text-slate-500 shrink-0">2026-05-17 11:20:44</span>
            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 self-start md:self-auto">ESCALATION</span>
            <span className="text-slate-200">MAP-2026-015 escalated to CISO due to missed critical policy timeline deadline</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// Wrapping in AnimatePresence manually for consistency
import { AnimatePresence } from 'framer-motion';