import { useState } from 'react'
import UserRegistration from './components/UserRegistration'
import Quiz from './components/Quiz'
import Leaderboard from './components/Leaderboard'
import AdminDashboard from './components/AdminDashboard'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('registration') // 'registration', 'quiz', 'leaderboard', 'admin'
  const [user, setUser] = useState(null)
  const [quizResult, setQuizResult] = useState(null)

  const handleStartQuiz = (userData) => {
    setUser(userData)
    setCurrentView('quiz')
  }

  const handleQuizComplete = (result) => {
    setQuizResult(result)
    setCurrentView('leaderboard')
  }

  const handleRestart = () => {
    setUser(null)
    setQuizResult(null)
    setCurrentView('registration')
  }

  const handleAdminAccess = () => {
    setCurrentView('admin')
  }

  const handleBackFromAdmin = () => {
    setCurrentView('leaderboard')
  }

  return (
    <div className="app">
      {currentView === 'registration' && (
        <UserRegistration onStart={handleStartQuiz} />
      )}
      
      {currentView === 'quiz' && user && (
        <Quiz user={user} onComplete={handleQuizComplete} />
      )}
      
      {currentView === 'leaderboard' && quizResult && (
        <Leaderboard 
          currentUser={quizResult} 
          onRestart={handleRestart}
          onAdminAccess={handleAdminAccess}
        />
      )}
      
      {currentView === 'admin' && (
        <AdminDashboard onBack={handleBackFromAdmin} />
      )}
    </div>
  )
}

export default App
