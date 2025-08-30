import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', formData);
      localStorage.setItem('user', JSON.stringify(response.data));
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-lg p-8 shadow-lg w-full max-w-md text-gray-800">
      <h2 className="text-3xl font-bold text-center mb-6">Log In</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="email">Email</label>
          <input
            className="w-full bg-white border-b-2 border-gray-300 px-3 py-2 leading-tight focus:outline-none focus:border-blue-500 placeholder-gray-500 text-gray-900"
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2" htmlFor="password">Password</label>
          <input
            className="w-full bg-white border-b-2 border-gray-300 px-3 py-2 mb-3 leading-tight focus:outline-none focus:border-blue-500 placeholder-gray-500 text-gray-900"
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full"
            type="submit"
          >
            Log In
          </button>
        </div>
         <p className="text-center text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;