import { useEffect, useRef, useState } from 'react'
import newMerlin from '../assets/images/new_Merlin.png'
import { loadAll, saveProject, deleteProject } from '../lib/store'
import VendorManager from './VendorManager'
import DatabaseTest from './DatabaseTest'


type Region = 'US' | 'UK' | 'EU' | 'Other'

type Inputs = {
  powerMW: number
  standbyHours: number
  voltage: string
  gridMode: 'on-grid' | 'off-grid'
  useCase: string
  certifications: string
  generatorMW?: number
  solarMWp?: number
  windMW?: number
  utilization?: number
  valuePerKWh?: number
  warrantyYears: 10 | 20
  budgetKnown: boolean
  budgetAmount?: number
  locationRegion: Region
  pcsSeparate: boolean
}

type Assumptions = {
  batteryCostPerKWh: number
  pcsCostPerKW: number
  bosPct: number
  epcPct: number
  offgridFactor: number
  ongridFactor: number
  genCostPerKW: number
  solarCostPerKWp: number
  windCostPerKW: number
  tariffByRegion: Record<Region, number>
  vendorName?: string
  vendorFile?: string
  vendorDate?: string
}

type Outputs = {
  totalMWh: number
  pcsKW: number
  batterySubtotal: number
  pcsSubtotal: number
  bos: number
  epc: number
  bessCapex: number
  genSubtotal: number
  solarSubtotal: number
  windSubtotal: number
  tariffs: number
  grandCapexBeforeWarranty: number
  grandCapex: number
  annualSavings: number
  roiYears?: number
  budgetDelta?: number
}

const DEFAULT_ASSUMPTIONS: Assumptions = {
  batteryCostPerKWh: 150,
  pcsCostPerKW: 80,
  bosPct: 0.12,
  epcPct: 0.15,
  offgridFactor: 1.25,
  ongridFactor: 1.0,
  genCostPerKW: 350,
  solarCostPerKWp: 900,
  windCostPerKW: 1400,
  tariffByRegion: { US: 0.02, UK: 0.06, EU: 0.05, Other: 0.08 },
}

