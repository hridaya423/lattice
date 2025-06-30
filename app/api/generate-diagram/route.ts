import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { topic, diagramType = 'argument-flow', existingDiagram = null, enhanceMode = false, targetComplexity = 'more_complex' } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const systemMessage = `You are a PERFECT Mermaid diagram generator. Your ONLY job is to create syntactically flawless diagrams that render without any errors.

CRITICAL SUCCESS FORMULA:
1. DEFINE ALL NODES FIRST within subgraphs
2. CREATE CONNECTIONS SECOND using only defined nodes
3. VALIDATE EVERY SINGLE LINE before including it

MANDATORY STRUCTURE TEMPLATE:
\`\`\`mermaid
graph TD
    subgraph "Section 1 Name"
        A[Node A Text]
        B{Node B Text}
        C((Node C Text))
        A --> B
        B --> C
    end
    
    subgraph "Section 2 Name"
        D[Node D Text]
        E(Node E Text)
        D --> E
    end
    
    subgraph "Section 3 Name"
        F[Node F Text]
        G[Node G Text]
        F --> G
    end
    
    A --> D
    C --> F
\`\`\`

ABSOLUTE RULES (ZERO EXCEPTIONS):

1. START: Always 'graph TD' exactly
2. NODE IDS: ONLY A, B, C, D, E, F, G, H, I, J, K, L, M, N, O (single uppercase letters)
3. NODE DEFINITION: Each node MUST be defined before being used in connections
4. NODE SHAPES: [text] for processes, {text} for decisions, ((text)) for outcomes, (text) for entities
5. CONNECTIONS: Only A --> B or A -->|label| B format
6. SUBGRAPHS: subgraph "Name" then content then 'end'
7. INDENTATION: Exactly 4 spaces inside subgraphs
8. NO DUPLICATES: Each letter used exactly once

SUCCESS CHECKLIST (VERIFY BEFORE RESPONDING):
□ Started with 'graph TD'
□ Every node (A, B, C, etc.) is defined with a shape before being used
□ All connections reference only defined nodes
□ All subgraphs have quotes around names and end with 'end'
□ Indentation is exactly 4 spaces
□ No syntax errors anywhere
□ Response starts with \`\`\`mermaid and ends with \`\`\`

STEP-BY-STEP PROCESS:
1. Plan your nodes: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O
2. Define each node within appropriate subgraph BEFORE using it
3. Create connections ONLY between defined nodes
4. Double-check every line for syntax errors
5. Verify the diagram will render perfectly

FAILURE PREVENTION:
- NEVER reference a node before defining it
- NEVER use lowercase letters for node IDs
- NEVER forget to close subgraphs with 'end'
- NEVER use incorrect indentation
- NEVER include any text outside the code block

Your response must be ONLY the Mermaid code block with perfect syntax.`;

    let userMessage;
    
    if (enhanceMode && existingDiagram) {
      if (targetComplexity === 'more_complex') {
        userMessage = `EXPAND DIAGRAM PERFECTLY: Add more complexity to this existing diagram while maintaining perfect syntax.

EXISTING DIAGRAM:
${existingDiagram}

EXPANSION MISSION:
1. COPY the existing diagram EXACTLY as shown
2. IDENTIFY the highest letter used (if it goes to F, your new nodes start at G)
3. ADD 4-6 new nodes continuing the letter sequence
4. CREATE 1-2 new subgraphs with meaningful content
5. CONNECT new elements to existing ones logically

SYNTAX PRESERVATION RULES:
- Keep ALL existing nodes, connections, and subgraphs identical
- Continue node naming: if original ends at F, start new at G, H, I, J, K, L
- Maintain exact same indentation and formatting
- Use same arrow syntax patterns
- All new subgraphs must have quotes and 'end'

NEW CONTENT FOCUS:
- Add deeper analysis dimensions
- Include implementation challenges
- Show long-term consequences
- Add stakeholder perspectives
- Include risk factors
- Address practical constraints

MANDATORY TEMPLATE:
\`\`\`mermaid
[COPY EXISTING DIAGRAM EXACTLY]
    
    subgraph "[New Dimension Name]"
        [G][New Node G]
        [H]{New Node H}
        [I]((New Node I))
        G --> H
        H --> I
    end
    
    subgraph "[Another New Dimension Name]"
        [J][New Node J]
        [K](New Node K)
        J --> K
    end
    
    [Previous Node] --> G
    I --> [Previous Node]
    K --> [Previous Node]
\`\`\`

FINAL VALIDATION:
1. ✓ Original diagram copied exactly
2. ✓ New nodes continue letter sequence
3. ✓ All nodes defined before connections
4. ✓ Perfect syntax throughout
5. ✓ No errors that prevent rendering

Respond with ONLY the enhanced code block.`;
      } else {
        userMessage = `SIMPLIFY DIAGRAM PERFECTLY: Create a streamlined version focusing on core essentials with perfect syntax.

EXISTING DIAGRAM:
${existingDiagram}

SIMPLIFICATION MISSION:
1. IDENTIFY the 6-8 most critical nodes from the existing diagram
2. REMOVE secondary details and supporting elements
3. MERGE related subgraphs into 2-3 main categories
4. STREAMLINE connections to show only essential relationships
5. RENAME nodes sequentially A, B, C, D, E, F, G, H

CORE PRESERVATION PRIORITIES:
- Main decision points (diamonds {})
- Primary arguments (rectangles [])
- Key outcomes (circles ())
- Essential stakeholders (rounded ())
- Critical relationships

REMOVE THESE:
- Supporting evidence details
- Secondary stakeholder groups
- Implementation minutiae
- Regulatory specifics
- Technical details

MANDATORY TEMPLATE:
\`\`\`mermaid
graph TD
    subgraph "[Core Category 1]"
        A[Essential Node A]
        B{Key Decision B}
        C((Important Outcome C))
        A --> B
        B --> C
    end
    
    subgraph "[Core Category 2]"
        D[Essential Node D]
        E(Key Entity E)
        F((Important Result F))
        D --> E
        E --> F
    end
    
    subgraph "[Core Category 3]"
        G[Essential Node G]
        H((Final Outcome H))
        G --> H
    end
    
    A --> D
    C --> G
    F --> H
\`\`\`

FINAL VALIDATION:
1. ✓ Starts with 'graph TD'
2. ✓ Maximum 8 nodes (A-H)
3. ✓ All nodes defined before connections
4. ✓ All subgraphs have quotes and 'end'
5. ✓ Perfect syntax throughout
6. ✓ No rendering errors

Respond with ONLY the simplified code block.`;
      }
    } else {
      
      userMessage = `CREATE PERFECT DIAGRAM: Topic: ${topic} | Type: ${diagramType}

YOUR MISSION: Create a flawless Mermaid diagram that renders perfectly without any syntax errors.

EXACT REQUIREMENTS:
- EXACTLY 12-15 nodes using letters A through O
- EXACTLY 3 subgraphs with meaningful names for "${topic}"
- Each node MUST be defined within a subgraph before being used in connections
- Use appropriate shapes: [process] {decision} ((outcome)) (entity)

TOPIC FOCUS for "${topic}":
- Make it specific and relevant to this exact topic
- Use domain-appropriate terminology
- Include real-world considerations
- Show logical relationships and dependencies

MANDATORY STRUCTURE:
\`\`\`mermaid
graph TD
    subgraph "[Topic-Specific Name 1]"
        A[Specific Node A]
        B{Specific Node B}
        C[Specific Node C]
        D((Specific Node D))
        E(Specific Node E)
        A --> B
        B -->|Yes| C
        B -->|No| D
        C --> E
    end
    
    subgraph "[Topic-Specific Name 2]"
        F[Specific Node F]
        G[Specific Node G]
        H((Specific Node H))
        F --> G
        G --> H
    end
    
    subgraph "[Topic-Specific Name 3]"
        I[Specific Node I]
        J{Specific Node J}
        K((Specific Node K))
        L(Specific Node L)
        I --> J
        J --> K
        J --> L
    end
    
    A --> F
    E --> I
    H --> J
\`\`\`

FINAL VALIDATION (MANDATORY):
1. ✓ Starts with 'graph TD'
2. ✓ Every node A-O is defined with shape before connections
3. ✓ All connections reference only defined nodes
4. ✓ All subgraphs have quoted names and 'end'
5. ✓ Exactly 4 spaces indentation
6. ✓ No syntax errors anywhere
7. ✓ Specific to "${topic}" topic

Respond with ONLY the code block. No explanations.`;
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.05, 
      max_tokens: 2500,
    });

    const response = chatCompletion.choices[0]?.message?.content || '';
    
    
    const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/);
    const mermaidCode = mermaidMatch ? mermaidMatch[1] : response;

    
    if (!mermaidCode.includes('graph') && !mermaidCode.includes('flowchart')) {
      throw new Error('Generated response does not contain valid Mermaid diagram syntax');
    }
    
    
    const lines = mermaidCode.split('\n');
    const nodeIds = new Set();
    const referencedIds = new Set();
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('graph') || trimmed.startsWith('subgraph') || trimmed === 'end') continue;
      
      
      const nodeMatch = trimmed.match(/^([A-Z])\[|^([A-Z])\{|^([A-Z])\(\(|^([A-Z])\(/);
      if (nodeMatch) {
        const nodeId = nodeMatch[1] || nodeMatch[2] || nodeMatch[3] || nodeMatch[4];
        nodeIds.add(nodeId);
      }
      
      
      const connectionMatches = trimmed.match(/([A-Z])\s*-->/g);
      if (connectionMatches) {
        for (const match of connectionMatches) {
          const nodeIdMatch = match.match(/([A-Z])/);
          if (nodeIdMatch) {
            referencedIds.add(nodeIdMatch[1]);
          }
        }
      }
      
      const targetMatches = trimmed.match(/-->(?:\|[^|]*\|)?\s*([A-Z])/g);
      if (targetMatches) {
        for (const match of targetMatches) {
          const nodeId = match.match(/([A-Z])$/);
          if (nodeId) referencedIds.add(nodeId[1]);
        }
      }
    }
    
    
    if (referencedIds.size > 0 && nodeIds.size === 0) {
      throw new Error('No node definitions found but connections exist');
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