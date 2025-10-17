import { useState } from 'react';
import './UserRegistration.css';

const UserRegistration = ({ onStart }) => {
  const [formData, setFormData] = useState({
    name: '',
    usn: ''
  });
  const [errors, setErrors] = useState({});

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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.usn.trim()) {
      newErrors.usn = 'USN is required';
    } else if (formData.usn.trim().length < 3) {
      newErrors.usn = 'USN must be at least 3 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onStart(formData);
    }
  };

  return (
    <div className="registration-container">
      <div className="cosmic-bg"></div>
      <div className="registration-card">
        <div className="card-header">
          <h1 className="title">
            <span className="title-icon">🚀</span>
            Quiz Galaxy 2050
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
              placeholder="Enter your USN"
            />
            {errors.usn && <span className="error-message">{errors.usn}</span>}
          </div>
          
          <button type="submit" className="start-button">
            <span className="button-text">Begin Journey</span>
            <span className="button-icon">✨</span>
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