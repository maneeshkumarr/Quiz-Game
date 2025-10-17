const express = require('express');
const { dbHelpers } = require('../database/database');

const router = express.Router();

// Get classroom dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // Get overall statistics
    const stats = await dbHelpers.getClassroomStats();
    
    // Get recent activity
    const recentActivity = await dbHelpers.database.all(`
      SELECT 
        u.name, u.usn, qs.status, qs.percentage, 
        qs.started_at, qs.completed_at,
        CASE 
          WHEN qs.status = 'completed' THEN qs.completed_at
          ELSE qs.started_at
        END as last_activity
      FROM quiz_sessions qs 
      JOIN users u ON qs.user_id = u.id 
      ORDER BY last_activity DESC 
      LIMIT 20
    `);

    // Get level-wise performance
    const levelPerformance = await dbHelpers.database.all(`
      SELECT 
        level,
        COUNT(*) as total_questions_answered,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        ROUND(AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) as accuracy_rate,
        AVG(time_taken) as avg_time_per_question
      FROM quiz_answers qa
      JOIN quiz_sessions qs ON qa.session_id = qs.session_id
      WHERE qs.status = 'completed'
      GROUP BY level
      ORDER BY 
        CASE level 
          WHEN 'html' THEN 1 
          WHEN 'css' THEN 2 
          WHEN 'javascript' THEN 3 
          WHEN 'react' THEN 4 
          ELSE 5 
        END
    `);

    // Get time distribution
    const timeDistribution = await dbHelpers.database.all(`
      SELECT 
        CASE 
          WHEN time_taken <= 300 THEN '0-5 min'
          WHEN time_taken <= 600 THEN '5-10 min'
          WHEN time_taken <= 900 THEN '10-15 min'
          WHEN time_taken <= 1200 THEN '15-20 min'
          ELSE '20+ min'
        END as time_range,
        COUNT(*) as student_count,
        AVG(percentage) as avg_score
      FROM quiz_sessions 
      WHERE status = 'completed' AND time_taken IS NOT NULL
      GROUP BY 
        CASE 
          WHEN time_taken <= 300 THEN '0-5 min'
          WHEN time_taken <= 600 THEN '5-10 min'
          WHEN time_taken <= 900 THEN '10-15 min'
          WHEN time_taken <= 1200 THEN '15-20 min'
          ELSE '20+ min'
        END
      ORDER BY 
        CASE 
          WHEN time_taken <= 300 THEN 1
          WHEN time_taken <= 600 THEN 2
          WHEN time_taken <= 900 THEN 3
          WHEN time_taken <= 1200 THEN 4
          ELSE 5
        END
    `);

    res.json({
      success: true,
      dashboard: {
        stats,
        recentActivity,
        levelPerformance,
        timeDistribution
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all quiz sessions with detailed information
router.get('/sessions', async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (status) {
      whereClause = 'WHERE qs.status = ?';
      params.push(status);
    }
    
    params.push(parseInt(limit), parseInt(offset));

    const sessions = await dbHelpers.database.all(`
      SELECT 
        qs.*, 
        u.name, 
        u.usn, 
        u.created_at as user_registered_at,
        COUNT(qa.id) as questions_answered
      FROM quiz_sessions qs 
      JOIN users u ON qs.user_id = u.id 
      LEFT JOIN quiz_answers qa ON qs.session_id = qa.session_id
      ${whereClause}
      GROUP BY qs.id
      ORDER BY qs.started_at DESC 
      LIMIT ? OFFSET ?
    `, params);

    // Get total count
    const countParams = status ? [status] : [];
    const totalCount = await dbHelpers.database.get(`
      SELECT COUNT(*) as count 
      FROM quiz_sessions qs 
      ${whereClause}
    `, countParams);

    res.json({
      success: true,
      sessions,
      pagination: {
        total: totalCount.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount.count
      }
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sessions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get detailed session information
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const sessionData = await dbHelpers.getDetailedSessionData(sessionId);
    
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      session: sessionData
    });

  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch session details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get question-wise analytics
router.get('/analytics/questions', async (req, res) => {
  try {
    const questionStats = await dbHelpers.database.all(`
      SELECT 
        question_id,
        level,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
        ROUND(AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) as success_rate,
        AVG(time_taken) as avg_time,
        MIN(time_taken) as min_time,
        MAX(time_taken) as max_time
      FROM quiz_answers qa
      JOIN quiz_sessions qs ON qa.session_id = qs.session_id
      WHERE qs.status = 'completed'
      GROUP BY question_id, level
      ORDER BY level, CAST(question_id AS INTEGER)
    `);

    // Group by level for easier frontend consumption
    const groupedStats = {
      html: questionStats.filter(q => q.level === 'html'),
      css: questionStats.filter(q => q.level === 'css'),
      javascript: questionStats.filter(q => q.level === 'javascript'),
      react: questionStats.filter(q => q.level === 'react')
    };

    res.json({
      success: true,
      questionStats: groupedStats,
      summary: {
        totalQuestions: questionStats.length,
        averageSuccessRate: Math.round(questionStats.reduce((sum, q) => sum + q.success_rate, 0) / questionStats.length),
        hardestQuestions: questionStats
          .sort((a, b) => a.success_rate - b.success_rate)
          .slice(0, 5),
        easiestQuestions: questionStats
          .sort((a, b) => b.success_rate - a.success_rate)
          .slice(0, 5)
      }
    });

  } catch (error) {
    console.error('Error fetching question analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch question analytics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export quiz results to CSV format
router.get('/export/results', async (req, res) => {
  try {
    const results = await dbHelpers.database.all(`
      SELECT 
        u.name as "Student Name",
        u.usn as "USN",
        qs.percentage as "Score (%)",
        qs.correct_answers as "Correct Answers",
        qs.total_questions as "Total Questions",
        qs.time_taken as "Time Taken (seconds)",
        qs.started_at as "Started At",
        qs.completed_at as "Completed At",
        qs.status as "Status"
      FROM quiz_sessions qs 
      JOIN users u ON qs.user_id = u.id 
      ORDER BY qs.percentage DESC, qs.time_taken ASC
    `);

    // Convert to CSV
    if (results.length === 0) {
      return res.json({ success: true, data: [], message: 'No results to export' });
    }

    const headers = Object.keys(results[0]);
    const csvContent = [
      headers.join(','),
      ...results.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=quiz-results.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting results:', error);
    res.status(500).json({ 
      error: 'Failed to export results',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Reset/clear all quiz data (use with caution!)
router.post('/reset', async (req, res) => {
  try {
    const { confirmReset } = req.body;
    
    if (confirmReset !== 'YES_DELETE_ALL_DATA') {
      return res.status(400).json({ 
        error: 'Reset confirmation required. Send { confirmReset: "YES_DELETE_ALL_DATA" }' 
      });
    }

    // Delete all data in correct order (respecting foreign keys)
    await dbHelpers.database.run('DELETE FROM quiz_answers');
    await dbHelpers.database.run('DELETE FROM quiz_sessions');
    await dbHelpers.database.run('DELETE FROM users');

    res.json({
      success: true,
      message: 'All quiz data has been reset successfully'
    });

  } catch (error) {
    console.error('Error resetting data:', error);
    res.status(500).json({ 
      error: 'Failed to reset data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;