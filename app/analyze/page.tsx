'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, User, Bot, RotateCcw, Lightbulb, ChevronDown, ChevronUp, BookOpen, Download, FileText, TreePine } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Message, ConversationState } from '../../types';
import Image from 'next/image';
import ReadingSuggestions from '../components/ReadingSuggestions';
import MermaidArgumentDiagram from '../components/MermaidArgumentDiagram';
import Footer from '../components/Footer';
import { exportToMarkdown, exportToPDF } from '../utils/exportUtils';

export default function AnalyzePage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ConversationState>({
    scenario: null,
    messages: [],
    isLoading: false,
    hasAnalysis: false,
  });
  
  const [inputText, setInputText] = useState('');
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState<'pdf' | 'markdown' | null>(null);
  const [showMermaidDiagram, setShowMermaidDiagram] = useState(false);
  const [aiDiagramType, setAiDiagramType] = useState<'argument-flow' | 'stakeholder-analysis' | 'decision-tree' | 'process-flow'>('argument-flow');
  const [diagramDetailLevel, setDiagramDetailLevel] = useState<number>(0);
  
  const [showReadings, setShowReadings] = useState(true);
  const [showDiagram, setShowDiagram] = useState(true);
  const [diagramExpanded, setDiagramExpanded] = useState(false);
  const [diagramManuallyClosed, setDiagramManuallyClosed] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const topic = searchParams.get('topic');
    if (topic) {
      setInputText(decodeURIComponent(topic));
    }
  }, [searchParams]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);
  useEffect(() => {
    if (state.hasAnalysis && state.scenario && !showMermaidDiagram && !diagramManuallyClosed) {
      setShowMermaidDiagram(true);
      setShowDiagram(true);
    }
  }, [state.hasAnalysis, state.scenario]);

  const toggleMessageExpansion = (index: number) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMessages(newExpanded);
  };

  const parseResponse = (content: string) => {
    const summaryMatch = content.match(/SUMMARY:\s*([\s\S]*?)(?=DETAILED ANALYSIS:|$)/);
    const detailedMatch = content.match(/DETAILED ANALYSIS:\s*([\s\S]*)/);
    
    return {
      summary: summaryMatch ? summaryMatch[1].trim() : content.substring(0, 200) + '...',
      detailed: detailedMatch ? detailedMatch[1].trim() : content
    };
  };

  const handleExport = async (format: 'pdf' | 'markdown') => {
    if (!state.scenario || !state.messages.length) return;

    setIsExporting(format);

    try {
      const exportData = {
        scenario: state.scenario,
        messages: state.messages,
        timestamp: new Date()
      };

      if (format === 'pdf') {
        await exportToPDF(exportData);
      } else {
        exportToMarkdown(exportData);
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      
    } finally {
      setIsExporting(null);
    }
  };

  const fetchReadingSuggestionsForTopic = async (topic: string) => {
    setState(prev => ({
      ...prev,
      readingSuggestions: {
        results: [],
        isLoading: true,
      }
    }));

    setShowReadings(true);

    try {
      const response = await fetch('/api/readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setState(prev => ({
        ...prev,
        readingSuggestions: {
          results: data.results || [],
          isLoading: false,
        }
      }));

    } catch (error) {
      console.error('Error fetching reading suggestions:', error);
      setState(prev => ({
        ...prev,
        readingSuggestions: {
          results: [],
          isLoading: false,
          error: 'Failed to load reading suggestions',
        }
      }));
    }
  };

  const fetchReadingSuggestions = async () => {
    if (!state.scenario) return;
    return fetchReadingSuggestionsForTopic(state.scenario);
  };

  const closeReadingSuggestions = () => {
    setState(prev => ({
      ...prev,
      readingSuggestions: undefined,
    }));
    setShowReadings(false);
  };

  const analyzeScenario = async () => {
    if (!inputText.trim()) return;

    setState(prev => ({ ...prev, isLoading: true, scenario: inputText }));

    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenario: inputText }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const newMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        argumentTree: data.argumentTree,
      };

      setState(prev => ({
        ...prev,
        messages: [newMessage],
        isLoading: false,
        hasAnalysis: true,
      }));
      
      
      setTimeout(() => {
        if (inputText.trim()) {
          fetchReadingSuggestionsForTopic(inputText.trim());
        }
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const askFollowUp = async () => {
    if (!followUpQuestion.trim() || !state.hasAnalysis) return;

    const userMessage: Message = {
      role: 'user',
      content: followUpQuestion,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    try {
      const allMessages = [...state.messages, userMessage];
      
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          scenario: state.scenario,
          messages: allMessages 
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        argumentTree: data.argumentTree,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isLoading: false,
      }));

      setFollowUpQuestion('');

    } catch (error) {
      console.error('Error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const resetDebate = () => {
    setState({
      scenario: null,
      messages: [],
      isLoading: false,
      hasAnalysis: false,
    });
    setInputText('');
    setFollowUpQuestion('');
    setExpandedMessages(new Set());
    setShowMermaidDiagram(false);
    setShowReadings(false);
    setShowDiagram(false);
    setDiagramExpanded(false);
    setDiagramManuallyClosed(false);
  };

  const toggleDiagram = () => {
    const newShowDiagram = !showDiagram;
    setShowDiagram(newShowDiagram);
    setShowMermaidDiagram(newShowDiagram);
    
    if (newShowDiagram) {
      setDiagramExpanded(false);
      setDiagramManuallyClosed(false); 
    } else {
      setDiagramManuallyClosed(true); 
    }
  };

  const toggleDiagramExpansion = () => {
    setDiagramExpanded(!diagramExpanded);
  };

  const exampleTopics = [
    "Should AI systems be allowed to make autonomous decisions in healthcare?",
    "Is genetic engineering of human embryos scientifically and socially justifiable?",
    "Should social media platforms be regulated as public utilities?",
    "Is universal basic income a viable solution to automation-driven unemployment?",
    "Should corporations have the same free speech rights as individuals?",
    "Is it appropriate for governments to use facial recognition technology for surveillance?"
  ];

  const getLayoutClasses = () => {
    let classes = 'main-layout';
    if (showReadings && showDiagram) {
      classes += ' both-panels-open';
    }
    if (diagramExpanded) classes += ' diagram-expanded';
    return classes;
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="w-full mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <Image 
                src="/logo.png" 
                alt="Lattice Logo" 
                width={24} 
                height={24}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="premium-header text-2xl">Lattice</h1>
              <div className="text-xs text-[var(--text-secondary)] font-medium">
                Multi-Perspective Analysis
              </div>
            </div>
          </div>
          
        </div>

        
        <div className={getLayoutClasses()}>
          
          <div className={`readings-panel ${showReadings ? 'visible' : ''}`}>
            {showReadings && !state.readingSuggestions && (
              <div className="p-6 text-center">
                <BookOpen className="w-8 h-8 text-[var(--accent)] mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Reading Suggestions</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Click &quot;Get Readings&quot; to discover relevant articles and resources for this topic.
                </p>
                <button
                  onClick={fetchReadingSuggestions}
                  className="bg-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)]/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Get Readings
                </button>
              </div>
            )}
            {state.readingSuggestions && (
              <ReadingSuggestions 
                suggestions={state.readingSuggestions}
                onClose={closeReadingSuggestions}
                
                onFetchReadings={fetchReadingSuggestions}
                isFetchingReadings={state.readingSuggestions?.isLoading}
              />
            )}
          </div>

          <div className="analysis-panel">
            <div className="premium-card p-0 overflow-hidden relative">
              {!state.hasAnalysis ? (
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-[var(--accent)]" />
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Topic for Analysis</h2>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter any topic, scenario, or question you'd like analyzed from multiple perspectives."
                    className="premium-textarea w-full h-28 p-4 text-base mt-2"
                    disabled={state.isLoading}
                  />
                  <div className="mt-5 mb-4">
                    <div className="text-xs text-[var(--text-secondary)] mb-2 font-medium">Example topics:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {exampleTopics.map((topic, index) => (
                        <button
                          key={index}
                          onClick={() => setInputText(topic)}
                          className="text-left p-3 bg-[var(--input-bg)] hover:bg-[var(--accent-light)] rounded-lg text-[var(--foreground)] text-xs transition-colors border border-[var(--input-border)]"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <button
                      onClick={analyzeScenario}
                      disabled={!inputText.trim() || state.isLoading}
                      className="premium-btn px-5 py-2 flex items-center gap-2 text-base ml-auto"
                    >
                      {state.isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          Begin Analysis
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-[85vh]">
                  <div className="px-6 py-4 border-b premium-divider bg-[var(--card-bg)]">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--foreground)] text-base mb-1">Current Analysis:</h3>
                        <p className="text-[var(--text-secondary)] text-xs sm:text-sm">{state.scenario}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleDiagram}
                          className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                            showDiagram 
                              ? 'bg-[var(--accent)] text-white' 
                              : 'bg-[var(--input-bg)] hover:bg-[var(--accent-light)] text-[var(--foreground)] border border-[var(--input-border)]'
                          }`}
                        >
                          <TreePine className="w-4 h-4" />
                          {showDiagram ? 'Hide Diagram' : 'Show Diagram'}
                        </button>
                        
                        <button
                          onClick={() => setShowReadings(!showReadings)}
                          className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                            showReadings 
                              ? 'bg-[var(--accent)] text-white' 
                              : 'bg-[var(--input-bg)] hover:bg-[var(--accent-light)] text-[var(--foreground)] border border-[var(--input-border)]'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          {showReadings ? 'Hide Readings' : 'Show Readings'}
                        </button>
                        
                        
                        <button
                          onClick={() => handleExport('markdown')}
                          disabled={isExporting !== null}
                          className="bg-[var(--input-bg)] hover:bg-[var(--accent-light)] text-[var(--foreground)] px-3 py-2 rounded-lg text-xs font-medium border border-[var(--input-border)] flex items-center gap-2 transition-colors"
                          title="Export as Markdown"
                        >
                          {isExporting === 'markdown' ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-[var(--foreground)] border-t-transparent"></div>
                          ) : (
                            <FileText className="w-3 h-3" />
                          )}
                          MD
                        </button>
                        <button
                          onClick={() => handleExport('pdf')}
                          disabled={isExporting !== null}
                          className="bg-[var(--input-bg)] hover:bg-[var(--accent-light)] text-[var(--foreground)] px-3 py-2 rounded-lg text-xs font-medium border border-[var(--input-border)] flex items-center gap-2 transition-colors"
                          title="Export as PDF"
                        >
                          {isExporting === 'pdf' ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-[var(--foreground)] border-t-transparent"></div>
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          PDF
                        </button>
                        
                        <button
                          onClick={resetDebate}
                          className="bg-[var(--input-bg)] hover:bg-[var(--accent-light)] text-[var(--foreground)] px-4 py-2 rounded-lg text-xs font-medium border border-[var(--input-border)] flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          New Analysis
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[var(--card-bg)]">
                    {state.messages.map((message, index) =>  {
                      const isExpanded = expandedMessages.has(index);
                      const isInitialAnalysis = index === 0 && message.role === 'assistant';
                      const parsedContent = isInitialAnalysis ? parseResponse(message.content) : null;
                      
                      return (
                        <div
                          key={index}
                          className={`flex gap-4 message-enter ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.role === 'assistant' && (
                            <div className="w-9 h-9 bg-[var(--accent-light)] flex items-center justify-center rounded-full flex-shrink-0">
                              <Bot className="w-5 h-5 text-[var(--accent)]" />
                            </div>
                          )}
                          <div
                            className={`max-w-2xl rounded-xl p-4 ${
                              message.role === 'user'
                                ? 'bg-[var(--accent)] text-white ml-10'
                                : 'bg-[var(--input-bg)] text-[var(--foreground)] border border-[var(--input-border)]'
                            }`}
                          >
                            {isInitialAnalysis && parsedContent ? (
                              <div>
                                <div className="mb-3">
                                  <h4 className="font-semibold text-sm mb-2 text-[var(--accent)]">Summary</h4>
                                  <div className="whitespace-pre-wrap leading-relaxed text-sm">
                                    {parsedContent.summary}
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => toggleMessageExpansion(index)}
                                  className="flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent)] text-sm font-medium transition-colors"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="w-4 h-4" />
                                      Hide Detailed Analysis
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-4 h-4" />
                                      Show Detailed Analysis
                                    </>
                                  )}
                                </button>
                                
                                {isExpanded && (
                                  <div className="mt-4 pt-4 border-t border-[var(--input-border)]">
                                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                                      {parsedContent.detailed}
                                    </div>
                                  </div>
                                )}
                                
                              
                              </div>
                            ) : (
                              <div>
                                <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                                  {message.content}
                                </div>
                                
                              </div>
                            )}
                            
                            <div className={`text-xs mt-2 ${
                              message.role === 'user' ? 'text-white/70' : 'text-[var(--text-secondary)]'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                          {message.role === 'user' && (
                            <div className="w-9 h-9 bg-[var(--accent-light)] flex items-center justify-center rounded-full flex-shrink-0">
                              <User className="w-5 h-5 text-[var(--accent)]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {state.isLoading && (
                      <div className="flex gap-4 justify-start message-enter">
                        <div className="w-9 h-9 bg-[var(--accent-light)] flex items-center justify-center rounded-full flex-shrink-0">
                          <Bot className="w-5 h-5 text-[var(--accent)]" />
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-xl p-4 border border-[var(--input-border)]">
                          <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--accent)] border-t-transparent"></div>
                            <span className="text-[var(--text-secondary)]">Analyzing and formulating response...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="px-6 py-4 border-t premium-divider bg-[var(--card-bg)]">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={followUpQuestion}
                        onChange={(e) => setFollowUpQuestion(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && askFollowUp()}
                        placeholder="Ask a follow-up question or request deeper analysis..."
                        className="premium-input flex-1 p-3 text-base"
                        disabled={state.isLoading}
                      />
                      <button
                        onClick={askFollowUp}
                        disabled={!followUpQuestion.trim() || state.isLoading}
                        className="premium-btn px-5 py-2 flex items-center gap-2 text-base"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`diagram-panel ${showDiagram ? 'visible' : ''} ${diagramExpanded ? 'expanded' : ''}`}>
            {showDiagram && (!showMermaidDiagram || !state.hasAnalysis || !state.scenario) && (
              <div className="p-6 text-center">
                <TreePine className="w-8 h-8 text-[var(--accent)] mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Visual Diagrams</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Complete an analysis first, then use the diagram controls to visualize argument structures and relationships.
                </p>
              </div>
            )}
            {showMermaidDiagram && state.hasAnalysis && state.scenario && (
              <MermaidArgumentDiagram
                topic={state.scenario}
                diagramType={aiDiagramType}
                onClose={() => {
                  setShowMermaidDiagram(false);
                  setShowDiagram(false);
                  setDiagramManuallyClosed(true);
                }}
                className="h-[85vh]"
                onAiDiagramTypeChange={setAiDiagramType}
                onToggleExpansion={toggleDiagramExpansion}
                isExpanded={diagramExpanded}
                showReadings={showReadings}
                detailLevel={diagramDetailLevel}
                onDetailLevelChange={setDiagramDetailLevel}
              />
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}