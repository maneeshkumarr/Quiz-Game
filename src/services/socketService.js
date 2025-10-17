import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
  }

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.url, {
      transports: ['websocket'],
      autoConnect: false,
    });

    this.socket.connect();

    this.socket.on('connect', () => {
      console.log('🔗 Connected to quiz server');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from quiz server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinQuiz(userData) {
    if (this.socket?.connected) {
      this.socket.emit('join-quiz', userData);
    }
  }

  onLeaderboardUpdate(callback) {
    if (this.socket) {
      this.socket.on('leaderboard-update', callback);
    }
  }

  offLeaderboardUpdate(callback) {
    if (this.socket) {
      this.socket.off('leaderboard-update', callback);
    }
  }

  emitQuizCompleted(userData) {
    if (this.socket?.connected) {
      this.socket.emit('quiz-completed', userData);
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Create and export a singleton instance
const socketService = new SocketService();
export default socketService;