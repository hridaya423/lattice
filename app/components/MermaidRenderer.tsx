'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import domtoimage from 'dom-to-image';
import { ZoomIn, ZoomOut, RotateCcw, Image, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface MermaidRendererProps {
  chart: string;
  className?: string;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart, className = '' }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

  
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  
  const validateMermaidSyntax = useCallback((chartCode: string): boolean => {
    if (!chartCode || chartCode.trim().length === 0) {
      return false;
    }
    
    
    const validPatterns = [
      /^graph\s+(TD|TB|BT|RL|LR)/m,
      /^flowchart\s+(TD|TB|BT|RL|LR)/m,
      /^sequenceDiagram/m,
      /^classDiagram/m,
      /^stateDiagram/m,
      /^gantt/m,
      /^pie/m,
      /^journey/m
    ];
    
    return validPatterns.some(pattern => pattern.test(chartCode.trim()));
  }, []);

  
  const checkBrowserSupport = useCallback((): boolean => {
    try {
      
      return !!(
        typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        window.XMLSerializer &&
        window.Blob &&
        window.URL &&
        domtoimage &&
        typeof domtoimage.toPng === 'function'
      );
    } catch {
      return false;
    }
  }, []);

  
  const autoFitDiagram = useCallback(() => {
    if (!elementRef.current) return;
    
    const container = elementRef.current;
    const svgElement = container.querySelector('svg');
    
    if (!svgElement) return;
    
    try {
      
      const containerRect = container.getBoundingClientRect();
      const availableWidth = containerRect.width - 32; 
      const availableHeight = containerRect.height - 32;
      
      
      const svgRect = svgElement.getBoundingClientRect();
      const svgWidth = svgRect.width;
      const svgHeight = svgRect.height;
      
      if (svgWidth > 0 && svgHeight > 0 && availableWidth > 0 && availableHeight > 0) {
        
        const widthZoom = (availableWidth / svgWidth) * 100;
        const heightZoom = (availableHeight / svgHeight) * 100;
        
        
        const optimalZoom = Math.min(widthZoom, heightZoom);
        
        
        const clampedZoom = Math.max(50, Math.min(300, Math.round(optimalZoom)));
        
        setZoom(clampedZoom);
      }
    } catch (err) {
      console.warn('Auto-fit calculation failed:', err);
    }
  }, []);

  
  const exportAsPNG = useCallback(async () => {
    if (!elementRef.current || isExporting) return;
    
    
    if (!checkBrowserSupport()) {
      showToast('PNG export is not supported in this browser', 'error');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const svgElement = elementRef.current.querySelector('svg');
      if (!svgElement) {
        throw new Error('No diagram found to export');
      }

      
      if (svgElement.clientWidth === 0 || svgElement.clientHeight === 0) {
        throw new Error('Diagram has invalid dimensions');
      }

      
      const dataUrl = await domtoimage.toPng(svgElement, {
        quality: 1.0,
        bgcolor: 'white',
        width: Math.min(svgElement.clientWidth * 2, 4000), 
        height: Math.min(svgElement.clientHeight * 2, 4000), 
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: svgElement.clientWidth + 'px',
          height: svgElement.clientHeight + 'px'
        },
        cacheBust: true
      });
      
      if (!dataUrl || dataUrl === 'data:,') {
        throw new Error('Failed to generate image data');
      }
      
      
      const link = document.createElement('a');
      link.download = `mermaid-diagram-${new Date().getTime()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Diagram exported successfully!', 'success');
    } catch (err) {
      console.error('Export error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to export diagram';
      showToast(`Export failed: ${errorMessage}`, 'error');
    } finally {
      setIsExporting(false);
    }
  }, [checkBrowserSupport, showToast, isExporting]);

  
  const exportMermaidCode = useCallback(() => {
    try {
      if (!chart || !validateMermaidSyntax(chart)) {
        showToast('No valid diagram code to export', 'error');
        return;
      }

      const blob = new Blob([chart], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mermaid-diagram-${new Date().getTime()}.mmd`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      showToast('Diagram code exported successfully!', 'success');
    } catch (err) {
      console.error('Code export error:', err);
      showToast('Failed to export diagram code', 'error');
    }
  }, [chart, validateMermaidSyntax, showToast]);

  
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        fontSize: 14,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis',
          padding: 20,
        },
        maxTextSize: 50000, 
        maxEdges: 500, 
      });
      setIsInitialized(true);
    } catch (initError) {
      console.error("Mermaid initialization error:", initError);
      setError(initError instanceof Error ? initError.message : "Failed to initialize diagram renderer");
      setIsLoading(false);
    }
  }, []);

  
  useEffect(() => {
    const renderDiagram = async () => {
      if (!elementRef.current || !chart || !isInitialized) {
        if (isInitialized && chart && !elementRef.current) {
          setError("Diagram container not found");
          setIsLoading(false);
        } else if (isInitialized && !chart) {
          setIsLoading(false); 
        }
        return;
      }

      
      if (!validateMermaidSyntax(chart)) {
        setError('Invalid diagram syntax. Please check your Mermaid code.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        
        elementRef.current.innerHTML = '';
        
        
        const id = `mermaid-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        
        const renderPromise = mermaid.render(id, chart);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Diagram rendering timed out')), 30000)
        );
        
        const { svg } = await Promise.race([renderPromise, timeoutPromise]) as { svg: string };

        if (!svg || svg.trim() === '') {
          throw new Error('Diagram rendered no content. Please verify your syntax.');
        }
        
        if (elementRef.current) {
          elementRef.current.innerHTML = svg;
          
          
          const svgElement = elementRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = 'none';
            svgElement.style.width = `${zoom}%`;
            svgElement.style.height = 'auto';
            svgElement.style.display = 'block';
            svgElement.style.margin = '0 auto';
            svgElement.style.transition = 'width 0.2s ease';
            
            
            svgElement.setAttribute('role', 'img');
            svgElement.setAttribute('aria-label', 'Mermaid diagram');
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Mermaid diagram rendering error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown rendering error';
        setError(`Failed to render diagram: ${errorMessage}`);
        setIsLoading(false);
      }
    };

    if (isInitialized) {
      if (chart && isLoading) {
        setIsLoading(false);
        return;
      }
      if (chart && !isLoading && !error) {
        renderDiagram();
      } else if (!chart) {
        if (elementRef.current) {
          elementRef.current.innerHTML = '';
        }
        if (isLoading) setIsLoading(false);
      }
    }
  }, [chart, isInitialized, isLoading, error, zoom, validateMermaidSyntax]);

  
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 300));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 50));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(100);
  }, []);

  
  useEffect(() => {
    return () => {
      
      if (toast.show) {
        setToast({ show: false, message: '', type: 'success' });
      }
    };
  }, [toast.show]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Rendering diagram...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <div className="text-sm text-red-600 dark:text-red-400 max-w-md">
            {error}
          </div>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
            }}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 min-w-[300px]">
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {toast.message}
          </span>
        </div>
      )}

      
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        
        <div className="flex items-center gap-2 bg-black dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white"
            title="Zoom Out (Ctrl + -)"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium px-2 text-gray-400 dark:text-gray-400 min-w-[40px] text-center">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 300}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white"
            title="Zoom In (Ctrl + +)"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={autoFitDiagram}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-white"
            title="Auto Fit"
            aria-label="Auto fit diagram to container"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-white"
            title="Reset Zoom (Ctrl + 0)"
            aria-label="Reset zoom to 100%"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        
        <div className="flex items-center gap-1 bg-black dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2">
          <button
            onClick={exportAsPNG}
            disabled={isExporting || !checkBrowserSupport()}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white"
            title={!checkBrowserSupport() ? "PNG export not supported in this browser" : "Export as PNG"}
            aria-label="Export diagram as PNG image"
          >
            <Image className="w-4 h-4" />
          </button>
          <button
            onClick={exportMermaidCode}
            disabled={!chart || !validateMermaidSyntax(chart)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white"
            title="Export Mermaid Code"
            aria-label="Export diagram source code"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      
      <div 
        ref={elementRef} 
        className={`mermaid-container overflow-auto bg-white dark:bg-gray-50 rounded-lg p-4 border border-gray-200 dark:border-gray-600`}
        style={{
          height: '100%',
          minHeight: '400px',
        }}
        role="main"
        aria-label="Mermaid diagram container"
      />
    </div>
  );
};

export default MermaidRenderer; 