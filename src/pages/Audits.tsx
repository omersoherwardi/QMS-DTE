import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  AlertCircle, 
  CheckSquare, 
  MoreVertical,
  Filter,
  Trash2,
  PlusCircle,
  Save
} from 'lucide-react';
import { useProjects, UserRole, formatDate } from '../context/ProjectContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const stats = [
  { label: 'Pending Findings', value: '12', change: '-2 units', icon: AlertCircle, color: 'text-red-500', progress: 30, isSteps: true },
  { label: 'Audits Completed', value: '142', change: 'Goal: 150', icon: CheckSquare, color: 'text-text-secondary', progress: 85 },
];

const activeAudits = [
  { id: '#AUD-2024-089', entity: 'Bio-Safety Lab Level 3', standard: 'ISO 9001:2015', assessor: 'S. Jenkins', status: 'In Progress', statusColor: 'text-primary bg-primary/10 border-primary/20' },
  { id: '#AUD-2024-092', entity: 'Pharma Manufacturing A2', standard: 'cGMP Part 211', assessor: 'M. Rivera', status: 'Review Pending', statusColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: '#AUD-2024-095', entity: 'Supply Chain Logistics Hub', standard: 'ISO 13485', assessor: 'A. Tanaka', status: 'Scheduled', statusColor: 'text-text-secondary bg-surface-3 border-border-2' },
  { id: '#AUD-2024-102', entity: 'Software Validation Suite', standard: 'IEEE 1012', assessor: 'K. Loh', status: 'In Progress', statusColor: 'text-primary bg-primary/10 border-primary/20' },
];

const timeline = [
  { time: '14:20 PM - TODAY', event: 'CAPA Process Initiated', desc: 'A new Corrective Action Plan was triggered for Lab-B finding #FR-882.', color: 'bg-primary' },
  { time: '11:05 AM - TODAY', event: 'Audit #092 Status Update', desc: 'M. Rivera moved audit to \'Review Pending\' phase.', color: 'bg-text-tertiary' },
  { time: '09:30 AM - TODAY', event: 'Critical Non-Conformance', desc: 'Detected temperature deviation in storage unit ST-04 during inspection.', color: 'bg-red-500' },
  { time: '17:45 PM - YESTERDAY', event: 'Daily Summary Generated', desc: '14 audits finalized with 100% compliance verified.', color: 'bg-text-tertiary' },
  { time: '15:20 PM - YESTERDAY', event: 'New Assessor Onboarded', desc: 'David Chen granted Read/Write access to Compliance module.', color: 'bg-primary' },
];

