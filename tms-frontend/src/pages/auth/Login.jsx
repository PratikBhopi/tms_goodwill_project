import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const role = await login(email, password);
      if (role === 'CUSTOMER') navigate('/customer/dashboard');
      else if (role === 'STAFF') navigate('/staff/dashboard');
      else if (role === 'DRIVER') navigate('/driver/dashboard');
      else if (role === 'OWNER') navigate('/owner/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center text-brand-900 mb-2">GoodWill <span className="text-brand-500">TMS</span></h1>
        <p className="text-center text-neutral-500 text-sm mb-6">Sign in to your account</p>
        
        {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Email Address" 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <Input 
            label="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <Button type="submit" className="w-full mt-2">Sign In</Button>
        </form>
        
        <div className="text-center mt-6 text-sm text-neutral-600">
          Don't have an account? <Link to="/register" className="text-brand-500 font-medium hover:underline">Register here</Link>
        </div>
      </Card>
    </div>
  );
}
