import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PieChart, 
  Pie,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  History, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useProjects, formatDate } from '../context/ProjectContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects, searchQuery, canCreateProject, loading } = useProjects();

  // Default from date: today - 1 month, to date: today + 1 month
  const defaultFrom = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  }, []);
  const defaultTo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [fromDate, setFromDate] = useState(defaultFrom || '');
  const [toDate, setToDate] = useState(defaultTo || '');

  const resetDates = () => {
    setFromDate(defaultFrom);
    setToDate(defaultTo);
  };

  const filteredBySearchAndDate = useMemo(() => {
    return projects.filter(p => {
      const searchStr = searchQuery.toLowerCase();
      const matchSearch = searchQuery === '' || 
        p.id.toLowerCase().includes(searchStr) || 
        p.code.toLowerCase().includes(searchStr) ||
        p.name.toLowerCase().includes(searchStr) ||
        p.carline.toLowerCase().includes(searchStr) ||
        p.dptPhase.toLowerCase().includes(searchStr) ||
        p.owner.toLowerCase().includes(searchStr) ||
        p.responsiblePerson.toLowerCase().includes(searchStr);
      
      const pStart = p.plannedStart;
      const pEnd = p.plannedEnd;
      
      // Projects ongoing or to be started in the range
      const matchDate = (fromDate === '' || pEnd >= fromDate || pStart >= fromDate) && 
                        (toDate === '' || pStart <= toDate);

      return matchSearch && matchDate;
    });
  }, [projects, searchQuery, fromDate, toDate]);

  const toBeStartedProjects = filteredBySearchAndDate.filter(p => p.status === 'To be started');
  const ongoingProjects = filteredBySearchAndDate.filter(p => p.status === 'In Progress');
  const onHoldProjects = filteredBySearchAndDate.filter(p => p.status === 'On Hold');
  const completedProjects = filteredBySearchAndDate.filter(p => p.status === 'Completed');

  const typeDistribution = useMemo(() => {
    const plannedCount = filteredBySearchAndDate.filter(p => p.type === 'Planned').length;
    const adhocCount = filteredBySearchAndDate.filter(p => p.type === 'Adhoc').length;
    return [
      { name: 'Planned', value: plannedCount },
      { name: 'Adhoc', value: adhocCount }
    ];
  }, [filteredBySearchAndDate]);

  const carlineDistribution = useMemo(() => {
    const weeksByCarline: Record<string, number> = {};
    
    filteredBySearchAndDate.forEach(p => {
      if (!p.plannedStart) return;
      
      const projectStart = p.actualStart || p.plannedStart;
      const projectEnd = (p.actualEnd && p.actualEnd !== 'TBD' && p.actualEnd !== '') ? p.actualEnd : p.plannedEnd;

      const pStart = new Date(projectStart);
      const pEnd = new Date(projectEnd);

      if (isNaN(pStart.getTime()) || isNaN(pEnd.getTime())) return;

      const startLimit = fromDate ? new Date(fromDate) : new Date('1970-01-01');
      const endLimit = toDate ? new Date(toDate) : new Date('2099-12-31');

      const startIntersection = pStart > startLimit ? pStart : startLimit;
      const endIntersection = pEnd < endLimit ? pEnd : endLimit;

      if (startIntersection <= endIntersection) {
        const diffMs = endIntersection.getTime() - startIntersection.getTime() + 86400000;
        const weeks = diffMs / (1000 * 60 * 60 * 24 * 7);
        weeksByCarline[p.carline] = (weeksByCarline[p.carline] || 0) + weeks;
      }
    });

    return Object.entries(weeksByCarline).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(1))
    })).filter(entry => entry.value > 0);
  }, [filteredBySearchAndDate, fromDate, toDate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"
        />
        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] animate-pulse">Syncing QMS Data...</p>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#a855f7']; // blue for planned, purple for adhoc

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-4xl font-black text-text-primary tracking-tight">Dashboard </h1>
        </div>
        {canCreateProject() && (
          <button 
            onClick={() => navigate('/projects/new')}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-display font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            <TrendingUp className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Document Kanban Board */}
        <div className="col-span-12 bg-surface-1 rounded-xl border border-border-2 shadow-xl flex flex-col min-h-[450px]">
          <div className="px-6 py-4 border-b border-border-2 bg-surface-1/50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3 className="font-display font-bold text-text-primary uppercase tracking-wider text-sm">Kanban Board</h3>
              <div className="h-4 w-px bg-border-2 mx-2" />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-text-tertiary uppercase">From</span>
                  <input 
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="bg-background border border-border-2 text-text-primary text-[10px] rounded px-2 py-1 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-text-tertiary uppercase">To</span>
                  <input 
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="bg-background border border-border-2 text-text-primary text-[10px] rounded px-2 py-1 outline-none"
                  />
                </div>
                <button 
                  onClick={resetDates}
                  className="flex items-center gap-1.5 px-2 py-1 bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary rounded border border-border-2 transition-all text-[9px] font-black uppercase tracking-widest"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Reset
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-4 grid grid-cols-4 gap-4 overflow-hidden">
            {/* Column 1: To be started */}
            <div className="flex flex-col gap-3 min-w-0">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">To be started</span>
                  </div>
                  <span className="text-[10px] font-mono text-text-tertiary">{toBeStartedProjects.length}</span>
                </div>
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                {toBeStartedProjects.map((project) => (
                  <div 
                    key={project.code} 
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="bg-surface-2 border border-border-2 p-3 rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-mono text-primary font-bold">{project.code}</span>
                    </div>
                    <p className="text-xs font-bold text-text-primary leading-tight mb-1">
                      {project.carline} {project.dptPhase} | {project.name}
                    </p>
                    <div className="text-[9px] font-mono text-text-tertiary mb-3">Start: {formatDate(project.plannedStart)}</div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <div className={cn("w-1 h-1 rounded-full", 
                          project.priority === 'Critical' ? "bg-red-500" : 
                          project.priority === 'High' ? "bg-orange-500" : "bg-blue-500")} />
                        <span className={cn("text-[8px] font-black uppercase tracking-tighter", 
                          project.priority === 'Critical' ? "text-red-500" : 
                          project.priority === 'High' ? "text-orange-500" : "text-blue-500")}>
                          {project.priority}
                        </span>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-surface-3 border border-border-2 flex items-center justify-center text-[8px] font-bold">
                        {project.owner.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Ongoing */}
            <div className="flex flex-col gap-3 min-w-0 border-l border-border-1 pl-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Ongoing</span>
                  </div>
                  <span className="text-[10px] font-mono text-text-tertiary">{ongoingProjects.length}</span>
                </div>
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                {ongoingProjects.map((project) => (
                  <div 
                    key={project.code} 
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="bg-surface-2 border border-border-2 p-3 rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-mono text-primary font-bold">{project.code}</span>
                    </div>
                    <p className="text-xs font-bold text-text-primary leading-tight mb-1">
                      {project.carline} {project.dptPhase} | {project.name}
                    </p>
                    <div className="text-[9px] font-mono text-text-tertiary mb-3">Start: {formatDate(project.plannedStart)}</div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <div className={cn("w-1 h-1 rounded-full", 
                          project.priority === 'Critical' ? "bg-red-500" : 
                          project.priority === 'High' ? "bg-orange-500" : "bg-blue-500")} />
                        <span className={cn("text-[8px] font-black uppercase tracking-tighter", 
                          project.priority === 'Critical' ? "text-red-500" : 
                          project.priority === 'High' ? "text-orange-500" : "text-blue-500")}>
                          {project.priority}
                        </span>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-surface-3 border border-border-2 flex items-center justify-center text-[8px] font-bold">
                        {project.owner.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: On Hold */}
            <div className="flex flex-col gap-3 min-w-0 border-x border-border-1 px-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">On Hold</span>
                </div>
                <span className="text-[10px] font-mono text-text-tertiary">{onHoldProjects.length}</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                {onHoldProjects.map((project) => (
                  <div 
                    key={project.code} 
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="bg-surface-2 border border-border-2 p-3 rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-mono text-primary font-bold">{project.code}</span>
                    </div>
                    <p className="text-xs font-bold text-text-primary leading-tight mb-1">
                      {project.carline} {project.dptPhase} | {project.name}
                    </p>
                    <div className="text-[9px] font-mono text-text-tertiary mb-3">Start: {formatDate(project.plannedStart)}</div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <div className={cn("w-1 h-1 rounded-full bg-gray-500")} />
                        <span className={cn("text-[8px] font-black uppercase tracking-tighter text-text-tertiary")}>{project.priority}</span>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-surface-3 border border-border-2 flex items-center justify-center text-[8px] font-bold">
                        {project.owner.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Completed */}
            <div className="flex flex-col gap-3 min-w-0">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Completed</span>
                </div>
                <span className="text-[10px] font-mono text-text-tertiary">{completedProjects.length}</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                {completedProjects.map((project) => (
                  <div 
                    key={project.code} 
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="bg-surface-2 border border-border-2 p-3 rounded-lg hover:border-primary/50 transition-colors cursor-pointer group opacity-60 hover:opacity-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono text-primary font-bold">{project.code}</span>
                    </div>
                    <p className="text-xs font-bold text-text-primary leading-tight mb-1">
                      {project.carline} {project.dptPhase} | {project.name}
                    </p>
                    <div className="text-[9px] font-mono text-text-tertiary mb-3">Start: {formatDate(project.plannedStart)}</div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        <span className="text-[8px] font-black uppercase tracking-tighter text-emerald-500">{project.priority}</span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Type Distribution */}
          <div className="bg-surface-1 rounded-xl border border-border-2 shadow-xl p-6 flex flex-col items-center justify-center min-h-[400px]">
            <h3 className="font-display font-bold text-text-primary uppercase tracking-widest text-xs mb-4 w-full text-center">Project Type Distribution</h3>
            <div className="flex-1 w-full h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={false}
                    labelLine={false}
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface-2)', 
                      borderColor: 'var(--color-border-2)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-6 w-full max-w-sm mt-4">
              <div className="bg-surface-2 p-3 rounded-xl border border-border-2 text-center">
                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider mb-1">Planned</p>
                <p className="text-2xl font-black text-primary">{typeDistribution[0].value}</p>
              </div>
              <div className="bg-surface-2 p-3 rounded-xl border border-border-2 text-center">
                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider mb-1">Adhoc</p>
                <p className="text-2xl font-black text-purple-400">{typeDistribution[1].value}</p>
              </div>
            </div>
          </div>

          {/* Carline Distribution */}
          <div className="bg-surface-1 rounded-xl border border-border-2 shadow-xl p-6 flex flex-col items-center justify-center min-h-[400px]">
            <h3 className="font-display font-bold text-text-primary uppercase tracking-widest text-xs mb-4 w-full text-center">Carline Distribution</h3>
            <div className="flex-1 w-full h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={carlineDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {carlineDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${(index * 70) % 360}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [`${val} Weeks`, 'Work Duration']}
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface-2)', 
                      borderColor: 'var(--color-border-2)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
