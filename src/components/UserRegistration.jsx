import { useState } from 'react';
import enhancedStorageService from '../services/enhancedStorageService';
import './UserRegistration.css';

const UserRegistration = ({ onStart }) => {
  const [formData, setFormData] = useState({
    name: '',
    usn: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }
    
    // USN validation with regex pattern (e.g., nnm24mc077)
    if (!formData.usn.trim()) {
      newErrors.usn = 'USN is required';
    } else {
      const usnPattern = /^[a-zA-Z]{3}\d{2}[a-zA-Z]{2}\d{3}$/;
      const cleanUSN = formData.usn.trim().toLowerCase();
      
      if (!usnPattern.test(cleanUSN)) {
        newErrors.usn = 'USN format: 3 letters + 2 digits + 2 letters + 3 digits (e.g., nnm24mc077)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Register user with enhanced storage service
      const response = await enhancedStorageService.registerUser({
        name: formData.name.trim(),
        usn: formData.usn.trim()
      });

      if (response.success) {
        onStart({
          ...response.user,
          isNewUser: !response.message?.includes('Welcome back')
        });
      }
    } catch (error) {
      console.error('Registration failed:', error);
      
      if (error.message.includes('already completed')) {
        setErrors({ 
          general: 'You have already completed the quiz. Please contact your instructor if you need to retake it.' 
        });
      } else {
        setErrors({ 
          general: error.message || 'Registration failed. Please try again.' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <div className="cosmic-bg"></div>
      <div className="registration-card">
        <div className="card-header">
          <h1 className="title">
            <span className="title-icon">🚀</span>
            Web-Quiz
          </h1>
          <p className="subtitle">
            Enter the future of knowledge testing
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Enter your full name"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="usn" className="form-label">
              USN / Student ID
            </label>
            <input
              type="text"
              id="usn"
              name="usn"
              value={formData.usn}
              onChange={handleInputChange}
              className={`form-input ${errors.usn ? 'error' : ''}`}
              placeholder="e.g., nnm24mc077"
              pattern="[a-zA-Z]{3}[0-9]{2}[a-zA-Z]{2}[0-9]{3}"
              title="USN format: 3 letters + 2 digits + 2 letters + 3 digits (e.g., nnm24mc077)"
              maxLength="10"
            />
            {errors.usn && <span className="error-message">{errors.usn}</span>}
            {!errors.usn && (
              <span className="help-text">Format: 3 letters + 2 digits + 2 letters + 3 digits</span>
            )}
          </div>

          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}
          
          <button type="submit" className="start-button" disabled={isLoading}>
            <span className="button-text">
              {isLoading ? 'Connecting...' : 'Begin Journey'}
            </span>
            <span className="button-icon">
              {isLoading ? '⏳' : '✨'}
            </span>
          </button>
        </form>
        
        <div className="info-text">
          <p>🌟 Complete all 4 levels: HTML → CSS → JavaScript → React</p>
          <p>🏆 Top scores will be featured on the Leaderboard</p>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;