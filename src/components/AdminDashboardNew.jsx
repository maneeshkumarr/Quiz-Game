import { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';

const AdminDashboard = ({ onBack, storageService }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sessions, setSessions] = useState([]);
  const [questionAnalytics, setQuestionAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [liveData, setLiveData] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = storageService.getDashboard();
      if (response.success) {
        setDashboardData(response.dashboard);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageService]);

  const fetchSessions = useCallback(async () => {
    try {
      const allSessions = storageService.getSessions();
      const users = storageService.getUsers();
      
      // Enhance sessions with user data
      const enhancedSessions = allSessions.map(session => {
        const user = users.find(u => u.id === session.userId);
        return {
          ...session,
          name: user?.name || 'Unknown',
          usn: user?.usn || 'Unknown'
        };
      });
      
      setSessions(enhancedSessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  }, [storageService]);

  const fetchQuestionAnalytics = useCallback(async () => {
    try {
      const response = storageService.getQuestionAnalytics();
      if (response.success) {
        setQuestionAnalytics(response);
      }
    } catch (error) {
      console.error('Failed to fetch question analytics:', error);
    }
  }, [storageService]);

  const fetchLiveData = useCallback(async () => {
    try {
      const response = storageService.getLiveLeaderboard();
      if (response.success) {
        setLiveData(response.liveData);
      }
    } catch (error) {
      console.error('Failed to fetch live data:', error);
    }
  }, [storageService]);

  useEffect(() => {
    fetchDashboardData();
    fetchSessions();
    fetchQuestionAnalytics();
    fetchLiveData();

    // Set up real-time updates
    const unsubscribe = storageService.subscribe((event) => {
      fetchDashboardData();
      fetchSessions();
      fetchQuestionAnalytics();
      fetchLiveData();
    });

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchSessions();
      fetchLiveData();
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchDashboardData, fetchSessions, fetchQuestionAnalytics, fetchLiveData, storageService]);

  const handleExportResults = () => {
    try {
      const result = storageService.exportResults();
      if (result.success) {
        alert(result.message || 'Results exported successfully!');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export results');
    }
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset ALL quiz data? This action cannot be undone.')) {
      try {
        const result = storageService.resetData();
        if (result.success) {
          alert('All data has been reset successfully');
          // Refresh all data
          fetchDashboardData();
          fetchSessions();
          fetchQuestionAnalytics();
          fetchLiveData();
        }
      } catch (error) {
        console.error('Reset failed:', error);
        alert('Failed to reset data');
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            ← Back to Leaderboard
          </button>
          <h1>📊 Admin Dashboard</h1>
        </div>
        <div className="header-right">
          {lastUpdate && (
            <span className="last-update">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          👥 Sessions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'controls' ? 'active' : ''}`}
          onClick={() => setActiveTab('controls')}
        >
          ⚙️ Controls
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {dashboardData?.stats && (
              <div className="stats-grid">
                <div className="stat-card large">
                  <div className="stat-number">{dashboardData.stats.totalRegistered || 0}</div>
                  <div className="stat-label">Total Registered</div>
                </div>
                <div className="stat-card success">
                  <div className="stat-number">{dashboardData.stats.completed || 0}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card warning">
                  <div className="stat-number">{dashboardData.stats.inProgress || 0}</div>
                  <div className="stat-label">In Progress</div>
                </div>
                <div className="stat-card info">
                  <div className="stat-number">{dashboardData.stats.notStarted || 0}</div>
                  <div className="stat-label">Not Started</div>
                </div>
                <div className="stat-card accent">
                  <div className="stat-number">{dashboardData.stats.averageScore || 0}%</div>
                  <div className="stat-label">Average Score</div>
                </div>
                <div className="stat-card primary">
                  <div className="stat-number">{dashboardData.stats.highestScore || 0}%</div>
                  <div className="stat-label">Highest Score</div>
                </div>
              </div>
            )}

            {dashboardData?.recentActivity && (
              <div className="recent-activity">
                <h3>📋 Recent Activity</h3>
                <div className="activity-list">
                  {dashboardData.recentActivity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-info">
                        <strong>{activity.name}</strong> ({activity.usn})
                      </div>
                      <div className="activity-details">
                        <span className={`status-badge ${activity.status}`}>
                          {activity.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                        {activity.status === 'completed' && (
                          <span className="score">{activity.percentage}%</span>
                        )}
                        <span className="timestamp">
                          {formatTimestamp(activity.last_activity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dashboardData?.levelPerformance && (
              <div className="level-performance">
                <h3>📊 Level Performance</h3>
                <div className="performance-grid">
                  {dashboardData.levelPerformance.map((level, index) => (
                    <div key={index} className="performance-card">
                      <h4>{level.level.toUpperCase()}</h4>
                      <div className="performance-stats">
                        <div className="stat">
                          <span className="stat-value">{level.accuracy_rate}%</span>
                          <span className="stat-label">Accuracy</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{level.total_questions_answered}</span>
                          <span className="stat-label">Questions</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{formatTime(level.avg_time_per_question)}</span>
                          <span className="stat-label">Avg Time</span>
                        </div>
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
            <h3>👥 All Sessions ({sessions.length})</h3>
            <div className="sessions-table">
              <div className="table-header">
                <div>Student</div>
                <div>USN</div>
                <div>Status</div>
                <div>Score</div>
                <div>Started</div>
                <div>Completed</div>
              </div>
              <div className="table-body">
                {sessions.map((session, index) => (
                  <div key={index} className="table-row">
                    <div className="student-name">{session.name}</div>
                    <div className="student-usn">{session.usn}</div>
                    <div>
                      <span className={`status-badge ${session.status}`}>
                        {session.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <div className="score-cell">
                      {session.status === 'completed' ? (
                        <>
                          <span className="percentage">{session.percentage}%</span>
                          <span className="score-detail">
                            ({session.score}/{session.totalQuestions})
                          </span>
                        </>
                      ) : (
                        <span className="in-progress">-</span>
                      )}
                    </div>
                    <div className="timestamp">
                      {formatTimestamp(session.startedAt)}
                    </div>
                    <div className="timestamp">
                      {session.completedAt ? formatTimestamp(session.completedAt) : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && questionAnalytics && (
          <div className="analytics-tab">
            <h3>📊 Question Analytics</h3>
            
            <div className="analytics-summary">
              <div className="summary-card">
                <div className="summary-number">{questionAnalytics.summary.totalQuestions}</div>
                <div className="summary-label">Total Questions</div>
              </div>
              <div className="summary-card">
                <div className="summary-number">{questionAnalytics.summary.averageSuccessRate}%</div>
                <div className="summary-label">Avg Success Rate</div>
              </div>
            </div>

            <div className="question-sections">
              {Object.entries(questionAnalytics.questionStats).map(([level, questions]) => (
                <div key={level} className="question-section">
                  <h4>{level.toUpperCase()} Questions</h4>
                  <div className="questions-grid">
                    {questions.map((question, index) => (
                      <div key={index} className="question-card">
                        <div className="question-header">
                          <span className="question-id">Q{question.question_id}</span>
                          <span className={`success-rate ${
                            question.success_rate >= 70 ? 'high' : 
                            question.success_rate >= 40 ? 'medium' : 'low'
                          }`}>
                            {question.success_rate}%
                          </span>
                        </div>
                        <div className="question-stats">
                          <div className="stat-item">
                            <span className="stat-value">{question.total_attempts}</span>
                            <span className="stat-label">Attempts</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-value">{question.correct_attempts}</span>
                            <span className="stat-label">Correct</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-value">{formatTime(question.avg_time)}</span>
                            <span className="stat-label">Avg Time</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {questionAnalytics.summary.hardestQuestions && (
              <div className="difficult-questions">
                <h4>🔥 Most Challenging Questions</h4>
                <div className="difficulty-list">
                  {questionAnalytics.summary.hardestQuestions.map((question, index) => (
                    <div key={index} className="difficulty-item">
                      <span className="question-info">
                        {question.level.toUpperCase()} Q{question.question_id}
                      </span>
                      <span className="success-rate low">{question.success_rate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="controls-tab">
            <h3>⚙️ Admin Controls</h3>
            
            <div className="control-sections">
              <div className="control-section">
                <h4>📤 Data Export</h4>
                <p>Export all quiz results to CSV format</p>
                <button className="control-btn primary" onClick={handleExportResults}>
                  📥 Export Results
                </button>
              </div>

              <div className="control-section">
                <h4>🔄 Live Updates</h4>
                <p>Current update status and real-time monitoring</p>
                <div className="status-indicator">
                  <span className="status-dot active"></span>
                  <span>Real-time updates active</span>
                </div>
              </div>

              <div className="control-section danger">
                <h4>⚠️ Reset Data</h4>
                <p>Permanently delete all quiz data and scores</p>
                <button className="control-btn danger" onClick={handleResetData}>
                  🗑️ Reset All Data
                </button>
              </div>

              <div className="control-section">
                <h4>💾 Storage Info</h4>
                <p>Current storage status and capacity</p>
                <div className="storage-info">
                  <div className="storage-item">
                    <span>Total Users:</span>
                    <span>{dashboardData?.stats?.totalRegistered || 0}</span>
                  </div>
                  <div className="storage-item">
                    <span>Total Sessions:</span>
                    <span>{sessions.length}</span>
                  </div>
                  <div className="storage-item">
                    <span>Storage Type:</span>
                    <span>Local Browser Storage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;