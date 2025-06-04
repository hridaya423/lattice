'use client';

import React, { useState, useEffect } from 'react';
import { ArgumentNode, ArgumentTree } from '../../types';
import { X, Maximize2, Minimize2, Download, Eye, Code, RefreshCw, Loader2 } from 'lucide-react';
import MermaidRenderer from './MermaidRenderer';

interface MermaidArgumentDiagramProps {
  argumentTree?: ArgumentTree;
  topic?: string;
  useAI?: boolean;
  diagramType?: 'argument-flow' | 'stakeholder-analysis' | 'decision-tree' | 'process-flow';
  onClose: () => void;
  className?: string;
}

const MermaidArgumentDiagram: React.FC<MermaidArgumentDiagramProps> = ({ 
  argumentTree,
  topic,
  useAI = false,
  diagramType = 'argument-flow',
  onClose, 
  className = '' 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mermaidCode, setMermaidCode] = useState('');
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAIDiagram = async () => {
    if (!topic) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          topic, 
          diagramType 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate diagram');
      }

      setMermaidCode(data.mermaidCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error generating diagram:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTraditionalDiagram = () => {
    if (!argumentTree) return;

    const lines: string[] = ['graph TD'];
    const processedNodes = new Set<string>();
    
    
    lines.push('  classDef supporting fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#000');
    lines.push('  classDef opposing fill:#fef2f2,stroke:#dc2626,stroke-width:2px,color:#000');
    lines.push('  classDef evidence fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#000');
    lines.push('  classDef neutral fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#000');
    lines.push('  classDef utilitarian fill:#fed7aa,stroke:#ea580c,stroke-width:2px,color:#000');
    lines.push('  classDef deontological fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#000');
    lines.push('  classDef virtue fill:#e9d5ff,stroke:#9333ea,stroke-width:2px,color:#000');
    lines.push('');

    const processNode = (node: ArgumentNode, parentId?: string) => {
      if (processedNodes.has(node.id)) return;
      processedNodes.add(node.id);

      
      const truncatedText = truncateText(node.text, 40);
      const nodeShape = getNodeShape(node, truncatedText);
      
      
      lines.push(`  ${node.id}${nodeShape}`);
      
      
      if (parentId) {
        const connectionStyle = getConnectionStyle(node);
        lines.push(`  ${parentId} ${connectionStyle} ${node.id}`);
      }

      
      node.children.forEach(child => {
        processNode(child, node.id);
      });
    };

    
    processNode(argumentTree.rootNode);

    
    lines.push('');
    const addClassAssignments = (node: ArgumentNode) => {
      const cssClass = getNodeClass(node);
      if (cssClass) {
        lines.push(`  class ${node.id} ${cssClass}`);
      }
      node.children.forEach(addClassAssignments);
    };
    addClassAssignments(argumentTree.rootNode);

    setMermaidCode(lines.join('\n'));
  };

  useEffect(() => {
    if (useAI && topic) {
      generateAIDiagram();
    } else if (!useAI && argumentTree) {
      generateTraditionalDiagram();
    }
  }, [useAI, topic, diagramType, argumentTree]);

  const regenerateDiagram = () => {
    if (useAI) {
      generateAIDiagram();
    } else {
      generateTraditionalDiagram();
    }
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  const getNodeShape = (node: ArgumentNode, text: string): string => {
    const escapedText = text.replace(/"/g, '#quot;').replace(/\n/g, '<br/>');
    
    switch (node.type) {
      case 'supporting':
        return `["${escapedText}"]`;
      case 'opposing':
      case 'counterargument':
        return `{"${escapedText}"}`;
      case 'evidence':
        return `(("${escapedText}"))`;
      default:
        return `["${escapedText}"]`;
    }
  };

  const getConnectionStyle = (node: ArgumentNode): string => {
    switch (node.type) {
      case 'supporting':
        return '-->|supports|';
      case 'opposing':
      case 'counterargument':
        return '-.->|opposes|';
      case 'evidence':
        return '-->|evidence|';
      default:
        return '-->';
    }
  };

  const getNodeClass = (node: ArgumentNode): string => {
    // Framework takes precedence over type for coloring
    if (node.framework) {
      return node.framework;
    }
    return node.type;
  };

  const downloadDiagram = () => {
    const blob = new Blob([mermaidCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${useAI ? diagramType : 'argument'}-diagram.mmd`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className={`bg-black dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className} ${ 
      isFullscreen ? 'fixed inset-4 z-50' : ''
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-black dark:bg-gray-750">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {useAI ? `AI-Generated ${diagramType.charAt(0).toUpperCase() + diagramType.slice(1).replace('-', ' ')} Diagram` : 'Argument Flow Diagram'}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {useAI ? `Topic: ${topic}` : `${argumentTree?.totalNodes} nodes • ${argumentTree?.maxDepth} levels`}
            </div>
          </div>
          
          <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'visual'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              Visual
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'code'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              Code
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {useAI && (
            <button
              onClick={regenerateDiagram}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Regenerate Diagram"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </button>
          )}
          
          <button
            onClick={downloadDiagram}
            disabled={!mermaidCode || isGenerating}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
            title="Download Mermaid Code"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Close Diagram"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        {activeTab === 'visual' && (
          <>
            {(isGenerating || (!mermaidCode && useAI)) && (
              <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {useAI ? 'Generating detailed diagram with AI...' : 'Processing diagram...'}
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 bg-white dark:bg-gray-800 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="text-red-500 mb-2">⚠️</div>
                  <div className="text-sm text-red-600 dark:text-red-400">
                    Error generating diagram: {error}
                  </div>
                  <button
                    onClick={regenerateDiagram}
                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            
            {mermaidCode && !isGenerating && !error && (
              <MermaidRenderer 
                chart={mermaidCode} 
                className="h-full w-full"
              />
            )}
          </>
        )}
        
        {activeTab === 'code' && (
          <div className="h-full p-4 overflow-auto">
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Generating Mermaid code...
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-red-600 dark:text-red-400">
                  Error: {error}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Mermaid Code
                  </h4>
                  <button
                    onClick={copyToClipboard}
                    disabled={!mermaidCode}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Copy
                  </button>
                </div>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md overflow-auto text-xs font-mono text-gray-800 dark:text-gray-200 border">
                  <code>{mermaidCode || 'No code generated yet'}</code>
                </pre>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MermaidArgumentDiagram; 