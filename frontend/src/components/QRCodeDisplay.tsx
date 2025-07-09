import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  instanceId: string;
  instanceName: string;
  onStatusChange?: (status: string) => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  instanceId,
  instanceName,
  onStatusChange,
}) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('initializing');
  const { toast } = useToast();

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getQRCode(instanceId);
      setQrCode(response.qrCode);
      setStatus('qr_ready');
      onStatusChange?.('qr_ready');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch QR code';
      setError(errorMessage);
      
      if (errorMessage.includes('not available')) {
        setStatus('initializing');
        onStatusChange?.('initializing');
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeAndGetQR = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First initialize the client
      await apiClient.initializeNumber(instanceId);
      toast({
        title: 'Client initialized',
        description: 'WhatsApp client is starting up...',
      });
      
      // Wait a bit then fetch QR code
      setTimeout(() => {
        fetchQRCode();
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize';
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Auto-refresh QR code status
  useEffect(() => {
    if (status === 'qr_ready' || status === 'initializing') {
      const interval = setInterval(() => {
        fetchQRCode();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [status, instanceId]);

  const getStatusIcon = () => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'qr_ready':
        return <RefreshCw className="h-5 w-5 text-warning animate-spin" />;
      case 'auth_failed':
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-error" />;
      default:
        return <Loader2 className="h-5 w-5 text-info animate-spin" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'ready':
        return 'Connected and ready to send messages';
      case 'qr_ready':
        return 'Scan QR code with WhatsApp to connect';
      case 'auth_failed':
        return 'Authentication failed. Please try again.';
      case 'disconnected':
        return 'Disconnected from WhatsApp';
      default:
        return 'Initializing WhatsApp client...';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Connection Status - {instanceName}
        </CardTitle>
        <CardDescription>{getStatusMessage()}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {!qrCode && !loading && !error && (
          <div className="text-center py-8">
            <Button 
              onClick={initializeAndGetQR}
              className="bg-whatsapp-green hover:bg-whatsapp-green-hover"
            >
              Initialize WhatsApp Connection
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-whatsapp-green" />
            <span className="ml-2 text-whatsapp-gray">Loading QR code...</span>
          </div>
        )}

        {qrCode && (
          <div className="text-center">
            <div className="inline-block p-4 bg-white border-2 border-whatsapp-green rounded-lg">
              <img
                src={qrCode}
                alt="WhatsApp QR Code"
                className="w-64 h-64 mx-auto"
              />
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-whatsapp-gray">
                Open WhatsApp on your phone and scan this QR code
              </p>
              <Button
                onClick={fetchQRCode}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh QR Code
              </Button>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">Successfully Connected!</span>
            </div>
            <p className="text-sm text-whatsapp-gray mt-2">
              Your WhatsApp number is ready to send messages
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};