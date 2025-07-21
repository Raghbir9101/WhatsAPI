import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Play, 
  MessageSquare, 
  Image, 
  FileText, 
  Webhook, 
  Timer, 
  GitBranch,
  Settings,
  MessageCircle,
  Users
} from 'lucide-react';

export const TriggerNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'text_equals':
      case 'text_contains':
      case 'text_starts_with':
      case 'text_ends_with':
      case 'text_regex':
        return <MessageSquare className="h-4 w-4" />;
      case 'media_received':
        return <Image className="h-4 w-4" />;
      case 'any_message':
        return <Zap className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getTriggerDescription = (config: any) => {
    switch (config.triggerType) {
      case 'text_equals':
        return `Message equals: "${config.text}"`;
      case 'text_contains':
        return `Message contains: "${config.text}"`;
      case 'text_starts_with':
        return `Message starts with: "${config.text}"`;
      case 'text_ends_with':
        return `Message ends with: "${config.text}"`;
      case 'text_regex':
        return `Regex pattern: ${config.pattern}`;
      case 'media_received':
        return `Media received${config.mediaType ? `: ${config.mediaType}` : ''}`;
      case 'any_message':
        return 'Any message received';
      default:
        return 'Trigger';
    }
  };

  return (
    <Card className={`w-64 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-green-100 p-1 rounded">
            {getTriggerIcon(data.config?.triggerType)}
          </div>
          <div>
            <div className="font-medium text-sm">{data.label}</div>
            <Badge variant="secondary" className="text-xs">Trigger</Badge>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          {getTriggerDescription(data.config || {})}
        </div>
      </CardContent>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </Card>
  );
};

export const ActionNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_message':
        return <MessageSquare className="h-4 w-4" />;
      case 'send_image':
        return <Image className="h-4 w-4" />;
      case 'send_document':
        return <FileText className="h-4 w-4" />;
      case 'webhook':
        return <Webhook className="h-4 w-4" />;
      case 'set_variable':
        return <Settings className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getActionDescription = (config: any) => {
    switch (config.actionType) {
      case 'send_message':
        return `Send: "${config.message?.substring(0, 30)}${config.message?.length > 30 ? '...' : ''}"`;
      case 'send_image':
        return `Send image${config.caption ? ': ' + config.caption.substring(0, 20) : ''}`;
      case 'send_document':
        return 'Send document';
      case 'webhook':
        return `Webhook: ${config.webhookUrl}`;
      case 'set_variable':
        return `Set ${config.variableName} = ${config.value}`;
      default:
        return 'Action';
    }
  };

  return (
    <Card className={`w-64 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-blue-100 p-1 rounded">
            {getActionIcon(data.config?.actionType)}
          </div>
          <div>
            <div className="font-medium text-sm">{data.label}</div>
            <Badge variant="secondary" className="text-xs">Action</Badge>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          {getActionDescription(data.config || {})}
        </div>
      </CardContent>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </Card>
  );
};

export const ConditionNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const getConditionDescription = (config: any) => {
    if (!config.variable || !config.operator) return 'Condition';
    return `${config.variable} ${config.operator} ${config.value}`;
  };

  return (
    <Card className={`w-64 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-yellow-100 p-1 rounded">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-sm">{data.label}</div>
            <Badge variant="secondary" className="text-xs">Condition</Badge>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          {getConditionDescription(data.config || {})}
        </div>
      </CardContent>
      <Handle type="source" position={Position.Bottom} id="true" className="w-2 h-2 bg-green-500" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Bottom} id="false" className="w-2 h-2 bg-red-500" style={{ left: '75%' }} />
    </Card>
  );
};

export const DelayNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const getDelayDescription = (config: any) => {
    const duration = config.duration || 1;
    return `Wait ${duration} second${duration === 1 ? '' : 's'}`;
  };

  return (
    <Card className={`w-64 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-purple-100 p-1 rounded">
            <Timer className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-sm">{data.label}</div>
            <Badge variant="secondary" className="text-xs">Delay</Badge>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          {getDelayDescription(data.config || {})}
        </div>
      </CardContent>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </Card>
  );
};

export const ResponseNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const getResponseDescription = (config: any) => {
    if (!config) return 'Ask for response';
    
    if (config.responseType === 'choice' && config.choices?.length > 0) {
      const choiceCount = config.choices.length;
      const firstChoice = config.choices[0]?.label || config.choices[0]?.value;
      return `${choiceCount} choices: ${firstChoice}${choiceCount > 1 ? '...' : ''}`;
    }
    
    const message = config.message || '';
    return `Ask: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`;
  };

  const getResponseTypeIcon = (responseType: string) => {
    switch (responseType) {
      case 'choice':
        return <Users className="h-4 w-4" />;
      case 'text':
      case 'number':
      case 'email':
      case 'phone':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`w-64 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-orange-100 p-1 rounded">
            {getResponseTypeIcon(data.config?.responseType)}
          </div>
          <div>
            <div className="font-medium text-sm">{data.label}</div>
            <Badge variant="secondary" className="text-xs">Response</Badge>
          </div>
        </div>
        <div className="text-xs text-gray-600 mb-2">
          {getResponseDescription(data.config || {})}
        </div>
        {data.config?.responseType === 'choice' && data.config?.choices?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.config.choices.slice(0, 3).map((choice: any, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {choice.value}
              </Badge>
            ))}
            {data.config.choices.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{data.config.choices.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      {/* Dynamic handles based on response type */}
      {data.config?.responseType === 'choice' && data.config?.choices?.length > 0 ? (
        // Multiple handles for choice responses
        data.config.choices.map((choice: any, index: number) => (
          <Handle
            key={choice.value}
            type="source"
            position={Position.Bottom}
            id={choice.value}
            className="w-2 h-2"
            style={{ 
              left: `${20 + (index * (60 / Math.max(data.config.choices.length - 1, 1)))}%` 
            }}
          />
        ))
      ) : (
        // Single handle for other response types
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      )}
    </Card>
  );
};

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
  response: ResponseNode,
}; 