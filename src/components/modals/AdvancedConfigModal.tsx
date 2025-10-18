// --- Insert/replace the data-sanitizing block near where `documents` is used ---

// Ensure `documents` is an array we can safely iterate, and provide defaults for missing fields:
const safeDocuments = Array.isArray(documents) ? documents : ([] as UploadedDocument[]);

// aiSuggestions may be missing; use empty array as default
const allSuggestions = safeDocuments.flatMap(doc => doc.aiSuggestions ?? []);

// extractedData may be missing/null; use an empty object to allow property access safely
const extractedData = safeDocuments[0]?.extractedData ?? {};

// When building initial config values, use nullish coalescing to fall back to existing config
const initialConfigFromExtracted = {
  projectReference: extractedData.projectName ?? config.projectReference,
  customerName: extractedData.customerName ?? config.customerName,
  siteLocation: extractedData.location ?? config.siteLocation,
  powerMW: extractedData.powerRequirement ?? config.powerMW,
  voltage: extractedData.voltage ?? config.voltage,
};

// When rendering sizes, guard against undefined sizes:
function prettySizeKb(size?: number) {
  const numeric = Number(size ?? 0);
  return `${(numeric / 1024).toFixed(1)} KB`;
}

// Example usage replacements:
// - replace `documents.flatMap(doc => doc.aiSuggestions)` with `allSuggestions`
// - replace `documents[0].extractedData` with `extractedData`
// - wherever you render `doc.size`, use `prettySizeKb(doc.size)` instead
// --- end block ---