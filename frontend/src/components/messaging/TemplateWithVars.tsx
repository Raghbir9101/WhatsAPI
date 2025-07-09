import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Send, Trash2, Variable } from 'lucide-react';
import { apiClient, MessageTemplate } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Recipient {
  id: string;
  phoneNumber: string;
  name: string;
  variables: Record<string, string>;
}

export function TemplateWithVars() {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newRecipient, setNewRecipient] = useState({
    phoneNumber: '',
    name: '',
    variables: {} as Record<string, string>
  });

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.getTemplates(),
  });

  const { data: numbersData } = useQuery({
    queryKey: ['numbers'],
    queryFn: () => apiClient.getNumbers(),
  });

  const sendBulkTemplateMutation = useMutation({
    mutationFn: async (data: { instanceId: string; templateId: string; recipients: Recipient[] }) => {
      const results = [];
      for (const recipient of data.recipients) {
        try {
          const result = await apiClient.sendTemplate({
            instanceId: data.instanceId,
            to: recipient.phoneNumber,
            templateId: data.templateId,
            variables: recipient.variables
          });
          results.push({ ...result, recipient: recipient.name || recipient.phoneNumber, success: true });
        } catch (error: any) {
          results.push({ 
            recipient: recipient.name || recipient.phoneNumber, 
            success: false, 
            error: error.message 
          });
        }
        // Add delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      toast({
        title: 'Bulk messages sent',
        description: `${successful} messages sent successfully, ${failed} failed`,
      });
      
      // Clear recipients after successful send
      setRecipients([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send bulk messages',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSelectTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    // Reset recipients when template changes
    setRecipients([]);
    setNewRecipient({
      phoneNumber: '',
      name: '',
      variables: template.variables.reduce((acc, variable) => {
        acc[variable.name] = variable.defaultValue;
        return acc;
      }, {} as Record<string, string>)
    });
  };

  const addRecipient = () => {
    if (!newRecipient.phoneNumber) return;
    
    const recipient: Recipient = {
      id: Date.now().toString(),
      phoneNumber: newRecipient.phoneNumber,
      name: newRecipient.name,
      variables: { ...newRecipient.variables }
    };
    
    setRecipients([...recipients, recipient]);
    setNewRecipient({
      phoneNumber: '',
      name: '',
      variables: selectedTemplate?.variables.reduce((acc, variable) => {
        acc[variable.name] = variable.defaultValue;
        return acc;
      }, {} as Record<string, string>) || {}
    });
  };

  const removeRecipient = (id: string) => {
    setRecipients(recipients.filter(r => r.id !== id));
  };

  const updateRecipientVariable = (recipientId: string, variableName: string, value: string) => {
    setRecipients(recipients.map(r => 
      r.id === recipientId 
        ? { ...r, variables: { ...r.variables, [variableName]: value } }
        : r
    ));
  };

  const generatePreview = (recipient: Recipient): string => {
    if (!selectedTemplate) return '';
    let preview = selectedTemplate.content;
    Object.entries(recipient.variables).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
    });
    return preview;
  };

  const handleSendBulk = () => {
    if (!selectedTemplate || !selectedInstance || recipients.length === 0) return;
    
    sendBulkTemplateMutation.mutate({
      instanceId: selectedInstance,
      templateId: selectedTemplate._id,
      recipients
    });
  };

  const readyDevices = numbersData?.numbers?.filter(n => n.status === 'ready') || [];

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Variable className="h-5 w-5" />
            Template with Variables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-select">Select Template</Label>
              <Select onValueChange={(value) => {
                const template = templatesData?.templates.find(t => t._id === value);
                if (template) handleSelectTemplate(template);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templatesData?.templates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      <div className="flex items-center gap-2">
                        <span>{template.name}</span>
                        {template.variables.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {template.variables.length} vars
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div>
                <Label>Template Content</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{selectedTemplate.content}</p>
                </div>
                {selectedTemplate.variables.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {selectedTemplate.variables.map((variable) => (
                      <Badge key={variable.name} variant="outline">
                        {variable.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="bulk-device">Select Device</Label>
              <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a WhatsApp device" />
                </SelectTrigger>
                <SelectContent>
                  {readyDevices.map((device) => (
                    <SelectItem key={device.instanceId} value={device.instanceId}>
                      {device.instanceName} ({device.phoneNumber || 'Not connected'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Recipients */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Add Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="new-phone">Phone Number</Label>
                <Input
                  id="new-phone"
                  value={newRecipient.phoneNumber}
                  onChange={(e) => setNewRecipient({ ...newRecipient, phoneNumber: e.target.value })}
                  placeholder="Enter phone number with country code"
                />
              </div>
              <div>
                <Label htmlFor="new-name">Name (optional)</Label>
                <Input
                  id="new-name"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  placeholder="Recipient name"
                />
              </div>
            </div>

            {/* Variables for new recipient */}
            {selectedTemplate.variables.length > 0 && (
              <div className="mt-4 space-y-3">
                <Label>Variables for this recipient</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable.name}>
                      <Label htmlFor={`new-${variable.name}`}>
                        {variable.name}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id={`new-${variable.name}`}
                        value={newRecipient.variables[variable.name] || ''}
                        onChange={(e) => setNewRecipient({
                          ...newRecipient,
                          variables: {
                            ...newRecipient.variables,
                            [variable.name]: e.target.value
                          }
                        })}
                        placeholder={`Enter ${variable.name}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={addRecipient} disabled={!newRecipient.phoneNumber} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Recipient
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recipients List */}
      {recipients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recipients ({recipients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recipients.map((recipient) => (
                <div key={recipient.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">{recipient.name || 'Unnamed'}</p>
                      <p className="text-sm text-muted-foreground">{recipient.phoneNumber}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRecipient(recipient.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedTemplate && selectedTemplate.variables.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs">Variables</Label>
                      <div className="grid gap-2 md:grid-cols-3">
                        {selectedTemplate.variables.map((variable) => (
                          <div key={variable.name}>
                            <Label htmlFor={`${recipient.id}-${variable.name}`} className="text-xs">
                              {variable.name}
                            </Label>
                            <Input
                              id={`${recipient.id}-${variable.name}`}
                              value={recipient.variables[variable.name] || ''}
                              onChange={(e) => updateRecipientVariable(recipient.id, variable.name, e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator className="my-3" />

                  <div>
                    <Label className="text-xs">Preview</Label>
                    <div className="p-2 bg-muted rounded text-xs">
                      {generatePreview(recipient)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <Button
              onClick={handleSendBulk}
              disabled={sendBulkTemplateMutation.isPending || !selectedInstance || recipients.length === 0}
              className="w-full"
            >
              {sendBulkTemplateMutation.isPending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to {recipients.length} Recipients
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 