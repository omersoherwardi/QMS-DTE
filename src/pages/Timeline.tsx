import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  RotateCcw,
  Clock,
  Info 
} from 'lucide-react';
import { cn, getWeekNumber } from '../lib/utils';
import { motion } from 'motion/react';

import { useProjects, formatDate } from '../context/ProjectContext';

export default function Timeline() {
  const { projects, searchQuery } = useProjects();
  const navigate = useNavigate();
  
  // Default from date: 2026-01-01, to date: 2026-12-31
  const defaultFrom = useMemo(() => '2026-01-01', []);
  const defaultTo = useMemo(() => '2026-12-31', []);

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  const resetDates = () => {
    setFromDate(defaultFrom);
    setToDate(defaultTo);
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
      
      return matchSearch;
    });
  }, [projects, searchQuery]);

  const timelineRange = useMemo(() => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const totalMs = end.getTime() - start.getTime();
    
    // Generate months for header
    const months: string[] = [];
    const dateCursor = new Date(start);
    dateCursor.setDate(1); // Start of month

    while (dateCursor <= end) {
      months.push(dateCursor.toLocaleString('default', { month: 'short' }).toUpperCase());
      dateCursor.setMonth(dateCursor.getMonth() + 1);
    }

    // Generate weeks
    const weeks: { date: string, pct: number, weekNum: number }[] = [];
    let weekCursor = new Date(start);
    while (weekCursor <= end) {
      weeks.push({
        date: weekCursor.toISOString().split('T')[0],
        pct: ((weekCursor.getTime() - start.getTime()) / totalMs) * 100,
        weekNum: getWeekNumber(weekCursor)
      });
      weekCursor.setDate(weekCursor.getDate() + 7);
    }

    return { start, end, totalMs, months, weeks };
  }, [fromDate, toDate]);

  const getRelativePct = (dateStr: string) => {
    const d = new Date(dateStr);
    const start = timelineRange.start;
    const end = timelineRange.end;
    
    if (d < start) return 0;
    if (d > end) return 100;
    
    const diffMs = d.getTime() - start.getTime();
    return (diffMs / timelineRange.totalMs) * 100;
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const timelineProjects = useMemo(() => {
    const today = new Date();
    const todayPct = getRelativePct(today.toISOString().split('T')[0]);

    const all = filteredProjects.map(p => ({
      id: p.id,
      code: p.code,
      name: `${p.carline} ${p.dptPhase} | ${p.name}`,
      plannedStartPct: getRelativePct(p.plannedStart),
      plannedEndPct: getRelativePct(p.plannedEnd),
      actualStartPct: (p.actualStart && p.actualStart !== 'TBD' && p.actualStart !== '') ? getRelativePct(p.actualStart) : null,
      actualEndPct: (p.actualEnd && p.actualEnd !== 'TBD' && p.actualEnd !== '') ? getRelativePct(p.actualEnd) : null,
      status: p.status,
      owner: p.owner,
      onHoldPeriods: (p.onHoldPeriods || []).map(period => ({
        start: period.start,
        end: period.end,
        startPct: getRelativePct(period.start),
        endPct: getRelativePct(period.end || new Date().toISOString().split('T')[0])
      })),
      revisedEndDates: (p.revisedEndDates || []).map(d => ({
        date: d,
        pct: getRelativePct(d)
      })),
      plannedEnd: p.plannedEnd,
      todayPct
    }));

    const startIndex = (currentPage - 1) * itemsPerPage;
    return all.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, timelineRange, currentPage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-black text-text-primary tracking-tight">
            Timeline
          </h1>
        </div>
        
        <div className="flex items-center gap-4 bg-surface-1/50 p-2 rounded-xl border border-border-1 backdrop-blur-md">
          <div className="flex flex-col gap-1 px-2">
            <span className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">From</span>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-text-primary focus:outline-none"
            />
          </div>
          <div className="w-px h-8 bg-border-1" />
          <div className="flex flex-col gap-1 px-2">
            <span className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">To</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-text-primary focus:outline-none"
            />
          </div>
          <button 
            onClick={resetDates}
            className="flex items-center gap-2 px-3 py-2 bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary rounded-lg transition-all text-xs font-bold uppercase tracking-widest border border-border-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="bg-surface-1 border border-border-2 rounded-2xl p-8 shadow-2xl">
        <div className="w-full">
          {/* Calendar Header */}
          <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(0,1fr))] border-b border-border-2 pb-1" style={{ gridTemplateColumns: `200px repeat(${timelineRange.months.length}, 1fr)` }}>
            <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-4 font-mono text-center">Project / Loadcase</div>
            {timelineRange.months.map((month, idx) => (
              <div key={`${month}-${idx}`} className="text-center text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                {month}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[200px_1fr] pb-4 mb-4" style={{ gridTemplateColumns: `200px 1fr` }}>
            <div />
            <div className="relative h-4">
              {timelineRange.weeks.map((w, idx) => (
                <div 
                  key={idx} 
                  className="absolute text-[7px] font-bold text-text-tertiary/40 uppercase whitespace-nowrap"
                  style={{ left: `${w.pct}%` }}
                >
                  W{w.weekNum}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="space-y-6">
            {timelineProjects.map((tp) => (
              <div 
                key={tp.id} 
                onClick={() => navigate(`/projects/${tp.id}`)}
                className="grid grid-cols-[200px_repeat(auto-fit,minmax(0,1fr))] items-center group cursor-pointer hover:bg-surface-2/50 rounded-xl transition-all"
                style={{ gridTemplateColumns: `200px repeat(${timelineRange.months.length}, 1fr)` }}
              >
                <div className="px-4 min-w-0">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-primary font-bold">{tp.code}</span>
                    <span className="text-[10px] font-bold text-text-primary truncate uppercase tracking-tight">{tp.name}</span>
                  </div>
                </div>
                <div className="col-span-full h-10 relative" style={{ gridColumn: `2 / span ${timelineRange.months.length}` }}>
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex justify-between pointer-events-none opacity-5">
                    {Array.from({ length: timelineRange.months.length + 1 }).map((_, i) => (
                      <div key={i} className="w-px h-full bg-text-primary" />
                    ))}
                  </div>

                  {/* Planned Bar */}
                  <div 
                    className="absolute top-1 h-3 bg-white border border-border-2 rounded-sm opacity-20"
                    style={{ 
                      left: `${tp.plannedStartPct}%`,
                      width: `${Math.max(2, tp.plannedEndPct - tp.plannedStartPct)}%`
                    }}
                  />

                  {/* Revised End Date Extension Bars */}
                  {tp.revisedEndDates?.map((rev, idx) => {
                    const prevDate = idx === 0 ? tp.plannedEnd : tp.revisedEndDates[idx - 1].date;
                    const startPct = getRelativePct(prevDate);
                    const endPct = rev.pct;
                    if (startPct === null || endPct === null) return null;

                    return (
                      <div 
                        key={idx}
                        className="absolute top-1 h-3 border border-gray-500/30 rounded-sm z-0 overflow-hidden"
                        style={{ 
                          left: `${startPct}%`,
                          width: `${endPct - startPct}%`,
                          background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(156, 163, 175, 0.2) 2px, rgba(156, 163, 175, 0.2) 4px)'
                        }}
                      />
                    );
                  })}

                  {/* Actual Bar */}
                  {tp.actualStartPct !== null && (
                    <div 
                      className={cn(
                        "absolute top-5 h-4 rounded shadow-sm border group-hover:brightness-110 transition-all overflow-hidden",
                        tp.status === 'Completed' ? "bg-emerald-500 border-emerald-400 font-bold" : 
                        tp.status === 'On Hold' ? "bg-gray-400 border-gray-300" :
                        tp.status === 'To be started' ? "bg-amber-400 border-amber-300" :
                        "bg-blue-500 border-blue-400"
                      )}
                      style={{ 
                        left: `${tp.actualStartPct}%`,
                        width: `${Math.max(4, (tp.actualEndPct !== null ? tp.actualEndPct : Math.min(100, tp.todayPct)) - tp.actualStartPct)}%`
                      }}
                    >
                      {/* On Hold Periods visualization */}
                      {tp.onHoldPeriods.map((period, idx) => {
                        const barStart = tp.actualStartPct || 0;
                        const barEnd = tp.actualEndPct !== null ? tp.actualEndPct : Math.min(100, tp.todayPct);

                        const relativeLeft = ((period.startPct - barStart) / (barEnd - barStart)) * 100;
                        const relativeWidth = ((period.endPct - period.startPct) / (barEnd - barStart)) * 100;

                        if (relativeWidth <= 0 || relativeLeft >= 100) return null;

                        return (
                          <div 
                            key={idx}
                            className="absolute inset-y-0 bg-gray-600/90 group/hold"
                            style={{ left: `${Math.max(0, relativeLeft)}%`, width: `${Math.min(100 - relativeLeft, relativeWidth)}%` }}
                          >
                             <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[7px] font-black px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/hold:opacity-100 transition-opacity z-50 pointer-events-none">
                              ONHOLD: {formatDate(period.start)} TO {period.end ? formatDate(period.end) : 'PRESENT'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {timelineProjects.length === 0 && (
              <div className="py-20 text-center text-text-tertiary font-bold uppercase tracking-widest text-xs">
                No process flows found in this range
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-8 gap-y-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-white border border-border-2 rounded opacity-20" />
          <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Planned Range</span>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 border border-gray-500/30 rounded" 
            style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(156, 163, 175, 0.2) 2px, rgba(156, 163, 175, 0.2) 4px)' }} 
          />
          <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Revised Planned Range</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-blue-500 rounded shadow-sm" />
          <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">In Progress</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-gray-400 rounded shadow-sm" />
          <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">On Hold</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-emerald-500 rounded shadow-sm" />
          <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Completed</span>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 border border-border-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary disabled:opacity-30 hover:bg-surface-2 transition-all transition-colors"
          >
            Previous
          </button>
          <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-4 py-2 border border-border-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary disabled:opacity-30 hover:bg-surface-2 transition-all transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
