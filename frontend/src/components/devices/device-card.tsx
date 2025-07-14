import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Power, Trash2, RefreshCw, Smartphone, QrCode } from 'lucide-react';
import { StatusBadge, DeviceStatus } from '@/components/ui/status-badge';
import { QRCodeDisplay } from '@/components/devices/qr-code-display';
import { WhatsAppInstance } from '@/lib/api';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const queryClient = useQueryClient();

  // Poll device status when initializing or after operations
  const { data: deviceStatus } = useQuery({
    queryKey: ['device-status', device.instanceId],
    queryFn: () => apiClient.getNumber(device.instanceId),
    enabled: isInitializing || isDisconnecting,
    refetchInterval: 2000, // Check every 2 seconds when needed
  });

  // Stop polling when device reaches stable state
  useEffect(() => {
    if (deviceStatus?.status === 'ready') {
      setIsInitializing(false);
      setIsDisconnecting(false);
      toast({
        title: 'Device Connected!',
        description: `${device.instanceName} is now ready to send messages`,
      });
      queryClient.invalidateQueries({ queryKey: ['numbers'] });
    } else if (deviceStatus?.status === 'disconnected' || deviceStatus?.status === 'not_initialized') {
      setIsInitializing(false);
      setIsDisconnecting(false);
      queryClient.invalidateQueries({ queryKey: ['numbers'] });
    }
  }, [deviceStatus?.status, device.instanceName, queryClient]);

  const initializeMutation = useMutation({
    mutationFn: (instanceId: string) => apiClient.initializeNumber(instanceId),
    onSuccess: () => {
      setIsInitializing(true);
      queryClient.invalidateQueries({ queryKey: ['numbers'] });

      // Wait a moment for initialization, then check for QR
      setTimeout(() => {
        checkQRAvailability();
      }, 2000);
    },
    onError: (error: any) => {
      setIsInitializing(false);
      toast({
        title: 'Failed to initialize',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (instanceId: string) => apiClient.disconnectNumber(instanceId),
    onMutate: () => {
      setIsDisconnecting(true);
    },
    onSuccess: () => {
      toast({
        title: 'Device disconnected',
        description: 'WhatsApp device has been disconnected',
      });
      // Start polling to check disconnection status
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['numbers'] });
        queryClient.invalidateQueries({ queryKey: ['device-status', device.instanceId] });
      }, 1000);
    },
    onError: (error: any) => {
      setIsDisconnecting(false);
      toast({
        title: 'Failed to disconnect',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
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

  const checkQRAvailability = async () => {
    try {
      const qrResponse = await apiClient.getQRCode(device.instanceId);
      if (qrResponse.qrCode) {
        toast({
          title: 'QR Code Ready',
          description: 'Scan the QR code to connect your device',
        });
        setShowQR(true);
      } else if (qrResponse.isAuthenticated || qrResponse.status === 'ready') {
        // Device is already connected
        setIsInitializing(false);
        toast({
          title: 'Device Already Connected',
          description: 'Your WhatsApp device is ready to use',
        });
      }
    } catch (error) {
      console.error('Error checking QR availability:', error);
      // Still show the modal so user can see the error
      setShowQR(true);
    }
  };

  const handleConnect = () => {
    setIsInitializing(true);
    initializeMutation.mutate(device.instanceId);
  };

  const handleShowQR = () => {
    if (device.status === 'ready') {
      toast({
        title: 'Device Already Connected',
        description: 'Your WhatsApp device is ready to use',
      });
      return;
    }
    setShowQR(true);
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate(device.instanceId);
  };

  const handleDelete = () => {
    deleteMutation.mutate(device.instanceId);
  };

  // Use the polled status if available, otherwise fall back to device status
  const currentStatus = deviceStatus?.status || device.status;
  const isReady = currentStatus === 'ready';
  const isConnecting = isInitializing || initializeMutation.isPending;
  const isDisconnectingState = isDisconnecting || disconnectMutation.isPending;

  return (
    <>
      <Card className="relative overflow-hidden max-w-[400px] ">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              {device.instanceName}
            </CardTitle>
            <StatusBadge status={currentStatus as DeviceStatus} />
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

          <div className="flex items-center gap-2">
            <Badge variant="outline">{device.instanceId}</Badge>
          </div>

          <div className="flex justify-between gap-2 text-sm text-muted-foreground">
            <div><span className="font-bold">Created:</span> {new Date(device.createdAt).toLocaleDateString()}</div>
            {device.connectedAt && (
              <div className="col-span-2">
                <span className="font-bold">Connected:</span> {new Date(device.connectedAt).toLocaleDateString()}
              </div>
            )}
          </div>
          <div>Messages: {device.messagesSent}</div>

          <div className="space-y-3">
            {/* Primary Action Button */}
            <div className="w-full">
              {isReady ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={isDisconnectingState}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {isDisconnectingState ? 'Disconnecting...' : 'Connected'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleShowQR}
                    className="flex-none"
                    disabled={isDisconnectingState}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={isConnecting || isDisconnectingState}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      {initializeMutation.isPending ? 'Initializing...' : 'Connecting...'}
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Connect Device
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Secondary Action Buttons */}
            <div className="flex gap-2">
              {!isReady && currentStatus !== 'not_initialized' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShowQR}
                  className="flex-1"
                  disabled={isDisconnectingState}
                >
                  <QrCode className="h-4 w-4 mr-1" />
                  Show QR
                </Button>
              )}

              {(device.isActive || isReady) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isDisconnectingState}
                  className="flex-1"
                >
                  {isDisconnectingState ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Power className="h-4 w-4 mr-1" />
                  )}
                  {isDisconnectingState ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="flex-1" disabled={isDisconnectingState}>
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