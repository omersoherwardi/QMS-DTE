import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Upload, 
  Download, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Filter,
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileSearch,
  CheckSquare,
  Plus,
  Trash2
} from 'lucide-react';
import { useProjects, UserRole, formatDate } from '../context/ProjectContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Documents() {
  const navigate = useNavigate();
  const { documents, addDocument, updateDocument, deleteDocument, currentUser } = useProjects();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('Recently Updated');
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const filteredDocs = useMemo(() => {
    let result = documents.map(doc => {
      let statusColor = 'text-green-400 bg-green-400/10 border-green-400/20';
      let iconColor = 'text-primary';
      
      if (doc.status === 'Pending Approval' || doc.status === 'Awaiting Approval') {
        statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        iconColor = 'text-amber-500';
      } else if (doc.status === 'Draft') {
        statusColor = 'text-text-tertiary bg-surface-3 border-border-2';
        iconColor = 'text-text-tertiary';
      }

      return {
        ...doc,
        statusColor,
        iconColor,
        tags: doc.tags || []
      };
    });
    
    if (search) {
      result = result.filter(doc => 
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.owner.toLowerCase().includes(search.toLowerCase()) ||
        doc.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    return result;
  }, [search, documents]);

  const stats = useMemo(() => {
    return {
      total: documents.length,
      pending: documents.filter(d => d.status === 'Pending Approval' || d.status === 'Awaiting Approval').length
    };
  }, [documents]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name} permanently?`)) {
      try {
        await deleteDocument(id);
      } catch (error) {
        alert('Failed to delete document.');
      }
    }
  };

  const handleApprove = (id: string) => {
    updateDocument(id, { 
      status: 'Released',
      approver: currentUser?.name || 'Admin',
      approvalDate: formatDate(new Date())
    });
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Check format (PDF only)
    if (file.type !== 'application/pdf') {
      alert('Error: Only PDF documents are allowed.');
      return;
    }

    // 2. Check size (Max 800KB for Firestore documents)
    const maxSize = 800 * 1024; // 800KB
    if (file.size > maxSize) {
      alert('Error: File size must not exceed 800KB for direct storage. For larger files, a placeholder will be used.');
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileUrl = reader.result as string;
      const docName = prompt('Enter document name:', file.name.replace('.pdf', '')) || file.name;
      
      const newDoc = {
        name: docName,
        owner: currentUser?.name || 'System',
        ownerEmail: currentUser?.email || '',
        version: 'v1.0',
        status: 'Pending Approval',
        updated: formatDate(new Date()),
        tags: ['New Upload'],
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        fileUrl: file.size <= maxSize ? fileUrl : null
      };

      try {
        await addDocument(newDoc);
        alert('Document uploaded successfully and sent for approval.');
      } catch (error) {
        alert('Failed to upload document.');
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        accept=".pdf" 
        className="hidden" 
      />
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-4xl font-black text-text-primary tracking-tight">Document Repository</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleUpload}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 bg-surface-1 border border-border-2 p-5 rounded-xl shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-[10px] font-black uppercase tracking-widest">Total Files</span>
            <FileSearch className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-text-primary tracking-tight">{stats.total}</div>
        </div>

        <div className="col-span-3 bg-surface-1 border border-border-2 p-5 rounded-xl shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-[10px] font-black uppercase tracking-widest">Pending Approval</span>
            <CheckSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-black text-text-primary tracking-tight">{stats.pending}</div>
          <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Awaiting QA Review</div>
        </div>
      </div>

      <div className="bg-surface-1 border border-border-2 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 bg-background/50 border-b border-border-1 flex justify-between items-center">
          <div className="flex items-center gap-2 flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Search documents, owners, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-border-2 rounded-lg pl-9 pr-4 py-2 text-xs font-bold text-text-primary outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-text-secondary uppercase tracking-widest">
              <Filter className="w-3.5 h-3.5" />
              Sort by: 
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-transparent border-none text-text-primary outline-none cursor-pointer p-0"
              >
                <option value="Recently Updated">Recently Updated</option>
                <option value="Name A-Z">Name A-Z</option>
                <option value="Version High-Low">Version High-Low</option>
              </select>
            </div>
            <div className="flex border border-border-2 rounded-lg overflow-hidden">
              <button className="p-2 bg-surface-3 text-text-primary">
                <ListIcon className="w-4 h-4" />
              </button>
              <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-1">
              <th className="px-6 py-4 text-[10px] font-black text-text-tertiary uppercase tracking-[0.15em]">Name</th>
              <th className="px-6 py-4 text-[10px] font-black text-text-tertiary uppercase tracking-[0.15em]">Version</th>
              <th className="px-6 py-4 text-[10px] font-black text-text-tertiary uppercase tracking-[0.15em]">Owner</th>
              <th className="px-6 py-4 text-[10px] font-black text-text-tertiary uppercase tracking-[0.15em]">Last Updated</th>
              <th className="px-6 py-4 text-[10px] font-black text-text-tertiary uppercase tracking-[0.15em]">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-text-tertiary uppercase tracking-[0.15em]">Approver</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-1">
            {filteredDocs.map((doc) => (
              <tr 
                key={doc.id} 
                className="hover:bg-background/40 transition-colors group cursor-pointer"
                onClick={() => navigate(`/documents/${doc.id}`)}
              >
                <td className="px-6 py-5">
                  <div className="flex items-start gap-4">
                    <FileText className={cn("w-5 h-5 shrink-0 mt-0.5", doc.iconColor)} />
                    <div>
                      <div className="text-sm font-bold text-text-primary leading-tight">{doc.name}</div>
                      <div className="flex gap-2 mt-2">
                        {doc.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-surface-3 text-[9px] font-black text-text-secondary uppercase tracking-widest rounded-sm border border-border-2">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-text-secondary font-mono text-[11px] font-bold">{doc.version}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center text-[9px] font-bold border border-border-2 text-primary">
                      {doc.owner.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-text-secondary text-[11px] font-medium">{doc.owner}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-text-tertiary text-[11px] font-bold uppercase">{formatDate(doc.updated)}</td>
                <td className="px-6 py-5">
                  <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", doc.statusColor)}>
                    <div className={cn("w-1.5 h-1.5 rounded-full mr-2 inline-block", doc.statusColor.split(' ')[0].replace('text-', 'bg-'))} />
                    {doc.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  {doc.approver ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-[9px] font-bold border border-emerald-500/20 text-emerald-400">
                        {doc.approver.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-text-secondary text-[11px] font-bold">{doc.approver}</span>
                        {doc.approvalDate && <span className="text-[9px] text-text-tertiary uppercase font-black">{doc.approvalDate}</span>}
                      </div>
                    </div>
                  ) : (
                    <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">—</span>
                  )}
                </td>
                <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    {isAdmin && (doc.status === 'Pending Approval' || doc.status === 'Awaiting Approval') && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(doc.id);
                        }}
                        className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded border border-emerald-400/20 pointer-events-auto"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id, doc.name);
                        }}
                        className="p-1.5 text-red-400 hover:bg-red-400/10 rounded border border-red-400/20 pointer-events-auto"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border-1 flex items-center justify-between bg-surface-1/50">
          <span className="text-text-tertiary font-mono text-[10px] uppercase font-bold">Showing 1 to {filteredDocs.length} of {filteredDocs.length} entries</span>
          <div className="flex items-center gap-1">
            <button className="p-1 border border-border-2 rounded text-text-tertiary opacity-30 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3.5 py-1.5 bg-primary text-on-primary font-black rounded-lg text-[11px]">1</button>
            <button className="p-1 border border-border-2 rounded text-text-tertiary opacity-30 cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
