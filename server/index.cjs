const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')
const Docxtemplater = require('docxtemplater')
const ExcelJS = require('exceljs')

const app = express()
app.use(cors())
app.use(bodyParser.json({ limit: '5mb' }))

const money = (n) => `$${Math.round(Number(n || 0)).toLocaleString()}`
const pct = (n) => `${Math.round(Number(n || 0) * 100)}%`
const yesno = (b) => (b ? 'Yes' : 'No')

app.post('/api/export/word', async (req, res) => {
  try {
    const { inputs = {}, assumptions = {}, outputs = {} } = req.body

    const templatePath = path.join(__dirname, 'templates', 'BESS_Quote_Template.docx')
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: 'Template not found', path: templatePath })
    }
    const content = fs.readFileSync(templatePath, 'binary')
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })

    const tariffPct = (assumptions.tariffByRegion?.[inputs.locationRegion] ?? 0)
    const warrantyUplift = inputs.warrantyYears === 20 ? 0.10 : 0

    doc.setData({
      // Inputs
      POWER: inputs.powerMW,
      HOURS: inputs.standbyHours,
      VOLTAGE: inputs.voltage,
      MODE: inputs.gridMode,
      USECASE: inputs.useCase,
      CERTS: inputs.certifications,
      GENERATOR_MW: inputs.generatorMW,
      SOLAR_MWP: inputs.solarMWp,
      WIND_MW: inputs.windMW,
      UTILIZATION: inputs.utilization,
      VALUE_PER_KWH: inputs.valuePerKWh,

      WARRANTY_YEARS: inputs.warrantyYears,
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
    })

    doc.render()
    const buf = doc.getZip().generate({ type: 'nodebuffer' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', 'attachment; filename=BESS_Quote.docx')
    return res.send(buf)
  } catch (e) {
    console.error('WORD EXPORT ERROR:', e)
    return res.status(500).json({ error: 'Word export failed', details: e.message })
  }
})

app.post('/api/export/excel', async (req, res) => {
  try {
    const { inputs = {}, assumptions = {}, outputs = {} } = req.body
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('BESS Quote')

    ws.columns = [
      { header: 'Field', key: 'k', width: 34 },
      { header: 'Value', key: 'v', width: 28 },
    ]

    const tariffPct = (assumptions.tariffByRegion?.[inputs.locationRegion] ?? 0)
    const warrantyUplift = inputs.warrantyYears === 20 ? 0.10 : 0

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

    ws.addRows(rows.map(([k, v]) => ({ k, v })))

    // Style section headers
    ws.eachRow((row) => {
      const firstCell = row.getCell(1).value
      if (typeof firstCell === 'string' && firstCell.startsWith('---')) {
        row.font = { bold: true }
      }
    })

    const buf = await wb.xlsx.writeBuffer()
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=BESS_Quote.xlsx')
    return res.send(Buffer.from(buf))
  } catch (e) {
    console.error('EXCEL EXPORT ERROR:', e)
    return res.status(500).json({ error: 'Excel export failed', details: e.message })
  }
})

const PORT = 5174
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))
