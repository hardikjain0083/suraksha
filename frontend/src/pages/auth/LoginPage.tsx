import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, User, ArrowRight, AlertCircle, Cpu, Radio, Terminal as TerminalIcon } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useBehavioralCapture } from '../../hooks/useBehavioralCapture';
import { BehavioralCaptureIndicator } from '../../components/auth/BehavioralCaptureIndicator';
import { SessionHealthBadge } from '../../components/auth/SessionHealthBadge';
import { GlassCard } from '@/components/ui/glass-card';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();

  const [empId, setEmpId] = useState(location.state?.empId || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [sessionHealth, setSessionHealth] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const { keystrokeData, mouseData, captureKeystrokeDown, captureKeystrokeUp, captureMouse, reset } =
    useBehavioralCapture();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setIsCapturing(true);
    captureKeystrokeDown(e);
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    captureKeystrokeUp(e);
    setTimeout(() => setIsCapturing(false), 1200);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/auth/login', {
        emp_id: empId,
        password: password,
        behavioral_data: {
          keystroke: {
            dwell_times: keystrokeData.dwellTimes,
            flight_times: keystrokeData.flightTimes,
            typing_speed: keystrokeData.totalKeys / 10,
            error_rate: 0.0,
            total_keys: keystrokeData.totalKeys,
          },
          mouse: {
            velocities: mouseData.velocities,
            click_patterns: mouseData.clickPatterns,
            idle_times: mouseData.idleTimes,
            trajectory: mouseData.trajectory,
          },
        },
      });

      const data = response.data;

      setAuth({
        empId: data.user?.emp_id ?? '',
        role: data.user?.role ?? 'compliance_officer',
        name: data.user?.full_name ?? '',
        department: data.user?.department ?? '',
      });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('session_id', data.session_id);

      setSessionHealth(data.access_level);

      const role = data.user?.role ?? '';
      let defaultRedirect = '/admin';
      if (role === 'employee') defaultRedirect = '/employee/dashboard';
      else if (role === 'department_head' || role === 'dept_head') defaultRedirect = '/dept';
      else if (role === 'auditor') defaultRedirect = '/audit';

      const redirect = new URLSearchParams(location.search).get('redirect') || defaultRedirect;
      setTimeout(() => navigate(redirect), 1000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        err?.message ??
        'Login failed. Please check your credentials.';
      setError(msg);
      triggerShake();
      reset();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-obsidian-950 font-mono text-slate-300 relative select-none">
      {/* Dynamic Grid Background overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,217,255,0.025)_0%,transparent_65%)] pointer-events-none" />

      {/* ── Left Brand Cyber Panel ───────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-obsidian-900 border-r border-cyber-cyan/10 flex-col justify-center items-center p-12 text-white relative overflow-hidden">
        {/* Cybersecurity background matrix simulation */}
        <div className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"80\" height=\"80\" viewBox=\"0 0 80 80\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h40v40H0V0zm40 40h40v40H40V40z\" fill=\"%2300f2fe\" fill-opacity=\".04\" fill-rule=\"evenodd\"/%3E%3C/svg%3E')" }}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="z-10 text-center max-w-md relative"
        >
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-cyber-cyan/5 rounded-full blur-3xl pointer-events-none" />
          <Shield className="w-20 h-20 mx-auto mb-6 text-cyber-cyan drop-shadow-glow animate-pulse-glow" />
          <h1 className="text-4xl font-bold mb-2 tracking-widest text-cyber-cyan">SURAKSHA</h1>
          <p className="text-sm font-semibold tracking-widest text-cyber-blue mb-6">// COMPLIANCE COGNITIVE SHIELD v4.0</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Zero-Trust identity verification pipeline enforcing automated biometric keystroke analysis, semantic audit tracing, and deterministic ledger mapping.
          </p>
          
          <div className="mt-8 flex gap-2 justify-center flex-wrap">
            {['BIOMETRIC TELEMETRY', 'COGNITIVE PARSING', 'SHA-256 LEDGER'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-obsidian-950/80 rounded border border-cyber-cyan/25 text-[9px] font-bold text-cyber-cyan shadow-glow-cyan/5"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right Login Form Console ──────────────────────────── */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Header block */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-wider text-cyber-cyan flex items-center gap-1.5 uppercase">
                <Cpu className="w-4.5 h-4.5 text-cyber-cyan" />
                Establish Session
              </h2>
              <p className="text-slate-500 text-[10px] uppercase font-bold mt-1 tracking-wider">SuRaksha Identity Port v4.0</p>
            </div>
            <AnimatePresence>
              {sessionHealth && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SessionHealthBadge status={sessionHealth as any} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <GlassCard className="p-6 border-cyber-cyan/15">
              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 text-[10px] font-bold rounded-lg flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error.toUpperCase()}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Employee ID */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-cyber-cyan" /> Operator ID
                  </label>
                  <input
                    type="text"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    onMouseMove={captureMouse}
                    className="w-full p-3 bg-obsidian-950/80 border border-cyber-cyan/20 focus:border-cyber-cyan text-slate-200 rounded-lg outline-none font-mono text-xs focus:shadow-glow-cyan transition-all"
                    placeholder="EMP-COMP-001"
                    required
                    autoComplete="username"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-cyber-cyan" /> Secure Keyphrase
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    className="w-full p-3 bg-obsidian-950/80 border border-cyber-cyan/20 focus:border-cyber-cyan text-slate-200 rounded-lg outline-none font-mono text-xs focus:shadow-glow-cyan transition-all"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <BehavioralCaptureIndicator isCapturing={isCapturing} />
                </div>

                {/* Auxiliary options */}
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <Link to="/auth/enroll" className="text-cyber-cyan hover:underline hover:text-glow-cyan">
                    Use Hardware Token
                  </Link>
                  <Link to="/auth/register" className="text-slate-500 hover:text-slate-300">
                    New operator? Register
                  </Link>
                </div>

                {/* Form submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-cyber-cyan to-cyber-blue text-obsidian-950 rounded-lg font-bold hover:shadow-glow-cyan transition-all flex justify-center items-center gap-2 disabled:opacity-60 text-xs"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-obsidian-950" />
                      COMPILING ACCESS TOKENS...
                    </span>
                  ) : (
                    <>
                      EXECUTE SECURE AUTH <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </GlassCard>
          </motion.div>

          {/* Typewriter Demo credentials terminal pane */}
          <div className="mt-5 p-3.5 bg-obsidian-950 border border-cyber-cyan/10 rounded-lg text-[10px] text-slate-400 font-mono">
            <span className="text-cyber-blue font-bold flex items-center gap-1.5 mb-1 uppercase">
              <TerminalIcon className="w-3.5 h-3.5 text-cyber-blue animate-pulse" />
              DEMO CREDENTIALS LEDGER
            </span>
            <div className="space-y-0.5">
              <div>COMPLIANCE ADMIN: <span className="text-cyber-cyan font-bold">EMP-COMP-001 / Demo@123</span></div>
              <div>STAFF OPERATOR: <span className="text-cyber-cyan font-bold">EMP-045 / Demo@123</span></div>
              <div>INDEPENDENT AUDITOR: <span className="text-cyber-cyan font-bold">AUD-007 / Demo@123</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { Loader2 } from 'lucide-react';
