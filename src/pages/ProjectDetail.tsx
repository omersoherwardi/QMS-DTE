import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  Clock, 
  PauseCircle, 
  PlayCircle,
  Lock,
  Unlock,
  Check,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Plus,
  Image as ImageIcon,
  Paperclip
} from 'lucide-react';
import { useProjects, formatDate } from '../context/ProjectContext';
import { cn, getWeekNumber } from '../lib/utils';
import { motion } from 'motion/react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, updateProject, deleteProject } = useProjects();

  const project = projects.find(p => p.id === id);
  const allInputsReceivedDate = project?.preprocessingChekkaiData?.verifiedDate;
  const resultsAvailableDate = project?.resultsChekkaiData?.verifiedDate;
  
  const { canEditProject, canDeleteProject } = useProjects();
  const isReadOnly = project ? !canEditProject(project) : true;

  const handleDelete = async () => {
    if (project && window.confirm('Are you sure you want to delete this project permanently? This action cannot be undone.')) {
      try {
        await deleteProject(project.id);
        navigate('/projects');
      } catch (error) {
        alert('Failed to delete project. Please check if you have admin privileges.');
      }
    }
  };
  
  const [tempHoldStart, setTempHoldStart] = useState(new Date().toLocaleDateString('en-CA'));
  const [tempHoldEnd, setTempHoldEnd] = useState('');
  const [tempHoldReason, setTempHoldReason] = useState('');
  const [newRevisedDate, setNewRevisedDate] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [noteImage, setNoteImage] = useState<string | null>(null);
  const [actualStartDateInput, setActualStartDateInput] = useState(project?.actualStart || '');
  const [actualEndDateInput, setActualEndDateInput] = useState(project?.actualEnd || '');

  // Zone Meeting states
  const [zoneMeetingDate, setZoneMeetingDate] = useState('');
  const [zoneMeetingName, setZoneMeetingName] = useState('');
  const [isRecordingPresentation, setIsRecordingPresentation] = useState(false);

  // Sync state when project loads
  React.useEffect(() => {
    // We can clear local input state when project changes if needed
    setZoneMeetingDate('');
    setZoneMeetingName('');
    setIsRecordingPresentation(false);
    setActualStartDateInput(project?.actualStart || '');
    setActualEndDateInput(project?.actualEnd || '');
  }, [project?.id, project?.actualStart, project?.actualEnd]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <h2 className="text-2xl font-black text-text-primary">Project Not Found</h2>
        <button 
          onClick={() => navigate('/projects')}
          className="text-primary font-bold uppercase tracking-widest text-xs hover:underline"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  const handleUpdateDate = (field: 'actualStart' | 'actualEnd', value: string) => {
    if (!value) return; // Prevent empty updates if triggered by weird events

    if (field === 'actualStart') {
      const currentEnd = project.actualEnd || '';
      if (currentEnd && currentEnd !== 'TBD' && value > currentEnd) {
        alert('Actual Start Date cannot be after Actual End Date.');
        return;
      }
    }

    if (field === 'actualEnd') {
      const currentStart = project.actualStart || '';
      if (currentStart && value < currentStart) {
        alert('Actual End Date cannot be before Actual Start Date.');
        return;
      }
    }

    // Prevent updating actualStart if it's already set
    if (field === 'actualStart' && project.actualStart && project.actualStart !== '') {
      return;
    }

    const updates: any = { [field]: value };
    if (field === 'actualStart' && value !== '') {
      if (project.status === 'To be started') {
        updates.status = 'In Progress';
      }
    }
    if (field === 'actualEnd' && value !== '') {
      updates.status = 'Completed';
      updates.progress = 100;
    }
    updateProject(project.id, updates);
  };

  const addHoldPeriod = () => {
    const today = new Date().toLocaleDateString('en-CA');
    
    if (tempHoldStart && tempHoldEnd && tempHoldEnd < tempHoldStart) {
      alert('Hold Period End Date cannot be before Hold Period Start Date.');
      return;
    }

    const newPeriod = { 
      start: tempHoldStart || today, 
      end: tempHoldEnd, 
      reason: tempHoldReason 
    };
    
    const updates: any = { 
      onHoldPeriods: [...(project.onHoldPeriods || []), newPeriod] 
    };

    // Only set to On Hold if there's no end date
    if (!tempHoldEnd) {
      updates.status = 'On Hold';
    }

    updateProject(project.id, updates);
    setTempHoldStart(today);
    setTempHoldEnd('');
    setTempHoldReason('');
  };

  const handleResume = () => {
    const lastPeriod = project.onHoldPeriods[project.onHoldPeriods.length - 1];
    const today = new Date().toLocaleDateString('en-CA');
    
    if (lastPeriod && !lastPeriod.end) {
      const updatedPeriods = [...project.onHoldPeriods];
      updatedPeriods[updatedPeriods.length - 1] = { ...lastPeriod, end: today };
      updateProject(project.id, { 
        status: 'In Progress', 
        onHoldPeriods: updatedPeriods 
      });
    } else {
      updateProject(project.id, { status: 'In Progress' });
    }
  };

  const handleUpdateZoneMeeting = () => {
    if (!zoneMeetingDate || !zoneMeetingName) return;
    
    const newMeeting = {
      name: zoneMeetingName,
      date: zoneMeetingDate
    };
    
    const updatedMeetings = [...(project.zoneMeetings || []), newMeeting];
    
    updateProject(project.id, {
      presentedInZoneMeeting: true,
      zoneMeetings: updatedMeetings
    });

    // Reset local state for next entry
    setZoneMeetingDate('');
    setZoneMeetingName('');
    setIsRecordingPresentation(false);
  };

  const handleNewLoop = () => {
    if (!project) return;
    
    const name = project.name;
    const loopRegex = /\sLoop\s(\d+)$/i;
    const match = name.match(loopRegex);
    let nextName;
    
    if (match) {
      const currentLoop = parseInt(match[1], 10);
      nextName = name.replace(loopRegex, ` Loop ${currentLoop + 1}`);
    } else {
      nextName = `${name} Loop 2`;
    }
    
    const { priorityIcon, statusColor, ...serializableProject } = project;
    
    navigate('/projects/new', { 
      state: { 
        prefill: {
          ...serializableProject,
          name: nextName
        } 
      } 
    });
  };

  const handleAddNote = () => {
    if (!noteInput.trim() && !noteImage) return;
    const newNote = {
      text: noteInput,
      image: noteImage,
      date: formatDate(new Date()),
      author: 'User' // Default to User for now
    };
    const updatedNotes = [...(project.projectNotes || []), newNote];
    updateProject(project.id, { projectNotes: updatedNotes });
    setNoteInput('');
    setNoteImage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File is too large. Please select an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNoteImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleChekkai = (field: 'preprocessingChekkai' | 'modelChekkai' | 'resultsChekkai') => {
    updateProject(project.id, { [field]: !project[field] });
  };

  const handleAddRevisedDate = () => {
    if (!newRevisedDate) return;
    const projectStart = project.actualStart || project.plannedStart;
    if (projectStart && newRevisedDate < projectStart) {
      alert(`Revised End Date cannot be before the project's Start Date (${formatDate(projectStart)}).`);
      return;
    }
    const updatedRevisedDates = [...(project.revisedEndDates || []), newRevisedDate];
    updateProject(project.id, { revisedEndDates: updatedRevisedDates });
    setNewRevisedDate('');
  };

  // Month calculation for timeline
  const getMonthsCovered = () => {
    const dates: Date[] = [];
    
    if (project.plannedStart) {
      const d = new Date(project.plannedStart);
      if (!isNaN(d.getTime())) dates.push(d);
    }
    if (project.plannedEnd) {
      const d = new Date(project.plannedEnd);
      if (!isNaN(d.getTime())) dates.push(d);
    }
    if (project.actualStart) {
      const d = new Date(project.actualStart);
      if (!isNaN(d.getTime())) dates.push(d);
    }
    if (project.actualEnd && project.actualEnd !== 'TBD') {
      const d = new Date(project.actualEnd);
      if (!isNaN(d.getTime())) dates.push(d);
    }
    
    if (allInputsReceivedDate) {
      const d = new Date(allInputsReceivedDate);
      if (!isNaN(d.getTime())) dates.push(d);
    }
    if (resultsAvailableDate) {
      const d = new Date(resultsAvailableDate);
      if (!isNaN(d.getTime())) dates.push(d);
    }
    
    if (project.revisedEndDates) {
      project.revisedEndDates.forEach(dStr => {
        const d = new Date(dStr);
        if (!isNaN(d.getTime())) dates.push(d);
      });
    }

    if (project.onHoldPeriods) {
      project.onHoldPeriods.forEach(period => {
        if (period.start) {
          const d = new Date(period.start);
          if (!isNaN(d.getTime())) dates.push(d);
        }
        if (period.end) {
          const d = new Date(period.end);
          if (!isNaN(d.getTime())) dates.push(d);
        }
      });
    }

    // Include today's date if project is active with actualStart but no actualEnd, or if project status is 'In Progress' with no actualEnd
    if (project.actualStart && (!project.actualEnd || project.actualEnd === 'TBD' || project.actualEnd === '')) {
      dates.push(new Date());
    }

    if (dates.length === 0) {
      dates.push(new Date());
    }

    const start = new Date(Math.min(...dates.map(d => d.getTime())));
    const end = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Safety check for invalid dates
    const s = isNaN(start.getTime()) ? new Date() : start;
    const e = isNaN(end.getTime()) ? new Date() : end;
    
    const months = [];
    let current = new Date(s.getFullYear(), s.getMonth(), 1);
    const lastMonth = new Date(e.getFullYear(), e.getMonth(), 1);
    
    while (current <= lastMonth) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    
    // Show at least 3 months for better visualization if span is short
    if (months.length < 3) {
      const extra = 3 - months.length;
      for(let i=0; i<extra; i++) {
        const last = new Date(months[months.length-1]);
        last.setMonth(last.getMonth() + 1);
        months.push(last);
      }
    }

    return months;
  };

  const getWeeksCovered = () => {
    if (coveredMonths.length === 0) return [];
    
    const startOfTimeline = coveredMonths[0].getTime();
    const lastMonth = coveredMonths[coveredMonths.length - 1];
    const endOfTimeline = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1).getTime();
    
    const weeks = [];
    let current = new Date(startOfTimeline);
    
    // Find all Sundays or Mondays. Let's use every 7 days from start
    while (current.getTime() < endOfTimeline) {
      weeks.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  };

  const coveredMonths = getMonthsCovered();
  const coveredWeeks = getWeeksCovered();
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const getDayPosition = (dateStr: string, _noCap = true) => {
    if (!dateStr || dateStr === 'TBD') return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    
    const startOfTimeline = coveredMonths[0].getTime();
    const lastMonth = coveredMonths[coveredMonths.length - 1];
    const endOfTimeline = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getTime(); // Adjust to include full last month
    
    const effectiveDate = new Date(dateStr);
    const totalDuration = endOfTimeline - startOfTimeline;
    const relativePos = effectiveDate.getTime() - startOfTimeline;
    
    return (relativePos / totalDuration) * 100;
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-bold uppercase tracking-widest px-1">Repository</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="space-y-4">
        {isReadOnly && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3 animate-in slide-in-from-top-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">View Only Mode: You do not have permissions to edit this project</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-black text-text-primary tracking-tighter leading-none">
              {project.carline} {project.dptPhase} <span className="text-text-tertiary">|</span> {project.name}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {project.status === 'In Progress' && !isReadOnly && (
              <button 
                onClick={() => {
                  const today = new Date().toLocaleDateString('en-CA');
                  updateProject(project.id, { status: 'Completed', actualEnd: today, progress: 100 });
                }}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                Mark Completed
              </button>
            )}
            {!isReadOnly && (
              <button 
                onClick={handleNewLoop}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                New Loop
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
            {project.code}
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border",
            project.status === 'Completed' ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : 
            project.status === 'On Hold' ? "text-gray-400 bg-gray-400/10 border-gray-400/20" :
            project.status === 'To be started' ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
            "text-blue-400 bg-blue-400/10 border-blue-400/20"
          )}>
            {project.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="col-span-2 space-y-8">
          {/* Calendar style Timeline */}
          <div className="bg-surface-1 border border-border-2 rounded-2xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-text-tertiary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Active Timeline
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white opacity-20" />
                  <span className="text-[10px] font-black text-text-tertiary uppercase">Planned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-text-tertiary uppercase">Actual</span>
                </div>
              </div>
            </div>

            <div className="relative pt-6 pb-10">
              {/* Month Header */}
              <div className="flex border-b border-border-2 pb-2 mb-2">
                {coveredMonths.map((m, i) => (
                  <div key={i} className="flex-1 text-center text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                    {monthNames[m.getMonth()]} {m.getFullYear()}
                  </div>
                ))}
              </div>

              {/* Week Header */}
              <div className="flex pb-4 mb-6 relative">
                {coveredWeeks.map((w, i) => (
                  <div 
                    key={i} 
                    className="absolute text-[7px] font-bold text-text-tertiary/50 uppercase whitespace-nowrap"
                    style={{ left: `${getDayPosition(w.toLocaleDateString('en-CA'), true)}%` }}
                  >
                    W{getWeekNumber(w)}
                  </div>
                ))}
              </div>

              {/* Grid Lines */}
              <div className="absolute inset-x-0 top-16 bottom-0 flex pointer-events-none opacity-5">
                {coveredMonths.map((_, i) => (
                  <div key={i} className="flex-1 border-r border-text-primary" />
                ))}
              </div>

              {/* Bars Row */}
              <div className="relative h-24 mt-4 overflow-hidden rounded-xl border border-border-1 bg-surface-2/30">
                {/* Planned Bar */}
                <div 
                  className="absolute top-2 h-4 bg-white/10 border border-border-2 rounded-full"
                  style={{ 
                    left: `${Math.max(0, Math.min(100, getDayPosition(project.plannedStart, true) || 0))}%`,
                    width: `${Math.max(0, Math.min(100, (getDayPosition(project.plannedEnd, true) || 100) - (getDayPosition(project.plannedStart, true) || 0)))}%`
                  }}
                />

                {/* Actual Bar */}
                {project.actualStart && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.max(0, Math.min(100, (getDayPosition(project.actualEnd || new Date().toLocaleDateString('en-CA')) || 100) - (getDayPosition(project.actualStart) || 0)))}%`
                    }}
                    className="absolute top-8 h-8 bg-emerald-500 rounded-lg shadow-xl shadow-emerald-500/20 border border-emerald-400 group flex items-center px-3"
                    style={{ 
                      left: `${Math.max(0, Math.min(100, getDayPosition(project.actualStart) || 0))}%`
                    }}
                  >
                    <span className="text-[10px] font-black text-white uppercase hidden md:block"></span>
                    
                    {/* All Inputs Received Marker */}
                    {allInputsReceivedDate && (
                      <div 
                        className="absolute top-[-10px] bottom-[-10px] w-0.5 bg-yellow-400 z-10 group/marker cursor-pointer hover:w-1 transition-all"
                        style={{ 
                          left: `${((getDayPosition(allInputsReceivedDate, true)! - getDayPosition(project.actualStart, true)!) / (getDayPosition(project.actualEnd || new Date().toLocaleDateString('en-CA'), true)! - getDayPosition(project.actualStart, true)!)) * 100}%`
                        }}
                        onClick={() => navigate(`/projects/${project.id}/chekkai/preprocessingChekkai`)}
                      >
                        <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition-opacity flex items-center gap-1 shadow-lg">
                          <Check className="w-2.5 h-2.5" /> ALL INPUTS RECEIVED: {allInputsReceivedDate}
                        </div>
                        <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                      </div>
                    )}

                    {/* Results Available Marker */}
                    {resultsAvailableDate && (
                      <div 
                        className="absolute top-[-10px] bottom-[-10px] w-0.5 bg-emerald-400 z-10 group/marker-results cursor-pointer hover:w-1 transition-all"
                        style={{ 
                          left: `${((getDayPosition(resultsAvailableDate, true)! - getDayPosition(project.actualStart, true)!) / (getDayPosition(project.actualEnd || new Date().toLocaleDateString('en-CA'), true)! - getDayPosition(project.actualStart, true)!)) * 100}%`
                        }}
                        onClick={() => navigate(`/projects/${project.id}/chekkai/resultsChekkai`)}
                      >
                        <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 bg-emerald-400 text-black text-[8px] font-black px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/marker-results:opacity-100 transition-opacity flex items-center gap-1 shadow-lg">
                          <Check className="w-2.5 h-2.5" /> RESULTS AVAILABLE: {resultsAvailableDate}
                        </div>
                        <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      </div>
                    )}

                    {/* Hold Indicator Overlays */}
                    {project.onHoldPeriods.map((period, idx) => {
                      const startPos = getDayPosition(period.start);
                      const endPos = getDayPosition(period.end || new Date().toLocaleDateString('en-CA'));
                      if (startPos === null || endPos === null) return null;
                      
                      // Calculate relative width within the actual bar
                      const barStart = getDayPosition(project.actualStart || '');
                      const barEnd = getDayPosition(project.actualEnd || new Date().toLocaleDateString('en-CA'));
                      if (barStart === null || barEnd === null) return null;

                      const relativeStart = ((startPos - barStart) / (barEnd - barStart)) * 100;
                      const relativeWidth = ((endPos - startPos) / (barEnd - barStart)) * 100;

                      return (
                        <div 
                          key={idx}
                          className="absolute inset-y-0 bg-gray-600/80 backdrop-blur-sm border-x border-white/20 flex items-center justify-center overflow-hidden group/hold"
                          style={{ 
                            left: `${Math.max(0, relativeStart)}%`,
                            width: `${Math.max(0, relativeWidth)}%`
                          }}
                        >
                          <PauseCircle className="w-3 h-3 text-white/50" />
                          <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] font-black px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/hold:opacity-100 transition-opacity z-50 pointer-events-none">
                            ONHOLD: {period.start} TO {period.end || 'PRESENT'}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {/* Revised End Date Extension Bars */}
                {project.revisedEndDates?.map((revDate, idx) => {
                  const prevDate = idx === 0 ? project.plannedEnd : project.revisedEndDates![idx - 1];
                  const startPos = getDayPosition(prevDate, true);
                  const endPos = getDayPosition(revDate, true);
                  if (startPos === null || endPos === null) return null;

                  return (
                    <div 
                      key={idx}
                      className="absolute top-2 h-4 border border-gray-500/30 rounded-full z-0 overflow-hidden"
                      style={{ 
                        left: `${startPos}%`,
                        width: `${endPos - startPos}%`,
                        background: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(156, 163, 175, 0.15) 5px, rgba(156, 163, 175, 0.15) 10px)'
                      }}
                    >
                      <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 text-[7px] font-black text-text-tertiary uppercase whitespace-nowrap">Revised {idx + 1}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Date Management */}
          <div className="bg-surface-1 border border-border-2 rounded-2xl p-8 shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-tertiary mb-6">Process Management</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Planned Timeline (Locked)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-3 border border-border-2 rounded-xl px-4 py-3 opacity-60">
                      <span className="text-[8px] font-black text-text-tertiary uppercase block">Start</span>
                      <span className="font-mono font-bold text-xs">{formatDate(project.plannedStart)}</span>
                    </div>
                    <div className="bg-surface-3 border border-border-2 rounded-xl px-4 py-3 opacity-60">
                      <span className="text-[8px] font-black text-text-tertiary uppercase block">End</span>
                      <span className="font-mono font-bold text-xs">{formatDate(project.plannedEnd)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Actual Start Date</label>
                    {(isReadOnly || (project.actualStart && project.actualStart !== '')) ? (
                      <span className="flex items-center gap-1 text-[8px] text-amber-500 font-bold uppercase"><Lock className="w-2.5 h-2.5" /> Locked</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[8px] text-text-tertiary font-bold uppercase"><Unlock className="w-2.5 h-2.5" /> Editable</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={actualStartDateInput}
                      onChange={(e) => setActualStartDateInput(e.target.value)}
                      disabled={isReadOnly || (project.actualStart !== undefined && project.actualStart !== '')}
                      className={cn(
                        "flex-1 bg-surface-2 border border-border-2 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all font-mono font-bold text-sm",
                        (isReadOnly || (project.actualStart && project.actualStart !== '')) && "opacity-60 cursor-not-allowed bg-surface-3"
                      )}
                    />
                    {!isReadOnly && (!project.actualStart || project.actualStart === '') && actualStartDateInput && (
                      <button 
                        onClick={() => handleUpdateDate('actualStart', actualStartDateInput)}
                        className="px-4 bg-primary text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-primary/20 hover:brightness-110 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Lock
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Revised End Date</label>
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={newRevisedDate}
                      min={project.actualStart || project.plannedStart || undefined}
                      onChange={(e) => {
                        const val = e.target.value;
                        const start = project.actualStart || project.plannedStart;
                        if (start && val && val < start) {
                          alert(`Revised End Date cannot be before Start Date (${formatDate(start)}).`);
                          return;
                        }
                        setNewRevisedDate(val);
                      }}
                      disabled={isReadOnly}
                      className={cn(
                        "flex-1 bg-surface-2 border border-border-2 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all font-mono font-bold text-sm",
                        isReadOnly && "opacity-60 cursor-not-allowed bg-surface-3"
                      )}
                    />
                    {!isReadOnly && (
                      <button 
                        onClick={handleAddRevisedDate}
                        className="px-4 bg-primary text-white rounded-xl text-[10px] font-black uppercase"
                      >
                        Add
                      </button>
                    )}
                  </div>
                  {project.revisedEndDates && project.revisedEndDates.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                       {project.revisedEndDates.map((d, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-bold font-mono">
                            REV {i+1}: {d}
                          </span>
                       ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Actual End Date</label>
                    {(isReadOnly || (project.actualEnd && project.actualEnd !== 'TBD')) ? (
                      <span className="flex items-center gap-1 text-[8px] text-amber-500 font-bold uppercase"><Lock className="w-2.5 h-2.5" /> Locked</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[8px] text-text-tertiary font-bold uppercase"><Unlock className="w-2.5 h-2.5" /> Editable</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={actualEndDateInput}
                      min={project.actualStart || undefined}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (project.actualStart && val && val < project.actualStart) {
                          alert('Actual End Date cannot be before Actual Start Date.');
                          return;
                        }
                        setActualEndDateInput(val);
                      }}
                      disabled={isReadOnly || (project.actualEnd !== undefined && project.actualEnd !== 'TBD' && project.actualEnd !== '')}
                      className={cn(
                        "flex-1 bg-surface-2 border border-border-2 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all font-mono font-bold text-sm",
                        (isReadOnly || (project.actualEnd && project.actualEnd !== 'TBD' && project.actualEnd !== '')) && "opacity-60 cursor-not-allowed bg-surface-3"
                      )}
                    />
                    {!isReadOnly && (!project.actualEnd || project.actualEnd === 'TBD' || project.actualEnd === '') && actualEndDateInput && (
                      <button 
                        onClick={() => handleUpdateDate('actualEnd', actualEndDateInput)}
                        className="px-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20 hover:brightness-110 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Set
                      </button>
                    )}
                  </div>
                </div>

                {/* On Hold Control */}
                {!isReadOnly && (
                  <div className="pt-4 space-y-4 border-t border-border-1">
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Project On Hold</label>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-widest">Start Date</span>
                          <input 
                            type="date" 
                            disabled={project.status === 'On Hold'}
                            value={tempHoldStart}
                            onChange={(e) => setTempHoldStart(e.target.value)}
                            className="w-full bg-surface-2 border border-border-2 text-text-primary text-xs rounded-xl px-3 py-2 outline-none focus:border-primary disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-widest">End Date (Optional)</span>
                          <input 
                            type="date" 
                            disabled={project.status === 'On Hold'}
                            value={tempHoldEnd}
                            min={tempHoldStart || undefined}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (tempHoldStart && val && val < tempHoldStart) {
                                alert('Hold Period End Date cannot be before Hold Period Start Date.');
                                return;
                              }
                              setTempHoldEnd(val);
                            }}
                            className="w-full bg-surface-2 border border-border-2 text-text-primary text-xs rounded-xl px-3 py-2 outline-none focus:border-primary disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-widest">Reason</span>
                          <input 
                            type="text" 
                            disabled={project.status === 'On Hold'}
                            placeholder="Reason for suspension"
                            value={tempHoldReason}
                            onChange={(e) => setTempHoldReason(e.target.value)}
                            className="w-full bg-surface-2 border border-border-2 text-text-primary text-xs rounded-xl px-3 py-2 outline-none focus:border-primary disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  
                    <div className="flex gap-3">
                      {project.status === 'On Hold' ? (
                        <button 
                          onClick={handleResume}
                          className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Resume Project
                        </button>
                      ) : (
                        <button 
                          onClick={addHoldPeriod}
                          className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                        >
                          <PauseCircle className="w-4 h-4" />
                          Put On Hold
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {project.onHoldPeriods.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-border-1">
                    <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">On Hold History</span>
                    <div className="space-y-2">
                      {project.onHoldPeriods.map((p, i) => (
                        <div key={i} className="bg-surface-2 p-3 rounded-xl border border-border-1 flex flex-col gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-text-primary">
                              <span>{p.start}</span>
                              <ArrowRight className="w-3 h-3 text-text-tertiary" />
                              <span className={cn(!p.end && "text-amber-500")}>{p.end || 'Ongoing'}</span>
                            </div>
                            <PauseCircle className={cn("w-3.5 h-3.5", !p.end ? "text-amber-500 animate-pulse" : "text-text-tertiary")} />
                          </div>
                          {p.reason && (
                            <p className="text-[10px] text-text-secondary italic font-medium leading-relaxed">
                              "{p.reason}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Removed redundant Mark as Completed button from here */}

          {/* Notes Section */}
          <div className="bg-surface-1 border border-border-2 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-text-tertiary">Project Notes & Internal Comments</h3>
              {!isReadOnly && (
                <button 
                  onClick={handleAddNote}
                  className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[9px] font-black uppercase hover:bg-primary/20 transition-all"
                >
                  Save Note
                </button>
              )}
            </div>
            <div className="space-y-6">
              {!isReadOnly && (
                <div className="space-y-3">
                  <textarea 
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Type a new note here..."
                    className="w-full bg-surface-2 border border-border-2 rounded-2xl p-6 text-sm text-text-primary focus:border-primary outline-none min-h-[100px] resize-none leading-relaxed"
                  />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 border border-border-2 rounded-xl text-[10px] font-black uppercase text-text-tertiary hover:bg-surface-2 cursor-pointer transition-all">
                      <Paperclip className="w-3 h-3" />
                      Attach Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {noteImage && (
                      <div className="relative group">
                        <img src={noteImage} alt="Preview" className="w-12 h-12 rounded-lg border border-border-2 object-cover" />
                        <button 
                          onClick={() => setNoteImage(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="w-2.5 h-2.5 rotate-45" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-4 pt-4 border-t border-border-1">
                {(project.projectNotes || []).length > 0 ? (
                  project.projectNotes.slice().reverse().map((note: any, idx: number) => (
                    <div key={idx} className="bg-surface-2 p-4 rounded-xl border border-border-2 relative group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{note.author}</span>
                        <span className="text-[9px] font-bold text-text-tertiary font-mono">{note.date}</span>
                      </div>
                      <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap mb-3">{note.text}</p>
                      {note.image && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-border-2 bg-background">
                          <img 
                            src={note.image} 
                            alt="Attached note image" 
                            className="max-w-full h-auto max-h-64 object-contain mx-auto" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">No notes recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Chekkai Navigation */}
          <div className="bg-surface-1 border border-border-2 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-tertiary mb-6">Required Checklists</h3>
            <div className="space-y-3">
              {[
                { key: 'preprocessingChekkai', label: 'Preprocessing Form' },
                { key: 'resultsChekkai', label: 'Results Verification Form' }
              ].map((item) => (
                <button 
                  key={item.key}
                  onClick={() => navigate(`/projects/${project.id}/chekkai/${item.key}`)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-border-2 text-text-primary hover:border-primary/50 transition-all group"
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    <span className="text-[8px] text-text-tertiary uppercase font-bold tracking-tighter">Chekkai Phase</span>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center border transition-all",
                    project[item.key as keyof typeof project]
                      ? "bg-emerald-500 border-emerald-400 text-white"
                      : (project as any)[`${item.key}NotRequired`]
                        ? "bg-red-500/20 border-red-500/40 text-red-500"
                        : "bg-surface-3 border-border-2 text-text-tertiary group-hover:text-primary group-hover:border-primary/30"
                  )}>
                    {project[item.key as keyof typeof project] ? <Check className="w-3.5 h-3.5 stroke-[4px]" /> : 
                     (project as any)[`${item.key}NotRequired`] ? <ShieldCheck className="w-3.5 h-3.5" /> :
                     <ArrowRight className="w-3.5 h-3.5" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Zone Meeting Results - MOVED TO SIDEBAR */}
          <div className="bg-surface-1 border border-border-2 rounded-2xl p-6 shadow-lg animate-in slide-in-from-right-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Zone Meeting Details</h3>
              {project.presentedInZoneMeeting && (
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[8px] font-black uppercase leading-none">Recorded</span>
              )}
            </div>
            
            <div className="space-y-6">
              {!isRecordingPresentation ? (
                <div className="text-center py-6 border-2 border-dashed border-border-2 rounded-xl">
                  <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-4">
                    {project.presentedInZoneMeeting ? 'Add more meetings' : 'Not yet presented'}
                  </p>
                  {!isReadOnly && (
                    <button 
                      onClick={() => setIsRecordingPresentation(true)}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg"
                    >
                      Add Details
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">Date</label>
                      <input 
                        type="date"
                        value={zoneMeetingDate}
                        onChange={(e) => setZoneMeetingDate(e.target.value)}
                        className="w-full bg-surface-2 border border-border-2 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">Meeting Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. Zone A Monthly"
                        value={zoneMeetingName}
                        onChange={(e) => setZoneMeetingName(e.target.value)}
                        className="w-full bg-surface-2 border border-border-2 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  {!isReadOnly && (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleUpdateZoneMeeting}
                        disabled={!zoneMeetingDate || !zoneMeetingName}
                        className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
                      >
                        Save Details
                      </button>
                      <button 
                        onClick={() => {
                          setIsRecordingPresentation(false);
                          setZoneMeetingDate('');
                          setZoneMeetingName('');
                        }}
                        className="py-2 px-3 bg-surface-3 text-text-secondary rounded-lg text-[9px] font-black uppercase hover:bg-surface-4"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* History of Zone Meetings */}
              {(project.zoneMeetings || []).length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border-1">
                  {project.zoneMeetings?.map((meeting: any, idx: number) => (
                    <div key={idx} className="bg-surface-2 p-3 rounded-lg border border-border-1 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-text-primary truncate">{meeting.name}</p>
                        <p className="text-[8px] text-text-tertiary font-mono font-bold mt-0.5 uppercase">{formatDate(meeting.date)}</p>
                      </div>
                      <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Project Roles */}
          <div className="bg-surface-1 border border-border-2 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-tertiary mb-6">Responsibility Matrix</h3>
            <div className="space-y-6">
              <div className="group">
                <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest block mb-2">DI44 Loadcase Owner</span>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-[10px]">
                    {project?.owner ? project.owner.split(' ').map((n: string) => n[0]).join('') : '?'}
                  </div>
                  <span className="text-xs font-bold text-text-primary">{project?.owner}</span>
                </div>
              </div>
              <div className="group">
                <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest block mb-2">Responsible Person</span>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-surface-2 border border-border-2 flex items-center justify-center text-text-secondary">
                     <User className="w-4 h-4" />
                   </div>
                   <span className="text-xs font-bold text-text-primary">{project.responsiblePerson}</span>
                </div>
              </div>
            </div>
          </div>

          {project && canDeleteProject(project) && (
            <button 
              onClick={handleDelete}
              className="w-full py-4 border border-red-500/20 bg-red-500/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all shadow-lg shadow-red-500/5"
            >
              Delete Project
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
