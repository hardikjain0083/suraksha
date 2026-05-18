import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, User, Mail, Phone, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api';

const DEPARTMENTS = [
  { id: 'DEPT-INFOSEC', name: 'Information Security' },
  { id: 'DEPT-IT',      name: 'Information Technology' },
  { id: 'DEPT-LEGAL',   name: 'Legal & Compliance' },
  { id: 'DEPT-OPS',     name: 'Banking Operations' },
  { id: 'DEPT-RISK',    name: 'Risk Management' },
  { id: 'DEPT-COMP',    name: 'Regulatory Compliance' },
];

function passwordStrength(pass: string): number {
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  return score;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong ✓'];
const STRENGTH_COLORS = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-blue-500', 'bg-canara-green'];

export const RegistrationPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    department: 'DEPT-INFOSEC',
    designation: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [strength, setStrength] = useState(0);

  const set = (key: string, val: string) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  const empIdPreview = formData.department
    ? `${formData.department.replace('DEPT-', 'EMP-')}-XXXXXX`
    : 'EMP-XXXXXX';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (strength < 3) {
      setError('Password is too weak. Use uppercase, number, and special character.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/auth/register', formData);
      const data = response.data;

      // Store JWT so enrollment page can call the enrollment endpoints
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('pending_emp_id', data.emp_id);

      setSuccess(`Account created! Your Employee ID: ${data.emp_id}`);
      setTimeout(() => navigate('/auth/login', { state: { empId: data.emp_id } }), 2000);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          err?.message ??
          'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-background flex flex-col items-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border rounded-xl shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="bg-canara-blue p-6 text-white text-center">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-canara-green" />
          <h2 className="text-2xl font-bold">New Employee Setup</h2>
          <p className="text-blue-100 text-sm mt-1">Register for SuRaksha MAPS v4.0</p>
        </div>

        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg"
              >
                ✅ {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Full Name
            </label>
            <input
              required
              value={formData.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              className="w-full p-2.5 text-sm bg-background border rounded-md focus:ring-1 focus:ring-canara-blue outline-none"
              placeholder="Priya Sharma"
            />
          </div>

          {/* Email + Mobile */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full p-2.5 text-sm bg-background border rounded-md focus:ring-1 focus:ring-canara-blue outline-none"
                placeholder="priya@canara.bank"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Mobile
              </label>
              <input
                required
                value={formData.mobile}
                onChange={(e) => set('mobile', e.target.value)}
                className="w-full p-2.5 text-sm bg-background border rounded-md focus:ring-1 focus:ring-canara-blue outline-none"
                placeholder="9876543210"
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Department
            </label>
            <select
              required
              value={formData.department}
              onChange={(e) => set('department', e.target.value)}
              className="w-full p-2.5 text-sm bg-background border rounded-md focus:ring-1 focus:ring-canara-blue outline-none"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* EMP ID preview */}
          <AnimatePresence>
            {formData.department && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-secondary/50 rounded-md border border-secondary"
              >
                <p className="text-xs text-muted-foreground">Auto-generated Employee ID:</p>
                <p className="text-base font-mono font-bold text-foreground mt-0.5">{empIdPreview}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Designation */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Designation</label>
            <input
              required
              value={formData.designation}
              onChange={(e) => set('designation', e.target.value)}
              className="w-full p-2.5 text-sm bg-background border rounded-md focus:ring-1 focus:ring-canara-blue outline-none"
              placeholder="Security Analyst"
            />
          </div>

          {/* Password + strength meter */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => {
                set('password', e.target.value);
                setStrength(passwordStrength(e.target.value));
              }}
              className="w-full p-2.5 text-sm bg-background border rounded-md focus:ring-1 focus:ring-canara-blue outline-none"
              placeholder="Min 8 chars, uppercase, number, special"
            />
            {/* Strength bar */}
            <div className="flex gap-1 mt-1.5">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= strength ? STRENGTH_COLORS[strength] : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            {formData.password && (
              <p className="text-[11px] text-muted-foreground text-right">
                {STRENGTH_LABELS[strength]}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2 bg-canara-blue text-white rounded-md font-semibold hover:bg-canara-blue/90 transition-colors disabled:opacity-60"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Account…
              </span>
            ) : (
              'Register'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
