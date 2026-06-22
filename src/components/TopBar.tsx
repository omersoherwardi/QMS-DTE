import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  FileText,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Clock,
  Megaphone,
  Send,
  X,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjects, UserRole } from '../context/ProjectContext';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export function TopBar() {
  const navigate = useNavigate();
  const { 
    searchQuery, 
    setSearchQuery, 
    currentUser, 
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    requestRoleChange,
    pendingUsers,
    roleRequests,
    approveUser,
    rejectUser,
    approveRoleRequest,
    rejectRoleRequest,
    broadcastNotification,
    projects,
    documents,
    audits
  } = useProjects();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole>>({});
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  const pendingRequests = roleRequests.filter(r => r.status === 'pending');
  const hasAdminActions = currentUser?.role === UserRole.ADMIN && (pendingUsers.length > 0 || pendingRequests.length > 0);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const totalNotifs = unreadNotificationsCount + (hasAdminActions ? pendingUsers.length + pendingRequests.length : 0);

  const handleLogout = () => {
    signOut(auth);
    setIsProfileOpen(false);
    setShowAccountSettings(false);
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    await broadcastNotification(broadcastMessage, 'info');
    setBroadcastMessage('');
    setIsBroadcastOpen(false);
    setToast({ message: "Broadcast sent to all users!", type: 'success' });
    setTimeout(() => setToast(null), 5000);
  };

  const handleRoleRequest = async (role: UserRole) => {
    await requestRoleChange(role);
    setIsProfileOpen(false);
    setShowAccountSettings(false);
    setToast({ message: "Request sent to admin, please wait till accepted.", type: 'info' });
    setTimeout(() => setToast(null), 5000);
  };

  const handleNotificationClick = (n: any) => {
    markNotificationAsRead(n.id);
    
    // Close dropdown
    setIsNotifOpen(false);

    // Navigation logic
    if (n.relatedId) {
      // Check if it's a project
      if (projects.some(p => p.id === n.relatedId)) {
        navigate(`/projects/${n.relatedId}`);
      } 
      // Check if it's a document
      else if (documents.some(d => d.id === n.relatedId)) {
        navigate(`/documents/${n.relatedId}`);
      }
      // Check if it's an audit (no detail page yet, so go to audits page)
      else if (audits.some(a => a.id === n.relatedId)) {
        navigate('/audits');
      }
    } 
    // Fallback based on text or type
    else if (n.type === 'role_request') {
      // Admin might want to see requests, but they are already in the dropdown
    }
    
    if (n.broadcast) {
      setToast({ message: n.text, type: 'info' });
      setTimeout(() => setToast(null), 5000);
    }
  };

  const markAllReadAndClose = async () => {
    await markAllNotificationsAsRead();
    setToast({ message: "All notifications marked as read", type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className={cn(
            "px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
            toast.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary"
          )}>
            {toast.type === 'success' ? <CheckSquare className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            <p className="text-sm font-bold uppercase tracking-tight">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsBroadcastOpen(false)} />
          <div className="relative w-full max-w-md bg-surface-1 border border-border-2 rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-6 flex items-center gap-3">
              <Megaphone className="w-6 h-6 text-primary" /> Broadcast Message
            </h2>
            <textarea 
              placeholder="Enter message for all users..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full bg-surface-2 border border-border-2 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary min-h-[120px] resize-none mb-6"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setIsBroadcastOpen(false)}
                className="flex-1 py-3 text-xs font-bold text-text-tertiary uppercase tracking-widest hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleBroadcast}
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Send Now
              </button>
            </div>
          </div>
        </div>
      )}

    <header className="fixed top-0 right-0 left-64 h-16 bg-background border-b border-border-1 flex items-center justify-between px-10 z-40">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search projects by ID or Name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-2 border border-border-2 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-tertiary/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {currentUser?.role === UserRole.ADMIN && (
          <button 
            onClick={() => setIsBroadcastOpen(true)}
            className="p-2.5 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
            title="Broadcast to all users"
          >
            <Megaphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        )}
        
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={cn(
              "p-2.5 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-xl transition-all relative",
              isNotifOpen && "bg-surface-2 text-text-primary"
            )}
          >
            <Bell className="w-5 h-5" />
            {totalNotifs > 0 && (
              <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-primary text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-background">
                {totalNotifs}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-96 bg-surface-1 border border-border-2 rounded-2xl shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-5 py-4 border-b border-border-2 flex justify-between items-center bg-surface-2/30">
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-widest">Notifications</h3>
                  <button 
                    onClick={markAllReadAndClose}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  {/* Admin Actions Section */}
                  {currentUser?.role === UserRole.ADMIN && (pendingUsers.length > 0 || pendingRequests.length > 0) && (
                    <div className="p-2 border-b border-border-2 bg-amber-500/5">
                      <div className="px-3 py-2">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-3 flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" /> Requires Attention
                        </span>
                        
                        <div className="space-y-3">
                          {/* Pending Users */}
                          {pendingUsers.map(u => (
                            <div key={u.uid} className="bg-surface-2 p-3 rounded-xl border border-amber-500/20 space-y-3 shadow-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-[11px] font-bold text-text-primary uppercase tracking-tight">{u.name}</p>
                                  <p className="text-[9px] text-text-tertiary truncate max-w-[180px]">{u.email}</p>
                                </div>
                                <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">New Signup</span>
                              </div>
                              
                              <div className="space-y-2">
                                <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">Assign Role</p>
                                <div className="flex flex-wrap gap-1">
                                  {[UserRole.USER, UserRole.ADMIN].map(r => (
                                    <button 
                                      key={r}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setUserRoles({...userRoles, [u.uid!]: r});
                                      }}
                                      className={cn(
                                        "px-2 py-1 text-[8px] font-black uppercase rounded border transition-all",
                                        (userRoles[u.uid!] || u.role) === r ? "bg-amber-500 text-white border-amber-500" : "border-border-2 text-text-secondary hover:border-amber-500"
                                      )}
                                    >
                                      {r}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    approveUser(u.uid!, userRoles[u.uid!] || u.role);
                                  }}
                                  className="flex-1 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-lg hover:brightness-110 active:scale-95 transition-all"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rejectUser(u.uid!);
                                  }}
                                  className="flex-1 py-1.5 bg-surface-3 text-text-secondary text-[9px] font-black uppercase rounded-lg hover:text-red-500 active:scale-95 transition-all"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Role Requests */}
                          {pendingRequests.map(req => (
                            <div key={req.id} className="bg-surface-2 p-3 rounded-xl border border-primary/20 space-y-3 shadow-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-[11px] font-bold text-text-primary uppercase tracking-tight">{req.userName}</p>
                                  <p className="text-[9px] text-text-tertiary">wants <span className="text-primary font-black">{req.requestedRole}</span></p>
                                </div>
                                <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Role Request</span>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    approveRoleRequest(req.id);
                                  }}
                                  className="flex-1 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-lg hover:brightness-110 active:scale-95 transition-all"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rejectRoleRequest(req.id);
                                  }}
                                  className="flex-1 py-1.5 bg-surface-3 text-text-secondary text-[9px] font-black uppercase rounded-lg hover:text-red-500 active:scale-95 transition-all"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {notifications.length === 0 && !hasAdminActions && (
                    <div className="py-12 text-center">
                      <Bell className="w-8 h-8 text-border-2 mx-auto mb-3 opacity-20" />
                      <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">No notifications yet</p>
                    </div>
                  )}

                  {notifications.map((n) => {
                    const Icon = n.type === 'role_request' ? User : 
                                 n.broadcast ? Megaphone :
                                 n.type === 'success' ? CheckSquare : 
                                 n.type === 'warning' ? AlertCircle : Bell;
                    const iconColor = n.type === 'role_request' ? 'bg-primary/10 text-primary' : 
                                     n.broadcast ? 'bg-blue-500/10 text-blue-500 font-bold' :
                                     n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                                     n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-surface-3 text-text-secondary';
                    
                    return (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "p-4 border-b border-border-1 last:border-0 hover:bg-surface-2 transition-colors cursor-pointer group",
                          !n.read && "bg-primary/5"
                        )}
                      >
                        <div className="flex gap-4">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", iconColor)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className={cn("text-xs leading-snug", n.read ? "text-text-secondary" : "text-text-primary font-bold")}>{n.text}</p>
                            <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest mt-1">{new Date(n.time).toLocaleString()}</p>
                          </div>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="h-6 w-px bg-border-2" />
        
        {currentUser ? (
          <div className="relative">
            <button 
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setShowAccountSettings(false);
              }}
              className={cn(
                "flex items-center gap-3 p-1.5 pr-3 rounded-xl transition-all border",
                isProfileOpen ? "bg-surface-2 border-border-2 shadow-inner" : "border-transparent hover:bg-surface-2"
              )}
            >
              <img 
                src={currentUser.name.includes('Omer') ? "/input_file_0.png" : "https://ui-avatars.com/api/?name=" + currentUser.name} 
                alt="Profile" 
                className="w-8 h-8 rounded-lg object-cover object-[center_15%]"
              />
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-text-primary leading-none uppercase tracking-wide">{currentUser.name}</p>
                <p className="text-[9px] text-text-tertiary font-black uppercase mt-1 tracking-widest">{currentUser.role}</p>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-text-tertiary transition-transform", isProfileOpen && "rotate-180")} />
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => {
                  setIsProfileOpen(false);
                  setShowAccountSettings(false);
                }} />
                <div className="absolute right-0 mt-2 w-64 bg-surface-1 border border-border-2 rounded-2xl shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-border-2 bg-surface-2/50 text-center">
                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Signed in as</p>
                    <p className="text-xs font-bold text-text-primary truncate">{currentUser.email}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    {!showAccountSettings ? (
                      <button 
                        onClick={() => setShowAccountSettings(true)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-all"
                      >
                        <Settings className="w-4 h-4 text-primary" />
                        Account Settings
                      </button>
                    ) : (
                      <div className="px-3 py-2 border border-border-1 bg-surface-2 rounded-lg animate-in slide-in-from-right-2 duration-300">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Request Role Change</p>
                          <button onClick={() => setShowAccountSettings(false)} className="text-[8px] font-black text-primary uppercase">Back</button>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {[UserRole.USER, UserRole.ADMIN].map((role) => (
                            <button
                              key={role}
                              disabled={currentUser.role === role}
                              onClick={() => handleRoleRequest(role)}
                              className={cn(
                                "w-full text-left px-2 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase tracking-tighter disabled:opacity-30 disabled:cursor-auto",
                                currentUser.role === role ? "bg-primary/5 text-primary" : "hover:bg-primary/10 hover:text-primary text-text-secondary"
                              )}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="h-px bg-border-1 my-1" />
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-text-secondary hover:text-text-primary px-4 py-2 transition-colors uppercase tracking-widest"
            >
              Log In
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="bg-primary hover:brightness-110 text-on-primary px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
    </>
  );
}

