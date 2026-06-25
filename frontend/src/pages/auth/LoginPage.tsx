import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
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
    <div className="lp-root">
      {/* Atmospheric neon glow overlay */}
      <div className="lp-glow-overlay" />

      {/* ── Left Hero Column ──────────────────────────────────── */}
      <div className="lp-hero-col">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="lp-hero-content"
        >
          <h1 className="lp-hero-heading">
            ESTABLISH<br />SESSION
          </h1>
          <p className="lp-hero-tagline">// SuRaksha Identity Verification Protocol v4.0</p>
        </motion.div>
      </div>

      {/* ── Right Auth Card Column ────────────────────────────── */}
      <div className="lp-card-col">
        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="lp-card"
        >
          {/* Card Header */}
          <div className="lp-card-header">
            <div>
              <h2 className="lp-card-title">ESTABLISH SESSION</h2>
              <p className="lp-card-subtitle">SURAKSHA IDENTITY PORT V4.0</p>
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

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="lp-form">
            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="lp-error"
                >
                  <AlertCircle className="lp-error-icon" />
                  {error.toUpperCase()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Employee ID */}
            <div className="lp-field">
              <label className="lp-label">
                <User className="lp-label-icon" />
                OPERATOR ID
              </label>
              <input
                type="text"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onMouseMove={captureMouse}
                className="lp-input"
                placeholder="EMP-COMP-001"
                required
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="lp-field">
              <label className="lp-label">
                <Lock className="lp-label-icon" />
                SECURE KEYPHRASE
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                className="lp-input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <BehavioralCaptureIndicator isCapturing={isCapturing} />
            </div>

            {/* Helper links */}
            <div className="lp-links">
              <Link to="/auth/enroll" className="lp-link">
                Use Hardware Token
              </Link>
              <Link to="/auth/register" className="lp-link">
                New operator? Register
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`lp-btn${isLoading ? ' lp-btn--loading' : ''}`}
            >
              {isLoading ? (
                <span className="lp-btn-inner">
                  <Loader2 className="lp-spinner" />
                  COMPILING ACCESS TOKENS...
                </span>
              ) : (
                <>EXECUTE SECURE AUTH &nbsp;→</>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      <style>{`
        /* ── Google Fonts ─────────────────────────────────────── */
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400&display=swap');

        /* ── Root Layout ──────────────────────────────────────── */
        .lp-root {
          display: grid;
          grid-template-columns: 55% 45%;
          min-height: 100vh;
          width: 100%;
          background-color: #080808;
          position: relative;
          overflow: hidden;
          font-family: 'Space Grotesk', system-ui, sans-serif;
        }

        /* ── Atmospheric neon glow ────────────────────────────── */
        .lp-glow-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 60% 60% at 15% 50%,
            rgba(170, 255, 0, 0.12) 0%,
            rgba(170, 255, 0, 0.03) 40%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
        }

        /* ── Hero Left Column ─────────────────────────────────── */
        .lp-hero-col {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 4rem 3rem 4rem 5rem;
          position: relative;
          z-index: 1;
        }

        .lp-hero-content {
          max-width: 520px;
        }

        .lp-hero-heading {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 700;
          letter-spacing: -2px;
          color: #FFFFFF;
          text-transform: uppercase;
          line-height: 0.95;
          margin: 0 0 1.5rem 0;
        }

        .lp-hero-tagline {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #AAFF00;
          margin: 0;
        }

        /* ── Auth Card Right Column ───────────────────────────── */
        .lp-card-col {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 3rem 2rem 1.5rem;
          position: relative;
          z-index: 1;
        }

        .lp-card {
          background: rgba(13, 17, 23, 0.85);
          border: 1px solid rgba(170, 255, 0, 0.18);
          border-radius: 16px;
          padding: 2.5rem;
          backdrop-filter: blur(12px) saturate(1.2);
          max-width: 420px;
          width: 100%;
          position: relative;
        }

        /* ── Card Header ──────────────────────────────────────── */
        .lp-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.75rem;
        }

        .lp-card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #FFFFFF;
          text-transform: uppercase;
          margin: 0 0 0.35rem 0;
        }

        .lp-card-subtitle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #AAFF00;
          margin: 0;
        }

        /* ── Form ─────────────────────────────────────────────── */
        .lp-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* ── Error ────────────────────────────────────────────── */
        .lp-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 68, 68, 0.08);
          border: 1px solid rgba(255, 68, 68, 0.3);
          border-radius: 8px;
          color: #FF4444;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .lp-error-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        /* ── Fields ───────────────────────────────────────────── */
        .lp-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .lp-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          color: #A0A0A0;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lp-label-icon {
          width: 14px;
          height: 14px;
          color: #AAFF00;
        }

        .lp-input {
          background: #111318;
          border: 1px solid rgba(170, 255, 0, 0.15);
          border-radius: 8px;
          color: #FFFFFF;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          padding: 12px 16px;
          width: 100%;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .lp-input::placeholder {
          color: #4A4A4A;
        }

        .lp-input:focus {
          border-color: rgba(170, 255, 0, 0.6);
          box-shadow: 0 0 0 3px rgba(170, 255, 0, 0.08);
        }

        /* ── Helper Links ─────────────────────────────────────── */
        .lp-links {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .lp-link {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(170, 255, 0, 0.6);
          text-decoration: none;
          letter-spacing: 0.5px;
          transition: color 0.2s;
        }

        .lp-link:hover {
          color: #AAFF00;
        }

        /* ── CTA Button ───────────────────────────────────────── */
        .lp-btn {
          background: #AAFF00;
          color: #080808;
          border: none;
          border-radius: 8px;
          width: 100%;
          padding: 14px 24px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lp-btn:hover:not(.lp-btn--loading) {
          background: #CCFF00;
          box-shadow: 0 0 24px rgba(170, 255, 0, 0.4);
          transform: translateY(-1px);
        }

        .lp-btn:active:not(.lp-btn--loading) {
          transform: translateY(0px);
          box-shadow: 0 0 12px rgba(170, 255, 0, 0.25);
        }

        .lp-btn--loading {
          background: rgba(170, 255, 0, 0.3);
          color: rgba(8, 8, 8, 0.5);
          cursor: not-allowed;
        }

        .lp-btn-inner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .lp-spinner {
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ── Mobile Responsive ────────────────────────────────── */
        @media (max-width: 768px) {
          .lp-root {
            grid-template-columns: 1fr;
          }

          .lp-hero-col {
            display: none;
          }

          .lp-card-col {
            padding: 1.5rem;
            min-height: 100vh;
          }

          .lp-card {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
