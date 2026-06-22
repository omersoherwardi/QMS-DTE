import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Audits from './pages/Audits';
import Timeline from './pages/Timeline';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import NewProject from './pages/NewProject';
import ProjectDetail from './pages/ProjectDetail';
import ChekkaiForm from './pages/ChekkaiForm';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { ProjectProvider, useProjects } from './context/ProjectContext';
import { motion } from 'motion/react';
import { Hourglass, Lock, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth as firebaseAuth } from './lib/firebase';

function PendingApproval() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-surface-1 border border-border-2 rounded-3xl shadow-2xl p-10 text-center space-y-6"
      >
        <div className="w-20 h-20 bg-amber-400/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Hourglass className="w-10 h-10 text-amber-400 animate-pulse" />
        </div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Pending Approval</h1>
        <p className="text-sm text-text-tertiary leading-relaxed">
          Your account has been created successfully. For security reasons, an administrator must approve your access before you can enter the portal.
        </p>
        <div className="p-4 bg-surface-2 rounded-xl border border-border-1 text-[10px] font-black text-text-secondary uppercase tracking-widest">
          Check back later or contact your IT administrator.
        </div>
        <button 
          onClick={() => signOut(firebaseAuth)}
          className="flex items-center gap-2 px-6 py-3 border border-border-2 text-text-secondary rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-surface-2 transition-all mx-auto"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </motion.div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useProjects();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-display font-black text-xs uppercase tracking-[0.4em] text-text-tertiary animate-pulse">
        Initializing QMS@DTE...
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  if (currentUser.status === 'pending' && currentUser.email !== 'omer.s7861@gmail.com') {
    return <PendingApproval />;
  }

  if (currentUser.status === 'rejected' && currentUser.email !== 'omer.s7861@gmail.com') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface-1 border border-red-500/20 rounded-3xl shadow-2xl p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Access Denied</h1>
          <p className="text-sm text-text-tertiary leading-relaxed">
            Your registration request has been declined. Please contact your supervisor if you believe this is an error.
          </p>
          <button 
            onClick={() => signOut(firebaseAuth)}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all mx-auto"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />
      <main className="ml-64 mt-16 p-10">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ProjectProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/projects" element={<Layout><Projects /></Layout>} />
        <Route path="/projects/new" element={<Layout><NewProject /></Layout>} />
        <Route path="/projects/:id" element={<Layout><ProjectDetail /></Layout>} />
        <Route path="/projects/:id/chekkai/:type" element={<Layout><ChekkaiForm /></Layout>} />
        <Route path="/timeline" element={<Layout><Timeline /></Layout>} />
        <Route path="/documents" element={<Layout><Documents /></Layout>} />
        <Route path="/documents/:id" element={<Layout><DocumentDetail /></Layout>} />
        <Route path="/audits" element={<Layout><Audits /></Layout>} />
      </Routes>
    </ProjectProvider>
  );
}
