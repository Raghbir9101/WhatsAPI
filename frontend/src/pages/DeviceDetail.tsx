import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QrCode, Power, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { StatusBadge, DeviceStatus } from '@/components/ui/status-badge';
import { Link } from 'react-router-dom';

export function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: device, isLoading } = useQuery({
    queryKey: ['number', id],
    queryFn: () => apiClient.getNumber(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 bg-muted rounded-2xl animate-pulse"></div>
          <div className="h-96 bg-muted rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!device) {
    return <Navigate to="/link-device" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/link-device">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{device.instanceName}</h1>
          <p className="text-muted-foreground">Device details and management</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Device Information
              <StatusBadge status={device.status as DeviceStatus} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{device.instanceName}</p>
              </div>
              
              {device.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{device.description}</p>
                </div>
              )}
              
              {device.phoneNumber && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                  <Badge variant="outline">{device.phoneNumber}</Badge>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Messages Sent</label>
                  <p className="text-lg font-semibold">{device.messagesSent}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm capitalize">{device.status}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <label className="font-medium">Created</label>
                  <p>{new Date(device.createdAt).toLocaleDateString()}</p>
                </div>
                {device.connectedAt && (
                  <div>
                    <label className="font-medium">Connected</label>
                    <p>{new Date(device.connectedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(device.status === 'new' || device.status === 'disconnected') && (
              <Button className="w-full">
                <Power className="h-4 w-4 mr-2" />
                Initialize Device
              </Button>
            )}
            
            {device.status === 'qr_ready' && (
              <Button className="w-full">
                <QrCode className="h-4 w-4 mr-2" />
                Show QR Code
              </Button>
            )}
            
            <Button variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            
            {device.isActive && (
              <Button variant="outline" className="w-full">
                <Power className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            )}
            
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Device
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Device created</p>
                <p className="text-muted-foreground">{new Date(device.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            {device.connectedAt && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Device connected</p>
                  <p className="text-muted-foreground">{new Date(device.connectedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
            
            {device.disconnectedAt && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Device disconnected</p>
                  <p className="text-muted-foreground">{new Date(device.disconnectedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}