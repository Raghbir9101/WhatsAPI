import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, FileText, Upload, Image, Calendar } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { TemplateMessaging } from '@/components/messaging/TemplateMessaging';
import { TemplateWithVars } from '@/components/messaging/TemplateWithVars';
import { CSVBulkMessaging } from '@/components/messaging/CSVBulkMessaging';

export function Messages() {
  const [selectedInstance, setSelectedInstance] = useState('');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  
  // Send Media File states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaFileInstance, setMediaFileInstance] = useState('');
  const [mediaFileRecipient, setMediaFileRecipient] = useState('');
  const [mediaFileCaption, setMediaFileCaption] = useState('');
  
  // Send from URL states
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaUrlInstance, setMediaUrlInstance] = useState('');
  const [mediaUrlRecipient, setMediaUrlRecipient] = useState('');
  const [mediaUrlCaption, setMediaUrlCaption] = useState('');

  const { data: numbers } = useQuery({
    queryKey: ['numbers'],
    queryFn: () => apiClient.getNumbers(),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { instanceId: string; to: string; message: string }) =>
      apiClient.sendMessage(data),
    onSuccess: () => {
      toast({
        title: 'Message sent successfully',
        description: 'Your message has been delivered',
      });
      setRecipient('');
      setMessage('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send message',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const sendMediaMutation = useMutation({
    mutationFn: (formData: FormData) => apiClient.sendMedia(formData),
    onSuccess: () => {
      toast({
        title: 'Media sent successfully',
        description: 'Your media has been delivered',
      });
      setSelectedFile(null);
      setMediaFileCaption('');
      setMediaFileRecipient('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send media',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const sendMediaUrlMutation = useMutation({
    mutationFn: (data: { instanceId: string; to: string; mediaUrl: string; caption?: string }) =>
      apiClient.sendMediaUrl(data),
    onSuccess: () => {
      toast({
        title: 'Media sent successfully',
        description: 'Your media has been delivered',
      });
      setMediaUrl('');
      setMediaUrlCaption('');
      setMediaUrlRecipient('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send media',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstance || !recipient || !message) return;
    
    sendMessageMutation.mutate({
      instanceId: selectedInstance,
      to: recipient,
      message,
    });
  };

  const handleSendMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFileInstance || !mediaFileRecipient || !selectedFile) return;
    
    const formData = new FormData();
    formData.append('instanceId', mediaFileInstance);
    formData.append('to', mediaFileRecipient);
    formData.append('media', selectedFile);
    if (mediaFileCaption) {
      formData.append('caption', mediaFileCaption);
    }
    
    sendMediaMutation.mutate(formData);
  };

  const handleSendMediaUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrlInstance || !mediaUrlRecipient || !mediaUrl) return;
    
    sendMediaUrlMutation.mutate({
      instanceId: mediaUrlInstance,
      to: mediaUrlRecipient,
      mediaUrl: mediaUrl,
      caption: mediaUrlCaption || undefined,
    });
  };

  const readyDevices = numbers?.numbers?.filter(n => n.status === 'ready') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground">Send messages through your WhatsApp devices</p>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="template-vars">Template + Vars</TabsTrigger>
          <TabsTrigger value="extractor">Extractor</TabsTrigger>
          <TabsTrigger value="bulk">CSV Bulk</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Send Basic Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <Label htmlFor="device">Select Device</Label>
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
                  <Label htmlFor="recipient">Recipient Phone Number</Label>
                  <Input
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter phone number with country code"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={sendMessageMutation.isPending || !selectedInstance || !recipient || !message}
                  className="w-full"
                >
                  {sendMessageMutation.isPending ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Send Media File */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Send Media File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendMedia} className="space-y-4">
                  <div>
                    <Label htmlFor="media-device">Select Device</Label>
                    <Select value={mediaFileInstance} onValueChange={setMediaFileInstance}>
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
                    <Label htmlFor="media-recipient">Recipient Phone Number</Label>
                    <Input
                      id="media-recipient"
                      value={mediaFileRecipient}
                      onChange={(e) => setMediaFileRecipient(e.target.value)}
                      placeholder="Enter phone number with country code"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="media-file">Media File</Label>
                    <Input
                      id="media-file"
                      type="file"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="media-caption">Caption (Optional)</Label>
                    <Textarea
                      id="media-caption"
                      value={mediaFileCaption}
                      onChange={(e) => setMediaFileCaption(e.target.value)}
                      placeholder="Add a caption to your media..."
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sendMediaMutation.isPending || !mediaFileInstance || !mediaFileRecipient || !selectedFile}
                    className="w-full"
                  >
                    {sendMediaMutation.isPending ? (
                      'Sending...'
                    ) : (
                      <>
                        <Image className="h-4 w-4 mr-2" />
                        Send Media
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Send from URL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Send from URL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendMediaUrl} className="space-y-4">
                  <div>
                    <Label htmlFor="url-device">Select Device</Label>
                    <Select value={mediaUrlInstance} onValueChange={setMediaUrlInstance}>
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
                    <Label htmlFor="url-recipient">Recipient Phone Number</Label>
                    <Input
                      id="url-recipient"
                      value={mediaUrlRecipient}
                      onChange={(e) => setMediaUrlRecipient(e.target.value)}
                      placeholder="Enter phone number with country code"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="media-url">Media URL</Label>
                    <Input
                      id="media-url"
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="url-caption">Caption (Optional)</Label>
                    <Textarea
                      id="url-caption"
                      value={mediaUrlCaption}
                      onChange={(e) => setMediaUrlCaption(e.target.value)}
                      placeholder="Add a caption to your media..."
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sendMediaUrlMutation.isPending || !mediaUrlInstance || !mediaUrlRecipient || !mediaUrl}
                    className="w-full"
                  >
                    {sendMediaUrlMutation.isPending ? (
                      'Sending...'
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Send from URL
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="template">
          <div className="space-y-6">
            <TemplateMessaging />
          </div>
        </TabsContent>

        <TabsContent value="template-vars">
          <div className="space-y-6">
            <TemplateWithVars />
          </div>
        </TabsContent>

        <TabsContent value="extractor">
          <Card>
            <CardHeader>
              <CardTitle>Message Extractor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Message Search & Extraction</p>
                <p className="text-muted-foreground mb-4">
                  View, search, and extract messages from your conversation history
                </p>
                <Button asChild>
                  <a href="/message-history">
                    Go to Message History
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <div className="space-y-6">
            <CSVBulkMessaging />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}