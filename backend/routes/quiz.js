const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { dbHelpers } = require('../database/database');

const router = express.Router();

// Start a new quiz session
router.post('/start', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user exists
    const user = await dbHelpers.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has a completed session
    const { database } = require('../database/database');
    const existingSession = await database.get(
      'SELECT * FROM quiz_sessions WHERE user_id = ? AND status = "completed"',
      [userId]
    );

    if (existingSession) {
      return res.status(409).json({ 
        error: 'User has already completed the quiz',
        session: existingSession
      });
    }

    // Check for incomplete session
    const incompleteSession = await database.get(
      'SELECT * FROM quiz_sessions WHERE user_id = ? AND status = "in_progress"',
      [userId]
    );

    if (incompleteSession) {
      return res.json({ 
        success: true, 
        sessionId: incompleteSession.session_id,
        message: 'Resuming existing quiz session'
      });
    }

    // Create new session
    const sessionId = uuidv4();
    await dbHelpers.createQuizSession(userId, sessionId);

    res.json({ 
      success: true, 
      sessionId,
      message: 'Quiz session started successfully'
    });

  } catch (error) {
    console.error('Error starting quiz session:', error);
    res.status(500).json({ 
      error: 'Failed to start quiz session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Submit an answer
router.post('/answer', async (req, res) => {
  try {
    const { 
      sessionId, 
      questionId, 
      level, 
      selectedAnswer, 
      correctAnswer, 
      timeTaken 
    } = req.body;

    if (!sessionId || questionId === undefined || !level || 
        selectedAnswer === undefined || correctAnswer === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, questionId, level, selectedAnswer, correctAnswer' 
      });
    }

    // Verify session exists and is active
    const session = await dbHelpers.getQuizSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Quiz session not found' });
    }

    if (session.status !== 'in_progress') {
      return res.status(409).json({ error: 'Quiz session is not active' });
    }

    const isCorrect = selectedAnswer === correctAnswer;

    // Save the answer
    await dbHelpers.saveQuizAnswer(sessionId, {
      questionId: questionId.toString(),
      level,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      timeTaken: timeTaken || 0
    });

    res.json({ 
      success: true, 
      isCorrect,
      message: 'Answer submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ 
      error: 'Failed to submit answer',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Complete quiz session
router.post('/complete', async (req, res) => {
  try {
    const { sessionId, totalTimeTaken } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get session details
    const session = await dbHelpers.getQuizSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Quiz session not found' });
    }

    if (session.status !== 'in_progress') {
      return res.status(409).json({ error: 'Quiz session is not active' });
    }

    // Calculate results
    const correctAnswers = await database.get(
      'SELECT COUNT(*) as count FROM quiz_answers WHERE session_id = ? AND is_correct = 1',
      [sessionId]
    );

    const totalQuestions = 20; // Fixed for now
    const correctCount = correctAnswers.count;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    // Update session
    await dbHelpers.updateQuizSession(sessionId, {
      correctAnswers: correctCount,
      percentage,
      timeTaken: totalTimeTaken || 0,
      status: 'completed'
    });

    // Get updated session data
    const completedSession = await dbHelpers.getQuizSession(sessionId);

    // Emit real-time update to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.to('quiz-room').emit('leaderboard-update', {
        name: session.name,
        usn: session.usn,
        percentage,
        score: correctCount,
        totalQuestions
      });
    }

    res.json({ 
      success: true, 
      session: completedSession,
      results: {
        score: correctCount,
        totalQuestions,
        percentage,
        timeTaken: totalTimeTaken || 0
      },
      message: 'Quiz completed successfully'
    });

  } catch (error) {
    console.error('Error completing quiz:', error);
    res.status(500).json({ 
      error: 'Failed to complete quiz',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get quiz session details
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await dbHelpers.getQuizSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Quiz session not found' });
    }

    // Get answers for this session  
    const answers = await database.all(
      'SELECT * FROM quiz_answers WHERE session_id = ? ORDER BY answered_at ASC',
      [sessionId]
    );

    res.json({ 
      success: true, 
      session: {
        ...session,
        answers
      }
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ 
      error: 'Failed to fetch session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get quiz statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await dbHelpers.getClassroomStats();
    
    // Get level-wise statistics
    const levelStats = await database.all(`
      SELECT 
        level,
        COUNT(*) as total_answers,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        ROUND(AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) as accuracy_percentage,
        AVG(time_taken) as avg_time_per_question
      FROM quiz_answers qa
      JOIN quiz_sessions qs ON qa.session_id = qs.session_id
      WHERE qs.status = 'completed'
      GROUP BY level
      ORDER BY level
    `);

    res.json({ 
      success: true, 
      stats: {
        ...stats,
        levelStats
      }
    });

  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quiz statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;