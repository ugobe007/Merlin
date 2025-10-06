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

// Serve static files from the dist directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), 'dist')));
}

// Database API routes
app.use('/api/db', databaseRoutes)

// Request logging middleware
app.use((req, res, next) => {
  const origin = req.get('Origin') || req.get('Referer') || 'direct';
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path} from ${origin}`);
  next();
});

// Pre-load templates into memory with caching
const WORD_TEMPLATE_PATH = path.join(__dirname, 'templates', 'BESS_Quote_Template.docx');
let wordTemplateBuffer = null;
let wordTemplateZip = null;

function loadWordTemplate() {
  if (!wordTemplateBuffer) {
    wordTemplateBuffer = fs.readFileSync(WORD_TEMPLATE_PATH);
    console.log('[server] Loaded Word template into memory');
  }
  return wordTemplateBuffer;
}

function getWordTemplateZip() {
  if (!wordTemplateZip) {
    const buffer = loadWordTemplate();
    wordTemplateZip = new PizZip(buffer);
    console.log('[server] Pre-processed Word template ZIP');
  }
  return wordTemplateZip;
}

// Pre-load on startup
loadWordTemplate();
getWordTemplateZip();

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

app.post('/api/export/word', async (req, res) => {
  try {
    const startTime = Date.now();
    const { inputs = {}, assumptions = {}, outputs = {} } = req.body

    // Use pre-processed ZIP for faster processing
    const templateZip = getWordTemplateZip();
    
    // Clone the ZIP for thread safety without re-parsing
    const clonedZip = new PizZip(templateZip.file());
    const doc = new Docxtemplater(clonedZip, { 
      paragraphLoop: true, 
      linebreaks: true,
      nullGetter: () => '', // Handle null values gracefully
      delimiters: { start: '{', end: '}' }, // Explicit delimiters for performance
      parser: (tag) => ({ get: tag }) // Optimized parser
    })

    const tariffPct = (assumptions.tariffByRegion?.[inputs.locationRegion] ?? 0)
    const warrantyUplift = inputs.warrantyYears === 20 ? 0.10 : 0

    // Pre-computed data object for faster rendering with cached formatters
    const templateData = {
      // Inputs
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
      LOCATION_REGION: inputs.locationRegion,
      PCS_SEPARATE: yesno(inputs.pcsSeparate),
      BUDGET_KNOWN: yesno(inputs.budgetKnown),
      BUDGET_AMOUNT: inputs.budgetKnown ? money(inputs.budgetAmount || 0) : '—',

      // Assumptions (selected)
      BATTERY_PER_KWH: money(assumptions.batteryCostPerKWh),
      PCS_PER_KW: money(assumptions.pcsCostPerKW),
      BOS_PCT: pct(assumptions.bosPct),
      EPC_PCT: pct(assumptions.epcPct),
      OFFGRID_FACTOR: assumptions.offgridFactor,
      ONGRID_FACTOR: assumptions.ongridFactor,
      GEN_PER_KW: money(assumptions.genCostPerKW),
      SOLAR_PER_KWP: money(assumptions.solarCostPerKWp),
      WIND_PER_KW: money(assumptions.windCostPerKW),
      TARIFF_REGION_PCT: pct(tariffPct),

      // Outputs (money/values formatted)
      TOTAL_MWH: outputs.totalMWh?.toFixed?.(2) ?? '0.00',
      PCS_KW: Math.round(outputs.pcsKW || 0).toLocaleString(),
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
      BUDGET_DELTA: (inputs.budgetKnown && typeof outputs.budgetDelta === 'number') ? money(outputs.budgetDelta) : '—',
    };

    doc.setData(templateData);
    doc.render();
    
    const buf = doc.getZip().generate({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 3 } // Faster compression
    });

    const processingTime = Date.now() - startTime;
    console.log(`[server] Word export completed in ${processingTime}ms`);

    // Optimized headers with connection keep-alive
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=BESS_Quote.docx');
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    return res.send(buf);
  } catch (e) {
    console.error('WORD EXPORT ERROR:', e)
    return res.status(500).json({ error: 'Word export failed', details: e.message })
  }
})

app.post('/api/export/excel', async (req, res) => {
  try {
    const startTime = Date.now();
    const { inputs = {}, assumptions = {}, outputs = {} } = req.body
    
    // Create workbook with optimized settings
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Merlin BESS Quote Builder'
    wb.created = new Date()
    
    const ws = wb.addWorksheet('BESS Quote', {
      properties: { defaultColWidth: 20 }
    })

    // Pre-configure columns for better performance
    ws.columns = [
      { header: 'Field', key: 'k', width: 34 },
      { header: 'Value', key: 'v', width: 28 },
    ]

    // Pre-compute all values to avoid repeated calculations
    const tariffPct = (assumptions.tariffByRegion?.[inputs.locationRegion] ?? 0)
    const warrantyUplift = inputs.warrantyYears === 20 ? 0.10 : 0
    const budgetAmount = inputs.budgetKnown ? money(inputs.budgetAmount || 0) : '—'
    const budgetDelta = (inputs.budgetKnown && typeof outputs.budgetDelta === 'number') ? money(outputs.budgetDelta) : '—'
    const roiYears = outputs.roiYears ? Number(outputs.roiYears).toFixed(2) : '—'

    // Pre-build all rows for batch insertion (optimized data structure)
    const rows = [
      { k: '--- Inputs ---', v: '' },
      { k: 'Power (MW)', v: inputs.powerMW || '' },
      { k: 'Standby Hours', v: inputs.standbyHours || '' },
      { k: 'Voltage', v: inputs.voltage || '' },
      { k: 'Grid Mode', v: inputs.gridMode || '' },
      { k: 'Use Case', v: inputs.useCase || '' },
      { k: 'Certifications', v: inputs.certifications || '' },
      { k: 'Generator (MW)', v: inputs.generatorMW || '' },
      { k: 'Solar (MWp)', v: inputs.solarMWp || '' },
      { k: 'Wind (MW)', v: inputs.windMW || '' },
      { k: 'Utilization (0–1)', v: inputs.utilization || '' },
      { k: 'Value $/kWh', v: inputs.valuePerKWh || '' },
      { k: 'Warranty (years)', v: inputs.warrantyYears || '' },
      { k: 'Warranty Uplift', v: pct(warrantyUplift) },
      { k: 'Location (Region)', v: inputs.locationRegion || '' },
      { k: 'PCS Separate?', v: yesno(inputs.pcsSeparate) },
      { k: 'Budget Known?', v: yesno(inputs.budgetKnown) },
      { k: 'Budget (USD)', v: budgetAmount },

      { k: '', v: '' },
      { k: '--- Assumptions ---', v: '' },
      { k: 'Battery $/kWh', v: money(assumptions.batteryCostPerKWh) },
      { k: 'PCS $/kW', v: money(assumptions.pcsCostPerKW) },
      { k: 'BOS %', v: pct(assumptions.bosPct) },
      { k: 'EPC %', v: pct(assumptions.epcPct) },
      { k: 'Off-grid PCS factor', v: assumptions.offgridFactor },
      { k: 'On-grid PCS factor', v: assumptions.ongridFactor },
      { k: 'Gen $/kW', v: money(assumptions.genCostPerKW) },
      { k: 'Solar $/kWp', v: money(assumptions.solarCostPerKWp) },
      { k: 'Wind $/kW', v: money(assumptions.windCostPerKW) },
      { k: 'Tariff % (region)', v: pct(tariffPct) },

      { k: '', v: '' },
      { k: '--- Calculations ---', v: '' },
      { k: 'Total MWh', v: outputs.totalMWh },
      { k: 'PCS kW', v: Math.round(outputs.pcsKW || 0) },
      { k: 'Battery Subtotal', v: money(outputs.batterySubtotal) },
      { k: 'PCS Subtotal' + (inputs.pcsSeparate ? ' (+15%)' : ''), v: money(outputs.pcsSubtotal) },
      { k: 'BOS', v: money(outputs.bos) },
      { k: 'EPC', v: money(outputs.epc) },
      { k: 'BESS CapEx', v: money(outputs.bessCapex) },
      { k: 'Generator Subtotal', v: money(outputs.genSubtotal) },
      { k: 'Solar Subtotal', v: money(outputs.solarSubtotal) },
      { k: 'Wind Subtotal', v: money(outputs.windSubtotal) },
      { k: 'Tariffs (BESS+Solar+Wind)', v: money(outputs.tariffs) },
      { k: 'Grand CapEx (pre-warranty)', v: money(outputs.grandCapexBeforeWarranty) },
      { k: 'Grand CapEx (incl. warranty)', v: money(outputs.grandCapex) },
      { k: 'Annual Savings', v: money(outputs.annualSavings) },
      { k: 'ROI (years)', v: roiYears },
      { k: 'Budget Delta', v: budgetDelta },
    ]

    // Batch insert all rows at once (more efficient)
    ws.addRows(rows)

    // Style section headers efficiently with a single pass
    rows.forEach((row, index) => {
      if (typeof row.k === 'string' && row.k.startsWith('---')) {
        ws.getRow(index + 2).font = { bold: true };
      }
    })

    // Generate buffer with optimized compression
    const buf = await wb.xlsx.writeBuffer({
      compress: true,
      useSharedStrings: false // Faster for small files
    })
    
    const processingTime = Date.now() - startTime;
    console.log(`[server] Excel export completed in ${processingTime}ms`);

    // Optimized headers with connection keep-alive
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=BESS_Quote.xlsx');
    res.setHeader('Content-Length', buf.byteLength);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    return res.send(Buffer.from(buf));
  } catch (e) {
    console.error('EXCEL EXPORT ERROR:', e)
    return res.status(500).json({ error: 'Excel export failed', details: e.message })
  }
})

// Serve React app index.html for the root path in production
if (process.env.NODE_ENV === 'production') {
  app.get('/', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  console.log(`[server] Optimized API listening on http://localhost:${PORT}`)
  console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`)
})
