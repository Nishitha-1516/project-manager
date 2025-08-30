import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    // If no user is found in local storage, redirect to the login page
    return <Navigate to="/login" />;
  }

  // If a user is found, render the page they were trying to access
  return children;
}

export default ProtectedRoute;