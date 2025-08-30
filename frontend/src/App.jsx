import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProjectBoard from './pages/ProjectBoard';
import Analytics from './pages/Analytics.jsx';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen w-full">
        <Routes>
          <Route 
            path="/register" 
            element={<div className="min-h-screen w-full flex items-center justify-center"><Register /></div>} 
          />
          <Route 
            path="/login" 
            element={<div className="min-h-screen w-full flex items-center justify-center"><Login /></div>} 
          />
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/project/:projectId"
            element={<ProtectedRoute><ProjectBoard /></ProtectedRoute>} 
          />
          <Route 
            path="/project/:projectId/analytics"
            element={<ProtectedRoute><Analytics /></ProtectedRoute>} 
          />
          <Route path="/" element={<div className="min-h-screen w-full flex items-center justify-center"><Login /></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;