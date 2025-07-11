import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, CheckCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  instanceName: string;
}

export function QRCodeDisplay({ open, onOpenChange, instanceId, instanceName }: QRCodeDisplayProps) {
  const queryClient = useQueryClient();
  
  const { data: qrData, isLoading, refetch, error } = useQuery({
    queryKey: ['qr-code', instanceId],
    queryFn: () => apiClient.getQRCode(instanceId),
    enabled: open,
    refetchInterval: 8000, // Poll every 8 seconds when modal is open
    retry: 3,
    retryDelay: 2000,
  });

  // Auto-close modal when device becomes ready
  useEffect(() => {
    if (qrData?.isAuthenticated || qrData?.status === 'ready') {
      toast({
        title: 'Device Connected!',
        description: `${instanceName} is now ready to send messages`,
      });
      onOpenChange(false);
      // Refresh the numbers list to show updated status
      queryClient.invalidateQueries({ queryKey: ['numbers'] });
    }
  }, [qrData?.isAuthenticated, qrData?.status, instanceName, onOpenChange, queryClient]);

  const downloadQR = () => {
    if (qrData?.qrCode) {
      const link = document.createElement('a');
      link.href = qrData.qrCode;
      link.download = `whatsapp-qr-${instanceName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'QR Code downloaded',
        description: 'QR code image has been saved to your downloads',
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect {instanceName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Messages */}
          {qrData?.isAuthenticated || qrData?.status === 'ready' ? (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Device Connected!</div>
                <div className="text-sm text-green-600">Your WhatsApp is ready to use</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Scan this QR code with your WhatsApp mobile app to link the device.
            </div>
          )}

          {/* QR Code Display */}
          <div className="flex justify-center p-4 border border-dashed border-border rounded-lg">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                {(qrData as any)?.qrCode ? 'Checking connection...' : 'Generating QR code...'}
              </div>
            ) : qrData?.isAuthenticated || qrData?.status === 'ready' ? (
              <div className="flex flex-col items-center gap-2 text-green-600">
                <CheckCircle className="h-12 w-12" />
                <div className="text-sm font-medium">Connected Successfully!</div>
              </div>
            ) : qrData?.qrCode ? (
              <img
                src={qrData.qrCode}
                alt="WhatsApp QR Code"
                className="w-48 h-48 object-contain"
              />
            ) : error ? (
              <div className="text-center text-muted-foreground">
                <p className="text-red-600">Failed to load QR code</p>
                <p className="text-xs mt-1">{error?.message || 'Unknown error'}</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>QR code not available</p>
                <p className="text-xs">Device may not be initialized</p>
              </div>
            )}
          </div>

          {qrData?.timestamp && qrData && !(qrData.isAuthenticated || qrData.status === 'ready') && (
            <div className="text-xs text-muted-foreground text-center">
              Generated: {new Date(qrData.timestamp).toLocaleString()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {qrData?.isAuthenticated || qrData?.status === 'ready' ? (
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                {qrData?.qrCode && (
                  <Button onClick={downloadQR} className="flex-1">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Instructions */}
          {!(qrData?.isAuthenticated || qrData?.status === 'ready') && (
            <div className="text-xs text-muted-foreground">
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>Open WhatsApp on your phone</li>
                <li>Go to Settings → Linked Devices</li>
                <li>Tap "Link a Device"</li>
                <li>Scan this QR code</li>
              </ol>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}