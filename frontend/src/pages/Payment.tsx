import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Zap } from 'lucide-react';

export function Payment() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment & Plans</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="relative">
          <Badge className="absolute top-4 right-4" variant="secondary">
            Current Plan
          </Badge>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Starter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">$29<span className="text-lg font-normal">/month</span></div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                1,000 messages/month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                3 WhatsApp devices
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                Basic support
              </li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          </CardContent>
        </Card>

        <Card className="relative border-primary">
          <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
            Recommended
          </Badge>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Professional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">$99<span className="text-lg font-normal">/month</span></div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                10,000 messages/month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                Unlimited devices
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                Priority support
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                Advanced analytics
              </li>
            </ul>
            <Button className="w-full">
              Upgrade Now
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Enterprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">Custom</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                Unlimited messages
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                Unlimited devices
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                24/7 support
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                Custom integrations
              </li>
            </ul>
            <Button variant="outline" className="w-full">
              Contact Sales
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No billing history available
          </div>
        </CardContent>
      </Card>
    </div>
  );
}