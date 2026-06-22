import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, ClipboardCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

import { useProjects } from '../context/ProjectContext';
import { cn } from '../lib/utils';

export default function ChekkaiForm() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { projects, updateProject } = useProjects();
  
  const project = projects.find(p => p.id === id);
  const isNotRequired = project ? (project as any)[`${type}NotRequired`] : false;
  const isSubmitted = project ? !!project[type as keyof typeof project] : false;

  const formTitle = type?.replace('Chekkai', '').toUpperCase() + ' CHEKKAI FORM';

  const defaultItems = type === 'resultsChekkai' ? [
    { id: 1, label: 'Model feasibilty checked', checked: false },
    { id: 2, label: 'Internal review conducted', checked: false },
    { id: 3, label: 'Postprocessing files saved', checked: false },
    { id: 4, label: 'Results PPT saved in EC', checked: false },
  ] : type === 'preprocessingChekkai' ? [
    { id: 1, label: 'Model in respective tools', checked: false },
    { id: 2, label: 'Vehicle modeling inputs (Vehicle mass, CAD, etc.)', checked: false },
    { id: 3, label: 'Suspension modeling Inputs (Springs, Dampers, bumpstoppers, Niveau, etc.)', checked: false },
    { id: 4, label: 'Tire modeling (Ftire file, Rstat, etc.)', checked: false },
    { id: 5, label: 'Engine Modeling (Torque files, Mount bushes, Gear configuration etc.)', checked: false },
  ] : [
    { id: 1, label: 'Data Integrity Verified', checked: false },
    { id: 2, label: 'Standard Parameters Applied', checked: false },
    { id: 3, label: 'Boundary Conditions Validated', checked: false },
    { id: 4, label: 'Documentation Completed', checked: false },
    { id: 5, label: 'Internal Review Conducted', checked: false },
    { id: 6, label: 'Safety Protocols Checked', checked: false },
    { id: 7, label: 'Resource Allocation Confirmed', checked: false },
    { id: 8, label: 'Risk Assessment Updated', checked: false },
    { id: 9, label: 'Client Requirements Matched', checked: false },
    { id: 10, label: 'Final Output Verified', checked: false },
  ];

  const [formData, setFormData] = useState({
    checkedBy: project ? (project as any)[`${type}Data`]?.checkedBy || '' : '',
    verifiedDate: project ? (project as any)[`${type}Data`]?.verifiedDate || '' : '',
    comments: project ? (project as any)[`${type}Data`]?.comments || '' : '',
    items: project && (project as any)[`${type}Data`]?.items ? (project as any)[`${type}Data`].items : defaultItems
  });

  const handleToggle = (itemId: number) => {
    if (isSubmitted || isNotRequired) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item: any) => item.id === itemId ? { ...item, checked: !item.checked } : item)
    }));
  };

  const allChecked = formData.items.every((item: any) => item.checked);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNotRequired || isSubmitted) return;
    
    if (type && id) {
      const isFinal = allChecked;
      await updateProject(id, { 
        [type]: isFinal,
        [`${type}Data`]: {
          ...formData,
          submittedAt: isFinal ? new Date().toISOString() : null,
          lastUpdated: new Date().toISOString()
        }
      });
    }
    navigate(`/projects/${id}`);
  };

  const handleNotRequired = async () => {
    if (id && type) {
      await updateProject(id, { [`${type}NotRequired`]: true });
      navigate(`/projects/${id}`);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(`/projects/${id}`)}
          className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-bold uppercase tracking-widest px-1">Project Details</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-text-primary tracking-tighter uppercase">{formTitle}</h1>
              <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest">Quality Assurance Checklist | PRJ-{id}</p>
            </div>
          </div>
          
          {!isNotRequired && (
            <button 
              type="button"
              onClick={handleNotRequired}
              className="px-6 py-3 bg-surface-2 border border-border-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:border-red-500/50 hover:text-red-500 transition-all"
            >
              Mark as Not Required
            </button>
          )}
        </div>

        {isNotRequired && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             <span className="text-xs font-black text-red-500 uppercase tracking-widest">This form is marked as Not Required for this project</span>
          </div>
        )}

        {isSubmitted && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500" />
             <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">This form has been submitted and is now locked for editing</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className={cn(
        "bg-surface-1 border border-border-2 rounded-2xl p-8 shadow-xl space-y-8 transition-opacity",
        (isNotRequired || isSubmitted) && "opacity-70 contrast-[0.9]"
      )}>
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary border-b border-border-1 pb-4">Checklist Items</h3>
          <div className="space-y-3">
            {formData.items.map((item: any) => (
              <label 
                key={item.id} 
                className={cn(
                  "flex items-center justify-between p-4 bg-surface-2 border border-border-2 rounded-xl transition-all group",
                  isSubmitted || isNotRequired ? "cursor-default" : "cursor-pointer hover:border-primary/30"
                )}
              >
                <span className="text-sm font-bold text-text-primary">{item.label}</span>
                <input 
                  type="checkbox"
                  checked={item.checked}
                  disabled={isSubmitted || isNotRequired}
                  onChange={() => handleToggle(item.id)}
                  className="w-5 h-5 rounded border-2 border-border-2 bg-surface-3 checked:bg-primary checked:border-primary transition-all appearance-none cursor-pointer disabled:cursor-not-allowed"
                />
              </label>
            ))}
          </div>
        </div>

        {(allChecked || isSubmitted || isNotRequired) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4"
          >
            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Verified By</label>
              <input 
                type="text" 
                required={allChecked && !isSubmitted && !isNotRequired}
                disabled={isSubmitted || isNotRequired}
                className="w-full bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary outline-none disabled:opacity-60"
                placeholder="Full Name"
                value={formData.checkedBy}
                onChange={e => setFormData({...formData, checkedBy: e.target.value})}
              />
            </div>
            
            {(type === 'resultsChekkai' || type === 'preprocessingChekkai') && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Verified Date</label>
                <input 
                  type="date" 
                  required={allChecked && !isSubmitted && !isNotRequired}
                  disabled={isSubmitted || isNotRequired}
                  className="w-full bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary focus:border-primary outline-none disabled:opacity-60"
                  value={formData.verifiedDate}
                  onChange={e => setFormData({...formData, verifiedDate: e.target.value})}
                />
              </div>
            )}

            <div className={cn("space-y-3", (type === 'resultsChekkai' || type === 'preprocessingChekkai') ? "md:col-span-2" : "")}>
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Observations / Comments</label>
              <textarea 
                disabled={isSubmitted || isNotRequired}
                className="w-full bg-surface-2 border border-border-2 rounded-xl px-4 py-4 text-sm text-text-primary h-32 focus:border-primary outline-none resize-none disabled:opacity-60"
                placeholder="Enter any relevant findings..."
                value={formData.comments}
                onChange={e => setFormData({...formData, comments: e.target.value})}
              />
            </div>
          </motion.div>
        )}

        {!isSubmitted && !isNotRequired && (
          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              className={cn(
                "flex items-center gap-3 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                allChecked 
                  ? "bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20" 
                  : "bg-surface-3 text-text-tertiary border border-border-2 hover:border-primary/50"
              )}
            >
              {allChecked ? 'Submit Checklist' : 'Save Progress'}
              {allChecked ? <ArrowRight className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
