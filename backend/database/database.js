const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'quiz_game.db');

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('📦 Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

const database = new Database();

const initDatabase = async () => {
  try {
    await database.connect();
    
    // Create users table
    await database.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        usn TEXT NOT NULL,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, usn)
      )
    `);

    // Create quiz_sessions table
    await database.run(`
      CREATE TABLE IF NOT EXISTS quiz_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_id TEXT UNIQUE NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        total_questions INTEGER DEFAULT 20,
        correct_answers INTEGER DEFAULT 0,
        percentage REAL DEFAULT 0,
        time_taken INTEGER, -- in seconds
        status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create quiz_answers table for detailed tracking
    await database.run(`
      CREATE TABLE IF NOT EXISTS quiz_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        level TEXT NOT NULL, -- 'html', 'css', 'javascript', 'react'
        selected_answer INTEGER,
        correct_answer INTEGER NOT NULL,
        is_correct BOOLEAN NOT NULL,
        time_taken INTEGER, -- time taken for this question in seconds
        answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES quiz_sessions (session_id)
      )
    `);

    // Create admin_settings table
    await database.run(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin settings
    await database.run(`
      INSERT OR IGNORE INTO admin_settings (setting_key, setting_value) 
      VALUES 
        ('quiz_time_limit', '30'),
        ('quiz_enabled', 'true'),
        ('max_attempts', '1'),
        ('show_results_immediately', 'true')
    `);

    // Create indexes for better performance
    await database.run(`CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed_at ON quiz_sessions(completed_at)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_id ON quiz_answers(session_id)`);
    await database.run(`CREATE INDEX IF NOT EXISTS idx_users_name_usn ON users(name, usn)`);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Database helper functions
const dbHelpers = {
  // User operations
  async createUser(name, usn, email = null) {
    const result = await database.run(
      'INSERT OR IGNORE INTO users (name, usn, email) VALUES (?, ?, ?)',
      [name, usn, email]
    );
    if (result.changes === 0) {
      // User already exists, get their ID
      const existingUser = await database.get(
        'SELECT id FROM users WHERE name = ? AND usn = ?',
        [name, usn]
      );
      return existingUser.id;
    }
    return result.id;
  },

  async getUserById(id) {
    return await database.get('SELECT * FROM users WHERE id = ?', [id]);
  },

  async getUserByNameAndUSN(name, usn) {
    return await database.get(
      'SELECT * FROM users WHERE name = ? AND usn = ?',
      [name, usn]
    );
  },

  // Quiz session operations
  async createQuizSession(userId, sessionId) {
    const result = await database.run(
      'INSERT INTO quiz_sessions (user_id, session_id) VALUES (?, ?)',
      [userId, sessionId]
    );
    return result.id;
  },

  async updateQuizSession(sessionId, data) {
    const { correctAnswers, percentage, timeTaken, status = 'completed' } = data;
    return await database.run(
      `UPDATE quiz_sessions 
       SET correct_answers = ?, percentage = ?, time_taken = ?, 
           status = ?, completed_at = CURRENT_TIMESTAMP 
       WHERE session_id = ?`,
      [correctAnswers, percentage, timeTaken, status, sessionId]
    );
  },

  async getQuizSession(sessionId) {
    return await database.get(
      `SELECT qs.*, u.name, u.usn 
       FROM quiz_sessions qs 
       JOIN users u ON qs.user_id = u.id 
       WHERE qs.session_id = ?`,
      [sessionId]
    );
  },

  // Quiz answers operations
  async saveQuizAnswer(sessionId, questionData) {
    const { questionId, level, selectedAnswer, correctAnswer, isCorrect, timeTaken } = questionData;
    return await database.run(
      `INSERT INTO quiz_answers 
       (session_id, question_id, level, selected_answer, correct_answer, is_correct, time_taken) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, questionId, level, selectedAnswer, correctAnswer, isCorrect, timeTaken]
    );
  },

  // Leaderboard operations
  async getLeaderboard(limit = 50) {
    return await database.all(
      `SELECT u.name, u.usn, qs.percentage, qs.correct_answers, 
              qs.total_questions, qs.time_taken, qs.completed_at,
              RANK() OVER (ORDER BY qs.percentage DESC, qs.time_taken ASC) as rank
       FROM quiz_sessions qs 
       JOIN users u ON qs.user_id = u.id 
       WHERE qs.status = 'completed' 
       ORDER BY qs.percentage DESC, qs.time_taken ASC 
       LIMIT ?`,
      [limit]
    );
  },

  async getClassroomStats() {
    const stats = await database.get(`
      SELECT 
        COUNT(DISTINCT u.id) as total_students,
        COUNT(CASE WHEN qs.status = 'completed' THEN 1 END) as completed_quizzes,
        COUNT(CASE WHEN qs.status = 'in_progress' THEN 1 END) as in_progress_quizzes,
        AVG(CASE WHEN qs.status = 'completed' THEN qs.percentage END) as average_score,
        MAX(qs.percentage) as highest_score,
        MIN(CASE WHEN qs.status = 'completed' THEN qs.percentage END) as lowest_score
      FROM users u 
      LEFT JOIN quiz_sessions qs ON u.id = qs.user_id
    `);
    return stats;
  },

  // Admin operations
  async getAllSessions() {
    return await database.all(`
      SELECT qs.*, u.name, u.usn, u.created_at as user_registered_at
      FROM quiz_sessions qs 
      JOIN users u ON qs.user_id = u.id 
      ORDER BY qs.started_at DESC
    `);
  },

  async getDetailedSessionData(sessionId) {
    const session = await database.get(`
      SELECT qs.*, u.name, u.usn 
      FROM quiz_sessions qs 
      JOIN users u ON qs.user_id = u.id 
      WHERE qs.session_id = ?
    `, [sessionId]);

    if (session) {
      const answers = await database.all(`
        SELECT * FROM quiz_answers 
        WHERE session_id = ? 
        ORDER BY answered_at ASC
      `, [sessionId]);
      
      session.answers = answers;
    }

    return session;
  }
};

module.exports = {
  database,
  initDatabase,
  dbHelpers
};