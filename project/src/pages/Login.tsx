import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

// Background image URL (you can replace this with your preferred image)
const BACKGROUND_IMAGE = 'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?cs=srgb&dl=pexels-pixabay-267885.jpg&fm=jpg'; // University Campus Scene

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (!role) {
      setError('Please select a role');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        email,
        password,
        role,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('email', email);
      localStorage.setItem('role', role);

      setLoginSuccess(true);
      setError('');

      setTimeout(() => {
        setLoginSuccess(false);
        setIsLoading(false);
        navigate('/');
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      setLoginSuccess(false);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data.message || 'Invalid credentials');
      } else {
        setError('Something went wrong');
      }
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}
    >
      {/* Overlay to improve text readability */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Success Message */}
      {loginSuccess && (
        <motion.div
          className="absolute top-4 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg text-center z-20"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
        >
          🎉 Login Successful! 🎉
        </motion.div>
      )}

      {/* Colorful Loading Animation */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-16 w-16"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="25%" stopColor="#9333EA" />
                  <stop offset="50%" stopColor="#EC4899" />
                  <stop offset="75%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
            <p className="mt-4 text-lg font-medium text-white animate-pulse">
              Processing...
            </p>
          </div>
        </motion.div>
      )}

      <motion.div
        className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/20 relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold">
            L
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Welcome Back</h2>
        
        {error && (
          <p className="text-red-600 text-center mb-4 bg-red-50/80 p-2 rounded-lg">{error}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-lg border border-gray-200 bg-white/80 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all placeholder-gray-500"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 rounded-lg border border-gray-200 bg-white/80 focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all placeholder-gray-500"
            />
          </div>

          <div className="flex justify-between items-center px-2">
            {['alumni', 'student', 'faculty'].map((r) => (
              <label key={r} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-radio h-5 w-5 text-indigo-600 focus:ring-indigo-400"
                />
                <span className="text-gray-700 capitalize font-medium">{r}</span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg transition-all duration-200 shadow-md text-white font-medium
              ${isLoading 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
          >
            Forgot Password?
          </button>
          <p className="text-gray-600 text-sm">
            Don’t have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              Sign Up
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}