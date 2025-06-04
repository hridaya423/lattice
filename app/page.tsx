'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, User, Bot, RotateCcw, Lightbulb, ChevronDown, ChevronUp, BookOpen, Download, FileText, TreePine, ChevronLeft, ChevronRight } from 'lucide-react';
import { Message, ConversationState } from '../types';
import ReadingSuggestions from './components/ReadingSuggestions';
import ArgumentTreeComponent from './components/ArgumentTree';
import MermaidArgumentDiagram from './components/MermaidArgumentDiagram';
import { exportToMarkdown, exportToPDF } from './utils/exportUtils';

export default function AIDebater() {
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
  const [showArgumentTree, setShowArgumentTree] = useState(false);
  const [showMermaidDiagram, setShowMermaidDiagram] = useState(false);
  const [diagramType, setDiagramType] = useState<'traditional' | 'ai-generated'>('traditional');
  const [aiDiagramType, setAiDiagramType] = useState<'argument-flow' | 'stakeholder-analysis' | 'decision-tree' | 'process-flow'>('argument-flow');
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

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

  const fetchReadingSuggestions = async () => {
    if (!state.scenario) return;

    setState(prev => ({
      ...prev,
      readingSuggestions: {
        results: [],
        isLoading: true,
      }
    }));

    try {
      const response = await fetch('/api/readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: state.scenario }),
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

  const closeReadingSuggestions = () => {
    setState(prev => ({
      ...prev,
      readingSuggestions: undefined,
    }));
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
    setShowArgumentTree(false);
    setShowMermaidDiagram(false);
    setChatCollapsed(false);
  };

  const exampleTopics = [
    "Should AI systems be allowed to make autonomous decisions in healthcare?",
    "Is genetic engineering of human embryos ethically justifiable?",
    "Should social media platforms be regulated as public utilities?",
    "Is universal basic income a viable solution to automation-driven unemployment?",
    "Should corporations have the same free speech rights as individuals?",
    "Is it ethical for governments to use facial recognition technology for surveillance?"
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-7xl mx-auto px-2 py-10">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageSquare className="w-7 h-7 text-[var(--accent)]" />
            <span className="premium-header text-2xl sm:text-3xl">Topic Analyzer</span>
          </div>
          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto">
            Multi-perspective analysis of complex topics. Present any scenario for a comprehensive, nuanced examination.
          </p>
        </div>

        <div className="flex gap-6">
          
          <div className={`transition-all duration-300 ${
            showMermaidDiagram ? (chatCollapsed ? 'w-1/3' : 'w-1/2') : 'flex-1'
          } min-w-0`}>
            <div className="premium-card p-0 overflow-hidden relative">
              
              {showMermaidDiagram && (
                <button
                  onClick={() => setChatCollapsed(!chatCollapsed)}
                  className="absolute top-4 right-4 z-10 p-2 bg-[var(--input-bg)] hover:bg-[var(--accent-light)] rounded-lg border border-[var(--input-border)] transition-colors"
                  title={chatCollapsed ? "Expand Chat" : "Collapse Chat"}
                >
                  {chatCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              )}
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
                    <div className="text-xs text-gray-500 mb-2 font-medium">Example topics:</div>
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
                <div className="flex flex-col h-[70vh]">
                  <div className="px-6 py-4 border-b premium-divider bg-[var(--card-bg)]">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--foreground)] text-base mb-1">Current Analysis:</h3>
                        <p className="text-gray-500 text-xs sm:text-sm">{state.scenario}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setShowMermaidDiagram(!showMermaidDiagram);
                              if (!showMermaidDiagram) {
                                setChatCollapsed(true);
                              }
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                              showMermaidDiagram 
                                ? 'bg-[var(--accent)] text-white' 
                                : 'bg-[var(--input-bg)] hover:bg-[var(--accent-light)] text-[var(--foreground)] border border-[var(--input-border)]'
                            }`}
                          >
                            <TreePine className="w-4 h-4" />
                            {showMermaidDiagram ? 'Hide Diagram' : 'Show Diagram'}
                          </button>
                          {state.hasAnalysis && (
                            <>
                              <select
                                value={diagramType}
                                onChange={(e) => setDiagramType(e.target.value as 'traditional' | 'ai-generated')}
                                className="px-3 py-2 rounded-lg text-xs bg-[var(--input-bg)] text-[var(--foreground)] border border-[var(--input-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-w-[120px]"
                              >
                                <option value="traditional">Traditional</option>
                                <option value="ai-generated">AI-Generated</option>
                              </select>
                              {diagramType === 'ai-generated' && (
                                <select
                                  value={aiDiagramType}
                                  onChange={(e) => setAiDiagramType(e.target.value as 'argument-flow' | 'stakeholder-analysis' | 'decision-tree' | 'process-flow')}
                                  className="px-3 py-2 rounded-lg text-xs bg-[var(--input-bg)] text-[var(--foreground)] border border-[var(--input-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-w-[140px]"
                                >
                                  <option value="argument-flow">Argument Flow</option>
                                  <option value="stakeholder-analysis">Stakeholder Analysis</option>
                                  <option value="decision-tree">Decision Tree</option>
                                  <option value="process-flow">Process Flow</option>
                                </select>
                              )}
                            </>
                          )}
                        </div>
                        <button
                          onClick={fetchReadingSuggestions}
                          disabled={state.readingSuggestions?.isLoading}
                          className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
                        >
                          {state.readingSuggestions?.isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-4 h-4" />
                              Get Readings
                            </>
                          )}
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
                    {state.messages.map((message, index) => {
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
                                
                                {showArgumentTree && message.argumentTree && (
                                  <div className="mt-4 pt-4 border-t border-[var(--input-border)]">
                                    <ArgumentTreeComponent argumentTree={message.argumentTree} />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                                  {message.content}
                                </div>
                                {showArgumentTree && message.argumentTree && (
                                  <div className="mt-4 pt-4 border-t border-[var(--input-border)]">
                                    <ArgumentTreeComponent argumentTree={message.argumentTree} />
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className={`text-xs mt-2 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
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
                            <span className="text-gray-500">Analyzing and formulating response...</span>
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

          
          {showMermaidDiagram && state.hasAnalysis && state.scenario && (
            <div className={`transition-all duration-300 ${
              chatCollapsed ? 'w-2/3' : 'w-1/2'
            } flex-shrink-0`}>
              <MermaidArgumentDiagram
                argumentTree={diagramType === 'traditional' ? state.messages[0]?.argumentTree : undefined}
                topic={state.scenario}
                useAI={diagramType === 'ai-generated'}
                diagramType={aiDiagramType}
                onClose={() => {
                  setShowMermaidDiagram(false);
                  setChatCollapsed(false);
                }}
                className="h-[85vh]"
              />
            </div>
          )}

          
          {state.readingSuggestions && !showMermaidDiagram && (
            <div className="w-80 flex-shrink-0">
              <ReadingSuggestions 
                suggestions={state.readingSuggestions}
                onClose={closeReadingSuggestions}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
