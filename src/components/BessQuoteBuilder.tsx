import React, { useState } from 'react';

export default function BessQuoteBuilder() {
  // Advanced Input Modal/Panel State
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const [showSmartWizard, setShowSmartWizard] = useState(false);
  const [wizardData, setWizardData] = useState({
    primaryApplication: '',
    budgetRange: '',
    equipmentNeeded: '',
    powerMW: '',
    voltage: '',
    gridMode: '',
    country: '',
    projectReference: '',
  });
  const [quoteInputs, setQuoteInputs] = useState({
    primaryApplication: '',
    budgetRange: '',
    equipmentNeeded: '',
    powerMW: '',
    voltage: '',
    gridMode: '',
    country: '',
    projectReference: '',
  });
  function generateSmartConfiguration() {
    setQuoteInputs({ ...wizardData });
    alert('Smart configuration applied to quote!');
    setShowSmartWizard(false);
  }
  function calculateQuote(inputs: {
    primaryApplication: string;
    budgetRange: string;
    equipmentNeeded: string;
    powerMW: string;
    voltage: string;
    gridMode: string;
    country: string;
    projectReference: string;
  }) {
    return {
      ...inputs,
      totalCost: inputs.powerMW ? Number(inputs.powerMW) * 1000000 : 0,
    };
  }
  const [quoteOutputs, setQuoteOutputs] = useState(calculateQuote(quoteInputs));
  React.useEffect(() => {
    setQuoteOutputs(calculateQuote(quoteInputs));
  }, [quoteInputs]);
  async function exportToWord() {
    const payload = {
      inputs: quoteInputs,
      outputs: quoteOutputs,
    };
    try {
      const response = await fetch('/api/export/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Merlin_Quote.docx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        alert('Exported to Word!');
      } else {
        alert('Export failed.');
      }
    } catch (err) {
      alert('Export error: ' + err);
    }
  }
  return (
    <>
      <div className="flex gap-4 p-4">
        <button
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow font-semibold"
          onClick={() => setShowSmartWizard(true)}
        >
          Open Smart Wizard
        </button>
        <button
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-lg shadow font-semibold"
          onClick={() => setShowAdvancedInputs(true)}
        >
          Advanced Quote Options
        </button>
      </div>
      {/* Show current quote inputs and outputs */}
      <div className="p-4 bg-blue-50 rounded-xl shadow mb-4">
        <h3 className="font-bold text-blue-700 mb-2">Current Quote Inputs</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>Project Reference:</strong> {quoteInputs.projectReference}</div>
          <div><strong>Primary Application:</strong> {quoteInputs.primaryApplication}</div>
          <div><strong>Budget Range:</strong> {quoteInputs.budgetRange}</div>
          <div><strong>Equipment Needed:</strong> {quoteInputs.equipmentNeeded}</div>
          <div><strong>Power (MW):</strong> {quoteInputs.powerMW}</div>
          <div><strong>Voltage:</strong> {quoteInputs.voltage}</div>
          <div><strong>Grid Mode:</strong> {quoteInputs.gridMode}</div>
          <div><strong>Country:</strong> {quoteInputs.country}</div>
        </div>
        <h3 className="font-bold text-purple-700 mt-6 mb-2">Calculated Outputs</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>Total Cost:</strong> ${quoteOutputs.totalCost.toLocaleString()}</div>
          {/* Add more outputs as needed */}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow font-semibold"
            onClick={exportToWord}
          >
            Export to Word
          </button>
        </div>
      </div>
      {/* Smart Wizard Modal */}
      {showSmartWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 border border-purple-200 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowSmartWizard(false)}
              aria-label="Close Smart Wizard"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-purple-700 mb-4">Smart Wizard</h2>
            <div className="space-y-4">
              <label className="flex flex-col text-sm font-semibold">Project Reference
                <input className="border p-2 rounded font-normal mt-1" type="text" value={wizardData.projectReference} onChange={e => setWizardData({ ...wizardData, projectReference: e.target.value })} placeholder="e.g. Customer PO, Site Name" />
              </label>
              <label className="flex flex-col text-sm font-semibold">Primary Application
                <input className="border p-2 rounded font-normal mt-1" type="text" value={wizardData.primaryApplication} onChange={e => setWizardData({ ...wizardData, primaryApplication: e.target.value })} placeholder="e.g. BESS, Solar, Wind" />
              </label>
              <label className="flex flex-col text-sm font-semibold">Budget Range
                <input className="border p-2 rounded font-normal mt-1" type="text" value={wizardData.budgetRange} onChange={e => setWizardData({ ...wizardData, budgetRange: e.target.value })} placeholder="$1M - $10M" />
              </label>
              <label className="flex flex-col text-sm font-semibold">Equipment Needed
                <input className="border p-2 rounded font-normal mt-1" type="text" value={wizardData.equipmentNeeded} onChange={e => setWizardData({ ...wizardData, equipmentNeeded: e.target.value })} placeholder="PCS, Battery, Solar, Wind" />
              </label>
              <label className="flex flex-col text-sm font-semibold">Power (MW)
                <input className="border p-2 rounded font-normal mt-1" type="text" value={wizardData.powerMW} onChange={e => setWizardData({ ...wizardData, powerMW: e.target.value })} placeholder="e.g. 5" />
              </label>
              <label className="flex flex-col text-sm font-semibold">Voltage
                <select className="border p-2 rounded font-normal mt-1" value={wizardData.voltage} onChange={e => setWizardData({ ...wizardData, voltage: e.target.value })}>
                  <option value="">Select</option>
                  <option value="800V">800V</option>
                  <option value="400V">400V</option>
                  <option value="200V">200V</option>
                </select>
              </label>
              <label className="flex flex-col text-sm font-semibold">Grid Mode
                <select className="border p-2 rounded font-normal mt-1" value={wizardData.gridMode} onChange={e => setWizardData({ ...wizardData, gridMode: e.target.value })}>
                  <option value="">Select</option>
                  <option value="on-grid">On-grid</option>
                  <option value="off-grid">Off-grid</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </label>
              <label className="flex flex-col text-sm font-semibold">Country
                <input className="border p-2 rounded font-normal mt-1" type="text" value={wizardData.country} onChange={e => setWizardData({ ...wizardData, country: e.target.value })} placeholder="e.g. USA, Canada" />
              </label>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-2 rounded-lg shadow font-semibold"
                onClick={generateSmartConfiguration}
              >
                Generate Smart Configuration
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Advanced Input Modal */}
      {showAdvancedInputs && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 border border-blue-200 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowAdvancedInputs(false)}
              aria-label="Close Advanced Inputs"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Advanced Quote Options</h2>
            <div className="space-y-4">
              <label className="flex flex-col text-sm font-semibold">Project Reference
                <input className="border p-2 rounded font-normal mt-1" type="text" value={quoteInputs.projectReference} onChange={e => setQuoteInputs({ ...quoteInputs, projectReference: e.target.value })} placeholder="e.g. Customer PO, Site Name" />
              </label>
              <label className="flex flex-col text-sm font-semibold">Primary Application
                <input className="border p-2 rounded font-normal mt-1" type="text" value={quoteInputs.primaryApplication} onChange={e => setQuoteInputs({ ...quoteInputs, primaryApplication: e.target.value })} placeholder="e.g. BESS, Solar, Wind" />
              </label>
              <label className="flex flex-col text-sm font-semibold">Budget Range
                <input className="border p-2 rounded font-normal mt-1" type="text" value={quoteInputs.budgetRange} onChange={e => setQuoteInputs({ ...quoteInputs, budgetRange: e.target.value })} placeholder="$1M - $10M" />
              </label>
              <label className="flex flex-col text-sm font-semibold">Equipment Needed
                <input className="border p-2 rounded font-normal mt-1" type="text" value={quoteInputs.equipmentNeeded} onChange={e => setQuoteInputs({ ...quoteInputs, equipmentNeeded: e.target.value })} placeholder="PCS, Battery, Solar, Wind" />
              </label>
              <label className="flex flex-col text-sm font-semibold">Power (MW)
                <input className="border p-2 rounded font-normal mt-1" type="text" value={quoteInputs.powerMW} onChange={e => setQuoteInputs({ ...quoteInputs, powerMW: e.target.value })} placeholder="e.g. 5" />
              </label>
              <label className="flex flex-col text-sm font-semibold">Voltage
                <select className="border p-2 rounded font-normal mt-1" value={quoteInputs.voltage} onChange={e => setQuoteInputs({ ...quoteInputs, voltage: e.target.value })}>
                  <option value="">Select</option>
                  <option value="800V">800V</option>
                  <option value="400V">400V</option>
                  <option value="200V">200V</option>
                </select>
              </label>
              <label className="flex flex-col text-sm font-semibold">Grid Mode
                <select className="border p-2 rounded font-normal mt-1" value={quoteInputs.gridMode} onChange={e => setQuoteInputs({ ...quoteInputs, gridMode: e.target.value })}>
                  <option value="">Select</option>
                  <option value="on-grid">On-grid</option>
                  <option value="off-grid">Off-grid</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </label>
              <label className="flex flex-col text-sm font-semibold">Country
                <input className="border p-2 rounded font-normal mt-1" type="text" value={quoteInputs.country} onChange={e => setQuoteInputs({ ...quoteInputs, country: e.target.value })} placeholder="e.g. USA, Canada" />
              </label>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow font-semibold"
                onClick={() => setShowAdvancedInputs(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}