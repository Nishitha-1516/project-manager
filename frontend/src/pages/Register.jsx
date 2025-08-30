import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', formData);
      console.log('Registration successful:', response.data);
      navigate('/login');
    } catch (error) {
      console.error('Registration failed:', error.response ? error.response.data : 'No response');
    }
  };

  return (
    <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-lg p-8 shadow-lg w-full max-w-md text-gray-800"> {/* Added text-gray-800 and adjusted opacity */}
      <h2 className="text-3xl font-bold text-center mb-6">Create Account</h2> {/* Removed text-white */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="name"> {/* Removed text-white */}
            Name
          </label>
          <input
            className="w-full bg-white border-b-2 border-gray-300 px-3 py-2 leading-tight focus:outline-none focus:border-blue-500 placeholder-gray-500 text-gray-900" // Adjusted styling for inputs
            id="name"
            type="text"
            placeholder="Your Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="email"> {/* Removed text-white */}
            Email
          </label>
          <input
            className="w-full bg-white border-b-2 border-gray-300 px-3 py-2 leading-tight focus:outline-none focus:border-blue-500 placeholder-gray-500 text-gray-900" // Adjusted styling for inputs
            id="email"
            type="email"
            placeholder="your.email@example.com"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2" htmlFor="password"> {/* Removed text-white */}
            Password
          </label>
          <input
            className="w-full bg-white border-b-2 border-gray-300 px-3 py-2 mb-3 leading-tight focus:outline-none focus:border-blue-500 placeholder-gray-500 text-gray-900" // Adjusted styling for inputs
            id="password"
            type="password"
            placeholder="******************"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full"
            type="submit"
          >
            Sign Up
          </button>
        </div>
         <p className="text-center text-sm mt-6"> {/* Removed text-white */}
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:underline"> {/* Adjusted link color */}
            Log In
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Register;