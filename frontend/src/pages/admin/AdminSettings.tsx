import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Settings, Bell, Mail, Database, Shield, Globe, Package as PackageIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { adminApi, type Package } from '@/lib/admin-api';
import { toast } from '@/hooks/use-toast';
import { formatNumber } from '@/lib/utils';

export function AdminSettings() {
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    credits: '',
    price: '',
    validityDays: '',
    features: ['']
  });

  const queryClient = useQueryClient();

  const { data: packages = [] } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: adminApi.getPackages,
  });

  const resetForm = () => {
    setPackageForm({
      name: '',
      credits: '',
      price: '',
      validityDays: '',
      features: ['']
    });
    setEditingPackage(null);
  };

  const openAddDialog = () => {
    resetForm();
    setPackageDialogOpen(true);
  };

  const openEditDialog = (pkg: Package) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      credits: pkg.credits.toString(),
      price: pkg.price.toString(),
      validityDays: pkg.validityDays.toString(),
      features: [...pkg.features]
    });
    setPackageDialogOpen(true);
  };

  const openDeleteDialog = (pkg: Package) => {
    setPackageToDelete(pkg);
    setDeleteDialogOpen(true);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...packageForm.features];
    newFeatures[index] = value;
    setPackageForm({ ...packageForm, features: newFeatures });
  };

  const addFeature = () => {
    setPackageForm({ ...packageForm, features: [...packageForm.features, ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = packageForm.features.filter((_, i) => i !== index);
    setPackageForm({ ...packageForm, features: newFeatures });
  };

  const packageSaveMutation = useMutation({
    mutationFn: (data: any) => 
      editingPackage 
        ? adminApi.updatePackage(editingPackage.id, data)
        : adminApi.createPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] });
      toast({ 
        title: 'Success', 
        description: `Package ${editingPackage ? 'updated' : 'created'} successfully` 
      });
      setPackageDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: 'Failed to save package',
        variant: 'destructive'
      });
    }
  });

  const packageDeleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] });
      toast({ 
        title: 'Success', 
        description: 'Package deleted successfully' 
      });
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete package',
        variant: 'destructive'
      });
    }
  });

  const handleSavePackage = () => {
    const packageData = {
      name: packageForm.name,
      credits: parseInt(packageForm.credits),
      price: parseFloat(packageForm.price),
      validityDays: parseInt(packageForm.validityDays),
      features: packageForm.features.filter(f => f.trim() !== '')
    };

    packageSaveMutation.mutate(packageData);
  };

  const handleDeletePackage = () => {
    if (packageToDelete) {
      packageDeleteMutation.mutate(packageToDelete.id);
    }
  };

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

        {/* Package Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageIcon className="h-5 w-5" />
                <div>
                  <CardTitle>Package Management</CardTitle>
                  <CardDescription>Manage subscription packages and pricing</CardDescription>
                </div>
              </div>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package Name</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{formatNumber(pkg.credits)}</TableCell>
                    <TableCell>${pkg.price}</TableCell>
                    <TableCell>{pkg.validityDays} days</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {pkg.features.slice(0, 2).join(', ')}
                        {pkg.features.length > 2 && ` +${pkg.features.length - 2} more`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(pkg)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(pkg)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="bg-ceo-green hover:bg-ceo-green-dark">
          Save All Settings
        </Button>
      </div>

      {/* Package Dialog */}
      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Package' : 'Add New Package'}
            </DialogTitle>
            <DialogDescription>
              {editingPackage ? 'Update package details' : 'Create a new subscription package'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pkg-name">Package Name</Label>
                <Input
                  id="pkg-name"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  placeholder="e.g., PREMIUM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-credits">Credits</Label>
                <Input
                  id="pkg-credits"
                  type="number"
                  value={packageForm.credits}
                  onChange={(e) => setPackageForm({ ...packageForm, credits: e.target.value })}
                  placeholder="10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-price">Price ($)</Label>
                <Input
                  id="pkg-price"
                  type="number"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                  placeholder="199"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-validity">Validity (Days)</Label>
                <Input
                  id="pkg-validity"
                  type="number"
                  value={packageForm.validityDays}
                  onChange={(e) => setPackageForm({ ...packageForm, validityDays: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Features</Label>
              {packageForm.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder="Enter feature"
                  />
                  {packageForm.features.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeFeature(index)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addFeature}
                type="button"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPackageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePackage}>
              {editingPackage ? 'Update Package' : 'Create Package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Package Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the <strong>{packageToDelete?.name}</strong> package?
              <br /><br />
              This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Permanently remove this package</li>
                <li>Affect clients currently using this package</li>
                <li>Cannot be undone</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePackage}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Delete Package
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}