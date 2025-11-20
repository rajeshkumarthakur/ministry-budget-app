// src/components/Auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, pin);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-church-green via-green-600 to-green-700">
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
      </div>
      
      {/* TVC Logo with glow effect */}
      <div className="absolute top-8 left-8 z-20 group">
        <div className="relative">
          {/* Glow effect behind logo */}
          <div className="absolute inset-0 bg-church-green/30 blur-2xl rounded-full animate-pulse-slow" />
          <img
            src="/assets/tvc.png"
            alt="The Voice Church"
            className="relative h-24 w-auto object-contain drop-shadow-2xl transform transition-all duration-500 group-hover:scale-110"
            onError={(e) => {
              console.error('TVC logo failed to load');
            }}
          />
        </div>
      </div>
      
      {/* Decorative corner elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-church-green/20 to-transparent rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-tr-full" />
      
      {/* Content Container - Ultra Modern Design */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-slide-up">
        {/* Church Header - Modern Gradient Card */}
        <div className="relative bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-md rounded-t-2xl px-6 py-6 text-center shadow-xl border border-white/40 overflow-hidden">
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 shimmer-effect" />
          
          <div className="relative z-10">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-church-green to-gray-900 bg-clip-text text-transparent mb-1 animate-text-shimmer">
              The Voice Church
            </h1>
            <p className="text-xs text-gray-600 font-medium">
              13910 Laurel Bowie Road, Laurel, MD 20708
            </p>
            <div className="mt-3 pt-3 border-t border-gradient relative">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-church-green to-transparent" />
              <p className="text-sm font-bold bg-gradient-to-r from-church-green to-green-600 bg-clip-text text-transparent">
                Ministry Budget & Plan System
              </p>
            </div>
          </div>
        </div>

        {/* Login Form - Ultra Modern Glass Card */}
        <div className="relative bg-gradient-to-br from-white/95 to-gray-50/90 backdrop-blur-md rounded-b-2xl px-6 py-6 shadow-2xl border-x border-b border-white/40 overflow-hidden">
          {/* Floating orbs decoration */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-church-green/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent mb-4 text-center">
              Welcome Back
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-r-xl flex items-start gap-2 animate-shake shadow-lg">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5 animate-bounce" size={18} />
                <p className="text-xs text-red-800 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="group relative">
                <label htmlFor="email" className="label text-gray-800 font-semibold text-sm flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-church-green rounded-full animate-pulse" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@thevoicechurch.org"
                    required
                    autoFocus
                    className="input-modern w-full text-sm py-2.5 px-4 rounded-xl border-2 border-gray-200 focus:border-church-green transition-all duration-300 bg-white/80 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-xl focus:scale-[1.02] placeholder:text-gray-400"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-church-green/0 via-church-green/5 to-church-green/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              <div className="group relative">
                <label htmlFor="pin" className="label text-gray-800 font-semibold text-sm flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  PIN (4-6 digits)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="pin"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••"
                    maxLength="6"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    required
                    className="input-modern w-full text-sm py-2.5 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-all duration-300 bg-white/80 hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-xl focus:scale-[1.02] placeholder:text-gray-400"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-church-green via-green-600 to-church-green bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                
                <span className="relative z-10">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-4 pt-4 relative">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              
              <div className="space-y-2">
                <p className="text-gray-700 font-bold text-sm">Need help? 💬</p>
                <p className="text-gray-600 text-xs font-medium">Contact Betty Washington</p>
                <a
                  href="mailto:bwashington@thevoicechurch.org"
                  className="inline-flex items-center gap-1 text-church-green hover:text-church-secondary font-bold hover:gap-2 transition-all duration-200 text-xs group"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  bwashington@thevoicechurch.org
                </a>
                <p className="text-gray-600 text-xs inline-flex items-center gap-1 justify-center w-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  (202) 910-4771
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
