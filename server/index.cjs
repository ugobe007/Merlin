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
const { router: authRoutes } = require('./routes/auth.cjs')

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

// Serve React app static files
const staticPath = path.resolve(process.cwd(), 'dist');
console.log(`[server] Static files path: ${staticPath}`);
console.log(`[server] Static files exist: ${fs.existsSync(staticPath)}`);

// Always serve static files when dist exists
if (fs.existsSync(staticPath)) {
  // Serve static files from dist
  app.use(express.static(staticPath));
  console.log(`[server] Serving static files from: ${staticPath}`);
}

// Initialize database
const QuoteDatabase = require('./database.cjs')
const db = new QuoteDatabase()

// Add database instance to request object
app.use((req, res, next) => {
  req.db = db
  next()
})

// Authentication API routes
app.use('/api/auth', authRoutes)

// Database API routes  
app.use('/api/db', databaseRoutes)

// Request logging middleware
app.use((req, res, next) => {
  const origin = req.get('Origin') || req.get('Referer') || 'direct';
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path} from ${origin}`);
  next();
});

// Pre-load templates into memory
const WORD_TEMPLATE_PATH = path.join(__dirname, 'templates', 'BESS_Quote_Template_Enhanced.docx');
let wordTemplateBuffer = null;

function loadWordTemplate() {
  if (!wordTemplateBuffer) {
    if (!fs.existsSync(WORD_TEMPLATE_PATH)) {
      console.error(`[server] CRITICAL: Template file not found at ${WORD_TEMPLATE_PATH}`);
      console.error(`[server] Working directory: ${process.cwd()}`);
      console.error(`[server] Server directory: ${__dirname}`);
      console.error(`[server] Available files in server directory:`, fs.readdirSync(__dirname));
      if (fs.existsSync(path.join(__dirname, 'templates'))) {
        console.error(`[server] Files in templates directory:`, fs.readdirSync(path.join(__dirname, 'templates')));
      } else {
        console.error(`[server] Templates directory does not exist!`);
      }
      throw new Error(`Template file not found at ${WORD_TEMPLATE_PATH}`);
    }
    try {
      wordTemplateBuffer = fs.readFileSync(WORD_TEMPLATE_PATH);
      console.log('[server] Loaded Word template into memory');
    } catch (error) {
      console.error('[server] Failed to read template file:', error.message);
      throw error;
    }
  }
  return wordTemplateBuffer;
}

// Pre-load on startup
try {
  loadWordTemplate();
} catch (error) {
  console.error('[server] Warning: Could not pre-load template on startup:', error.message);
  console.error('[server] Template will be loaded on first use');
}

const money = (n) => `$${Math.round(Number(n || 0)).toLocaleString()}`
const pct = (n) => `${Math.round(Number(n || 0) * 100)}%`
const yesno = (b) => (b ? 'Yes' : 'No')

// Health check endpoint
app.get('/api/health', (req, res) => {
  const origin = req.get('Origin') || req.get('Referer') || 'direct';
  const memUsage = process.memoryUsage();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    templatesLoaded: !!wordTemplateBuffer,
    requestOrigin: origin,
    serverPort: process.env.PORT || 5000,
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    },
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

// Simple test endpoint to verify connectivity
app.post('/api/test', (req, res) => {
  console.log('[test] Test endpoint called');
  console.log('[test] Request body:', req.body);
  res.json({ 
    success: true, 
    message: 'Backend is working!', 
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/export/word', async (req, res) => {
  console.time('export:word:total');
  try {
    console.log('[export:word] Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('[export:word] Request body type:', typeof req.body);
    console.log('[export:word] Request body keys:', Object.keys(req.body || {}));
    
    const { inputs = {}, assumptions = {}, outputs = {} } = req.body;
    
    console.log('[export:word] Received data:');
    console.log('- Inputs:', JSON.stringify(inputs, null, 2));
    console.log('- Assumptions:', JSON.stringify(assumptions, null, 2));
    console.log('- Outputs:', JSON.stringify(outputs, null, 2));

    console.time('export:word:preprocess');
    // Pre-compute all data once (recommended optimization)
    const tariffPct = (assumptions.tariffByRegion?.[inputs.locationRegion] ?? 0);
    const warrantyUplift = inputs.warrantyYears === 20 ? 0.10 : 0;
    
    // Pre-converted template data for faster rendering
    const templateData = {
      PROJECT_NAME: String(inputs.projectName || 'BESS Quote'),
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
      BUDGET_DELTA: (inputs.budgetKnown && typeof outputs.budgetDelta === 'number') ? money(outputs.budgetDelta) : '—',
      
      // Additional fields for enhanced template
      CLIENT_NAME: String(inputs.clientName || 'Client Name'),
      QUOTE_DATE: new Date().toLocaleDateString(),
      SYSTEM_COST: money(outputs.bessCapex || 0),
      INSTALLATION_COST: money(outputs.epc || 0),
      TOTAL_COST: money(outputs.grandCapex || 0),
      
      // Enhanced template specific fields
      LOCATION_REGION: String(inputs.locationRegion || 'United States'),
      SOLAR_MWP: String(inputs.solarMWp || '0'),
      GENERATOR_MW: String(inputs.generatorMW || '0'),
      CERTIFICATIONS: String(inputs.certifications || 'UL9540A, IEEE 1547'),
      WARRANTY_YEARS: String(inputs.warrantyYears || '10'),
      UTILIZATION: String(Math.round((inputs.utilization || 0.2) * 100))
    };
    console.timeEnd('export:word:preprocess');
    console.log('[export:word] Template data prepared, field count:', Object.keys(templateData).length);
    console.log('[export:word] Template data sample:', {
      PROJECT_NAME: templateData.PROJECT_NAME,
      SYSTEM_SIZE_KW: templateData.SYSTEM_SIZE_KW,
      TOTAL_COST: templateData.TOTAL_COST,
      GRAND_CAPEX: templateData.GRAND_CAPEX,
      '...': 'and more fields'
    });

    console.time('export:word:template');
    // Check if template exists and load it
    let templateBuffer;
    try {
      if (!fs.existsSync(WORD_TEMPLATE_PATH)) {
        throw new Error(`Template file not found at ${WORD_TEMPLATE_PATH}`);
      }
      templateBuffer = loadWordTemplate();
    } catch (error) {
      console.error('[export:word] Template loading failed:', error.message);
      return res.status(500).json({ 
        error: 'Template loading failed', 
        details: error.message 
      });
    }
    console.log('[export:word] Template buffer loaded, size:', templateBuffer.length, 'bytes');
    
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, { 
      paragraphLoop: true, 
      linebreaks: true,
      nullGetter: () => '',
      delimiters: { start: '{', end: '}' }
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
    
    // Handle Docxtemplater multi errors specifically
    if (error.name === 'TemplateError' || error.message === 'Multi error') {
      console.error('[export:word] Template errors:', error.properties);
      if (error.properties && error.properties.errors) {
        error.properties.errors.forEach((err, index) => {
          console.error(`[export:word] Error ${index + 1}:`, {
            message: err.message,
            name: err.name,
            part: err.properties?.part,
            id: err.properties?.id,
            explanation: err.properties?.explanation
          });
        });
      }
    }
    
    console.timeEnd('export:word:total');
    
    // Return detailed error for debugging
    res.status(500).json({ 
      error: 'Export failed', 
      details: error.message,
      templatePath: WORD_TEMPLATE_PATH,
      templateExists: fs.existsSync(WORD_TEMPLATE_PATH),
      environment: process.env.NODE_ENV || 'development',
      templateErrors: error.properties && error.properties.errors ? error.properties.errors : null
    });
  }
});

app.post('/api/export/excel', async (req, res) => {
  try {
    const startTime = Date.now();
    const { inputs = {}, assumptions = {}, outputs = {} } = req.body
    
    console.log('[export:excel] Received data:');
    console.log('- Inputs:', JSON.stringify(inputs, null, 2));
    console.log('- Assumptions:', JSON.stringify(assumptions, null, 2));
    console.log('- Outputs:', JSON.stringify(outputs, null, 2));
    
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

// Handle client-side routing - serve index.html for all non-API routes
if (fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
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
const HOST = process.env.HOST || '0.0.0.0'

console.log(`[server] Starting server...`)
console.log(`[server] PORT: ${PORT}`)
console.log(`[server] HOST: ${HOST}`)
console.log(`[server] NODE_ENV: ${process.env.NODE_ENV || 'development'}`)

app.listen(PORT, HOST, () => {
  console.log(`[server] ✅ Optimized API listening on http://${HOST}:${PORT}`)
  console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`[server] Serving static files from: ${path.resolve(process.cwd(), 'dist')}`)
  console.log(`[server] 🚀 Server ready for connections`)
}).on('error', (err) => {
  console.error(`[server] ❌ Failed to start server:`, err)
  process.exit(1)
})

// Error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('[server] Uncaught Exception:', error.message);
  console.error('[server] Stack:', error.stack);
  // Don't exit in development, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[server] Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in development, just log the error
});
