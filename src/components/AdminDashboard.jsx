import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import socketService from '../services/socketService';
import './AdminDashboard.css';

const AdminDashboard = ({ onBack }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sessions, setSessions] = useState([]);
  const [questionAnalytics, setQuestionAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getDashboard();
      if (response.success) {
        setDashboardData(response.dashboard);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await apiService.getAllSessions();
      if (response.success) {
        setSessions(response.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  }, []);

  const fetchQuestionAnalytics = useCallback(async () => {
    try {
      const response = await apiService.getQuestionAnalytics();
      if (response.success) {
        setQuestionAnalytics(response);
      }
    } catch (error) {
      console.error('Failed to fetch question analytics:', error);
    }
  }, []);

  const handleExportResults = async () => {
    try {
      const blob = await apiService.exportResults();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-results-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export results:', error);
      alert('Failed to export results. Please try again.');
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset ALL quiz data? This action cannot be undone!')) {
      const confirmation = prompt('Type "DELETE ALL DATA" to confirm:');
      if (confirmation === 'DELETE ALL DATA') {
        try {
          await apiService.resetData();
          alert('All data has been reset successfully.');
          fetchDashboardData();
          fetchSessions();
        } catch (error) {
          console.error('Failed to reset data:', error);
          alert('Failed to reset data. Please try again.');
        }
      }
    }
  };

  // Real-time updates
  const handleRealtimeUpdate = useCallback(() => {
    fetchDashboardData();
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [fetchDashboardData, fetchSessions, activeTab]);

  useEffect(() => {
    fetchDashboardData();
    
    // Connect to WebSocket for real-time updates
    socketService.connect();
    socketService.onLeaderboardUpdate(handleRealtimeUpdate);
    
    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
      if (activeTab === 'sessions') {
        fetchSessions();
      }
    }, 30000);

    return () => {
      socketService.offLeaderboardUpdate(handleRealtimeUpdate);
      clearInterval(refreshInterval);
    };
  }, [fetchDashboardData, handleRealtimeUpdate, activeTab]);

  useEffect(() => {
    if (activeTab === 'sessions' && sessions.length === 0) {
      fetchSessions();
    } else if (activeTab === 'analytics' && !questionAnalytics) {
      fetchQuestionAnalytics();
    }
  }, [activeTab, sessions.length, questionAnalytics, fetchSessions, fetchQuestionAnalytics]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#06ffa5';
      case 'in_progress': return '#ffe66d';
      default: return '#ff6b6b';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="admin-container">
        <div className="cosmic-bg"></div>
        <div className="loading-card">
          <div className="loading-spinner"></div>
          <h2>Loading Admin Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="cosmic-bg"></div>
      
      <div className="admin-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Quiz
        </button>
        <h1 className="admin-title">
          <span className="title-icon">👨‍🏫</span>
          Teacher Dashboard
        </h1>
        {lastUpdate && (
          <div className="last-update">
            <span className="update-indicator">🔄</span>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          👥 Students
        </button>
        <button 
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button 
          className={`tab-button ${activeTab === 'controls' ? 'active' : ''}`}
          onClick={() => setActiveTab('controls')}
        >
          ⚙️ Controls
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && dashboardData && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-number">{dashboardData.stats.total_students || 0}</div>
                  <div className="stat-label">Total Students</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">{dashboardData.stats.completed_quizzes || 0}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <div className="stat-number">{dashboardData.stats.in_progress_quizzes || 0}</div>
                  <div className="stat-label">In Progress</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-number">{Math.round(dashboardData.stats.average_score || 0)}%</div>
                  <div className="stat-label">Average Score</div>
                </div>
              </div>
            </div>

            {dashboardData.levelPerformance && (
              <div className="level-performance">
                <h3>📚 Level Performance</h3>
                <div className="level-grid">
                  {dashboardData.levelPerformance.map((level) => (
                    <div key={level.level} className="level-card">
                      <div className="level-header">
                        <span className="level-name">{level.level.toUpperCase()}</span>
                        <span className="level-accuracy">{level.accuracy_rate}%</span>
                      </div>
                      <div className="level-stats">
                        <div className="level-stat">
                          <span className="stat-value">{level.correct_answers}</span>
                          <span className="stat-label">Correct</span>
                        </div>
                        <div className="level-stat">
                          <span className="stat-value">{level.total_questions_answered}</span>
                          <span className="stat-label">Total</span>
                        </div>
                        <div className="level-stat">
                          <span className="stat-value">{Math.round(level.avg_time_per_question || 0)}s</span>
                          <span className="stat-label">Avg Time</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dashboardData.recentActivity && (
              <div className="recent-activity">
                <h3>🕐 Recent Activity</h3>
                <div className="activity-list">
                  {dashboardData.recentActivity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-user">
                        <span className="user-name">{activity.name}</span>
                        <span className="user-usn">{activity.usn}</span>
                      </div>
                      <div className="activity-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(activity.status) }}
                        >
                          {activity.status.replace('_', ' ')}
                        </span>
                        {activity.percentage && (
                          <span className="activity-score">{activity.percentage}%</span>
                        )}
                      </div>
                      <div className="activity-time">
                        {new Date(activity.last_activity).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="sessions-tab">
            <div className="sessions-header">
              <h3>👥 Student Sessions</h3>
              <div className="sessions-actions">
                <button className="refresh-button" onClick={fetchSessions}>
                  🔄 Refresh
                </button>
              </div>
            </div>
            
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session.id} className="session-item">
                  <div className="session-user">
                    <div className="user-details">
                      <span className="session-name">{session.name}</span>
                      <span className="session-usn">{session.usn}</span>
                    </div>
                    <div className="session-timing">
                      <span className="start-time">
                        Started: {new Date(session.started_at).toLocaleString()}
                      </span>
                      {session.completed_at && (
                        <span className="completion-time">
                          Completed: {new Date(session.completed_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="session-progress">
                    <div className="progress-info">
                      <span className="questions-answered">
                        {session.questions_answered || 0}/20 questions
                      </span>
                      {session.time_taken && (
                        <span className="time-taken">
                          Time: {formatDuration(session.time_taken)}
                        </span>
                      )}
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${((session.questions_answered || 0) / 20) * 100}%`,
                          backgroundColor: getStatusColor(session.status)
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="session-result">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(session.status) }}
                    >
                      {session.status.replace('_', ' ')}
                    </span>
                    {session.percentage !== null && (
                      <span className="session-score">{session.percentage}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && questionAnalytics && (
          <div className="analytics-tab">
            <h3>📈 Question Analytics</h3>
            
            <div className="analytics-summary">
              <div className="summary-stats">
                <div className="summary-stat">
                  <span className="stat-value">{questionAnalytics.summary.averageSuccessRate}%</span>
                  <span className="stat-label">Overall Success Rate</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-value">{questionAnalytics.summary.totalQuestions}</span>
                  <span className="stat-label">Total Questions</span>
                </div>
              </div>
            </div>

            <div className="question-levels">
              {Object.entries(questionAnalytics.questionStats).map(([level, questions]) => (
                <div key={level} className="level-analytics">
                  <h4 className="level-title">{level.toUpperCase()}</h4>
                  <div className="questions-grid">
                    {questions.map((q) => (
                      <div key={`${level}-${q.question_id}`} className="question-stat">
                        <div className="question-header">
                          <span className="question-number">Q{q.question_id}</span>
                          <span className="success-rate">{q.success_rate}%</span>
                        </div>
                        <div className="question-details">
                          <span className="attempts">{q.total_attempts} attempts</span>
                          <span className="avg-time">{Math.round(q.avg_time || 0)}s avg</span>
                        </div>
                        <div className="success-bar">
                          <div 
                            className="success-fill"
                            style={{ 
                              width: `${q.success_rate}%`,
                              backgroundColor: q.success_rate >= 70 ? '#06ffa5' : 
                                             q.success_rate >= 50 ? '#ffe66d' : '#ff6b6b'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="controls-tab">
            <h3>⚙️ Quiz Controls</h3>
            
            <div className="control-sections">
              <div className="control-section">
                <h4>📊 Data Export</h4>
                <p>Export all quiz results to CSV format for analysis</p>
                <button className="control-button export-button" onClick={handleExportResults}>
                  📥 Export Results (CSV)
                </button>
              </div>
              
              <div className="control-section danger-section">
                <h4>⚠️ Danger Zone</h4>
                <p>Reset all quiz data (irreversible action)</p>
                <button className="control-button danger-button" onClick={handleResetData}>
                  🗑️ Reset All Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;