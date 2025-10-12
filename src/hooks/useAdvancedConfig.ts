import { useState } from 'react';

export interface AdvancedConfig {
  projectReference: string;
  customerName: string;
  siteLocation: string;
  projectDescription: string;
  powerMW: string;
  energyMWh: string;
  voltage: string;
  frequency: string;
  gridConnection: string;
  batteryTechnology: string;
  inverterType: string;
  coolingSystem: string;
  enclosureType: string;
  deliverySchedule: string;
  warrantyYears: string;
  paymentTerms: string;
  incoterms: string;
  executiveSummary: string;
  technicalSpecifications: string;
  commercialTerms: string;
  additionalNotes: string;
}

export const useAdvancedConfig = () => {
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfig>({
    projectReference: '',
    customerName: '',
    siteLocation: '',
    projectDescription: '',
    powerMW: '',
    energyMWh: '',
    voltage: '480V',
    frequency: '60Hz',
    gridConnection: 'Behind the meter',
    batteryTechnology: 'Lithium-ion',
    inverterType: 'String',
    coolingSystem: 'Air-cooled',
    enclosureType: 'Outdoor',
    deliverySchedule: '',
    warrantyYears: '10',
    paymentTerms: '',
    incoterms: 'EXW',
    executiveSummary: '',
    technicalSpecifications: '',
    commercialTerms: '',
    additionalNotes: ''
  });

  const openAdvancedModal = () => setShowAdvancedModal(true);
  const closeAdvancedModal = () => setShowAdvancedModal(false);
  
  const saveAdvancedConfig = (config: AdvancedConfig) => {
    setAdvancedConfig(config);
    setShowAdvancedModal(false);
    console.log('Advanced configuration saved:', config);
  };

  return {
    showAdvancedModal,
    advancedConfig,
    setAdvancedConfig,
    openAdvancedModal,
    closeAdvancedModal,
    saveAdvancedConfig
  };
};
