import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  instanceName: string;
}

export function QRCodeDisplay({ open, onOpenChange, instanceId, instanceName }: QRCodeDisplayProps) {
  const { data: qrData, isLoading, refetch } = useQuery({
    queryKey: ['qr-code', instanceId],
    queryFn: () => apiClient.getQRCode(instanceId),
    enabled: open,
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: 3,
  });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>WhatsApp QR Code - {instanceName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Scan this QR code with your WhatsApp mobile app to link the device.
          </div>

          <div className="flex justify-center p-4 border border-dashed border-border rounded-lg">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading QR code...
              </div>
            ) : qrData?.qrCode ? (
              <img
                src={qrData.qrCode}
                alt="WhatsApp QR Code"
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <p>QR code not available</p>
                <p className="text-xs">Please initialize the device first</p>
              </div>
            )}
          </div>

          {qrData?.timestamp && (
            <div className="text-xs text-muted-foreground text-center">
              Generated: {new Date(qrData.timestamp).toLocaleString()}
            </div>
          )}

          <div className="flex gap-2">
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
          </div>

          <div className="text-xs text-muted-foreground">
            <strong>Instructions:</strong>
            <ol className="list-decimal list-inside space-y-1 mt-1">
              <li>Open WhatsApp on your phone</li>
              <li>Go to Settings → Linked Devices</li>
              <li>Tap "Link a Device"</li>
              <li>Scan this QR code</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}