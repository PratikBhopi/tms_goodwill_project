import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center text-brand-900 mb-2">Create Account</h1>
        <p className="text-center text-neutral-500 text-sm mb-6">Join GoodWill TMS as a customer</p>
        
        {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <Input label="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          <Input label="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          
          <Button type="submit" className="w-full mt-2">Register</Button>
        </form>
        
        <div className="text-center mt-6 text-sm text-neutral-600">
          Already have an account? <Link to="/login" className="text-brand-500 font-medium hover:underline">Sign in</Link>
        </div>
      </Card>
    </div>
  );
}
