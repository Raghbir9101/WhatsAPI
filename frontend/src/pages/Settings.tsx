import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, User, Mail, Building, Calendar, Key, Activity } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface UserStats {
  user: {
    email: string;
    name: string;
    company: string;
    createdAt: string;
  };
  usage: {
    messagesSent: number;
    monthlyLimit: number;
    remainingMessages: number;
  };
  totalNumbers: number;
  activeNumbers: number;
}

export const Settings: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string>('');
  const { user, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    // Get API key from localStorage
    const storedApiKey = localStorage.getItem('apiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.getStats();
      setStats(response);
    } catch (error) {
      toast({
        title: 'Failed to load settings',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: 'API Key copied',
      description: 'Your API key has been copied to clipboard',
    });
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 8) + '•'.repeat(key.length - 12) + key.substring(key.length - 4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green mx-auto mb-4"></div>
          <p className="text-whatsapp-gray">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-whatsapp-dark">Settings</h1>
        <p className="text-whatsapp-gray">
          Manage your account settings and API configuration
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-whatsapp-green" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your personal account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-whatsapp-gray" />
                <div>
                  <p className="text-sm font-medium text-whatsapp-dark">Full Name</p>
                  <p className="text-sm text-whatsapp-gray">{user?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-whatsapp-gray" />
                <div>
                  <p className="text-sm font-medium text-whatsapp-dark">Email Address</p>
                  <p className="text-sm text-whatsapp-gray">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-whatsapp-gray" />
                <div>
                  <p className="text-sm font-medium text-whatsapp-dark">Company</p>
                  <p className="text-sm text-whatsapp-gray">{user?.company || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-whatsapp-gray" />
                <div>
                  <p className="text-sm font-medium text-whatsapp-dark">Member Since</p>
                  <p className="text-sm text-whatsapp-gray">
                    {stats ? new Date(stats.user.createdAt).toLocaleDateString() : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-whatsapp-green" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Your API key for programmatic access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-whatsapp-dark">API Key</Label>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 p-3 bg-whatsapp-light-gray rounded-lg border font-mono text-sm">
                  {maskApiKey(apiKey)}
                </div>
                <Button onClick={copyApiKey} variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-whatsapp-gray mt-2">
                Use this API key in your HTTP requests with the header: x-api-key
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">API Endpoint</h4>
              <code className="text-sm text-blue-800 bg-blue-100 px-2 py-1 rounded">
                http://localhost:3001/api
              </code>
              <p className="text-xs text-blue-700 mt-2">
                All API requests should be made to this base URL
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-whatsapp-green" />
              Usage Statistics
            </CardTitle>
            <CardDescription>
              Your current usage and limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-whatsapp-green-light rounded-lg">
                <div className="text-2xl font-bold text-whatsapp-dark">{stats.usage.messagesSent}</div>
                <p className="text-sm text-whatsapp-gray">Messages Sent</p>
                <p className="text-xs text-whatsapp-gray mt-1">This month</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-whatsapp-dark">{stats.usage.remainingMessages}</div>
                <p className="text-sm text-whatsapp-gray">Remaining</p>
                <p className="text-xs text-whatsapp-gray mt-1">This month</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-whatsapp-dark">{stats.totalNumbers}</div>
                <p className="text-sm text-whatsapp-gray">WhatsApp Numbers</p>
                <p className="text-xs text-whatsapp-gray mt-1">{stats.activeNumbers} active</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Monthly Limit Usage</span>
                <Badge variant="outline">
                  {((stats.usage.messagesSent / stats.usage.monthlyLimit) * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-whatsapp-green h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((stats.usage.messagesSent / stats.usage.monthlyLimit) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-whatsapp-gray mt-2">
                {stats.usage.messagesSent} of {stats.usage.monthlyLimit} messages used
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={fetchStats}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
            <Button 
              onClick={logout}
              variant="destructive"
              className="flex items-center gap-2"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Quick reference for using the WhatsApp API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-whatsapp-dark mb-2">Send Text Message</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
{`POST /api/send-message
Headers: { "x-api-key": "your-api-key" }
Body: {
  "instanceId": "your-instance-id",
  "to": "919876543210",
  "message": "Hello from WhatsApp API!"
}`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium text-whatsapp-dark mb-2">Get Numbers</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
{`GET /api/numbers
Headers: { "x-api-key": "your-api-key" }`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium text-whatsapp-dark mb-2">Send Media</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
{`POST /api/send-media-url
Headers: { "x-api-key": "your-api-key" }
Body: {
  "instanceId": "your-instance-id",
  "to": "919876543210",
  "mediaUrl": "https://example.com/image.jpg",
  "caption": "Check this out!"
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}