import { useState, useEffect } from 'react';
import enhancedStorageService from '../services/enhancedStorageService';
import AdminDashboard from './AdminDashboard';
import './Leaderboard.css';

const Leaderboard = ({ currentUser, onRestart, onAdminAccess }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liveStats, setLiveStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [view, setView] = useState('leaderboard'); // 'leaderboard', 'live', 'admin'
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [liveData, setLiveData] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
    
    // Set up real-time updates
    const unsubscribe = enhancedStorageService.subscribe((event) => {
      if (event.key.includes('leaderboard') || event.key.includes('sessions') || event.key.includes('users')) {
        fetchLeaderboard();
      }
    });

    // Refresh data every 10 seconds for live view
    const interval = setInterval(() => {
      if (view === 'live') {
        fetchLiveData();
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [view, currentUser]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      const scores = enhancedStorageService.getLeaderboard(20);
      setLeaderboard(scores);
      
      // Find current user's rank
      const userRank = scores.findIndex(score => 
        score.name === currentUser.name && score.usn === currentUser.usn
      ) + 1;
      setCurrentUserRank(userRank || null);
      setLastUpdate(new Date());
      
      // Load live stats
      const classroomStats = enhancedStorageService.getClassroomStats();
      setLiveStats(classroomStats);
      
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLiveData = async () => {
    try {
      const response = enhancedStorageService.getLiveLeaderboard();
      if (response.success) {
        setLiveData(response.liveData);
        setLiveStats(response.summary);
      }
    } catch (error) {
      console.error('Failed to fetch live data:', error);
    }
  };

  const handleAdminLogin = () => {
    // Simple admin password check
    if (adminPassword === 'admin2050' || adminPassword === 'quiz2050') {
      setView('admin');
      setShowAdminLogin(false);
      setAdminPassword('');
      if (onAdminAccess) {
        onAdminAccess();
      }
    } else {
      alert('Invalid admin password');
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
    return new Date(timestamp).toLocaleTimeString();
  };

  if (view === 'admin') {
    return (
      <AdminDashboard 
        onBack={() => setView('leaderboard')}
        storageService={enhancedStorageService}
      />
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="cosmic-bg"></div>
      
      <div className="leaderboard-header">
        <h1 className="leaderboard-title">
          <span className="title-icon">🏆</span>
          Quiz Galaxy Leaderboard
        </h1>
        
        <div className="view-controls">
          <button 
            className={`view-btn ${view === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setView('leaderboard')}
          >
            🏆 Top Scores
          </button>
          <button 
            className={`view-btn ${view === 'live' ? 'active' : ''}`}
            onClick={() => {
              setView('live');
              fetchLiveData();
            }}
          >
            📊 Live Progress
          </button>
          <button 
            className="view-btn admin-btn"
            onClick={() => setShowAdminLogin(true)}
          >
            ⚙️ Admin
          </button>
        </div>

        {liveStats && (
          <div className="stats-summary">
            <div className="stat-card">
              <span className="stat-number">{liveStats.totalRegistered || 0}</span>
              <span className="stat-label">Registered</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{liveStats.completed || 0}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{liveStats.inProgress || 0}</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{liveStats.averageScore || 0}%</span>
              <span className="stat-label">Avg Score</span>
            </div>
          </div>
        )}
      </div>

      <div className="leaderboard-content">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading results...</p>
          </div>
        ) : (
          <>
            {/* Current User Status */}
            {currentUser && (
              <div className="current-user-status">
                <div className="user-card">
                  <div className="user-info">
                    <h3>{currentUser.name}</h3>
                    <p className="user-usn">USN: {currentUser.usn}</p>
                  </div>
                  <div className="user-rank">
                    {currentUserRank ? (
                      <>
                        <span className="rank-number">#{currentUserRank}</span>
                        <span className="rank-label">Your Rank</span>
                      </>
                    ) : (
                      <span className="rank-label">Not Ranked</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard or Live Data */}
            <div className="leaderboard-table">
              {view === 'leaderboard' ? (
                <>
                  <h3 className="table-title">🌟 Top Performers</h3>
                  {leaderboard.length === 0 ? (
                    <div className="empty-state">
                      <p>No quiz results yet. Be the first to complete!</p>
                    </div>
                  ) : (
                    <div className="score-list">
                      {leaderboard.map((score, index) => (
                        <div 
                          key={index} 
                          className={`score-item ${score.name === currentUser?.name && score.usn === currentUser?.usn ? 'current-user' : ''}`}
                        >
                          <div className="rank-badge">
                            {score.rank <= 3 ? (
                              <span className={`medal rank-${score.rank}`}>
                                {score.rank === 1 ? '🥇' : score.rank === 2 ? '🥈' : '🥉'}
                              </span>
                            ) : (
                              <span className="rank-number">#{score.rank}</span>
                            )}
                          </div>
                          <div className="student-info">
                            <h4 className="student-name">{score.name}</h4>
                            <p className="student-usn">{score.usn}</p>
                          </div>
                          <div className="score-details">
                            <div className="percentage">{score.percentage}%</div>
                            <div className="score-breakdown">
                              {score.score}/{score.totalQuestions} • {formatTime(score.timeTaken)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="table-title">📊 Live Progress</h3>
                  {liveData.length === 0 ? (
                    <div className="empty-state">
                      <p>No active sessions found.</p>
                    </div>
                  ) : (
                    <div className="live-list">
                      {liveData.map((student, index) => (
                        <div key={index} className="live-item">
                          <div className="rank-badge">
                            <span className="rank-number">#{student.rank}</span>
                          </div>
                          <div className="student-info">
                            <h4 className="student-name">{student.name}</h4>
                            <p className="student-usn">{student.usn}</p>
                          </div>
                          <div className="status-info">
                            <div className={`status-badge ${student.status}`}>
                              {student.display_status}
                            </div>
                            {student.status === 'completed' && (
                              <div className="score-details">
                                <div className="percentage">{student.percentage}%</div>
                                <div className="timestamp">{formatTimestamp(student.completedAt)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="leaderboard-footer">
        <button className="restart-btn" onClick={onRestart}>
          <span className="btn-icon">🔄</span>
          Start New Quiz
        </button>
        {lastUpdate && (
          <p className="last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="modal-overlay" onClick={() => setShowAdminLogin(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Admin Access</h3>
            <input
              type="password"
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={handleAdminLogin}>Login</button>
              <button onClick={() => {
                setShowAdminLogin(false);
                setAdminPassword('');
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;