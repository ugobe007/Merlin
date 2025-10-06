const express = require('express')
const cors = require('cors')
const compression = require('compression')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')
const Docxtemplater = require('docxtemplater')
const ExcelJS = require('exceljs')
const databaseRoutes = require('./routes/database.cjs')

const app = express()

// Performance optimizations
app.use(compression({
  level: 6, // Good balance between compression ratio and speed
  threshold: 1024, // Only compress files larger than 1KB
  filter: (req, res) => {
    return compression.filter(req, res);
  }
}));

// Enhanced CORS to support multiple localhost ports
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', // Hot Money Honey
    'http://localhost:5175',
    'http://localhost:5176', // Intended Vite dev server
    'http://localhost:5177',
    'http://localhost:5178', // Current Vite dev server
    'http://localhost:3000',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(bodyParser.json({ limit: '5mb' }))

// Database API routes  
app.use('/api/db', databaseRoutes)

// Request logging middleware
app.use((req, res, next) => {
  const origin = req.get('Origin') || req.get('Referer') || 'direct';
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path} from ${origin}`);
  next();
});

// Pre-load templates into memory
const WORD_TEMPLATE_PATH = path.join(__dirname, 'templates', 'BESS_Quote_Template.docx');
let wordTemplateBuffer = null;

function loadWordTemplate() {
  if (!wordTemplateBuffer) {
    wordTemplateBuffer = fs.readFileSync(WORD_TEMPLATE_PATH);
    console.log('[server] Loaded Word template into memory');
  }
  return wordTemplateBuffer;
}

// Pre-load on startup
loadWordTemplate();

const money = (n) => `$${Math.round(Number(n || 0)).toLocaleString()}`
const pct = (n) => `${Math.round(Number(n || 0) * 100)}%`
const yesno = (b) => (b ? 'Yes' : 'No')

// Health check endpoint
app.get('/api/health', (req, res) => {
  const origin = req.get('Origin') || req.get('Referer') || 'direct';
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    templatesLoaded: !!wordTemplateBuffer,
    requestOrigin: origin,
    serverPort: process.env.PORT || 5000,
    supportedOrigins: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175', 
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178'
    ]
  });
});

// Test endpoint for CORS from different ports
app.get('/api/test-cors', (req, res) => {
  const origin = req.get('Origin') || 'No Origin Header';
  res.json({
    message: 'CORS working!',
    yourOrigin: origin,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check template availability
app.get('/api/debug/templates', (req, res) => {
  const templatePath = path.join(__dirname, 'templates', 'BESS_Quote_Template.docx');
  const templateExists = fs.existsSync(templatePath);
  
  let templateInfo = {
    templatePath,
    templateExists,
    workingDirectory: process.cwd(),
    serverDirectory: __dirname,
  };
  
  if (templateExists) {
    try {
      const stats = fs.statSync(templatePath);
      templateInfo.templateSize = stats.size;
      templateInfo.templateModified = stats.mtime;
    } catch (e) {
      templateInfo.templateError = e.message;
    }
  }
  
  // Check if templates directory exists
  const templatesDir = path.join(__dirname, 'templates');
  templateInfo.templatesDirExists = fs.existsSync(templatesDir);
  
  if (templateInfo.templatesDirExists) {
    try {
      templateInfo.templatesContent = fs.readdirSync(templatesDir);
    } catch (e) {
      templateInfo.templatesDirError = e.message;
    }
  }
  
  res.json(templateInfo);
});

app.post('/api/export/word', async (req, res) => {
  console.time('export:word:total');
  console.log('[export:word] Starting Word export request');
  try {
    const { inputs = {}, assumptions = {}, outputs = {} } = req.body;
    console.log('[export:word] Request body received, inputs keys:', Object.keys(inputs));

    console.time('export:word:preprocess');
    // Pre-compute all data once (recommended optimization)
    const tariffPct = (assumptions.tariffByRegion?.[inputs.locationRegion] ?? 0);
    const warrantyUplift = inputs.warrantyYears === 20 ? 0.10 : 0;
    
    // Pre-converted template data for faster rendering
    const templateData = {
      POWER: String(inputs.powerMW || ''),
      HOURS: String(inputs.standbyHours || ''),
      VOLTAGE: String(inputs.voltage || ''),
      MODE: String(inputs.gridMode || ''),
      USECASE: String(inputs.useCase || ''),
      CERTS: String(inputs.certifications || ''),
      GENERATOR_MW: String(inputs.generatorMW || ''),
      SOLAR_MWP: String(inputs.solarMWp || ''),
      WIND_MW: String(inputs.windMW || ''),
      UTILIZATION: String(inputs.utilization || ''),
      VALUE_PER_KWH: String(inputs.valuePerKWh || ''),
      WARRANTY_YEARS: String(inputs.warrantyYears || ''),
      WARRANTY_UPLIFT: pct(warrantyUplift),
      LOCATION_REGION: String(inputs.locationRegion || ''),
      PCS_SEPARATE: yesno(inputs.pcsSeparate),
      BUDGET_KNOWN: yesno(inputs.budgetKnown),
      BUDGET_AMOUNT: inputs.budgetKnown ? money(inputs.budgetAmount || 0) : '—',
      
      // Pre-formatted assumptions
      BATTERY_PER_KWH: money(assumptions.batteryCostPerKWh),
      PCS_PER_KW: money(assumptions.pcsCostPerKW),
      BOS_PCT: pct(assumptions.bosPct),
      EPC_PCT: pct(assumptions.epcPct),
      OFFGRID_FACTOR: String(assumptions.offgridFactor || ''),
      ONGRID_FACTOR: String(assumptions.ongridFactor || ''),
      GEN_PER_KW: money(assumptions.genCostPerKW),
      SOLAR_PER_KWP: money(assumptions.solarCostPerKWp),
      WIND_PER_KW: money(assumptions.windCostPerKW),
      TARIFF_REGION_PCT: pct(tariffPct),
      
      // Pre-formatted outputs
      TOTAL_MWH: String(outputs.totalMWh?.toFixed?.(2) ?? '0.00'),
      PCS_KW: String(Math.round(outputs.pcsKW || 0).toLocaleString()),
      BATTERY_SUBTOTAL: money(outputs.batterySubtotal),
      PCS_SUBTOTAL: money(outputs.pcsSubtotal),
      BOS: money(outputs.bos),
      EPC: money(outputs.epc),
      BESS_CAPEX: money(outputs.bessCapex),
      GEN_SUBTOTAL: money(outputs.genSubtotal),
      SOLAR_SUBTOTAL: money(outputs.solarSubtotal),
      WIND_SUBTOTAL: money(outputs.windSubtotal),
      TARIFFS: money(outputs.tariffs),
      GRAND_CAPEX_PRE: money(outputs.grandCapexBeforeWarranty),
      GRAND_CAPEX: money(outputs.grandCapex),
      ANNUAL_SAVINGS: money(outputs.annualSavings),
      ROI_YEARS: outputs.roiYears ? Number(outputs.roiYears).toFixed(2) : '—',
      BUDGET_DELTA: (inputs.budgetKnown && typeof outputs.budgetDelta === 'number') ? money(outputs.budgetDelta) : '—'
    };
    console.timeEnd('export:word:preprocess');
    console.log('[export:word] Template data prepared, field count:', Object.keys(templateData).length);

    console.time('export:word:template');
    // Check if template exists
    if (!fs.existsSync(WORD_TEMPLATE_PATH)) {
      throw new Error(`Template file not found at ${WORD_TEMPLATE_PATH}`);
    }
    
    // Use fresh template instance for thread safety
    const templateBuffer = loadWordTemplate();
    console.log('[export:word] Template buffer loaded, size:', templateBuffer.length, 'bytes');
    
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, { 
      paragraphLoop: true, 
      linebreaks: true,
      nullGetter: () => '',
      delimiters: { start: '{', end: '}' },
      parser: (tag) => ({ get: tag }) // Optimized parser
    });
    console.timeEnd('export:word:template');
    console.log('[export:word] Docxtemplater initialized successfully');

    console.time('export:word:render');
    doc.setData(templateData);
    doc.render();
    console.timeEnd('export:word:render');
    console.log('[export:word] Document rendered successfully');
    
    console.time('export:word:generate');
    const buffer = doc.getZip().generate({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 } // Balanced compression for speed
    });
    console.timeEnd('export:word:generate');
    console.log('[export:word] Buffer generated, size:', buffer.length, 'bytes');

    console.time('export:word:stream');
    // Optimized response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="BESS_Quote.docx"');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    
    // Stream response
    res.end(buffer);
    console.timeEnd('export:word:stream');
    console.timeEnd('export:word:total');
    console.log('[export:word] Export completed successfully');

  } catch (error) {
    console.error('[export:word] Export failed:', error.message);
    console.error('[export:word] Stack trace:', error.stack);
    console.timeEnd('export:word:total');
    
    // Return detailed error for debugging
    res.status(500).json({ 
      error: 'Export failed', 
      details: error.message,
      templatePath: WORD_TEMPLATE_PATH,
      templateExists: fs.existsSync(WORD_TEMPLATE_PATH),
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

app.post('/api/export/excel', async (req, res) => {
  try {
    const startTime = Date.now();
    const { inputs = {}, assumptions = {}, outputs = {} } = req.body
    
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('BESS Quote')

    // Pre-configure columns for better performance
    ws.columns = [
      { header: 'Field', key: 'k', width: 34 },
      { header: 'Value', key: 'v', width: 28 },
    ]

    const tariffPct = (assumptions.tariffByRegion?.[inputs.locationRegion] ?? 0)
    const warrantyUplift = inputs.warrantyYears === 20 ? 0.10 : 0

    // Pre-build all rows for batch insertion
    const rows = [
      ['--- Inputs ---', ''],
      ['Power (MW)', inputs.powerMW],
      ['Standby Hours', inputs.standbyHours],
      ['Voltage', inputs.voltage],
      ['Grid Mode', inputs.gridMode],
      ['Use Case', inputs.useCase],
      ['Certifications', inputs.certifications],
      ['Generator (MW)', inputs.generatorMW],
      ['Solar (MWp)', inputs.solarMWp],
      ['Wind (MW)', inputs.windMW],
      ['Utilization (0–1)', inputs.utilization],
      ['Value $/kWh', inputs.valuePerKWh],
      ['Warranty (years)', inputs.warrantyYears],
      ['Warranty Uplift', pct(warrantyUplift)],
      ['Location (Region)', inputs.locationRegion],
      ['PCS Separate?', yesno(inputs.pcsSeparate)],
      ['Budget Known?', yesno(inputs.budgetKnown)],
      ['Budget (USD)', inputs.budgetKnown ? money(inputs.budgetAmount || 0) : '—'],

      ['', ''],
      ['--- Assumptions ---', ''],
      ['Battery $/kWh', money(assumptions.batteryCostPerKWh)],
      ['PCS $/kW', money(assumptions.pcsCostPerKW)],
      ['BOS %', pct(assumptions.bosPct)],
      ['EPC %', pct(assumptions.epcPct)],
      ['Off-grid PCS factor', assumptions.offgridFactor],
      ['On-grid PCS factor', assumptions.ongridFactor],
      ['Gen $/kW', money(assumptions.genCostPerKW)],
      ['Solar $/kWp', money(assumptions.solarCostPerKWp)],
      ['Wind $/kW', money(assumptions.windCostPerKW)],
      ['Tariff % (region)', pct(tariffPct)],

      ['', ''],
      ['--- Calculations ---', ''],
      ['Total MWh', outputs.totalMWh],
      ['PCS kW', Math.round(outputs.pcsKW || 0)],
      ['Battery Subtotal', money(outputs.batterySubtotal)],
      ['PCS Subtotal' + (inputs.pcsSeparate ? ' (+15%)' : ''), money(outputs.pcsSubtotal)],
      ['BOS', money(outputs.bos)],
      ['EPC', money(outputs.epc)],
      ['BESS CapEx', money(outputs.bessCapex)],
      ['Generator Subtotal', money(outputs.genSubtotal)],
      ['Solar Subtotal', money(outputs.solarSubtotal)],
      ['Wind Subtotal', money(outputs.windSubtotal)],
      ['Tariffs (BESS+Solar+Wind)', money(outputs.tariffs)],
      ['Grand CapEx (pre-warranty)', money(outputs.grandCapexBeforeWarranty)],
      ['Grand CapEx (incl. warranty)', money(outputs.grandCapex)],
      ['Annual Savings', money(outputs.annualSavings)],
      ['ROI (years)', outputs.roiYears ? Number(outputs.roiYears).toFixed(2) : '—'],
      ['Budget Delta', (inputs.budgetKnown && typeof outputs.budgetDelta === 'number') ? money(outputs.budgetDelta) : '—'],
    ]

    // Batch insert all rows at once
    ws.addRows(rows.map(([k, v]) => ({ k, v })))

    // Style section headers efficiently
    let rowIndex = 1;
    rows.forEach(([k]) => {
      rowIndex++;
      if (typeof k === 'string' && k.startsWith('---')) {
        ws.getRow(rowIndex).font = { bold: true };
      }
    });

    const buf = await wb.xlsx.writeBuffer()
    
    const processingTime = Date.now() - startTime;
    console.log(`[server] Excel export completed in ${processingTime}ms`);

    // Optimized headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=BESS_Quote.xlsx')
    res.setHeader('Content-Length', buf.byteLength);
    res.setHeader('Cache-Control', 'no-cache');
    
    return res.send(Buffer.from(buf))
  } catch (e) {
    console.error('EXCEL EXPORT ERROR:', e)
    return res.status(500).json({ error: 'Excel export failed', details: e.message })
  }
})

// Serve React app static files and handle client-side routing in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from dist
  app.use(express.static(path.resolve(process.cwd(), 'dist')));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    // Serve React app for all other routes
    res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  console.log(`[server] Optimized API listening on http://localhost:${PORT}`)
  console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`[server] Serving static files from: ${path.resolve(process.cwd(), 'dist')}`)
})
