'use client';

import React, { useState } from 'react';
import { ArgumentNode, ArgumentTree } from '../../types';
import { ChevronDown, ChevronRight, Target, Shield, Heart, Users, Lightbulb, AlertTriangle } from 'lucide-react';

interface ArgumentTreeProps {
  argumentTree: ArgumentTree;
  className?: string;
}

interface ArgumentNodeProps {
  node: ArgumentNode;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
  expandedNodes: Set<string>;
}

const ArgumentTreeComponent: React.FC<ArgumentTreeProps> = ({ argumentTree, className = '' }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allNodeIds = new Set<string>();
    const collectNodeIds = (node: ArgumentNode) => {
      allNodeIds.add(node.id);
      node.children.forEach(collectNodeIds);
    };
    collectNodeIds(argumentTree.rootNode);
    setExpandedNodes(allNodeIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set(['root']));
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Argument Structure
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {argumentTree.totalNodes} arguments • {argumentTree.maxDepth} levels deep
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <ArgumentNodeComponent
          node={argumentTree.rootNode}
          isExpanded={expandedNodes.has(argumentTree.rootNode.id)}
          onToggle={toggleNode}
          expandedNodes={expandedNodes}
        />
      </div>

      <ArgumentLegend />
    </div>
  );
};

const ArgumentNodeComponent: React.FC<ArgumentNodeProps> = ({ 
  node, 
  isExpanded, 
  onToggle, 
  expandedNodes 
}) => {
  const hasChildren = node.children.length > 0;
  const nodeStyle = getNodeStyle(node);
  const icon = getNodeIcon(node);

  return (
    <div className="relative">
      <div 
        className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${nodeStyle.container}`}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        
        <div className="flex-shrink-0 mt-0.5">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>

        
        <div className={`flex-shrink-0 mt-0.5 ${nodeStyle.icon}`}>
          {icon}
        </div>

        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {node.framework && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${getFrameworkStyle(node.framework)}`}>
                {node.framework}
              </span>
            )}
            {node.strength && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Strength:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i <= node.strength! 
                          ? 'bg-blue-500' 
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className={`text-sm leading-relaxed ${nodeStyle.text}`}>
            {node.text}
          </p>
          {hasChildren && (
            <div className="mt-2 text-xs text-gray-500">
              {node.children.length} sub-argument{node.children.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      
      {hasChildren && isExpanded && (
        <div className="ml-6 mt-2 space-y-2 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
          {node.children.map((child) => (
            <ArgumentNodeComponent
              key={child.id}
              node={child}
              isExpanded={expandedNodes.has(child.id)}
              onToggle={onToggle}
              expandedNodes={expandedNodes}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ArgumentLegend: React.FC = () => {
  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Legend</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Target className="w-3 h-3 text-green-600" />
          <span className="text-gray-600 dark:text-gray-400">Supporting</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          <span className="text-gray-600 dark:text-gray-400">Opposing</span>
        </div>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-3 h-3 text-yellow-600" />
          <span className="text-gray-600 dark:text-gray-400">Evidence</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="w-3 h-3 text-purple-600" />
          <span className="text-gray-600 dark:text-gray-400">Virtue Ethics</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3 text-orange-600" />
          <span className="text-gray-600 dark:text-gray-400">Utilitarian</span>
        </div>
      </div>
    </div>
  );
};

function getNodeStyle(node: ArgumentNode) {
  const baseStyle = "transition-all duration-200";
  
  switch (node.type) {
    case 'supporting':
      return {
        container: `${baseStyle} bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30`,
        text: 'text-green-900 dark:text-green-100',
        icon: 'text-green-600'
      };
    case 'opposing':
    case 'counterargument':
      return {
        container: `${baseStyle} bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30`,
        text: 'text-red-900 dark:text-red-100',
        icon: 'text-red-600'
      };
    case 'evidence':
      return {
        container: `${baseStyle} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30`,
        text: 'text-yellow-900 dark:text-yellow-100',
        icon: 'text-yellow-600'
      };
    default:
      return {
        container: `${baseStyle} bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`,
        text: 'text-gray-900 dark:text-gray-100',
        icon: 'text-gray-600'
      };
  }
}

function getNodeIcon(node: ArgumentNode) {
  const iconClass = "w-4 h-4";
  
  switch (node.type) {
    case 'supporting':
      return <Target className={iconClass} />;
    case 'opposing':
    case 'counterargument':
      return <AlertTriangle className={iconClass} />;
    case 'evidence':
      return <Lightbulb className={iconClass} />;
    default:
      return <Shield className={iconClass} />;
  }
}

function getFrameworkStyle(framework: string) {
  switch (framework) {
    case 'utilitarian':
      return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
    case 'deontological':
      return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
    case 'virtue':
      return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
    case 'practical':
      return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
    case 'stakeholder':
      return 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300';
    case 'legal':
      return 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300';
    case 'emotional':
      return 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300';
    case 'economic':
      return 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300';
    case 'social':
      return 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300';
    case 'individual':
      return 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300';
    case 'collective':
      return 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300';
    case 'contextual':
      return 'bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
}

export default ArgumentTreeComponent; 