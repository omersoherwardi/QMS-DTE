import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText,
  ClipboardCheck, 
  ShieldCheck,
  Calendar,
  LogOut,
  User,
  UserPlus,
  ChevronUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useProjects, UserRole } from '../context/ProjectContext';

import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export function Sidebar() {
  const { currentUser } = useProjects();

  const handleLogout = () => {
    signOut(auth);
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Briefcase, label: 'Projects', path: '/projects' },
    { icon: Calendar, label: 'Timeline', path: '/timeline' },
    { icon: ClipboardCheck, label: 'Audits', path: '/audits' },
    { icon: FileText, label: 'Documents', path: '/documents' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-1 border-r border-border-1 flex flex-col py-8 z-50">
      <div className="px-8 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-on-primary" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-display font-black text-xl leading-none text-text-primary tracking-tight">QMS@DTE</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary font-bold mt-1">Compliance Tool</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-8 py-3 font-display text-sm font-semibold transition-all duration-150 border-l-4",
              isActive 
                ? "text-primary bg-primary/5 border-primary" 
                : "text-text-secondary border-transparent hover:text-text-primary hover:bg-surface-2"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
