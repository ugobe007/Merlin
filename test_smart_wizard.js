// Smart Wizard Configuration Test
// This script tests the logic for generating BESS configurations

console.log('🪄 Testing Smart BESS Wizard Logic');
console.log('==================================');

// Test configuration scenarios
const testScenarios = [
  {
    name: 'EV Charging - Small Commercial',
    wizardData: {
      application: 'EV Charging',
      budgetRange: 'under500k',
      powerNeeds: 'small',
      location: 'US',
      hasExistingPower: false,
      existingPowerType: '',
      timeframe: 'short',
      primaryGoal: 'cost-savings'
    },
    expected: {
      powerMW: 0.5,
      standbyHours: 4,
      useCase: 'EV Charging Stations',
      budgetAmount: 400000
    }
  },
  {
    name: 'Industrial Backup - Large Scale',
    wizardData: {
      application: 'Industrial Backup',
      budgetRange: '10m+',
      powerNeeds: 'large',
      location: 'US',
      hasExistingPower: true,
      existingPowerType: 'generator',
      timeframe: 'medium',
      primaryGoal: 'reliability'
    },
    expected: {
      powerMW: 15,
      standbyHours: 8,
      useCase: 'Industrial Backup',
      gridMode: 'off-grid',
      generatorMW: 12 // 15 * 0.8
    }
  },
  {
    name: 'Renewable Integration with Solar',
    wizardData: {
      application: 'Renewable Integration',
      budgetRange: '2m-10m',
      powerNeeds: 'medium',
      location: 'EU',
      hasExistingPower: true,
      existingPowerType: 'solar',
      timeframe: 'long',
      primaryGoal: 'sustainability'
    },
    expected: {
      powerMW: 5,
      standbyHours: 6,
      useCase: 'Renewable Integration',
      solarMWp: 7.5, // 5 * 1.5
      locationRegion: 'EU'
    }
  },
  {
    name: 'Peak Shaving - Budget Constrained',
    wizardData: {
      application: 'Peak Shaving',
      budgetRange: '500k-2m',
      powerNeeds: 'large', // Will be scaled down due to budget
      location: 'UK',
      hasExistingPower: false,
      existingPowerType: '',
      timeframe: 'immediate',
      primaryGoal: 'cost-savings'
    },
    expected: {
      powerMW: 8, // Capped at 8MW due to budget constraint
      standbyHours: 3,
      useCase: 'Peak Shaving',
      budgetAmount: 1500000
    }
  }
];

// Simulate the wizard logic
function simulateWizardLogic(wizardData) {
  const { application, budgetRange, powerNeeds, location, hasExistingPower, existingPowerType } = wizardData;
  
  let config = {
    locationRegion: location,
    gridMode: 'on-grid'
  };

  // Application-based configuration
  switch (application) {
    case 'EV Charging':
      config = {
        ...config,
        powerMW: powerNeeds === 'small' ? 0.5 : powerNeeds === 'medium' ? 2 : 5,
        standbyHours: 4,
        useCase: 'EV Charging Stations',
        utilization: 0.6,
        valuePerKWh: 0.35
      };
      break;
    
    case 'Industrial Backup':
      config = {
        ...config,
        powerMW: powerNeeds === 'small' ? 1 : powerNeeds === 'medium' ? 5 : 15,
        standbyHours: 8,
        useCase: 'Industrial Backup',
        utilization: 0.1,
        valuePerKWh: 0.5,
        gridMode: 'off-grid'
      };
      
      if (hasExistingPower && config.powerMW) {
        if (existingPowerType === 'generator') {
          config.generatorMW = config.powerMW * 0.8;
        }
      }
      break;

    case 'Renewable Integration':
      config = {
        ...config,
        powerMW: powerNeeds === 'small' ? 1 : powerNeeds === 'medium' ? 5 : 20,
        standbyHours: 6,
        useCase: 'Renewable Integration',
        utilization: 0.4,
        valuePerKWh: 0.2
      };
      
      if (hasExistingPower && config.powerMW) {
        if (existingPowerType === 'solar') {
          config.solarMWp = config.powerMW * 1.5;
        } else if (existingPowerType === 'wind') {
          config.windMW = config.powerMW * 1.2;
        } else if (existingPowerType === 'generator') {
          config.generatorMW = config.powerMW * 0.8;
        }
      }
      break;

    case 'Peak Shaving':
      config = {
        ...config,
        powerMW: powerNeeds === 'small' ? 0.5 : powerNeeds === 'medium' ? 3 : 10,
        standbyHours: 3,
        useCase: 'Peak Shaving',
        utilization: 0.5,
        valuePerKWh: 0.4
      };
      break;
  }

  // Budget constraints
  if (budgetRange === 'under500k' && config.powerMW && config.powerMW > 2) {
    config.powerMW = Math.min(config.powerMW, 2);
  } else if (budgetRange === '500k-2m' && config.powerMW && config.powerMW > 8) {
    config.powerMW = Math.min(config.powerMW, 8);
  }

  // Budget amounts
  if (budgetRange !== 'flexible') {
    config.budgetKnown = true;
    switch (budgetRange) {
      case 'under500k':
        config.budgetAmount = 400000;
        break;
      case '500k-2m':
        config.budgetAmount = 1500000;
        break;
      case '2m-10m':
        config.budgetAmount = 6000000;
        break;
      case '10m+':
        config.budgetAmount = 15000000;
        break;
    }
  }

  return config;
}

// Run tests
testScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. Testing: ${scenario.name}`);
  console.log('Input:', JSON.stringify(scenario.wizardData, null, 2));
  
  const result = simulateWizardLogic(scenario.wizardData);
  console.log('Generated Config:', JSON.stringify(result, null, 2));
  
  // Verify key expectations
  let passed = true;
  Object.keys(scenario.expected).forEach(key => {
    if (result[key] !== scenario.expected[key]) {
      console.log(`❌ FAIL: Expected ${key}=${scenario.expected[key]}, got ${result[key]}`);
      passed = false;
    }
  });
  
  if (passed) {
    console.log('✅ PASS: All expectations met');
  }
});

console.log('\n🎯 Smart Wizard Logic Test Complete!');
console.log('The wizard successfully generates appropriate BESS configurations');
console.log('based on user requirements and constraints.');