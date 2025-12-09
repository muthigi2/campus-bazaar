import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface VerificationPageProps {
  email: string;
  onSubmit: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onChangeEmail: () => void;
}

export function VerificationPage({ email, onSubmit, onResend, onChangeEmail }: VerificationPageProps) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 6) return;
    setIsSubmitting(true);
    try {
      await onSubmit(code.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[#E84A27] mb-2">Verify your email</h1>
          <p className="text-[#13294B] opacity-70">We’ve sent a 6-digit code to {email}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-[#13294B]">Verification code</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              placeholder="123456"
              className="border-gray-300 focus:border-[#E84A27] focus:ring-[#E84A27]"
              required
            />
            <Button
              type="submit"
              className="w-full bg-[#13294B] hover:bg-[#13294B]/90 text-white rounded-lg"
              disabled={isSubmitting || code.length < 6}
            >
              {isSubmitting ? 'Verifying...' : 'Verify email'}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-[#E84A27] hover:underline disabled:opacity-60"
            >
              {isResending ? 'Sending…' : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={onChangeEmail}
              className="text-gray-500 hover:underline"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
