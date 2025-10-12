import React, { useState } from 'react';
import { X, Wand2, CheckCircle, AlertCircle, Lightbulb, TrendingUp } from 'lucide-react';

interface SmartWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: {
    quoteName: string;
    power: string;
    standbyHours: string;
    gridMode: string;
    location: string;
    utilization: string;
  };
  onUpdateProject: (updates: any) => void;
  results: {
    totalCost: number;
    annualSavings: number;
    roiYears: number;
  };
  currentEnergyPrice: number;
}

export default function SmartWizardModal({
  isOpen,
  onClose,
  projectData,
  onUpdateProject,
  results,
  currentEnergyPrice
}: SmartWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Project Overview",
      icon: CheckCircle,
      content: () => (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-purple-700">Let's Review Your Project</h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Project Name:</span>
                <div className="font-bold">{projectData.quoteName || 'Not Set'}</div>
              </div>
              <div>
                <span className="text-gray-600">Power Capacity:</span>
                <div className="font-bold">{projectData.power || 'Not Selected'}</div>
              </div>
              <div>
                <span className="text-gray-600">Duration:</span>
                <div className="font-bold">{projectData.standbyHours ? `${projectData.standbyHours} hours` : 'Not Selected'}</div>
              </div>
              <div>
                <span className="text-gray-600">Application:</span>
                <div className="font-bold">{projectData.gridMode || 'Not Selected'}</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Smart Recommendations",
      icon: Lightbulb,
      content: () => (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-purple-700">AI-Powered Insights</h3>
          <div className="space-y-3">
            {getRecommendations().map((rec, idx) => (
              <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex items-start">
                  <AlertCircle className="text-yellow-600 mr-2 mt-0.5" size={16} />
                  <div>
                    <div className="font-semibold text-yellow-800">{rec.title}</div>
                    <div className="text-yellow-700 text-sm">{rec.description}</div>
                    {rec.action && (
                      <button
                        onClick={rec.action}
                        className="mt-2 text-xs bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full hover:bg-yellow-300"
                      >
                        Apply Suggestion
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Financial Analysis",
      icon: TrendingUp,
      content: () => (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-purple-700">Investment Analysis</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
              <div className="text-2xl font-bold text-green-700">${(results.totalCost || 0).toLocaleString()}</div>
              <div className="text-green-600">Total Investment</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
              <div className="text-2xl font-bold text-blue-700">${(results.annualSavings || 0).toLocaleString()}</div>
              <div className="text-blue-600">Annual Savings</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
              <div className="text-2xl font-bold text-purple-700">{(results.roiYears || 0).toFixed(1)} years</div>
              <div className="text-purple-600">Payback Period</div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="text-sm text-gray-600 mb-2">Based on current energy rate:</div>
            <div className="text-lg font-bold text-gray-800">${currentEnergyPrice.toFixed(4)}/kWh</div>
          </div>
        </div>
      )
    }
  ];

  const getRecommendations = () => {
    const recommendations = [];
    
    if (!projectData.quoteName) {
      recommendations.push({
        title: "Add Project Name",
        description: "Give your project a descriptive name for better organization",
        action: () => {
          const name = prompt("Enter project name:");
          if (name) onUpdateProject({ quoteName: name });
        }
      });
    }

    if (!projectData.power) {
      recommendations.push({
        title: "Select Power Capacity",
        description: "Choose the appropriate power rating for your application",
        action: () => setCurrentStep(0)
      });
    }

    if (!projectData.utilization || parseFloat(projectData.utilization) < 0.3) {
      recommendations.push({
        title: "Optimize Utilization",
        description: "Consider increasing capacity factor to improve ROI",
        action: () => onUpdateProject({ utilization: "0.6" })
      });
    }

    if (results.roiYears > 10) {
      recommendations.push({
        title: "Long Payback Period",
        description: "Consider reducing system size or exploring incentives",
        action: null
      });
    }

    return recommendations;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 p-8 border-4 border-purple-300 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Wand2 className="text-purple-600 mr-2" size={32} />
            <h2 className="text-3xl font-bold text-purple-700">Smart Wizard</h2>
          </div>
          <p className="text-gray-600">AI-powered guidance for your BESS project</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  idx === currentStep ? 'bg-purple-600 text-white' : 
                  idx < currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {idx < currentStep ? '✓' : idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-full h-1 mx-2 ${
                    idx < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {steps[currentStep].content()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-all"
          >
            Previous
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
