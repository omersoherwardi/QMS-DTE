import React, { useState, useMemo } from 'react';
import { 
  Filter as FilterIcon, 
  RotateCcw,
  MoreVertical, 
  SignalHigh,
  SignalMedium,
  SignalLow,
  Plus,
  Lock,
  Download,
  Trash2,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

import { useNavigate } from 'react-router-dom';

import { useProjects, UserRole } from '../context/ProjectContext';

export default function Projects() {
  const { projects, searchQuery, canEditProject, canCreateProject, deleteProject, currentUser } = useProjects();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [ownerFilter, setOwnerFilter] = useState('All Owners');
  const [carlineFilter, setCarlineFilter] = useState('All Carlines');
  const [phaseFilter, setPhaseFilter] = useState('All Phases');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [loadcaseFilter, setLoadcaseFilter] = useState<string[]>([]);
  const [isLoadcaseDropdownOpen, setIsLoadcaseDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const resetFilters = () => {
    setStatusFilter('All Status');
    setOwnerFilter('All Owners');
    setCarlineFilter('All Carlines');
    setPhaseFilter('All Phases');
    setPriorityFilter('All Priorities');
    setTypeFilter('All Types');
    setLoadcaseFilter([]);
    setCurrentPage(1);
  };

  const filteredProjects = useMemo(() => {
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
      const matchStatus = statusFilter === 'All Status' || p.status === statusFilter;
      const matchOwner = ownerFilter === 'All Owners' || p.owner === ownerFilter;
      const matchCarline = carlineFilter === 'All Carlines' || p.carline === carlineFilter;
      const matchPhase = phaseFilter === 'All Phases' || p.dptPhase === phaseFilter;
      const matchPriority = priorityFilter === 'All Priorities' || p.priority === priorityFilter;
      const matchType = typeFilter === 'All Types' || p.type === typeFilter;
      const matchLoadcase = loadcaseFilter.length === 0 || loadcaseFilter.includes(p.name.split(' Loop')[0]);
      return matchSearch && matchStatus && matchOwner && matchCarline && matchPhase && matchPriority && matchType && matchLoadcase;
    });
  }, [projects, searchQuery, statusFilter, ownerFilter, carlineFilter, phaseFilter, priorityFilter, typeFilter, loadcaseFilter]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const handleExport = () => {
    const headers = [
      "Proj ID",
      "Carline",
      "Type",
      "DPT Phase",
      "Loadcase",
      "DI44",
      "Owner Email",
      "Responsible",
      "Priority",
      "Zone Mtg",
      "Status",
      "Progress",
      "Planned Start",
      "Planned End",
      "Actual Start",
      "Actual End",
      "All Inputs Received Date",
      "Preprocessing Chekkai",
      "Preprocessing Chekkai Not Required",
      "Model Chekkai",
      "Model Chekkai Not Required",
      "Results Chekkai",
      "Results Chekkai Not Required",
      "Notes",
      "On Hold Periods",
      "Revised End Dates",
      "Project Notes History"
    ];

    const formatVal = (val: any) => {
      if (val === undefined || val === null) {
        return 'N/A';
      }
      if (typeof val === 'string' && val.trim() === '') {
        return 'N/A';
      }
      if (Array.isArray(val)) {
        if (val.length === 0) return 'N/A';
        const items = val.map((item: any) => {
          if (item && typeof item === 'object') {
            if (item.start && item.end) {
              return `${item.start} to ${item.end}${item.reason ? ` (${item.reason})` : ''}`;
            }
            if (item.text && item.date) {
              return `[${item.date} by ${item.author || 'N/A'}]: ${item.text}`;
            }
            return JSON.stringify(item);
          }
          return String(item);
        });
        let str = items.join(' | ');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }
      if (typeof val === 'boolean') {
        return val ? 'YES' : 'NO';
      }
      let str = String(val).trim();
      if (str === '') {
        return 'N/A';
      }
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const rows = filteredProjects.map(p => {
      const rowData = [
        formatVal(p.code),
        formatVal(p.carline),
        formatVal(p.type),
        formatVal(p.dptPhase),
        formatVal(p.name),
        formatVal(p.owner),
        formatVal(p.ownerEmail),
        formatVal(p.responsiblePerson),
        formatVal(p.priority),
        formatVal(p.presentedInZoneMeeting),
        formatVal(p.status),
        formatVal(p.progress !== undefined ? `${p.progress}%` : ''),
        formatVal(p.plannedStart),
        formatVal(p.plannedEnd),
        formatVal(p.actualStart),
        formatVal(p.actualEnd),
        formatVal(p.allInputsReceivedDate),
        formatVal(p.preprocessingChekkai),
        formatVal(p.preprocessingChekkaiNotRequired),
        formatVal(p.modelChekkai),
        formatVal(p.modelChekkaiNotRequired),
        formatVal(p.resultsChekkai),
        formatVal(p.resultsChekkaiNotRequired),
        formatVal(p.notes),
        formatVal(p.onHoldPeriods),
        formatVal(p.revisedEndDates),
        formatVal(p.projectNotes)
      ];
      return rowData.join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(",")].concat(rows).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "projects_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadList = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) alert(`Processing list: ${file.name}`);
    };
    input.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <h1 className="font-display text-4xl font-black text-text-primary tracking-tight">Projects</h1>
        </div>
        <div className="flex gap-3">
          {canCreateProject() && (
            <button 
              onClick={() => navigate('/projects/new')}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-display font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )}
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 border border-border-2 text-text-primary rounded-xl font-display font-bold text-xs uppercase tracking-widest hover:bg-surface-2 transition-all shadow-lg"
          >
            <Download className="w-4 h-4" />
            Export List
          </button>
        </div>
      </div>

      <div className="bg-surface-1 border border-border-2 rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-xl">
        <div className="flex-1 flex flex-wrap gap-4 pb-2 md:pb-0">
          <div className="flex flex-col gap-1.5 min-w-[110px]">
            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">Status</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-border-2 text-text-primary text-[10px] sm:text-xs rounded-lg px-2 py-2 focus:border-primary outline-none appearance-none cursor-pointer"
            >
              <option>All Status</option>
              <option>To be started</option>
              <option>In Progress</option>
              <option>On Hold</option>
              <option>Completed</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[130px] relative">
            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">Loadcase</span>
            <div 
              onClick={() => setIsLoadcaseDropdownOpen(!isLoadcaseDropdownOpen)}
              className="bg-background border border-border-2 text-text-primary text-[10px] sm:text-xs rounded-lg px-2 py-2 w-full cursor-pointer flex justify-between items-center group hover:border-primary transition-colors h-full"
            >
              <span className="truncate max-w-[100px]">
                {loadcaseFilter.length === 0 ? 'All Loadcases' : 
                 loadcaseFilter.length === 1 ? loadcaseFilter[0] : 
                 `${loadcaseFilter.length} Selected`}
              </span>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-text-tertiary group-hover:border-t-primary ml-2" />
            </div>
            
            {isLoadcaseDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsLoadcaseDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-56 bg-surface-1 border border-border-2 rounded-lg shadow-2xl z-20 py-2 flex flex-col max-h-60 overflow-y-auto overflow-x-hidden backdrop-blur-md">
                  {Array.from(new Set(projects.map(p => p.name.split(' Loop')[0]))).map(name => (
                    <label 
                      key={name}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-surface-2 cursor-pointer transition-colors"
                    >
                      <input 
                        type="checkbox"
                        checked={loadcaseFilter.includes(name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLoadcaseFilter([...loadcaseFilter, name]);
                          } else {
                            setLoadcaseFilter(loadcaseFilter.filter(f => f !== name));
                          }
                        }}
                        className="rounded border-border-2 text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight truncate">{name}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col gap-1.5 min-w-[130px]">
            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">DI44</span>
            <select 
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="bg-background border border-border-2 text-text-primary text-[10px] sm:text-xs rounded-lg px-2 py-2 focus:border-primary outline-none appearance-none cursor-pointer"
            >
              <option>All Owners</option>
              {Array.from(new Set(projects.map(p => p.owner))).map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[110px]">
            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">Carline</span>
            <select 
              value={carlineFilter}
              onChange={(e) => setCarlineFilter(e.target.value)}
              className="bg-background border border-border-2 text-text-primary text-[10px] sm:text-xs rounded-lg px-2 py-2 focus:border-primary outline-none appearance-none cursor-pointer"
            >
              <option>All Carlines</option>
              {Array.from(new Set(projects.map(p => p.carline))).sort().map(carline => (
                <option key={carline} value={carline}>{carline}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[120px]">
            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">DPT Phase</span>
            <select 
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="bg-background border border-border-2 text-text-primary text-[10px] sm:text-xs rounded-lg px-2 py-2 focus:border-primary outline-none appearance-none cursor-pointer"
            >
              <option>All Phases</option>
              {Array.from(new Set(projects.map(p => p.dptPhase))).sort().map(phase => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[110px]">
            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">Priority</span>
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-background border border-border-2 text-text-primary text-[10px] sm:text-xs rounded-lg px-2 py-2 focus:border-primary outline-none appearance-none cursor-pointer"
            >
              <option>All Priorities</option>
              <option>Critical</option>
              <option>High</option>
              <option>Low</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[110px]">
            <span className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">Type</span>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-background border border-border-2 text-text-primary text-[10px] sm:text-xs rounded-lg px-2 py-2 focus:border-primary outline-none appearance-none cursor-pointer"
            >
              <option>All Types</option>
              <option>Planned</option>
              <option>Adhoc</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={resetFilters}
            className="flex items-center gap-2 px-3 py-2 border border-border-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-surface-1 border border-border-2 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2/30 border-b border-border-1">
                <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Proj ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Carline</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">DPT Phase</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Loadcase</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">DI44</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Responsible</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Priority</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Zone Mtg</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-1">
              {paginatedProjects.map((project) => (
                <tr 
                  key={project.id} 
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="hover:bg-background/40 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary font-mono text-[10px]">{project.code}</span>
                      {!canEditProject(project) && <Lock className="w-3 h-3 text-text-tertiary" />}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-text-primary text-xs font-black uppercase tracking-wider">{project.carline}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border",
                      project.type === 'Planned' ? "text-primary bg-primary/10 border-primary/20" : "text-purple-400 bg-purple-400/10 border-purple-400/20"
                    )}>
                      {project.type}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-text-primary text-xs font-medium">{project.dptPhase}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-text-primary font-bold text-sm leading-tight">{project.name}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-surface-3 flex items-center justify-center text-[8px] font-black text-text-secondary border border-border-2">
                        {project.owner.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-text-primary text-xs font-medium">{project.owner}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-text-primary text-xs font-medium">{project.responsiblePerson}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <project.priorityIcon className={cn("w-3.5 h-3.5", 
                        project.priority === 'Critical' ? 'text-red-500' : 
                        project.priority === 'High' ? 'text-orange-500' : 'text-blue-500')} />
                      <span className="text-text-primary text-xs font-medium">{project.priority}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider",
                      project.presentedInZoneMeeting ? "text-emerald-500" : "text-text-tertiary"
                    )}>
                      {project.presentedInZoneMeeting ? 'YES' : 'NO'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border",
                      project.status === 'Completed' ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : 
                      project.status === 'On Hold' ? "text-gray-400 bg-gray-400/10 border-gray-400/20" :
                      project.status === 'To be started' ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
                      "text-blue-400 bg-blue-400/10 border-blue-400/20"
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mr-2",
                        project.status === 'Completed' ? "bg-emerald-500" : 
                        project.status === 'On Hold' ? "bg-gray-400" :
                        project.status === 'To be started' ? "bg-amber-400" :
                        "bg-blue-400"
                      )} />
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        {currentUser?.role === UserRole.ADMIN && (
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if(window.confirm('Delete project permanently?')) {
                                try {
                                  await deleteProject(project.id);
                                } catch (error) {
                                  alert('Failed to delete project.');
                                }
                              }
                            }}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded border border-red-400/20"
                            title="Delete Project"
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
        
        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-border-1 flex items-center justify-between bg-surface-1/50">
          <span className="text-text-tertiary font-mono text-[10px] uppercase font-bold">
            Showing <span className="text-text-primary">{paginatedProjects.length}</span> of <span className="text-text-primary">{filteredProjects.length}</span> projects
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-surface-2 border border-border-2 rounded text-text-secondary hover:text-text-primary transition-colors text-xs font-bold disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(page); }}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded text-[10px] font-black transition-all",
                    currentPage === page 
                      ? "bg-primary text-on-primary" 
                      : "border border-border-2 text-text-tertiary hover:border-primary hover:text-text-primary"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 bg-surface-2 border border-border-2 rounded text-text-secondary hover:text-text-primary transition-colors text-xs font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
