/**
 * Corporate Document Repository Service
 * 
 * Manages realistic enterprise documents in the user workspace.
 * Integrates seamlessly with the internal Canary Token deception engine:
 * - Documents appear as ordinary business files (PDF, Word, Excel, Config, Reports)
 * - No visible traps or deception labels are exposed in the user repository
 * - Previewing or downloading a monitored document triggers the internal Canary Token,
 *   generating an incident in the Admin SOC and an audit log event
 */

import type { CorporateDocument, InternalCanaryUserContext } from '../types';
import { internalCanaryService } from './internalCanaryService';

const DOCUMENTS_STORAGE_KEY = 'secureshield_corporate_documents';

/**
 * Determine a human-friendly document type from its file extension
 */
function inferDocumentType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'PDF Document';
    case 'docx':
    case 'doc':
      return 'Word Document';
    case 'xlsx':
    case 'xls':
      return 'Excel Spreadsheet';
    case 'csv':
      return 'CSV Dataset';
    case 'env':
    case 'conf':
    case 'config':
      return 'Configuration File';
    case 'sql':
      return 'Database SQL Script';
    case 'json':
      return 'JSON Structured Data';
    case 'txt':
    case 'md':
      return 'Text Document';
    default:
      return 'Corporate Document';
  }
}

/**
 * Calculate formatted file size from content string
 */
function calculateFileSize(content: string): string {
  const bytes = new Blob([content]).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const documentRepositoryService = {
  /**
   * Retrieve all documents from repository
   */
  getDocuments(): CorporateDocument[] {
    try {
      const raw = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // storage unavailable
    }
    return [];
  },

  /**
   * Save documents to storage
   */
  saveDocuments(documents: CorporateDocument[]): void {
    try {
      localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(documents));
    } catch {
      // ignore
    }
  },

  /**
   * Add a new document to the repository.
   * If isMonitored is true, it automatically creates an internal Canary Token
   * so access triggers intrusion detection in the Admin SOC.
   */
  addDocument(params: {
    name: string;
    content: string;
    department?: string;
    type?: string;
    isMonitored?: boolean;
  }): CorporateDocument {
    const documents = this.getDocuments();
    const now = new Date().toISOString();
    const docId = 'doc_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
    const department = params.department?.trim() || 'General Operations';
    const type = params.type?.trim() || inferDocumentType(params.name);
    const isMonitored = params.isMonitored !== false; // default true

    let canaryTokenId: string | undefined;

    // Link with internal Canary Token service
    if (isMonitored) {
      const canaryToken = internalCanaryService.createToken({
        name: `Repository File: ${params.name.trim()}`,
        type: 'file',
        targetResource: params.name.trim(),
        resourceDescription: `Document repository asset [${params.name.trim()}] in department [${department}]`,
        decoyData: params.content,
        metadata: {
          documentId: docId,
          department,
          type,
          managedBy: 'DocumentRepositoryService',
        },
      });
      canaryTokenId = canaryToken.id;
    }

    const newDoc: CorporateDocument = {
      id: docId,
      name: params.name.trim(),
      type,
      size: calculateFileSize(params.content),
      department,
      uploadedAt: now,
      content: params.content,
      isMonitored,
      canaryTokenId,
    };

    documents.unshift(newDoc);
    this.saveDocuments(documents);
    return newDoc;
  },

  /**
   * Delete a document and its linked canary token
   */
  deleteDocument(id: string): boolean {
    const documents = this.getDocuments();
    const target = documents.find((d) => d.id === id);
    if (!target) return false;

    // Clean up canary token if linked
    if (target.canaryTokenId) {
      internalCanaryService.deleteToken(target.canaryTokenId);
    }

    const remaining = documents.filter((d) => d.id !== id);
    this.saveDocuments(remaining);
    return true;
  },

  /**
   * Preview document content.
   * If monitored, quietly logs canary trigger event to Admin SOC.
   */
  previewDocument(doc: CorporateDocument, userContext?: InternalCanaryUserContext): string {
    if (doc.isMonitored && doc.canaryTokenId) {
      void internalCanaryService.triggerToken({
        tokenId: doc.canaryTokenId,
        eventType: 'DOCUMENT_PREVIEW_GATEWAY',
        resourceName: doc.name,
        severity: 'HIGH',
        userContext: {
          ...userContext,
          action: 'DOCUMENT_PREVIEW_GATEWAY',
          channel: 'Corporate Document Repository',
        },
        summary: `Decoy Document [${doc.name}] previewed in repository viewer by operator ${userContext?.username || userContext?.email || 'User'}.`,
      });
    }
    return doc.content;
  },

  /**
   * Download document file.
   * Initiates browser download and records download-request tripwire event.
   * Note: Monitoring occurs at repository gateway download time. Offline file opening outside the application cannot be tracked without active endpoint agents.
   */
  downloadDocument(doc: CorporateDocument, userContext?: InternalCanaryUserContext): void {
    if (doc.isMonitored && doc.canaryTokenId) {
      void internalCanaryService.triggerToken({
        tokenId: doc.canaryTokenId,
        eventType: 'DOCUMENT_DOWNLOAD_GATEWAY',
        resourceName: doc.name,
        severity: 'HIGH',
        userContext: {
          ...userContext,
          action: 'DOCUMENT_DOWNLOAD_GATEWAY',
          channel: 'Corporate Document Repository',
        },
        summary: `Decoy Document [${doc.name}] download requested from repository gateway by operator ${userContext?.username || userContext?.email || 'User'}. (Intrusion tripwire captured at repository request time).`,
      });
    }

    // Trigger browser file download
    try {
      const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = doc.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      // browser download fallback
    }
  },

  /**
   * Clear all documents from repository
   */
  clearDocuments(): void {
    try {
      localStorage.removeItem(DOCUMENTS_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
