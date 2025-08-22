import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { ArrowRight, Phone, Shield } from "lucide-react";

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim() || phoneNumber.trim() === '+91') return;
    
    setLoading(true);
    // Simulate API call - replace with AWS Cognito integration
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1500);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;
    
    setLoading(true);
    // Simulate API call - replace with AWS Cognito integration
    setTimeout(() => {
      setLoading(false);
      onAuthSuccess();
    }, 1500);
  };

  const handleResendOTP = () => {
    setOtp('');
    // Simulate resend - replace with AWS Cognito integration
    setTimeout(() => {
      // Show success message
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center px-6 pt-8 pb-4">
          <div className="mx-auto w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            {step === 'phone' ? (
              <Phone className="w-7 h-7 text-white" />
            ) : (
              <Shield className="w-7 h-7 text-white" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            {step === 'phone' ? 'Welcome to InfluenceHub' : 'Verify Your Number'}
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            {step === 'phone' 
              ? 'Enter your phone number to get started'
              : `We sent a verification code to ${phoneNumber}`
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 px-6 pb-8">
          {step === 'phone' ? (
            <>
              <div className="space-y-3">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700 block">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  placeholder="+91"
                />
              </div>
              
              <Button 
                onClick={handleSendOTP}
                disabled={!phoneNumber.trim() || phoneNumber.trim() === '+91' || loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending Code...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </>
          ) : (
            <>
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
                    variant="ghost"
                    onClick={handleResendOTP}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    Didn't receive the code? Resend
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={handleVerifyOTP}
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
                  variant="outline"
                  onClick={() => setStep('phone')}
                  className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Back to Phone Number
                </Button>
              </div>
            </>
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