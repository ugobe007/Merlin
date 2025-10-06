import React, { useState, useEffect } from 'react';
import { X, User, Save, LogOut, Star, Trash2, Edit3 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone?: string;
  created_at: string;
}

interface SavedQuote {
  id: string;
  project_name: string;
  inputs: any;
  assumptions: any;
  outputs: any;
  is_favorite: boolean;
  tags?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadQuote?: (quote: SavedQuote) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, onLoadQuote }) => {
  const [user, setUser] = useState<User | null>(null);
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'quotes'>('profile');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    company: '',
    phone: ''
  });
  const [showRegister, setShowRegister] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    company: '',
    phone: ''
  });

  const API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5001'
    : '';

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsLoggedIn(true);
      fetchProfile();
      fetchQuotes();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setProfileForm({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          company: data.user.company || '',
          phone: data.user.phone || ''
        });
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/quotes`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes);
      } else {
        throw new Error('Failed to fetch quotes');
      }
    } catch (err) {
      console.error('Quotes fetch error:', err);
      setError('Failed to load quotes');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        setIsLoggedIn(true);
        setUser(data.user);
        setLoginForm({ email: '', password: '' });
        fetchQuotes();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        setIsLoggedIn(true);
        setUser(data.user);
        setRegisterForm({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          company: '',
          phone: ''
        });
        setShowRegister(false);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(profileForm)
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        alert('Profile updated successfully!');
      } else {
        setError(data.error || 'Update failed');
      }
    } catch (err) {
      setError('Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsLoggedIn(false);
    setUser(null);
    setQuotes([]);
    setActiveTab('profile');
  };

  const deleteQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/auth/quotes/${quoteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setQuotes(quotes.filter(q => q.id !== quoteId));
      } else {
        alert('Failed to delete quote');
      }
    } catch (err) {
      alert('Failed to delete quote');
    }
  };

  const toggleFavorite = async (quoteId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/quotes/${quoteId}/favorite`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setQuotes(quotes.map(q => 
          q.id === quoteId 
            ? { ...q, is_favorite: !q.is_favorite }
            : q
        ));
      }
    } catch (err) {
      console.error('Failed to toggle favorite');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <User className="mr-2" />
            {isLoggedIn ? 'User Profile' : 'Sign In'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!isLoggedIn ? (
          <div className="space-y-6">
            {!showRegister ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <h3 className="text-lg font-semibold">Sign In</h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
                <p className="text-center">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setShowRegister(true)}
                    className="text-blue-600 hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <h3 className="text-lg font-semibold">Create Account</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      value={registerForm.first_name}
                      onChange={(e) => setRegisterForm({...registerForm, first_name: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      value={registerForm.last_name}
                      onChange={(e) => setRegisterForm({...registerForm, last_name: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input
                    type="text"
                    value={registerForm.company}
                    onChange={(e) => setRegisterForm({...registerForm, company: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
                <p className="text-center">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setShowRegister(false)}
                    className="text-blue-600 hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('quotes')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'quotes' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  Saved Quotes ({quotes.length})
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <LogOut size={16} className="mr-2" />
                Sign Out
              </button>
            </div>

            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input
                    type="text"
                    value={profileForm.company}
                    onChange={(e) => setProfileForm({...profileForm, company: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save size={16} className="mr-2" />
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            )}

            {activeTab === 'quotes' && (
              <div className="space-y-4">
                {quotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No saved quotes yet.</p>
                    <p className="text-sm">Create and save quotes to access them here.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {quotes.map((quote) => (
                      <div key={quote.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{quote.project_name}</h4>
                            <div className="text-sm text-gray-600 mt-1">
                              <p>Power: {quote.inputs.powerMW} MW | Duration: {quote.inputs.standbyHours} hours</p>
                              <p>Total Cost: ${Math.round(quote.outputs.totalCost || 0).toLocaleString()}</p>
                              <p>Created: {new Date(quote.created_at).toLocaleDateString()}</p>
                              {quote.tags && <p className="text-blue-600">Tags: {quote.tags}</p>}
                            </div>
                            {quote.notes && (
                              <p className="text-sm text-gray-700 mt-2 italic">{quote.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => toggleFavorite(quote.id)}
                              className={`p-2 rounded ${
                                quote.is_favorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                              }`}
                            >
                              <Star size={16} fill={quote.is_favorite ? 'currentColor' : 'none'} />
                            </button>
                            {onLoadQuote && (
                              <button
                                onClick={() => onLoadQuote(quote)}
                                className="p-2 text-blue-600 hover:text-blue-800 rounded"
                                title="Load Quote"
                              >
                                <Edit3 size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => deleteQuote(quote.id)}
                              className="p-2 text-red-600 hover:text-red-800 rounded"
                              title="Delete Quote"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;