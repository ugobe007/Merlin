import { useEffect, useRef, useState } from 'react'
import newMerlin from '../assets/images/new_Merlin.png'
import { loadAll, saveProject } from '../lib/store'
import VendorManager from './VendorManager'
import DatabaseTest from './DatabaseTest'
import UserProfile from './UserProfile'
import { parseVendorQuoteFile } from '../utils/fileParser'
import { playMagicWandSound } from '../utils/magicSound'


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
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showLoadProject, setShowLoadProject] = useState(false)
  const [currentPrice, setCurrentPrice] = useState<number | null>(0.12)
  const [magicalExport, setMagicalExport] = useState(false)
  const [showSmartWizard, setShowSmartWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [wizardData, setWizardData] = useState({
    application: '',
    budgetRange: '',
    powerNeeds: '',
    powerMW: 1,
    location: 'US' as Region,
    hasExistingPower: false,
    existingPowerType: '',
    timeframe: '',
    primaryGoal: '',
    equipmentNeeded: {
      bess: true,
      powerGeneration: false,
      solar: false,
      wind: false,
      grid: true
    },
    gridConnection: 'behind' // 'front' or 'behind'
  })

  // persist inputs automatically
  useEffect(() => {
    localStorage.setItem('merlin_inputs', JSON.stringify(inputs))
  }, [inputs])

    // Set default price
  useEffect(() => {
    setCurrentPrice(0.12) // $0.12/kWh default
  }, [])

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

  // Smart Wizard Logic
  function generateSmartConfiguration() {
    const { application, budgetRange, powerMW, location, equipmentNeeded, gridConnection } = wizardData
    
    // Initialize configuration based on application type and user inputs
    let config: Partial<Inputs> = {
      locationRegion: location,
      gridMode: gridConnection === 'behind' ? 'on-grid' : 'off-grid',
      powerMW: powerMW // Use the exact power specified by user
    }

    // Determine specific settings based on application
    switch (application) {
      case 'EV Charging':
        config = {
          ...config,
          standbyHours: 4,
          useCase: 'EV Charging Stations',
          utilization: 0.6,
          valuePerKWh: 0.35
        }
        break
      
      case 'Industrial Backup':
        config = {
          ...config,
          standbyHours: 8,
          useCase: 'Industrial Backup',
          utilization: 0.1,
          valuePerKWh: 0.5
        }
        break

      case 'Grid Stabilization':
        config = {
          ...config,
          standbyHours: 2,
          useCase: 'Grid Stabilization',
          utilization: 0.3,
          valuePerKWh: 0.25
        }
        break

      case 'Renewable Integration':
        config = {
          ...config,
          standbyHours: 6,
          useCase: 'Renewable Integration',
          utilization: 0.4,
          valuePerKWh: 0.2
        }
        break

      case 'Peak Shaving':
        config = {
          ...config,
          standbyHours: 3,
          useCase: 'Peak Shaving',
          utilization: 0.5,
          valuePerKWh: 0.4
        }
        break

      default:
        config = {
          ...config,
          standbyHours: 4,
          useCase: 'General Purpose',
          utilization: 0.3,
          valuePerKWh: 0.25
        }
    }

    // Configure additional equipment based on selections
    if (equipmentNeeded.solar) {
      config.solarMWp = powerMW * 1.5 // Oversized solar for battery charging
    }
    
    if (equipmentNeeded.wind) {
      config.windMW = powerMW * 1.2
    }
    
    if (equipmentNeeded.powerGeneration) {
      config.generatorMW = powerMW * 0.8 // Backup generator
    }

    // Adjust grid mode if grid equipment not selected
    if (!equipmentNeeded.grid) {
      config.gridMode = 'off-grid'
    }

    // Set budget if specified
    if (budgetRange !== 'flexible') {
      config.budgetKnown = true
      switch (budgetRange) {
        case 'under500k':
          config.budgetAmount = 400000
          break
        case '500k-2m':
          config.budgetAmount = 1500000
          break
        case '2m-10m':
          config.budgetAmount = 6000000
          break
        case '10m+':
          config.budgetAmount = 15000000
          break
      }
    }

    // Apply configuration
    const nextInputs = { ...inputs, ...config }
    setInputs(nextInputs)
    setOut(calc(nextInputs, assm))
    
    // Set project name based on configuration
    setProjectName(`${application} - ${config.powerMW}MW System`)
    
    // Close wizard
    setShowSmartWizard(false)
    setWizardStep(1)
    
    // Play magic sound and show feedback
    playMagicWandSound()
    setMagicalExport(true)
    setTimeout(() => setMagicalExport(false), 2000)
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

  async function handleOverridesFile(file: File) {
    try {
      const parsed = await parseVendorQuoteFile(file);
      
      // Create override object from parsed data
      const overrides: any = {
        vendorName: parsed.vendorName,
        vendorFile: parsed.vendorFile,
        vendorDate: parsed.vendorDate,
        originalFormat: parsed.originalFormat,
        extractedData: parsed.extractedData
      };
      
      // Try to map extracted data to our assumptions if possible
      const extracted = parsed.extractedData;
      if (extracted) {
        // Look for common pricing fields and map them
        Object.keys(extracted).forEach(key => {
          const lowerKey = key.toLowerCase();
          const value = extracted[key];
          
          // Try to extract numeric values from strings
          const numMatch = String(value).match(/[\d,]+\.?\d*/);
          const numValue = numMatch ? parseFloat(numMatch[0].replace(/,/g, '')) : null;
          
          if (lowerKey.includes('battery') && lowerKey.includes('kwh') && numValue) {
            overrides.batteryCostPerKWh = numValue;
          } else if (lowerKey.includes('pcs') && lowerKey.includes('kw') && numValue) {
            overrides.pcsCostPerKW = numValue;
          } else if (lowerKey.includes('bos') && numValue) {
            overrides.bosCostPerKWh = numValue;
          } else if (lowerKey.includes('epc') && numValue) {
            overrides.epcCostPerKWh = numValue;
          }
        });
      }
      
      applyOverrides(overrides);
      
      // Show success message with file format
      alert(`Successfully imported ${parsed.originalFormat.toUpperCase()} file: ${file.name}\n\nExtracted ${Object.keys(parsed.extractedData).length} data fields for analysis.`);
      
    } catch (error: any) {
      alert(`Failed to parse file: ${error.message}\n\nSupported formats: Excel (.xlsx), Word (.docx), PDF (.pdf)`);
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
      
      // Ensure calculations are up to date
      const currentOut = calc(inputs, assm);
      setOut(currentOut);
      
      // Ensure all values are properly formatted
      const safeOutputs = {
        ...currentOut,
        totalMWh: Number(currentOut.totalMWh) || 0,
        pcsKW: Number(currentOut.pcsKW) || 0,
        batterySubtotal: Number(currentOut.batterySubtotal) || 0,
        pcsSubtotal: Number(currentOut.pcsSubtotal) || 0,
        bos: Number(currentOut.bos) || 0,
        epc: Number(currentOut.epc) || 0,
        bessCapex: Number(currentOut.bessCapex) || 0,
        genSubtotal: Number(currentOut.genSubtotal) || 0,
        solarSubtotal: Number(currentOut.solarSubtotal) || 0,
        windSubtotal: Number(currentOut.windSubtotal) || 0,
        tariffs: Number(currentOut.tariffs) || 0,
        grandCapexBeforeWarranty: Number(currentOut.grandCapexBeforeWarranty) || 0,
        grandCapex: Number(currentOut.grandCapex) || 0,
        annualSavings: Number(currentOut.annualSavings) || 0,
        totalCost: Number(currentOut.grandCapex) || 0
      };
      
      const payload = { 
        inputs: { ...inputs, projectName }, 
        assumptions: assm, 
        outputs: safeOutputs 
      }
      
      console.log('Export Word payload:', payload); // Debug log
      console.log('Outputs calculated:', currentOut); // Debug log
      console.log('Inputs being sent:', inputs); // Debug log
      console.log('Assumptions being sent:', assm); // Debug log
      
      // Determine API base URL dynamically
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5001'
        : '';
      
      console.log('API Base URL:', apiBase);
      console.log('Current hostname:', window.location.hostname);
      console.log('Full API URL:', `${apiBase}/api/export/word`);
      
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
      
      // Play magic wand sound on successful export
      playMagicWandSound()
      
      // Show magical export notification
      setMagicalExport(true)
      setTimeout(() => setMagicalExport(false), 2000)
      
    } catch (error) {
      console.error('Export error:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`)
    } finally {
      setBusy('')
    }
  }

  const exportToExcel = async () => {
    try {
      setBusy('excel')
      
      // Ensure calculations are up to date
      const currentOut = calc(inputs, assm);
      setOut(currentOut);
      
      // Ensure all values are properly formatted
      const safeOutputs = {
        ...currentOut,
        totalMWh: Number(currentOut.totalMWh) || 0,
        pcsKW: Number(currentOut.pcsKW) || 0,
        batterySubtotal: Number(currentOut.batterySubtotal) || 0,
        pcsSubtotal: Number(currentOut.pcsSubtotal) || 0,
        bos: Number(currentOut.bos) || 0,
        epc: Number(currentOut.epc) || 0,
        bessCapex: Number(currentOut.bessCapex) || 0,
        genSubtotal: Number(currentOut.genSubtotal) || 0,
        solarSubtotal: Number(currentOut.solarSubtotal) || 0,
        windSubtotal: Number(currentOut.windSubtotal) || 0,
        tariffs: Number(currentOut.tariffs) || 0,
        grandCapexBeforeWarranty: Number(currentOut.grandCapexBeforeWarranty) || 0,
        grandCapex: Number(currentOut.grandCapex) || 0,
        annualSavings: Number(currentOut.annualSavings) || 0,
        totalCost: Number(currentOut.grandCapex) || 0
      };
      
      const payload = { 
        inputs: { ...inputs, projectName }, 
        assumptions: assm, 
        outputs: safeOutputs 
      }
      
      console.log('Export Excel payload:', payload); // Debug log
      console.log('Outputs calculated:', currentOut); // Debug log
      console.log('Inputs being sent:', inputs); // Debug log
      console.log('Assumptions being sent:', assm); // Debug log
      
      // Determine API base URL dynamically
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5001'
        : '';
      
      console.log('Excel API Base URL:', apiBase);
      console.log('Excel Full API URL:', `${apiBase}/api/export/excel`);
      
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
      
      // Play magic wand sound on successful export
      playMagicWandSound()
      
      // Show magical export notification
      setMagicalExport(true)
      setTimeout(() => setMagicalExport(false), 2000)
      
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
      {/* Top Bar with User Profile and Price */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <button 
            className="px-4 py-2 rounded-lg bg-purple-200 text-purple-700 hover:bg-purple-300 transition-colors font-medium"
            onClick={() => setShowUserProfile(true)}
          >
            👤 User Profile
          </button>
          <button 
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 transition-all font-bold shadow-lg transform hover:scale-105"
            style={{ 
              color: '#FDE047', 
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
            onClick={() => setShowSmartWizard(true)}
          >
            🪄 Smart Wizard
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Current kWh Price:</span>
          <a 
            href="https://hourlypricing.comed.com/live-prices/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-bold text-lg hover:underline"
            style={{ color: '#1e3a8a' }}
          >
            ${(currentPrice || 0.12).toFixed(4)}/kWh
          </a>
        </div>
      </div>

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
          <button 
            className="border rounded px-3 py-2 bg-blue-50 hover:bg-blue-100" 
            onClick={async () => {
              const token = localStorage.getItem('auth_token');
              if (!token) {
                alert('Please sign in to save quotes');
                setShowUserProfile(true);
                return;
              }

              try {
                const API_BASE = process.env.NODE_ENV === 'development' 
                  ? 'http://localhost:5001'
                  : '';

                const response = await fetch(`${API_BASE}/api/auth/quotes`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    project_name: projectName || `Quote ${new Date().toLocaleString()}`,
                    inputs,
                    assumptions: assm,
                    outputs: out
                  })
                });

                if (response.ok) {
                  alert('Quote saved to your profile!');
                } else {
                  const error = await response.json();
                  alert(`Failed to save quote: ${error.error || 'Unknown error'}`);
                }
              } catch (error) {
                alert('Failed to save quote. Please try again.');
              }
            }}
          >
            Save to Profile
          </button>
          <button 
            className="border rounded px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800"
            onClick={() => setShowLoadProject(true)}
          >
            Load Project
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
              Upload Vendor Quote (Excel/Word/PDF)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.docx,.doc,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleOverridesFile(f).finally(() => { if (fileInputRef.current) fileInputRef.current.value = '' })
              }}
            />
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
        <button 
          className="px-4 py-2 rounded border bg-green-600 text-white hover:bg-green-700"
          onClick={async () => {
            try {
              const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '';
              console.log('Testing connectivity to:', `${apiBase}/api/test`);
              const response = await fetch(`${apiBase}/api/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: 'connectivity check', timestamp: new Date().toISOString() })
              });
              const result = await response.json();
              console.log('Test result:', result);
              alert(`✅ Backend connection successful!\n${result.message}`);
            } catch (error) {
              console.error('Connectivity test failed:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              alert(`❌ Backend connection failed: ${errorMessage}`);
            }
          }}
        >
          🔗 Test Backend
        </button>
        <button className="px-4 py-2 rounded border disabled:opacity-60" disabled={busy==='word'} onClick={exportToWord}>
          {busy==='word' ? '🪄 Exporting…' : '🪄 Export Word'}
        </button>
        <button className="px-4 py-2 rounded border disabled:opacity-60" disabled={busy==='excel'} onClick={exportToExcel}>
          {busy==='excel' ? '🪄 Exporting…' : '🪄 Export Excel'}
        </button>
      </div>

      {/* Magical Export Notification */}
      {magicalExport && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-8 py-4 rounded-lg shadow-lg z-50 animate-pulse">
          <div className="text-center">
            <div className="text-4xl mb-2">✨🪄✨</div>
            <div className="text-lg font-bold">Magic Export Complete!</div>
            <div className="text-sm">Your quote has been enchanted and exported</div>
          </div>
        </div>
      )}

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

      {/* User Profile Modal */}
      <UserProfile 
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        onLoadQuote={(quote) => {
          setProjectName(quote.project_name);
          setInputs(quote.inputs);
          setAssm(quote.assumptions);
          setShowUserProfile(false);
          alert(`Loaded quote: ${quote.project_name}`);
        }}
      />

      {/* Smart Wizard Modal */}
      {showSmartWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                🪄 Smart BESS Wizard
              </h2>
              <button 
                className="text-gray-500 hover:text-gray-700 text-2xl"
                onClick={() => {setShowSmartWizard(false); setWizardStep(1)}}
              >
                ×
              </button>
            </div>

            {wizardStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Power Requirements & Equipment Selection
                  </h3>
                  <p className="text-gray-600">
                    Tell us about your power needs and what equipment you require.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Power Requirements */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3">Power Requirements</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          How much power do you need? (MW)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          className="w-full p-3 border border-gray-300 rounded-lg"
                          value={wizardData.powerMW}
                          onChange={(e) => setWizardData({...wizardData, powerMW: parseFloat(e.target.value) || 1})}
                          placeholder="e.g., 2.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Grid Connection
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gridConnection"
                              checked={wizardData.gridConnection === 'behind'}
                              onChange={() => setWizardData({...wizardData, gridConnection: 'behind'})}
                              className="mr-2"
                            />
                            <span className="text-sm">Behind the meter</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gridConnection"
                              checked={wizardData.gridConnection === 'front'}
                              onChange={() => setWizardData({...wizardData, gridConnection: 'front'})}
                              className="mr-2"
                            />
                            <span className="text-sm">Front of meter</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Equipment Selection */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3">Equipment Selection</h4>
                    <p className="text-sm text-green-700 mb-3">Select all equipment you need for your project:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'bess', label: 'BESS (Battery Energy Storage)', icon: '🔋', desc: 'Core battery system' },
                        { key: 'powerGeneration', label: 'Power Generation', icon: '⚡', desc: 'Diesel/gas generators' },
                        { key: 'solar', label: 'Solar Panels', icon: '☀️', desc: 'Photovoltaic systems' },
                        { key: 'wind', label: 'Wind Turbines', icon: '�', desc: 'Wind power generation' },
                        { key: 'grid', label: 'Grid Connection', icon: '🔌', desc: 'Utility grid integration' }
                      ].map((equipment) => (
                        <button
                          key={equipment.key}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            wizardData.equipmentNeeded[equipment.key as keyof typeof wizardData.equipmentNeeded]
                              ? 'border-green-500 bg-green-100 text-green-800'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                          onClick={() => setWizardData({
                            ...wizardData, 
                            equipmentNeeded: {
                              ...wizardData.equipmentNeeded,
                              [equipment.key]: !wizardData.equipmentNeeded[equipment.key as keyof typeof wizardData.equipmentNeeded]
                            }
                          })}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{equipment.icon}</span>
                            <div>
                              <div className="font-medium text-sm">{equipment.label}</div>
                              <div className="text-xs text-gray-600">{equipment.desc}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Application Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's your primary application?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'EV Charging', icon: '🔌', desc: 'Electric vehicle charging stations' },
                        { value: 'Industrial Backup', icon: '🏭', desc: 'Emergency power for facilities' },
                        { value: 'Grid Stabilization', icon: '⚡', desc: 'Grid frequency regulation' },
                        { value: 'Renewable Integration', icon: '🌱', desc: 'Solar/wind energy storage' },
                        { value: 'Peak Shaving', icon: '📈', desc: 'Reduce peak demand charges' },
                        { value: 'Other', icon: '❓', desc: 'Custom application' }
                      ].map((app) => (
                        <button
                          key={app.value}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            wizardData.application === app.value
                              ? 'border-purple-500 bg-purple-50 text-purple-800'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setWizardData({...wizardData, application: app.value})}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{app.icon}</span>
                            <div>
                              <div className="font-medium">{app.value}</div>
                              <div className="text-sm text-gray-600">{app.desc}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                      style={{ color: '#FDE047', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                      disabled={!wizardData.application || !wizardData.equipmentNeeded.bess}
                      onClick={() => setWizardStep(2)}
                    >
                      Next Step →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Budget & System Requirements
                  </h3>
                  <p className="text-gray-600">
                    Help us understand your budget and system sizing needs.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's your approximate budget range?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'under500k', label: 'Under $500K', desc: 'Small commercial' },
                        { value: '500k-2m', label: '$500K - $2M', desc: 'Medium commercial' },
                        { value: '2m-10m', label: '$2M - $10M', desc: 'Large commercial' },
                        { value: '10m+', label: '$10M+', desc: 'Utility scale' },
                        { value: 'flexible', label: 'Flexible', desc: 'Show me options' }
                      ].map((budget) => (
                        <button
                          key={budget.value}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            wizardData.budgetRange === budget.value
                              ? 'border-purple-500 bg-purple-50 text-purple-800'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setWizardData({...wizardData, budgetRange: budget.value})}
                        >
                          <div className="font-medium">{budget.label}</div>
                          <div className="text-sm text-gray-600">{budget.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What size system category fits your needs?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'small', label: 'Small', desc: '< 2MW' },
                        { value: 'medium', label: 'Medium', desc: '2-10MW' },
                        { value: 'large', label: 'Large', desc: '> 10MW' }
                      ].map((size) => (
                        <button
                          key={size.value}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            wizardData.powerNeeds === size.value
                              ? 'border-purple-500 bg-purple-50 text-purple-800'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setWizardData({...wizardData, powerNeeds: size.value})}
                        >
                          <div className="font-medium">{size.label}</div>
                          <div className="text-sm text-gray-600">{size.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Where is your project located?
                    </label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      value={wizardData.location}
                      onChange={(e) => setWizardData({...wizardData, location: e.target.value as Region})}
                    >
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="EU">European Union</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex justify-between space-x-3">
                    <button
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      onClick={() => setWizardStep(1)}
                    >
                      ← Back
                    </button>
                    <button
                      className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                      style={{ color: '#FDE047', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                      disabled={!wizardData.budgetRange || !wizardData.powerNeeds}
                      onClick={() => setWizardStep(3)}
                    >
                      Next Step →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Final Details
                  </h3>
                  <p className="text-gray-600">
                    Just a few more details to optimize your configuration.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's your project timeframe?
                    </label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      value={wizardData.timeframe}
                      onChange={(e) => setWizardData({...wizardData, timeframe: e.target.value})}
                    >
                      <option value="">Select timeframe...</option>
                      <option value="immediate">Immediate (&lt; 3 months)</option>
                      <option value="short">Short term (3-6 months)</option>
                      <option value="medium">Medium term (6-12 months)</option>
                      <option value="long">Long term (&gt; 12 months)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's your primary goal?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'cost-savings', label: 'Cost Savings', desc: 'Reduce energy bills' },
                        { value: 'reliability', label: 'Reliability', desc: 'Backup power security' },
                        { value: 'sustainability', label: 'Sustainability', desc: 'Environmental goals' },
                        { value: 'compliance', label: 'Compliance', desc: 'Regulatory requirements' }
                      ].map((goal) => (
                        <button
                          key={goal.value}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            wizardData.primaryGoal === goal.value
                              ? 'border-purple-500 bg-purple-50 text-purple-800'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setWizardData({...wizardData, primaryGoal: goal.value})}
                        >
                          <div className="font-medium">{goal.label}</div>
                          <div className="text-sm text-gray-600">{goal.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-2">Configuration Preview</h4>
                    <div className="text-sm text-purple-700 space-y-1">
                      <div>• Power Required: {wizardData.powerMW} MW</div>
                      <div>• Grid Connection: {wizardData.gridConnection === 'behind' ? 'Behind the meter' : 'Front of meter'}</div>
                      <div>• Equipment: {Object.entries(wizardData.equipmentNeeded)
                        .filter(([_, selected]) => selected)
                        .map(([key, _]) => {
                          const labels: {[k: string]: string} = {
                            bess: 'BESS',
                            powerGeneration: 'Power Gen',
                            solar: 'Solar',
                            wind: 'Wind',
                            grid: 'Grid'
                          }
                          return labels[key]
                        }).join(', ')}</div>
                      <div>• Application: {wizardData.application}</div>
                      <div>• Budget Range: {wizardData.budgetRange.replace('under500k', 'Under $500K').replace('500k-2m', '$500K-$2M').replace('2m-10m', '$2M-$10M').replace('10m+', '$10M+').replace('flexible', 'Flexible')}</div>
                      <div>• System Size: {wizardData.powerNeeds} ({wizardData.powerNeeds === 'small' ? '< 2MW' : wizardData.powerNeeds === 'medium' ? '2-10MW' : '> 10MW'})</div>
                      <div>• Location: {wizardData.location}</div>
                      {wizardData.primaryGoal && <div>• Primary Goal: {wizardData.primaryGoal.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>}
                    </div>
                  </div>

                  <div className="flex justify-between space-x-3">
                    <button
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      onClick={() => setWizardStep(2)}
                    >
                      ← Back
                    </button>
                    <button
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all font-medium shadow-lg transform hover:scale-105"
                      style={{ color: '#FDE047', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                      onClick={generateSmartConfiguration}
                    >
                      🪄 Generate My BESS Configuration
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Load Project Modal */}
      {showLoadProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-purple-800">Load Project</h2>
              <button 
                onClick={() => setShowLoadProject(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {projects.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No saved projects found.</p>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div 
                    key={project.name + project.createdAt}
                    className="border rounded-lg p-4 hover:bg-purple-50 cursor-pointer transition-colors"
                    onClick={() => {
                      applyProject(project);
                      setShowLoadProject(false);
                      alert(`Loaded project: ${project.name}`);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-purple-800">{project.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(project.createdAt).toLocaleDateString()} at {new Date(project.createdAt).toLocaleTimeString()}
                        </p>
                        {project.inputs && (
                          <p className="text-sm text-gray-500 mt-1">
                            {project.inputs.powerMW}MW • {project.inputs.standbyHours}h • {project.inputs.gridMode}
                          </p>
                        )}
                      </div>
                      <button 
                        className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          applyProject(project);
                          setShowLoadProject(false);
                          alert(`Loaded project: ${project.name}`);
                        }}
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowLoadProject(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
