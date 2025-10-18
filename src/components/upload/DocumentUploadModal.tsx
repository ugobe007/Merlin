import * as React from 'react';

export type UploadedDocument = {
  name: string;
  // make size required (avoids "possibly undefined" at call sites).
  size: number;
  url?: string;
  // fields used by AdvancedConfigModal
  aiSuggestions?: any[]; 
  extractedData?: Record<string, any> | null;
};

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
  // the app uses onUploadComplete in AdvancedConfigModal
  onUploadComplete?: (docs: UploadedDocument[]) => void;
  // backward-compatible alias (some callers may use onUpload)
  onUpload?: (docs: UploadedDocument[]) => void;
};

/**
 * Minimal stub implementation so TypeScript can resolve the import.
 * Replace with the real component implementation later.
 */
export default function DocumentUploadModal(props: Props) {
  // call the callback if provided (no-op stub)
  React.useEffect(() => {
    if (props.onUploadComplete) {
      // no real docs in stub; provide empty array
      props.onUploadComplete([]);
    }
  }, []);

  return null;
}
