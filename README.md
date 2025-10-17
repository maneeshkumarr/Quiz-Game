# 🚀 Quiz Galaxy 2050 - Futuristic Quiz Application

A modern, futuristic quiz application built with React and Vite, featuring a 2050-inspired UI/UX design with glassmorphism effects, neon colors, and advanced animations.

## ✨ Features

### 🎯 Core Functionality
- **Progressive Quiz System**: Step-by-step MCQ quiz covering HTML → CSS → JavaScript → React
- **User Registration**: Name and USN-based user identification system
- **Real-time Scoring**: Live score tracking throughout the quiz
- **Leaderboard**: High-score tracking with persistent local storage
- **Timer System**: 30-second countdown per question

### 🎨 Futuristic Design (2050-Inspired)
- **Glassmorphism Effects**: Translucent cards with backdrop blur
- **Neon Color Schemes**: Vibrant gradient combinations
- **Advanced Animations**: Smooth transitions, hover effects, and micro-interactions
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Cosmic Background**: Dynamic gradient backgrounds with pulsing animations

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm package manager

### Installation & Usage

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   - Navigate to `http://localhost:5173/`
   - The application will automatically reload on changes

### Build for Production
```bash
npm run build
npm run preview
```

## 🎮 How to Play

1. **Registration**: Enter your full name and USN (Student ID)
2. **Quiz Progression**: Answer questions in order: HTML → CSS → JavaScript → React
3. **Time Limit**: Each question has a 30-second timer
4. **Scoring**: Correct answers increase your score
5. **Leaderboard**: View your ranking among all players

## 🏗️ Project Structure

```
Quiz-Game/
├── src/
│   ├── components/           # React components
│   │   ├── UserRegistration.jsx & .css
│   │   ├── Quiz.jsx & .css
│   │   └── Leaderboard.jsx & .css
│   ├── data/                # Quiz questions data
│   │   └── quizData.js
│   ├── App.jsx              # Main app component
│   ├── App.css              # Global app styles
│   └── index.css            # Global CSS variables
├── public/                  # Static assets
└── README.md               # This file
```

## 🎨 Design Features

- **Glassmorphism**: Translucent UI elements with backdrop blur
- **Neon Effects**: Glowing borders and gradient animations  
- **Cosmic Theme**: Space-inspired backgrounds and colors
- **Smooth Animations**: Hover effects and transitions
- **Responsive Design**: Works on all device sizes

## 📱 Technology Stack

- **React 18** - Modern UI library
- **Vite** - Fast development build tool
- **CSS3** - Advanced styling with animations
- **Local Storage** - Persistent data storage

---

**Built with ❤️ for futuristic interactive learning** 🚀

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
