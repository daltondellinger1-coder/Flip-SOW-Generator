import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Logo } from './Logo';
import * as db from '../services/db';
import { ExclamationTriangleIcon } from './icons';

interface LoginViewProps {
  onLogin: (profile: UserProfile) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Acquisitions Manager' | 'Project Manager'>('Acquisitions Manager');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialization if needed
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
        setError("Please fill in all fields.");
        setIsLoading(false);
        return;
    }

    const cleanEmail = email.toLowerCase().trim();

    try {
        if (isSignUp) {
            // --- SIGN UP LOGIC ---
            if (!name) {
                setError("Name is required for sign up.");
                setIsLoading(false);
                return;
            }

            const newUser = {
                name: name.trim(),
                email: cleanEmail,
                role,
                password
            };

            const response = await db.registerUser(newUser);
            onLogin({ ...response.user, token: response.token });
        } else {
            // --- SIGN IN LOGIC ---
            const response = await db.authenticateUser(cleanEmail, password);

            if (!response || !response.user) {
                setError("No account found with this email or password incorrect.");
                setIsLoading(false);
                return;
            }

            // Log in
            onLogin({ ...response.user, token: response.token });
        }
    } catch (err: any) {
        setError(err.message || "Authentication failed.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
      <div className="bg-base-200 w-full max-w-md p-8 rounded-lg shadow-2xl border border-base-300">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
             <Logo className="w-40 h-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="text-gray-400 mt-2">
            {isSignUp ? 'Start managing your projects today' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {/* Name Field - Only for Sign Up */}
          {isSignUp && (
             <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input 
                type="text" 
                required={isSignUp}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-base-300 border border-base-300 rounded-md p-3 text-white focus:ring-2 focus:ring-brand-primary focus:outline-none"
                placeholder="John Doe"
                />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-base-300 border border-base-300 rounded-md p-3 text-white focus:ring-2 focus:ring-brand-primary focus:outline-none"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-base-300 border border-base-300 rounded-md p-3 text-white focus:ring-2 focus:ring-brand-primary focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => setRole('Acquisitions Manager')}
                    className={`p-2 text-sm rounded-md border transition-all ${role === 'Acquisitions Manager' ? 'bg-brand-primary border-brand-primary text-white' : 'bg-base-300 border-transparent text-gray-400 hover:bg-base-300/80'}`}
                >
                    Acquisitions Manager
                </button>
                <button
                    type="button"
                    onClick={() => setRole('Project Manager')}
                    className={`p-2 text-sm rounded-md border transition-all ${role === 'Project Manager' ? 'bg-brand-primary border-brand-primary text-white' : 'bg-base-300 border-transparent text-gray-400 hover:bg-base-300/80'}`}
                >
                    Project Manager
                </button>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50 flex items-center justify-center gap-2">
                <ExclamationTriangleIcon />
                <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-primary text-white font-bold py-3 rounded-md hover:bg-brand-secondary transition-all shadow-lg active:scale-95 flex items-center justify-center"
          >
            {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
                isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-400 hover:text-brand-primary transition-colors"
            >
              {isSignUp ? (
                  <>Already have an account? <span className="text-brand-primary font-bold">Sign In</span></>
              ) : (
                  <>Don't have an account? <span className="text-brand-primary font-bold">Sign Up</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginView;