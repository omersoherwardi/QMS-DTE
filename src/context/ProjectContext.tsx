import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  SignalHigh, 
  SignalMedium, 
  SignalLow,
  LucideIcon
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  addDoc,
  where,
  or,
  writeBatch
} from 'firebase/firestore';

export interface OnHoldPeriod {
  start: string;
  end: string;
  reason?: string;
}

export interface Project {
  id: string; 
  name: string;
  owner: string;
  ownerEmail: string;
  responsiblePerson: string;
  status: 'To be started' | 'In Progress' | 'On Hold' | 'Completed';
  plannedStart: string;
  plannedEnd: string;
  actualStart: string;
  actualEnd: string;
  code: string;
  progress: number;
  priority: 'Critical' | 'High' | 'Low';
  priorityIcon: LucideIcon;
  statusColor: string;
  carline: string;
  dptPhase: string;
  type: 'Planned' | 'Adhoc';
  preprocessingChekkai?: boolean;
  modelChekkai?: boolean;
  resultsChekkai?: boolean;
  preprocessingChekkaiNotRequired?: boolean;
  modelChekkaiNotRequired?: boolean;
  resultsChekkaiNotRequired?: boolean;
  preprocessingChekkaiData?: any;
  resultsChekkaiData?: any;
  allInputsReceivedDate?: string;
  revisedEndDates?: string[];
  notes?: string;
  projectNotes?: { text: string; date: string; author: string }[];
  presentedInZoneMeeting?: boolean;
  zoneMeetings?: { name: string; date: string }[];
  isActualStartLocked?: boolean;
  onHoldPeriods: OnHoldPeriod[];
}

export enum UserRole {
  ADMIN = 'Admin',
  USER = 'User'
}