export default function Audits() {
  const { 
    audits, 
    deleteAudit, 
    addAudit, 
    updateAudit, 
    currentUser, 
    projects,
    roleRequests,
    pendingUsers,
    approveUser,
    rejectUser,
    approveRoleRequest,
    rejectRoleRequest
  } = useProjects();
  const [statusFilter, setStatusFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('');
  const [showNewAuditForm, setShowNewAuditForm] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole>>({});
  const [newAudit, setNewAudit] = useState({
    projectId: '',
    assessor: '',
    datePlanned: '',
    notes: ''
  });

  const timelineData = useMemo(() => {
    const events: any[] = [];
    
    audits.forEach(audit => {
      // Event for Audit Planned
      if (audit.date) {
        events.push({
          time: `${formatDate(audit.date)} - ${audit.status === 'Completed' ? 'COMPLETED' : 'PLANNED'}`,
          event: `Audit: ${audit.entity}`,
          desc: `Assessor: ${audit.assessor}. Status: ${audit.status}`,
          color: audit.status === 'Completed' ? 'bg-emerald-500' : 
                 audit.status === 'Review Pending' ? 'bg-orange-500' : 'bg-primary',
          date: new Date(audit.date),
          auditId: audit.id
        });
      }
      
      // Event for NC Correction Deadline (if deadline exists or findings exist)
      if (audit.rectificationDeadline) {
        events.push({
          time: `${formatDate(audit.rectificationDeadline)} - DEADLINE`,
          event: `Rectification: ${audit.reference || audit.id}`,
          desc: `Deadline to rectify findings in ${audit.entity}`,
          color: 'bg-orange-600',
          date: new Date(audit.rectificationDeadline),
          auditId: audit.id
        });
      } else if (audit.findings && audit.findings.trim() !== '') {
        const auditDate = new Date(audit.date);
        const deadlineDate = new Date(auditDate);
        deadlineDate.setDate(deadlineDate.getDate() + 14); // Default 2 week deadline
        
        events.push({
          time: `${formatDate(deadlineDate)} - DEADLINE`,
          event: `NC Correction: ${audit.reference || audit.id}`,
          desc: `Correction required for findings in ${audit.entity}`,
          color: 'bg-red-500',
          date: deadlineDate,
          auditId: audit.id
        });
      }
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [audits]);

  const filteredAudits = useMemo(() => {
    return audits.filter(a => {
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchEntity = entityFilter === '' || (a.entity && a.entity.toLowerCase().includes(entityFilter.toLowerCase())) ||
                         (a.id && a.id.toLowerCase().includes(entityFilter.toLowerCase())) ||
                         (a.assessor && a.assessor.toLowerCase().includes(entityFilter.toLowerCase()));
      return matchStatus && matchEntity;
    });
  }, [statusFilter, entityFilter, audits]);

  const stats = useMemo(() => {
    const completed = filteredAudits.filter(a => a.status === 'Completed').length;
    const pending = audits.filter(a => a.findings && a.findings.trim() !== '').length;
    return [
      { 
        label: 'Pending Findings', 
        value: pending.toString(), 
        change: 'Requires Action', 
        icon: AlertCircle, 
        color: 'text-red-500', 
        progress: (pending / (audits.length || 1)) * 100, 
        isSteps: false,
        onClick: () => {
          setEntityFilter('');
          setStatusFilter('All');
          // We can't easily filter by "has findings" with current simple filters, 
          // but we can at least scroll to the table or filter by non-completed
          setStatusFilter('Review Pending');
        }
      },
      { label: 'Audits Completed', value: completed.toString(), change: `From ${filteredAudits.length} visible`, icon: CheckSquare, color: 'text-emerald-500', progress: (completed / (filteredAudits.length || 1)) * 100 },
    ];
  }, [filteredAudits, audits, setStatusFilter]);

   const [newFinding, setNewFinding] = useState('');

  const handleAddFinding = () => {
    if (!newFinding.trim() || !selectedAudit) return;
    const currentFindings = selectedAudit.findingEntries || [];
    const updatedAudit = {
      ...selectedAudit,
      findingEntries: [...currentFindings, { text: newFinding, date: formatDate(new Date()) }],
      findings: (selectedAudit.findings || '') + (selectedAudit.findings ? '\n' : '') + newFinding,
      status: 'Review Pending'
    };
    setSelectedAudit(updatedAudit);
    setNewFinding('');
  };

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedProject = projects.find(p => p.id === newAudit.projectId);
      if (!selectedProject) {
        alert('Please select a valid project.');
        return;
      }

      await addAudit({
        entity: `${selectedProject.carline} ${selectedProject.dptPhase} | ${selectedProject.name}`,
        standard: 'ISO 9001:2015',
        assessor: newAudit.assessor,
        date: newAudit.datePlanned,
        status: 'Scheduled',
        statusColor: 'text-text-secondary bg-surface-3 border-border-2',
        notes: newAudit.notes,
        action: 'Audit Booked'
      });
      setShowNewAuditForm(false);
      setNewAudit({ projectId: '', assessor: '', datePlanned: '', notes: '' });
      alert('Audit booked successfully!');
    } catch (error) {
      console.error('Failed to create audit:', error);
      alert('Failed to book audit. Please check your permissions and try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this audit record permanently?')) {
      try {
        await deleteAudit(id);
      } catch (error) {
        alert('Failed to delete audit. Please check your permissions.');
      }
    }
  };

  return (
    <div className="flex gap-10 animate-in fade-in duration-500">
      {/* Audit Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-1 border border-border-2 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-border-1 bg-surface-2/30 flex justify-between items-center bg-background/50">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{selectedAudit.reference || selectedAudit.id}</span>
                <h2 className="text-xl font-black text-text-primary tracking-tight uppercase leading-tight">{selectedAudit.entity}</h2>
              </div>
              <button onClick={() => setSelectedAudit(null)} className="text-text-tertiary hover:text-text-primary">
                <Trash2 className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Standard</span>
                    <span className="text-sm font-bold text-text-primary">{selectedAudit.standard}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Assessor</span>
                    <span className="text-sm font-bold text-text-primary">{selectedAudit.assessor}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Audit Date</span>
                    <span className="text-sm font-bold text-text-primary">{formatDate(selectedAudit.date)}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Rectification Deadline</span>
                    <input 
                      type="date"
                      className="bg-surface-2 border border-border-2 rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-orange-500/50 transition-colors"
                      value={selectedAudit.rectificationDeadline || ''}
                      onChange={e => setSelectedAudit({...selectedAudit, rectificationDeadline: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Status</span>
                    <div className="flex">
                      <span className={cn("px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider border", selectedAudit.statusColor)}>
                        {selectedAudit.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-border-1 pt-6">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" /> Non-Compliances & Findings
                </h3>
                <div className="space-y-4 bg-surface-2 p-5 rounded-xl border border-border-1">
                  <div className="flex gap-2">
                    <textarea 
                      className="flex-1 bg-background border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-orange-500 transition-colors h-24 resize-none"
                      placeholder="Describe any non-compliances, deviations or observations found..."
                      value={newFinding}
                      onChange={e => setNewFinding(e.target.value)}
                    />
                    <button 
                      onClick={handleAddFinding}
                      className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:brightness-110 flex flex-col items-center justify-center gap-1 min-w-[80px]"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span className="text-[9px] font-black uppercase">Record</span>
                    </button>
                  </div>

                  {/* Recorded Findings List */}
                  {selectedAudit.findingEntries && selectedAudit.findingEntries.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Recorded Findings</span>
                      {selectedAudit.findingEntries.map((finding: any, idx: number) => (
                        <div key={idx} className="bg-background border border-border-2 rounded-lg p-3 text-xs text-text-primary relative group">
                          <p className="pr-12">{finding.text}</p>
                          <span className="absolute bottom-2 right-3 text-[8px] font-bold text-text-tertiary">{finding.date}</span>
                          <button 
                            onClick={() => {
                              const updatedEntries = selectedAudit.findingEntries.filter((_: any, i: number) => i !== idx);
                              setSelectedAudit({ ...selectedAudit, findingEntries: updatedEntries });
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t border-border-1 pt-6">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                  <MoreVertical className="w-4 h-4 text-text-tertiary" /> Observations & Comments
                </h3>
                <div className="space-y-4 bg-surface-2 p-5 rounded-xl border border-border-1">
                  <textarea 
                    className="w-full bg-background border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-colors h-24 resize-none"
                    placeholder="General assessor comments or improvement suggestions..."
                    value={selectedAudit.comments || ''}
                    onChange={e => setSelectedAudit({...selectedAudit, comments: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => {
                    setSelectedAudit(null);
                    setNewFinding('');
                  }}
                  className="flex-1 px-6 py-4 border border-border-2 text-text-secondary rounded-xl font-display font-bold text-xs uppercase tracking-widest hover:bg-surface-2 transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={async () => {
                    await updateAudit(selectedAudit.id, { 
                      findingEntries: selectedAudit.findingEntries || [],
                      findings: (selectedAudit.findingEntries || []).map((f: any) => f.text).join('\n'), 
                      comments: selectedAudit.comments || '',
                      rectificationDeadline: selectedAudit.rectificationDeadline || '',
                      status: (selectedAudit.findingEntries && selectedAudit.findingEntries.length > 0) ? 'Review Pending' : selectedAudit.status
                    });
                    setSelectedAudit(null);
                    setNewFinding('');
                    alert('Audit record updated successfully.');
                  }}
                  className="flex-1 px-6 py-4 bg-orange-500 text-white rounded-xl font-display font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-orange-500/20"
                >
                  Save Changes
                </button>
                {selectedAudit.status !== 'Completed' && (
                  <button 
                    onClick={async () => {
                      await updateAudit(selectedAudit.id, { 
                        status: 'Completed',
                        statusColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                      });
                      setSelectedAudit(null);
                    }}
                    className="flex-1 px-6 py-4 bg-primary text-on-primary rounded-xl font-display font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all"
                  >
                    Finalize Audit
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex-1 space-y-10">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h1 className="font-display text-4xl font-black text-text-primary tracking-tight">
              Audits
            </h1>
            {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.USER) && (
              <button 
                onClick={() => setShowNewAuditForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-display font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              >
                <CheckSquare className="w-4 h-4" />
                New Audit
              </button>
            )}
          </div>
        </div>

        {/* New Audit Modal */}
        {showNewAuditForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface-1 border border-border-2 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-border-1 bg-surface-2/30 flex justify-between items-center">
                <h2 className="text-xl font-black text-text-primary tracking-tight uppercase">Book New Audit</h2>
                <button onClick={() => setShowNewAuditForm(false)} className="text-text-tertiary hover:text-text-primary">
                  <Trash2 className="w-5 h-5 rotate-45" />
                </button>
              </div>
              <form onSubmit={handleCreateAudit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Project to be Audited</label>
                    <select 
                      required
                      className="w-full bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-colors appearance-none"
                      value={newAudit.projectId}
                      onChange={e => setNewAudit({...newAudit, projectId: e.target.value})}
                    >
                      <option value="">Select a project...</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.carline} {p.dptPhase} | {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Assessor Name</label>
                    <input 
                      required
                      type="text"
                      className="w-full bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                      value={newAudit.assessor}
                      onChange={e => setNewAudit({...newAudit, assessor: e.target.value})}
                      placeholder="Enter assessor name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Planned Date</label>
                    <input 
                      required
                      type="date"
                      className="w-full bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-colors"
                      value={newAudit.datePlanned}
                      onChange={e => setNewAudit({...newAudit, datePlanned: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Additional Notes</label>
                    <textarea 
                      className="w-full bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary transition-colors h-24 resize-none"
                      value={newAudit.notes}
                      onChange={e => setNewAudit({...newAudit, notes: e.target.value})}
                      placeholder="Any specific instructions or context..."
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowNewAuditForm(false)}
                    className="flex-1 px-6 py-3 border border-border-2 text-text-secondary rounded-xl font-display font-bold text-xs uppercase tracking-widest hover:bg-surface-2 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-xl font-display font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Health Cards */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div 
              key={stat.label} 
              className={cn(
                "bg-surface-2 border border-border-2 p-5 rounded-xl shadow-2xl flex flex-col gap-4 transition-all",
                stat.onClick ? "cursor-pointer hover:bg-surface-3 active:scale-[0.98]" : ""
              )}
              onClick={stat.onClick}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.15em]">{stat.label}</span>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-text-primary tracking-tight">{stat.value}</span>
                <span className={cn("text-[10px] font-bold", stat.color.includes('red') ? 'text-red-500' : stat.color.includes('primary') ? 'text-green-500' : 'text-text-secondary')}>
                  {stat.change}
                </span>
              </div>
              <div className="w-full bg-surface-3 h-1 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.progress}%` }}
                  className={cn("h-full", stat.color.includes('red') ? 'bg-red-500' : stat.label.includes('Compliance') || stat.label.includes('Completed') ? 'bg-emerald-500' : 'bg-primary')}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-surface-1 border border-border-2 rounded-xl p-4 flex gap-6 shadow-xl">
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">Status</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-border-2 text-text-primary text-xs rounded-lg px-3 py-2 outline-none cursor-pointer"
            >
              <option>All</option>
              <option>Completed</option>
              <option>Review Pending</option>
              <option>Scheduled</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">Search Entity</span>
            <input 
              type="text"
              placeholder="Search by reference, entity or assessor..."
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-background border border-border-2 text-text-primary text-xs rounded-lg px-3 py-2 outline-none"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-surface-1 border border-border-2 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 bg-background/50 border-b border-border-1 flex justify-between items-center">
            <h2 className="font-display font-bold text-text-primary uppercase tracking-widest text-xs">Active Audits & Inspections</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="text-text-tertiary border-b border-border-1">
                  <th className="px-6 py-4 font-black uppercase tracking-[0.15em] text-[10px]">Reference ID</th>
                  <th className="px-6 py-4 font-black uppercase tracking-[0.15em] text-[10px]">Audit Entity</th>
                  <th className="px-6 py-4 font-black uppercase tracking-[0.15em] text-[10px]">Standard</th>
                  <th className="px-6 py-4 font-black uppercase tracking-[0.15em] text-[10px]">Assessor</th>
                  <th className="px-6 py-4 font-black uppercase tracking-[0.15em] text-[10px]">Status</th>
                  <th className="px-6 py-4 font-black uppercase tracking-[0.15em] text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-1">
                {filteredAudits.map((audit) => (
                  <tr 
                    key={audit.id} 
                    onClick={() => setSelectedAudit(audit)}
                    className="hover:bg-surface-2/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-5 text-text-primary text-[11px] font-bold">{audit.reference || audit.id}</td>
                    <td className="px-6 py-5 text-text-primary text-[11px] font-medium">{audit.entity}</td>
                    <td className="px-6 py-5 text-text-secondary text-[11px]">{audit.standard}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center text-[9px] font-bold border border-border-2">
                          {audit.assessor.split('. ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-text-secondary text-[11px]">{audit.assessor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn("px-2.5 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider border", audit.statusColor)}>
                        {audit.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        {currentUser?.role === UserRole.ADMIN && (
                          <button 
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"
                            onClick={() => handleDelete(audit.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Timeline Sidebar */}
      <aside className="w-80 space-y-6">
        <div className="bg-surface-1 border border-border-2 rounded-xl h-full flex flex-col shadow-2xl">
          <div className="px-6 py-4 bg-background/50 border-b border-border-1">
            <h2 className="font-display font-bold text-text-primary">Event Timeline</h2>
          </div>
          <div className="p-6 space-y-8 overflow-y-auto max-h-[600px] custom-scrollbar">
            {timelineData.map((item, idx) => (
              <div 
                key={idx} 
                className="relative pl-6 border-l border-border-2 cursor-pointer group hover:bg-surface-2/50 py-2 -ml-2 rounded-r-lg transition-all"
                onClick={() => {
                  if (item.auditId) {
                    const audit = audits.find(a => a.id === item.auditId);
                    if (audit) setSelectedAudit(audit);
                  }
                }}
              >
                <div className={cn("absolute -left-[5px] top-4 w-2.5 h-2.5 rounded-full", item.color)} />
                <div className="flex flex-col gap-1.5 ml-2">
                  <span className={cn("font-black text-[9px] uppercase tracking-widest", item.color.replace('bg-', 'text-'))}>{item.time}</span>
                  <p className="text-text-primary text-xs font-bold leading-tight group-hover:text-primary transition-colors">{item.event}</p>
                  <p className="text-text-secondary text-[11px] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

    </div>
  );
}
