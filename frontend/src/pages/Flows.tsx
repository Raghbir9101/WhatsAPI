import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  useReactFlow,
  ReactFlowInstance,
  Connection,
  Edge,
  Node,
  useKeyPress,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Save, 
  Play, 
  Pause, 
  Trash2, 
  Settings, 
  Zap,
  MessageSquare,
  Image,
  FileText,
  Webhook,
  Timer,
  GitBranch,
  RefreshCw,
  MessageCircle
} from 'lucide-react';

import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { nodeTypes } from '@/components/flows/FlowNodes';

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

// Helper function to update nodeId counter based on existing nodes
const updateNodeIdCounter = (nodes: Node[]) => {
  if (nodes.length === 0) {
    nodeId = 0;
    return;
  }
  
  const maxId = nodes
    .map(node => {
      const match = node.id.match(/node_(\d+)/);
      return match ? parseInt(match[1], 10) : -1;
    })
    .filter(num => num >= 0)
    .reduce((max, current) => Math.max(max, current), -1);
  
  nodeId = maxId + 1;
};

const FlowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [flowName, setFlowName] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [selectedInstance, setSelectedInstance] = useState('');
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  const queryClient = useQueryClient();

  // Get WhatsApp instances
  const { data: numbersData } = useQuery({
    queryKey: ['numbers'],
    queryFn: () => apiClient.getNumbers(),
  });

  // Get flows
  const { data: flowsData, refetch: refetchFlows } = useQuery({
    queryKey: ['flows', selectedInstance],
    queryFn: () => apiClient.getFlows(selectedInstance || undefined),
  });

  // Save flow mutation
  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: any) => {
      if (currentFlowId) {
        return apiClient.updateFlow(currentFlowId, flowData);
      } else {
        return apiClient.createFlow(flowData);
      }
    },
    onSuccess: (data:any) => {
      toast({
        title: "Flow saved successfully",
        description: currentFlowId ? "Flow updated" : "New flow created"
      });
      setCurrentFlowId(data._id);
      refetchFlows();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save flow",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete flow mutation
  const deleteFlowMutation = useMutation({
    mutationFn: (flowId: string) => apiClient.deleteFlow(flowId),
    onSuccess: () => {
      toast({ title: "Flow deleted successfully" });
      refetchFlows();
      clearFlow();
    }
  });

  // Toggle flow status mutation
  const toggleFlowMutation = useMutation({
    mutationFn: (flowId: string) => apiClient.toggleFlowStatus(flowId),
    onSuccess: () => {
      toast({ title: "Flow status updated" });
      refetchFlows();
    }
  });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) return;

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { 
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          config: {}
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsConfigOpen(true);
  }, []);

  // Delete selected nodes and edges
  const deletePressed = useKeyPress('Delete');
  
  useEffect(() => {
    if (deletePressed) {
      setNodes((nds) => nds.filter((node) => !node.selected));
      setEdges((eds) => eds.filter((edge) => !edge.selected));
    }
  }, [deletePressed, setNodes, setEdges]);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsConfigOpen(true);
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
  }, [setEdges]);

  const addNode = (type: string) => {
    // Generate a position that's less likely to overlap with existing nodes
    const position = { 
      x: 50 + Math.random() * 400, 
      y: 50 + Math.random() * 400 
    };
    
    const newNode: Node = {
      id: getId(),
      type,
      position,
      data: { 
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        config: {}
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const saveFlow = () => {
    if (!flowName || !selectedInstance) {
      toast({
        title: "Missing required fields",
        description: "Please provide flow name and select an instance",
        variant: "destructive"
      });
      return;
    }

    saveFlowMutation.mutate({
      instanceId: selectedInstance,
      name: flowName,
      description: flowDescription,
      nodes,
      edges,
      isActive: true
    });
  };

  const loadFlow = (flow: any) => {
    setCurrentFlowId(flow._id);
    setFlowName(flow.name);
    setFlowDescription(flow.description || '');
    setSelectedInstance(flow.instanceId);
    const loadedNodes = flow.nodes || [];
    setNodes(loadedNodes);
    setEdges(flow.edges || []);
    
    // Update the node ID counter to prevent conflicts with existing nodes
    updateNodeIdCounter(loadedNodes);
  };

  const clearFlow = () => {
    setCurrentFlowId(null);
    setFlowName('');
    setFlowDescription('');
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    
    // Reset the node ID counter when clearing
    nodeId = 0;
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    );
  };

  const readyInstances = numbersData?.numbers?.filter(n => n.status === 'ready') || [];

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Flow Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flow Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Instance</Label>
                <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select WhatsApp Instance" />
                  </SelectTrigger>
                  <SelectContent>
                    {readyInstances.map((instance) => (
                      <SelectItem key={instance.instanceId} value={instance.instanceId}>
                        {instance.instanceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Flow Name</Label>
                <Input
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  placeholder="Enter flow name"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={flowDescription}
                  onChange={(e) => setFlowDescription(e.target.value)}
                  placeholder="Describe what this flow does"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={saveFlow} disabled={saveFlowMutation.status == "pending"}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveFlowMutation.status == "pending" ? 'Saving...' : 'Save Flow'}
                </Button>
                <Button variant="outline" onClick={clearFlow}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Node Palette */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Nodes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode('trigger')}
              >
                <Zap className="h-4 w-4 mr-2" />
                Trigger
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode('action')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Action
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode('response')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Response
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode('condition')}
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Condition
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode('delay')}
              >
                <Timer className="h-4 w-4 mr-2" />
                Delay
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <div>• <strong>Single click</strong> node to select</div>
              <div>• <strong>Double click</strong> node to configure</div>
              <div>• <strong>Delete key</strong> to remove selected nodes/edges</div>
              <div>• <strong>Shift + click</strong> for multi-selection</div>
              <div>• <strong>Drag</strong> from handles to connect nodes</div>
            </CardContent>
          </Card>

          {/* Saved Flows */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Saved Flows
                <Button variant="ghost" size="sm" onClick={() => refetchFlows()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(flowsData as any)?.flows?.map((flow: any) => (
                <div key={flow._id} className="p-2 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{flow.name}</div>
                      <div className="text-xs text-gray-500">
                        {flow.nodes?.length || 0} nodes
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant={flow.isActive ? "default" : "secondary"}>
                        {flow.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadFlow(flow)}
                    >
                      Load
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFlowMutation.mutate(flow._id)}
                    >
                      {flow.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFlowMutation.mutate(flow._id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            multiSelectionKeyCode="Shift"
            deleteKeyCode="Delete"
            selectNodesOnDrag={false}
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>

      {/* Node Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure {selectedNode?.type} Node</DialogTitle>
          </DialogHeader>
          {selectedNode && (
            <NodeConfiguration
              node={selectedNode}
              nodes={nodes}
              onSave={(config) => {
                updateNodeConfig(selectedNode.id, config);
                setIsConfigOpen(false);
              }}
              onCancel={() => setIsConfigOpen(false)}
              onDelete={(nodeId) => {
                deleteNode(nodeId);
                setIsConfigOpen(false);
                setSelectedNode(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Node Configuration Component
const NodeConfiguration = ({ node, nodes, onSave, onCancel, onDelete }: {
  node: Node;
  nodes: Node[];
  onSave: (config: any) => void;
  onCancel: () => void;
  onDelete: (nodeId: string) => void;
}) => {
  const [config, setConfig] = useState(node.data.config || {});

  const handleSave = () => {
    onSave(config);
  };

  const renderTriggerConfig = () => (
    <div className="space-y-4">
      <div>
        <Label>Trigger Type</Label>
        <Select value={config.triggerType} onValueChange={(value) => setConfig({...config, triggerType: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select trigger type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text_equals">Text Equals</SelectItem>
            <SelectItem value="text_contains">Text Contains</SelectItem>
            <SelectItem value="text_starts_with">Text Starts With</SelectItem>
            <SelectItem value="text_ends_with">Text Ends With</SelectItem>
            <SelectItem value="text_regex">Regex Pattern</SelectItem>
            <SelectItem value="media_received">Media Received</SelectItem>
            <SelectItem value="any_message">Any Message</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {['text_equals', 'text_contains', 'text_starts_with', 'text_ends_with'].includes(config.triggerType) && (
        <div>
          <Label>Text to Match</Label>
          <Input
            value={config.text || ''}
            onChange={(e) => setConfig({...config, text: e.target.value})}
            placeholder="Enter text to match"
          />
        </div>
      )}

      {config.triggerType === 'text_regex' && (
        <div>
          <Label>Regex Pattern</Label>
          <Input
            value={config.pattern || ''}
            onChange={(e) => setConfig({...config, pattern: e.target.value})}
            placeholder="Enter regex pattern"
          />
        </div>
      )}

      {config.triggerType === 'media_received' && (
        <div>
          <Label>Media Type (Optional)</Label>
          <Select value={config.mediaType} onValueChange={(value) => setConfig({...config, mediaType: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Any media type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="document">Document</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  const renderActionConfig = () => (
    <div className="space-y-4">
      <div>
        <Label>Action Type</Label>
        <Select value={config.actionType} onValueChange={(value) => setConfig({...config, actionType: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select action type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="send_message">Send Message</SelectItem>
            <SelectItem value="send_image">Send Image</SelectItem>
            <SelectItem value="send_document">Send Document</SelectItem>
            <SelectItem value="webhook">Call Webhook</SelectItem>
            <SelectItem value="set_variable">Set Variable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.actionType === 'send_message' && (
        <div>
          <Label>Message Text</Label>
          <Textarea
            value={config.message || ''}
            onChange={(e) => setConfig({...config, message: e.target.value})}
            placeholder="Enter message text (use {{variable}} for dynamic content)"
            rows={3}
          />
        </div>
      )}

      {config.actionType === 'send_image' && (
        <>
          <div>
            <Label>Image URL</Label>
            <Input
              value={config.imageUrl || ''}
              onChange={(e) => setConfig({...config, imageUrl: e.target.value})}
              placeholder="Enter image URL"
            />
          </div>
          <div>
            <Label>Caption (Optional)</Label>
            <Input
              value={config.caption || ''}
              onChange={(e) => setConfig({...config, caption: e.target.value})}
              placeholder="Enter image caption"
            />
          </div>
        </>
      )}

      {config.actionType === 'send_document' && (
        <div>
          <Label>Document URL</Label>
          <Input
            value={config.documentUrl || ''}
            onChange={(e) => setConfig({...config, documentUrl: e.target.value})}
            placeholder="Enter document URL"
          />
        </div>
      )}

      {config.actionType === 'webhook' && (
        <>
          <div>
            <Label>Webhook URL</Label>
            <Input
              value={config.webhookUrl || ''}
              onChange={(e) => setConfig({...config, webhookUrl: e.target.value})}
              placeholder="Enter webhook URL"
            />
          </div>
          <div>
            <Label>HTTP Method</Label>
            <Select value={config.method || 'POST'} onValueChange={(value) => setConfig({...config, method: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {config.actionType === 'set_variable' && (
        <>
          <div>
            <Label>Variable Name</Label>
            <Input
              value={config.variableName || ''}
              onChange={(e) => setConfig({...config, variableName: e.target.value})}
              placeholder="Enter variable name"
            />
          </div>
          <div>
            <Label>Variable Value</Label>
            <Input
              value={config.value || ''}
              onChange={(e) => setConfig({...config, value: e.target.value})}
              placeholder="Enter variable value"
            />
          </div>
        </>
      )}
    </div>
  );

  const renderConditionConfig = () => (
    <div className="space-y-4">
      <div>
        <Label>Variable to Check</Label>
        <Input
          value={config.variable || ''}
          onChange={(e) => setConfig({...config, variable: e.target.value})}
          placeholder="Enter variable name"
        />
      </div>
      <div>
        <Label>Operator</Label>
        <Select value={config.operator} onValueChange={(value) => setConfig({...config, operator: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select operator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="not_equals">Not Equals</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="greater_than">Greater Than</SelectItem>
            <SelectItem value="less_than">Less Than</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Value to Compare</Label>
        <Input
          value={config.value || ''}
          onChange={(e) => setConfig({...config, value: e.target.value})}
          placeholder="Enter comparison value"
        />
      </div>
    </div>
  );

  const renderDelayConfig = () => (
    <div className="space-y-4">
      <div>
        <Label>Delay Duration (seconds)</Label>
        <Input
          type="number"
          value={config.duration || 1}
          onChange={(e) => setConfig({...config, duration: parseInt(e.target.value)})}
          placeholder="Enter delay in seconds"
          min="1"
        />
      </div>
    </div>
  );

  const renderResponseConfig = () => {
    const addChoice = () => {
      const choices = config.choices || [];
      setConfig({
        ...config,
        choices: [...choices, { value: '', label: '', targetNodeId: '' }]
      });
    };

    const updateChoice = (index: number, field: string, value: string) => {
      const choices = [...(config.choices || [])];
      choices[index] = { ...choices[index], [field]: value };
      setConfig({ ...config, choices });
    };

    const removeChoice = (index: number) => {
      const choices = [...(config.choices || [])];
      choices.splice(index, 1);
      setConfig({ ...config, choices });
    };

    return (
      <div className="space-y-4">
        <div>
          <Label>Message to Send</Label>
          <Textarea
            value={config.message || ''}
            onChange={(e) => setConfig({...config, message: e.target.value})}
            placeholder="Enter the message to send to users"
            rows={3}
          />
        </div>

        <div>
          <Label>Response Type</Label>
          <Select 
            value={config.responseType || 'any'} 
            onValueChange={(value) => setConfig({...config, responseType: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Text</SelectItem>
              <SelectItem value="choice">Multiple Choice</SelectItem>
              <SelectItem value="text">Text Input</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone Number</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.responseType === 'choice' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Response Choices</Label>
              <Button type="button" variant="outline" size="sm" onClick={addChoice}>
                <Plus className="h-3 w-3 mr-1" />
                Add Choice
              </Button>
            </div>
            
            {(config.choices || []).map((choice: any, index: number) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Choice {index + 1}</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeChoice(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">User Types</Label>
                      <Input
                        value={choice.value || ''}
                        onChange={(e) => updateChoice(index, 'value', e.target.value)}
                        placeholder="e.g., 'continue', '1'"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Display Label</Label>
                      <Input
                        value={choice.label || ''}
                        onChange={(e) => updateChoice(index, 'label', e.target.value)}
                        placeholder="e.g., 'Continue'"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Target Node</Label>
                    <Select 
                      value={choice.targetNodeId || ''} 
                      onValueChange={(value) => updateChoice(index, 'targetNodeId', value)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select target node" />
                      </SelectTrigger>
                                             <SelectContent>
                         {nodes.filter(n => n.id !== node.id).map((n) => (
                           <SelectItem key={n.id} value={n.id}>
                             {n.data.label} ({n.type})
                           </SelectItem>
                         ))}
                       </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            
            {(!config.choices || config.choices.length === 0) && (
              <div className="text-sm text-gray-500 text-center p-4 border-2 border-dashed rounded-lg">
                No choices added yet. Click "Add Choice" to create response options.
              </div>
            )}
          </div>
        )}

        {config.responseType !== 'choice' && config.responseType !== 'any' && (
          <div className="space-y-3">
            <Label>Validation Settings</Label>
            <div className="space-y-2">
              {(config.responseType === 'text' || config.responseType === 'number') && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Min Length</Label>
                      <Input
                        type="number"
                        value={config.validation?.minLength || ''}
                        onChange={(e) => setConfig({
                          ...config, 
                          validation: { 
                            ...config.validation, 
                            minLength: parseInt(e.target.value) || undefined 
                          }
                        })}
                        placeholder="Optional"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max Length</Label>
                      <Input
                        type="number"
                        value={config.validation?.maxLength || ''}
                        onChange={(e) => setConfig({
                          ...config, 
                          validation: { 
                            ...config.validation, 
                            maxLength: parseInt(e.target.value) || undefined 
                          }
                        })}
                        placeholder="Optional"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <Label className="text-xs">Custom Pattern (Regex)</Label>
                <Input
                  value={config.validation?.pattern || ''}
                  onChange={(e) => setConfig({
                    ...config, 
                    validation: { 
                      ...config.validation, 
                      pattern: e.target.value 
                    }
                  })}
                  placeholder="Optional regex pattern"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <Label>Timeout (minutes)</Label>
          <Input
            type="number"
            value={config.timeout?.minutes || 30}
            onChange={(e) => setConfig({
              ...config, 
              timeout: { 
                ...config.timeout, 
                minutes: parseInt(e.target.value) || 30 
              }
            })}
            placeholder="30"
            min="1"
            max="1440"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {node.type === 'trigger' && renderTriggerConfig()}
      {node.type === 'action' && renderActionConfig()}
      {node.type === 'response' && renderResponseConfig()}
      {node.type === 'condition' && renderConditionConfig()}
      {node.type === 'delay' && renderDelayConfig()}

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          variant="destructive" 
          onClick={() => onDelete(node.id)}
          className="ml-auto"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Node
        </Button>
      </div>
    </div>
  );
};

export function Flows() {
  return (
    <div className="h-screen">
      <ReactFlowProvider>
        <FlowBuilder />
      </ReactFlowProvider>
    </div>
  );
} 