import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { topic, diagramType = 'argument-flow' } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const systemMessage = `You are an expert at creating detailed, interconnected Mermaid diagrams for complex analysis. Generate comprehensive Mermaid diagram code that shows relationships, dependencies, and connections between concepts.

CRITICAL REQUIREMENTS:
1. ALWAYS return VALID Mermaid syntax
2. Create DETAILED diagrams with multiple nodes and connections
3. Use proper Mermaid formatting with correct spacing and syntax
4. Include feedback loops, dependencies, and cross-references where relevant
5. Use different node shapes for different types of concepts
6. Include subgraphs for grouping related concepts
7. Use different arrow types to show different relationships

MERMAID SYNTAX EXAMPLES:

Basic Flow:
\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[Result]
    D --> E
    E --> F[End]
\`\`\`

Complex Flow with Subgraphs:
\`\`\`mermaid
graph TD
    subgraph "Analysis Phase"
        A[Initial Assessment] --> B[Data Collection]
        B --> C[Stakeholder Input]
    end
    
    subgraph "Evaluation Phase"
        D[Criteria Definition] --> E[Option Analysis]
        E --> F[Risk Assessment]
    end
    
    subgraph "Decision Phase"
        G[Synthesis] --> H[Recommendation]
        H --> I[Implementation Plan]
    end
    
    C --> D
    F --> G
    I --> J[Feedback Loop]
    J -.-> A
\`\`\`

Node Types:
- A[Rectangle] - Process/Action
- B(Rounded) - Start/End
- C{Diamond} - Decision
- D[[Subroutine]] - Sub-process
- E((Circle)) - Event
- F>Flag] - Important point
- G[(Database)] - Data storage

Arrow Types:
- --> Solid arrow (direct relationship)
- -.-> Dotted arrow (indirect/optional)
- ==> Thick arrow (strong relationship)
- --x Cross (blocking relationship)

RESPONSE FORMAT:
Return ONLY the Mermaid code, properly formatted, starting with \`\`\`mermaid and ending with \`\`\`.
Do NOT include explanations, just the diagram code.

Generate a detailed, interconnected diagram that shows the complexity and relationships within the topic.`;

    const userMessage = `Create a detailed Mermaid ${diagramType} diagram for: ${topic}

Requirements:
- Show at least 12-20 interconnected nodes
- Include feedback loops and cross-references
- Use subgraphs to group related concepts
- Show different types of relationships with different arrow styles
- Include decision points, processes, stakeholders, and outcomes
- Make it comprehensive and detailed, showing the full complexity of the topic`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3, 
      max_tokens: 3000,
    });

    const response = chatCompletion.choices[0]?.message?.content || '';
    
    
    const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/);
    const mermaidCode = mermaidMatch ? mermaidMatch[1] : response;

    
    if (!mermaidCode.includes('graph') && !mermaidCode.includes('flowchart')) {
      throw new Error('Generated response does not contain valid Mermaid diagram syntax');
    }

    return NextResponse.json({
      mermaidCode: mermaidCode.trim(),
      rawResponse: response
    });

  } catch (error) {
    console.error('Error generating Mermaid diagram:', error);
    return NextResponse.json(
      { error: 'Failed to generate diagram', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 