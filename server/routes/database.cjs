const express = require('express');
const router = express.Router();
const QuoteDatabase = require('../database.cjs');

// Initialize database
const db = new QuoteDatabase();

// ===== VENDOR ROUTES =====

// Get all vendors
router.get('/vendors', (req, res) => {
  try {
    const vendors = db.getAllVendors();
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Get single vendor
router.get('/vendors/:id', (req, res) => {
  try {
    const vendor = db.getVendor(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// Create vendor
router.post('/vendors', (req, res) => {
  try {
    const vendor = db.createVendor(req.body);
    res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// Update vendor
router.put('/vendors/:id', (req, res) => {
  try {
    const vendor = db.updateVendor(req.params.id, req.body);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// ===== PRODUCT ROUTES =====

// Get products by vendor
router.get('/vendors/:vendorId/products', (req, res) => {
  try {
    const products = db.getProductsByVendor(req.params.vendorId);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Search products
router.get('/products/search', (req, res) => {
  try {
    const { q: query, category } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const products = db.searchProducts(query, category);
    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// Get single product
router.get('/products/:id', (req, res) => {
  try {
    const product = db.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
router.post('/products', (req, res) => {
  try {
    const product = db.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ===== VENDOR QUOTE ROUTES =====

// Get vendor quotes by vendor
router.get('/vendors/:vendorId/quotes', (req, res) => {
  try {
    const quotes = db.getVendorQuotesByVendor(req.params.vendorId);
    res.json(quotes);
  } catch (error) {
    console.error('Error fetching vendor quotes:', error);
    res.status(500).json({ error: 'Failed to fetch vendor quotes' });
  }
});

// Get single vendor quote
router.get('/quotes/:id', (req, res) => {
  try {
    const quote = db.getVendorQuote(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// Create vendor quote
router.post('/quotes', (req, res) => {
  try {
    const quote = db.createVendorQuote(req.body);
    res.status(201).json(quote);
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

// ===== BESS CONFIGURATION ROUTES =====

// Get all BESS configurations
router.get('/bess-configs', (req, res) => {
  try {
    const configs = db.getAllBessConfigurations();
    res.json(configs);
  } catch (error) {
    console.error('Error fetching BESS configurations:', error);
    res.status(500).json({ error: 'Failed to fetch BESS configurations' });
  }
});

// Get single BESS configuration
router.get('/bess-configs/:id', (req, res) => {
  try {
    const config = db.getBessConfiguration(req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    res.json(config);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Save BESS configuration
router.post('/bess-configs', (req, res) => {
  try {
    const config = db.saveBessConfiguration(req.body);
    res.status(201).json(config);
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// ===== MATERIALS LIBRARY ROUTES =====

// Get materials library
router.get('/materials', (req, res) => {
  try {
    const { category } = req.query;
    const materials = db.getMaterialsLibrary(category);
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// ===== UTILITY ROUTES =====

// Get product categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Database stats
router.get('/stats', (req, res) => {
  try {
    const stats = {
      vendors: db.getAllVendors().length,
      products: db.searchProducts('').length,
      materials: db.getMaterialsLibrary().length,
      configurations: db.getAllBessConfigurations().length,
      categories: db.getCategories().length
    };
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Bulk import vendors from CSV
router.post('/vendors/import', (req, res) => {
  try {
    const { vendors } = req.body;
    const results = [];
    
    vendors.forEach(vendorData => {
      try {
        const vendor = db.createVendor(vendorData);
        results.push({ success: true, vendor });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message, 
          data: vendorData 
        });
      }
    });
    
    res.json({
      imported: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error('Error importing vendors:', error);
    res.status(500).json({ error: 'Failed to import vendors' });
  }
});

module.exports = router;