const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const logger = require('../logging.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'merlin-bess-secret-key-change-in-production';

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

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = req.db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    const password_hash = await bcrypt.hash(password, 10);

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

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET
    );

    // Ensure no password hash is returned
    const safeUser = req.db.getUserById(user.id);

    res.status(201).json({
      message: 'User created successfully',
      user: safeUser,
      token
    });

  } catch (error) {
    logger.error('Registration error:', error);
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

    // Use the auth-specific method to fetch password hash only
    const authUser = req.db.getUserAuthByEmail(email);
    if (!authUser || !authUser.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, authUser.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: authUser.id, email: authUser.email },
      JWT_SECRET
    );

    // Fetch safe user object (without password_hash) for response
    const safeUser = req.db.getUserById(authUser.id);

    res.json({
      message: 'Login successful',
      user: safeUser,
      token
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    logger.debug('[profile] User ID from token:', req.user.userId);

    const user = req.db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Keep remaining routes unchanged but consider replacing console.* with logger.* as needed.

module.exports = { router, authenticateToken };
