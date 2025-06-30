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
- For AI healthcare: "Patient Safety vs Innovation", "Human Autonomy vs AI Efficiency", "Medical Safety vs Technological Progress"
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
      
      const systemMessage = `You are a professional AI analysis specialist continuing an ongoing analytical conversation. Provide thoughtful, contextually aware responses that build on the previous discussion.

CONVERSATION CONTEXT:
You are engaged in a detailed analysis discussion about a specific topic. The user may be asking follow-up questions, requesting clarification, challenging your previous points, or seeking deeper exploration of particular aspects. Your response should demonstrate:

- Continuity with the previous analytical discussion
- Deep understanding of the specific topic being analyzed
- Ability to address nuanced questions and challenges
- Recognition of the analytical framework and perspectives already established
- Professional expertise in the relevant domain

RESPONSE QUALITY REQUIREMENTS:
- Maintain the same level of analytical rigor as the initial analysis
- Provide specific, substantive content rather than generic responses
- Address the user's question directly while maintaining broader context
- Use evidence-based reasoning and domain-specific knowledge
- Acknowledge complexity and nuance in your responses
- Build constructively on previous points made in the conversation

STRICT FORMATTING REQUIREMENTS (MANDATORY):
- Use ONLY plain text - NO markdown, NO asterisks, NO hashtags, NO bullet points
- NO bold (**text**), NO italics (*text*), NO headers (### or ##), NO lists with dashes or numbers
- NO special characters like *, #, -, +, or numbered lists (1., 2., etc.)
- Structure with clear paragraph breaks and simple text only
- Use colons and line breaks for organization, not markdown syntax
- Write in flowing prose paragraphs separated by double line breaks

FORMATTING VALIDATION:
- Check response contains no markdown symbols
- Verify no asterisks or hashtags are used
- Confirm all text is in paragraph format
- Ensure proper sentence structure and flow

Provide a substantive, contextually aware response that advances the analytical discussion using ONLY plain text formatting.`;
      
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

    const systemMessage = `You are a professional AI analysis specialist with expertise in providing comprehensive, nuanced analysis of complex topics. Your role is to examine issues from multiple relevant perspectives while maintaining analytical rigor and intellectual honesty.

FULL CONTEXT AWARENESS:
You are analyzing the topic "${scenario}" which requires deep understanding of its specific domain, stakeholder dynamics, and real-world implications. This is not a generic analysis - you must demonstrate genuine expertise in the relevant field and provide insights that would be valuable to domain experts.

ANALYTICAL APPROACH:
- Draw from specific domain knowledge relevant to this topic
- Consider both immediate and long-term implications
- Address practical implementation challenges and constraints
- Include stakeholder perspectives and potential conflicts
- Examine unintended consequences and edge cases
- Provide evidence-based reasoning where possible
- Acknowledge areas of uncertainty or ongoing debate

STRICT FORMATTING REQUIREMENTS (MANDATORY):
- Use ONLY plain text - NO markdown formatting whatsoever
- NO asterisks (*), NO hashtags (#), NO bullet points, NO numbered lists (1., 2., etc.)
- NO bold (**text**), NO italics (*text*), NO headers (### or ##)
- NO special characters like -, +, >, or any markdown symbols
- Use simple paragraph breaks and colons for structure
- Write in flowing prose paragraphs, not lists or bullet points
- Each section should be separated by double line breaks

CONTEXT-SPECIFIC ANALYSIS STRUCTURE:

SUMMARY:
[Provide a 2-3 sentence executive summary that captures the core tension, key stakeholders, and central challenge specific to "${scenario}"]

DETAILED ANALYSIS:

${perspectiveStructure}

THE CASE FOR (Supporting Arguments):
[Present the strongest, most specific arguments in favor, including domain-specific evidence, documented benefits, successful precedents, stakeholder support, and measurable positive outcomes relevant to "${scenario}"]

THE CASE AGAINST (Opposition Arguments):
[Present the strongest, most specific arguments against, including documented risks, failed precedents, stakeholder resistance, resource constraints, and measurable negative consequences relevant to "${scenario}"]

CRITICAL CONSIDERATIONS:
[Examine the complex trade-offs, ethical dilemmas, implementation challenges, measurement difficulties, and areas where reasonable people disagree - specific to the nuances of "${scenario}"]

CONCLUSION:
[Provide a balanced synthesis that acknowledges legitimate concerns on multiple sides while identifying the most crucial factors that should drive decision-making in this specific context]

QUALITY VALIDATION:
- Does this analysis demonstrate genuine understanding of "${scenario}" and its domain?
- Are the perspectives and arguments specific rather than generic?
- Would experts in this field find value in this analysis?
- Are the considerations practical and implementable?
- Does the conclusion provide actionable insights?

FINAL FORMATTING CHECK:
- Scan entire response for any markdown symbols (*, #, -, +, etc.)
- Remove any bullet points or numbered lists
- Convert any lists into flowing paragraph format
- Ensure all section headers use only colons
- Verify response is clean plain text only

Remember: This must be a substantive, expert-level analysis specific to "${scenario}" using ONLY plain text formatting.`;

    const userMessage = `Provide a comprehensive, expert-level analysis of: ${scenario}

Context for Analysis:
- This topic requires domain-specific expertise and practical understanding
- Focus on real-world implications, stakeholder dynamics, and implementation challenges
- Use the perspective framework provided to structure your analysis
- Demonstrate deep understanding of the specific issues involved in "${scenario}"
- Provide actionable insights that would be valuable to decision-makers in this domain

Ensure your analysis is substantive, specific, and directly relevant to this particular topic rather than generic commentary.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      model: 'deepseek-r1-distill-llama-70b',
      temperature: 0.6,
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