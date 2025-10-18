// Enhanced localStorage service for frontend-only quiz application
class EnhancedStorageService {
  constructor() {
    this.storageKeys = {
      users: 'quiz_users',
      sessions: 'quiz_sessions', 
      leaderboard: 'quiz_leaderboard',
      currentSession: 'quiz_current_session',
      analytics: 'quiz_analytics',
      settings: 'quiz_settings'
    };
    
    // Initialize storage if not exists
    this.initializeStorage();
    
    // Set up real-time updates
    this.setupStorageListener();
    this.subscribers = [];
  }

  initializeStorage() {
    Object.values(this.storageKeys).forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    });

    // Initialize settings
    if (!localStorage.getItem(this.storageKeys.settings)) {
      localStorage.setItem(this.storageKeys.settings, JSON.stringify({
        quizEnabled: true,
        maxAttempts: 1,
        timeLimit: 30,
        totalQuestions: 20,
        createdAt: new Date().toISOString()
      }));
    }
  }

  // Real-time updates using storage events
  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (Object.values(this.storageKeys).includes(e.key)) {
        this.notifySubscribers(e.key, JSON.parse(e.newValue || '[]'));
      }
    });

    // For same-tab updates (storage event doesn't fire on same tab)
    this.originalSetItem = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      this.originalSetItem.call(localStorage, key, value);
      if (Object.values(this.storageKeys).includes(key)) {
        this.notifySubscribers(key, JSON.parse(value));
      }
    };
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notifySubscribers(key, data) {
    this.subscribers.forEach(callback => {
      try {
        callback({ key, data });
      } catch (error) {
        console.error('Error in storage subscriber:', error);
      }
    });
  }

  // User Management
  async registerUser(userData) {
    const users = this.getUsers();
    const existingUser = users.find(u => u.name === userData.name && u.usn === userData.usn);
    
    if (existingUser) {
      // Check if user already completed quiz
      const sessions = this.getSessions();
      const completedSession = sessions.find(s => 
        s.userId === existingUser.id && s.status === 'completed'
      );
      
      if (completedSession) {
        throw new Error('User has already completed the quiz');
      }
      
      return { success: true, user: existingUser, message: 'Welcome back!' };
    }

    // Create new user
    const newUser = {
      id: this.generateId(),
      name: userData.name.trim(),
      usn: userData.usn.trim(),
      email: userData.email || null,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(this.storageKeys.users, JSON.stringify(users));
    
    return { success: true, user: newUser, message: 'User registered successfully' };
  }

  getUsers() {
    return JSON.parse(localStorage.getItem(this.storageKeys.users) || '[]');
  }

  getUserById(userId) {
    const users = this.getUsers();
    return users.find(u => u.id === userId);
  }

  // Quiz Session Management
  async startQuiz(userId) {
    const sessions = this.getSessions();
    
    // Check for existing incomplete session
    const existingSession = sessions.find(s => 
      s.userId === userId && s.status === 'in_progress'
    );

    if (existingSession) {
      return { success: true, sessionId: existingSession.id };
    }

    // Check if user already completed
    const completedSession = sessions.find(s => 
      s.userId === userId && s.status === 'completed'
    );

    if (completedSession) {
      throw new Error('User has already completed the quiz');
    }

    // Create new session
    const sessionId = this.generateId();
    const newSession = {
      id: sessionId,
      userId,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      answers: [],
      score: 0,
      totalQuestions: 20,
      currentQuestion: 0,
      currentLevel: 0
    };

    sessions.push(newSession);
    localStorage.setItem(this.storageKeys.sessions, JSON.stringify(sessions));
    
    return { success: true, sessionId };
  }

  async submitAnswer(answerData) {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === answerData.sessionId);
    
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }

    const session = sessions[sessionIndex];
    if (session.status !== 'in_progress') {
      throw new Error('Session is not active');
    }

    // Add answer to session
    const answer = {
      questionId: answerData.questionId,
      level: answerData.level,
      selectedAnswer: answerData.selectedAnswer,
      correctAnswer: answerData.correctAnswer,
      isCorrect: answerData.selectedAnswer === answerData.correctAnswer,
      timeTaken: answerData.timeTaken || 0,
      answeredAt: new Date().toISOString()
    };

    session.answers.push(answer);
    if (answer.isCorrect) {
      session.score++;
    }

    sessions[sessionIndex] = session;
    localStorage.setItem(this.storageKeys.sessions, JSON.stringify(sessions));

    // Update analytics
    this.updateAnalytics(answer);

    return { success: true, isCorrect: answer.isCorrect };
  }

  async completeQuiz(sessionId, totalTimeTaken) {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }

    const session = sessions[sessionIndex];
    const user = this.getUserById(session.userId);
    
    // Complete session
    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    session.timeTaken = totalTimeTaken;
    session.percentage = Math.round((session.score / session.totalQuestions) * 100);

    sessions[sessionIndex] = session;
    localStorage.setItem(this.storageKeys.sessions, JSON.stringify(sessions));

    // Update leaderboard
    this.updateLeaderboard({
      name: user.name,
      usn: user.usn,
      score: session.score,
      totalQuestions: session.totalQuestions,
      percentage: session.percentage,
      timeTaken: totalTimeTaken,
      timestamp: session.completedAt,
      sessionId: session.id
    });

    return { 
      success: true, 
      session: { ...session, name: user.name, usn: user.usn },
      results: {
        score: session.score,
        totalQuestions: session.totalQuestions,
        percentage: session.percentage,
        timeTaken: totalTimeTaken
      }
    };
  }

  getSessions() {
    return JSON.parse(localStorage.getItem(this.storageKeys.sessions) || '[]');
  }

  getSession(sessionId) {
    const sessions = this.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const user = this.getUserById(session.userId);
      return { ...session, name: user?.name, usn: user?.usn };
    }
    return null;
  }

  // Leaderboard Management
  getLeaderboard(limit = 50) {
    const leaderboard = JSON.parse(localStorage.getItem(this.storageKeys.leaderboard) || '[]');
    return leaderboard
      .sort((a, b) => {
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage;
        }
        return a.timeTaken - b.timeTaken;
      })
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  getLiveLeaderboard() {
    const users = this.getUsers();
    const sessions = this.getSessions();
    
    const liveData = users.map(user => {
      const userSessions = sessions.filter(s => s.userId === user.id);
      const latestSession = userSessions[userSessions.length - 1];
      
      if (!latestSession) {
        return {
          name: user.name,
          usn: user.usn,
          status: 'not_started',
          display_status: 'Not Started',
          percentage: 0,
          score: 0,
          totalQuestions: 20,
          rank: 999
        };
      }

      return {
        name: user.name,
        usn: user.usn,
        status: latestSession.status,
        display_status: latestSession.status === 'completed' ? 'Completed' : 'In Progress',
        percentage: latestSession.percentage || 0,
        score: latestSession.score || 0,
        totalQuestions: latestSession.totalQuestions || 20,
        timeTaken: latestSession.timeTaken,
        completedAt: latestSession.completedAt,
        startedAt: latestSession.startedAt
      };
    });

    // Sort by status and score
    liveData.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return -1;
      if (b.status === 'completed' && a.status !== 'completed') return 1;
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return (a.timeTaken || 999999) - (b.timeTaken || 999999);
    });

    // Add ranks
    liveData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    const summary = this.getClassroomStats();

    return {
      success: true,
      liveData,
      summary
    };
  }

  updateLeaderboard(entry) {
    const leaderboard = JSON.parse(localStorage.getItem(this.storageKeys.leaderboard) || '[]');
    
    // Remove any existing entry for this user (in case of retake)
    const filteredLeaderboard = leaderboard.filter(
      item => !(item.name === entry.name && item.usn === entry.usn)
    );
    
    filteredLeaderboard.push(entry);
    localStorage.setItem(this.storageKeys.leaderboard, JSON.stringify(filteredLeaderboard));
  }

  // Analytics
  updateAnalytics(answer) {
    const analytics = JSON.parse(localStorage.getItem(this.storageKeys.analytics) || '{}');
    
    if (!analytics.questions) analytics.questions = {};
    if (!analytics.levels) analytics.levels = {};

    const questionKey = `${answer.level}_${answer.questionId}`;
    
    if (!analytics.questions[questionKey]) {
      analytics.questions[questionKey] = {
        level: answer.level,
        questionId: answer.questionId,
        totalAttempts: 0,
        correctAttempts: 0,
        totalTime: 0
      };
    }

    analytics.questions[questionKey].totalAttempts++;
    if (answer.isCorrect) {
      analytics.questions[questionKey].correctAttempts++;
    }
    analytics.questions[questionKey].totalTime += answer.timeTaken;

    // Level analytics
    if (!analytics.levels[answer.level]) {
      analytics.levels[answer.level] = {
        totalAttempts: 0,
        correctAttempts: 0,
        totalTime: 0
      };
    }

    analytics.levels[answer.level].totalAttempts++;
    if (answer.isCorrect) {
      analytics.levels[answer.level].correctAttempts++;
    }
    analytics.levels[answer.level].totalTime += answer.timeTaken;

    localStorage.setItem(this.storageKeys.analytics, JSON.stringify(analytics));
  }

  getQuestionAnalytics() {
    const analytics = JSON.parse(localStorage.getItem(this.storageKeys.analytics) || '{}');
    
    if (!analytics.questions) {
      return {
        success: true,
        questionStats: { html: [], css: [], javascript: [], react: [] },
        summary: { totalQuestions: 0, averageSuccessRate: 0 }
      };
    }

    const questionStats = {
      html: [],
      css: [],
      javascript: [],
      react: []
    };

    Object.entries(analytics.questions).forEach(([key, data]) => {
      const successRate = data.totalAttempts > 0 
        ? Math.round((data.correctAttempts / data.totalAttempts) * 100) 
        : 0;
      
      const avgTime = data.totalAttempts > 0 
        ? Math.round(data.totalTime / data.totalAttempts) 
        : 0;

      const questionStat = {
        question_id: data.questionId,
        level: data.level,
        total_attempts: data.totalAttempts,
        correct_attempts: data.correctAttempts,
        success_rate: successRate,
        avg_time: avgTime
      };

      if (questionStats[data.level]) {
        questionStats[data.level].push(questionStat);
      }
    });

    // Calculate summary
    const allQuestions = Object.values(questionStats).flat();
    const averageSuccessRate = allQuestions.length > 0
      ? Math.round(allQuestions.reduce((sum, q) => sum + q.success_rate, 0) / allQuestions.length)
      : 0;

    return {
      success: true,
      questionStats,
      summary: {
        totalQuestions: allQuestions.length,
        averageSuccessRate,
        hardestQuestions: allQuestions.sort((a, b) => a.success_rate - b.success_rate).slice(0, 5),
        easiestQuestions: allQuestions.sort((a, b) => b.success_rate - a.success_rate).slice(0, 5)
      }
    };
  }

  // Dashboard data
  getDashboard() {
    const users = this.getUsers();
    const sessions = this.getSessions();
    const analytics = JSON.parse(localStorage.getItem(this.storageKeys.analytics) || '{}');

    const stats = this.getClassroomStats();
    
    // Recent activity
    const recentActivity = sessions
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, 20)
      .map(session => {
        const user = this.getUserById(session.userId);
        return {
          name: user?.name || 'Unknown',
          usn: user?.usn || 'Unknown',
          status: session.status,
          percentage: session.percentage || 0,
          started_at: session.startedAt,
          completed_at: session.completedAt,
          last_activity: session.completedAt || session.startedAt
        };
      });

    // Level performance
    const levelPerformance = [];
    if (analytics.levels) {
      Object.entries(analytics.levels).forEach(([level, data]) => {
        levelPerformance.push({
          level,
          total_questions_answered: data.totalAttempts,
          correct_answers: data.correctAttempts,
          accuracy_rate: data.totalAttempts > 0 
            ? Math.round((data.correctAttempts / data.totalAttempts) * 100) 
            : 0,
          avg_time_per_question: data.totalAttempts > 0 
            ? Math.round(data.totalTime / data.totalAttempts) 
            : 0
        });
      });
    }

    return {
      success: true,
      dashboard: {
        stats,
        recentActivity,
        levelPerformance
      }
    };
  }

  getClassroomStats() {
    const users = this.getUsers();
    const sessions = this.getSessions();
    
    const totalStudents = users.length;
    const completedQuizzes = sessions.filter(s => s.status === 'completed').length;
    const inProgressQuizzes = sessions.filter(s => s.status === 'in_progress').length;
    
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const averageScore = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((sum, s) => sum + (s.percentage || 0), 0) / completedSessions.length)
      : 0;
    
    const highestScore = completedSessions.length > 0
      ? Math.max(...completedSessions.map(s => s.percentage || 0))
      : 0;

    return {
      totalRegistered: totalStudents,
      completed: completedQuizzes,
      inProgress: inProgressQuizzes,
      notStarted: totalStudents - completedQuizzes - inProgressQuizzes,
      averageScore,
      highestScore
    };
  }

  // Utility functions
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  exportResults() {
    const leaderboard = this.getLeaderboard(1000); // Get all results
    const users = this.getUsers();
    const sessions = this.getSessions();

    const results = leaderboard.map(entry => {
      const session = sessions.find(s => s.sessionId === entry.sessionId);
      return {
        'Student Name': entry.name,
        'USN': entry.usn,
        'Score (%)': entry.percentage,
        'Correct Answers': entry.score,
        'Total Questions': entry.totalQuestions,
        'Time Taken (seconds)': entry.timeTaken,
        'Completed At': entry.timestamp,
        'Status': 'Completed'
      };
    });

    // Convert to CSV
    if (results.length === 0) {
      return { success: true, data: '', message: 'No results to export' };
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

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, message: 'Results exported successfully' };
  }

  resetData() {
    Object.values(this.storageKeys).forEach(key => {
      localStorage.removeItem(key);
    });
    this.initializeStorage();
    return { success: true, message: 'All data has been reset successfully' };
  }

  // Health check
  healthCheck() {
    const users = this.getUsers();
    const sessions = this.getSessions();
    
    return {
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      stats: {
        totalUsers: users.length,
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length
      }
    };
  }
}

// Create and export a singleton instance
const enhancedStorageService = new EnhancedStorageService();
export default enhancedStorageService;