import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import socketService from '../services/socketService';
import './Leaderboard.css';

const Leaderboard = ({ currentUser, onRestart, onAdminAccess }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liveStats, setLiveStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch from API first
      const response = await apiService.getLiveLeaderboard();
      if (response.success) {
        setLeaderboard(response.liveData.slice(0, 20)); // Top 20
        setLiveStats(response.summary);
        
        // Find current user's rank
        const userRank = response.liveData.findIndex(score => 
          score.name === currentUser.name && score.usn === currentUser.usn
        ) + 1;
        setCurrentUserRank(userRank || null);
        setLastUpdate(new Date());
        return;
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard from API:', error);
    }

    // Fallback to localStorage
    try {
      const scores = JSON.parse(localStorage.getItem('quizLeaderboard') || '[]');
      const formattedScores = scores.slice(0, 10).map((score, index) => ({
        ...score,
        rank: index + 1,
        display_status: 'Completed'
      }));
      
      setLeaderboard(formattedScores);
      
      const userRank = scores.findIndex(score => 
        score.name === currentUser.name && score.usn === currentUser.usn
      ) + 1;
      setCurrentUserRank(userRank);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load leaderboard from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Real-time leaderboard updates
  const handleLeaderboardUpdate = useCallback((data) => {
    console.log('Received leaderboard update:', data);
    // Refresh leaderboard when someone completes the quiz
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
    
    // Set up real-time updates
    socketService.onLeaderboardUpdate(handleLeaderboardUpdate);
    
    // Set up periodic refresh for live stats
    const refreshInterval = setInterval(fetchLeaderboard, 30000); // Refresh every 30 seconds

    return () => {
      socketService.offLeaderboardUpdate(handleLeaderboardUpdate);
      clearInterval(refreshInterval);
    };
  }, [fetchLeaderboard, handleLeaderboardUpdate]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) return { message: "Stellar Performance! 🌟", class: "stellar" };
    if (percentage >= 80) return { message: "Excellent Work! 🚀", class: "excellent" };
    if (percentage >= 70) return { message: "Great Job! ⭐", class: "great" };
    if (percentage >= 60) return { message: "Good Effort! 👍", class: "good" };
    return { message: "Keep Learning! 📚", class: "keep-learning" };
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="leaderboard-container">
      <div className="cosmic-bg"></div>
      
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <h1 className="leaderboard-title">
            <span className="title-icon">🏆</span>
            Galaxy Leaderboard
          </h1>
          <p className="leaderboard-subtitle">Top Quiz Champions of 2050</p>
        </div>

        {/* Current User Performance */}
        <div className="user-performance">
          <div className="performance-card">
            <div className="performance-header">
              <span className="user-avatar">👨‍🚀</span>
              <div className="user-details">
                <h3 className="performance-name">{currentUser.name}</h3>
                <p className="performance-usn">{currentUser.usn}</p>
              </div>
              <div className="rank-badge">
                <span className="rank-icon">{getRankIcon(currentUserRank)}</span>
                <span className="rank-text">Rank #{currentUserRank}</span>
              </div>
            </div>
            
            <div className="performance-stats">
              <div className="stat-item">
                <span className="stat-value">{currentUser.percentage}%</span>
                <span className="stat-label">Score</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{currentUser.score}/{currentUser.totalQuestions}</span>
                <span className="stat-label">Correct</span>
              </div>
            </div>
            
            <div className={`performance-message ${getPerformanceMessage(currentUser.percentage).class}`}>
              {getPerformanceMessage(currentUser.percentage).message}
            </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="leaderboard-list">
          <div className="leaderboard-header-section">
            <h2 className="list-title">🌟 Top Performers</h2>
            {liveStats && (
              <div className="live-stats">
                <div className="stat-item">
                  <span className="stat-number">{liveStats.totalRegistered}</span>
                  <span className="stat-label">Registered</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{liveStats.completed}</span>
                  <span className="stat-label">Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{liveStats.inProgress}</span>
                  <span className="stat-label">In Progress</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{liveStats.averageScore}%</span>
                  <span className="stat-label">Avg Score</span>
                </div>
              </div>
            )}
            {lastUpdate && (
              <div className="last-update">
                <span className="update-indicator">🔄</span>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="loading-leaderboard">
              <div className="loading-spinner"></div>
              <p>Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="empty-leaderboard">
              <p>🚀 Be the first to set a record!</p>
            </div>
          ) : (
            <div className="leaderboard-items">
              {leaderboard.map((score, index) => (
                <div 
                  key={index} 
                  className={`leaderboard-item ${
                    score.name === currentUser.name && score.usn === currentUser.usn 
                      ? 'current-user' 
                      : ''
                  }`}
                >
                  <div className="rank-section">
                    <span className="rank-icon">{getRankIcon(index + 1)}</span>
                    <span className="rank-number">#{index + 1}</span>
                  </div>
                  
                  <div className="player-info">
                    <h4 className="player-name">{score.name}</h4>
                    <p className="player-usn">{score.usn}</p>
                    <p className="play-date">
                      {score.completed_at ? formatDate(score.completed_at) : formatDate(score.timestamp)}
                    </p>
                    <p className="quiz-status">{score.display_status}</p>
                  </div>
                  
                  <div className="score-section">
                    <div className="score-percentage">{score.percentage}%</div>
                    <div className="score-details">{score.score}/{score.totalQuestions}</div>
                  </div>
                  
                  <div className="performance-indicator">
                    <div 
                      className="score-bar"
                      style={{ 
                        width: `${score.percentage}%`,
                        backgroundColor: score.percentage >= 80 ? '#4ECDC4' : 
                                       score.percentage >= 60 ? '#FFE66D' : '#FF6B6B'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={onRestart} className="restart-button">
            <span className="button-text">Take Quiz Again</span>
            <span className="button-icon">🔄</span>
          </button>
          
          <button 
            onClick={() => {
              const shareText = `I just scored ${currentUser.percentage}% on Quiz Galaxy 2050! 🚀 Can you beat my score?`;
              if (navigator.share) {
                navigator.share({
                  title: 'Quiz Galaxy 2050',
                  text: shareText
                });
              } else {
                navigator.clipboard.writeText(shareText);
                alert('Score copied to clipboard!');
              }
            }}
            className="share-button"
          >
            <span className="button-text">Share Score</span>
            <span className="button-icon">📱</span>
          </button>

          {onAdminAccess && (
            <button onClick={onAdminAccess} className="admin-button">
              <span className="button-text">Teacher Dashboard</span>
              <span className="button-icon">👨‍🏫</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;