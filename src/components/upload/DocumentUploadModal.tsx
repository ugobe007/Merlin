import * as React from 'react';

export type UploadedDocument = {
  name: string;
  size?: number;
  url?: string;
};

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
  onUpload?: (docs: UploadedDocument[]) => void;
};

/**
 * Minimal stub implementation so TypeScript can resolve the import.
 * Replace with the real component implementation later.
 */
export default function DocumentUploadModal(_props: Props) {
  return null;
}
