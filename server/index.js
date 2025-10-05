const express = require('express');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const XlsxPopulate = require('xlsx-populate');

const app = express();

// Performance optimizations
app.use(compression({
  level: 6, // Good balance between compression ratio and speed
  threshold: 1024, // Only compress files larger than 1KB
  filter: (req, res) => {
    // Compress all responses except already compressed files
    return compression.filter(req, res);
  }
}));

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const WORD_TEMPLATE_PATH = path.join(__dirname, 'templates', 'BESS_Quote_Template.docx');
const EXCEL_TEMPLATE_PATH = path.join(__dirname, 'templates', 'BESS_Quote_Template.xlsx');

// Pre-load templates into memory for faster access
let wordTemplateBuffer = null;
let excelTemplateWB = null;
let templateCache = new Map();

function loadWordTemplate() {
  if (!wordTemplateBuffer) {
    wordTemplateBuffer = fs.readFileSync(WORD_TEMPLATE_PATH);
    console.log('[server] Loaded Word template into memory');
  }
  return wordTemplateBuffer;
}

async function loadExcelTemplate() {
  if (!excelTemplateWB) {
    excelTemplateWB = await XlsxPopulate.fromFileAsync(EXCEL_TEMPLATE_PATH);
    console.log('[server] Loaded Excel template into memory');
  }
  return excelTemplateWB;
}

// Pre-load templates on startup for instant access
loadWordTemplate();
loadExcelTemplate().catch(err => console.error('Failed to load Excel template:', err?.message || err));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/export/word', async (req, res) => {
  try {
    const startTime = Date.now();
    const { inputs, assumptions, outputs } = req.body || {};
    
    // Ensure template is loaded
    const templateBuffer = loadWordTemplate();
    
    const zip = new PizZip(Buffer.from(templateBuffer));
    const doc = new Docxtemplater(zip, { 
      paragraphLoop: true, 
      linebreaks: true,
      nullGetter: () => '' // Handle null values gracefully
    });

    // Pre-format data for better performance
    const formattedData = {
      powerMW: inputs?.powerMW ?? '',
      standbyHours: inputs?.standbyHours ?? '',
      gridMode: inputs?.gridMode ?? '',
      useCase: inputs?.useCase ?? '',
      location: inputs?.locationRegion ?? '',
      warrantyYears: inputs?.warrantyYears ?? '',
      budgetKnown: inputs?.budgetKnown ? 'Yes' : 'No',
      budgetAmount: inputs?.budgetAmount ?? '',
      pcsSeparate: inputs?.pcsSeparate ? 'Yes' : 'No',

      batteryCostPerKWh: assumptions?.batteryCostPerKWh ?? '',
      pcsCostPerKW: assumptions?.pcsCostPerKW ?? '',
      bosPct: assumptions?.bosPct ?? '',
      epcPct: assumptions?.epcPct ?? '',
      tariffPct: assumptions?.tariffByRegion?.[inputs?.locationRegion] ?? '',

      totalMWh: outputs?.totalMWh?.toFixed ? outputs.totalMWh.toFixed(2) : outputs?.totalMWh ?? '',
      pcsKW: Math.round(outputs?.pcsKW || 0).toLocaleString(),
      batterySubtotal: Math.round(outputs?.batterySubtotal || 0).toLocaleString(),
      pcsSubtotal: Math.round(outputs?.pcsSubtotal || 0).toLocaleString(),
      bos: Math.round(outputs?.bos || 0).toLocaleString(),
      epc: Math.round(outputs?.epc || 0).toLocaleString(),
      bessCapex: Math.round(outputs?.bessCapex || 0).toLocaleString(),
      genSubtotal: Math.round(outputs?.genSubtotal || 0).toLocaleString(),
      solarSubtotal: Math.round(outputs?.solarSubtotal || 0).toLocaleString(),
      windSubtotal: Math.round(outputs?.windSubtotal || 0).toLocaleString(),
      tariffs: Math.round(outputs?.tariffs || 0).toLocaleString(),
      grandCapexBeforeWarranty: Math.round(outputs?.grandCapexBeforeWarranty || 0).toLocaleString(),
      grandCapex: Math.round(outputs?.grandCapex || 0).toLocaleString(),
      annualSavings: Math.round(outputs?.annualSavings || 0).toLocaleString(),
      roiYears: outputs?.roiYears ? outputs.roiYears.toFixed(2) : '—',
      vendorName: assumptions?.vendorName || '',
    };

    doc.setData(formattedData);
    doc.render();
    
    const buffer = doc.getZip().generate({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const processingTime = Date.now() - startTime;
    console.log(`[server] Word export completed in ${processingTime}ms`);

    // Optimized headers for faster download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=BESS_Quote_${Date.now()}.docx`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    return res.end(buffer);
  } catch (err) {
    console.error('Word export error:', err);
    return res.status(500).json({ error: 'WORD_EXPORT_FAILED' });
  }
});

app.post('/api/export/excel', async (req, res) => {
  try {
    const startTime = Date.now();
    const { inputs, assumptions, outputs } = req.body || {};
    
    // Ensure template is loaded
    const templateWB = await loadExcelTemplate();

    // Create a clone of the template for this request
    const base = await templateWB.outputAsync();
    const wb = await XlsxPopulate.fromDataAsync(base);
    const sheet = wb.sheet(0);

    // Batch cell updates for better performance
    const cellUpdates = [
      ['B2', inputs?.powerMW || 0],
      ['B3', inputs?.standbyHours || 0], 
      ['B4', inputs?.gridMode || ''],
      ['B5', inputs?.useCase || ''],
      ['B6', inputs?.locationRegion || ''],
      ['D2', inputs?.warrantyYears || 10],
      ['D3', outputs?.totalMWh || 0],
      ['D4', outputs?.pcsKW || 0],
      ['D6', outputs?.grandCapex || 0]
    ];

    // Apply all updates at once
    cellUpdates.forEach(([cell, value]) => {
      sheet.cell(cell).value(value);
    });

    const bin = await wb.outputAsync();
    const processingTime = Date.now() - startTime;
    console.log(`[server] Excel export completed in ${processingTime}ms`);

    // Optimized headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=BESS_Quote_${Date.now()}.xlsx`);
    res.setHeader('Content-Length', bin.byteLength);
    res.setHeader('Cache-Control', 'no-cache');
    
    return res.end(Buffer.from(bin));
  } catch (err) {
    console.error('Excel export error:', err);
    return res.status(500).json({ error: 'EXCEL_EXPORT_FAILED' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[server] API listening on http://localhost:${PORT}`));
