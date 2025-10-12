import React, { useState } from 'react';
import SmartWizardUseCases, { UseCase } from './SmartWizardUseCases';

interface SmartWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigurationComplete: (config: any) => void;
  wizardData: any;
  setWizardData: (data: any) => void;
}

const SmartWizardModal: React.FC<SmartWizardModalProps> = ({
  isOpen,
  onClose,
  onConfigurationComplete,
  wizardData,
  setWizardData
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);

  const handleUseCaseSelect = (useCase: UseCase) => {
    setSelectedUseCase(useCase);
    // Update wizard data with selected use case
    setWizardData({
      ...wizardData,
      powerMW: useCase.suggestedConfig.powerMW.split('-')[0],
      voltage: useCase.suggestedConfig.voltage,
      primaryApplication: useCase.name,
      equipmentNeeded: useCase.suggestedConfig.applications.join(', ')
    });
  };

  const handlePublish = () => {
    const finalConfig = {
      ...wizardData,
      useCase: selectedUseCase?.name,
      applications: selectedUseCase?.suggestedConfig.applications || [],
      keyFeatures: selectedUseCase?.suggestedConfig.keyFeatures || [],
      estimatedCost: selectedUseCase?.suggestedConfig.estimatedCost
    };
    
    onConfigurationComplete(finalConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">🧙‍♂️ Smart Configuration Wizard</h2>
              <p className="text-purple-100 mt-1">Select a preconfigured use case to get started quickly</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-3xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <SmartWizardUseCases
            onUseCaseSelect={handleUseCaseSelect}
            selectedUseCase={selectedUseCase}
          />

          {selectedUseCase && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📋 Suggested Configuration: {selectedUseCase.name}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Applications</h4>
                  <ul className="space-y-1">
                    {selectedUseCase.suggestedConfig.applications.map((app, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                        {app}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Key Features</h4>
                  <ul className="space-y-1">
                    {selectedUseCase.suggestedConfig.keyFeatures.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="font-medium">Power:</span> {selectedUseCase.suggestedConfig.powerMW} MW</div>
                <div><span className="font-medium">Energy:</span> {selectedUseCase.suggestedConfig.energyMWh} MWh</div>
                <div><span className="font-medium">Voltage:</span> {selectedUseCase.suggestedConfig.voltage}</div>
                <div><span className="font-medium">Est. Cost:</span> {selectedUseCase.suggestedConfig.estimatedCost}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedUseCase ? `Selected: ${selectedUseCase.name}` : 'Please select a use case to continue'}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            
            <button
              onClick={handlePublish}
              disabled={!selectedUseCase}
              className="px-8 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚀 Apply Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartWizardModal;
