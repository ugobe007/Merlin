import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from "docx";
import React, { useState } from 'react';
import UserProfile from './UserProfile';

export default function BessQuoteBuilder() {
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [quoteName, setQuoteName] = useState('');
  const [showCustomPower, setShowCustomPower] = useState(false);
  const [customPowerValue, setCustomPowerValue] = useState('');
  const [customPowerUnit, setCustomPowerUnit] = useState('kwh');
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  // Panel 2 dropdown states
  const [power, setPower] = useState('');
  const [standbyHours, setStandbyHours] = useState('');
  const [gridMode, setGridMode] = useState('');
  const [useCase, setUseCase] = useState('');
  const [generator, setGenerator] = useState('');
  const [valueKwh, setValueKwh] = useState('');
  const [utilization, setUtilization] = useState('');
  const [warranty, setWarranty] = useState('');
  const [location, setLocation] = useState('');
  const [pcsSeparate, setPcsSeparate] = useState('');
  const [budgetKnown, setBudgetKnown] = useState('');
  const [budget, setBudget] = useState('');

  // Panel 3 - Assumptions
  const [batteryKwh, setBatteryKwh] = useState(150);
  const [bosPercent, setBosPercent] = useState(15);
  const [offGridPcsFactor, setOffGridPcsFactor] = useState(1.25);
  const [genKwh, setGenKwh] = useState(0.25);
  const [windKwh, setWindKwh] = useState(0.06);
  const [pcsKw, setPcsKw] = useState(110);
  const [epcPercent, setEpcPercent] = useState(25);
  const [onGridPcsFactor, setOnGridPcsFactor] = useState(1.0);
  const [solarKwh, setSolarKwh] = useState(0.07);

  // Industry Standards function
  const setIndustryStandards = () => {
    setBatteryKwh(140);
    setBosPercent(10);
    setOffGridPcsFactor(1.25);
    setGenKwh(0.25);
    setWindKwh(0.06);
    setPcsKw(110);
    setEpcPercent(25);
    setOnGridPcsFactor(1.0);
    setSolarKwh(0.07);
  };

  // Generate power options dynamically
  const generatePowerOptions = () => {
    const options = [];
    
    // 100kW to 1MW in 100kW increments
    for (let i = 100; i <= 1000; i += 100) {
      options.push({
        value: `${i}kwh`,
        label: `${i} kWh`
      });
    }
    
    // 1MW to 100MW in 1MW increments (reduced for performance)
    for (let i = 1; i <= 100; i += 1) {
      options.push({
        value: `${i}mwh`,
        label: `${i} MWh`
      });
    }
    
    // Large scale options
    const largeScale = [200, 300, 400, 500, 750, 1000];
    largeScale.forEach(mw => {
      options.push({
        value: `${mw}mwh`,
        label: `${mw} MWh${mw >= 1000 ? ' (1 GWh)' : ''}`
      });
    });
    
    return options;
  };

  // Dynamic motivational messaging
  const getMotivationalMessage = () => {
    const powerValue = parseFloat(power?.replace(/[^\d.]/g, '') || '0');
    const hoursValue = parseInt(standbyHours || '0');
    
    if (!power || !standbyHours) {
      return "🚀 Select your power and duration to see massive savings potential!";
    }
    
    const estimatedSavings = powerValue * hoursValue * 365 * 0.12 * 0.8;
    
    if (estimatedSavings > 10000000) {
      return `💰 MASSIVE OPPORTUNITY: Over $${Math.round(estimatedSavings/1000000)}M+ annual savings possible!`;
    } else if (estimatedSavings > 1000000) {
      return `💎 EXCELLENT: $${Math.round(estimatedSavings/1000000)}M+ annual savings potential!`;
    } else {
      return `✨ SOLID ROI: $${Math.round(estimatedSavings/1000)}K+ savings waiting for you!`;
    }
  };

  // Handle custom power input
  const handleCustomPowerSubmit = () => {
    if (customPowerValue) {
      const value = `${customPowerValue}${customPowerUnit}`;
      setPower(value);
      setShowCustomPower(false);
      setCustomPowerValue('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Dynamic Motivational Header */}
      <div className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white p-4 text-center">
        <div className="text-xl font-bold animate-pulse">{getMotivationalMessage()}</div>
      </div>

      {/* Top Header Bar */}
      <div className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowUserProfile(true)}
            className="bg-gradient-to-b from-purple-200 to-purple-300 text-purple-800 px-8 py-4 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all border-b-4 border-purple-400 hover:border-purple-500 text-xl"
          >
            👤 User Profile
          </button>
          <button className="bg-gradient-to-b from-purple-500 to-purple-700 text-yellow-300 px-8 py-4 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all border-b-4 border-purple-800 hover:border-purple-900 text-xl">
            🪄 Smart Wizard
          </button>
        </div>
        
        <div className="text-right bg-white px-4 py-2 rounded-xl shadow-md border-2 border-blue-200">
          <div className="text-sm font-semibold text-gray-600">Current kWh Price:</div>
          <div className="text-2xl font-bold text-blue-600">$0.1200/kWh</div>
        </div>
      </div>

      {/* Panel 1: Main Merlin Panel */}
      <div className="mx-8 my-6 rounded-3xl p-12 text-center shadow-2xl border-4 border-blue-300" 
           style={{background: 'linear-gradient(to bottom, #93c5fd, #dbeafe, #f0f9ff)'}}>
        
        <div className="flex justify-center mb-8">
          <img 
            src="/images/new_Merlin.png" 
            alt="Merlin the Wizard" 
            className="w-64 h-64 object-contain"
            style={{
              filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.2))',
              transform: 'translateY(-10px)'
            }}
          />
        </div>
        
        <h1 className="text-6xl font-bold text-blue-700 mb-4" 
            style={{textShadow: '3px 3px 6px rgba(0,0,0,0.2)'}}>
          Merlin BESS Quote Builder
        </h1>
        <p className="text-2xl text-gray-700 italic mb-10 font-medium">"Magic meets energy."</p>
        
        <div className="flex justify-center space-x-8">
          <div className="flex flex-col items-center">
            <input 
              type="text" 
              placeholder="Enter quote name..."
              value={quoteName}
              onChange={(e) => setQuoteName(e.target.value)}
              className="bg-gradient-to-b from-white to-gray-100 border-4 border-gray-300 px-6 py-3 rounded-2xl font-semibold text-gray-700 mb-3 w-52 shadow-lg focus:border-blue-400 focus:outline-none transition-all text-lg"
              style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'}}
            />
            <span className="text-xl font-bold text-gray-700">My Quote</span>
          </div>
          
          <button 
            className="bg-gradient-to-b from-blue-400 to-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transform hover:scale-105 transition-all border-b-6 border-blue-700 hover:border-blue-800 flex flex-col items-center min-w-[120px]"
            onClick={() => setShowSavePrompt(true)}
          >
            <span className="text-3xl mb-1">💾</span>
            <span className="text-xl">Save Project</span>
          </button>
          
          <button className="bg-gradient-to-b from-purple-300 to-purple-500 text-purple-900 px-6 py-3 rounded-2xl font-bold shadow-xl transform hover:scale-105 transition-all border-b-6 border-purple-600 hover:border-purple-700 flex flex-col items-center min-w-[120px]">
            <span className="text-3xl mb-1">📂</span>
            <span className="text-xl">Load Project</span>
          </button>
          
          <button className="bg-gradient-to-b from-purple-600 to-purple-800 text-yellow-300 px-6 py-3 rounded-2xl font-bold shadow-xl transform hover:scale-105 transition-all border-b-6 border-purple-900 hover:border-black flex flex-col items-center min-w-[120px]">
            <span className="text-3xl mb-1">📊</span>
            <span className="text-xl">Portfolio</span>
          </button>
        </div>
      </div>

      {/* Panel 2: System Configuration */}
      <div className="mx-8 my-6 rounded-3xl p-12 shadow-2xl border-4 border-gray-300 bg-white">
        <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center" 
            style={{textShadow: '2px 2px 4px rgba(0,0,0,0.1)'}}>
          🔧 System Configuration
        </h2>
        
        <div className="grid grid-cols-4 gap-6">
          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">Energy Storage Capacity</label>
            <div className="space-y-2">
              <select 
                value={showCustomPower ? 'custom' : power}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setShowCustomPower(true);
                  } else {
                    setPower(e.target.value);
                    setShowCustomPower(false);
                  }
                }}
                className="bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 px-4 py-3 rounded-2xl font-bold text-gray-800 shadow-xl focus:border-blue-400 focus:outline-none transition-all text-base"
                style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)'}}
              >
                <option value="">Select Capacity...</option>
                {generatePowerOptions().map((option, index) => (
                  <option key={index} value={option.value}>{option.label}</option>
                ))}
                <option value="custom">✏️ Enter Custom Amount</option>
              </select>
              
              {showCustomPower && (
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={customPowerValue}
                    onChange={(e) => setCustomPowerValue(e.target.value)}
                    className="flex-1 bg-white border-2 border-blue-300 px-3 py-2 rounded-xl"
                  />
                  <select
                    value={customPowerUnit}
                    onChange={(e) => setCustomPowerUnit(e.target.value)}
                    className="bg-white border-2 border-blue-300 px-3 py-2 rounded-xl"
                  >
                    <option value="kwh">kWh</option>
                    <option value="mwh">MWh</option>
                    <option value="gwh">GWh</option>
                  </select>
                  <button
                    onClick={handleCustomPowerSubmit}
                    className="bg-blue-500 text-white px-3 py-2 rounded-xl hover:bg-blue-600"
                  >
                    ✓
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">Duration Hours</label>
            <select 
              value={standbyHours}
              onChange={(e) => setStandbyHours(e.target.value)}
              className="bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 px-4 py-3 rounded-2xl font-bold text-gray-800 shadow-xl focus:border-blue-400 focus:outline-none transition-all text-base"
              style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)'}}
            >
              <option value="">Select Duration...</option>
              <option value="0.5">30 minutes</option>
              <option value="1">1 Hour</option>
              <option value="2">2 Hours</option>
              <option value="4">4 Hours (Standard)</option>
              <option value="6">6 Hours</option>
              <option value="8">8 Hours</option>
              <option value="12">12 Hours</option>
              <option value="24">24 Hours</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">Grid Connection</label>
            <select 
              value={gridMode}
              onChange={(e) => setGridMode(e.target.value)}
              className="bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 px-4 py-3 rounded-2xl font-bold text-gray-800 shadow-xl focus:border-blue-400 focus:outline-none transition-all text-base"
              style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)'}}
            >
              <option value="">Select Connection...</option>
              <option value="on-grid">Grid-Connected (Lower Cost)</option>
              <option value="off-grid">Off-Grid (Premium)</option>
              <option value="hybrid">Hybrid Grid-Tie</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">Application</label>
            <select 
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 px-4 py-3 rounded-2xl font-bold text-gray-800 shadow-xl focus:border-blue-400 focus:outline-none transition-all text-base"
              style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)'}}
            >
              <option value="">Select Application...</option>
              <option value="ev-charging">⚡ EV Charging Stations</option>
              <option value="data-centers">🖥️ Data Centers</option>
              <option value="manufacturing">🏭 Manufacturing Plants</option>
              <option value="hospitals">🏥 Hospitals & Healthcare</option>
              <option value="hotels">🏨 Hotels & Resorts</option>
              <option value="airports">✈️ Airports</option>
              <option value="solar-farms">☀️ Solar + Storage</option>
              <option value="wind-farms">💨 Wind + Storage</option>
              <option value="microgrids">🔌 Microgrids</option>
              <option value="industrial">⚙️ Heavy Industry</option>
              <option value="commercial">🏢 Commercial Buildings</option>
              <option value="utilities">⚡ Utility Scale</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">Renewable Source</label>
            <select 
              value={generator}
              onChange={(e) => setGenerator(e.target.value)}
              className="bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 px-4 py-3 rounded-2xl font-bold text-gray-800 shadow-xl focus:border-blue-400 focus:outline-none transition-all text-base"
              style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)'}}
            >
              <option value="">Select Source...</option>
              <option value="solar-mwp">☀️ Solar PV (DC Coupled)</option>
              <option value="wind-mw">💨 Wind Turbines</option>
              <option value="hybrid">🔄 Solar + Wind Hybrid</option>
              <option value="grid-only">🔌 Grid Only</option>
              <option value="none">📦 Storage Only</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">Energy Value ($/kWh)</label>
            <input 
              type="number"
              step="0.01"
              placeholder="0.12"
              value={valueKwh}
              onChange={(e) => setValueKwh(e.target.value)}
              className="bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 px-4 py-3 rounded-2xl font-bold text-gray-800 shadow-xl focus:border-blue-400 focus:outline-none transition-all text-base"
              style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)'}}
            />
            <small className="text-xs text-gray-500 mt-1">Peak demand rate or arbitrage value</small>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">Capacity Factor</label>
            <input 
              type="number"
              step="0.1"
              min="0"
              max="1"
              placeholder="0.8"
              value={utilization}
              onChange={(e) => setUtilization(e.target.value)}
              className="bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 px-4 py-3 rounded-2xl font-bold text-gray-800 shadow-xl focus:border-blue-400 focus:outline-none transition-all text-base"
              style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)'}}
            />
            <small className="text-xs text-gray-500 mt-1">Daily utilization (0.8 = 80%)</small>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">Warranty Period</label>
            <select 
              value={warranty}
              onChange={(e) => setWarranty(e.target.value)}
              className="bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 px-4 py-3 rounded-2xl font-bold text-gray-800 shadow-xl focus:border-blue-400 focus:outline-none transition-all text-base"
              style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)'}}
            >
              <option value="">Select Warranty...</option>
              <option value="10-years">10 years (Standard)</option>
              <option value="15-years">15 years (+5%)</option>
              <option value="20-years">20 years (+10%)</option>
              <option value="25-years">25 years (+15%)</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">Project Location</label>
            <select 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 px-4 py-3 rounded-2xl font-bold text-gray-800 shadow-xl focus:border-blue-400 focus:outline-none transition-all text-base"
              style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)'}}
            >
              <option value="">Select Location...</option>
              <option value="us">🇺🇸 United States</option>
              <option value="canada">🇨🇦 Canada</option>
              <option value="uk">🇬🇧 United Kingdom</option>
              <option value="germany">🇩🇪 Germany</option>
              <option value="australia">🇦🇺 Australia</option>
              <option value="japan">🇯🇵 Japan</option>
              <option value="china">🇨🇳 China</option>
              <option value="other">🌍 Other</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">PCS Configuration</label>
            <select 
              value={pcsSeparate}
              onChange={(e) => setPcsSeparate(e.target.value)}
              className="bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 px-4 py-3 rounded-2xl font-bold text-gray-800 shadow-xl focus:border-blue-400 focus:outline-none transition-all text-base"
              style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)'}}
            >
              <option value="">Select Config...</option>
              <option value="integrated">🔗 Integrated (Standard)</option>
              <option value="separate">📦 Separate PCS (+15%)</option>
              <option value="redundant">🔄 Redundant PCS (+25%)</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">Budget Range</label>
            <select 
              value={budgetKnown}
              onChange={(e) => {
                setBudgetKnown(e.target.value);
                const budgetMap = {
                  'under-1m': '500000',
                  '1m-5m': '3000000',
                  '5m-10m': '7500000',
                  '10m-50m': '30000000',
                  '50m-100m': '75000000',
                  'over-100m': '150000000'
                };
                if (budgetMap[e.target.value]) {
                  setBudget(budgetMap[e.target.value]);
                }
              }}
              className="bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 px-4 py-3 rounded-2xl font-bold text-gray-800 shadow-xl focus:border-blue-400 focus:outline-none transition-all text-base"
              style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)'}}
            >
              <option value="">Select Budget...</option>
              <option value="under-1m">💰 Under $1M</option>
              <option value="1m-5m">💎 $1M - $5M</option>
              <option value="5m-10m">🏆 $5M - $10M</option>
              <option value="10m-50m">🚀 $10M - $50M</option>
              <option value="50m-100m">⭐ $50M - $100M</option>
              <option value="over-100m">👑 $100M+</option>
              <option value="custom">✏️ Custom Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Panel 3: ASSUMPTIONS */}
      <div className="mx-8 my-6 rounded-3xl p-12 shadow-2xl border-4 border-blue-300 bg-gradient-to-b from-blue-50 to-white">
        <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center" 
            style={{textShadow: '2px 2px 4px rgba(0,0,0,0.1)'}}>
          📊 Cost Assumptions
        </h2>
        
        <div className="flex justify-center mb-8">
          <button 
            onClick={setIndustryStandards}
            className="bg-gradient-to-b from-gray-400 to-gray-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl transform hover:scale-105 transition-all border-b-4 border-gray-700 hover:border-gray-800"
          >
            🏭 Set to Industry Standards
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">Battery Cost ($/kWh)</label>
            <div className="flex items-center bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 rounded-2xl shadow-xl">
              <button 
                onClick={() => setBatteryKwh(Math.max(50, batteryKwh - 10))}
                className="bg-gradient-to-b from-blue-300 to-blue-600 text-white px-2 py-2 rounded-l-xl text-sm font-bold shadow hover:scale-105 transition-all"
              >
                ▼
              </button>
              <input 
                type="number"
                value={batteryKwh}
                onChange={(e) => setBatteryKwh(Number(e.target.value))}
                className="flex-1 bg-transparent px-4 py-3 font-bold text-gray-800 text-center focus:outline-none text-base"
              />
              <button 
                onClick={() => setBatteryKwh(batteryKwh + 10)}
                className="bg-gradient-to-b from-blue-300 to-blue-600 text-white px-2 py-2 rounded-r-xl text-sm font-bold shadow hover:scale-105 transition-all"
              >
                ▲
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">BOS Cost (%)</label>
            <div className="flex items-center bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 rounded-2xl shadow-xl">
              <button 
                onClick={() => setBosPercent(Math.max(1, bosPercent - 1))}
                className="bg-gradient-to-b from-blue-300 to-blue-600 text-white px-2 py-2 rounded-l-xl text-sm font-bold shadow hover:scale-105 transition-all"
              >
                ▼
              </button>
              <input 
                type="number"
                value={bosPercent}
                onChange={(e) => setBosPercent(Number(e.target.value))}
                className="flex-1 bg-transparent px-4 py-3 font-bold text-gray-800 text-center focus:outline-none text-base"
              />
              <button 
                onClick={() => setBosPercent(bosPercent + 1)}
                className="bg-gradient-to-b from-blue-300 to-blue-600 text-white px-2 py-2 rounded-r-xl text-sm font-bold shadow hover:scale-105 transition-all"
              >
                ▲
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">PCS Cost ($/kW)</label>
            <div className="flex items-center bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 rounded-2xl shadow-xl">
              <button 
                onClick={() => setPcsKw(Math.max(50, pcsKw - 10))}
                className="bg-gradient-to-b from-blue-300 to-blue-600 text-white px-2 py-2 rounded-l-xl text-sm font-bold shadow hover:scale-105 transition-all"
              >
                ▼
              </button>
              <input 
                type="number"
                value={pcsKw}
                onChange={(e) => setPcsKw(Number(e.target.value))}
                className="flex-1 bg-transparent px-4 py-3 font-bold text-gray-800 text-center focus:outline-none text-base"
              />
              <button 
                onClick={() => setPcsKw(pcsKw + 10)}
                className="bg-gradient-to-b from-blue-300 to-blue-600 text-white px-2 py-2 rounded-r-xl text-sm font-bold shadow hover:scale-105 transition-all"
              >
                ▲
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">EPC Margin (%)</label>
            <div className="flex items-center bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 rounded-2xl shadow-xl">
              <button 
                onClick={() => setEpcPercent(Math.max(5, epcPercent - 1))}
                className="bg-gradient-to-b from-blue-300 to-blue-600 text-white px-2 py-2 rounded-l-xl text-sm font-bold shadow hover:scale-105 transition-all"
              >
                ▼
              </button>
              <input 
                type="number"
                value={epcPercent}
                onChange={(e) => setEpcPercent(Number(e.target.value))}
                className="flex-1 bg-transparent px-4 py-3 font-bold text-gray-800 text-center focus:outline-none text-base"
              />
              <button 
                onClick={() => setEpcPercent(epcPercent + 1)}
                className="bg-gradient-to-b from-blue-300 to-blue-600 text-white px-2 py-2 rounded-r-xl text-sm font-bold shadow hover:scale-105 transition-all"
              >
                ▲
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">Solar Cost ($/Wp)</label>
            <div className="flex items-center bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 rounded-2xl shadow-xl">
              <button 
                onClick={() => setSolarKwh(Math.max(0.01, Number((solarKwh - 0.01).toFixed(2))))}
                className="bg-gradient-to-b from-blue-300 to-blue-600 text-white px-2 py-2 rounded-l-xl text-sm font-bold shadow hover:scale-105 transition-all"
              >
                ▼
              </button>
              <input 
                type="number"
                step="0.01"
                value={solarKwh}
                onChange={(e) => setSolarKwh(Number(e.target.value))}
                className="flex-1 bg-transparent px-4 py-3 font-bold text-gray-800 text-center focus:outline-none text-base"
              />
              <button 
                onClick={() => setSolarKwh(Number((solarKwh + 0.01).toFixed(2)))}
                className="bg-gradient-to-b from-blue-300 to-blue-600 text-white px-2 py-2 rounded-r-xl text-sm font-bold shadow hover:scale-105 transition-all"
              >
                ▲
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-lg font-bold text-gray-700 mb-2">Wind Cost ($/W)</label>
            <div className="flex items-center bg-gradient-to-b from-blue-100 to-blue-200 border-4 border-blue-300 rounded-2xl shadow-xl">
              <button 
                onClick={() => setWindKwh(Math.max(0.01, Number((windKwh - 0.01).toFixed(2))))}
                className="bg-gradient-to-b from-blue-300 to-blue-600 text-white px-2 py-2 rounded-l-xl text-sm font-bold shadow hover:scale-105 transition-all"
              >
                ▼
              </button>
              <input 
                type="number"
                step="0.01"
                value={windKwh}
                onChange={(e) => setWindKwh(Number(e.target.value))}
                className="flex-1 bg-transparent px-4 py-3 font-bold text-gray-800 text-center focus:outline-none text-base"
              />
              <button 
                onClick={() => setWindKwh(Number((windKwh + 0.01).toFixed(2)))}
                className="bg-gradient-to-b from-blue-300 to-blue-600 text-white px-2 py-2 rounded-r-xl text-sm font-bold shadow hover:scale-105 transition-all"
              >
                ▲
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Panel 4: DYNAMIC BESS QUOTE */}
      <div className="mx-8 my-6 rounded-3xl p-12 shadow-2xl border-4 border-blue-400 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center mb-6">
          <div className="bg-blue-500 text-white p-3 rounded-2xl mr-4">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-gray-800" style={{textShadow: "2px 2px 4px rgba(0,0,0,0.1)"}}>
              BESS QUOTE DRAFT
            </h2>
            <p className="text-lg text-gray-600">Real-Time Cost Analysis</p>
          </div>
        </div>

        {(() => {
          // INDUSTRY CALCULATIONS
          const powerMWh = power ? parseFloat(power.replace(/[^\d.]/g, '')) / (power.includes('mwh') ? 1 : power.includes('gwh') ? 0.001 : 1000) : 0;
          const durationHours = parseFloat(standbyHours) || 4;
          const totalMWh = powerMWh * durationHours;
          const totalKWh = totalMWh * 1000;
          const pcsKW = totalKWh / durationHours;
          
          // Cost calculations
          const batteryCost = totalKWh * batteryKwh;
          const pcsCost = pcsKW * pcsKw;
          const bosCost = (batteryCost + pcsCost) * (bosPercent / 100);
          const equipmentSubtotal = batteryCost + pcsCost + bosCost;
          const epcCost = equipmentSubtotal * (epcPercent / 100);
          const systemSubtotal = equipmentSubtotal + epcCost;
          
          // Location and config adjustments
          const locationMultipliers = {
            'us': 1.0, 'canada': 1.05, 'uk': 1.15, 'germany': 1.12, 
            'australia': 1.18, 'japan': 1.20, 'china': 0.95, 'other': 1.25
          };
          const locationMultiplier = locationMultipliers[location] || 1.0;
          
          const configMultipliers = {
            'integrated': 1.0, 'separate': 1.15, 'redundant': 1.25
          };
          const configMultiplier = configMultipliers[pcsSeparate] || 1.0;
          
          // Renewable costs
          let renewableCost = 0;
          if (generator === 'solar-mwp') {
            renewableCost = pcsKW * solarKwh * 1000;
          } else if (generator === 'wind-mw') {
            renewableCost = pcsKW * windKwh * 1000;
          } else if (generator === 'hybrid') {
            renewableCost = pcsKW * (solarKwh + windKwh) * 500;
          }
          
          // Warranty adjustment
          const warrantyMultipliers = {
            '10-years': 1.0, '15-years': 1.05, '20-years': 1.10, '25-years': 1.15
          };
          const warrantyMultiplier = warrantyMultipliers[warranty] || 1.0;
          
          const totalSystemCost = (systemSubtotal + renewableCost) * locationMultiplier * configMultiplier * warrantyMultiplier;
          
          // Financial analysis
          const energyValue = parseFloat(valueKwh) || 0.12;
          const capacityFactor = parseFloat(utilization) || 0.8;
          const cyclesPerDay = capacityFactor;
          const annualCycles = cyclesPerDay * 365;
          const annualEnergyMWh = totalMWh * annualCycles;
          const annualRevenue = annualEnergyMWh * 1000 * energyValue;
          
          const simplePayback = totalSystemCost / annualRevenue;
          const irr = ((annualRevenue / totalSystemCost) - 1) * 100;
          
          const budgetValue = parseFloat(budget) || 0;
          const budgetDelta = budgetValue - totalSystemCost;
          const budgetUtilization = budgetValue > 0 ? (totalSystemCost / budgetValue * 100) : 0;
          
          // Dynamic pricing display based on system size
          const costPerKWh = totalSystemCost / totalKWh;
          const costPerMWh = costPerKWh * 1000;
          const displayPrice = totalMWh >= 10 ? `$${costPerMWh.toLocaleString()}/MWh` : `$${costPerKWh.toLocaleString()}/kWh`;
          
          return (
            <div className="space-y-6">
              {/* Quick Stats Bar */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold">{totalMWh.toFixed(1)} MWh</div>
                  <div className="text-sm">Energy Capacity</div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold">{(pcsKW/1000).toFixed(1)} MW</div>
                  <div className="text-sm">Power Rating</div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold">${(totalSystemCost/1000000).toFixed(1)}M</div>
                  <div className="text-sm">Total Investment</div>
                </div>
                <div className="bg-gradient-to-r from-sky-400 to-sky-600 text-white p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold">{simplePayback.toFixed(1)} yr</div>
                  <div className="text-sm">Payback Period</div>
                </div>
              </div>
              
              {/* Cost per unit display */}
              <div className="bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900 p-6 rounded-2xl text-center">
                <div className="text-3xl font-bold">{displayPrice}</div>
                <div className="text-lg">System Cost per {totalMWh >= 10 ? 'MWh' : 'kWh'} of Storage</div>
              </div>
              
              {/* Detailed Breakdown */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 border-b-2 border-blue-300 pb-2">Cost Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Battery System ({totalKWh.toLocaleString()} kWh):</span>
                      <span className="font-bold text-green-600">${batteryCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Power Conversion ({(pcsKW/1000).toFixed(1)} MW):</span>
                      <span className="font-bold text-green-600">${pcsCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Balance of System ({bosPercent}%):</span>
                      <span className="font-bold text-green-600">${bosCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>EPC & Installation ({epcPercent}%):</span>
                      <span className="font-bold text-green-600">${epcCost.toLocaleString()}</span>
                    </div>
                    {renewableCost > 0 && (
                      <div className="flex justify-between">
                        <span>Renewable Generation:</span>
                        <span className="font-bold text-green-600">${renewableCost.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t-2 border-gray-300 pt-2">
                      <span className="font-bold">Total System Cost:</span>
                      <span className="font-bold text-blue-600">${totalSystemCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 border-b-2 border-blue-300 pb-2">Financial Analysis</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Annual Energy Throughput:</span>
                      <span className="font-bold">{annualEnergyMWh.toFixed(0)} MWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual Revenue Potential:</span>
                      <span className="font-bold text-green-600">${annualRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Simple Payback Period:</span>
                      <span className={`font-bold ${simplePayback <= 5 ? 'text-green-600' : simplePayback <= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {simplePayback.toFixed(1)} years
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated IRR:</span>
                      <span className={`font-bold ${irr >= 15 ? 'text-green-600' : irr >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {irr.toFixed(1)}%
                      </span>
                    </div>
                    {budgetValue > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span>Budget Utilization:</span>
                          <span className={`font-bold ${budgetUtilization <= 100 ? 'text-green-600' : 'text-red-600'}`}>
                            {budgetUtilization.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Budget Remaining:</span>
                          <span className={`font-bold ${budgetDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${budgetDelta.toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Performance Indicators */}
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 rounded-2xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black mb-2">
                    💰 PROJECTED LIFETIME VALUE: ${(annualRevenue * 20).toLocaleString()}
                  </div>
                  <div className="text-lg text-black">
                    Over 20 years | {(annualCycles * 20).toLocaleString()} total cycles | {((annualRevenue * 20) / totalSystemCost).toFixed(1)}x return
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Export Buttons */}
      <div className="mx-8 my-6 flex justify-center space-x-4">
        <button 
          onClick={() => {
            import('docx').then(({ Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType }) => {
              
              // Get dynamic values from the calculator
              const powerMWh = power ? parseFloat(power.replace(/[^\d.]/g, '')) / (power.includes('mwh') ? 1 : power.includes('gwh') ? 0.001 : 1000) : 0;
              const durationHours = parseFloat(standbyHours) || 4;
              const totalMWh = powerMWh * durationHours;
              const totalKWh = totalMWh * 1000;
              const pcsKW = totalKWh / durationHours;
              
              // Cost calculations
              const batteryCost = totalKWh * batteryKwh;
              const pcsCost = pcsKW * pcsKw;
              const bosCost = (batteryCost + pcsCost) * (bosPercent / 100);
              const equipmentSubtotal = batteryCost + pcsCost + bosCost;
              const epcCost = equipmentSubtotal * (epcPercent / 100);
              const totalSystemCost = equipmentSubtotal + epcCost;
              
              // Financial calculations
              const energyValue = parseFloat(valueKwh) || 0.12;
              const capacityFactor = parseFloat(utilization) || 0.8;
              const annualEnergyMWh = totalMWh * capacityFactor * 365;
              const annualSavings = annualEnergyMWh * 1000 * energyValue;
              const paybackPeriod = totalSystemCost / annualSavings;
              
              const doc = new Document({
                sections: [{
                  properties: {},
                  children: [
                    // Header
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "BATTERY ENERGY STORAGE SYSTEM",
                          bold: true,
                          size: 24,
                          color: "2563EB"
                        })
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 200 }
                    }),
                    
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "COMMERCIAL QUOTE PROPOSAL - MERLIN",
                          bold: true,
                          size: 18,
                          color: "1F2937"
                        })
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 400 }
                    }),
                    
                    // Project Information
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "PROJECT INFORMATION",
                          bold: true,
                          size: 16,
                          color: "1F2937"
                        })
                      ],
                      spacing: { before: 400, after: 200 }
                    }),
                    
                    new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Client Name:", bold: true })] })],
          width: { size: 30, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: quoteName || "TBD" })] })],
          width: { size: 70, type: WidthType.PERCENTAGE }
        })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Project Name:", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: quoteName || "Untitled Project" })] })] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Quote Date:", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Date().toLocaleDateString() })] })] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Location:", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: location || "TBD" })] })] })
      ]
    })
  ]
}),
                    
                    // Executive Summary
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "EXECUTIVE SUMMARY",
                          bold: true,
                          size: 16,
                          color: "1F2937"
                        })
                      ],
                      spacing: { before: 600, after: 200 }
                    }),
                    
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "This proposal provides a comprehensive Battery Energy Storage System (BESS) solution designed to meet your specific energy requirements and deliver exceptional return on investment.",
                          size: 22
                        })
                      ],
                      spacing: { after: 300 }
                    }),
                    
                    // Summary Table
                    new Table({
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "System Capacity", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${totalKWh.toLocaleString()} kWh` })] })] })
                          ]
                        }),
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Power Rating", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${(pcsKW/1000).toFixed(1)} MW` })] })] })
                          ]
                        }),
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Investment", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${totalSystemCost.toLocaleString()}` })] })] })
                          ]
                        }),
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Annual Savings", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${annualSavings.toLocaleString()}` })] })] })
                          ]
                        }),
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Payback Period", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${paybackPeriod.toFixed(2)} years` })] })] })
                          ]
                        })
                      ]
                    }),
                    
                    // Technical Specifications
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "TECHNICAL SPECIFICATIONS & PRICING",
                          bold: true,
                          size: 16,
                          color: "1F2937"
                        })
                      ],
                      spacing: { before: 600, after: 200 }
                    }),
                    
                    new Table({
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "COMPONENT", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SPECIFICATION", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "COST (USD)", bold: true })] })] })
                          ]
                        }),
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Battery System" })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${totalKWh.toLocaleString()} kWh LFP Chemistry` })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${batteryCost.toLocaleString()}` })] })] })
                          ]
                        }),
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Power Conversion" })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${(pcsKW/1000).toFixed(1)} MW Bi-directional Inverter` })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${pcsCost.toLocaleString()}` })] })] })
                          ]
                        }),
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Balance of System" })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Enclosures, Cabling, Protection" })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${bosCost.toLocaleString()}` })] })] })
                          ]
                        }),
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Engineering & Installation" })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "EPC Services, Commissioning" })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${epcCost.toLocaleString()}` })] })] })
                          ]
                        }),
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "GRAND TOTAL", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Complete Turnkey Solution" })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${totalSystemCost.toLocaleString()}`, bold: true })] })] }),
                          ]
                        })
                      ]
                    }),
                    
                    // Financial Analysis
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "FINANCIAL ANALYSIS & ROI PROJECTION",
                          bold: true,
                          size: 16,
                          color: "1F2937"
                        })
                      ],
                      spacing: { before: 600, after: 200 }
                    }),
                    
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Based on current energy costs of $${energyValue}/kWh and system utilization of ${(capacityFactor * 100).toFixed(0)}%, this BESS solution provides substantial financial benefits with a payback period of ${paybackPeriod.toFixed(1)} years.`,
                          size: 22
                        })
                      ],
                      spacing: { after: 300 }
                    }),
                    
                    new Table({
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Annual Energy Throughput", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${annualEnergyMWh.toFixed(0)} MWh` })] })] })
                          ]
                        }),
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Annual Cost Savings", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${annualSavings.toLocaleString()}` })] })] })
                          ]
                        }),
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "10-Year Savings", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${(annualSavings * 10).toLocaleString()}` })] })] })
                          ]
                        }),
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "20-Year Savings", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${(annualSavings * 20).toLocaleString()}` })] })] })
                          ]
                        }),
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Net Present Value (20yr)", bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${((annualSavings * 20) - totalSystemCost).toLocaleString()}` })] })] })
                          ]
                        })
                      ]
                    }),
                    
                    // Next Steps
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "NEXT STEPS & PROJECT TIMELINE",
                          bold: true,
                          size: 16,
                          color: "1F2937"
                        })
                      ],
                      spacing: { before: 600, after: 200 }
                    }),
                    
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "To proceed with this BESS project, we recommend the following timeline:",
                          size: 22
                        })
                      ],
                      spacing: { after: 200 }
                    }),
                    
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Phase 1 - Project Approval & Design (4-6 weeks)",
                          bold: true
                        })
                      ],
                      spacing: { after: 100 }
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "• Contract execution and project kick-off\n• Detailed site assessment and engineering\n• Final system design and equipment specification\n• Permitting and interconnection application"
                        })
                      ],
                      spacing: { after: 200 }
                    }),
                    
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Phase 2 - Procurement & Construction (12-16 weeks)",
                          bold: true
                        })
                      ],
                      spacing: { after: 100 }
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "• Equipment procurement and manufacturing\n• Site preparation and infrastructure\n• System installation and integration\n• Testing and commissioning"
                        })
                      ],
                      spacing: { after: 200 }
                    }),
                    
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Phase 3 - Commissioning & Operations (2-4 weeks)",
                          bold: true
                        })
                      ],
                      spacing: { after: 100 }
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "• System testing and performance validation\n• Utility interconnection and approval\n• Training and documentation handover\n• Commercial operation date"
                        })
                      ],
                      spacing: { after: 400 }
                    }),
                    
                    // Contact Information
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "CONTACT INFORMATION",
                          bold: true,
                          size: 16,
                          color: "1F2937"
                        })
                      ],
                      spacing: { before: 400, after: 200 }
                    }),
                    
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "For questions about this proposal or to proceed with the project, please contact:",
                          size: 22
                        })
                      ],
                      spacing: { after: 200 }
                    }),
                    
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Merlin BESS Solutions\nEmail: info@merlin-bess.com\nPhone: +1 (555) 123-BESS\nWebsite: www.merlin-bess.com",
                          size: 20
                        })
                      ],
                      spacing: { after: 400 }
                    }),
                    
                    // Footer
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "This proposal is valid for 30 days from the date of issue. Pricing is subject to change based on final engineering and site conditions.",
                          size: 18,
                          italics: true,
                          color: "6B7280"
                        })
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 400 }
                    })
                  ]
                }]
              });

              Packer.toBlob(doc).then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `BESS_Quote_${quoteName || 'Proposal'}_${new Date().toISOString().split('T')[0]}.docx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                alert('Professional quote exported successfully!');
              });
            });
          }}
          className="bg-gradient-to-b from-green-500 to-green-700 text-white px-8 py-3 rounded-2xl font-bold shadow-xl transform hover:scale-105 transition-all border-b-4 border-green-800 hover:border-green-900 flex items-center"
        >
          <span className="text-2xl mr-2">📄</span>
          <span className="text-xl">Export Professional Quote</span>
        </button>
        
        <button className="bg-gradient-to-b from-purple-500 to-purple-700 text-white px-8 py-3 rounded-2xl font-bold shadow-xl transform hover:scale-105 transition-all border-b-4 border-purple-800 hover:border-purple-900 flex items-center">
          <span className="text-2xl mr-2">📊</span>
          <span className="text-xl">Generate Presentation</span>
        </button>
        
        <button className="bg-gradient-to-b from-blue-500 to-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-xl transform hover:scale-105 transition-all border-b-4 border-blue-800 hover:border-blue-900 flex items-center">
          <span className="text-2xl mr-2">📧</span>
          <span className="text-xl">Email Quote</span>
        </button>
      </div>

      {/* Save Prompt Modal */}
      {showSavePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">💾</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Save Your Quote</h2>
                <p className="text-gray-600">
                  Save this quote to access it later and share with your team.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quote Name</label>
                  <input
                    type="text"
                    value={quoteName}
                    onChange={(e) => setQuoteName(e.target.value)}
                    placeholder="Enter a name for this quote..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      // Save locally for now
                      const quoteData = {
                        name: quoteName || `Quote_${new Date().toLocaleDateString()}`,
                        inputs: {
                          power,
                          standbyHours,
                          gridMode,
                          useCase,
                          generator,
                          valueKwh,
                          utilization,
                          warranty,
                          location,
                          pcsSeparate,
                          budgetKnown,
                          budget
                        },
                        assumptions: {
                          batteryKwh,
                          bosPercent,
                          pcsKw,
                          epcPercent,
                          solarKwh,
                          windKwh
                        },
                        timestamp: new Date().toISOString()
                      };
                      
                      try {
                        const savedQuotes = JSON.parse(localStorage.getItem('merlin_quotes') || '[]');
                        savedQuotes.push(quoteData);
                        localStorage.setItem('merlin_quotes', JSON.stringify(savedQuotes));
                        alert(`Quote "${quoteData.name}" saved successfully!`);
                        setShowSavePrompt(false);
                      } catch (error) {
                        alert('Failed to save quote. Please try again.');
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Save Quote
                  </button>
                  <button
                    onClick={() => setShowSavePrompt(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Integration */}
      <UserProfile 
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        onLoadQuote={(quote) => {
          // Load quote data into your existing form
          if (quote.inputs.power) setPower(quote.inputs.power);
          if (quote.inputs.standbyHours) setStandbyHours(quote.inputs.standbyHours);
          if (quote.inputs.gridMode) setGridMode(quote.inputs.gridMode);
          if (quote.inputs.useCase) setUseCase(quote.inputs.useCase);
          if (quote.inputs.generator) setGenerator(quote.inputs.generator);
          if (quote.inputs.valueKwh) setValueKwh(quote.inputs.valueKwh);
          if (quote.inputs.utilization) setUtilization(quote.inputs.utilization);
          if (quote.inputs.warranty) setWarranty(quote.inputs.warranty);
          if (quote.inputs.location) setLocation(quote.inputs.location);
          if (quote.inputs.pcsSeparate) setPcsSeparate(quote.inputs.pcsSeparate);
          if (quote.inputs.budgetKnown) setBudgetKnown(quote.inputs.budgetKnown);
          if (quote.inputs.budget) setBudget(quote.inputs.budget);
          
          // Load assumptions if available
          if (quote.assumptions) {
            if (quote.assumptions.batteryKwh) setBatteryKwh(quote.assumptions.batteryKwh);
            if (quote.assumptions.bosPercent) setBosPercent(quote.assumptions.bosPercent);
            if (quote.assumptions.pcsKw) setPcsKw(quote.assumptions.pcsKw);
            if (quote.assumptions.epcPercent) setEpcPercent(quote.assumptions.epcPercent);
            if (quote.assumptions.solarKwh) setSolarKwh(quote.assumptions.solarKwh);
            if (quote.assumptions.windKwh) setWindKwh(quote.assumptions.windKwh);
          }
          
          setShowUserProfile(false);
          console.log('Quote loaded successfully:', quote.project_name);
        }}
        onLoginSuccess={() => {
          console.log('User logged in successfully');
        }}
      />
    </div>
  );
}
