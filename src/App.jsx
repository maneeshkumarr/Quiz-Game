import { useState } from 'react'
import UserRegistration from './components/UserRegistration'
import Quiz from './components/Quiz'
import LeaderboardNew from './components/LeaderboardNew'
import AdminDashboardNew from './components/AdminDashboardNew'
import enhancedStorageService from './services/enhancedStorageService'
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
    setQuizResult({ ...result, ...user })
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
      
      {currentView === 'leaderboard' && (
        <LeaderboardNew 
          currentUser={user || quizResult} 
          onRestart={handleRestart}
          onAdminAccess={handleAdminAccess}
        />
      )}
      
      {currentView === 'admin' && (
        <AdminDashboardNew 
          onBack={handleBackFromAdmin}
          storageService={enhancedStorageService}
        />
      )}
    </div>
  )
}

export default App
