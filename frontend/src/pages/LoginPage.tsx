import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Ship, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/client';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@supplywatch.ai');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useStore((s: any) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      if (data.data) {
        setAuth(data.data.user, data.data.token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-teal/5 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -bottom-32 -right-32 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl top-1/4 right-1/4 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center shadow-xl shadow-teal/30"
          >
            <Ship size={32} className="text-navy-950" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gradient">SupplyWatch</h1>
          <p className="text-gray-400 mt-2 text-sm">Supply Chain Control Tower</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 bg-sw-red/10 border border-sw-red/30 rounded-lg flex items-center gap-2"
            >
              <AlertCircle size={14} className="text-sw-red shrink-0" />
              <span className="text-xs text-sw-red">{error}</span>
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal/60 transition-colors"
                  placeholder="admin@supplywatch.ai"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal/60 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2.5 bg-gradient-to-r from-teal to-teal-dark text-navy-950 font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-navy-950/30 border-t-navy-950 rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setEmail('admin@supplywatch.ai'); setPassword('password123'); }}
              className="w-full py-2 bg-navy-800/80 hover:bg-navy-700 text-teal border border-navy-700 rounded-lg transition-colors text-xs flex items-center justify-center"
            >
              Autofill Admin Credentials
            </button>
            <button
              type="button"
              onClick={() => { setEmail('customer@supplywatch.ai'); setPassword('password123'); }}
              className="w-full py-2 bg-navy-800/80 hover:bg-navy-700 text-blue-400 border border-navy-700 rounded-lg transition-colors text-xs flex items-center justify-center"
            >
              Autofill Customer Credentials
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
