import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, Camera, ArrowRight, Loader2 } from 'lucide-react';
import { useProjects, UserRole } from '../context/ProjectContext';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    photoURL: '',
    role: UserRole.USER
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: formData.name,
        photoURL: formData.photoURL
      });

      // Save to Firestore
      const isAdmin = formData.email === 'omer.s7861@gmail.com' || formData.email === 'omer.soherwardi@gmail.com';
      const userProfile = {
        name: formData.name,
        email: formData.email,
        role: isAdmin ? UserRole.ADMIN : formData.role,
        photoURL: formData.photoURL,
        status: isAdmin ? 'approved' : 'pending',
        createdAt: new Date().toISOString()
      };

      setDoc(doc(db, 'users', user.uid), userProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
      
      // Notify admin
      await addDoc(collection(db, 'notifications'), {
        type: 'role_request',
        text: `New user signup: ${formData.name} (${formData.email}) - Requests ${formData.role} role`,
        time: new Date().toISOString(),
        read: false
      });
      
      setStep(2);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--color-primary)_0%,_transparent_15%)]">
      <div className="w-full max-w-md bg-surface-1 border border-border-2 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6 text-on-primary" />
            </div>
            <h1 className="font-display font-black text-2xl text-text-primary tracking-tight">Join DTE Nexus Compliance tool</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-xl">
              <p className="text-xs text-red-400 font-bold">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-3xl bg-surface-2 border-2 border-dashed border-border-2 flex items-center justify-center group-hover:border-primary transition-all overflow-hidden relative">
                      {formData.photoURL ? (
                        <img src={formData.photoURL} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-text-tertiary group-hover:text-primary transition-all" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormData({...formData, photoURL: URL.createObjectURL(file)});
                      }}
                    />
                  </div>
                </div>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input 
                    type="text" 
                    required
                    placeholder="Full Name"
                    className="w-full bg-surface-2 border border-border-2 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

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
                    placeholder="Password (min 6 chars)"
                    minLength={6}
                    className="w-full bg-surface-2 border border-border-2 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <select
                    required
                    className="w-full bg-surface-2 border border-border-2 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  >
                    <option value={UserRole.USER}>User</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ArrowRight className="w-4 h-4 text-text-tertiary rotate-90" />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary py-4 rounded-2xl text-on-primary font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <p className="text-center text-[10px] text-text-tertiary font-bold uppercase tracking-widest leading-loose pt-6 border-t border-border-2">
                Already have an account? <span onClick={() => navigate('/login')} className="text-primary cursor-pointer hover:underline">Log In</span>
              </p>
            </form>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-black text-text-primary tracking-tight">Account Created</h3>
                <p className="text-xs text-text-tertiary mt-2">
                  Registration successful! For security reasons, your account is currently <span className="text-primary font-bold">pending approval</span>. 
                  An administrator will review your request shortly. 
                </p>
              </div>

              <div className="space-y-6">
                <button 
                  onClick={completeSignup}
                  className="w-full bg-primary py-4 rounded-2xl text-on-primary font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Continue to App
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
