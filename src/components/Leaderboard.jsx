import { useState, useEffect } from 'react';
import './Leaderboard.css';

const Leaderboard = ({ currentUser, onRestart }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);

  useEffect(() => {
    const scores = JSON.parse(localStorage.getItem('quizLeaderboard') || '[]');
    setLeaderboard(scores.slice(0, 10)); // Top 10 scores
    
    // Find current user's rank
    const userRank = scores.findIndex(score => 
      score.name === currentUser.name && score.usn === currentUser.usn
    ) + 1;
    setCurrentUserRank(userRank);
  }, [currentUser]);

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
          <h2 className="list-title">🌟 Top Performers</h2>
          
          {leaderboard.length === 0 ? (
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
                    <p className="play-date">{formatDate(score.timestamp)}</p>
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
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;