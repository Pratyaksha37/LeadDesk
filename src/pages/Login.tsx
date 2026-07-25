import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation } from 'wouter';

export default function Login() {
  const { signIn, signUp, user } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  if (user) {
    setLocation('/admin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const action = isSignUp ? signUp : signIn;
    const { error: err } = await action(email, password);
    setLoading(false);

    if (err) {
      setError(err);
    } else if (!isSignUp) {
      setLocation('/admin');
    } else {
      setError('Account created! You can now sign in.');
      setIsSignUp(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-primary via-violet-500 to-indigo-400" />
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm shadow-primary/30 mx-auto mb-4">
                <div className="w-3.5 h-3.5 bg-primary-foreground rounded-full" />
              </div>
              <h1 className="text-xl font-bold">Admin Login</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to manage leads
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <p className={`text-sm font-medium ${error.includes('created') ? 'text-emerald-600' : 'text-destructive'}`}>
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {isSignUp ? 'Creating account…' : 'Signing in…'}
                  </span>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {isSignUp ? (
                <>Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>No account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-primary font-medium hover:underline"
                  >
                    Create one
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
