import React, { useState, useEffect } from 'react';
import { X, User, Save, LogOut, Star, Trash2, Edit3 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone?: string;
  title?: string;
  linkedin?: string;
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
  onOpenPortfolio?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, onLoadQuote, onOpenPortfolio }) => {
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
    phone: '',
    title: '',
    linkedin: ''
  });
  const [showRegister, setShowRegister] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    company: '',
    phone: '',
    title: '',
    linkedin: ''
  });

  // EMERGENCY FIX: Force cache bust and absolute URLs
  const API_BASE = '';
  const PROFILE_URL = 'https://merlin.fly.dev/api/auth/profile';
  
  // Force debugging output to appear with timestamp
  const debugTimestamp = new Date().toISOString();
  console.log(`=== PROFILE DEBUG ${debugTimestamp} ===`);
  console.log('window.location.hostname:', window.location.hostname);
  console.log('window.location.href:', window.location.href);
  console.log('EMERGENCY FIX: Using hardcoded URL:', PROFILE_URL);
  console.log('===========================================');

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token && isOpen) {
      setIsLoggedIn(true);
      loadProfile();
      fetchQuotes();
    } else if (token) {
      setIsLoggedIn(true);
    }
  }, [isOpen]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const response = await fetch('https://merlin.fly.dev/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // User not found in database - only clear token if we're sure it's invalid
          console.log('Profile 404 - user not found in database');
          localStorage.removeItem('auth_token');
          setIsLoggedIn(false);
          setUser(null);
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          // Invalid token
          localStorage.removeItem('auth_token');
          setIsLoggedIn(false);
          setUser(null);
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`Failed to load profile: ${response.status}`);
      }

      const data = await response.json();
      setUser(data);
      setProfileForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        company: data.company || '',
        phone: data.phone || '',
        title: data.title || '',
        linkedin: data.linkedin || ''
      });
    } catch (error) {
      console.error('Profile loading error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
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
        loadProfile();
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
      
      // Validate required fields
      if (!registerForm.email || !registerForm.password) {
        setError('Email and password are required');
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(registerForm)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        setIsLoggedIn(true);
        setUser(data.user);
        setProfileForm({
          first_name: data.user?.first_name || '',
          last_name: data.user?.last_name || '',
          company: data.user?.company || '',
          phone: data.user?.phone || '',
          title: data.user?.title || '',
          linkedin: data.user?.linkedin || ''
        });
        setRegisterForm({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          company: '',
          phone: '',
          title: '',
          linkedin: ''
        });
        setShowRegister(false);
        // Don't call loadProfile() since we already have the user data from registration
        fetchQuotes();
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error (catch block):', err);
      setError(`Registration failed: ${err instanceof Error ? err.message : 'Please try again'}`);
    } finally {
      setLoading(false);
      console.log('=== REGISTRATION DEBUG END ===');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // EMERGENCY FIX: Use hardcoded URL
      const response = await fetch(PROFILE_URL, {
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

  const handleLogout = async () => {
    try {
      // Call logout endpoint for completeness (optional since tokens are persistent)
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.log('Logout endpoint call failed (non-critical):', error);
    } finally {
      // Always clear local state regardless of backend call result
      localStorage.removeItem('auth_token');
      setIsLoggedIn(false);
      setUser(null);
      setQuotes([]);
      setActiveTab('profile');
      setError(null);
      setShowRegister(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setShowRegister(false);
    onClose();
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
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
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
              <>
                <h3 className="text-lg font-semibold">Create Account</h3>
                
                <form onSubmit={handleRegister} className="space-y-4">
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
                <div>
                  <label className="block text-sm font-medium mb-1">Title/Position</label>
                  <input
                    type="text"
                    value={registerForm.title}
                    onChange={(e) => setRegisterForm({...registerForm, title: e.target.value})}
                    placeholder="e.g., Project Manager, Engineer, Director"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">LinkedIn Profile</label>
                  <input
                    type="url"
                    value={registerForm.linkedin}
                    onChange={(e) => setRegisterForm({...registerForm, linkedin: e.target.value})}
                    placeholder="https://linkedin.com/in/yourprofile"
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
              </>
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
                {onOpenPortfolio && (
                  <button
                    onClick={() => {
                      onOpenPortfolio();
                      onClose();
                    }}
                    className="px-4 py-2 rounded bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all"
                  >
                    📁 Full Portfolio
                  </button>
                )}
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
              <div className="space-y-8">
                {/* Executive Profile Header */}
                <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 rounded-xl p-8 border border-slate-200 shadow-sm">
                  <div className="flex items-start space-x-6">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 shadow-lg">
                      <User size={40} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-2xl font-bold text-slate-900">
                          {user?.first_name && user?.last_name 
                            ? `${user.first_name} ${user.last_name}` 
                            : 'Professional Profile'}
                        </h2>
                        {user?.title && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {user.title}
                          </span>
                        )}
                      </div>
                      {user?.company && (
                        <p className="text-lg text-slate-700 font-medium mb-1">{user.company}</p>
                      )}
                      <p className="text-slate-600">Energy Storage & BESS Solutions Professional</p>
                      <div className="flex items-center mt-3 space-x-4 text-sm text-slate-500">
                        <span>Member since {new Date(user?.created_at || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Contact Information */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                      <svg className="w-5 h-5 mr-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Contact Information
                    </h3>
                    <p className="text-slate-600 mt-1">Professional contact details and networking information</p>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="group">
                          <label className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Email Address
                          </label>
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className="text-slate-900 font-medium">{user?.email}</p>
                          </div>
                        </div>
                        <div className="group">
                          <label className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Phone Number
                          </label>
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className="text-slate-900 font-medium">{user?.phone || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="group">
                          <label className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Organization
                          </label>
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className="text-slate-900 font-medium">{user?.company || 'Not specified'}</p>
                          </div>
                        </div>
                        <div className="group">
                          <label className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            LinkedIn Profile
                          </label>
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            {user?.linkedin ? (
                              <a href={user.linkedin} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:text-blue-800 font-medium flex items-center group">
                                <span>View Professional Profile</span>
                                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              <p className="text-slate-500 italic">Not provided</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Profile Management */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                      <svg className="w-5 h-5 mr-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Update Professional Information
                    </h3>
                    <p className="text-slate-600 mt-1">Maintain current and accurate professional details</p>
                  </div>
                  <div className="p-8">
                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">First Name</label>
                            <input
                              type="text"
                              value={profileForm.first_name}
                              onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white shadow-sm"
                              placeholder="Enter your first name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">Last Name</label>
                            <input
                              type="text"
                              value={profileForm.last_name}
                              onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white shadow-sm"
                              placeholder="Enter your last name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">Company / Organization</label>
                            <input
                              type="text"
                              value={profileForm.company}
                              onChange={(e) => setProfileForm({...profileForm, company: e.target.value})}
                              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white shadow-sm"
                              placeholder="Your company or organization"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">Professional Title</label>
                            <input
                              type="text"
                              value={profileForm.title}
                              onChange={(e) => setProfileForm({...profileForm, title: e.target.value})}
                              placeholder="e.g., Senior Project Manager, Chief Engineer, Business Development Director"
                              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">Phone Number</label>
                            <input
                              type="tel"
                              value={profileForm.phone}
                              onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white shadow-sm"
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">LinkedIn Profile URL</label>
                            <input
                              type="url"
                              value={profileForm.linkedin}
                              onChange={(e) => setProfileForm({...profileForm, linkedin: e.target.value})}
                              placeholder="https://linkedin.com/in/yourprofile"
                              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white shadow-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-200">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          <Save size={20} className="mr-3" />
                          {loading ? 'Updating Profile...' : 'Update Professional Profile'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
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