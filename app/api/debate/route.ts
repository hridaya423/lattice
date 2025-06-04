import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { parseArgumentsFromResponse } from '../../utils/argumentParser';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

function cleanResponse(content: string): string {
  const thinkTagRegex = /<think>[\s\S]*?<\/think>/gi;
  let cleaned = content.replace(thinkTagRegex, '');
  
  cleaned = cleaned.replace(/<\/?think>/gi, '');
  
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  
  return cleaned;
}


async function generateRelevantPerspectives(scenario: string): Promise<string[]> {
  try {
    const perspectivePrompt = `Analyze this scenario and identify 4-6 most relevant analytical perspectives that would be meaningful for examining this specific case. DO NOT use generic philosophical frameworks unless they are truly relevant.

Scenario: ${scenario}

Consider what perspectives would actually matter for this specific situation. For example:
- For a revenge killing: "Victim's Rights vs Legal Justice", "Emotional Response vs Rational Response", "Vigilante Justice vs Rule of Law"
- For AI healthcare: "Patient Safety vs Innovation", "Human Autonomy vs AI Efficiency", "Medical Ethics vs Technological Progress"
- For corporate speech: "Corporate Rights vs Public Interest", "Economic Impact vs Democratic Values", "Legal Precedent vs Social Responsibility"

Return ONLY a simple list of 4-6 perspective names, one per line, no formatting:`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'user', content: perspectivePrompt }
      ],
      model: 'deepseek-r1-distill-llama-70b',
      temperature: 0.4,
      max_tokens: 400,
    });

    const response = completion.choices[0]?.message?.content || '';
    const perspectives = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.includes('Scenario:'))
      .slice(0, 6);

    
    if (perspectives.length < 3) {
      return [
        'Immediate Consequences vs Long-term Implications',
        'Individual Rights vs Collective Good',
        'Practical Implementation vs Idealistic Goals',
        'Stakeholder Impact Analysis'
      ];
    }

    return perspectives;
  } catch (error) {
    console.error('Error generating perspectives:', error);
    
    return [
      'Immediate Consequences vs Long-term Implications',
      'Individual Rights vs Collective Good',
      'Practical Implementation vs Idealistic Goals',
      'Stakeholder Impact Analysis'
    ];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { scenario, messages } = await request.json();

    if (messages && messages.length > 0) {
      
      const systemMessage = `You are a professional AI ethics analyst. Provide thoughtful, balanced responses to follow-up questions.

CRITICAL FORMATTING RULES:
- Use ONLY plain text - NO markdown, NO asterisks, NO hashtags, NO bullet points
- NO bold (**text**), NO italics (*text*), NO headers (###), NO lists with dashes or numbers
- Structure with clear paragraph breaks and simple text only
- Use colons and line breaks for organization, not markdown syntax

Continue the conversation with the same analytical rigor as before.`;
      
      const conversationHistory = messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      }));

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemMessage },
          ...conversationHistory
        ],
        model: 'deepseek-r1-distill-llama-70b',
        temperature: 0.7,
        max_tokens: 2500,
      });

      const rawResponse = chatCompletion.choices[0]?.message?.content || 'No response generated';
      const cleanedResponse = cleanResponse(rawResponse);
      const argumentTree = parseArgumentsFromResponse(cleanedResponse);

      return NextResponse.json({
        response: cleanedResponse,
        argumentTree,
      });
    }

    
    
    const relevantPerspectives = await generateRelevantPerspectives(scenario);
    
    
    const perspectiveStructure = relevantPerspectives.map(perspective => 
      `${perspective}:\n[Analysis from this specific perspective]`
    ).join('\n\n');

    const systemMessage = `You are a professional AI ethics analyst. When presented with any topic, provide a comprehensive examination using perspectives that are specifically relevant to that topic.

CRITICAL FORMATTING RULES:
- Use ONLY plain text - NO markdown formatting whatsoever
- NO asterisks, NO hashtags, NO bullet points, NO numbered lists
- NO bold (**text**), NO italics (*text*), NO headers (### or ##)
- Use simple paragraph breaks and colons for structure
- Write in flowing prose, not lists or bullet points

REQUIRED RESPONSE STRUCTURE:

SUMMARY:
[Provide a 2-3 sentence executive summary of the key tensions and considerations specific to this topic]

DETAILED ANALYSIS:

${perspectiveStructure}

Critical Counterarguments:
[Challenge each major position with opposing views]

Areas of Complexity:
[Gray areas, edge cases, and nuanced considerations specific to this topic]

Synthesis:
[Balanced conclusion highlighting key trade-offs and questions for further consideration]

IMPORTANT: The perspectives above are specifically chosen for this topic. Focus your analysis through these lenses rather than generic philosophical frameworks. Make each perspective substantive and directly relevant to the scenario.

Remember: Use ONLY plain text with paragraph breaks. No formatting symbols of any kind.`;

    const userMessage = `Analyze this topic: ${scenario}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      model: 'deepseek-r1-distill-llama-70b',
      temperature: 0.7,
      max_tokens: 6000,
    });

    const rawResponse = chatCompletion.choices[0]?.message?.content || 'No response generated';
    const cleanedResponse = cleanResponse(rawResponse);
    const argumentTree = parseArgumentsFromResponse(cleanedResponse);

    return NextResponse.json({
      response: cleanedResponse,
      argumentTree,
    });

  } catch (error) {
    console.error('Debate API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
} 