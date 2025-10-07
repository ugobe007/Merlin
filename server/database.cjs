const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Function to generate UUID v4 using crypto
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class QuoteDatabase {
  constructor() {
    // Ensure database directory exists
    const dbDir = path.join(process.cwd(), 'server', 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new Database(path.join(dbDir, 'merlin_quotes.db'));
    this.initializeTables();
    console.log('[database] Quote database initialized');
  }

  initializeTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        company TEXT,
        phone TEXT,
        title TEXT,
        linkedin TEXT,
        role TEXT DEFAULT 'user',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns if they don't exist (migration)
    this.migrateUserTable();

    // User quotes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_quotes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        project_name TEXT NOT NULL,
        inputs TEXT NOT NULL,
        assumptions TEXT NOT NULL,
        outputs TEXT NOT NULL,
        is_favorite BOOLEAN DEFAULT 0,
        tags TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // User sessions table (for JWT token blacklisting)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Vendors table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        website TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Product categories
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS product_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        name TEXT NOT NULL,
        model TEXT,
        specifications TEXT, -- JSON string
        unit_price REAL,
        currency TEXT DEFAULT 'USD',
        minimum_order_quantity INTEGER DEFAULT 1,
        lead_time_days INTEGER,
        warranty_years INTEGER,
        datasheet_url TEXT,
        image_url TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors (id),
        FOREIGN KEY (category_id) REFERENCES product_categories (id)
      )
    `);

    // Vendor quotes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vendor_quotes (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL,
        quote_number TEXT,
        quote_date DATE,
        valid_until DATE,
        total_amount REAL,
        currency TEXT DEFAULT 'USD',
        terms TEXT,
        notes TEXT,
        file_path TEXT,
        status TEXT DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors (id)
      )
    `);

    // Quote line items
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS quote_line_items (
        id TEXT PRIMARY KEY,
        quote_id TEXT NOT NULL,
        product_id TEXT,
        description TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        notes TEXT,
        FOREIGN KEY (quote_id) REFERENCES vendor_quotes (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);

    // BESS configurations (saved quotes from the app)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bess_configurations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        power_mw REAL NOT NULL,
        standby_hours REAL NOT NULL,
        grid_mode TEXT NOT NULL,
        use_case TEXT NOT NULL,
        location_region TEXT NOT NULL,
        inputs TEXT NOT NULL, -- JSON string
        assumptions TEXT NOT NULL, -- JSON string
        outputs TEXT NOT NULL, -- JSON string
        vendor_quote_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_quote_id) REFERENCES vendor_quotes (id)
      )
    `);

    // Materials and components library
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS materials_library (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        specifications TEXT, -- JSON string
        cost_per_unit REAL,
        unit TEXT, -- kWh, kW, MW, pieces, etc.
        supplier_info TEXT, -- JSON string with multiple suppliers
        notes TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_line_items(quote_id);
      CREATE INDEX IF NOT EXISTS idx_bess_configs_vendor_quote ON bess_configurations(vendor_quote_id);
      CREATE INDEX IF NOT EXISTS idx_materials_category ON materials_library(category);
    `);

    // Insert default categories
    this.insertDefaultData();
  }

  migrateUserTable() {
    // Check if title column exists
    const titleExists = this.db.prepare("PRAGMA table_info(users)").all()
      .some(column => column.name === 'title');
    
    if (!titleExists) {
      this.db.exec('ALTER TABLE users ADD COLUMN title TEXT');
      console.log('[database] Added title column to users table');
    }

    // Check if linkedin column exists
    const linkedinExists = this.db.prepare("PRAGMA table_info(users)").all()
      .some(column => column.name === 'linkedin');
    
    if (!linkedinExists) {
      this.db.exec('ALTER TABLE users ADD COLUMN linkedin TEXT');
      console.log('[database] Added linkedin column to users table');
    }
  }

  insertDefaultData() {
    const categories = [
      { name: 'Battery Systems', description: 'Battery cells, modules, and complete systems' },
      { name: 'Power Conversion', description: 'Inverters, PCS, and power electronics' },
      { name: 'Energy Management', description: 'EMS, controls, and monitoring systems' },
      { name: 'Balance of System', description: 'Containers, HVAC, fire suppression, etc.' },
      { name: 'Electrical Components', description: 'Transformers, switchgear, cables' },
      { name: 'Civil Works', description: 'Foundations, site preparation, construction' },
      { name: 'Installation Services', description: 'Labor, commissioning, testing' },
      { name: 'O&M Services', description: 'Operations, maintenance, and support' }
    ];

    const insertCategory = this.db.prepare(`
      INSERT OR IGNORE INTO product_categories (id, name, description)
      VALUES (?, ?, ?)
    `);

    categories.forEach(cat => {
      insertCategory.run(generateUUID(), cat.name, cat.description);
    });

    // Insert default materials
    const materials = [
      {
        category: 'Battery',
        name: 'Lithium Iron Phosphate Cell',
        specifications: JSON.stringify({
          energy_density: '160 Wh/kg',
          cycle_life: '6000+ cycles',
          operating_temp: '-20°C to +60°C',
          voltage: '3.2V nominal'
        }),
        cost_per_unit: 150,
        unit: 'kWh'
      },
      {
        category: 'PCS',
        name: 'Grid-Tied Inverter',
        specifications: JSON.stringify({
          efficiency: '98.5%',
          power_range: '250kW to 2MW',
          voltage_range: '315-800V DC',
          grid_codes: 'IEEE 1547, UL 1741'
        }),
        cost_per_unit: 80,
        unit: 'kW'
      },
      {
        category: 'BOS',
        name: 'HVAC System',
        specifications: JSON.stringify({
          cooling_capacity: '50kW',
          operating_temp: '-40°C to +60°C',
          efficiency: 'COP 3.0',
          refrigerant: 'R410A'
        }),
        cost_per_unit: 15000,
        unit: 'system'
      }
    ];

    const insertMaterial = this.db.prepare(`
      INSERT OR IGNORE INTO materials_library (id, category, name, specifications, cost_per_unit, unit)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    materials.forEach(mat => {
      insertMaterial.run(generateUUID(), mat.category, mat.name, mat.specifications, mat.cost_per_unit, mat.unit);
    });
  }

  // Vendor operations
  createVendor(vendorData) {
    const id = generateUUID();
    const stmt = this.db.prepare(`
      INSERT INTO vendors (id, name, contact_person, email, phone, address, website, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      vendorData.name,
      vendorData.contact_person,
      vendorData.email,
      vendorData.phone,
      vendorData.address,
      vendorData.website,
      vendorData.notes
    );
    
    return this.getVendor(id);
  }

  getVendor(id) {
    const stmt = this.db.prepare('SELECT * FROM vendors WHERE id = ?');
    return stmt.get(id);
  }

  getAllVendors() {
    const stmt = this.db.prepare('SELECT * FROM vendors ORDER BY name');
    return stmt.all();
  }

  updateVendor(id, vendorData) {
    const stmt = this.db.prepare(`
      UPDATE vendors 
      SET name = ?, contact_person = ?, email = ?, phone = ?, 
          address = ?, website = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      vendorData.name,
      vendorData.contact_person,
      vendorData.email,
      vendorData.phone,
      vendorData.address,
      vendorData.website,
      vendorData.notes,
      id
    );
    
    return this.getVendor(id);
  }

  // Product operations
  createProduct(productData) {
    const id = generateUUID();
    const stmt = this.db.prepare(`
      INSERT INTO products (
        id, vendor_id, category_id, name, model, specifications, 
        unit_price, currency, minimum_order_quantity, lead_time_days, 
        warranty_years, datasheet_url, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      productData.vendor_id,
      productData.category_id,
      productData.name,
      productData.model,
      JSON.stringify(productData.specifications || {}),
      productData.unit_price,
      productData.currency || 'USD',
      productData.minimum_order_quantity || 1,
      productData.lead_time_days,
      productData.warranty_years,
      productData.datasheet_url,
      productData.image_url
    );
    
    return this.getProduct(id);
  }

  getProduct(id) {
    const stmt = this.db.prepare(`
      SELECT p.*, v.name as vendor_name, c.name as category_name
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE p.id = ?
    `);
    const product = stmt.get(id);
    if (product && product.specifications) {
      product.specifications = JSON.parse(product.specifications);
    }
    return product;
  }

  getProductsByVendor(vendorId) {
    const stmt = this.db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE p.vendor_id = ? AND p.is_active = 1
      ORDER BY p.name
    `);
    const products = stmt.all(vendorId);
    return products.map(p => {
      if (p.specifications) p.specifications = JSON.parse(p.specifications);
      return p;
    });
  }

  // Vendor quote operations
  createVendorQuote(quoteData) {
    const id = generateUUID();
    const stmt = this.db.prepare(`
      INSERT INTO vendor_quotes (
        id, vendor_id, quote_number, quote_date, valid_until,
        total_amount, currency, terms, notes, file_path, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      quoteData.vendor_id,
      quoteData.quote_number,
      quoteData.quote_date,
      quoteData.valid_until,
      quoteData.total_amount,
      quoteData.currency || 'USD',
      quoteData.terms,
      quoteData.notes,
      quoteData.file_path,
      quoteData.status || 'draft'
    );
    
    return this.getVendorQuote(id);
  }

  getVendorQuote(id) {
    const stmt = this.db.prepare(`
      SELECT vq.*, v.name as vendor_name
      FROM vendor_quotes vq
      LEFT JOIN vendors v ON vq.vendor_id = v.id
      WHERE vq.id = ?
    `);
    return stmt.get(id);
  }

  getVendorQuotesByVendor(vendorId) {
    const stmt = this.db.prepare(`
      SELECT * FROM vendor_quotes 
      WHERE vendor_id = ? 
      ORDER BY quote_date DESC
    `);
    return stmt.all(vendorId);
  }

  // BESS configuration operations
  saveBessConfiguration(configData) {
    const id = generateUUID();
    const stmt = this.db.prepare(`
      INSERT INTO bess_configurations (
        id, name, power_mw, standby_hours, grid_mode, use_case, 
        location_region, inputs, assumptions, outputs, vendor_quote_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      configData.name,
      configData.inputs.powerMW,
      configData.inputs.standbyHours,
      configData.inputs.gridMode,
      configData.inputs.useCase,
      configData.inputs.locationRegion,
      JSON.stringify(configData.inputs),
      JSON.stringify(configData.assumptions),
      JSON.stringify(configData.outputs),
      configData.vendor_quote_id
    );
    
    return this.getBessConfiguration(id);
  }

  getBessConfiguration(id) {
    const stmt = this.db.prepare('SELECT * FROM bess_configurations WHERE id = ?');
    const config = stmt.get(id);
    if (config) {
      config.inputs = JSON.parse(config.inputs);
      config.assumptions = JSON.parse(config.assumptions);
      config.outputs = JSON.parse(config.outputs);
    }
    return config;
  }

  getAllBessConfigurations() {
    const stmt = this.db.prepare(`
      SELECT bc.*, vq.quote_number, v.name as vendor_name
      FROM bess_configurations bc
      LEFT JOIN vendor_quotes vq ON bc.vendor_quote_id = vq.id
      LEFT JOIN vendors v ON vq.vendor_id = v.id
      ORDER BY bc.created_at DESC
    `);
    return stmt.all();
  }

  // Search and filter operations
  searchProducts(query, categoryId = null) {
    let sql = `
      SELECT p.*, v.name as vendor_name, c.name as category_name
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN product_categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND (
        p.name LIKE ? OR p.model LIKE ? OR v.name LIKE ?
      )
    `;
    const params = [`%${query}%`, `%${query}%`, `%${query}%`];
    
    if (categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(categoryId);
    }
    
    sql += ' ORDER BY p.name';
    
    const stmt = this.db.prepare(sql);
    const products = stmt.all(...params);
    return products.map(p => {
      if (p.specifications) p.specifications = JSON.parse(p.specifications);
      return p;
    });
  }

  getCategories() {
    const stmt = this.db.prepare('SELECT * FROM product_categories ORDER BY name');
    return stmt.all();
  }

  getMaterialsLibrary(category = null) {
    let sql = 'SELECT * FROM materials_library WHERE is_active = 1';
    const params = [];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    sql += ' ORDER BY category, name';
    
    const stmt = this.db.prepare(sql);
    const materials = stmt.all(...params);
    return materials.map(m => {
      if (m.specifications) m.specifications = JSON.parse(m.specifications);
      if (m.supplier_info) m.supplier_info = JSON.parse(m.supplier_info);
      return m;
    });
  }

  // User Management Methods
  createUser(userData) {
    const id = generateUUID();
    const now = new Date().toISOString();
    
    console.log('[createUser] Creating user with ID:', id);
    console.log('[createUser] User data:', JSON.stringify(userData, null, 2));
    
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, company, phone, title, linkedin, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      id,
      userData.email,
      userData.password_hash,
      userData.first_name || null,
      userData.last_name || null,
      userData.company || null,
      userData.phone || null,
      userData.title || null,
      userData.linkedin || null,
      userData.role || 'user',
      now,
      now
    );
    
    console.log('[createUser] Insert result:', result);
    const createdUser = this.getUserById(id);
    console.log('[createUser] Verification - user created successfully:', createdUser ? 'Yes' : 'No');
    return createdUser;
  }

  getUserById(id) {
    console.log('[getUserById] Looking for user with ID:', id);
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1');
    const user = stmt.get(id);
    console.log('[getUserById] Query result:', user ? 'User found' : 'User not found');
    if (user) {
      console.log('[getUserById] User data:', JSON.stringify(user, null, 2));
      delete user.password_hash; // Never return password hash
    }
    return user;
  }

  getUserByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
    return stmt.get(email);
  }

  updateUser(id, userData) {
    const now = new Date().toISOString();
    const fields = [];
    const values = [];
    
    ['first_name', 'last_name', 'company', 'phone', 'title', 'linkedin'].forEach(field => {
      if (userData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(userData[field]);
      }
    });
    
    if (fields.length === 0) return false;
    
    fields.push('updated_at = ?');
    values.push(now, id);
    
    const stmt = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  // User Quote Management
  saveUserQuote(userId, quoteData) {
    const id = generateUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO user_quotes (id, user_id, project_name, inputs, assumptions, outputs, tags, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      userId,
      quoteData.project_name,
      JSON.stringify(quoteData.inputs),
      JSON.stringify(quoteData.assumptions),
      JSON.stringify(quoteData.outputs),
      quoteData.tags || null,
      quoteData.notes || null,
      now,
      now
    );
    
    return this.getUserQuoteById(id);
  }

  getUserQuotes(userId, limit = 50, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT * FROM user_quotes 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    const quotes = stmt.all(userId, limit, offset);
    return quotes.map(quote => {
      quote.inputs = JSON.parse(quote.inputs);
      quote.assumptions = JSON.parse(quote.assumptions);
      quote.outputs = JSON.parse(quote.outputs);
      return quote;
    });
  }

  getUserQuoteById(id) {
    const stmt = this.db.prepare('SELECT * FROM user_quotes WHERE id = ?');
    const quote = stmt.get(id);
    if (quote) {
      quote.inputs = JSON.parse(quote.inputs);
      quote.assumptions = JSON.parse(quote.assumptions);
      quote.outputs = JSON.parse(quote.outputs);
    }
    return quote;
  }

  updateUserQuote(id, userId, quoteData) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE user_quotes 
      SET project_name = ?, inputs = ?, assumptions = ?, outputs = ?, tags = ?, notes = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `);
    
    const result = stmt.run(
      quoteData.project_name,
      JSON.stringify(quoteData.inputs),
      JSON.stringify(quoteData.assumptions),
      JSON.stringify(quoteData.outputs),
      quoteData.tags || null,
      quoteData.notes || null,
      now,
      id,
      userId
    );
    
    return result.changes > 0;
  }

  deleteUserQuote(id, userId) {
    const stmt = this.db.prepare('DELETE FROM user_quotes WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  toggleQuoteFavorite(id, userId) {
    const stmt = this.db.prepare(`
      UPDATE user_quotes 
      SET is_favorite = NOT is_favorite, updated_at = ?
      WHERE id = ? AND user_id = ?
    `);
    
    const result = stmt.run(new Date().toISOString(), id, userId);
    return result.changes > 0;
  }

  close() {
    this.db.close();
  }
}

module.exports = QuoteDatabase;