import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export const AuthForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    name: '',
    company: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(loginForm.email, loginForm.password);
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully logged in.',
      });
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(registerForm);
      toast({
        title: 'Account created!',
        description: 'Your account has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ceo-green/5 to-ceo-green/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageCircle className="h-8 w-8 text-ceo-green" />
            <h1 className="text-2xl font-bold text-ceo-black">WhatsApp API</h1>
          </div>
          <p className="text-ceo-gray">Manage your WhatsApp messaging platform</p>
        </div>

        <Card className="border-0 shadow-xl bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-ceo-black">Welcome</CardTitle>
            <CardDescription className="text-ceo-gray">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger 
                  value="login"
                  className="data-[state=active]:bg-ceo-green data-[state=active]:text-white"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-ceo-green data-[state=active]:text-white"
                >
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-ceo-black font-medium">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, email: e.target.value })
                      }
                      required
                      className="h-11 border-border focus:border-ceo-green focus:ring-ceo-green/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-ceo-black font-medium">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, password: e.target.value })
                      }
                      required
                      className="h-11 border-border focus:border-ceo-green focus:ring-ceo-green/20"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 bg-ceo-green hover:bg-ceo-green-dark text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-ceo-black font-medium">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={registerForm.name}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, name: e.target.value })
                      }
                      required
                      className="h-11 border-border focus:border-ceo-green focus:ring-ceo-green/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-ceo-black font-medium">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      value={registerForm.email}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, email: e.target.value })
                      }
                      required
                      className="h-11 border-border focus:border-ceo-green focus:ring-ceo-green/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-company" className="text-ceo-black font-medium">Company (Optional)</Label>
                    <Input
                      id="register-company"
                      type="text"
                      placeholder="Enter your company name"
                      value={registerForm.company}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, company: e.target.value })
                      }
                      className="h-11 border-border focus:border-ceo-green focus:ring-ceo-green/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-ceo-black font-medium">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Enter your password"
                      value={registerForm.password}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, password: e.target.value })
                      }
                      required
                      className="h-11 border-border focus:border-ceo-green focus:ring-ceo-green/20"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 bg-ceo-green hover:bg-ceo-green-dark text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};