import { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

type RouteParams = {
  token: string;
};

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const { token } = useParams<RouteParams>();
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/api/reset-password/${token}`, {
        password,
      });
      alert('Password reset successful');
      navigate('/login');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data.message || 'Something went wrong');
      } else {
        alert('An unknown error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Reset Password</h2>
        <form onSubmit={handleResetPassword}>
          <input 
            type="password" 
            placeholder="Enter new password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="w-full mb-4 p-3 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" 
          />
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}
