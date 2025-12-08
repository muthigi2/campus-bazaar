import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface LoginPageProps {
  onSubmit: (payload: { email: string; password: string; isSignUp: boolean; name?: string }) => Promise<void>;
}

export function LoginPage({ onSubmit }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ email, password, isSignUp, name: isSignUp ? name : undefined });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-[#E84A27] mb-2">Campus Bazaar</h1>
          <p className="text-[#13294B] opacity-70">Student-to-Student Marketplace</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-[#13294B] mb-6 text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[#13294B]">
                UIUC Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="netid@illinois.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 border-gray-300 focus:border-[#E84A27] focus:ring-[#E84A27]"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-[#13294B]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 border-gray-300 focus:border-[#E84A27] focus:ring-[#E84A27]"
                required
              />
            </div>

            {isSignUp && (
              <>
                <div>
                  <Label htmlFor="name" className="text-[#13294B]">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 border-gray-300 focus:border-[#E84A27] focus:ring-[#E84A27]"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-[#13294B]">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="mt-1.5 border-gray-300 focus:border-[#E84A27] focus:ring-[#E84A27]"
                    required
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-[#13294B] hover:bg-[#13294B]/90 text-white rounded-lg mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#E84A27] hover:underline"
            >
              {isSignUp
                ? 'Already have an account? Login'
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Exclusive to verified UIUC students
        </p>
      </div>
    </div>
  );
}
