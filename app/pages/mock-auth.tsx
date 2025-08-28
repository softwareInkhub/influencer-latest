"use client";

import { useState } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowRight, Lock } from "lucide-react";
import { MockAuth as MockAuthService } from "../../lib/mock-auth";

interface MockAuthProps {
  onAuthSuccess: () => void;
}

export function MockAuth({ onAuthSuccess }: MockAuthProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const result = await MockAuthService.login(username, password);
        if (result.success) {
          setMessage('Login successful!');
          setTimeout(() => {
            onAuthSuccess();
          }, 1000);
        } else {
          setMessage(result.error || 'Login failed');
        }
      } else {
        const result = await MockAuthService.signup(username, password, email);
        if (result.success) {
          setMessage('Account created successfully!');
          setTimeout(() => {
            onAuthSuccess();
          }, 1000);
        } else {
          setMessage(result.error || 'Signup failed');
        }
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }

    setLoading(false);
  };

  const resetForm = () => {
    setMessage('');
    setUsername('');
    setPassword('');
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center px-6 pt-8 pb-4">
          <div className="mx-auto w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Sign in to InfluenceHub' : 'Create your account'}
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            {isLogin ? 'Enter your credentials to continue' : 'Create a new account'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 px-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label htmlFor="username" className="text-sm font-medium text-gray-700 block mb-1">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium text-gray-700 block mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  placeholder="Enter password"
                />
              </div>
              {!isLogin && (
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    placeholder="Enter email"
                  />
                </div>
              )}
            </div>
            
            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsLogin(!isLogin);
                  resetForm();
                }}
                className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Button>
            </div>
          </form>

          {/* Message Display */}
          {message && (
            <div className={`text-sm text-center p-3 rounded-lg ${
              message.includes('successful') || message.includes('successfully') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}
          
          <div className="text-center text-xs text-gray-500 space-y-1 pt-4">
            <p>This is a mock login system for development purposes</p>
            <p>Any username and password will work</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
