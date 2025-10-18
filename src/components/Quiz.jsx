import { useState, useEffect } from 'react';
import { quizData, quizOrder } from '../data/quizData';
import enhancedStorageService from '../services/enhancedStorageService';
import './Quiz.css';

const Quiz = ({ user, onComplete }) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentQuiz = quizData[quizOrder[currentLevel]];

  // Initialize quiz session
  useEffect(() => {
    const startQuizSession = async () => {
      try {
        const response = await enhancedStorageService.startQuiz(user.id);
        if (response.success) {
          setSessionId(response.sessionId);
          setQuizStartTime(Date.now());
          setQuestionStartTime(Date.now());
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to start quiz session:', error);
        alert(error.message || 'Failed to start quiz. Please try again.');
        if (onComplete) {
          onComplete();
        }
      }
    };

    if (user?.id && !sessionId) {
      startQuizSession();
    }
  }, [user, sessionId, onComplete]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isAnswered && !isLoading) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered && !isLoading) {
      handleNextQuestion();
    }
  }, [timeLeft, isAnswered, isLoading]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(30);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setQuestionStartTime(Date.now());
  }, [currentQuestion, currentLevel]);

  const handleAnswerSelect = async (answerIndex) => {
    if (!isAnswered) {
      setSelectedAnswer(answerIndex);
      setIsAnswered(true);
      
      const isCorrect = answerIndex === currentQuiz.questions[currentQuestion].correct;
      if (isCorrect) {
        setScore(score + 1);
      }

      // Calculate time taken for this question
      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);

      // Submit answer to enhanced storage
      try {
        await enhancedStorageService.submitAnswer({
          sessionId,
          questionId: currentQuiz.questions[currentQuestion].id,
          level: quizOrder[currentLevel],
          selectedAnswer: answerIndex,
          correctAnswer: currentQuiz.questions[currentQuestion].correct,
          timeTaken
        });
      } catch (error) {
        console.error('Failed to submit answer:', error);
      }
      
      setTimeout(() => {
        handleNextQuestion();
      }, 1500);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentLevel < quizOrder.length - 1) {
      setCurrentLevel(currentLevel + 1);
      setCurrentQuestion(0);
    } else {
      setShowResult(true);
    }
  };

  const handleFinishQuiz = async () => {
    const totalQuestions = quizOrder.reduce((acc, level) => acc + quizData[level].questions.length, 0);
    const totalTimeTaken = Math.round((Date.now() - quizStartTime) / 1000);

    try {
      const response = await enhancedStorageService.completeQuiz(sessionId, totalTimeTaken);
      if (response.success) {
        onComplete(response.results);
      }
    } catch (error) {
      console.error('Failed to complete quiz:', error);
      // Fallback completion
      const results = {
        score,
        totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100),
        timeTaken: totalTimeTaken
      };
      onComplete(results);
    }
  };  const getProgressPercentage = () => {
    const totalQuestions = quizOrder.reduce((acc, level) => acc + quizData[level].questions.length, 0);
    const currentQuestionIndex = quizOrder.slice(0, currentLevel).reduce((acc, level) => acc + quizData[level].questions.length, 0) + currentQuestion;
    return Math.round((currentQuestionIndex / totalQuestions) * 100);
  };

  if (isLoading) {
    return (
      <div className="quiz-container">
        <div className="cosmic-bg"></div>
        <div className="loading-card">
          <div className="loading-spinner"></div>
          <h2>Initializing Quiz Session...</h2>
          <p>Connecting to quiz server and preparing your questions.</p>
        </div>
      </div>
    );
  }

  if (showResult) {
    const totalQuestions = quizOrder.reduce((acc, level) => acc + quizData[level].questions.length, 0);
    const percentage = Math.round((score / totalQuestions) * 100);
    
    return (
      <div className="quiz-container">
        <div className="cosmic-bg"></div>
        <div className="result-card">
          <div className="result-header">
            <h2 className="result-title">🎉 Quiz Complete!</h2>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-number">{percentage}%</span>
                <span className="score-label">Score</span>
              </div>
            </div>
          </div>
          
          <div className="result-details">
            <p className="result-text">
              <strong>{user.name}</strong>, you scored <strong>{score}</strong> out of <strong>{totalQuestions}</strong> questions correctly!
            </p>
            
            <div className="level-breakdown">
              {quizOrder.map((levelKey, index) => (
                <div key={levelKey} className="level-result">
                  <span className="level-icon">{quizData[levelKey].icon}</span>
                  <span className="level-name">{quizData[levelKey].title}</span>
                  <span className="level-score">✅</span>
                </div>
              ))}
            </div>
          </div>
          
          <button onClick={handleFinishQuiz} className="finish-button">
            <span className="button-text">View Leaderboard</span>
            <span className="button-icon">🏆</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="cosmic-bg"></div>
      
      {/* Header */}
      <div className="quiz-header">
        <div className="user-info">
          <span className="user-name">👨‍🚀 {user.name}</span>
          <span className="user-usn">{user.usn}</span>
        </div>
        <div className="quiz-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <span className="progress-text">{getProgressPercentage()}% Complete</span>
        </div>
      </div>

      {/* Level Indicator */}
      <div className="level-indicator">
        <div className="level-info">
          <span className="level-icon">{currentQuiz.icon}</span>
          <span className="level-title">{currentQuiz.title}</span>
          <span className="level-badge">Level {currentLevel + 1}/4</span>
        </div>
        <div className="question-counter">
          Question {currentQuestion + 1}/{currentQuiz.questions.length}
        </div>
      </div>

      {/* Question Card */}
      <div className="question-card">
        <div className="timer-section">
          <div className="timer-circle">
            <span className="timer-number">{timeLeft}</span>
          </div>
          <span className="timer-label">seconds left</span>
        </div>
        
        <div className="question-content">
          <h3 className="question-text">
            {currentQuiz.questions[currentQuestion].question}
          </h3>
          
          <div className="options-grid">
            {currentQuiz.questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`option-button ${
                  selectedAnswer === index
                    ? index === currentQuiz.questions[currentQuestion].correct
                      ? 'correct'
                      : 'incorrect'
                    : ''
                } ${
                  isAnswered && index === currentQuiz.questions[currentQuestion].correct
                    ? 'show-correct'
                    : ''
                }`}
                disabled={isAnswered}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className="score-tracker">
        <span className="score-label">Current Score:</span>
        <span className="score-value">{score}</span>
      </div>
    </div>
  );
};

export default Quiz;