import { useEffect, useRef, useState } from 'react'
import newMerlin from '../assets/images/new_Merlin.png'
import { loadAll, saveProject } from '../lib/store'
import VendorManager from './VendorManager'
import DatabaseTest from './DatabaseTest'
import UserProfile from './UserProfile'
import { parseVendorQuoteFile } from '../utils/fileParser'
import { playMagicWandSound } from '../utils/magicSound'


type Region = 'US' | 'UK' | 'EU' | 'Other'

// Comprehensive country-to-tariff lookup table
const COUNTRY_TARIFF_LOOKUP: Record<string, number> = {
  // North America
  'United States': 0.02,
  'Canada': 0.03,
  'Mexico': 0.15,
  
  // Europe
  'Germany': 0.05,
  'France': 0.05,
  'United Kingdom': 0.06,
  'Spain': 0.05,
  'Italy': 0.05,
  'Netherlands': 0.05,
  'Poland': 0.05,
  'Belgium': 0.05,
  'Austria': 0.05,
  'Switzerland': 0.04,
  'Norway': 0.03,
  'Sweden': 0.05,
  'Denmark': 0.05,
  'Finland': 0.05,
  
  // Asia-Pacific
  'China': 0.25,
  'Japan': 0.08,
  'South Korea': 0.10,
  'Australia': 0.06,
  'New Zealand': 0.05,
  'Singapore': 0.03,
  'Malaysia': 0.15,
  'Thailand': 0.20,
  'Vietnam': 0.18,
  'Philippines': 0.12,
  'Indonesia': 0.15,
  'India': 0.20,
  'Taiwan': 0.08,
  
  // Middle East & Africa
  'United Arab Emirates': 0.05,
  'Saudi Arabia': 0.12,
  'Israel': 0.08,
  'South Africa': 0.15,
  'Egypt': 0.18,
  'Morocco': 0.15,
  'Nigeria': 0.20,
  'Kenya': 0.18,
  
  // Latin America
  'Brazil': 0.18,
  'Argentina': 0.15,
  'Chile': 0.08,
  'Colombia': 0.12,
  'Peru': 0.10,
  'Ecuador': 0.15,
  'Uruguay': 0.10,
  
  // Other
  'Other': 0.08,
}

// Special battery tariff lookup table (batteries have different tariffs, especially from China)
const BATTERY_TARIFF_LOOKUP: Record<string, number> = {
  // North America - Battery specific tariffs
  'United States': 0.254,  // 25.4% AD/CVD duties on Chinese lithium-ion batteries
  'Canada': 0.035,         // Slightly higher for batteries
  'Mexico': 0.18,
  
  // Europe - Battery specific tariffs  
  'Germany': 0.189,        // 18.9% AD duties on Chinese lithium-ion batteries
  'France': 0.189,         // 18.9% AD duties on Chinese lithium-ion batteries
  'United Kingdom': 0.206,  // 20.6% AD duties on Chinese lithium-ion batteries (post-Brexit alignment with trade policy)
  'Spain': 0.189,          // 18.9% AD duties on Chinese lithium-ion batteries
  'Italy': 0.189,          // 18.9% AD duties on Chinese lithium-ion batteries
  'Netherlands': 0.189,    // 18.9% AD duties on Chinese lithium-ion batteries
  'Poland': 0.189,         // 18.9% AD duties on Chinese lithium-ion batteries
  'Belgium': 0.189,        // 18.9% AD duties on Chinese lithium-ion batteries
  'Austria': 0.189,        // 18.9% AD duties on Chinese lithium-ion batteries
  'Switzerland': 0.05,
  'Norway': 0.04,
  'Sweden': 0.189,         // 18.9% AD duties on Chinese lithium-ion batteries
  'Denmark': 0.189,        // 18.9% AD duties on Chinese lithium-ion batteries
  'Finland': 0.189,        // 18.9% AD duties on Chinese lithium-ion batteries
  
  // Asia-Pacific - Battery specific tariffs
  'China': 0.00,           // No tariff on domestic Chinese batteries
  'Japan': 0.10,
  'South Korea': 0.12,
  'Australia': 0.08,
  'New Zealand': 0.06,
  'Singapore': 0.04,
  'Malaysia': 0.18,
  'Thailand': 0.25,
  'Vietnam': 0.22,
  'Philippines': 0.15,
  'Indonesia': 0.18,
  'India': 0.25,           // High battery tariffs to protect domestic industry
  'Taiwan': 0.10,
  
  // Middle East & Africa - Battery specific tariffs
  'United Arab Emirates': 0.06,
  'Saudi Arabia': 0.15,
  'Israel': 0.10,
  'South Africa': 0.18,
  'Egypt': 0.22,
  'Morocco': 0.18,
  'Nigeria': 0.25,
  'Kenya': 0.22,
  
  // Latin America - Battery specific tariffs
  'Brazil': 0.22,
  'Argentina': 0.18,
  'Chile': 0.10,
  'Colombia': 0.15,
  'Peru': 0.12,
  'Ecuador': 0.18,
  'Uruguay': 0.12,
  
  // Other
  'Other': 0.10,
}

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
  country: string  // Single country field instead of tariffByRegion
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
  country: 'United States',  // Default country instead of tariffByRegion
}

