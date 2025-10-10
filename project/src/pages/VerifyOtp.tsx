import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function VerifyOtp() {
  const [otp, setOtp] = useState<string>(''); 
  const [error, setError] = useState<string>(''); 
  const [success, setSuccess] = useState<boolean>(false); 
  const [isLoading, setIsLoading] = useState<boolean>(false); // Added loading state
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | undefined)?.email || ''; 

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setIsLoading(true); // Start loading
    try {
      const response = await axios.post<{ token: string }>('http://localhost:5000/api/verify-otp', { email, otp });
      setSuccess(true);
      setError('');
      localStorage.setItem('token', response.data.token);
      setTimeout(() => {
        setSuccess(false);
        setIsLoading(false); // Stop loading
        navigate('/login');
      }, 2000);
    } catch (error) {
      setIsLoading(false); // Stop loading on error
      setSuccess(false);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data.message || 'Invalid OTP');
      } else {
        setError('Something went wrong');
      }
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true); // Start loading
    try {
      await axios.post('http://localhost:5000/api/resend-otp', { email });
      setError('');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsLoading(false); // Stop loading
      }, 2000);
    } catch (error) {
      setIsLoading(false); // Stop loading on error
      if (axios.isAxiosError(error)) {
        setError(error.response?.data.message || 'Failed to resend OTP');
      } else {
        setError('Something went wrong');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center p-4 relative">
      {/* Colorful Loading Animation */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-20"
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
                  <stop offset="0%" stopColor="#4F46E5" />  {/* Indigo */}
                  <stop offset="25%" stopColor="#9333EA" /> {/* Purple */}
                  <stop offset="50%" stopColor="#EC4899" /> {/* Pink */}
                  <stop offset="75%" stopColor="#F59E0B" /> {/* Amber */}
                  <stop offset="100%" stopColor="#10B981" /> {/* Green */}
                </linearGradient>
              </defs>
            </svg>
            <p className="mt-4 text-lg font-medium text-indigo-600 animate-pulse">
              Processing...
            </p>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div
          className="absolute top-4 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg text-center z-10"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
        >
          🎉 OTP Verified! Redirecting to login... 🎉
        </motion.div>
      )}

      <motion.div
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-100 relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Verify OTP</h2>
        <p className="text-gray-600 text-center mb-6">
          An OTP has been sent to {email || 'your email'}
        </p>
        {error && (
          <p className="text-red-500 text-center mb-4 bg-red-50 p-2 rounded-md">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading} // Disable button during loading
            className={`w-full py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg text-white
              ${isLoading 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            Verify OTP
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleResendOtp}
            disabled={isLoading} // Disable button during loading
            className={`text-sm font-medium ${isLoading 
              ? 'text-indigo-400 cursor-not-allowed' 
              : 'text-indigo-600 hover:text-indigo-800'}`}
          >
            Resend OTP
          </button>
        </div>
      </motion.div>
    </div>
  );
}