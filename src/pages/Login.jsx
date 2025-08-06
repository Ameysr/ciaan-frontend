import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { unwrapResult } from '@reduxjs/toolkit';
import { loginUser } from "../authSlice";

const loginSchema = z.object({
  emailId: z.string().email("Invalid Email"),
  password: z.string().min(1, "Password is required") 
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authError = useSelector((state) => state.auth.error);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      const result = await dispatch(loginUser(data));
      unwrapResult(result);
      navigate('/');
    } catch (error) {
      // Handle 401 specifically
      if (error?.payload?.status === 401) {
        // Keep the error in Redux state for display
      } else {
        // For other errors, preserve form data by not resetting
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171819] flex items-center justify-center p-4">
      <div className="bg-[#212122] rounded-lg shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <h1 className="text-3xl font-bold text-white">Ciaan</h1>
          </div>
          <p className="text-gray-400 text-sm">Welcome back to our community</p>
        </div>

        {/* Error display */}
        {authError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400 text-sm">
              {authError.includes("401") ? "Invalid email or password" : authError}
            </span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault(); // Prevent default browser behavior
            handleSubmit(onSubmit)(e);
          }}
          className="space-y-6"
        >
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
              {...register("emailId")}
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
                placeholder="Enter your password"
                className={`w-full bg-transparent border rounded-lg p-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#0A5BFF] transition-colors ${
                  errors.password ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'
                }`}
                {...register("password")}
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
            {errors.password && (
              <p className="text-red-400 text-xs mt-2">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#0A5BFF] text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-[#0A5BFF] focus:ring-offset-2 focus:ring-offset-[#212122] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Sign Up Redirect */}
        <div className="text-center mt-6">
          <span className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <NavLink 
              to="/signup" 
              className="text-[#0A5BFF] hover:text-blue-400 font-medium transition-colors"
            >
              Create Account
            </NavLink>
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;