"use client";

import { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { ArrowRight, Phone, Shield, Mail, Lock, User } from "lucide-react";
import { BRMHAuthUtils } from "../../lib/brmh-auth-utils";

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [authMode, setAuthMode] = useState<'oauth' | 'email' | 'phone'>('oauth');
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await BRMHAuthUtils.validateToken();
      if (isValid) {
        onAuthSuccess(); // Redirect to main app
      } else {
        BRMHAuthUtils.clearTokens();
      }
    };
    
    const tokens = BRMHAuthUtils.getStoredTokens();
    if (tokens) {
      checkAuth();
    }
  }, [onAuthSuccess]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
   
    if (error) {
      setMessage(`OAuth error: ${error}`);
      return;
    }
   
    if (code) {
      const savedState = sessionStorage.getItem('oauth_state');
      
      if (state && savedState && state !== savedState) {
        console.warn('State mismatch detected, but proceeding with code exchange');
      }
      
      // Exchange code for tokens
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          state: state || savedState || 'password-change-flow'
        })
      })
      .then(res => res.json())
      .then(tokens => {
        if (tokens.error) {
          throw new Error(tokens.error);
        }
       
        // Store tokens using BRMHAuthUtils
        BRMHAuthUtils.storeTokens(tokens);
       
        // Clean up
        sessionStorage.removeItem('oauth_state');
       
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
       
        // Redirect to main app
        onAuthSuccess();
      })
      .catch(error => {
        console.error('Token exchange failed:', error);
        setMessage('Login failed. Please try again.');
        sessionStorage.removeItem('oauth_state');
      });
    }
  }, [onAuthSuccess]);

  // Handle OAuth login
  const handleOAuthLogin = async () => {
    setOauthLoading(true);
    setMessage('');
   
    try {
      // Check if we're in mock mode
      const mockMode = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' || !process.env.NEXT_PUBLIC_BACKEND_URL;
      
      if (mockMode) {
        // Mock OAuth - simulate successful login
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate redirect delay
        
        const mockTokens = {
          access_token: `mock_oauth_access_${Date.now()}`,
          id_token: `mock_oauth_id_${Date.now()}`,
          refresh_token: `mock_oauth_refresh_${Date.now()}`,
          user_id: `mock_user_${Date.now()}`,
          expires_in: 3600
        };
        
        BRMHAuthUtils.storeTokens(mockTokens);
        setMessage('OAuth login successful!');
        setTimeout(() => {
          onAuthSuccess();
        }, 1000);
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"}/auth/oauth-url`);
      if (!response.ok) {
        throw new Error('Failed to get OAuth URL');
      }
     
      const { authUrl, state } = await response.json();
      sessionStorage.setItem('oauth_state', state);
      window.location.href = authUrl;
    } catch (error) {
      console.error('OAuth login error:', error);
      setMessage('OAuth login failed. Please try again.');
      setOauthLoading(false);
    }
  };

  // Handle email login/signup
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const result = await BRMHAuthUtils.login(username, password);
        if (result.success) {
          setMessage('Login successful!');
          setTimeout(() => {
            onAuthSuccess();
          }, 1000);
        } else {
          setMessage(result.error || 'Login failed');
        }
      } else {
        const result = await BRMHAuthUtils.signup(username, password, email);
        if (result.success) {
          setMessage('Signup successful! Please check your email.');
          setTimeout(() => {
            onAuthSuccess();
          }, 1000);
        } else {
          setMessage(result.error || 'Signup failed');
        }
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle phone signup
  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await BRMHAuthUtils.phoneSignup(phoneNumber, password, email);
      if (result.success) {
        setMessage('Account created! Please check your phone for verification code.');
        setShowOtpInput(true);
        if (result.username) {
          sessionStorage.setItem('phone_signup_username', result.username);
        } else {
          sessionStorage.setItem('phone_signup_username', phoneNumber);
        }
      } else {
        setMessage(result.error || 'Signup failed');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle phone login
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await BRMHAuthUtils.phoneLogin(phoneNumber, password);
      if (result.success) {
        setMessage('Login successful!');
        setTimeout(() => {
          onAuthSuccess();
        }, 1000);
      } else {
        setMessage(result.error || 'Login failed');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await BRMHAuthUtils.verifyOTP(
        phoneNumber, 
        otp, 
        sessionStorage.getItem('phone_signup_username') || undefined
      );
      
      if (result.success) {
        setMessage('Phone number verified successfully!');
        setShowOtpInput(false);
        setOtp('');
        setTimeout(() => {
          onAuthSuccess();
        }, 1000);
      } else {
        setMessage(result.error || 'Verification failed');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    setMessage('');

    try {
      const result = await BRMHAuthUtils.resendOTP(
        phoneNumber, 
        sessionStorage.getItem('phone_signup_username') || undefined
      );
      
      if (result.success) {
        setMessage('OTP resent successfully!');
      } else {
        setMessage(result.error || 'Failed to resend OTP');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMessage('');
    setUsername('');
    setPassword('');
    setEmail('');
    setPhoneNumber('+91');
    setOtp('');
    setShowOtpInput(false);
  };

  const getIcon = () => {
    switch (authMode) {
      case 'oauth':
        return <Lock className="w-7 h-7 text-white" />;
      case 'email':
        return <Mail className="w-7 h-7 text-white" />;
      case 'phone':
        return <Phone className="w-7 h-7 text-white" />;
      default:
        return <Shield className="w-7 h-7 text-white" />;
    }
  };

  const getTitle = () => {
    if (authMode === 'phone' && showOtpInput) {
      return 'Verify Your Number';
    }
    return isLogin ? 'Sign in to InfluenceHub' : 'Create your account';
  };

  const getDescription = () => {
    if (authMode === 'phone' && showOtpInput) {
      return `We sent a verification code to ${phoneNumber}`;
    }
    switch (authMode) {
      case 'oauth':
        return 'Sign in with your social account';
      case 'email':
        return isLogin ? 'Enter your credentials to continue' : 'Create a new account with email';
      case 'phone':
        return isLogin ? 'Sign in with your phone number' : 'Create account with phone number';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center px-6 pt-8 pb-4">
          <div className="mx-auto w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            {getIcon()}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 px-6 pb-8">
          {/* Authentication Mode Selector */}
          {!showOtpInput && (
            <div className="flex justify-center space-x-2">
              <Button
                variant={authMode === 'oauth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setAuthMode('oauth'); resetForm(); }}
                className="text-xs"
              >
                OAuth
              </Button>
              <Button
                variant={authMode === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setAuthMode('email'); resetForm(); }}
                className="text-xs"
              >
                Email
              </Button>
              <Button
                variant={authMode === 'phone' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setAuthMode('phone'); resetForm(); }}
                className="text-xs"
              >
                Phone
              </Button>
            </div>
          )}

          {/* OAuth Login */}
          {authMode === 'oauth' && !showOtpInput && (
            <div className="space-y-4">
              <Button 
                onClick={handleOAuthLogin}
                disabled={oauthLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                {oauthLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Redirecting to login...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>Sign in with Cognito OAuth</span>
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* Email Login/Signup */}
          {authMode === 'email' && !showOtpInput && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
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
          )}

          {/* Phone Login/Signup */}
          {authMode === 'phone' && !showOtpInput && (
            <form onSubmit={isLogin ? handlePhoneLogin : handlePhoneSignup} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 block mb-1">
                    Phone Number
                  </label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    placeholder="+91"
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
                      Email (Optional)
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      placeholder="Enter email (optional)"
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
          )}

          {/* OTP Verification */}
          {showOtpInput && (
            <form onSubmit={handleOtpVerification} className="space-y-6">
              <div className="space-y-6">
                <div className="text-center">
                  <label className="text-sm font-medium block mb-4 text-gray-700">
                    Enter 6-digit code
                  </label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                    >
                      <InputOTPGroup className="gap-2 sm:gap-3">
                        <InputOTPSlot index={0} className="w-10 h-12 sm:w-12 sm:h-14 text-lg font-semibold border-gray-300 focus:border-blue-500" />
                        <InputOTPSlot index={1} className="w-10 h-12 sm:w-12 sm:h-14 text-lg font-semibold border-gray-300 focus:border-blue-500" />
                        <InputOTPSlot index={2} className="w-10 h-12 sm:w-12 sm:h-14 text-lg font-semibold border-gray-300 focus:border-blue-500" />
                        <InputOTPSlot index={3} className="w-10 h-12 sm:w-12 sm:h-14 text-lg font-semibold border-gray-300 focus:border-blue-500" />
                        <InputOTPSlot index={4} className="w-10 h-12 sm:w-12 sm:h-14 text-lg font-semibold border-gray-300 focus:border-blue-500" />
                        <InputOTPSlot index={5} className="w-10 h-12 sm:w-12 sm:h-14 text-lg font-semibold border-gray-300 focus:border-blue-500" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                
                <div className="text-center pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendOtp}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    Didn't receive the code? Resend
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <Button 
                  type="submit"
                  disabled={otp.length !== 6 || loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOtpInput(false)}
                  className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Back to Signup
                </Button>
              </div>
            </form>
          )}

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
            <p>By continuing, you agree to our <span className="text-blue-600 hover:underline cursor-pointer">Terms of Service</span></p>
            <p>and <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}