export interface UserProfile {
  uid?: string;
  name: string;
  role: UserRole;
  email: string;
  photoURL?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface RoleRequest {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  requestedRole: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'role_request';
  text: string;
  time: string;
  read: boolean;
  relatedId?: string;
  targetUserId?: string;
  targetRole?: UserRole;
  broadcast?: boolean;
}

interface ProjectContextType {
  projects: Project[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addProject: (project: any) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  isAdmin: boolean;
  canEditProject: (project: Project) => boolean;
  canCreateProject: () => boolean;
  canDeleteProject: (project: Project) => boolean;
  loading: boolean;
  documents: any[];
  audits: any[];
  addDocument: (doc: any) => Promise<void>;
  updateDocument: (id: string, updates: Partial<any>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  addAudit: (audit: any) => Promise<void>;
  deleteAudit: (id: string) => Promise<void>;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  requestRoleChange: (requestedRole: UserRole) => Promise<void>;
  roleRequests: RoleRequest[];
  approveRoleRequest: (requestId: string) => Promise<void>;
  rejectRoleRequest: (requestId: string) => Promise<void>;
  updateAudit: (id: string, updates: Partial<any>) => Promise<void>;
  pendingUsers: UserProfile[];
  approveUser: (uid: string, role: UserRole) => Promise<void>;
  rejectUser: (uid: string) => Promise<void>;
  broadcastNotification: (text: string, type: 'info' | 'success' | 'warning') => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const getPriorityIcon = (priority: string) => {
  return priority === 'Critical' || priority === 'High' ? SignalHigh : SignalLow;
};

const getStatusColor = (status: string) => {
  if (status === 'Completed') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  if (status === 'On Hold') return 'text-text-tertiary bg-surface-3 border-border-2';
  if (status === 'To be started') return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  return 'text-blue-400 bg-blue-400/10 border-blue-400/20'; // In Progress
};

export const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getAbbreviation = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('motorbewegung')) return 'MB';
  if (n.includes('cps')) return 'CPS';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4);
};

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Cleanup for listeners
  useEffect(() => {
    let unsubscribeNotifications: (() => void) | null = null;
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeRoleRequests: (() => void) | null = null;
    let unsubscribeUsers: (() => void) | null = null;

    const cleanupListeners = () => {
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeRoleRequests) unsubscribeRoleRequests();
      if (unsubscribeUsers) unsubscribeUsers();
      unsubscribeNotifications = null;
      unsubscribeProfile = null;
      unsubscribeRoleRequests = null;
      unsubscribeUsers = null;
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      cleanupListeners();

      if (user) {
        // 1. Notifications
        const conditions = [
          where('broadcast', '==', true),
          where('targetUserId', '==', user.uid)
        ];
        
        // 2. Profile
        unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = { ...docSnap.data(), uid: user.uid } as UserProfile;
            if (userData.email === 'omer.s7861@gmail.com' || userData.email === 'omer.soherwardi@gmail.com') {
              userData.role = UserRole.ADMIN;
              userData.status = 'approved';
            }
            setCurrentUser(userData);

            // Conditional listeners based on role
            if (userData.role === UserRole.ADMIN) {
              // Role Requests
              if (!unsubscribeRoleRequests) {
                unsubscribeRoleRequests = onSnapshot(collection(db, 'roleRequests'), (snapshot) => {
                  setRoleRequests(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as RoleRequest)));
                }, (error) => {
                  handleFirestoreError(error, OperationType.LIST, 'roleRequests');
                });
              }

              // Pending Users
              if (!unsubscribeUsers) {
                const q = query(collection(db, 'users'));
                unsubscribeUsers = onSnapshot(q, (snapshot) => {
                  const allUsers = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
                  setPendingUsers(allUsers.filter(u => u.status === 'pending'));
                }, (error) => {
                  handleFirestoreError(error, OperationType.LIST, 'users');
                });
              }

              // Notifications for Admin
              if (!unsubscribeNotifications) {
                const qAdmin = query(
                  collection(db, 'notifications'),
                  or(where('broadcast', '==', true), where('targetUserId', '==', user.uid), where('targetRole', '==', UserRole.ADMIN)),
                  orderBy('time', 'desc')
                );
                unsubscribeNotifications = onSnapshot(qAdmin, (snapshot) => {
                  setNotifications(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notification)));
                }, (error) => {
                   handleFirestoreError(error, OperationType.LIST, 'notifications');
                });
              }
            } else {
              // Non-admin notifications
              if (!unsubscribeNotifications) {
                const qUser = query(
                  collection(db, 'notifications'),
                  or(where('broadcast', '==', true), where('targetUserId', '==', user.uid)),
                  orderBy('time', 'desc')
                );
                unsubscribeNotifications = onSnapshot(qUser, (snapshot) => {
                  setNotifications(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notification)));
                }, (error) => {
                   handleFirestoreError(error, OperationType.LIST, 'notifications');
                });
              }
              // Cleanup admin-only listeners if role changed
              if (unsubscribeRoleRequests) { unsubscribeRoleRequests(); unsubscribeRoleRequests = null; }
              if (unsubscribeUsers) { unsubscribeUsers(); unsubscribeUsers = null; }
            }
          } else {
            const newUser: UserProfile = {
              uid: user.uid,
              name: user.displayName || 'User',
              email: user.email || '',
              role: (user.email === 'omer.s7861@gmail.com' || user.email === 'omer.soherwardi@gmail.com') ? UserRole.ADMIN : UserRole.USER,
              status: (user.email === 'omer.s7861@gmail.com' || user.email === 'omer.soherwardi@gmail.com') ? 'approved' : 'pending'
            };
            setCurrentUser(newUser);
            setDoc(doc(db, 'users', user.uid), newUser).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setNotifications([]);
        setRoleRequests([]);
        setPendingUsers([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      cleanupListeners();
    };
  }, []);

  const markNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const batch = writeBatch(db);
      let count = 0;
      notifications.forEach(n => {
        if (!n.read) {
          batch.update(doc(db, 'notifications', n.id), { read: true });
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const requestRoleChange = async (requestedRole: UserRole) => {
    if (!currentUser || !currentUser.uid) return;
    try {
      const requestData: Omit<RoleRequest, 'id'> = {
        uid: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        requestedRole,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      await addDoc(collection(db, 'roleRequests'), requestData);
      
      // Notify admins
      await addDoc(collection(db, 'notifications'), {
        type: 'role_request',
        text: `Role change request from ${currentUser.name} to ${requestedRole}`,
        time: new Date().toISOString(),
        read: false,
        targetRole: UserRole.ADMIN
      });
      
      // alert("Role change request sent to admin.");
    } catch (error) {
      console.error("Error requesting role change:", error);
    }
  };

  const broadcastNotification = async (text: string, type: 'info' | 'success' | 'warning' = 'info') => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        type,
        text,
        time: new Date().toISOString(),
        read: false,
        broadcast: true
      });
    } catch (error) {
      console.error("Error broadcasting notification:", error);
    }
  };

  const approveRoleRequest = async (requestId: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    try {
      const requestDoc = await getDoc(doc(db, 'roleRequests', requestId));
      if (requestDoc.exists()) {
        const data = requestDoc.data() as RoleRequest;
        await updateDoc(doc(db, 'users', data.uid), { role: data.requestedRole });
        await updateDoc(doc(db, 'roleRequests', requestId), { status: 'approved' });
        
        // Notify user
        await addDoc(collection(db, 'notifications'), {
          type: 'success',
          text: `Your role change request to ${data.requestedRole} has been approved.`,
          time: new Date().toISOString(),
          read: false,
          targetUserId: data.uid
        });
      }
    } catch (error) {
      console.error("Error approving role request:", error);
    }
  };

  const rejectRoleRequest = async (requestId: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    try {
      await updateDoc(doc(db, 'roleRequests', requestId), { status: 'rejected' });
      
      const requestDoc = await getDoc(doc(db, 'roleRequests', requestId));
      if (requestDoc.exists()) {
        const data = requestDoc.data() as RoleRequest;
        // Notify user
        await addDoc(collection(db, 'notifications'), {
          type: 'warning',
          text: `Your role change request to ${data.requestedRole} was rejected.`,
          time: new Date().toISOString(),
          read: false,
          targetUserId: data.uid
        });
      }
    } catch (error) {
      console.error("Error rejecting role request:", error);
    }
  };

  const approveUser = async (uid: string, role: UserRole) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    try {
      await updateDoc(doc(db, 'users', uid), { 
        status: 'approved',
        role: role
      });
      
      // Notify user (would need a notification system for users, which we have)
      await addDoc(collection(db, 'notifications'), {
        type: 'success',
        text: `Your account has been approved. Welcome to QMS@DTE! Your role is ${role}.`,
        time: new Date().toISOString(),
        read: false,
        relatedId: uid,
        targetUserId: uid
      });
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const rejectUser = async (uid: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
    } catch (error) {
      console.error("Error rejecting user:", error);
    }
  };

  useEffect(() => {
    if (!currentUser || (currentUser.status !== 'approved' && currentUser.status !== 'pending' && currentUser.email !== 'omer.s7861@gmail.com')) {
      setProjects([]);
      return;
    }

    const q = query(collection(db, 'projects'), orderBy('plannedStart', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          priorityIcon: getPriorityIcon(data.priority),
          statusColor: getStatusColor(data.status)
        } as Project;
      });
      setProjects(projectsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || (currentUser.status !== 'approved' && currentUser.status !== 'pending' && currentUser.email !== 'omer.s7861@gmail.com')) {
      setDocuments([]);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'documents'), (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documents');
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || (currentUser.status !== 'approved' && currentUser.email !== 'omer.s7861@gmail.com' && currentUser.email !== 'omer.soherwardi@gmail.com')) {
      setAudits([]);
      return;
    }

    const q = query(collection(db, 'audits'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAudits(snapshot.docs.map(doc => {
        const data = doc.data();
        let statusColor = 'text-blue-400 bg-blue-400/10 border-blue-400/20'; // Scheduled/Planned
        if (data.status === 'Completed') statusColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        if (data.status === 'Review Pending') statusColor = 'text-orange-400 bg-orange-400/10 border-orange-400/20';
        
        return { ...data, id: doc.id, statusColor };
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'audits');
    });
    return () => unsubscribe();
  }, [currentUser]);

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      // Remove derived fields before saving to Firestore
      const { priorityIcon, statusColor, ...cleanUpdates } = updates as any;
      await updateDoc(doc(db, 'projects', id), cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
    }
  };

  const addDocument = async (data: any) => {
    try {
      await addDoc(collection(db, 'documents'), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'documents');
    }
  };

  const updateDocument = async (id: string, updates: Partial<any>) => {
    try {
      await updateDoc(doc(db, 'documents', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `documents/${id}`);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `documents/${id}`);
    }
  };

  const addAudit = async (data: any) => {
    console.log('Adding audit:', data);
    try {
      const entityName = data.entity || 'Audit';
      let abbreviation = '';
      
      if (entityName.toLowerCase().includes('motorbewegung')) {
        abbreviation = 'MB';
      } else if (entityName.toLowerCase().includes('cps')) {
        abbreviation = 'CPS';
      } else {
        abbreviation = entityName
          .split(' ')
          .map((word: string) => word[0])
          .join('')
          .toUpperCase()
          .slice(0, 4);
        
        if (abbreviation.length < 2) {
          abbreviation = entityName.slice(0, 3).toUpperCase();
        }
      }
      
      const existingCount = audits.filter(a => a.entity === entityName).length + 1;
      const auditNum = existingCount.toString().padStart(2, '0');
      const auditRef = `AUD-${new Date().getFullYear()}-${abbreviation}${auditNum}`;

      await addDoc(collection(db, 'audits'), {
        ...data,
        reference: auditRef,
        action: data.action || 'Audit Booking',
        date: formatDate(data.date || new Date())
      });
      console.log('Audit added successfully');
    } catch (error) {
      console.error('Error in addAudit:', error);
      handleFirestoreError(error, OperationType.CREATE, 'audits');
    }
  };

  const deleteAudit = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'audits', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `audits/${id}`);
    }
  };

  const updateAudit = async (id: string, updates: Partial<any>) => {
    try {
      await updateDoc(doc(db, 'audits', id), {
        ...updates,
        lastUpdated: formatDate(new Date())
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `audits/${id}`);
    }
  };

  const addProject = async (data: any) => {
    if (!currentUser) return;
    
    try {
      const loadcaseName = data.loadcase || data.name || 'Project';
      const abbreviation = getAbbreviation(loadcaseName);

      const existingCount = projects.filter(p => p.name.includes(loadcaseName)).length + 1;
      const projectNum = existingCount.toString().padStart(2, '0');
      const projectCode = `PRJ-${new Date().getFullYear()}-${abbreviation}${projectNum}`;

      const newProjectData = {
        name: loadcaseName,
        owner: data.owner || currentUser.name,
        ownerEmail: currentUser.email,
        responsiblePerson: data.responsiblePerson || 'TBD',
        status: data.status || 'To be started',
        plannedStart: data.plannedStart || '',
        plannedEnd: data.plannedEnd || '',
        actualStart: data.actualStart || '',
        actualEnd: data.actualEnd || '',
        progress: data.progress || 0,
        priority: data.priority,
        carline: data.carline || 'Nexus-X Crossover',
        dptPhase: data.dptPhase || 'DPT-Phase A: Concept & Setup',
        type: data.type || 'Planned',
        onHoldPeriods: [],
        revisedEndDates: [],
        notes: '',
        projectNotes: [],
        presentedInZoneMeeting: false,
        zoneMeetings: [],
        allInputsReceivedDate: '',
        code: projectCode,
        createdAt: formatDate(new Date())
      };

      await addDoc(collection(db, 'projects'), newProjectData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  };

  const canEditProject = (project: Project) => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentUser.role === UserRole.USER) {
      return project.ownerEmail === currentUser.email;
    }
    return false;
  };

  const canCreateProject = () => {
    if (!currentUser) return false;
    return currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.USER;
  };

  const canDeleteProject = (project: Project) => {
    if (!currentUser) return false;
    return currentUser.role === UserRole.ADMIN;
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      documents,
      audits,
      addDocument,
      updateDocument,
      deleteDocument,
      addAudit,
      deleteAudit,
      updateAudit,
      addProject, 
      updateProject, 
      deleteProject,
      searchQuery, 
      setSearchQuery,
      currentUser,
      setCurrentUser,
      canEditProject,
      canCreateProject,
      canDeleteProject,
      loading,
      notifications,
      isAdmin: currentUser?.role === UserRole.ADMIN,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      requestRoleChange,
      roleRequests,
      approveRoleRequest,
      rejectRoleRequest,
      pendingUsers,
      approveUser,
      rejectUser,
      broadcastNotification
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
