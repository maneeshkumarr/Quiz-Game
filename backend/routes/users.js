const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { dbHelpers } = require('../database/database');

const router = express.Router();

// Register a new user or get existing user
router.post('/register', async (req, res) => {
  try {
    const { name, usn, email } = req.body;

    // Validation
    if (!name || !usn) {
      return res.status(400).json({ 
        error: 'Name and USN are required' 
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Name must be at least 2 characters long' 
      });
    }

    if (usn.trim().length < 3) {
      return res.status(400).json({ 
        error: 'USN must be at least 3 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await dbHelpers.getUserByNameAndUSN(name.trim(), usn.trim());
    
    if (existingUser) {
      // Check if user has already completed a quiz
      const existingSession = await dbHelpers.database.get(
        'SELECT * FROM quiz_sessions WHERE user_id = ? AND status = "completed"',
        [existingUser.id]
      );

      if (existingSession) {
        return res.status(409).json({ 
          error: 'User has already completed the quiz',
          user: existingUser,
          session: existingSession
        });
      }

      // User exists but hasn't completed quiz, allow retake
      return res.json({ 
        success: true, 
        user: existingUser,
        message: 'Welcome back! You can continue your quiz.'
      });
    }

    // Create new user
    const userId = await dbHelpers.createUser(name.trim(), usn.trim(), email?.trim());
    const user = await dbHelpers.getUserById(userId);

    res.status(201).json({ 
      success: true, 
      user,
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ 
      error: 'Failed to register user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await dbHelpers.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all users (for admin)
router.get('/', async (req, res) => {
  try {
    const users = await dbHelpers.database.all(`
      SELECT u.*, 
             COUNT(qs.id) as quiz_attempts,
             MAX(qs.percentage) as best_score,
             MAX(qs.completed_at) as last_attempt
      FROM users u 
      LEFT JOIN quiz_sessions qs ON u.id = qs.user_id 
      GROUP BY u.id 
      ORDER BY u.created_at DESC
    `);

    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;