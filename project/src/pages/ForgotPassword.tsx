import { useState } from 'react';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/forgot-password', {
        email,
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Error sending reset link. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Forgot Password</h2>
        {message && <p className="text-center text-green-600">{message}</p>}
        <form onSubmit={handleForgotPassword}>
          <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mb-4 p-3 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700">Send Reset Link</button>
        </form>
      </div>
    </div>
  );
}
