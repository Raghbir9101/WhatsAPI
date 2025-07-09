import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Plus, Send, Edit, Trash2, Search } from 'lucide-react';
import { apiClient, MessageTemplate } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export function TemplateMessaging() {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstance, setSelectedInstance] = useState('');
  const [recipient, setRecipient] = useState('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  const queryClient = useQueryClient();

  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    description: '',
    category: 'general'
  });

  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', searchQuery],
    queryFn: () => apiClient.getTemplates({ search: searchQuery || undefined }),
  });

  const { data: numbersData } = useQuery({
    queryKey: ['numbers'],
    queryFn: () => apiClient.getNumbers(),
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => apiClient.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsCreateDialogOpen(false);
      setNewTemplate({ name: '', content: '', description: '', category: 'general' });
      toast({
        title: 'Template created successfully',
        description: 'Your template has been saved',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: (data: { id: string; template: any }) => 
      apiClient.updateTemplate(data.id, data.template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      toast({
        title: 'Template updated successfully',
        description: 'Your template has been updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => apiClient.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      if (selectedTemplate?._id === arguments[0]) {
        setSelectedTemplate(null);
      }
      toast({
        title: 'Template deleted successfully',
        description: 'The template has been removed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const sendTemplateMutation = useMutation({
    mutationFn: (data: any) => apiClient.sendTemplate(data),
    onSuccess: () => {
      toast({
        title: 'Message sent successfully',
        description: 'Your template message has been delivered',
      });
      setRecipient('');
      setTemplateVariables({});
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map(match => match.replace(/\{\{|\}\}/g, '')) : [];
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    createTemplateMutation.mutate(newTemplate);
  };

  const handleUpdateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateTemplateMutation.mutate({
        id: editingTemplate._id,
        template: editingTemplate
      });
    }
  };

  const handleSendTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !selectedInstance || !recipient) return;

    sendTemplateMutation.mutate({
      instanceId: selectedInstance,
      to: recipient,
      templateId: selectedTemplate._id,
      variables: templateVariables
    });
  };

  const handleSelectTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    // Initialize variables
    const variables: Record<string, string> = {};
    template.variables.forEach(variable => {
      variables[variable.name] = variable.defaultValue;
    });
    setTemplateVariables(variables);
  };

  const previewMessage = () => {
    if (!selectedTemplate) return '';
    let preview = selectedTemplate.content;
    Object.entries(templateVariables).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
    });
    return preview;
  };

  const readyDevices = numbersData?.numbers?.filter(n => n.status === 'ready') || [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Template Library */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template Library
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="Enter template name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-content">Message Content</Label>
                    <Textarea
                      id="template-content"
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                      placeholder="Enter your message. Use {{variable}} for placeholders"
                      rows={4}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {"{{variable}}"} for dynamic content
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="template-description">Description (optional)</Label>
                    <Input
                      id="template-description"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                      placeholder="Template description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-category">Category</Label>
                    <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createTemplateMutation.isPending}>
                      {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Templates List */}
            {templatesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 border rounded-lg animate-pulse">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : templatesData?.templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No templates found</p>
                <p className="text-sm text-muted-foreground">Create your first template to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {templatesData?.templates.map((template) => (
                  <div
                    key={template._id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?._id === template._id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description || template.content}
                        </p>
                        {template.variables.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {template.variables.map((variable) => (
                              <Badge key={variable.name} variant="outline" className="text-xs">
                                {variable.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplate(template);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplateMutation.mutate(template._id);
                          }}
                          disabled={deleteTemplateMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Send Template Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Template Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedTemplate ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a template to get started</p>
            </div>
          ) : (
            <form onSubmit={handleSendTemplate} className="space-y-4">
              <div>
                <Label htmlFor="template-device">Select Device</Label>
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

              <div>
                <Label htmlFor="template-recipient">Recipient Phone Number</Label>
                <Input
                  id="template-recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Enter phone number with country code"
                  required
                />
              </div>

              {/* Template Variables */}
              {selectedTemplate.variables.length > 0 && (
                <div className="space-y-3">
                  <Label>Template Variables</Label>
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable.name}>
                      <Label htmlFor={`var-${variable.name}`}>
                        {variable.name}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id={`var-${variable.name}`}
                        value={templateVariables[variable.name] || ''}
                        onChange={(e) =>
                          setTemplateVariables({
                            ...templateVariables,
                            [variable.name]: e.target.value,
                          })
                        }
                        placeholder={`Enter ${variable.name}`}
                        required={variable.required}
                      />
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Message Preview */}
              <div>
                <Label>Message Preview</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{previewMessage()}</p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={sendTemplateMutation.isPending || !selectedInstance || !recipient}
                className="w-full"
              >
                {sendTemplateMutation.isPending ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Template Message
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <form onSubmit={handleUpdateTemplate} className="space-y-4">
              <div>
                <Label htmlFor="edit-template-name">Template Name</Label>
                <Input
                  id="edit-template-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-template-content">Message Content</Label>
                <Textarea
                  id="edit-template-content"
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-template-description">Description</Label>
                <Input
                  id="edit-template-description"
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-template-category">Category</Label>
                <Select value={editingTemplate.category} onValueChange={(value) => setEditingTemplate({ ...editingTemplate, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateTemplateMutation.isPending}>
                  {updateTemplateMutation.isPending ? 'Updating...' : 'Update Template'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 