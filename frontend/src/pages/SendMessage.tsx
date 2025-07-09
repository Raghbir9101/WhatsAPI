import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Upload, 
  Link as LinkIcon, 
  MessageSquare, 
  Image as ImageIcon,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { apiClient, WhatsAppInstance } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const SendMessage: React.FC = () => {
  const [numbers, setNumbers] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const [textMessage, setTextMessage] = useState({
    instanceId: '',
    to: '',
    message: '',
  });

  const [mediaMessage, setMediaMessage] = useState({
    instanceId: '',
    to: '',
    caption: '',
    file: null as File | null,
  });

  const [urlMessage, setUrlMessage] = useState({
    instanceId: '',
    to: '',
    mediaUrl: '',
    caption: '',
  });

  useEffect(() => {
    fetchNumbers();
  }, []);

  const fetchNumbers = async () => {
    try {
      const response = await apiClient.getNumbers();
      // Only show ready numbers
      const readyNumbers = response.numbers.filter(n => n.status === 'ready');
      setNumbers(readyNumbers);
    } catch (error) {
      toast({
        title: 'Failed to load numbers',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await apiClient.sendMessage(textMessage);
      toast({
        title: 'Message sent successfully!',
        description: `Message sent to ${textMessage.to}`,
      });
      setTextMessage({ ...textMessage, message: '' });
    } catch (error) {
      toast({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaMessage.file) return;

    setSending(true);

    try {
      const formData = new FormData();
      formData.append('instanceId', mediaMessage.instanceId);
      formData.append('to', mediaMessage.to);
      formData.append('caption', mediaMessage.caption);
      formData.append('media', mediaMessage.file);

      await apiClient.sendMedia(formData);
      toast({
        title: 'Media sent successfully!',
        description: `Media sent to ${mediaMessage.to}`,
      });
      setMediaMessage({ ...mediaMessage, caption: '', file: null });
      // Reset file input
      const fileInput = document.getElementById('media-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast({
        title: 'Failed to send media',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      await apiClient.sendMediaUrl(urlMessage);
      toast({
        title: 'Media sent successfully!',
        description: `Media sent to ${urlMessage.to}`,
      });
      setUrlMessage({ ...urlMessage, mediaUrl: '', caption: '' });
    } catch (error) {
      toast({
        title: 'Failed to send media',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10 && !cleaned.startsWith('91')) {
      return '91' + cleaned;
    }
    
    return cleaned;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green mx-auto mb-4"></div>
          <p className="text-whatsapp-gray">Loading WhatsApp numbers...</p>
        </div>
      </div>
    );
  }

  if (numbers.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-whatsapp-dark">Send Message</h1>
          <p className="text-whatsapp-gray">Send messages via WhatsApp</p>
        </div>
        
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-whatsapp-dark mb-2">
              No Connected Numbers
            </h3>
            <p className="text-whatsapp-gray mb-6">
              You need at least one connected WhatsApp number to send messages.
            </p>
            <Button 
              onClick={() => window.location.href = '/numbers'}
              className="bg-whatsapp-green hover:bg-whatsapp-green-hover"
            >
              Connect WhatsApp Number
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-whatsapp-dark">Send Message</h1>
        <p className="text-whatsapp-gray">
          Send text messages, images, and files via WhatsApp
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-whatsapp-green" />
            WhatsApp Messaging
          </CardTitle>
          <CardDescription>
            Choose your message type and send to any WhatsApp number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Text Message
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Media
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Media URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <form onSubmit={handleSendText} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-instance">WhatsApp Number</Label>
                    <Select
                      value={textMessage.instanceId}
                      onValueChange={(value) => setTextMessage({ ...textMessage, instanceId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select WhatsApp number" />
                      </SelectTrigger>
                      <SelectContent>
                        {numbers.map((number) => (
                          <SelectItem key={number.instanceId} value={number.instanceId}>
                            {number.instanceName} ({number.phoneNumber ? `+${number.phoneNumber}` : 'No phone'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="text-to">Recipient Phone Number</Label>
                    <Input
                      id="text-to"
                      type="tel"
                      placeholder="e.g., 919876543210 or 9876543210"
                      value={textMessage.to}
                      onChange={(e) => setTextMessage({ ...textMessage, to: e.target.value })}
                      required
                    />
                    <p className="text-xs text-whatsapp-gray">
                      Include country code (e.g., 91 for India) or just enter 10-digit number
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text-message">Message</Label>
                  <Textarea
                    id="text-message"
                    placeholder="Type your message here..."
                    value={textMessage.message}
                    onChange={(e) => setTextMessage({ ...textMessage, message: e.target.value })}
                    rows={4}
                    required
                  />
                  <p className="text-xs text-whatsapp-gray">
                    {textMessage.message.length}/4096 characters
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="bg-whatsapp-green hover:bg-whatsapp-green-hover"
                  disabled={sending || !textMessage.instanceId || !textMessage.to || !textMessage.message}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <form onSubmit={handleSendMedia} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="media-instance">WhatsApp Number</Label>
                    <Select
                      value={mediaMessage.instanceId}
                      onValueChange={(value) => setMediaMessage({ ...mediaMessage, instanceId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select WhatsApp number" />
                      </SelectTrigger>
                      <SelectContent>
                        {numbers.map((number) => (
                          <SelectItem key={number.instanceId} value={number.instanceId}>
                            {number.instanceName} ({number.phoneNumber ? `+${number.phoneNumber}` : 'No phone'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="media-to">Recipient Phone Number</Label>
                    <Input
                      id="media-to"
                      type="tel"
                      placeholder="e.g., 919876543210 or 9876543210"
                      value={mediaMessage.to}
                      onChange={(e) => setMediaMessage({ ...mediaMessage, to: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-file">Media File</Label>
                  <Input
                    id="media-file"
                    type="file"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                    onChange={(e) => setMediaMessage({ ...mediaMessage, file: e.target.files?.[0] || null })}
                    required
                  />
                  <p className="text-xs text-whatsapp-gray">
                    Supported formats: Images, Videos, Audio, PDF, DOC, DOCX (max 10MB)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-caption">Caption (Optional)</Label>
                  <Textarea
                    id="media-caption"
                    placeholder="Add a caption to your media..."
                    value={mediaMessage.caption}
                    onChange={(e) => setMediaMessage({ ...mediaMessage, caption: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-whatsapp-green hover:bg-whatsapp-green-hover"
                  disabled={sending || !mediaMessage.instanceId || !mediaMessage.to || !mediaMessage.file}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Send Media
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <form onSubmit={handleSendUrl} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="url-instance">WhatsApp Number</Label>
                    <Select
                      value={urlMessage.instanceId}
                      onValueChange={(value) => setUrlMessage({ ...urlMessage, instanceId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select WhatsApp number" />
                      </SelectTrigger>
                      <SelectContent>
                        {numbers.map((number) => (
                          <SelectItem key={number.instanceId} value={number.instanceId}>
                            {number.instanceName} ({number.phoneNumber ? `+${number.phoneNumber}` : 'No phone'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url-to">Recipient Phone Number</Label>
                    <Input
                      id="url-to"
                      type="tel"
                      placeholder="e.g., 919876543210 or 9876543210"
                      value={urlMessage.to}
                      onChange={(e) => setUrlMessage({ ...urlMessage, to: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url-media">Media URL</Label>
                  <Input
                    id="url-media"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={urlMessage.mediaUrl}
                    onChange={(e) => setUrlMessage({ ...urlMessage, mediaUrl: e.target.value })}
                    required
                  />
                  <p className="text-xs text-whatsapp-gray">
                    Enter a direct URL to an image, video, or audio file
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url-caption">Caption (Optional)</Label>
                  <Textarea
                    id="url-caption"
                    placeholder="Add a caption to your media..."
                    value={urlMessage.caption}
                    onChange={(e) => setUrlMessage({ ...urlMessage, caption: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-whatsapp-green hover:bg-whatsapp-green-hover"
                  disabled={sending || !urlMessage.instanceId || !urlMessage.to || !urlMessage.mediaUrl}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Send Media
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-info" />
            Tips for Better Messaging
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-whatsapp-gray">
            <div>
              <h4 className="font-medium text-whatsapp-dark mb-2">Phone Numbers</h4>
              <ul className="space-y-1">
                <li>• Include country code (e.g., 91 for India)</li>
                <li>• Remove spaces, dashes, and special characters</li>
                <li>• Example: 919876543210 for Indian numbers</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-whatsapp-dark mb-2">Media Files</h4>
              <ul className="space-y-1">
                <li>• Maximum file size: 10MB</li>
                <li>• Supported: Images, Videos, Audio, PDF, DOC</li>
                <li>• Use direct URLs for media from URL</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};