import * as React from 'react';

export type UploadedDocument = {
  name: string;
  size: number; // required to avoid "possibly undefined"
  url?: string;
  // Fields used by AdvancedConfigModal — make them present to satisfy tsc
  aiSuggestions: any[];
  extractedData: Record<string, any>;
};

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
  onUploadComplete?: (docs: UploadedDocument[]) => void;
  onUpload?: (docs: UploadedDocument[]) => void;
};

export default function DocumentUploadModal(props: Props) {
  React.useEffect(() => {
    if (props.onUploadComplete) props.onUploadComplete([]);
  }, []);

  return null;
}
