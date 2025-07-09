import React, { useState } from 'react';
import { Plus, QrCode, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { DeviceCard } from '@/components/devices/device-card';
import { QRCodeDisplay } from '@/components/devices/qr-code-display';

export function LinkDevice() {
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedDeviceForQR, setSelectedDeviceForQR] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: numbers, isLoading } = useQuery({
    queryKey: ['numbers'],
    queryFn: () => apiClient.getNumbers(),
  });

  const addDeviceMutation = useMutation({
    mutationFn: (data: { instanceName: string; description?: string }) =>
      apiClient.addNumber(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numbers'] });
      setIsAddingDevice(false);
      setInstanceName('');
      setDescription('');
      toast({
        title: 'Device added successfully',
        description: 'You can now initialize your WhatsApp device',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add device',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

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

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceName.trim()) return;
    
    addDeviceMutation.mutate({
      instanceName: instanceName.trim(),
      description: description.trim() || undefined,
    });
  };

  const handleGetQRCode = (deviceId: string) => {
    setSelectedDeviceForQR(deviceId);
    setShowQRDialog(true);
  };

  const handleConnectDevice = (deviceId: string) => {
    initializeMutation.mutate(deviceId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Link Device</h1>
          <p className="text-muted-foreground">
            Manage your WhatsApp devices and their connections
          </p>
        </div>
        
        <Dialog open={isAddingDevice} onOpenChange={setIsAddingDevice}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New WhatsApp Device</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <Label htmlFor="instanceName">Device Name</Label>
                <Input
                  id="instanceName"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="e.g., Sales Team, Support Bot"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this device's purpose"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingDevice(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addDeviceMutation.isPending || !instanceName.trim()}
                  className="flex-1"
                >
                  {addDeviceMutation.isPending ? 'Adding...' : 'Add Device'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {numbers?.numbers?.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No devices yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first WhatsApp device to get started with messaging
            </p>
            <Button onClick={() => setIsAddingDevice(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Device
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {numbers?.numbers?.map((device) => (
            <DeviceCard key={device.instanceId} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}