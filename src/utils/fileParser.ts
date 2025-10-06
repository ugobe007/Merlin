// File parsing utilities for vendor quotes
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export interface ParsedQuoteData {
  vendorName: string;
  vendorFile: string;
  vendorDate: string;
  extractedData: any;
  originalFormat: 'excel' | 'word' | 'pdf' | 'unknown';
}

// Common battery/energy storage terms to look for in documents
const ENERGY_TERMS = [
  'kwh', 'mwh', 'capacity', 'battery', 'storage', 'bess',
  'power', 'energy', 'cell', 'pack', 'system', 'inverter',
  'pcs', 'price', 'cost', '$', 'usd', 'quote', 'quotation'
];

// Extract key-value pairs from text that might contain pricing/specs
function extractKeyValuePairs(text: string): any {
  const extracted: any = {};
  const lines = text.split('\n');
  
  lines.forEach(line => {
    // Look for patterns like "Key: Value" or "Key = Value" or "Key - Value"
    const keyValueMatch = line.match(/([^:=\-]+)[:=\-]\s*(.+)/);
    if (keyValueMatch) {
      const key = keyValueMatch[1].trim().toLowerCase();
      const value = keyValueMatch[2].trim();
      
      // Check if this line contains energy storage related terms
      const isRelevant = ENERGY_TERMS.some(term => 
        key.includes(term) || value.toLowerCase().includes(term)
      );
      
      if (isRelevant) {
        extracted[key] = value;
      }
    }
    
    // Look for price patterns like "$1,000" or "1000 USD"
    const priceMatch = line.match(/\$[\d,]+\.?\d*|[\d,]+\.?\d*\s*(usd|dollar)/i);
    if (priceMatch) {
      extracted[`price_from_${line.substring(0, 20).replace(/\W/g, '_')}`] = priceMatch[0];
    }
  });
  
  return extracted;
}

// Parse Excel files
export async function parseExcelFile(file: File): Promise<ParsedQuoteData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const extractedData: any = {};
        
        // Process each worksheet
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Convert to text for key-value extraction
          const textData = jsonData.map((row: any) => 
            Array.isArray(row) ? row.join(' | ') : String(row)
          ).join('\n');
          
          const keyValues = extractKeyValuePairs(textData);
          if (Object.keys(keyValues).length > 0) {
            extractedData[sheetName] = keyValues;
          }
          
          // Also store raw data for the first few rows
          extractedData[`${sheetName}_raw`] = jsonData.slice(0, 20);
        });
        
        resolve({
          vendorName: `Excel Import - ${file.name}`,
          vendorFile: file.name,
          vendorDate: new Date().toLocaleString(),
          extractedData,
          originalFormat: 'excel'
        });
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// Parse Word files
export async function parseWordFile(file: File): Promise<ParsedQuoteData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        const extractedData = extractKeyValuePairs(result.value);
        
        // Also extract any tables if present
        const tableResult = await mammoth.convertToHtml({ arrayBuffer });
        const tableMatch = tableResult.value.match(/<table[^>]*>.*?<\/table>/gi);
        
        if (tableMatch) {
          extractedData.tables = tableMatch.map(table => table.replace(/<[^>]*>/g, ' ').trim());
        }
        
        resolve({
          vendorName: `Word Import - ${file.name}`,
          vendorFile: file.name,
          vendorDate: new Date().toLocaleString(),
          extractedData: {
            ...extractedData,
            fullText: result.value.substring(0, 1000), // First 1000 chars for reference
            wordCount: result.value.split(' ').length
          },
          originalFormat: 'word'
        });
      } catch (error) {
        reject(new Error(`Failed to parse Word file: ${error}`));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// Parse PDF files (Note: This requires a different approach for client-side)
export async function parsePDFFile(file: File): Promise<ParsedQuoteData> {
  // For now, we'll return a placeholder since PDF parsing on the client-side
  // is complex and often requires server-side processing
  return Promise.resolve({
    vendorName: `PDF Import - ${file.name}`,
    vendorFile: file.name,
    vendorDate: new Date().toLocaleString(),
    extractedData: {
      note: 'PDF parsing requires server-side processing. Please use Excel or Word format for automatic data extraction.',
      fileSize: file.size,
      fileName: file.name
    },
    originalFormat: 'pdf'
  });
}

// Main parsing function that determines file type and routes to appropriate parser
export async function parseVendorQuoteFile(file: File): Promise<ParsedQuoteData> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcelFile(file);
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    return parseWordFile(file);
  } else if (fileName.endsWith('.pdf')) {
    return parsePDFFile(file);
  } else {
    throw new Error('Unsupported file type. Please upload Excel (.xlsx), Word (.docx), or PDF files.');
  }
}