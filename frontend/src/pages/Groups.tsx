import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Groups() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Groups & Channels</h1>
          <p className="text-muted-foreground">Manage your WhatsApp groups and broadcast lists</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <Card className="border-dashed border-2">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
          <p className="text-muted-foreground mb-4">
            Create or import WhatsApp groups to manage bulk messaging
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create First Group
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}