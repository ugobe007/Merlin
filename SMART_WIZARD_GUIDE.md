# 🪄 Smart BESS Wizard

The Smart BESS Wizard is an intelligent configuration tool that automatically generates optimal Battery Energy Storage System (BESS) configurations based on minimal user input. It's designed to help users who don't know exactly what they need by guiding them through simple questions and generating professional quotes.

## Features

### 🎯 Intelligent Configuration
- **Application-Based Sizing**: Automatically sizes systems based on use case
- **Budget-Aware Recommendations**: Adjusts configurations to fit budget constraints
- **Regional Optimization**: Adapts settings for different geographical regions
- **Integration Support**: Incorporates existing power generation sources

### 📋 Three-Step Process

#### Step 1: Application & Budget
- **Primary Application Selection**:
  - 🔌 EV Charging Stations
  - 🏭 Industrial Backup Power
  - ⚡ Grid Stabilization
  - 🌱 Renewable Integration
  - 📈 Peak Shaving
  - ❓ Custom Applications

- **Budget Range**:
  - Under $500K (Small commercial)
  - $500K - $2M (Medium commercial)
  - $2M - $10M (Large commercial)
  - $10M+ (Utility scale)
  - Flexible (Show all options)

#### Step 2: Power Requirements
- **System Size**: Small (<2MW), Medium (2-10MW), Large (>10MW)
- **Location**: US, UK, EU, Other
- **Existing Power**: Integration with solar, wind, generators

#### Step 3: Final Details
- **Project Timeframe**: Immediate to long-term planning
- **Primary Goals**: Cost savings, reliability, sustainability, compliance
- **Configuration Preview**: Summary of selections

### 🧠 Smart Logic

The wizard uses intelligent algorithms to:

1. **Size Systems Appropriately**:
   - EV Charging: 0.5-5MW with 4-hour duration
   - Industrial Backup: 1-15MW with 8-hour duration
   - Grid Stabilization: 2-50MW with 2-hour duration
   - Renewable Integration: 1-20MW with 6-hour duration
   - Peak Shaving: 0.5-10MW with 3-hour duration

2. **Optimize for Use Case**:
   - Sets appropriate utilization rates
   - Configures grid connection modes
   - Selects suitable voltage levels
   - Applies regional cost factors

3. **Budget Constraints**:
   - Automatically scales down oversized systems
   - Sets realistic budget targets
   - Provides delta analysis

4. **Integration Logic**:
   - Solar: 1.5x oversizing for optimal storage
   - Wind: 1.2x sizing for variable generation
   - Generators: 0.8x sizing for hybrid systems

### 🎯 Generated Configurations

The wizard automatically populates:
- **Power Rating** (MW)
- **Storage Duration** (hours)
- **System Voltage**
- **Grid Connection Mode**
- **Use Case Category**
- **Utilization Factors**
- **Value Propositions**
- **Budget Parameters**
- **Renewable Integration**
- **Regional Settings**

### 💡 User Experience

- **Visual Interface**: Card-based selection with icons and descriptions
- **Progressive Disclosure**: Three logical steps with validation
- **Real-time Preview**: Configuration summary before generation
- **Magic Effects**: Sound effects and animations for engagement
- **Instant Results**: Immediate quote generation with calculations

### 🔧 Technical Implementation

```typescript
// Example generated configuration for EV Charging, Medium size, US
{
  powerMW: 2,
  standbyHours: 4,
  useCase: 'EV Charging Stations',
  locationRegion: 'US',
  gridMode: 'on-grid',
  utilization: 0.6,
  valuePerKWh: 0.35,
  budgetKnown: true,
  budgetAmount: 1500000
}
```

### 🎯 Target Users

- **First-time Buyers**: Don't know technical specifications
- **Project Developers**: Need quick feasibility studies
- **Consultants**: Require rapid quote generation
- **Sales Teams**: Customer-facing configuration tools

### 📊 Benefits

1. **Reduces Complexity**: Eliminates need for technical expertise
2. **Saves Time**: Minutes instead of hours for configuration
3. **Improves Accuracy**: Pre-validated industry best practices
4. **Enhances Sales**: Professional quotes from minimal input
5. **Scales Business**: Handle more opportunities efficiently

### 🚀 Usage Tips

1. **Start Simple**: Use the wizard for initial sizing
2. **Refine Later**: Manually adjust after wizard completion
3. **Compare Options**: Run multiple scenarios with different inputs
4. **Export Immediately**: Generate professional documents right away

The Smart Wizard transforms complex BESS configuration into a simple, guided experience that empowers anyone to generate professional energy storage quotes.