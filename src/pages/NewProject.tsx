import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Save, 
  X, 
  Calendar, 
  User, 
  Tag, 
  BarChart2, 
  AlertTriangle,
  Briefcase,
  Lock
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function NewProject() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addProject, canCreateProject, currentUser } = useProjects();
  
  const prefill = location.state?.prefill;
  
  useEffect(() => {
    if (!canCreateProject()) {
      navigate('/projects');
    }

    if (prefill) {
      const owners = ['Marcus Sterling', 'Sophia Vancamp', 'Elena Rostova', 'Kenji Takahashi'];
      const carlines = ['Nexus-X Crossover', 'E-SUV Pulse'];
      const phases = ['DPT-Phase A: Concept & Setup', 'DPT-Phase B: Design & Simulation', 'DPT-Phase C: Physical Prototype', 'DPT-Phase D: Safety Validation'];
      
      if (prefill.owner && !owners.includes(prefill.owner)) {
        setIsOtherOwner(true);
        setFormData(prev => ({ ...prev, otherOwner: prefill.owner }));
      }
      
      if (prefill.carline && !carlines.includes(prefill.carline)) {
        setIsOtherCarline(true);
        setFormData(prev => ({ ...prev, otherCarline: prefill.carline }));
      }
      
      if (prefill.dptPhase && !phases.includes(prefill.dptPhase)) {
        setIsOtherDptPhase(true);
        setFormData(prev => ({ ...prev, otherDptPhase: prefill.dptPhase }));
      }
    }
  }, [canCreateProject, navigate, prefill]);

  const [formData, setFormData] = useState({
    loadcase: prefill?.name || 'Crash Test Frontal',
    owner: prefill?.owner || 'Marcus Sterling',
    otherOwner: '',
    responsiblePerson: currentUser?.name || '',
    plannedStart: '',
    plannedEnd: '',
    actualStart: '',
    actualEnd: '',
    priority: prefill?.priority || 'Low',
    type: prefill?.type || 'Planned',
    carline: prefill?.carline || 'Nexus-X Crossover',
    otherCarline: '',
    dptPhase: prefill?.dptPhase || 'DPT-Phase A: Concept & Setup',
    otherDptPhase: ''
  });

  const [isOtherOwner, setIsOtherOwner] = useState(false);
  const [isOtherCarline, setIsOtherCarline] = useState(false);
  const [isOtherDptPhase, setIsOtherDptPhase] = useState(false);

  if (!canCreateProject()) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <Lock className="w-12 h-12 text-text-tertiary mb-4" />
        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest">Access Denied</h2>
        <p className="text-text-secondary text-sm">You do not have permission to create projects.</p>
        <button 
          onClick={() => navigate('/projects')}
          className="mt-6 px-6 py-2 bg-surface-2 border border-border-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent entering end date before start date
    if (formData.plannedStart && formData.plannedEnd && formData.plannedEnd < formData.plannedStart) {
      alert('Planned End Date cannot be before Planned Start Date.');
      return;
    }

    const finalData = {
      ...formData,
      owner: isOtherOwner ? formData.otherOwner : formData.owner,
      carline: isOtherCarline ? formData.otherCarline : formData.carline,
      dptPhase: isOtherDptPhase ? formData.otherDptPhase : formData.dptPhase
    };

    addProject(finalData);
    navigate('/projects');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-bold uppercase tracking-widest">Back</span>
        </button>
      </div>

      <div className="bg-surface-1 border border-border-2 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-border-1 bg-surface-2/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">
                {prefill ? `New Loop: ${formData.loadcase}` : 'New Project'}
              </h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            {/* Loadcase */}
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                Loadcase
              </label>
              <select 
                required
                className="w-full bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none"
                value={formData.loadcase}
                onChange={e => setFormData({...formData, loadcase: e.target.value})}
              >
                <option>Crash Test Frontal</option>
                <option>Side Impact Simulation</option>
                <option>Pedestrian Safety</option>
                <option>Roof Crush Resistance</option>
                <option>Seatbelt Anchorage</option>
                <option>Brake Efficiency</option>
                <option>Aerodynamic Drag Loop</option>
                <option>Thermal Management Loop</option>
                <option>Water Ingress Testing</option>
                <option>Engine Durability</option>
                <option>EMC Compliance Test</option>
                <option>Chassis Stress Analysis</option>
                <option>Acoustic Noise Leakage</option>
                <option>Airbag Deployment Loop</option>
                <option>Battery Thermal Runaway</option>
              </select>
            </div>

            {/* Carline */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                Carline
              </label>
              <div className="flex gap-2">
                <select 
                  required
                  className={cn(
                    "bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none",
                    isOtherCarline ? "w-1/3" : "w-full"
                  )}
                  value={isOtherCarline ? "Other" : formData.carline}
                  onChange={e => {
                    if (e.target.value === "Other") {
                      setIsOtherCarline(true);
                    } else {
                      setIsOtherCarline(false);
                      setFormData({...formData, carline: e.target.value});
                    }
                  }}
                >
                  <option value="Nexus-X Crossover">Nexus-X Crossover</option>
                  <option value="E-SUV Pulse">E-SUV Pulse</option>
                  <option value="Model S Aero">Model S Aero</option>
                  <option value="Model X Heavy-Duty">Model X Heavy-Duty</option>
                  <option value="GT-V8 Roadster">GT-V8 Roadster</option>
                  <option value="Cruiser-4WD">Cruiser-4WD</option>
                  <option value="Prime Sedan E">Prime Sedan E</option>
                  <option value="CyberTruck Heavy">CyberTruck Heavy</option>
                  <option value="AeroCoupe-GT">AeroCoupe-GT</option>
                  <option value="V-Class eVito">V-Class eVito</option>
                  <option value="Concept-V eV">Concept-V eV</option>
                  <option value="SprintCargo Van">SprintCargo Van</option>
                  <option value="Other">Other</option>
                </select>
                {isOtherCarline && (
                  <input 
                    type="text" 
                    required
                    placeholder="Specify carline"
                    className="flex-1 bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-text-tertiary/50"
                    value={formData.otherCarline}
                    onChange={e => setFormData({...formData, otherCarline: e.target.value})}
                  />
                )}
              </div>
            </div>

            {/* Project Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                Project Type
              </label>
              <select 
                required
                className="w-full bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="Planned">Planned</option>
                <option value="Adhoc">Adhoc</option>
              </select>
            </div>

            {/* DPT Phase */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                DPT Phase
              </label>
              <div className="flex gap-2">
                <select 
                  required
                  className={cn(
                    "bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none",
                    isOtherDptPhase ? "w-1/3" : "w-full"
                  )}
                  value={isOtherDptPhase ? "Other" : formData.dptPhase}
                  onChange={e => {
                    if (e.target.value === "Other") {
                      setIsOtherDptPhase(true);
                    } else {
                      setIsOtherDptPhase(false);
                      setFormData({...formData, dptPhase: e.target.value});
                    }
                  }}
                >
                  <option value="DPT-Phase A: Concept & Setup">DPT-Phase A: Concept & Setup</option>
                  <option value="DPT-Phase B: Design & Simulation">DPT-Phase B: Design & Simulation</option>
                  <option value="DPT-Phase C: Physical Prototype">DPT-Phase C: Physical Prototype</option>
                  <option value="DPT-Phase D: Safety Validation">DPT-Phase D: Safety Validation</option>
                  <option value="DPT-Phase E: Vehicle Integration">DPT-Phase E: Vehicle Integration</option>
                  <option value="DPT-Phase F: Compliance & Audit">DPT-Phase F: Compliance & Audit</option>
                  <option value="DPT-Phase G: Final Sign-off">DPT-Phase G: Final Sign-off</option>
                  <option value="Other">Other</option>
                </select>
                {isOtherDptPhase && (
                  <input 
                    type="text" 
                    required
                    placeholder="Specify DPT Phase"
                    className="flex-1 bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-text-tertiary/50"
                    value={formData.otherDptPhase}
                    onChange={e => setFormData({...formData, otherDptPhase: e.target.value})}
                  />
                )}
              </div>
            </div>

            {/* DI44 */}
            <div className="space-y-2 text-primary">
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3" /> DI44
              </label>
              <div className="flex gap-2">
                <select 
                  required
                  className={cn(
                    "bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none",
                    isOtherOwner ? "w-1/3" : "w-full"
                  )}
                  value={isOtherOwner ? "Other" : formData.owner}
                  onChange={e => {
                    if (e.target.value === "Other") {
                      setIsOtherOwner(true);
                    } else {
                      setIsOtherOwner(false);
                      setFormData({...formData, owner: e.target.value});
                    }
                  }}
                >
                  <option value="Marcus Sterling">Marcus Sterling</option>
                  <option value="Sophia Vancamp">Sophia Vancamp</option>
                  <option value="Elena Rostova">Elena Rostova</option>
                  <option value="Kenji Takahashi">Kenji Takahashi</option>
                  <option value="Other">Other</option>
                </select>
                {isOtherOwner && (
                  <input 
                    type="text" 
                    required
                    placeholder="Specify DI44"
                    className="flex-1 bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-text-tertiary/50"
                    value={formData.otherOwner}
                    onChange={e => setFormData({...formData, otherOwner: e.target.value})}
                  />
                )}
              </div>
            </div>

            {/* Responsible Person */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                Responsible person
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Alex Miller"
                className="w-full bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-text-tertiary/50"
                value={formData.responsiblePerson}
                onChange={e => setFormData({...formData, responsiblePerson: e.target.value})}
              />
            </div>

            {/* Planned Dates */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Planned Start
              </label>
              <input 
                type="date" 
                className="w-full bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                value={formData.plannedStart}
                onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => {
                    const next = { ...prev, plannedStart: val };
                    if (val && next.plannedEnd && next.plannedEnd < val) {
                      next.plannedEnd = '';
                    }
                    return next;
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Planned End
              </label>
              <input 
                type="date" 
                min={formData.plannedStart || undefined}
                className="w-full bg-surface-2 border border-border-2 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                value={formData.plannedEnd}
                onChange={e => {
                  const val = e.target.value;
                  if (formData.plannedStart && val && val < formData.plannedStart) {
                    alert('Planned End Date cannot be before Planned Start Date.');
                    return;
                  }
                  setFormData({...formData, plannedEnd: val});
                }}
              />
            </div>

            {/* Priority */}
            <div className="col-span-2 space-y-2 p-6 bg-surface-2/50 border border-border-1 rounded-2xl">
              <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 mb-4">
                <AlertTriangle className="w-3 h-3" /> Priority Level
              </label>
              <div className="flex gap-4">
                {['Low', 'High', 'Critical'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({...formData, priority: level as any})}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                      formData.priority === level 
                        ? (level === 'Critical' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 
                           level === 'High' ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' :
                           'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20')
                        : "bg-surface-2 border-border-2 text-text-tertiary hover:border-text-tertiary"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border-1">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 text-text-tertiary hover:text-text-primary font-bold text-sm uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary font-black uppercase tracking-[0.2em] rounded-xl hover:brightness-110 shadow-lg shadow-primary/20 transition-all text-sm"
            >
              <Save className="w-4 h-4" />
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
