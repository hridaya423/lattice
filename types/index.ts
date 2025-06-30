export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  argumentTree?: ArgumentTree;
}

export interface DebateResponse {
  response: string;
  argumentTree?: ArgumentTree;
  error?: string;
}

export interface SearchResult {
  title: string;
  description: string;
  url: string;
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
    statusCode?: number;
  };
}

export interface ReadingSuggestions {
  results: SearchResult[];
  isLoading: boolean;
  error?: string;
}

export interface ConversationState {
  scenario: string | null;
  messages: Message[];
  isLoading: boolean;
  hasAnalysis: boolean;
  readingSuggestions?: ReadingSuggestions;
}

export interface ReadingSuggestion {
  title: string;
  author: string;
  type: 'book' | 'article' | 'paper';
  description: string;
  relevance: string;
  url?: string;
}

export interface ArgumentNode {
  id: string;
  text: string;
  type: 'supporting' | 'opposing' | 'neutral' | 'evidence' | 'counterargument';
  framework?: 'consequence-based' | 'rule-based' | 'character-based' | 'practical' | 'stakeholder' | 
             'legal' | 'emotional' | 'economic' | 'social' | 'individual' | 'collective' | 'contextual';
  strength?: number; 
  children: ArgumentNode[];
  parent?: string;
  level: number;
}

export interface ArgumentTree {
  rootNode: ArgumentNode;
  totalNodes: number;
  maxDepth: number;
} 