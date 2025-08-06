import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { registerUser} from '../authSlice';

const signupSchema = z.object({
  firstName: z.string().min(3, "Minimum character should be 3"),
  emailId: z.string().email("Invalid Email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .refine(password => /[A-Z]/.test(password), {
      message: "Password must contain at least one uppercase letter"
    })
    .refine(password => /[a-z]/.test(password), {
      message: "Password must contain at least one lowercase letter"
    })
    .refine(password => /[0-9]/.test(password), {
      message: "Password must contain at least one number"
    })
    .refine(password => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
      message: "Password must contain at least one special character"
    })
});

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [displayError, setDisplayError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    setError: setFormError
  } = useForm({ 
    resolver: zodResolver(signupSchema),
    mode: 'onChange'
  });

  const onSubmit = (data) => {
    dispatch(registerUser(data));
  };

  const password = watch('password', '');
  const email = watch('emailId', '');

  // Track password requirements in real-time
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  // Calculate password strength
  const getPasswordStrength = () => {
    const checks = Object.values(passwordChecks);
    const passedChecks = checks.filter(Boolean).length;
    
    if (passedChecks === 0) return { strength: 0, label: '', color: '' };
    if (passedChecks <= 2) return { strength: 25, label: 'Weak', color: 'bg-red-500' };
    if (passedChecks <= 3) return { strength: 50, label: 'Fair', color: 'bg-yellow-500' };
    if (passedChecks <= 4) return { strength: 75, label: 'Good', color: 'bg-blue-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  // Validate password as user types
  useEffect(() => {
    if (password.length > 0) {
      trigger('password');
    }
  }, [password, trigger]);

  // Handle all errors
  useEffect(() => {
    if (error) {
      let errorMessage = error;
      
      if (error.includes('ERR_CONNECTION_REFUSED') || 
          error.includes('Network Error')) {
        errorMessage = 'Server is busy. Please try again later.';
      } 
      else if (error.includes('duplicate key error') || 
               error.includes('400')) {
        errorMessage = 'An account with this email already exists';
        setFormError('emailId', {
          type: 'manual',
          message: 'An account with this email already exists'
        });
      }
      
      setDisplayError(errorMessage);
    } else {
      setDisplayError('');
    }
  }, [error, setFormError]);

  return (
    <div className="min-h-screen bg-[#171819] flex items-center justify-center p-4">
      <div className="bg-[#212122] rounded-lg shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <h1 className="text-3xl font-bold text-white">Ciaan</h1>
          </div>
          <p className="text-gray-400 text-sm">Join our community platform</p>
        </div>

        {/* Unified error display */}
        {displayError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400 text-sm">{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* First Name Field */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              First Name
            </label>
            <input
              type="text"
              placeholder="Enter your first name"
              className={`w-full bg-transparent border rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#0A5BFF] transition-colors ${
                errors.firstName ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'
              }`}
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="text-red-400 text-xs mt-2">{errors.firstName.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className={`w-full bg-transparent border rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#0A5BFF] transition-colors ${
                errors.emailId ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'
              }`}
              {...register('emailId')}
            />
            {errors.emailId && (
              <p className="text-red-400 text-xs mt-2">{errors.emailId.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                className={`w-full bg-transparent border rounded-lg p-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#0A5BFF] transition-colors ${
                  errors.password ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'
                }`}
                {...register('password', {
                  onFocus: () => setPasswordFocused(true),
                  onBlur: () => setPasswordFocused(password.length > 0)
                })}
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="mt-3 space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">Password strength</span>
                    {passwordStrength.label && (
                      <span className={`text-xs font-medium ${
                        passwordStrength.label === 'Weak' ? 'text-red-400' :
                        passwordStrength.label === 'Fair' ? 'text-yellow-400' :
                        passwordStrength.label === 'Good' ? 'text-blue-400' :
                        'text-green-400'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    )}
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    ></div>
                  </div>
                </div>

                {/* Password Requirements */}
                {(passwordFocused || password.length > 0) && (
                  <div className="bg-[#171819] border border-gray-700 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-medium text-gray-300 mb-3">Password requirements:</p>
                    
                    {[
                      { check: passwordChecks.length, text: "At least 8 characters" },
                      { check: passwordChecks.uppercase, text: "One uppercase letter (A-Z)" },
                      { check: passwordChecks.lowercase, text: "One lowercase letter (a-z)" },
                      { check: passwordChecks.number, text: "One number (0-9)" },
                      { check: passwordChecks.specialChar, text: "One special character (!@#$%^&*)" }
                    ].map((requirement, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          requirement.check ? 'bg-green-500' : 'bg-gray-600'
                        }`}>
                          {requirement.check && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs ${
                          requirement.check ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          {requirement.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {errors.password && (
              <p className="text-red-400 text-xs mt-2">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0A5BFF] text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-[#0A5BFF] focus:ring-offset-2 focus:ring-offset-[#212122] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Redirect */}
        <div className="text-center mt-6">
          <span className="text-gray-400 text-sm">
            Already have an account?{' '}
            <NavLink 
              to="/login" 
              className="text-[#0A5BFF] hover:text-blue-400 font-medium transition-colors"
            >
              Sign in
            </NavLink>
          </span>
        </div>
      </div>
    </div>
  );
}

export default Signup;