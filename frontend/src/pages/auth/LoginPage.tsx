import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useBehavioralCapture } from '../../hooks/useBehavioralCapture';
import { BehavioralCaptureIndicator } from '../../components/auth/BehavioralCaptureIndicator';
import { SessionHealthBadge } from '../../components/auth/SessionHealthBadge';
import bgImage from '../../assets/background.jpg';

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
  const [loginSuccess, setLoginSuccess] = useState(false);

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
    setLoginSuccess(false);
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
      setLoginSuccess(true);
      setTimeout(() => navigate(redirect), 800);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        err?.message ??
        'Login failed. Please check your credentials.';
      setError(msg);
      triggerShake();
      reset();
      setIsLoading(false);
    }
  };

  return (
    <div className="lp-root" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="lp-overlay" />

      <div className="lp-content">
        {/* Branding */}
        <div className="lp-branding">
          <h1 className="lp-brand-title">
            <span role="img" aria-label="shield">🛡️</span> <span className="lp-brand-su">Su</span><span className="lp-brand-raksha">Raksha</span>
          </h1>
          <p className="lp-brand-tagline">Your Safety, Our Priority</p>
        </div>

        {/* Login Card */}
        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="lp-card"
        >
          <div className="lp-card-header">
            <div>
              <h2 className="lp-card-title">Welcome Back</h2>
              <p className="lp-card-subtitle">Sign in to access your safety dashboard</p>
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

          <form onSubmit={handleSubmit} className="lp-form">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="lp-error"
                >
                  <AlertCircle className="lp-error-icon" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="lp-field">
              <label className="lp-label">
                <User className="lp-label-icon" />
                Operator ID
              </label>
              <input
                type="text"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onMouseMove={captureMouse}
                className="lp-input"
                placeholder="Enter Operator ID"
                required
                autoComplete="username"
              />
            </div>

            <div className="lp-field">
              <label className="lp-label">
                <Lock className="lp-label-icon" />
                Secure Keyphrase
              </label>
              <div className="lp-input-wrapper">
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
            </div>

            <div className="lp-links">
              <Link to="/auth/enroll" className="lp-link">Use Hardware Token</Link>
              <Link to="/auth/register" className="lp-link">New operator? Register</Link>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || loginSuccess}
              whileTap={!isLoading && !loginSuccess ? { scale: 0.97 } : {}}
              className={`lp-btn${isLoading || loginSuccess ? ' lp-btn--loading' : ''}${loginSuccess ? ' lp-btn--success' : ''}`}
            >
              {loginSuccess ? (
                <span className="lp-btn-inner" style={{ color: '#064e3b' }}>
                  ACCESS GRANTED ✓
                </span>
              ) : isLoading ? (
                <span className="lp-btn-inner">
                  <Loader2 className="lp-spinner" />
                  VERIFYING ACCESS...
                </span>
              ) : (
                <>SIGN IN TO DASHBOARD &nbsp;→</>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .lp-root {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 60px);
          width: 100%;
          position: relative;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .lp-overlay {
          position: absolute;
          inset: 0;
          background: rgba(7, 26, 51, 0.75);
          z-index: 0;
        }

        .lp-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          padding: 2rem;
        }

        .lp-branding {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .lp-brand-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .lp-brand-su {
          color: #FFFFFF;
        }

        .lp-brand-raksha {
          background: linear-gradient(to right, #FF8A00, #FFC107);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .lp-brand-tagline {
          color: #E2E8F0;
          font-size: 1rem;
          margin: 0;
          opacity: 0.9;
        }

        .lp-card {
          background: rgba(11, 31, 58, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          max-width: 440px;
          width: 100%;
        }

        .lp-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .lp-card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 0.5rem 0;
        }

        .lp-card-subtitle {
          font-size: 0.875rem;
          color: #CBD5E1;
          margin: 0;
        }

        .lp-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .lp-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #F87171;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .lp-error-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .lp-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .lp-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #F1F5F9;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .lp-label-icon {
          width: 16px;
          height: 16px;
          color: #FFC107;
        }

        .lp-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .lp-input {
          background: rgba(7, 26, 51, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 1rem;
          padding: 12px 16px;
          width: 100%;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .lp-input[type="password"] {
          padding-right: 80px;
        }

        .lp-input::placeholder {
          color: #94A3B8;
        }

        .lp-input:focus {
          border-color: #FF8A00;
          background: rgba(7, 26, 51, 0.8);
          box-shadow: 0 0 0 3px rgba(255, 138, 0, 0.15);
        }

        .lp-links {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .lp-link {
          font-size: 0.875rem;
          color: #CBD5E1;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .lp-link:hover {
          color: #FFC107;
        }

        .lp-btn {
          background: linear-gradient(to right, #FF8A00, #FFC107);
          color: #000000;
          border: none;
          border-radius: 12px;
          width: 100%;
          padding: 14px 24px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lp-btn:hover:not(.lp-btn--loading) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 138, 0, 0.4);
        }

        .lp-btn:active:not(.lp-btn--loading) {
          transform: translateY(0px);
          box-shadow: 0 4px 10px rgba(255, 138, 0, 0.2);
        }

        .lp-btn--loading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .lp-btn--success {
          background: #4ade80 !important;
          color: #064e3b !important;
          opacity: 1;
          cursor: default;
        }

        .lp-btn-inner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .lp-spinner {
          width: 18px;
          height: 18px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .lp-content {
            padding: 1rem;
          }
          .lp-card {
            padding: 2rem 1.5rem;
          }
          .lp-brand-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};
