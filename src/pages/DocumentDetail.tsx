
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft, 
  Download, 
  Share2, 
  Clock, 
  User, 
  ShieldCheck,
  Calendar,
  Layers,
  RefreshCw
} from 'lucide-react';
import { useProjects, formatDate } from '../context/ProjectContext';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, updateDocument, isAdmin, currentUser } = useProjects();
  
  const document = documents.find(d => d.id === id);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (document?.fileUrl && document.fileUrl.startsWith('data:application/pdf')) {
      try {
        // Convert data URL to Blob for safer iframe display
        const parts = document.fileUrl.split(',');
        const byteString = atob(parts[1]);
        const mimeString = parts[0].split(':')[1].split(';')[0];
        
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeString });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (e) {
        console.error('Error creating blob record:', e);
      }
    }
  }, [document?.fileUrl]);

  const handleApprove = () => {
    if (!document) return;
    updateDocument(document.id, { 
      status: 'Released',
      approver: currentUser?.name || 'Admin',
      approvalDate: formatDate(new Date())
    });
  };

  const handleUpdateVersion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !document) return;

    if (file.type !== 'application/pdf') {
      alert('Error: Please upload a PDF file.');
      return;
    }

    const maxSize = 800 * 1024; // 800KB
    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileUrl = reader.result as string;
      const currentVersion = document.version || 'v1.0';
      const versionMatch = currentVersion.match(/v(\d+)\.(\d+)/);
      let nextVersion = currentVersion;
      
      if (versionMatch) {
        const major = versionMatch[1];
        const minor = parseInt(versionMatch[2]) + 1;
        nextVersion = `v${major}.${minor}`;
      } else {
        nextVersion = 'v1.1';
      }

      await updateDocument(document.id, {
        version: nextVersion,
        status: 'Pending Approval',
        updated: formatDate(new Date()),
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        fileUrl: file.size <= maxSize ? fileUrl : null
      });
      alert(`Document updated to ${nextVersion}. Awaiting approval.`);
    };
    reader.readAsDataURL(file);
  };

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-full bg-surface-2 flex items-center justify-center border border-border-2">
          <FileText className="w-10 h-10 text-text-tertiary" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Document Not Found</h2>
        <button 
          onClick={() => navigate('/documents')}
          className="text-primary font-bold uppercase text-xs tracking-widest hover:underline"
        >
          Back to Repository
        </button>
      </div>
    );
  }

  // Use document's fileUrl if available, fallback to dummy for system records
  // We prefer the blobUrl we created, then falls back to original fileUrl or dummy
  const pdfSource = blobUrl || (document?.fileUrl && !document.fileUrl.startsWith('data:') ? document.fileUrl : null);
  const isExternal = pdfSource && !pdfSource.startsWith('blob:') && !pdfSource.startsWith('data:');
  const viewerUrl = isExternal 
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(pdfSource)}&embedded=true`
    : pdfSource || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <button 
          onClick={() => navigate('/documents')}
          className="group flex items-center gap-2 text-text-tertiary hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Repository</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg text-primary">
                <FileText className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-black text-text-primary tracking-tight leading-tight uppercase">
                {document.name}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">
              <span className={cn(
                "px-2 py-0.5 rounded border",
                document.status === 'Released' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                document.status === 'Pending Approval' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                "bg-primary/10 text-primary border-primary/20"
              )}>
                {document.status}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {document.version}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatDate(document.updated)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(isAdmin || currentUser?.email === document.ownerEmail) && (
              <>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  id="version-update-input" 
                  className="hidden" 
                  onChange={handleUpdateVersion}
                />
                <button 
                  onClick={() => window.document.getElementById('version-update-input')?.click()}
                  className="flex items-center gap-2 px-6 py-3 bg-surface-2 border border-border-2 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-3 transition-all active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  New Version
                </button>
              </>
            )}

            {isAdmin && (document.status === 'Pending Approval' || document.status === 'Awaiting Approval') && (
              <button 
                onClick={handleApprove}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 animate-pulse"
              >
                <ShieldCheck className="w-4 h-4" />
                Approve Now
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Viewer Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-surface-2 border border-border-2 rounded-2xl overflow-hidden shadow-2xl h-[850px] flex flex-col">
            <div className="px-6 py-4 bg-surface-3 border-b border-border-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.15em]">PDF Preview Control</span>
                <div className="h-4 w-[1px] bg-border-2" />
                <span className="text-[11px] font-bold text-text-secondary">{document.name}.pdf</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Secure View</span>
              </div>
            </div>
            <div className="flex-1 bg-[#525659] relative">
              {isExternal ? (
                <iframe 
                  src={viewerUrl}
                  className="w-full h-full border-none"
                  title={document.name}
                />
              ) : (
                <object
                  data={viewerUrl}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center bg-neutral-900/90">
                    <Download className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-lg font-bold mb-2">Browser Blocked Viewer</h3>
                    <p className="text-sm text-gray-400 mb-6 max-w-md">Try downloading the file to view it locally.</p>
                    <a 
                      href={pdfSource || undefined} 
                      download={`${document.name}.pdf`}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110"
                    >
                      Download Document
                    </a>
                  </div>
                </object>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-surface-1 border border-border-2 rounded-2xl p-6 space-y-6">
            <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mb-4">Metadata</h4>
            
            <div className="space-y-6">
              <div className="group">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Document Author</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-[10px]">
                    {document.owner.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <span className="text-xs font-bold text-text-primary">{document.owner}</span>
                </div>
              </div>

              {document.approver && (
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Approved By</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black text-[10px]">
                      {document.approver.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-text-primary">{document.approver}</span>
                      <span className="text-[8px] text-text-tertiary font-black uppercase tracking-widest">{formatDate(document.approvalDate)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="group">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                  <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Created At</span>
                </div>
                <span className="text-xs font-bold text-text-primary block ml-7">May 12, 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
