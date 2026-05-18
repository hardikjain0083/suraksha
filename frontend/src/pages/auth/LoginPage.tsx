import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useBehavioralCapture } from '../../hooks/useBehavioralCapture';
import { BehavioralCaptureIndicator } from '../../components/auth/BehavioralCaptureIndicator';
import { SessionHealthBadge } from '../../components/auth/SessionHealthBadge';

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

      // Push into AuthContext (also writes to localStorage)
      setAuth({
        empId: data.user?.emp_id ?? '',
        role: data.user?.role ?? 'compliance_officer',
        name: data.user?.full_name ?? '',
        department: data.user?.department ?? '',
      });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('session_id', data.session_id);

      // Show session health badge briefly
      setSessionHealth(data.access_level);

      // Role-based redirect
      const role = data.user?.role ?? '';
      let defaultRedirect = '/admin/circulars';
      if (role === 'employee' || role === 'department_head') defaultRedirect = '/dept';
      else if (role === 'admin') defaultRedirect = '/admin';
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
    <div className="flex min-h-screen bg-background">
      {/* ── Left brand panel ─────────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-canara-blue to-[#002255] flex-col justify-center items-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="z-10 text-center"
        >
          <Shield className="w-24 h-24 mx-auto mb-6 text-canara-green drop-shadow-[0_0_20px_rgba(0,168,107,0.7)]" />
          <h1 className="text-5xl font-bold mb-4 tracking-tight">SuRaksha MAPS</h1>
          <p className="text-2xl font-light text-canara-green mb-2">v4.0</p>
          <p className="text-lg text-blue-200 max-w-xs">
            Deterministic Compliance.<br />Intelligent Augmentation.
          </p>
          <div className="mt-8 flex gap-3 justify-center flex-wrap">
            {['Zero-Trust Auth', 'AI Gap Detection', 'Audit Trail'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-white/10 rounded-full text-sm border border-white/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right login form ──────────────────────────────────── */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Sign In</h2>
              <p className="text-muted-foreground text-sm mt-1">Canara Bank — SuRaksha MAPS</p>
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

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Employee ID */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" /> Employee ID
              </label>
              <input
                type="text"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onMouseMove={captureMouse}
                className="w-full p-3 bg-background border rounded-lg focus:ring-2 focus:ring-canara-blue outline-none transition-shadow"
                placeholder="EMP-COMP-001"
                required
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                className="w-full p-3 bg-background border rounded-lg focus:ring-2 focus:ring-canara-blue outline-none transition-shadow"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <BehavioralCaptureIndicator isCapturing={isCapturing} />
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link to="/auth/token" className="text-canara-blue hover:underline">
                Use Hardware Token
              </Link>
              <Link to="/auth/register" className="text-muted-foreground hover:text-foreground">
                New employee? Register
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-canara-blue text-white rounded-lg font-semibold hover:bg-canara-blue/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <>
                  Secure Login <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <strong>Demo:</strong> EMP-COMP-001 / Demo@123 — or any registered employee ID
          </div>
        </div>
      </div>
    </div>
  );
};
