# 🔋 Merlin BESS Quote Builder

**Professional Battery Energy Storage System (BESS) Quote Builder with Vendor Management**

A comprehensive web application for creating professional BESS quotes with advanced vendor management, product catalog, and database integration.

![Merlin BESS Quote Builder](./public/merlin.png)

## ✨ Features

### 🪄 **Smart BESS Wizard**
- **Intelligent Configuration**: Automatically generates optimal BESS systems based on minimal input
- **Application-Based Sizing**: EV charging, industrial backup, grid stabilization, renewable integration
- **Budget-Aware Recommendations**: Scales systems to fit budget constraints
- **Integration Support**: Incorporates existing solar, wind, and generator systems
- **Three-Step Process**: Simple guided workflow for complex configurations

### 📊 **Advanced Quote Builder**
- **Smart Calculations**: Automatic BESS sizing based on power and duration requirements
- **Regional Support**: US, UK, EU, and international configurations
- **Multi-Use Cases**: On-grid, off-grid, solar integration, wind integration
- **Budget Analysis**: Compare estimates against known budgets
- **Professional Exports**: Word documents and Excel spreadsheets

### 🏢 **Vendor Management System**
- **Vendor Database**: Complete vendor contact and specialty information
- **Product Catalog**: Detailed product specifications and pricing
- **Quote Tracking**: Vendor quote submissions and comparisons
- **Import/Export**: Bulk data import via CSV/JSON

### 🛠️ **Technical Specifications**
- **Modern Stack**: React 19, TypeScript, Vite, Express.js
- **Database**: SQLite with better-sqlite3 for performance
- **Styling**: Tailwind CSS for responsive design
- **Document Generation**: Docxtemplater and ExcelJS
- **Performance**: Compression, caching, and optimized bundling

### 📈 **Business Intelligence**
- **Cost Analysis**: Battery, PCS, BOS, and EPC cost breakdowns
- **ROI Calculations**: Payback period and financial projections
- **Configuration Management**: Save and load project configurations
- **Materials Library**: Standard components and pricing database

## 🚀 Quick Start

### Development
```bash
# Clone the repository
git clone https://github.com/ugobe007/Merlin.git
cd Merlin

# Install dependencies
npm install

# Start development servers
npm run dev:all
```

### Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📦 Installation

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- **Git**

### Local Development
1. **Clone and Install**:
   ```bash
   git clone https://github.com/ugobe007/Merlin.git
   cd Merlin
   npm install
   ```

2. **Start Development**:
   ```bash
   npm run dev:all
   ```
   - Frontend: http://localhost:5179
   - Backend API: http://localhost:5001

3. **Access Application**:
   - Open http://localhost:5179 in your browser
   - Start creating BESS quotes immediately!

## 🎯 Usage Guide

### Creating Your First Quote

1. **Project Setup**:
   - Enter power requirements (MW)
   - Set standby duration (hours)
   - Configure voltage and grid connection

2. **System Configuration**:
   - Choose use case (grid-tied, off-grid, renewable integration)
   - Set regional requirements and certifications
   - Add optional solar/wind components

3. **Vendor Management**:
   - Click "Vendor Manager" to add suppliers
   - Import product catalogs and pricing
   - Request and compare vendor quotes

4. **Export Results**:
   - Generate professional Word documents
   - Create detailed Excel spreadsheets
   - Save configurations for future use

### Advanced Features

- **Database Testing**: Use "Database Test" button to verify API connectivity
- **Bulk Import**: Import vendor data via CSV files
- **Configuration Save/Load**: Manage multiple project scenarios
- **Real-time Calculations**: Instant updates as parameters change

## 🚀 Deployment

Multiple deployment options available:

### **Option 1: Render (Recommended)**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect "ugobe007/Merlin" repository
5. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `NODE_ENV=production`
6. Deploy automatically!

### **Option 2: Traditional Server**
```bash
npm run build
NODE_ENV=production npm start
```

### **Option 3: Docker**
```bash
docker build -t merlin-bess .
docker run -p 5001:5001 merlin-bess
```

### **Option 4: Other Cloud Platforms**
- **Railway**: Connect GitHub repository
- **Heroku**: Git-based deployment  
- **DigitalOcean**: App Platform integration
- **Vercel**: Serverless deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for the renewable energy industry**

*Empowering the transition to sustainable energy storage solutions*