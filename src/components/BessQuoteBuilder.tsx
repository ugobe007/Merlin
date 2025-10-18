import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { useState, useEffect } from 'react';
import UserProfile from './UserProfile';
import Portfolio from './Portfolio';
import AuthModal from './AuthModal';
import merlinImage from "../assets/images/new_Merlin.png";

export default function BessQuoteBuilder() {
  const [quoteName, setQuoteName] = useState('');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showSmartWizard, setShowSmartWizard] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);
  
  // System Configuration State
  const [powerMW, setPowerMW] = useState('1');
  const [standbyHours, setStandbyHours] = useState('2');
  const [gridMode, setGridMode] = useState('On-grid');
  const [useCase, setUseCase] = useState('EV Charging Stations');
  const [generatorMW, setGeneratorMW] = useState('1');
  const [solarMWp, setSolarMWp] = useState('0');
  const [windMW, setWindMW] = useState('0');
  const [valueKwh, setValueKwh] = useState('0.25');
  const [utilization, setUtilization] = useState('0.3');
  const [warranty, setWarranty] = useState('10 years');
  const [location, setLocation] = useState('UK (6%)');
  const [pcsSeparate, setPcsSeparate] = useState(false);
  const [budgetKnown, setBudgetKnown] = useState(true);
  const [budget, setBudget] = useState('6000000');
 
  // Assumptions State
  const [batteryKwh, setBatteryKwh] = useState(248);
  const [pcsKw, setPcsKw] = useState(150);
  const [bosPercent, setBosPercent] = useState(0.12);
  const [epcPercent, setEpcPercent] = useState(0.15);
  const [offGridPcsFactor, setOffGridPcsFactor] = useState(1.25);
  const [onGridPcsFactor, setOnGridPcsFactor] = useState(1);
  const [genKw, setGenKw] = useState(350);
  const [solarKwp, setSolarKwp] = useState(900);
  const [windKw, setWindKw] = useState(1400);

  // Additional state variables
  const [showLoadProject, setShowLoadProject] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);

  const handleSaveProject = async () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    // ... (rest of the save logic)
  };


  const handleLoadProject = () => {
    setShowLoadProject(true);
  };

  const loadProjectFromStorage = (projectName: string) => {
    const projectData = localStorage.getItem(`merlin_project_${projectName}`);
    if (!projectData) {
      alert('❌ Project not found!');
      return;
    }
    
    const data = JSON.parse(projectData);
    setQuoteName(data.quoteName || quoteName);
    setPowerMW(data.powerMW || '1');
    setStandbyHours(data.standbyHours || '2');
    setGridMode(data.gridMode || 'On-grid');
    setUseCase(data.useCase || 'EV Charging Stations');
    setGeneratorMW(data.generatorMW || '1');
    setSolarMWp(data.solarMWp || '0');
    setWindMW(data.windMW || '0');
    setValueKwh(data.valueKwh || '0.25');
    setUtilization(data.utilization || '0.3');
    setWarranty(data.warranty || '10 years');
    setLocation(data.location || 'UK (6%)');
    setPcsSeparate(data.pcsSeparate || false);
    setBudgetKnown(data.budgetKnown || true);
    setBudget(data.budget || '6000000');
    setBatteryKwh(data.batteryKwh || 248);
    setPcsKw(data.pcsKw || 150);
    setBosPercent(data.bosPercent || 0.12);
    setEpcPercent(data.epcPercent || 0.15);
    setOffGridPcsFactor(data.offGridPcsFactor || 1.25);
    setOnGridPcsFactor(data.onGridPcsFactor || 1);
    setGenKw(data.genKw || 350);
    setSolarKwp(data.solarKwp || 900);
    setWindKw(data.windKw || 1400);
    
    alert(`✅ Project "${projectName}" loaded successfully!`);
    setShowLoadProject(false);
  };

  const handlePortfolio = () => {
    if (isLoggedIn) {
      setShowPortfolio(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleUserProfile = () => {
    setShowUserProfile(true);
  };

  const handleExportPDF = () => {
    const totalMWh = parseFloat(powerMW) * parseFloat(standbyHours);
    const pcsKW = parseFloat(powerMW) * 1000;
    const batterySubtotal = totalMWh * 1000 * batteryKwh;
    const pcsSubtotal = pcsKW * pcsKw;
    const bessCapEx = batterySubtotal + pcsSubtotal + (batterySubtotal + pcsSubtotal) * (bosPercent + epcPercent);
    
    alert(`📄 PDF Export Ready!\n\nProject: ${quoteName}\nBESS CapEx: $${bessCapEx.toLocaleString()}\n\nPDF generation feature coming soon...`);
  };
    const handleExportWord = async () => {
    try {
      const totalMWh = parseFloat(powerMW) * parseFloat(standbyHours);
      const pcsKW = parseFloat(powerMW) * 1000;
      const batterySubtotal = totalMWh * 1000 * batteryKwh;
      const pcsSubtotal = pcsKW * pcsKw;
      const bosAmount = (batterySubtotal + pcsSubtotal) * bosPercent;
      const epcAmount = (batterySubtotal + pcsSubtotal + bosAmount) * epcPercent;
      const bessCapEx = batterySubtotal + pcsSubtotal + bosAmount + epcAmount;
      
      const generatorSubtotal = parseFloat(generatorMW) * 1000 * genKw;
      const solarSubtotal = parseFloat(solarMWp) * 1000 * (solarKwp / 1000);
      const windSubtotal = parseFloat(windMW) * 1000 * (windKw / 1000);
      
      const batteryTariff = bessCapEx * 0.21;
      const otherTariff = (generatorSubtotal + solarSubtotal + windSubtotal) * 0.06;
      const totalTariffs = batteryTariff + otherTariff;
      
      const grandCapEx = bessCapEx + generatorSubtotal + solarSubtotal + windSubtotal + totalTariffs;
      
      const annualEnergyMWh = totalMWh * parseFloat(utilization) * 365;
      const annualSavings = annualEnergyMWh * 1000 * parseFloat(valueKwh);
      const roiYears = grandCapEx / annualSavings;

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "MERLIN BESS QUOTE DRAFT",
                  bold: true,
                  size: 36,
                  color: "1F4E79",
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Battery Energy Storage System - Professional Quote",
                  size: 24,
                  color: "5B9BD5",
                }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "PROJECT OVERVIEW",
                  bold: true,
                  size: 28,
                  underline: {},
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Project Name: `, bold: true }),
                new TextRun({ text: quoteName }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Date: `, bold: true }),
                new TextRun({ text: new Date().toLocaleDateString() }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Power Rating: `, bold: true }),
                new TextRun({ text: `${powerMW} MW` }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Duration: `, bold: true }),
                new TextRun({ text: `${standbyHours} hours` }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Total Energy: `, bold: true }),
                new TextRun({ text: `${totalMWh.toFixed(2)} MWh` }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "COST BREAKDOWN",
                  bold: true,
                  size: 28,
                  underline: {},
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Battery Subtotal: `, bold: true }),
                new TextRun({ text: `$${batterySubtotal.toLocaleString()}` }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `PCS Subtotal: `, bold: true }),
                new TextRun({ text: `$${pcsSubtotal.toLocaleString()}` }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `BOS (${(bosPercent*100).toFixed(0)}%): `, bold: true }),
                new TextRun({ text: `$${bosAmount.toLocaleString()}` }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `EPC (${(epcPercent*100).toFixed(0)}%): `, bold: true }),
                new TextRun({ text: `$${epcAmount.toLocaleString()}` }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `BESS CapEx Total: `, bold: true, size: 24 }),
                new TextRun({ text: `$${bessCapEx.toLocaleString()}`, bold: true, size: 24, color: "70AD47" }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "FINANCIAL ANALYSIS",
                  bold: true,
                  size: 28,
                  underline: {},
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Annual Energy Output: `, bold: true }),
                new TextRun({ text: `${annualEnergyMWh.toFixed(0)} MWh/year` }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Annual Savings: `, bold: true }),
                new TextRun({ text: `$${annualSavings.toLocaleString()}/year` }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Return on Investment: `, bold: true, size: 24 }),
                new TextRun({ text: `${roiYears.toFixed(1)} years`, bold: true, size: 24, color: "C5504B" }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Generated by Merlin BESS Quote Builder",
                  italics: true,
                  size: 20,
                  color: "7F7F7F",
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Report generated on ${new Date().toLocaleString()}`,
                  italics: true,
                  size: 18,
                  color: "7F7F7F",
                }),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quoteName.replace(/[^a-z0-9]/gi, '_')}_BESS_Quote.docx`;
      link.click();
      URL.revokeObjectURL(url);
      
      alert(`📝 Professional Word document "${quoteName}_BESS_Quote.docx" downloaded successfully!`);
    } catch (error) {
      console.error('Word export error:', error);
      alert('❌ Word export failed. Please try again.');
    }
  };

  // SMART WIZARD MODAL COMPONENT - START
  const SmartWizardModal = () => {
    const [step, setStep] = useState(1);
    const [wizardData, setWizardData] = useState({
      industry: '',
      targetROI: '',
      budget: '',
      location: '',
      peakDemand: '',
      currentEnergyCost: '',
      sustainabilityGoals: '',
      gridReliability: ''
    });

    const getIndustryRecommendations = (industry: string) => {
      const recommendations = {
        'ev-charging': {
          power: '2-5',
          duration: '2-4',
          utilization: '0.4-0.6',
          description: 'EV charging requires high power with moderate duration for peak demand management',
          keyBenefits: ['Peak shaving during rush hours', 'Demand charge reduction', 'Grid stability']
        },
        'data-center': {
          power: '5-20',
          duration: '0.5-2',
          utilization: '0.8-0.95',
          description: 'Data centers need ultra-reliable backup power with high utilization',
          keyBenefits: ['99.99% uptime guarantee', 'UPS backup', 'Power quality management']
        },
        'manufacturing': {
          power: '1-10',
          duration: '1-6',
          utilization: '0.3-0.7',
          description: 'Manufacturing benefits from load shifting and demand management',
          keyBenefits: ['Load shifting', 'Power factor correction', 'Production continuity']
        },
        'utilities': {
          power: '10-100',
          duration: '2-8',
          utilization: '0.2-0.4',
          description: 'Utility-scale storage for grid services and renewable integration',
          keyBenefits: ['Frequency regulation', 'Renewable integration', 'Grid stability']
        }
      };
      return recommendations[industry as keyof typeof recommendations] || recommendations['utilities'];
    };

    const calculateOptimalConfiguration = () => {
      const rec = getIndustryRecommendations(wizardData.industry);
      const budgetMultiplier = {
        '1-3M': 0.8,
        '3-10M': 1.2,
        '10-30M': 2.5,
        '30M+': 5.0
      };
      
      const basePower = parseFloat(rec.power.split('-')[0]);
      const multiplier = budgetMultiplier[wizardData.budget as keyof typeof budgetMultiplier] || 1;
      
      return {
        recommendedPower: Math.round(basePower * multiplier * 10) / 10,
        recommendedDuration: rec.duration.split('-')[1],
        recommendedUtilization: rec.utilization.split('-')[1],
        estimatedROI: wizardData.targetROI,
        estimatedSavings: Math.round(basePower * multiplier * 365 * 0.25 * 1000 * parseFloat(rec.utilization.split('-')[1])),
        recommendations: rec
      };
    };

    if (!showSmartWizard) return null;

    return (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">🪄 Merlin Smart Wizard</h2>
                <p className="text-purple-100 mt-1">AI-Powered BESS Configuration - Step {step > 4 ? 4 : step}/4</p>
              </div>
              <button 
                onClick={() => setShowSmartWizard(false)} 
                className="text-3xl hover:text-red-300 transition-all"
              >×</button>
            </div>
          </div>

          <div className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🏭</div>
                  <h3 className="text-2xl font-bold text-gray-800">Tell us about your project</h3>
                  <p className="text-gray-600 mt-2">Our AI will analyze your requirements and recommend the optimal BESS configuration</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Industry/Use Case</label>
                      <select 
                        value={wizardData.industry}
                        onChange={(e) => setWizardData({...wizardData, industry: e.target.value})}
                        className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                      >
                        <option value="">Select your industry...</option>
                        <option value="ev-charging">⚡ EV Charging Stations</option>
                        <option value="data-center">💻 Data Centers</option>
                        <option value="manufacturing">🏭 Manufacturing</option>
                        <option value="utilities">⚡ Utilities & Grid Services</option>
                        <option value="commercial">🏢 Commercial Buildings</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Peak Demand (MW)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={wizardData.peakDemand}
                        onChange={(e) => setWizardData({...wizardData, peakDemand: e.target.value})}
                        placeholder="e.g., 2.5"
                        className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Target ROI Period</label>
                      <select 
                        value={wizardData.targetROI}
                        onChange={(e) => setWizardData({...wizardData, targetROI: e.target.value})}
                        className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                      >
                        <option value="">Select target ROI...</option>
                        <option value="3">🚀 3 years (Aggressive)</option>
                        <option value="5">⚖️ 5 years (Balanced)</option>
                        <option value="7">🛡️ 7 years (Conservative)</option>
                        <option value="10">📈 10+ years (Long-term)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Current Energy Cost ($/kWh)</label>
                      <input 
                        type="number"
                        step="0.01"
                        value={wizardData.currentEnergyCost}
                        onChange={(e) => setWizardData({...wizardData, currentEnergyCost: e.target.value})}
                        placeholder="e.g., 0.25"
                        className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={() => setStep(2)}
                    disabled={!wizardData.industry || !wizardData.targetROI || !wizardData.peakDemand || !wizardData.currentEnergyCost}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg disabled:bg-gray-300 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-lg"
                  >
                    Next: Financial Parameters →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-2xl font-bold text-gray-800">Financial Parameters</h3>
                  <p className="text-gray-600 mt-2">Help us understand your budget and financial goals</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Budget Range (USD)</label>
                    <select 
                      value={wizardData.budget}
                      onChange={(e) => setWizardData({...wizardData, budget: e.target.value})}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    >
                      <option value="">Select budget range...</option>
                      <option value="1-3M">💵 $1M - $3M (Small Scale)</option>
                      <option value="3-10M">💰 $3M - $10M (Medium Scale)</option>
                      <option value="10-30M">🏦 $10M - $30M (Large Scale)</option>
                      <option value="30M+">🏛️ $30M+ (Utility Scale)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Primary Location</label>
                    <select 
                      value={wizardData.location}
                      onChange={(e) => setWizardData({...wizardData, location: e.target.value})}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    >
                      <option value="">Select location...</option>
                      <option value="UK">🇬🇧 United Kingdom</option>
                      <option value="US">🇺🇸 United States</option>
                      <option value="Germany">🇩🇪 Germany</option>
                      <option value="Australia">🇦🇺 Australia</option>
                      <option value="Canada">🇨🇦 Canada</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Sustainability Goals</label>
                    <select 
                      value={wizardData.sustainabilityGoals}
                      onChange={(e) => setWizardData({...wizardData, sustainabilityGoals: e.target.value})}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    >
                      <option value="">Select sustainability priority...</option>
                      <option value="net-zero">🌱 Net Zero by 2030</option>
                      <option value="carbon-reduction">♻️ 50% Carbon Reduction</option>
                      <option value="renewable">☀️ 100% Renewable Energy</option>
                      <option value="cost-focus">💵 Cost Optimization Focus</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Grid Reliability Issues</label>
                    <select 
                      value={wizardData.gridReliability}
                      onChange={(e) => setWizardData({...wizardData, gridReliability: e.target.value})}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg"
                    >
                      <option value="">Rate grid reliability...</option>
                      <option value="excellent">✅ Excellent (&gt;99.9% uptime)</option>
                      <option value="good">👍 Good (99-99.9% uptime)</option>
                      <option value="fair">⚠️ Fair (95-99% uptime)</option>
                      <option value="poor">❌ Poor (&lt;95% uptime)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button 
                    onClick={() => setStep(1)}
                    className="bg-gray-500 text-white px-8 py-4 rounded-xl font-bold text-lg transform hover:scale-105 transition-all"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={() => setStep(3)}
                    disabled={!wizardData.budget || !wizardData.location}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg disabled:bg-gray-300 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-lg"
                  >
                    Analyze Configuration →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-2xl font-bold text-gray-800">AI Analysis Complete</h3>
                  <p className="text-gray-600 mt-2">Merlin has analyzed your requirements and generated optimal recommendations</p>
                </div>

                {(() => {
                  const config = calculateOptimalConfiguration();
                  return (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border-2 border-green-200">
                        <h4 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                          🎯 Recommended Configuration
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center bg-white p-4 rounded-lg shadow">
                            <div className="text-2xl font-bold text-blue-600">{config.recommendedPower}MW</div>
                            <div className="text-sm text-gray-600">Power</div>
                          </div>
                          <div className="text-center bg-white p-4 rounded-lg shadow">
                            <div className="text-2xl font-bold text-purple-600">{config.recommendedDuration}h</div>
                            <div className="text-sm text-gray-600">Duration</div>
                          </div>
                          <div className="text-center bg-white p-4 rounded-lg shadow">
                            <div className="text-2xl font-bold text-green-600">{config.estimatedROI}y</div>
                            <div className="text-sm text-gray-600">ROI</div>
                          </div>
                          <div className="text-center bg-white p-4 rounded-lg shadow">
                            <div className="text-2xl font-bold text-orange-600">${(config.estimatedSavings/1000).toFixed(0)}K</div>
                            <div className="text-sm text-gray-600">Annual Savings</div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg">
                          <h5 className="font-bold mb-2">Why this configuration?</h5>
                          <p className="text-gray-700 mb-3">{config.recommendations.description}</p>
                          <div className="space-y-1">
                            <h6 className="font-semibold text-sm">Key Benefits:</h6>
                            {config.recommendations.keyBenefits.map((benefit: string, index: number) => (
                              <div key={index} className="flex items-center text-sm text-gray-600">
                                <span className="text-green-500 mr-2">✓</span>
                                {benefit}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-xl">
                        <h4 className="font-bold text-yellow-800 mb-2 flex items-center">
                          ⚡ Advanced Recommendations
                        </h4>
                        <div className="space-y-2 text-sm text-yellow-700">
                          <div>• Consider {wizardData.sustainabilityGoals === 'net-zero' ? 'carbon offset programs' : 'demand response programs'} for additional revenue</div>
                          <div>• {wizardData.gridReliability === 'poor' ? 'Extended backup duration recommended due to grid issues' : 'Grid-tied services can provide additional revenue streams'}</div>
                          <div>• Optimal charging schedule: {wizardData.industry === 'ev-charging' ? 'Peak shaving 4-8pm, demand response 6-9pm' : 'Load shifting during peak tariff periods'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-between">
                  <button 
                    onClick={() => setStep(2)}
                    className="bg-gray-500 text-white px-8 py-4 rounded-xl font-bold text-lg transform hover:scale-105 transition-all"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={() => setStep(5)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transform hover:scale-105 transition-all shadow-lg"
                  >
                    Review & Apply →
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">✨</div>
                  <h3 className="text-2xl font-bold text-gray-800">Ready to Apply Configuration?</h3>
                  <p className="text-gray-600 mt-2">This will update your main quote with the AI-recommended settings</p>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl">
                  <h4 className="font-bold text-blue-800 mb-4">Configuration Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Industry:</strong> {wizardData.industry}</div>
                    <div><strong>Target ROI:</strong> {wizardData.targetROI} years</div>
                    <div><strong>Budget:</strong> {wizardData.budget}</div>
                    <div><strong>Location:</strong> {wizardData.location}</div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button 
                    onClick={() => setStep(3)}
                    className="bg-gray-500 text-white px-8 py-4 rounded-xl font-bold text-lg transform hover:scale-105 transition-all"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={() => {
                      const config = calculateOptimalConfiguration();
                      setPowerMW(config.recommendedPower.toString());
                      setStandbyHours(config.recommendedDuration.toString());
                      setUtilization(config.recommendedUtilization);
                      if (wizardData.currentEnergyCost) {
                        setValueKwh(wizardData.currentEnergyCost);
                      }
                      
                      if (wizardData.location) {
                        setLocation(`${wizardData.location} (6%)`);
                      }
                      
                      alert(`🪄 Merlin Smart Wizard has optimized your configuration!\n\n✅ Power: ${config.recommendedPower}MW\n✅ Duration: ${config.recommendedDuration}h\n✅ Estimated ROI: ${config.estimatedROI} years\n✅ Annual Savings: $${(config.estimatedSavings/1000).toFixed(0)}K`);
                      setShowSmartWizard(false);
                      setStep(1);
                      setWizardData({
                        industry: '', targetROI: '', budget: '', location: '',
                        peakDemand: '', currentEnergyCost: '', sustainabilityGoals: '', gridReliability: ''
                      });
                    }}
                    className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transform hover:scale-105 transition-all shadow-lg"
                  >
                    ✨ Apply AI Configuration
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">✨</div>
                  <h3 className="text-2xl font-bold text-gray-800">Final Quote Preview</h3>
                  <p className="text-gray-600 mt-2">Review the AI-generated quote before applying it to your main configuration.</p>
                </div>

                <div className="bg-white border-2 border-blue-200 p-6 rounded-xl shadow-inner max-h-[40vh] overflow-y-auto">
                  {/* HTML Quote Preview */}
                  <h3 className="text-xl font-bold text-blue-800 mb-4">MERLIN BESS QUOTE DRAFT</h3>
                  <p><strong>Project Name:</strong> {quoteName}</p>
                  <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                  <hr className="my-4" />
                  <h4 className="text-lg font-bold">System Configuration</h4>
                  <p><strong>Power:</strong> {calculateOptimalConfiguration().recommendedPower} MW</p>
                  <p><strong>Duration:</strong> {calculateOptimalConfiguration().recommendedDuration} hours</p>
                  <hr className="my-4" />
                  <h4 className="text-lg font-bold">Financial Analysis</h4>
                  <p><strong>Estimated Annual Savings:</strong> ${calculateOptimalConfiguration().estimatedSavings.toLocaleString()}</p>
                  <p><strong>Estimated ROI:</strong> {calculateOptimalConfiguration().estimatedROI} years</p>
                </div>

                <div className="flex justify-between">
                  <button 
                    onClick={() => setStep(3)}
                    className="bg-gray-500 text-white px-8 py-4 rounded-xl font-bold text-lg transform hover:scale-105 transition-all"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={() => {
                      const config = calculateOptimalConfiguration();
                      setPowerMW(config.recommendedPower.toString());
                      setStandbyHours(config.recommendedDuration.toString());
                      setUtilization(config.recommendedUtilization);
                      if (wizardData.currentEnergyCost) {
                        setValueKwh(wizardData.currentEnergyCost);
                      }
                      
                      if (wizardData.location) {
                        setLocation(`${wizardData.location} (6%)`);
                      }
                      
                      setShowSmartWizard(false);
                      setStep(1);
                      setWizardData({
                        industry: '', targetROI: '', budget: '', location: '',
                        peakDemand: '', currentEnergyCost: '', sustainabilityGoals: '', gridReliability: ''
                      });
                    }}
                    className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transform hover:scale-105 transition-all shadow-lg"
                  >
                    ✨ Apply AI Configuration
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
    // CALCULATIONS - MOVED TO CORRECT LOCATION
  const totalMWh = parseFloat(powerMW) * parseFloat(standbyHours);
  const pcsKW = parseFloat(powerMW) * 1000;
  const actualPcsFactor = gridMode === 'Off-grid' ? offGridPcsFactor : onGridPcsFactor;
  const adjustedPcsKw = pcsKw * actualPcsFactor;
  
  const batterySubtotal = totalMWh * 1000 * batteryKwh;
  const pcsSubtotal = pcsKW * adjustedPcsKw;
  const bosAmount = (batterySubtotal + pcsSubtotal) * bosPercent;
  const epcAmount = (batterySubtotal + pcsSubtotal + bosAmount) * epcPercent;
  const bessCapEx = batterySubtotal + pcsSubtotal + bosAmount + epcAmount;
  
  const generatorSubtotal = parseFloat(generatorMW) * 1000 * genKw;
  const solarSubtotal = parseFloat(solarMWp) * 1000 * (solarKwp / 1000);
  const windSubtotal = parseFloat(windMW) * 1000 * (windKw / 1000);
  
  const batteryTariff = bessCapEx * 0.21;
  const otherTariff = (generatorSubtotal + solarSubtotal + windSubtotal) * 0.06;
  const totalTariffs = batteryTariff + otherTariff;
  
  const grandCapEx = bessCapEx + generatorSubtotal + solarSubtotal + windSubtotal + totalTariffs;
  
  const annualEnergyMWh = totalMWh * parseFloat(utilization) * 365;
  const annualSavings = annualEnergyMWh * 1000 * parseFloat(valueKwh);
  const roiYears = grandCapEx / annualSavings;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Dynamic Motivational Header */}
      <div className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white p-4 text-center shadow-lg">
        <div className="text-xl font-bold animate-pulse">🚀 Select your power and duration to see massive savings potential!</div>
      </div>

      {/* Top Header Bar */}
      <div className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleUserProfile}
            className="bg-gradient-to-b from-purple-200 to-purple-300 text-purple-800 px-6 py-3 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all border-b-4 border-purple-400 hover:border-purple-500 text-lg"
          >
            👤 User Profile
          </button>
          <button 
            onClick={() => setShowSmartWizard(true)}
            className="bg-gradient-to-b from-purple-500 to-purple-700 text-yellow-300 px-6 py-3 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all border-b-4 border-purple-800 hover:border-purple-900 text-lg"
          >
            🪄 Smart Wizard
          </button>
        </div>
        
        <div className="text-right bg-white px-4 py-2 rounded-xl shadow-md border-2 border-blue-200">
          <div className="text-sm font-semibold text-gray-600">Current kWh Price:</div>
          <div className="text-2xl font-bold text-blue-600">${parseFloat(valueKwh).toFixed(4)}/kWh</div>
        </div>
      </div>      {/* MERLIN Hero Section */}
      <div className="mx-8 my-6 rounded-2xl p-8 shadow-2xl border-2 border-blue-400 bg-gradient-to-br from-white via-blue-50 to-blue-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-blue-600/10 animate-pulse"></div>
        
        <div className="text-center mb-6 relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="mr-8 transform hover:scale-110 transition-all duration-300">
              <img 
                src={merlinImage} 
                alt="Merlin the Wizard" 
                className="w-48 h-48 object-contain drop-shadow-2xl"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  console.error('Failed to load Merlin image:', e);
                  (e.target as HTMLImageElement).style.display = 'none';
                  ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'block';
                }}
              />
              <div className="text-9xl drop-shadow-2xl" style={{display: 'none'}}>🧙‍♂️</div>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4 drop-shadow-lg">
                Merlin BESS Quote Builder
              </h1>
              <p className="text-xl text-blue-700 italic font-semibold drop-shadow-md">"Where Magic Meets Energy Innovation"</p>
            </div>
          </div>
          
          <div className="flex justify-center items-center space-x-4 mt-8">
            <input 
              type="text" 
              placeholder="My Quote"
              value={quoteName}
              onChange={(e) => setQuoteName(e.target.value)}
              className="bg-white/90 backdrop-blur border-2 border-blue-300 px-6 py-4 rounded-xl font-semibold text-gray-700 shadow-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all text-lg w-72"
            />
            
            <button 
              className="bg-gradient-to-b from-blue-500 to-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-xl transform hover:scale-105 transition-all border-b-4 border-blue-800 hover:border-blue-900 flex items-center space-x-2 text-lg"
              onClick={handleSaveProject}
            >
              <span className="text-xl">💾</span>
              <span>Save Project</span>
            </button>
            
            <button 
              className="bg-gradient-to-b from-green-400 to-green-600 text-white px-5 py-3 rounded-xl font-bold shadow-xl transform hover:scale-105 transition-all border-b-4 border-green-700 hover:border-green-800 flex items-center space-x-2 text-lg"
              onClick={handleLoadProject}
            >
              <span className="text-xl">📂</span>
              <span>Load Project</span>
            </button>
            
            <button 
              className="bg-gradient-to-b from-purple-600 to-purple-800 text-yellow-300 px-5 py-3 rounded-xl font-bold shadow-xl transform hover:scale-105 transition-all border-b-4 border-purple-900 hover:border-black flex items-center space-x-2 text-lg"
              onClick={handlePortfolio}
            >
              <span className="text-xl">📊</span>
              <span>Portfolio</span>
            </button>
          </div>
        </div>
      </div>

      {/* SYSTEM CONFIGURATION PANEL */}
      <div className="mx-8 my-6 rounded-2xl p-8 shadow-xl border-2 border-gray-300 bg-gradient-to-b from-gray-50 to-white">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">System Configuration</h2>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Power (MW)</label>
              <input
                type="number"
                step="0.1"
                value={powerMW}
                onChange={(e) => setPowerMW(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Grid Mode</label>
              <select
                value={gridMode}
                onChange={(e) => setGridMode(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50"
              >
                <option value="On-grid">On-grid</option>
                <option value="Off-grid">Off-grid</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Use Case</label>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50"
              >
                <option value="EV Charging Stations">EV Charging Stations</option>
                <option value="Data Centers">Data Centers</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Commercial Buildings">Commercial Buildings</option>
                <option value="Utilities">Utilities</option>
              </select>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Generator (MW)</label>
              <input
                type="number"
                step="0.1"
                value={generatorMW}
                onChange={(e) => setGeneratorMW(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Solar (MWp)</label>
              <input
                type="number"
                step="0.1"
                value={solarMWp}
                onChange={(e) => setSolarMWp(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Wind (MW)</label>
              <input
                type="number"
                step="0.1"
                value={windMW}
                onChange={(e) => setWindMW(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Duration (hours)</label>
              <input
                type="number"
                step="0.1"
                value={standbyHours}
                onChange={(e) => setStandbyHours(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Value ($/kWh)</label>
              <input
                type="number"
                step="0.01"
                value={valueKwh}
                onChange={(e) => setValueKwh(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Utilization</label>
              <input
                type="number"
                step="0.01"
                value={utilization}
                onChange={(e) => setUtilization(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Warranty</label>
              <select
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50"
              >
                <option value="5 years">5 years</option>
                <option value="10 years">10 years</option>
                <option value="15 years">15 years</option>
                <option value="20 years">20 years</option>
              </select>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50"
              >
                <option value="UK (6%)">UK (6%)</option>
                <option value="US (8%)">US (8%)</option>
                <option value="Germany (4%)">Germany (4%)</option>
                <option value="Australia (10%)">Australia (10%)</option>
              </select>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">Budget</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ASSUMPTIONS PANEL */}
      <div className="mx-8 my-6 rounded-2xl p-8 shadow-xl border-2 border-blue-300 bg-gradient-to-b from-blue-50 to-white">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-blue-900 bg-clip-text text-transparent mb-8 drop-shadow-sm">
          Assumptions (editable / import overrides)
        </h2>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-blue-800 mb-2">Battery $/kWh</label>
              <input
                type="number"
                value={batteryKwh}
                onChange={(e) => setBatteryKwh(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 shadow-md text-lg font-medium text-center"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-blue-800 mb-2">BOS %</label>
              <input
                type="number"
                step="0.01"
                value={bosPercent}
                onChange={(e) => setBosPercent(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 shadow-md text-lg font-medium text-center"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-blue-800 mb-2">Off-grid PCS factor</label>
              <input
                type="number"
                step="0.01"
                value={offGridPcsFactor}
                onChange={(e) => setOffGridPcsFactor(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 shadow-md text-lg font-medium text-center"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-blue-800 mb-2">Gen $/kW</label>
              <input
                type="number"
                value={genKw}
                onChange={(e) => setGenKw(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 shadow-md text-lg font-medium text-center"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-blue-800 mb-2">Wind $/kW</label>
              <input
                type="number"
                value={windKw}
                onChange={(e) => setWindKw(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 shadow-md text-lg font-medium text-center"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-blue-800 mb-2">PCS $/kW</label>
              <input
                type="number"
                value={pcsKw}
                onChange={(e) => setPcsKw(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 shadow-md text-lg font-medium text-center"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-blue-800 mb-2">EPC %</label>
              <input
                type="number"
                step="0.01"
                value={epcPercent}
                onChange={(e) => setEpcPercent(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 shadow-md text-lg font-medium text-center"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-blue-800 mb-2">On-grid PCS factor</label>
              <input
                type="number"
                step="0.01"
                value={onGridPcsFactor}
                onChange={(e) => setOnGridPcsFactor(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 shadow-md text-lg font-medium text-center"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-blue-800 mb-2">Solar $/kWp</label>
              <input
                type="number"
                value={solarKwp}
                onChange={(e) => setSolarKwp(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 shadow-md text-lg font-medium text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* RESULTS PANEL */}
      <div className="mx-8 my-6 rounded-2xl p-8 shadow-xl border-2 border-green-300 bg-gradient-to-b from-green-50 to-white">
        <h2 className="text-3xl font-bold text-green-800 mb-8">Financial Results</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-200">
            <div className="text-2xl font-bold text-blue-600">${bessCapEx.toLocaleString()}</div>
            <div className="text-sm text-gray-600">BESS CapEx</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-200">
            <div className="text-2xl font-bold text-green-600">${grandCapEx.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total CapEx</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-purple-200">
            <div className="text-2xl font-bold text-purple-600">${annualSavings.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Annual Savings</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{roiYears.toFixed(1)} years</div>
            <div className="text-sm text-gray-600">ROI Period</div>
          </div>
        </div>
      </div>

      {/* EXPORT BUTTONS */}
      <div className="mx-8 my-6 flex justify-center space-x-4">
        <button 
          onClick={handleExportPDF}
          className="bg-gradient-to-b from-red-500 to-red-700 text-white px-8 py-4 rounded-xl font-bold shadow-xl transform hover:scale-105 transition-all border-b-4 border-red-800 hover:border-red-900 flex items-center space-x-2 text-lg"
        >
          <span className="text-xl">📄</span>
          <span>Export PDF</span>
        </button>
        
        <button 
          onClick={handleExportWord}
          className="bg-gradient-to-b from-blue-500 to-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-xl transform hover:scale-105 transition-all border-b-4 border-blue-800 hover:border-blue-900 flex items-center space-x-2 text-lg"
        >
          <span className="text-xl">📝</span>
          <span>Export Word</span>
        </button>
      </div>

      {/* MODALS */}
      {showLoadProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Load Project</h3>
            <p className="text-gray-600 mb-4">Enter project name to load:</p>
            <input 
              type="text" 
              placeholder="Project name..."
              className="w-full p-3 border rounded-lg mb-4"
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  loadProjectFromStorage((e.target as HTMLInputElement).value);
                }
              }}
            />
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowLoadProject(false)}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPortfolio && isLoggedIn && <Portfolio onClose={() => setShowPortfolio(false)} onLoadQuote={(quote) => {
        // This function will be called when a quote is loaded from the portfolio
        console.log("Loading quote from portfolio:", quote);
        // Here you would update the state of BessQuoteBuilder with the loaded quote data
        setShowPortfolio(false); // Close the portfolio modal
      }} />}

      {showUserProfile && <UserProfile 
        isLoggedIn={isLoggedIn}
        onClose={() => setShowUserProfile(false)} 
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setShowUserProfile(false);
        }}
        onLogout={() => {
          setIsLoggedIn(false);
          localStorage.removeItem('auth_token');
          setShowUserProfile(false);
        }}
      />}

      {showAuthModal && <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)} 
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setShowAuthModal(false);
          // After login, automatically show the portfolio
          setShowPortfolio(true); 
        }} 
      />}

      {/* SMART WIZARD MODAL - PLACED AT THE VERY END */}
      {showSmartWizard && <SmartWizardModal />}
      
    </div>
  );
}


