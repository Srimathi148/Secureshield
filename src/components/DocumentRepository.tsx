import React, { useState, useEffect } from 'react';
import {
  Files,
  FileText,
  FileSpreadsheet,
  FileCode,
  Folder,
  Search,
  Download,
  Eye,
  Plus,
  Trash2,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { CorporateDocument, AuthSession } from '../types';
import { documentRepositoryService } from '../services/documentRepositoryService';

interface DocumentRepositoryProps {
  session: AuthSession;
}

export const DocumentRepository: React.FC<DocumentRepositoryProps> = ({ session }) => {
  const isAdmin = session.user.role === 'admin';
  const [documents, setDocuments] = useState<CorporateDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [previewDoc, setPreviewDoc] = useState<CorporateDocument | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Add document modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileDepartment, setFileDepartment] = useState('Finance');
  const [customType, setCustomType] = useState('');

  const reloadDocuments = () => {
    setDocuments(documentRepositoryService.getDocuments());
  };

  useEffect(() => {
    reloadDocuments();
  }, []);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Preview document
  const handlePreview = (doc: CorporateDocument) => {
    const content = documentRepositoryService.previewDocument(doc, {
      userId: session.user.id,
      email: session.user.email,
      username: session.user.username || session.user.fullName,
      role: session.user.role,
    });
    setPreviewContent(content);
    setPreviewDoc(doc);
  };

  // Download document
  const handleDownload = (doc: CorporateDocument) => {
    documentRepositoryService.downloadDocument(doc, {
      userId: session.user.id,
      email: session.user.email,
      username: session.user.username || session.user.fullName,
      role: session.user.role,
    });
    showToast(`Downloading '${doc.name}' to your local computer...`, 'success');
  };

  // Delete document
  const handleDelete = (id: string, name: string) => {
    documentRepositoryService.deleteDocument(id);
    reloadDocuments();
    showToast(`Document '${name}' removed from repository.`, 'info');
  };

  // Add new document
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !fileContent.trim()) {
      alert('Please provide both file name and file content.');
      return;
    }

    documentRepositoryService.addDocument({
      name: fileName.trim(),
      content: fileContent,
      department: fileDepartment,
      type: customType.trim() || undefined,
      isMonitored: true,
    });

    setFileName('');
    setFileContent('');
    setCustomType('');
    setShowAddModal(false);
    reloadDocuments();
    showToast(`Document '${fileName.trim()}' published to repository.`, 'success');
  };

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'ALL' || doc.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  // Get file icon based on file name extension
  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-500 shrink-0" />;
      case 'env':
      case 'conf':
      case 'sql':
      case 'json':
        return <FileCode className="w-5 h-5 text-amber-500 shrink-0" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-500 shrink-0" />;
    }
  };

  const departments = ['ALL', 'Finance', 'Human Resources', 'Engineering', 'Legal', 'Operations', 'Executive'];

  return (
    <div className="space-y-6 animate-in fade-in-50 text-left">
      {/* Toast notification */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs flex items-center justify-between shadow-sm animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Corporate Repository Header */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Files className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ENTERPRISE DOCUMENT VAULT
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                Corporate Document Repository
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Centralized, access-controlled repository for internal strategic memos, department procedures, financial models, and operational assets.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-md shadow-teal-500/20 transition-all cursor-pointer self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents by name, type, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
            {departments.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setDepartmentFilter(dept)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  departmentFilter === dept
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {dept === 'ALL' ? 'All Departments' : dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Folder className="w-7 h-7 stroke-[1.5]" />
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Document Repository is Empty
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {isAdmin
              ? 'There are currently no documents in the repository. Click "Add Document" above to upload and register your corporate files with custom names and contents.'
              : 'There are currently no documents in the corporate repository. Please check back later or contact your department administrator.'}
          </p>
          {isAdmin ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Document</span>
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 font-mono pt-1">
              Access permissions: Read-only. Document uploads restricted to authorized administrators.
            </p>
          )}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
          No documents matching "{searchQuery}" in department "{departmentFilter}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getFileIcon(doc.name)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" title={doc.name}>
                        {doc.name}
                      </h4>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {doc.type} • {doc.size}
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                    {doc.department}
                  </span>
                </div>

                <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed border border-slate-100 dark:border-slate-800/80">
                  {doc.content.slice(0, 150)}
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {doc.department}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handlePreview(doc)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  title="Preview document in browser reader"
                >
                  <Eye className="w-3.5 h-3.5 text-teal-500" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-slate-950 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  title="Download file to computer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id, doc.name)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remove document (Admin only)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative text-left animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {getFileIcon(previewDoc.name)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {previewDoc.name}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono">
                    {previewDoc.type} • {previewDoc.size} • Department: {previewDoc.department}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Reader Area */}
            <div className="my-4 flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed border border-slate-200 dark:border-slate-800">
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                {previewContent}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Verified secure cloud document preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-slate-950 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW DOCUMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-left animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Publish Document to Repository
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3_Financial_Review.docx or System_Architecture.pdf"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={fileDepartment}
                    onChange={(e) => setFileDepartment(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="Finance">Finance</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Legal">Legal</option>
                    <option value="Operations">Operations</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    File Type (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Word Document (or auto-detect)"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  File Content
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Enter the business document text, operational report, or simulated memo content..."
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 font-mono leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