// Helper function to get tariff percentage by country name
function getTariffByCountry(countryName: string): number {
  return COUNTRY_TARIFF_LOOKUP[countryName] || COUNTRY_TARIFF_LOOKUP['Other']
}

// Helper function to get battery-specific tariff percentage by country name
function getBatteryTariffByCountry(countryName: string): number {
  return BATTERY_TARIFF_LOOKUP[countryName] || BATTERY_TARIFF_LOOKUP['Other']
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
  const [testCounter, setTestCounter] = useState(0) // Simple test counter
  const [wizardData, setWizardData] = useState({
    applications: [] as string[], // Changed to array for multiple selections
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
      hybrid: false,
      grid: true
    },
    gridConnection: 'behind', // 'front' or 'behind'
    hybridConfig: {
      generationMW: 1,
      storageMWh: 2,
      generationType: 'solar' // 'solar', 'wind', 'generator', 'mixed'
    },
    worldRegion: 'US' as Region, // for tariffs and shipping
    shippingLocation: ''
  })

  // Enhanced debug logging function for thorough testing
  const debugLog = (action: string, data?: any) => {
    console.log(`🧪 TEST: ${action}`, data ? data : '');
  }

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

    // Apply different tariffs for batteries vs other components
    const batteryTariffPct = getBatteryTariffByCountry(a.country)
    const generalTariffPct = getTariffByCountry(a.country)
    
    const batteryTariffs = batterySubtotal * batteryTariffPct
    const pcsTariffs = pcsSubtotal * generalTariffPct
    const bosTariffs = bos * generalTariffPct
    const epcTariffs = epc * generalTariffPct
    const solarTariffs = solarSubtotal * generalTariffPct
    const windTariffs = windSubtotal * generalTariffPct
    
    const tariffs = batteryTariffs + pcsTariffs + bosTariffs + epcTariffs + solarTariffs + windTariffs

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
    debugLog('🪄 generateSmartConfiguration called', wizardData);
    
    const { applications, budgetRange, powerMW, equipmentNeeded, gridConnection, worldRegion } = wizardData
    
    // Initialize configuration based on application type and user inputs
    let config: Partial<Inputs> = {
      locationRegion: worldRegion, // Use tariff region instead of project location
      gridMode: gridConnection === 'behind' ? 'on-grid' : 'off-grid',
      powerMW: powerMW // Use the exact power specified by user
    }

    // Determine specific settings based on primary application
    const primaryApplication = applications.length > 0 ? applications[0] : 'Custom Application'
    switch (primaryApplication) {
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

    // Configure hybrid system
    if (equipmentNeeded.hybrid) {
      const { generationMW, storageMWh, generationType } = wizardData.hybridConfig
      
      // Set battery capacity based on storage requirement
      if (storageMWh > 0) {
        config.standbyHours = storageMWh / powerMW // Calculate hours from storage capacity
      }
      
      // Configure generation based on type
      switch (generationType) {
        case 'solar':
          config.solarMWp = generationMW
          break
        case 'wind':
          config.windMW = generationMW
          break
        case 'generator':
          config.generatorMW = generationMW
          break
        case 'mixed':
          // Split generation between sources
          config.solarMWp = generationMW * 0.6
          config.windMW = generationMW * 0.4
          break
      }
      
      // Update use case for hybrid systems
      config.useCase = `Hybrid ${generationType.charAt(0).toUpperCase() + generationType.slice(1)} + Storage`
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
    debugLog('Configuration applied', {
      oldInputs: inputs,
      config: config,
      newInputs: nextInputs
    });
    setInputs(nextInputs)
    setOut(calc(nextInputs, assm))
    
    // Set project name based on configuration
    setProjectName(`${primaryApplication} - ${config.powerMW}MW System`)
    
    // Close wizard immediately - no need to wait
    debugLog('Closing wizard and starting export');
    setShowSmartWizard(false)
    setWizardStep(1)
    
    // Play magic sound and show brief feedback
    playMagicWandSound()
    setMagicalExport(true)
    setTimeout(() => setMagicalExport(false), 1500) // Shorter animation
    
    // Start export immediately without waiting
    setTimeout(() => {
      console.log(`✨ BESS Configuration Generated! ✨`);
      console.log(`Project: ${primaryApplication} - ${config.powerMW}MW System`);
      console.log(`Total Cost: $${calc(nextInputs, assm).grandCapex.toLocaleString()}`);
      console.log('Auto-exporting to Word...');
      
      // Automatically export to Word
      exportToWord();
    }, 500); // Just a brief delay to let the UI update
  }

  function applyOverrides(obj: any) {
    const next: Assumptions = JSON.parse(JSON.stringify(assm))
    for (const k of Object.keys(obj || {})) {
      if (k === 'country' && typeof obj[k] === 'string') {
        // Set country directly for tariff lookup
        next.country = obj[k]
      } else if (k === 'tariffByRegion') {
        // Legacy support - ignore old tariffByRegion imports
        console.log('Ignoring legacy tariffByRegion import - using country-based lookup instead')
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
    console.log('Save Project clicked!');
    console.log('Project name:', projectName);
    console.log('Current inputs:', inputs);
    console.log('Current assumptions:', assm);
    
    const snap = {
      name: projectName || `Quote ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
      inputs,
      assumptions: assm,
    }
    
    console.log('Saving project snapshot:', snap);
    saveProject(snap)
    
    const updatedProjects = loadAll();
    console.log('Updated projects after save:', updatedProjects);
    setProjects(updatedProjects)
    
    alert(`Project "${snap.name}" saved successfully!`);
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
      
      // Determine API base URL dynamically
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5001'
        : '';
      
      // Silent export - no alert needed
      console.log('🔄 Starting Word export...')
      console.log('Attempting Word export to:', `${apiBase}/api/export/word`);
      
      // Add timeout and better error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        alert('❌ Export timed out after 8 seconds. Please try again.')
      }, 8000) // 8 second timeout
      
      console.log('Sending request to:', `${apiBase}/api/export/word`);
      
      const res = await fetch(`${apiBase}/api/export/word`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('Response received:', res.status, res.statusText);
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`)
      }
      
      console.log('Response OK, getting blob...');
      
      // Force download
      const blob = await res.blob()
      if (blob.size === 0) {
        throw new Error('Received empty file from server')
      }
      
      console.log('Received blob size:', blob.size, 'bytes');
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${projectName}_BESS_Quote.docx`
      
      // Ensure the link is added to DOM before clicking
      document.body.appendChild(a)
      console.log('Triggering download...');
      a.click()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 100)
      
      // Silent success - no alert needed
      console.log('✅ Word document downloaded successfully!')
      console.log('Download completed');
      
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
      
      let errorMessage = 'Export failed: ';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage += 'Cannot connect to server. Make sure the backend is running on port 5001.';
        } else if (error.message.includes('abort')) {
          errorMessage += 'Request timed out. Server may be slow or unresponsive.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      alert(`❌ ${errorMessage}\n\nCheck browser console for details.`);
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
          
          {/* Simple test button right next to wizard button */}
          <button
            className="ml-4 px-4 py-2 bg-red-500 text-white rounded"
            onClick={() => {
              alert('Test button clicked!');
              setTestCounter(testCounter + 1);
            }}
          >
            TEST: {testCounter}
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
          <button className="bg-yellow-300 border border-yellow-400 rounded px-3 py-2 shadow-sm hover:bg-yellow-400 transition-colors font-semibold text-gray-800" onClick={handleSaveProject}>
            💾 Save Project
          </button>
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
      <div className="border rounded p-4 space-y-3 bg-blue-50">
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
            
            {/* Country Selector for Tariff Lookup */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                Country (for tariff lookup): 
                <span className="text-blue-600 font-semibold ml-2">
                  Battery: {(getBatteryTariffByCountry(assm.country) * 100).toFixed(1)}% | 
                  Other: {(getTariffByCountry(assm.country) * 100).toFixed(1)}%
                </span>
              </label>
              <select 
                className="w-full border rounded px-3 py-2 bg-white" 
                value={assm.country}
                onChange={(e) => updateAssumption('country', e.target.value)}
              >
                {Object.keys(COUNTRY_TARIFF_LOOKUP).map(country => (
                  <option key={country} value={country}>
                    {country} (Battery: {(BATTERY_TARIFF_LOOKUP[country] * 100).toFixed(1)}% | Other: {(COUNTRY_TARIFF_LOOKUP[country] * 100).toFixed(1)}%)
                  </option>
                ))}
              </select>
            </div>
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

      {/* BESS Quote Draft */}
      <div className="border rounded-lg p-4 text-sm space-y-1 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 shadow-sm">
        {/* Professional Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-300">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">BESS QUOTE DRAFT</h3>
            <p className="text-xs text-gray-600">Project Cost Breakdown & Analysis</p>
          </div>
        </div>
        
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
        <div>Tariffs - Battery ({pct(getBatteryTariffByCountry(assm.country))}): <strong>{money(out.batterySubtotal * getBatteryTariffByCountry(assm.country))}</strong></div>
        <div>Tariffs - Other ({pct(getTariffByCountry(assm.country))}): <strong>{money(out.tariffs - (out.batterySubtotal * getBatteryTariffByCountry(assm.country)))}</strong></div>
        <div className="font-semibold">Total Tariffs: <strong>{money(out.tariffs)}</strong></div>

        <div className="mt-2">Grand CapEx (pre-warranty): <strong>{money(out.grandCapexBeforeWarranty)}</strong></div>
        <div>Grand CapEx (incl. warranty {inputs.warrantyYears}y{inputs.warrantyYears === 20 ? ' +10%' : ''}): <strong>{money(out.grandCapex)}</strong></div>

        <div className="mt-2 bg-yellow-300 p-2 rounded-lg border border-yellow-400 shadow-sm">
          <span className="font-semibold text-gray-800">💰 Annual Savings: <strong className="text-green-700">{money(out.annualSavings)}</strong></span>
        </div>
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
              <div className="flex space-x-2">
                <button 
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-bold"
                  style={{ 
                    color: '#FDE047', 
                    fontWeight: 'bold', 
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)' 
                  }}
                  onClick={() => {setShowSmartWizard(false); setWizardStep(1)}}
                >
                  🏠 Home
                </button>
                <button 
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-bold"
                  onClick={() => {setShowSmartWizard(false); setWizardStep(1)}}
                >
                  ✕ Close
                </button>
              </div>
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

                {/* Testing Status Panel */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">🧪 Testing Status</h4>
                  <button 
                    onClick={() => {
                      alert('Testing panel button clicked!');
                      setTestCounter(testCounter + 1);
                    }}
                    className="mb-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Test React Updates (Clicked: {testCounter} times)
                  </button>
                  <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                    <div>
                      <strong>Applications Selected:</strong>
                      <div className="text-xs mt-1">
                        {wizardData.applications.length > 0 
                          ? wizardData.applications.map(app => (
                              <div key={app} className="flex items-center">
                                <span className="text-green-600 mr-1">✓</span>
                                {app}
                              </div>
                            ))
                          : <div className="text-red-600">❌ None selected</div>
                        }
                      </div>
                    </div>
                    <div>
                      <strong>Equipment Selected:</strong>
                      <div className="text-xs mt-1">
                        {Object.entries(wizardData.equipmentNeeded)
                          .filter(([_, selected]) => selected)
                          .map(([key, _]) => (
                            <div key={key} className="flex items-center">
                              <span className="text-green-600 mr-1">✓</span>
                              {key.toUpperCase()}
                            </div>
                          ))
                        }
                        {Object.entries(wizardData.equipmentNeeded).filter(([_, selected]) => selected).length === 0 && (
                          <div className="text-red-600">❌ None selected</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <strong>Next Button Status:</strong>
                      <div className="text-xs mt-1">
                        {wizardData.applications.length === 0 
                          ? '🔴 DISABLED (Need to select application)' 
                          : '✅ ENABLED'
                        }
                      </div>
                    </div>
                    <div>
                      <strong>Wizard Step:</strong>
                      <div className="text-xs mt-1">Step {wizardStep} of 3</div>
                    </div>
                  </div>
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
                        { key: 'hybrid', label: 'Hybrid System', icon: '🔄', desc: 'Combined generation + storage' },
                        { key: 'grid', label: 'Grid Connection', icon: '🔌', desc: 'Utility grid integration' }
                      ].map((equipment) => (
                        <button
                          key={equipment.key}
                          type="button"
                          className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer transform ${
                            wizardData.equipmentNeeded[equipment.key as keyof typeof wizardData.equipmentNeeded]
                              ? 'border-green-600 bg-green-200 text-green-900 font-bold shadow-lg scale-105 ring-2 ring-green-300'
                              : 'border-gray-200 hover:border-green-300 bg-white hover:bg-green-50 hover:shadow-md'
                          }`}
                          onClick={() => {
                            debugLog('Equipment button clicked', equipment.key);
                            const newEquipmentState = {
                              ...wizardData.equipmentNeeded,
                              [equipment.key]: !wizardData.equipmentNeeded[equipment.key as keyof typeof wizardData.equipmentNeeded]
                            };
                            debugLog('Equipment state changing from/to', {
                              from: wizardData.equipmentNeeded,
                              to: newEquipmentState
                            });
                            setWizardData({
                              ...wizardData, 
                              equipmentNeeded: newEquipmentState
                            });
                          }}
                        >
                          <div className="relative">
                            {/* Checkbox indicator */}
                            <div className="absolute -top-1 -left-1 w-6 h-6 border-2 border-gray-400 bg-white rounded flex items-center justify-center shadow-lg z-10">
                              {wizardData.equipmentNeeded[equipment.key as keyof typeof wizardData.equipmentNeeded] ? (
                                <span className="text-green-600 text-lg font-bold">✓</span>
                              ) : (
                                <span className="text-gray-300"></span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{equipment.icon}</span>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{equipment.label}</div>
                                <div className="text-xs text-gray-600">{equipment.desc}</div>
                                <div className="text-xs text-blue-600">
                                  Status: {wizardData.equipmentNeeded[equipment.key as keyof typeof wizardData.equipmentNeeded] ? 'SELECTED' : 'NOT SELECTED'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hybrid System Configuration */}
                  {wizardData.equipmentNeeded.hybrid && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-orange-800 mb-3">Hybrid System Configuration</h4>
                      <p className="text-sm text-orange-700 mb-3">Configure your hybrid generation and storage system:</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Generation Capacity (MW)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={wizardData.hybridConfig.generationMW}
                            onChange={(e) => setWizardData({
                              ...wizardData,
                              hybridConfig: {
                                ...wizardData.hybridConfig,
                                generationMW: parseFloat(e.target.value) || 0
                              }
                            })}
                            placeholder="e.g., 3.0"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Storage Capacity (MWh)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={wizardData.hybridConfig.storageMWh}
                            onChange={(e) => setWizardData({
                              ...wizardData,
                              hybridConfig: {
                                ...wizardData.hybridConfig,
                                storageMWh: parseFloat(e.target.value) || 0
                              }
                            })}
                            placeholder="e.g., 6.0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Generation Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'solar', label: 'Solar PV', icon: '☀️' },
                            { value: 'wind', label: 'Wind', icon: '💨' },
                            { value: 'generator', label: 'Generator', icon: '⚡' },
                            { value: 'mixed', label: 'Mixed Sources', icon: '🔄' }
                          ].map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              className={`p-2 rounded-lg border-2 text-left transition-all cursor-pointer transform ${
                                wizardData.hybridConfig.generationType === type.value
                                  ? 'border-orange-600 bg-orange-200 text-orange-900 shadow-lg scale-105 ring-2 ring-orange-300'
                                  : 'border-gray-200 hover:border-orange-300 bg-white hover:bg-orange-50 hover:shadow-md'
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Generation type clicked:', type.value);
                                setWizardData({
                                  ...wizardData,
                                  hybridConfig: {
                                    ...wizardData.hybridConfig,
                                    generationType: type.value as 'solar' | 'wind' | 'generator' | 'mixed'
                                  }
                                });
                              }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                  <span className="text-lg mr-2">{type.icon}</span>
                                  <span className="text-sm font-medium">{type.label}</span>
                                </div>
                                {wizardData.hybridConfig.generationType === type.value && (
                                  <span className="text-sm text-orange-700">✓</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

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
                          type="button"
                          className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer transform ${
                            wizardData.applications.includes(app.value)
                              ? 'border-purple-600 bg-purple-200 text-purple-900 font-bold shadow-lg scale-105 ring-2 ring-purple-300'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-md'
                          }`}
                          onClick={() => {
                            debugLog('Application button clicked', app.value);
                            const newApplications = wizardData.applications.includes(app.value)
                              ? wizardData.applications.filter(a => a !== app.value) // Remove if already selected
                              : [...wizardData.applications, app.value]; // Add if not selected
                            debugLog('Applications changing from/to', {
                              from: wizardData.applications,
                              to: newApplications
                            });
                            setWizardData({...wizardData, applications: newApplications});
                          }}
                        >
                          <div className="relative">
                            {/* Checkbox indicator */}
                            <div className="absolute -top-1 -left-1 w-6 h-6 border-2 border-gray-400 bg-white rounded flex items-center justify-center shadow-lg z-10">
                              {wizardData.applications.includes(app.value) ? (
                                <span className="text-green-600 text-lg font-bold">✓</span>
                              ) : (
                                <span className="text-gray-300"></span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{app.icon}</span>
                              <div className="flex-1">
                                <div className="font-medium">{app.value}</div>
                                <div className="text-sm text-gray-600">{app.desc}</div>
                                <div className="text-xs text-blue-600">
                                  Status: {wizardData.applications.includes(app.value) ? 'SELECTED' : 'NOT SELECTED'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comprehensive Test Panel */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
                    <h4 className="font-bold text-red-800 mb-2">🔧 Button Test Panel (Remove after testing)</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <strong>Equipment Selection:</strong>
                        <div>BESS: {wizardData.equipmentNeeded.bess ? '✅' : '❌'}</div>
                        <div>Power Gen: {wizardData.equipmentNeeded.powerGeneration ? '✅' : '❌'}</div>
                        <div>Solar: {wizardData.equipmentNeeded.solar ? '✅' : '❌'}</div>
                        <div>Wind: {wizardData.equipmentNeeded.wind ? '✅' : '❌'}</div>
                        <div>Hybrid: {wizardData.equipmentNeeded.hybrid ? '✅' : '❌'}</div>
                        <div>Grid: {wizardData.equipmentNeeded.grid ? '✅' : '❌'}</div>
                      </div>
                      <div>
                        <strong>Configuration:</strong>
                        <div>Applications: {wizardData.applications.length > 0 ? wizardData.applications.join(', ') : '❌ None'}</div>
                        <div>Power MW: {wizardData.powerMW}</div>
                        <div>Grid: {wizardData.gridConnection}</div>
                        <div>Gen Type: {wizardData.hybridConfig.generationType}</div>
                        <div>Gen MW: {wizardData.hybridConfig.generationMW}</div>
                        <div>Storage MWh: {wizardData.hybridConfig.storageMWh}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      <strong>Next Button Status:</strong> {(
                        wizardData.applications.length === 0 || 
                        (!wizardData.equipmentNeeded.bess && !wizardData.equipmentNeeded.hybrid) ||
                        (wizardData.equipmentNeeded.hybrid && (
                          !wizardData.hybridConfig.generationType || 
                          wizardData.hybridConfig.generationMW === 0 || 
                          wizardData.hybridConfig.storageMWh === 0
                        ))
                      ) ? '🔴 DISABLED' : '✅ ENABLED'}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    {/* Test button to verify React is working */}
                    <button
                      type="button"
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      onClick={() => {
                        setTestCounter(testCounter + 1);
                      }}
                    >
                      TEST ({testCounter})
                    </button>

                    <button
                      type="button"
                      className="px-6 py-2 rounded-lg transition-colors font-bold cursor-pointer"
                      style={{ 
                        backgroundColor: '#8B5CF6',
                        color: '#FDE047', 
                        fontWeight: 'bold', 
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#7C3AED'}
                      onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#8B5CF6'}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('NEXT BUTTON CLICKED');
                        console.log('Applications selected:', wizardData.applications);
                        console.log('Current step:', wizardStep);
                        
                        // Temporarily remove the restriction for testing
                        // if (wizardData.applications.length === 0) {
                        //   alert('Please select at least one application first!');
                        //   return;
                        // }
                        
                        console.log('Moving to step 2...');
                        setWizardStep(2);
                        console.log('Step should now be:', 2);
                      }}
                    >
                      Next Step → (Apps: {wizardData.applications.length})
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
                          type="button"
                          className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer transform ${
                            wizardData.budgetRange === budget.value
                              ? 'border-purple-600 bg-purple-200 text-purple-900 shadow-lg scale-105 ring-2 ring-purple-300'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-md'
                          }`}
                          onClick={() => setWizardData({...wizardData, budgetRange: budget.value})}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{budget.label}</div>
                              <div className="text-sm text-gray-600">{budget.desc}</div>
                            </div>
                            {wizardData.budgetRange === budget.value && (
                              <span className="text-lg text-purple-700">✓</span>
                            )}
                          </div>
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
                          type="button"
                          className={`p-3 rounded-lg border-2 text-center transition-all cursor-pointer transform ${
                            wizardData.powerNeeds === size.value
                              ? 'border-purple-600 bg-purple-200 text-purple-900 shadow-lg scale-105 ring-2 ring-purple-300'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-md'
                          }`}
                          onClick={() => setWizardData({...wizardData, powerNeeds: size.value})}
                        >
                          <div className="font-medium">{size.label}</div>
                          <div className="text-sm text-gray-600">{size.desc}</div>
                          {wizardData.powerNeeds === size.value && (
                            <div className="text-lg text-purple-700 mt-1">✓</div>
                          )}
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

                  {/* Tariff and Shipping Configuration */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3">Tariff & Shipping Calculations</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          World Region (for tariff calculations)
                        </label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg"
                          value={wizardData.worldRegion}
                          onChange={(e) => setWizardData({...wizardData, worldRegion: e.target.value as Region})}
                        >
                          <option value="US">North America</option>
                          <option value="UK">United Kingdom</option>
                          <option value="EU">European Union</option>
                          <option value="Other">Asia Pacific / Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Shipping Destination
                        </label>
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded-lg"
                          value={wizardData.shippingLocation}
                          onChange={(e) => setWizardData({...wizardData, shippingLocation: e.target.value})}
                          placeholder="e.g., California, USA or London, UK"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-blue-700">
                      <p>💡 <strong>Tariff Region:</strong> Used for calculating import duties and energy pricing</p>
                      <p>📦 <strong>Shipping:</strong> Helps estimate logistics and delivery costs</p>
                    </div>
                  </div>

                  <div className="flex justify-between space-x-3">
                    <button
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      onClick={() => setWizardStep(1)}
                    >
                      ← Back
                    </button>
                    <button
                      className="px-6 py-2 rounded-lg transition-colors disabled:opacity-50 font-bold"
                      style={{ 
                        backgroundColor: '#8B5CF6',
                        color: '#FDE047', 
                        fontWeight: 'bold', 
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => !e.currentTarget.disabled && ((e.target as HTMLButtonElement).style.backgroundColor = '#7C3AED')}
                      onMouseLeave={(e) => !e.currentTarget.disabled && ((e.target as HTMLButtonElement).style.backgroundColor = '#8B5CF6')}
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
                          type="button"
                          className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer transform ${
                            wizardData.primaryGoal === goal.value
                              ? 'border-blue-600 bg-blue-200 text-blue-900 shadow-lg scale-105 ring-2 ring-blue-300'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
                          }`}
                          onClick={() => setWizardData({...wizardData, primaryGoal: goal.value})}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{goal.label}</div>
                              <div className="text-sm text-gray-600">{goal.desc}</div>
                            </div>
                            {wizardData.primaryGoal === goal.value && (
                              <span className="text-lg text-blue-700">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cost Summary Section */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200 shadow-lg">
                    <h4 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                      💰 Cost Summary
                    </h4>
                    {(() => {
                      // Calculate costs based on current inputs and wizard configuration
                      const currentInputs = {
                        ...inputs,
                        powerMW: wizardData.powerMW,
                        gridMode: (wizardData.gridConnection === 'behind' ? 'on-grid' : 'off-grid') as 'on-grid' | 'off-grid',
                        locationRegion: wizardData.worldRegion,
                        generatorMW: wizardData.equipmentNeeded.powerGeneration ? wizardData.hybridConfig.generationMW : undefined,
                        solarMWp: wizardData.equipmentNeeded.solar ? wizardData.hybridConfig.generationMW : undefined,
                        windMW: wizardData.equipmentNeeded.wind ? wizardData.hybridConfig.generationMW : undefined,
                        useCase: wizardData.applications.join(', ') || 'General Application'
                      };
                      const costData = calc(currentInputs, assm);
                      
                      return (
                        <div className="space-y-3">
                          <div className="bg-white p-4 rounded-lg border border-green-300">
                            <div className="text-center">
                              <div className="text-3xl font-black text-green-700 mb-2">
                                ${costData.grandCapex.toLocaleString()}
                              </div>
                              <div className="text-lg font-bold text-green-600">
                                Total Project Cost
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                (Including warranty & installation)
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                              <div className="text-lg font-bold text-blue-700">
                                ${costData.grandCapexBeforeWarranty.toLocaleString()}
                              </div>
                              <div className="text-sm font-semibold text-blue-600">
                                Equipment Cost
                              </div>
                              <div className="text-xs text-gray-500">
                                Before warranty
                              </div>
                            </div>
                            
                            {costData.annualSavings > 0 && (
                              <div className="bg-white p-3 rounded-lg border border-purple-200">
                                <div className="text-lg font-bold text-purple-700">
                                  ${costData.annualSavings.toLocaleString()}
                                </div>
                                <div className="text-sm font-semibold text-purple-600">
                                  Annual Savings
                                </div>
                                <div className="text-xs text-gray-500">
                                  Per year estimated
                                </div>
                              </div>
                            )}
                            
                            {costData.roiYears && (
                              <div className="bg-white p-3 rounded-lg border border-orange-200">
                                <div className="text-lg font-bold text-orange-700">
                                  {costData.roiYears.toFixed(1)} years
                                </div>
                                <div className="text-sm font-semibold text-orange-600">
                                  Payback Period
                                </div>
                                <div className="text-xs text-gray-500">
                                  Return on investment
                                </div>
                              </div>
                            )}
                            
                            {costData.budgetDelta && (
                              <div className={`bg-white p-3 rounded-lg border ${costData.budgetDelta > 0 ? 'border-green-200' : 'border-red-200'}`}>
                                <div className={`text-lg font-bold ${costData.budgetDelta > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                  {costData.budgetDelta > 0 ? '+' : ''}${costData.budgetDelta.toLocaleString()}
                                </div>
                                <div className={`text-sm font-semibold ${costData.budgetDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  Budget Variance
                                </div>
                                <div className="text-xs text-gray-500">
                                  {costData.budgetDelta > 0 ? 'Under budget' : 'Over budget'}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-bold text-purple-800 mb-3 text-lg">📋 Configuration Summary</h4>
                    <div className="text-sm text-purple-700 space-y-2">
                      <div className="font-semibold">• Power Required: <span className="font-bold text-purple-900">{wizardData.powerMW} MW</span></div>
                      <div className="font-semibold">• Grid Connection: <span className="font-bold text-purple-900">{wizardData.gridConnection === 'behind' ? 'Behind the meter' : 'Front of meter'}</span></div>
                      <div className="font-semibold">• Equipment: <span className="font-bold text-purple-900">{Object.entries(wizardData.equipmentNeeded)
                        .filter(([_, selected]) => selected)
                        .map(([key, _]) => {
                          const labels: {[k: string]: string} = {
                            bess: 'BESS',
                            powerGeneration: 'Power Gen',
                            solar: 'Solar',
                            wind: 'Wind',
                            hybrid: 'Hybrid',
                            grid: 'Grid'
                          }
                          return labels[key]
                        }).join(', ')}</span></div>
                      {wizardData.equipmentNeeded.hybrid && (
                        <div className="font-semibold">• Hybrid Config: <span className="font-bold text-purple-900">{wizardData.hybridConfig.generationMW}MW generation + {wizardData.hybridConfig.storageMWh}MWh storage ({wizardData.hybridConfig.generationType})</span></div>
                      )}
                      <div className="font-semibold">• Applications: <span className="font-bold text-purple-900">{wizardData.applications.join(', ')}</span></div>
                      <div className="font-semibold">• Budget Range: <span className="font-bold text-purple-900">{wizardData.budgetRange.replace('under500k', 'Under $500K').replace('500k-2m', '$500K-$2M').replace('2m-10m', '$2M-$10M').replace('10m+', '$10M+').replace('flexible', 'Flexible')}</span></div>
                      <div className="font-semibold">• System Size: <span className="font-bold text-purple-900">{wizardData.powerNeeds} ({wizardData.powerNeeds === 'small' ? '< 2MW' : wizardData.powerNeeds === 'medium' ? '2-10MW' : '> 10MW'})</span></div>
                      <div className="font-semibold">• Location: <span className="font-bold text-purple-900">{wizardData.location}</span></div>
                      <div className="font-semibold">• Tariff Region: <span className="font-bold text-purple-900">{wizardData.worldRegion}</span></div>
                      {wizardData.shippingLocation && <div className="font-semibold">• Shipping: <span className="font-bold text-purple-900">{wizardData.shippingLocation}</span></div>}
                      {wizardData.primaryGoal && <div className="font-semibold">• Primary Goal: <span className="font-bold text-purple-900">{wizardData.primaryGoal.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></div>}
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
                      className="px-8 py-3 rounded-lg transition-all font-bold shadow-lg transform hover:scale-105"
                      style={{ 
                        background: 'linear-gradient(to right, #8B5CF6, #7C3AED)',
                        color: '#FDE047', 
                        fontWeight: 'bold', 
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLButtonElement).style.background = 'linear-gradient(to right, #7C3AED, #6D28D9)'}
                      onMouseLeave={(e) => (e.target as HTMLButtonElement).style.background = 'linear-gradient(to right, #8B5CF6, #7C3AED)'}
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
