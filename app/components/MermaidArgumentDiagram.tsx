'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Download, Eye, Code, RefreshCw, Loader2, Plus, Minus } from 'lucide-react';
import MermaidRenderer, { MermaidRendererRef } from './MermaidRenderer';

interface MermaidArgumentDiagramProps {
  topic?: string;
  diagramType?: 'argument-flow' | 'stakeholder-analysis' | 'decision-tree' | 'process-flow';
  onClose: () => void;
  className?: string;
  onAiDiagramTypeChange?: (type: 'argument-flow' | 'stakeholder-analysis' | 'decision-tree' | 'process-flow') => void;
  onToggleExpansion?: () => void;
  isExpanded?: boolean;
  showReadings?: boolean;
  detailLevel?: number;
  onDetailLevelChange?: (level: number) => void;
}

const MermaidArgumentDiagram: React.FC<MermaidArgumentDiagramProps> = ({ 
  topic,
  diagramType = 'argument-flow',
  onClose, 
  className = '',
  onAiDiagramTypeChange,
  onToggleExpansion,
  isExpanded = false,
  showReadings = false,
  detailLevel = 0,
  onDetailLevelChange
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mermaidCode, setMermaidCode] = useState('');
  const [diagramLevels, setDiagramLevels] = useState<{[key: number]: string}>({}); 
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mermaidRendererRef = useRef<MermaidRendererRef>(null);

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

      const generatedCode = data.mermaidCode;
      setMermaidCode(generatedCode);
      setDiagramLevels(prev => ({ ...prev, 0: generatedCode })); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error generating diagram:', err);
    } finally {
      setIsGenerating(false);
    }
  };


  useEffect(() => {
    if (topic) {
      generateAIDiagram();
    }
  }, [topic, diagramType]);
  
  
  useEffect(() => {
    if (diagramLevels[detailLevel]) {
      
      setMermaidCode(diagramLevels[detailLevel]);
    } else if (detailLevel !== 0 && diagramLevels[0]) {
      
      enhanceDiagram();
    }
  }, [detailLevel]);

  const enhanceDiagram = async () => {
    if (!diagramLevels[0]) return; 
    
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
          diagramType,
          existingDiagram: diagramLevels[0],
          enhanceMode: true,
          targetComplexity: detailLevel > 0 ? 'more_complex' : 'simpler'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance diagram');
      }

      const enhancedCode = data.mermaidCode;
      setMermaidCode(enhancedCode);
      setDiagramLevels(prev => ({ ...prev, [detailLevel]: enhancedCode }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error enhancing diagram:', err);
      
      const fallbackCode = diagramLevels[0];
      setMermaidCode(fallbackCode);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateDiagram = () => {
    if (detailLevel === 0) {
      generateAIDiagram();
    } else {
      enhanceDiagram();
    }
  };


  const downloadDiagram = async () => {
    if (mermaidRendererRef.current) {
      await mermaidRendererRef.current.exportAsPNG();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className={`bg-[var(--card-bg)] border border-[var(--input-border)] rounded-lg overflow-hidden ${className} ${ 
      isFullscreen ? 'fixed inset-4 z-50' : ''
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-[var(--input-border)] bg-[var(--surface-elevated)]">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              {diagramType.charAt(0).toUpperCase() + diagramType.slice(1).replace('-', ' ')} Diagram
            </h3>
          </div>
          
          
          {onAiDiagramTypeChange && (
            <div className={`${isExpanded ? 'scale-110' : ''} transition-transform`}>
              <select
                value={diagramType}
                onChange={(e) => onAiDiagramTypeChange(e.target.value as 'argument-flow' | 'stakeholder-analysis' | 'decision-tree' | 'process-flow')}
                className={`px-3 py-2 rounded-lg text-sm bg-[var(--input-bg)] text-[var(--foreground)] border border-[var(--input-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${isExpanded ? 'min-w-[180px]' : 'min-w-[160px]'} transition-all`}
              >
                <option value="argument-flow">Argument Flow</option>
                <option value="stakeholder-analysis">Stakeholder Analysis</option>
                <option value="decision-tree">Decision Tree</option>
                <option value="process-flow">Process Flow</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          
          <div className="flex bg-[var(--input-bg)] rounded-lg p-1 border border-[var(--input-border)]">
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-2 ${showReadings && !isExpanded ? 'px-2 py-1.5' : 'px-3 py-1.5'} rounded-md text-sm font-medium transition-colors ${
                activeTab === 'visual'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
              }`}
            >
              <Eye className="w-4 h-4" />
              {(!showReadings || isExpanded) && 'Visual'}
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 ${showReadings && !isExpanded ? 'px-2 py-1.5' : 'px-3 py-1.5'} rounded-md text-sm font-medium transition-colors ${
                activeTab === 'code'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
              }`}
            >
              <Code className="w-4 h-4" />
              {(!showReadings || isExpanded) && 'Code'}
            </button>
          </div>
          
          
          <div className="flex items-center gap-2">
            <button
              onClick={regenerateDiagram}
              disabled={isGenerating}
              className={`flex items-center gap-2 ${showReadings && !isExpanded ? 'px-2 py-2' : 'px-3 py-2'} text-sm bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              title="Regenerate Diagram"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {(!showReadings || isExpanded) && (isGenerating ? 'Generating...' : 'Regenerate')}
            </button>
            
            <button
              onClick={downloadDiagram}
              disabled={!mermaidCode || isGenerating}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] rounded-lg transition-colors disabled:opacity-50"
              title="Download Diagram as PNG"
            >
              <Download className="w-4 h-4" />
            </button>

            {onDetailLevelChange && (
              <>
                <button
                  onClick={() => onDetailLevelChange(Math.max(-2, detailLevel - 1))}
                  disabled={isGenerating || detailLevel <= -2}
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Simplify Diagram"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onDetailLevelChange(Math.min(10, detailLevel + 1))}
                  disabled={isGenerating || detailLevel >= 10}
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add More Detail"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </>
            )}
            
            
            <button
              onClick={onToggleExpansion || (() => setIsFullscreen(!isFullscreen))}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] rounded-lg transition-colors"
              title={isExpanded || isFullscreen ? "Collapse" : "Expand"}
            >
              {isExpanded || isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] rounded-lg transition-colors"
              title="Close Diagram"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        {activeTab === 'visual' && (
          <>
            {(isGenerating || !mermaidCode) && (
              <div className="absolute inset-0 bg-[var(--card-bg)] bg-opacity-90 flex items-center justify-center z-10">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)] mx-auto mb-2" />
                  <div className="text-sm text-[var(--text-secondary)]">
                    Generating detailed diagram with AI...
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 bg-[var(--card-bg)] flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="text-red-500 mb-2">⚠️</div>
                  <div className="text-sm text-red-600 dark:text-red-400">
                    Error generating diagram: {error}
                  </div>
                  <button
                    onClick={regenerateDiagram}
                    className="mt-3 px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-light)] transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            
            {mermaidCode && !isGenerating && !error && (
              <MermaidRenderer 
                ref={mermaidRendererRef}
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
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)] mx-auto mb-2" />
                  <div className="text-sm text-[var(--text-secondary)]">
                    Generating Mermaid code...
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-[var(--accent)]">
                  Error: {error}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-[var(--foreground)]">
                    Mermaid Code
                  </h4>
                  <button
                    onClick={copyToClipboard}
                    disabled={!mermaidCode}
                    className="px-3 py-1 text-xs bg-[var(--input-bg)] text-[var(--text-secondary)] rounded-md hover:bg-[var(--input-border)] transition-colors disabled:opacity-50"
                  >
                    Copy
                  </button>
                </div>
                <pre className="bg-[var(--input-bg)] p-3 rounded-md overflow-auto text-xs font-mono text-[var(--foreground)] border border-[var(--input-border)]">
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