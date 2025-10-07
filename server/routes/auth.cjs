const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'merlin-bess-secret-key-change-in-production';
// Removed JWT_EXPIRES_IN - sessions persist until logout

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, company, phone, title, linkedin } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = req.db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const userData = {
      email,
      password_hash,
      first_name,
      last_name,
      company,
      phone,
      title,
      linkedin
    };

    const user = req.db.createUser(userData);

    // Generate JWT token (no expiration - persists until logout)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET
    );

    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user with password hash
    const user = req.db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token (no expiration - persists until logout)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET
    );

    // Remove password hash from response
    delete user.password_hash;

    res.json({
      message: 'Login successful',
      user,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    console.log('[profile] User ID from token:', req.user.userId);
    console.log('[profile] User email from token:', req.user.email);
    
    const user = req.db.getUserById(req.user.userId);
    console.log('[profile] User found in database:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('[profile] User not found, checking all users...');
      // Debug: Check if user exists at all
      const userByEmail = req.db.getUserByEmail(req.user.email);
      console.log('[profile] User found by email:', userByEmail ? 'Yes' : 'No');
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data directly (not wrapped in { user })
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Temporary debug endpoint
router.get('/debug/users', (req, res) => {
  try {
    const users = req.db.db.prepare('SELECT id, email, first_name, last_name, created_at FROM users LIMIT 10').all();
    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { first_name, last_name, company, phone, title, linkedin } = req.body;
    
    const updated = req.db.updateUser(req.user.userId, {
      first_name,
      last_name,
      company,
      phone,
      title,
      linkedin
    });

    if (!updated) {
      return res.status(400).json({ error: 'No changes made' });
    }

    const user = req.db.getUserById(req.user.userId);
    res.json({ message: 'Profile updated successfully', user });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Save user quote
router.post('/quotes', authenticateToken, (req, res) => {
  try {
    const { project_name, inputs, assumptions, outputs, tags, notes } = req.body;

    if (!project_name || !inputs || !assumptions || !outputs) {
      return res.status(400).json({ error: 'Missing required quote data' });
    }

    // Debug logging
    console.log('[save-quote] User ID from token:', req.user.userId);
    console.log('[save-quote] Project name:', project_name);
    
    // Check if user exists
    const user = req.db.getUserById(req.user.userId);
    if (!user) {
      console.log('[save-quote] User not found in database:', req.user.userId);
      return res.status(404).json({ error: 'User not found. Please log in again.' });
    }

    const quoteData = {
      project_name,
      inputs,
      assumptions,
      outputs,
      tags,
      notes
    };

    const quote = req.db.saveUserQuote(req.user.userId, quoteData);
    console.log('[save-quote] Quote saved successfully for user:', req.user.userId);
    res.status(201).json({ message: 'Quote saved successfully', quote });

  } catch (error) {
    console.error('Save quote error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      userId: req.user?.userId,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to save quote' });
  }
});

// Get user quotes
router.get('/quotes', authenticateToken, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const quotes = req.db.getUserQuotes(req.user.userId, limit, offset);
    res.json({ quotes });

  } catch (error) {
    console.error('Fetch quotes error:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// Get specific quote
router.get('/quotes/:id', authenticateToken, (req, res) => {
  try {
    const quote = req.db.getUserQuoteById(req.params.id);
    if (!quote || quote.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json({ quote });

  } catch (error) {
    console.error('Fetch quote error:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// Update quote
router.put('/quotes/:id', authenticateToken, (req, res) => {
  try {
    const { project_name, inputs, assumptions, outputs, tags, notes } = req.body;

    const quoteData = {
      project_name,
      inputs,
      assumptions,
      outputs,
      tags,
      notes
    };

    const updated = req.db.updateUserQuote(req.params.id, req.user.userId, quoteData);
    if (!updated) {
      return res.status(404).json({ error: 'Quote not found or no changes made' });
    }

    const quote = req.db.getUserQuoteById(req.params.id);
    res.json({ message: 'Quote updated successfully', quote });

  } catch (error) {
    console.error('Update quote error:', error);
    res.status(500).json({ error: 'Failed to update quote' });
  }
});

// Delete quote
router.delete('/quotes/:id', authenticateToken, (req, res) => {
  try {
    const deleted = req.db.deleteUserQuote(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json({ message: 'Quote deleted successfully' });

  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
});

// Toggle quote favorite
router.patch('/quotes/:id/favorite', authenticateToken, (req, res) => {
  try {
    const updated = req.db.toggleQuoteFavorite(req.params.id, req.user.userId);
    if (!updated) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const quote = req.db.getUserQuoteById(req.params.id);
    res.json({ message: 'Quote favorite status updated', quote });

  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to update favorite status' });
  }
});

// Logout endpoint (for completeness - with persistent tokens, client just removes localStorage)
router.post('/logout', authenticateToken, (req, res) => {
  // Since we're using persistent JWT tokens without a blacklist system,
  // logout is handled client-side by removing the token from localStorage
  res.json({ message: 'Logged out successfully' });
});

module.exports = { router, authenticateToken };