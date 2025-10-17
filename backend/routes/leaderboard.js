const express = require('express');
const { dbHelpers } = require('../database/database');

const router = express.Router();

// Get leaderboard
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const leaderboard = await dbHelpers.database.all(`
      SELECT 
        u.name, 
        u.usn, 
        qs.percentage, 
        qs.correct_answers as score, 
        qs.total_questions,
        qs.time_taken, 
        qs.completed_at,
        ROW_NUMBER() OVER (ORDER BY qs.percentage DESC, qs.time_taken ASC) as rank
      FROM quiz_sessions qs 
      JOIN users u ON qs.user_id = u.id 
      WHERE qs.status = 'completed' 
      ORDER BY qs.percentage DESC, qs.time_taken ASC 
      LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    // Get total count for pagination
    const totalCount = await dbHelpers.database.get(`
      SELECT COUNT(*) as count 
      FROM quiz_sessions qs 
      WHERE qs.status = 'completed'
    `);

    res.json({ 
      success: true, 
      leaderboard,
      pagination: {
        total: totalCount.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount.count
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get real-time leaderboard (for live updates during class)
router.get('/live', async (req, res) => {
  try {
    const liveData = await dbHelpers.database.all(`
      SELECT 
        u.name, 
        u.usn, 
        qs.percentage, 
        qs.correct_answers as score, 
        qs.total_questions,
        qs.time_taken, 
        qs.status,
        qs.completed_at,
        qs.started_at,
        ROW_NUMBER() OVER (ORDER BY qs.percentage DESC, qs.time_taken ASC) as rank,
        CASE 
          WHEN qs.status = 'completed' THEN 'Completed'
          WHEN qs.status = 'in_progress' THEN 'In Progress'
          ELSE 'Not Started'
        END as display_status
      FROM quiz_sessions qs 
      JOIN users u ON qs.user_id = u.id 
      ORDER BY 
        CASE WHEN qs.status = 'completed' THEN 1 ELSE 2 END,
        qs.percentage DESC, 
        qs.time_taken ASC
    `);

    // Get summary statistics
    const summary = await dbHelpers.database.get(`
      SELECT 
        COUNT(DISTINCT u.id) as total_registered,
        COUNT(CASE WHEN qs.status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN qs.status = 'in_progress' THEN 1 END) as in_progress,
        AVG(CASE WHEN qs.status = 'completed' THEN qs.percentage END) as avg_score,
        MAX(CASE WHEN qs.status = 'completed' THEN qs.percentage END) as highest_score
      FROM users u 
      LEFT JOIN quiz_sessions qs ON u.id = qs.user_id
    `);

    res.json({ 
      success: true, 
      liveData,
      summary: {
        totalRegistered: summary.total_registered || 0,
        completed: summary.completed || 0,
        inProgress: summary.in_progress || 0,
        notStarted: (summary.total_registered || 0) - (summary.completed || 0) - (summary.in_progress || 0),
        averageScore: Math.round(summary.avg_score || 0),
        highestScore: summary.highest_score || 0
      }
    });

  } catch (error) {
    console.error('Error fetching live leaderboard:', error);
    res.status(500).json({ 
      error: 'Failed to fetch live leaderboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's rank and position
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's session
    const userSession = await dbHelpers.database.get(`
      SELECT qs.*, u.name, u.usn
      FROM quiz_sessions qs 
      JOIN users u ON qs.user_id = u.id 
      WHERE qs.user_id = ? AND qs.status = 'completed'
      ORDER BY qs.completed_at DESC
      LIMIT 1
    `, [userId]);

    if (!userSession) {
      return res.status(404).json({ 
        error: 'No completed quiz found for this user' 
      });
    }

    // Get user's rank
    const rankData = await dbHelpers.database.get(`
      SELECT COUNT(*) + 1 as rank
      FROM quiz_sessions qs1
      WHERE qs1.status = 'completed' 
      AND (qs1.percentage > ? OR (qs1.percentage = ? AND qs1.time_taken < ?))
    `, [userSession.percentage, userSession.percentage, userSession.time_taken]);

    // Get users above and below
    const contextUsers = await dbHelpers.database.all(`
      WITH ranked_users AS (
        SELECT 
          u.name, u.usn, qs.percentage, qs.correct_answers as score,
          qs.total_questions, qs.time_taken, qs.completed_at,
          ROW_NUMBER() OVER (ORDER BY qs.percentage DESC, qs.time_taken ASC) as rank
        FROM quiz_sessions qs 
        JOIN users u ON qs.user_id = u.id 
        WHERE qs.status = 'completed'
      )
      SELECT * FROM ranked_users 
      WHERE rank BETWEEN ? AND ?
    `, [Math.max(1, rankData.rank - 2), rankData.rank + 2]);

    res.json({ 
      success: true, 
      userSession: {
        ...userSession,
        rank: rankData.rank
      },
      contextUsers
    });

  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user rank',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get leaderboard by class/group (if you want to filter by specific criteria)
router.get('/class/:className', async (req, res) => {
  try {
    const { className } = req.params;
    
    // This is a placeholder - you could extend the users table to include class information
    // For now, we'll just return the regular leaderboard
    const leaderboard = await dbHelpers.getLeaderboard(50);
    
    res.json({ 
      success: true, 
      leaderboard,
      className
    });

  } catch (error) {
    console.error('Error fetching class leaderboard:', error);
    res.status(500).json({ 
      error: 'Failed to fetch class leaderboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;