import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Settings, Bell, Mail, Database, Shield, Globe } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { toast } from '@/hooks/use-toast';
import { formatNumber } from '@/lib/utils';

export function AdminSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ceo-black">Admin Settings</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure global system settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input
                id="platform-name"
                defaultValue="CEOITBOX WhatsApp Connector"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                defaultValue="support@ceoitbox.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-instances">Max WhatsApp Instances per User</Label>
              <Input
                id="max-instances"
                type="number"
                defaultValue="10"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              <Switch id="maintenance-mode" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure admin notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-alerts">Email Alerts</Label>
              <Switch id="email-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="client-expiry">Client Expiry Notifications</Label>
              <Switch id="client-expiry" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="low-credits">Low Credits Alerts</Label>
              <Switch id="low-credits" defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-email">Alert Email Recipients</Label>
              <Textarea
                id="alert-email"
                placeholder="admin@ceoitbox.com, alerts@ceoitbox.com"
                defaultValue="admin@ceoitbox.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Configure SMTP settings for email notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input
                id="smtp-host"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  placeholder="587"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-encryption">Encryption</Label>
                <Input
                  id="smtp-encryption"
                  placeholder="TLS"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-username">Username</Label>
              <Input
                id="smtp-username"
                type="email"
                placeholder="noreply@ceoitbox.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">Password</Label>
              <Input
                id="smtp-password"
                type="password"
                placeholder="••••••••"
              />
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database
            </CardTitle>
            <CardDescription>
              Database configuration and maintenance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Database Status</Label>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Connected</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Last Backup</Label>
              <div className="text-sm text-muted-foreground">
                July 9, 2024 at 3:00 AM
              </div>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Create Backup
              </Button>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Optimize Database
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Security and access control settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="two-factor">Two-Factor Authentication</Label>
              <Switch id="two-factor" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ip-restriction">IP Restriction</Label>
              <Switch id="ip-restriction" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                defaultValue="60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowed-ips">Allowed IP Addresses</Label>
              <Textarea
                id="allowed-ips"
                placeholder="192.168.1.1, 10.0.0.1"
              />
            </div>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              API rate limiting and access settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rate-limit">Rate Limit (requests per minute)</Label>
              <Input
                id="rate-limit"
                type="number"
                defaultValue="200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-timeout">API Timeout (seconds)</Label>
              <Input
                id="api-timeout"
                type="number"
                defaultValue="30"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="api-logging">API Request Logging</Label>
              <Switch id="api-logging" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="cors-enabled">CORS Enabled</Label>
              <Switch id="cors-enabled" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}