export default function BessQuoteBuilder() {
  const [inputs, setInputs] = useState<Inputs>(() => {
    const saved = localStorage.getItem('merlin_inputs')
    return saved ? JSON.parse(saved) : {
      powerMW: 1,
      standbyHours: 2,
      voltage: '800V',
      gridMode: 'on-grid',
      useCase: 'EV Charging Stations',
      certifications: 'UL9540A',
      generatorMW: 0,
      solarMWp: 0,
      windMW: 0,
      utilization: 0.2,
      valuePerKWh: 0.25,
      warrantyYears: 10,
      budgetKnown: false,
      budgetAmount: undefined,
      locationRegion: 'US' as Region,
      pcsSeparate: false,
    }
  })

  const [assm, setAssm] = useState<Assumptions>(() => {
    const saved = localStorage.getItem('merlin_assumptions')
    return saved ? JSON.parse(saved) : DEFAULT_ASSUMPTIONS
  })

  const [projects, setProjects] = useState(loadAll())
  const [projectName, setProjectName] = useState('My Quote')
  const [busy, setBusy] = useState<'' | 'word' | 'excel'>('')
  const [showVendorManager, setShowVendorManager] = useState(false)
  const [showDatabaseTest, setShowDatabaseTest] = useState(false)

  // persist inputs automatically
  useEffect(() => {
    localStorage.setItem('merlin_inputs', JSON.stringify(inputs))
  }, [inputs])

  const [out, setOut] = useState<Outputs>(() => calc(inputs, assm))
  const fileInputRef = useRef<HTMLInputElement>(null)

  function persistAssumptions(next: Assumptions) {
    localStorage.setItem('merlin_assumptions', JSON.stringify(next))
  }

  function calc(i: Inputs, a: Assumptions): Outputs {
    const totalMWh = i.powerMW * i.standbyHours
    const pcsKW = i.gridMode === 'off-grid'
      ? i.powerMW * 1000 * a.offgridFactor
      : i.powerMW * 1000 * a.ongridFactor

    let pcsSubtotal = pcsKW * a.pcsCostPerKW
    if (i.pcsSeparate) pcsSubtotal *= 1.15

    const batterySubtotal = totalMWh * 1000 * a.batteryCostPerKWh
    const bos = (batterySubtotal + pcsSubtotal) * a.bosPct
    const epc = (batterySubtotal + pcsSubtotal + bos) * a.epcPct
    const bessCapex = batterySubtotal + pcsSubtotal + bos + epc

    const genSubtotal = (i.generatorMW ?? 0) * 1000 * a.genCostPerKW
    const solarSubtotal = (i.solarMWp ?? 0) * a.solarCostPerKWp * 1000
    const windSubtotal = (i.windMW ?? 0) * a.windCostPerKW * 1000

    const tariffPct = a.tariffByRegion[i.locationRegion] ?? 0
    const tariffBase = bessCapex + solarSubtotal + windSubtotal
    const tariffs = tariffBase * tariffPct

    const grandCapexBeforeWarranty = bessCapex + genSubtotal + solarSubtotal + windSubtotal + tariffs
    const warrantyUplift = i.warrantyYears === 20 ? 1.10 : 1.0
    const grandCapex = grandCapexBeforeWarranty * warrantyUplift

    const annualSavings = (i.valuePerKWh ?? 0) * (i.utilization ?? 0) * (i.powerMW * 1000) * 8760
    const roiYears = annualSavings > 0 ? grandCapex / annualSavings : undefined

    const budgetDelta =
      i.budgetKnown && typeof i.budgetAmount === 'number'
        ? i.budgetAmount - grandCapex
        : undefined

    return {
      totalMWh, pcsKW, batterySubtotal, pcsSubtotal, bos, epc, bessCapex,
      genSubtotal, solarSubtotal, windSubtotal, tariffs,
      grandCapexBeforeWarranty, grandCapex, annualSavings, roiYears, budgetDelta
    }
  }

  function updateInputs<K extends keyof Inputs>(key: K, value: Inputs[K]) {
    const nextInputs = { ...inputs, [key]: value }
    setInputs(nextInputs)
    setOut(calc(nextInputs, assm))
  }

  function updateAssumption<K extends keyof Assumptions>(key: K, value: Assumptions[K]) {
    const nextAssm = { ...assm, [key]: value }
    setAssm(nextAssm)
    persistAssumptions(nextAssm)
    setOut(calc(inputs, nextAssm))
  }

  function applyOverrides(obj: any) {
    const next: Assumptions = JSON.parse(JSON.stringify(assm))
    for (const k of Object.keys(obj || {})) {
      if (k === 'tariffByRegion' && typeof obj[k] === 'object') {
        next.tariffByRegion = { ...next.tariffByRegion, ...obj[k] }
      } else if (k in next) {
        const val = obj[k]
        if (typeof (next as any)[k] === 'number') {
          const n = Number(val)
          if (!Number.isNaN(n)) (next as any)[k] = n
        } else {
          (next as any)[k] = val
        }
      }
    }
    setAssm(next)
    persistAssumptions(next)
    setOut(calc(inputs, next))
  }

  async function parseCSV(text: string, fileName: string) {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) return
    const headers = lines[0].split(',').map(h => h.trim())
    const row = lines[1].split(',').map(v => v.trim())
    const obj: any = {}
    headers.forEach((h, idx) => {
      if (!h) return
      const v = row[idx]
      if (h.startsWith('tariffByRegion.')) {
        const region = h.split('.')[1] as Region
        obj.tariffByRegion = obj.tariffByRegion || {}
        obj.tariffByRegion[region] = Number(v)
      } else {
        obj[h] = /^\d+(\.\d+)?$/.test(v) ? Number(v) : v
      }
    })
    obj.vendorName = obj.vendorName || 'Vendor CSV Import'
    obj.vendorFile = fileName
    obj.vendorDate = new Date().toLocaleString()
    applyOverrides(obj)
  }

  async function handleOverridesFile(file: File) {
    const text = await file.text()
    try {
      if (file.name.endsWith('.json')) {
        const obj = JSON.parse(text)
        obj.vendorName = obj.vendorName || 'Vendor JSON Import'
        obj.vendorFile = file.name
        obj.vendorDate = new Date().toLocaleString()
        applyOverrides(obj)
      } else if (file.name.endsWith('.csv')) {
        await parseCSV(text, file.name)
      } else {
        alert('Unsupported file type. Please upload .json or .csv')
      }
    } catch (e: any) {
      alert(`Failed to parse overrides: ${e.message}`)
    }
  }

  function handleSaveProject() {
    const snap = {
      name: projectName || `Quote ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
      inputs,
      assumptions: assm,
    }
    saveProject(snap)
    setProjects(loadAll())
  }

  function applyProject(p: any) {
    setInputs(p.inputs)
    setAssm(p.assumptions)
    localStorage.setItem('merlin_assumptions', JSON.stringify(p.assumptions))
    setOut(calc(p.inputs, p.assumptions))
  }

  const money = (n: number) => `$${Math.round(n).toLocaleString()}`
  const pct = (n: number) => `${Math.round(n * 100)}%`

  const exportToWord = async () => {
    try {
      setBusy('word')
      const payload = { inputs, assumptions: assm, outputs: out }
      
      // Determine API base URL dynamically
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5001'
        : `${window.location.protocol}//${window.location.hostname}:5001`;
      
      // Add timeout and better error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const res = await fetch(`${apiBase}/api/export/word`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`)
      }
      
      // Force download
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${projectName}_BESS_Quote.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert(error instanceof Error ? error.message : 'Failed to export document. Please try again.')
    } finally {
      setBusy('')
    }
  }

  const exportToExcel = async () => {
    try {
      setBusy('excel')
      const payload = { inputs, assumptions: assm, outputs: out }
      
      // Determine API base URL dynamically
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5001'
        : `${window.location.protocol}//${window.location.hostname}:5001`;
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const res = await fetch(`${apiBase}/api/export/excel`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Export failed: ${res.status} ${errorText}`)
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `BESS_Quote_${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Excel export error:', error)
      if (error.name === 'AbortError') {
        alert('Export timed out. Please try again.')
      } else {
        alert(`Excel export failed: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col items-center mb-4 bg-gradient-to-r from-blue-100 to-white rounded-2xl p-4 shadow-md">
        <img src={newMerlin} alt="Merlin" className="w-28 h-auto drop-shadow-lg mb-3" />
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-wide text-center">Merlin BESS Quote Builder</h1>
        <p className="text-sm text-gray-600 italic">“Magic meets energy.”</p>

        {/* Project bar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            className="border p-2 rounded"
            placeholder="Project name"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
          />
          <button className="border rounded px-3 py-2" onClick={handleSaveProject}>Save Project</button>
          <select
            className="border p-2 rounded"
            onChange={e => {
              const idx = Number(e.target.value)
              if (!Number.isNaN(idx)) applyProject(projects[idx])
            }}
          >
            <option value="">Load project…</option>
            {projects.map((p, i) => (
              <option key={p.name + p.createdAt} value={i}>
                {p.name} — {new Date(p.createdAt).toLocaleString()}
              </option>
            ))}
          </select>
          <button
            className="border rounded px-3 py-2"
            onClick={() => {
              if (!projectName) return
              deleteProject(projectName)
              setProjects(loadAll())
            }}
          >
            Delete by name
          </button>
        </div>
      </header>

      {/* Inputs Panel */}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col text-sm">Power (MW)
          <input className="border p-2 rounded" type="number" step="0.1" value={inputs.powerMW}
            onChange={e => updateInputs('powerMW', Number(e.target.value))} />
        </label>
        <label className="flex flex-col text-sm">Standby Hours
          <input className="border p-2 rounded" type="number" step="0.5" value={inputs.standbyHours}
            onChange={e => updateInputs('standbyHours', Number(e.target.value))} />
        </label>

        <label className="flex flex-col text-sm">Grid Mode
          <select className="border p-2 rounded" value={inputs.gridMode}
            onChange={e => updateInputs('gridMode', e.target.value as any)}>
            <option value="on-grid">On-grid</option>
            <option value="off-grid">Off-grid</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">Use Case
          <select className="border p-2 rounded" value={inputs.useCase}
            onChange={e => updateInputs('useCase', e.target.value)}>
            {[
              'EV Charging Stations', 'Car Washes', 'Hotels', 'Data Centers', 'Airports',
              'Solar Farms', 'Processing Plants', 'Indoor Farms', 'Casinos',
              'Colleges & Universities', 'Manufacturing', 'Logistic Hubs', 'Mining'
            ].map(u => <option key={u}>{u}</option>)}
          </select>
        </label>

        <label className="flex flex-col text-sm">Generator (MW)
          <input className="border p-2 rounded" type="number" step="0.1" value={inputs.generatorMW}
            onChange={e => updateInputs('generatorMW', Number(e.target.value))} />
        </label>
        <label className="flex flex-col text-sm">Solar (MWp)
          <input className="border p-2 rounded" type="number" step="0.1" value={inputs.solarMWp}
            onChange={e => updateInputs('solarMWp', Number(e.target.value))} />
        </label>
        <label className="flex flex-col text-sm">Wind (MW)
          <input className="border p-2 rounded" type="number" step="0.1" value={inputs.windMW}
            onChange={e => updateInputs('windMW', Number(e.target.value))} />
        </label>

        <label className="flex flex-col text-sm">Value $/kWh
          <input className="border p-2 rounded" type="number" step="0.01" value={inputs.valuePerKWh}
            onChange={e => updateInputs('valuePerKWh', Number(e.target.value))} />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <span>Utilization (0–1)</span>
          <input className="border p-2 rounded flex-1" type="number" step="0.05" value={inputs.utilization}
            onChange={e => updateInputs('utilization', Number(e.target.value))} />
        </label>

        <label className="flex flex-col text-sm">Warranty
          <select className="border p-2 rounded" value={inputs.warrantyYears}
            onChange={e => updateInputs('warrantyYears', Number(e.target.value) as 10 | 20)}>
            <option value={10}>10 years</option>
            <option value={20}>20 years (+10%)</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">Location (Tariff Region)
          <select className="border p-2 rounded" value={inputs.locationRegion}
            onChange={e => updateInputs('locationRegion', e.target.value as Region)}>
            <option value="US">US (2%)</option>
            <option value="UK">UK (6%)</option>
            <option value="EU">EU (5%)</option>
            <option value="Other">Other (8%)</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4"
            checked={inputs.pcsSeparate}
            onChange={e => updateInputs('pcsSeparate', e.target.checked)} />
          <span>PCS separate? (+15% PCS)</span>
        </label>

        <div className="col-span-2 border rounded p-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4"
              checked={inputs.budgetKnown}
              onChange={e => updateInputs('budgetKnown', e.target.checked)} />
            <span>Budget known?</span>
          </label>
          {inputs.budgetKnown && (
            <div className="mt-2">
              <label className="flex items-center gap-2 text-sm">Budget (USD)
                <input className="border p-2 rounded flex-1" type="number" step="1000"
                  value={inputs.budgetAmount ?? 0}
                  onChange={e => updateInputs('budgetAmount', Number(e.target.value))} />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Assumptions Panel */}
      <div className="border rounded p-4 space-y-3">
        <div className="font-semibold text-lg">Assumptions (editable / import overrides)</div>

        {assm.vendorName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500 flex-shrink-0"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M12 9v2m0 4v2m9-7a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium">Vendor Data Applied</p>
              <p className="italic">
                Using vendor data from <strong>{assm.vendorName}</strong>
                {assm.vendorFile && <> ({assm.vendorFile})</>} — uploaded {assm.vendorDate}.
              </p>
            </div>
          </div>
        )}

        <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <AssumptionNumber label="Battery $/kWh" value={assm.batteryCostPerKWh} onChange={v => updateAssumption('batteryCostPerKWh', v)} />
            <AssumptionNumber label="PCS $/kW" value={assm.pcsCostPerKW} onChange={v => updateAssumption('pcsCostPerKW', v)} />
            <AssumptionNumber label="BOS %" value={assm.bosPct} step={0.01} onChange={v => updateAssumption('bosPct', v)} />
            <AssumptionNumber label="EPC %" value={assm.epcPct} step={0.01} onChange={v => updateAssumption('epcPct', v)} />
            <AssumptionNumber label="Off-grid PCS factor" value={assm.offgridFactor} step={0.01} onChange={v => updateAssumption('offgridFactor', v)} />
            <AssumptionNumber label="On-grid PCS factor" value={assm.ongridFactor} step={0.01} onChange={v => updateAssumption('ongridFactor', v)} />
            <AssumptionNumber label="Gen $/kW" value={assm.genCostPerKW} onChange={v => updateAssumption('genCostPerKW', v)} />
            <AssumptionNumber label="Solar $/kWp" value={assm.solarCostPerKWp} onChange={v => updateAssumption('solarCostPerKWp', v)} />
            <AssumptionNumber label="Wind $/kW" value={assm.windCostPerKW} onChange={v => updateAssumption('windCostPerKW', v)} />
            <AssumptionNumber label="Tariff US %" value={assm.tariffByRegion.US} step={0.01}
              onChange={(v) => updateAssumption('tariffByRegion', { ...assm.tariffByRegion, US: v } as any)} />
            <AssumptionNumber label="Tariff UK %" value={assm.tariffByRegion.UK} step={0.01}
              onChange={(v) => updateAssumption('tariffByRegion', { ...assm.tariffByRegion, UK: v } as any)} />
            <AssumptionNumber label="Tariff EU %" value={assm.tariffByRegion.EU} step={0.01}
              onChange={(v) => updateAssumption('tariffByRegion', { ...assm.tariffByRegion, EU: v } as any)} />
            <AssumptionNumber label="Tariff Other %" value={assm.tariffByRegion.Other} step={0.01}
              onChange={(v) => updateAssumption('tariffByRegion', { ...assm.tariffByRegion, Other: v } as any)} />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button className="px-3 py-2 border rounded" onClick={() => fileInputRef.current?.click()}>
              Upload Vendor Quote (.json / .csv)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleOverridesFile(f).finally(() => { if (fileInputRef.current) fileInputRef.current.value = '' })
              }}
            />
            <button
              className="px-3 py-2 border rounded"
              onClick={() => {
                const template = {
                  batteryCostPerKWh: assm.batteryCostPerKWh,
                  pcsCostPerKW: assm.pcsCostPerKW,
                  bosPct: assm.bosPct,
                  epcPct: assm.epcPct,
                  offgridFactor: assm.offgridFactor,
                  ongridFactor: assm.ongridFactor,
                  genCostPerKW: assm.genCostPerKW,
                  solarCostPerKWp: assm.solarCostPerKWp,
                  windCostPerKW: assm.windCostPerKW,
                  tariffByRegion: assm.tariffByRegion,
                }
                const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'assumptions_template.json'
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              Download JSON Template
            </button>
            <button
              className="px-3 py-2 border rounded"
              onClick={() => {
                setAssm(DEFAULT_ASSUMPTIONS)
                localStorage.setItem('merlin_assumptions', JSON.stringify(DEFAULT_ASSUMPTIONS))
                setOut(calc(inputs, DEFAULT_ASSUMPTIONS))
              }}
            >
              Reset to Defaults
            </button>
          </div>
        </>
      </div>

      {/* Outputs */}
      <div className="border rounded p-4 text-sm space-y-1">
        <div>Total MWh: <strong>{out.totalMWh.toFixed(2)}</strong></div>
        <div>PCS kW: <strong>{Math.round(out.pcsKW).toLocaleString()}</strong></div>

        <div className="mt-2 font-semibold">Subtotals</div>
        <div>Battery Subtotal: <strong>{money(out.batterySubtotal)}</strong></div>
        <div>PCS Subtotal{inputs.pcsSeparate ? ' (+15%)' : ''}: <strong>{money(out.pcsSubtotal)}</strong></div>
        <div>BOS: <strong>{money(out.bos)}</strong></div>
        <div>EPC: <strong>{money(out.epc)}</strong></div>
        <div>BESS CapEx: <strong>{money(out.bessCapex)}</strong></div>
        <div>Generator Subtotal: <strong>{money(out.genSubtotal)}</strong></div>
        <div>Solar Subtotal: <strong>{money(out.solarSubtotal)}</strong></div>
        <div>Wind Subtotal: <strong>{money(out.windSubtotal)}</strong></div>
        <div>Tariffs ({pct(assm.tariffByRegion[inputs.locationRegion])} on BESS+Solar+Wind): <strong>{money(out.tariffs)}</strong></div>

        <div className="mt-2">Grand CapEx (pre-warranty): <strong>{money(out.grandCapexBeforeWarranty)}</strong></div>
        <div>Grand CapEx (incl. warranty {inputs.warrantyYears}y{inputs.warrantyYears === 20 ? ' +10%' : ''}): <strong>{money(out.grandCapex)}</strong></div>

        <div className="mt-2">Annual Savings: <strong>{money(out.annualSavings)}</strong></div>
        <div>ROI (years): <strong>{out.roiYears ? out.roiYears.toFixed(2) : '—'}</strong></div>
        {'budgetDelta' in out && inputs.budgetKnown && typeof out.budgetDelta === 'number' && (
          <div>Budget Delta: <strong className={out.budgetDelta >= 0 ? 'text-green-600' : 'text-red-600'}>
            {money(out.budgetDelta)}
          </strong></div>
        )}
      </div>

      {/* Export */}
      <div className="flex gap-3">
        <button 
          className="px-4 py-2 rounded border bg-green-600 text-white hover:bg-green-700"
          onClick={() => setShowVendorManager(true)}
        >
          Vendor Manager
        </button>
        <button 
          className="px-4 py-2 rounded border bg-purple-600 text-white hover:bg-purple-700"
          onClick={() => setShowDatabaseTest(true)}
        >
          Database Test
        </button>
        <button className="px-4 py-2 rounded border disabled:opacity-60" disabled={busy==='word'} onClick={exportToWord}>
          {busy==='word' ? 'Exporting…' : 'Export Word'}
        </button>
        <button className="px-4 py-2 rounded border disabled:opacity-60" disabled={busy==='excel'} onClick={exportToExcel}>
          {busy==='excel' ? 'Exporting…' : 'Export Excel'}
        </button>
      </div>

      <p className="text-xs text-neutral-500">
        Import vendor quotes as JSON or CSV to override assumptions. Values persist in your browser.
      </p>

      {/* Vendor Manager Modal */}
      <VendorManager 
        isOpen={showVendorManager}
        onClose={() => setShowVendorManager(false)}
      />

      {/* Database Test Modal */}
      <DatabaseTest 
        isOpen={showDatabaseTest}
        onClose={() => setShowDatabaseTest(false)}
      />
    </div>
  )
}

function AssumptionNumber({
  label, value, onChange, step = 1,
}: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-sm">{label}</span>
      <input
        className="border p-2 rounded w-40 text-right"
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </label>
  )
}
