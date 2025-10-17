const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User endpoints
  async registerUser(userData) {
    return this.request('/users/register', {
      method: 'POST',
      body: userData,
    });
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  // Quiz endpoints
  async startQuiz(userId) {
    return this.request('/quiz/start', {
      method: 'POST',
      body: { userId },
    });
  }

  async submitAnswer(answerData) {
    return this.request('/quiz/answer', {
      method: 'POST',
      body: answerData,
    });
  }

  async completeQuiz(sessionId, totalTimeTaken) {
    return this.request('/quiz/complete', {
      method: 'POST',
      body: { sessionId, totalTimeTaken },
    });
  }

  async getQuizSession(sessionId) {
    return this.request(`/quiz/session/${sessionId}`);
  }

  async getQuizStats() {
    return this.request('/quiz/stats');
  }

  // Leaderboard endpoints
  async getLeaderboard(limit = 50, offset = 0) {
    return this.request(`/leaderboard?limit=${limit}&offset=${offset}`);
  }

  async getLiveLeaderboard() {
    return this.request('/leaderboard/live');
  }

  async getUserRank(userId) {
    return this.request(`/leaderboard/user/${userId}`);
  }

  // Admin endpoints
  async getDashboard() {
    return this.request('/admin/dashboard');
  }

  async getAllSessions(status = null, limit = 100, offset = 0) {
    const params = new URLSearchParams({ limit, offset });
    if (status) params.append('status', status);
    return this.request(`/admin/sessions?${params}`);
  }

  async getSessionDetails(sessionId) {
    return this.request(`/admin/sessions/${sessionId}`);
  }

  async getQuestionAnalytics() {
    return this.request('/admin/analytics/questions');
  }

  async exportResults() {
    const response = await fetch(`${this.baseUrl}/admin/export/results`);
    if (!response.ok) {
      throw new Error(`Failed to export results: ${response.statusText}`);
    }
    return response.blob();
  }

  async resetData() {
    return this.request('/admin/reset', {
      method: 'POST',
      body: { confirmReset: 'YES_DELETE_ALL_DATA' },
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Also export the class for testing purposes
export { ApiService };