import { ArgumentNode, ArgumentTree } from '../../types';

export function parseArgumentsFromResponse(content: string): ArgumentTree | null {
  try {
    const lines = content.split('\n').filter(line => line.trim());
    const rootNode: ArgumentNode = {
      id: 'root',
      text: 'Ethical Analysis',
      type: 'neutral',
      children: [],
      level: 0
    };

    let currentParent = rootNode;
    let nodeCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      
      if (!line || line.startsWith('SUMMARY:') || line.startsWith('DETAILED ANALYSIS:')) {
        continue;
      }

      
      if (line.includes(':') && !line.includes('example') && !line.includes('study') && 
          !line.includes('research') && !line.includes('however') && line.length < 150) {
        
        
        const perspectiveName = line.replace(':', '').trim();
        const framework = detectFrameworkFromPerspective(perspectiveName);
        const sectionNode: ArgumentNode = {
          id: `section-${nodeCounter++}`,
          text: perspectiveName,
          type: perspectiveName.toLowerCase().includes('counterarguments') || 
                perspectiveName.toLowerCase().includes('opposing') ? 'opposing' : 'neutral',
          framework,
          children: [],
          parent: rootNode.id,
          level: 1
        };
        
        rootNode.children.push(sectionNode);
        currentParent = sectionNode;
        continue;
      }

      
      if (currentParent.level === 1 && line.length > 20) {
        const argumentNode: ArgumentNode = {
          id: `arg-${nodeCounter++}`,
          text: line,
          type: determineArgumentType(line),
          framework: currentParent.framework,
          strength: calculateArgumentStrength(line),
          children: [],
          parent: currentParent.id,
          level: 2
        };

        currentParent.children.push(argumentNode);

        
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          const nextLine = lines[j].trim();
          const detailNode = parseDetailLine(nextLine, argumentNode, nodeCounter++);
          if (detailNode) {
            argumentNode.children.push(detailNode);
            i = j; 
          } else {
            break;
          }
        }
      }
    }

    const totalNodes = countNodes(rootNode);
    const maxDepth = calculateMaxDepth(rootNode);

    return {
      rootNode,
      totalNodes,
      maxDepth
    };

  } catch (error) {
    console.error('Error parsing arguments:', error);
    return null;
  }
}

function detectFrameworkFromPerspective(perspectiveName: string): ArgumentNode['framework'] {
  const lowerName = perspectiveName.toLowerCase();
  
  
  if (lowerName.includes('utilitarian') || lowerName.includes('greatest good')) return 'utilitarian';
  if (lowerName.includes('deontological') || lowerName.includes('duty') || lowerName.includes('rights')) return 'deontological';
  if (lowerName.includes('virtue') || lowerName.includes('character')) return 'virtue';
  
  
  if (lowerName.includes('practical') || lowerName.includes('implementation')) return 'practical';
  if (lowerName.includes('stakeholder') || lowerName.includes('impact')) return 'stakeholder';
  
  
  if (lowerName.includes('legal') || lowerName.includes('justice') || lowerName.includes('law')) return 'legal';
  if (lowerName.includes('emotional') || lowerName.includes('psychological')) return 'emotional';
  if (lowerName.includes('economic') || lowerName.includes('financial')) return 'economic';
  if (lowerName.includes('social') || lowerName.includes('community')) return 'social';
  if (lowerName.includes('individual') || lowerName.includes('personal')) return 'individual';
  if (lowerName.includes('collective') || lowerName.includes('public')) return 'collective';
  
  return 'contextual'; 
}

function parseDetailLine(line: string, parent: ArgumentNode, id: number): ArgumentNode | null {
  if (line.length < 15 || parent.level >= 3) return null;

  
  if (line.includes('example') || line.includes('evidence') || 
      line.includes('study') || line.includes('research') ||
      line.includes('however') || line.includes('but') ||
      line.includes('furthermore') || line.includes('additionally')) {
    
    return {
      id: `detail-${id}`,
      text: line,
      type: line.includes('however') || line.includes('but') ? 'counterargument' : 'evidence',
      framework: parent.framework,
      strength: 3,
      children: [],
      parent: parent.id,
      level: parent.level + 1
    };
  }

  return null;
}

function determineArgumentType(line: string): ArgumentNode['type'] {
  const lowerLine = line.toLowerCase();
  
  if (lowerLine.includes('however') || lowerLine.includes('but') || 
      lowerLine.includes('critics') || lowerLine.includes('opposing')) {
    return 'counterargument';
  }
  
  if (lowerLine.includes('support') || lowerLine.includes('benefit') || 
      lowerLine.includes('advantage') || lowerLine.includes('positive')) {
    return 'supporting';
  }
  
  if (lowerLine.includes('evidence') || lowerLine.includes('study') || 
      lowerLine.includes('research') || lowerLine.includes('data')) {
    return 'evidence';
  }
  
  return 'neutral';
}

function calculateArgumentStrength(line: string): number {
  const lowerLine = line.toLowerCase();
  let strength = 3; 
  
  
  if (lowerLine.includes('clearly') || lowerLine.includes('obviously') || 
      lowerLine.includes('undoubtedly') || lowerLine.includes('proven')) {
    strength += 1;
  }
  
  
  if (lowerLine.includes('might') || lowerLine.includes('could') || 
      lowerLine.includes('possibly') || lowerLine.includes('perhaps')) {
    strength -= 1;
  }
  
  
  if (lowerLine.includes('research') || lowerLine.includes('study') || 
      lowerLine.includes('data') || lowerLine.includes('evidence')) {
    strength += 1;
  }
  
  return Math.max(1, Math.min(5, strength));
}

function countNodes(node: ArgumentNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

function calculateMaxDepth(node: ArgumentNode): number {
  if (node.children.length === 0) return node.level;
  return Math.max(...node.children.map(child => calculateMaxDepth(child)));
} 