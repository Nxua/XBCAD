import React, { useState } from 'react';
import axios from 'axios';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting login request:', { email, password });
    try {
      const response = await axios.post('http://localhost:5000/login', { email, password });
  
      console.log('Login successful:', response.data); // Log the full response
      localStorage.setItem('token', response.data.token);
  
      // Optionally, trigger a callback or navigation
      if (onLogin) onLogin(response.data.user);
    } catch (err) {
      console.error('Login failed:', err.response?.data?.error || err.message);
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };
  
  

  return (
    <div className="login-page">
      <h1>Login</h1>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
