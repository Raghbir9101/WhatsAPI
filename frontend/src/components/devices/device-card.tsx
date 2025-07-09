import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Power, Trash2, RefreshCw, Smartphone } from 'lucide-react';
import { StatusBadge, DeviceStatus } from '@/components/ui/status-badge';
import { QRCodeDisplay } from '@/components/devices/qr-code-display';
import { WhatsAppInstance } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeviceCardProps {
  device: WhatsAppInstance;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const [showQR, setShowQR] = useState(false);
  const queryClient = useQueryClient();

  const initializeMutation = useMutation({
    mutationFn: (instanceId: string) => apiClient.initializeNumber(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numbers'] });
      toast({
        title: 'Device initialized',
        description: 'WhatsApp client is being initialized',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to initialize',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (instanceId: string) => apiClient.disconnectNumber(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numbers'] });
      toast({
        title: 'Device disconnected',
        description: 'WhatsApp device has been disconnected',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (instanceId: string) => apiClient.deleteNumber(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numbers'] });
      toast({
        title: 'Device deleted',
        description: 'WhatsApp device has been removed',
      });
    },
  });

  const handleConnect = () => {
    // Initialize the device and then show QR code
    initializeMutation.mutate(device.instanceId);
    // Show QR code popup after a short delay to allow initialization
    setTimeout(() => {
      setShowQR(true);
    }, 1000);
  };

  const handleShowQR = () => {
    setShowQR(true);
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate(device.instanceId);
  };

  const handleDelete = () => {
    deleteMutation.mutate(device.instanceId);
  };

  return (
    <>
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              {device.instanceName}
            </CardTitle>
            <StatusBadge status={device.status as DeviceStatus} />
          </div>
          {device.description && (
            <p className="text-sm text-muted-foreground">{device.description}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {device.phoneNumber && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{device.phoneNumber}</Badge>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>Messages: {device.messagesSent}</div>
            <div>Created: {new Date(device.createdAt).toLocaleDateString()}</div>
            {device.connectedAt && (
              <div className="col-span-2">
                Connected: {new Date(device.connectedAt).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* Primary Action Button */}
            <div className="w-full">
              {device.status === 'ready' ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  <Power className="h-4 w-4 mr-2" />
                  Connected
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={initializeMutation.isPending}
                  className="w-full"
                >
                  {initializeMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Power className="h-4 w-4 mr-2" />
                  )}
                  {initializeMutation.isPending ? 'Connecting...' : 'Connect Device'}
                </Button>
              )}
            </div>

            {/* Secondary Action Buttons */}
            <div className="flex gap-2">
              {device.isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  className="flex-1"
                >
                  <Power className="h-4 w-4 mr-1" />
                  Disconnect
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="flex-1">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Device</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{device.instanceName}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <QRCodeDisplay
        open={showQR}
        onOpenChange={setShowQR}
        instanceId={device.instanceId}
        instanceName={device.instanceName}
      />
    </>
  );
}