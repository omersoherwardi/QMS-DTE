import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, LogIn, ArrowRight, Loader2 } from 'lucide-react';
import { useProjects, UserRole } from '../context/ProjectContext';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setSuccess('Password reset link sent to your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(circle_at_bottom_left,_var(--color-primary)_0%,_transparent_15%)]">
      <div className="w-full max-w-md bg-surface-1 border border-border-2 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6 text-on-primary" />
            </div>
            <h1 className="font-display font-black text-2xl text-text-primary tracking-tight">Login to DTE Nexus Compliance tool</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-xl">
              <p className="text-xs text-red-400 font-bold">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-xl">
              <p className="text-xs text-emerald-400 font-bold">{success}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input 
                  type="email" 
                  required
                  placeholder="Email Address"
                  className="w-full bg-surface-2 border border-border-2 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input 
                  type="password" 
                  required
                  placeholder="Password"
                  className="w-full bg-surface-2 border border-border-2 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded-sm border-border-2 bg-surface-3 transition-all checked:bg-primary"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
                  />
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest group-hover:text-text-primary transition-colors">Remember Me</span>
                </label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest disabled:opacity-50"
                  disabled={loading}
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary py-4 rounded-2xl text-on-primary font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
              {!loading && <LogIn className="w-4 h-4" />}
            </button>

            <p className="text-center text-[10px] text-text-tertiary font-bold uppercase tracking-widest leading-loose pt-6 border-t border-border-2">
              Don't have an account? <span onClick={() => navigate('/signup')} className="text-primary cursor-pointer hover:underline">Sign Up</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
