'use client';

import { useState } from 'react';
import { ArrowRight, MessageSquare, TreePine, BookOpen, Lightbulb, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Footer from './components/Footer';

export default function LandingPage() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const router = useRouter();

  const exampleTopics = [
    "Should AI systems be allowed to make autonomous decisions in healthcare?",
    "Is genetic engineering of human embryos scientifically and socially justifiable?",
    "Should social media platforms be regulated as public utilities?",
    "Is universal basic income a viable solution to automation-driven unemployment?",
    "Should corporations have the same free speech rights as individuals?",
    "Is it appropriate for governments to use facial recognition technology for surveillance?"
  ];

  const features = [
    {
      icon: MessageSquare,
      title: "Multi-Perspective Analysis",
      description: "Examine complex topics through consequence-based, rule-based, character-based, and practical frameworks."
    },
    {
      icon: TreePine,
      title: "Visual Argument Mapping",
      description: "Interactive diagrams that visualize argument structures and relationships between ideas."
    },
    {
      icon: BookOpen,
      title: "Research Discovery",
      description: "AI-powered suggestions for relevant articles, papers, and resources to deepen your understanding."
    }
  ];

  const handleStartAnalysis = (topic?: string) => {
    const topicToAnalyze = topic || selectedTopic;
    if (topicToAnalyze.trim()) {
      
      router.push(`/analyze?topic=${encodeURIComponent(topicToAnalyze)}`);
    } else {
      router.push('/analyze');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      
      <div className="relative overflow-hidden">
      
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 relative">
          <div className="text-center">
            
            <div className="relative mb-8">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-[var(--accent)] rounded-xl blur-lg opacity-20"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                    <Image 
                      src="/logo.png" 
                      alt="Lattice Logo" 
                      width={40} 
                      height={40}
                      className="object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h1 className="premium-header text-5xl sm:text-7xl tracking-tight bg-gradient-to-r from-[var(--foreground)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                    Lattice
                  </h1>
                  <div className="text-sm sm:text-base text-[var(--accent)] font-medium tracking-wide uppercase">
                    Multi-Perspective Analysis Platform
                  </div>
                </div>
              </div>
            </div>
            
            <div className="max-w-4xl mx-auto mb-12">
              <p className="text-xl sm:text-2xl text-[var(--text-secondary)] leading-relaxed mb-6">
                Transform complex debates into structured insights. Lattice examines topics through 
                <span className="text-[var(--accent)] font-medium"> multiple perspectives</span>, 
                generating comprehensive analyses that reveal nuanced perspectives and hidden connections.
              </p>
              
              
              <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <div className="w-2 h-2 bg-[var(--accent)] rounded-full"></div>
                  <span>Academic Research</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <div className="w-2 h-2 bg-[var(--accent)] rounded-full"></div>
                  <span>Policy Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <div className="w-2 h-2 bg-[var(--accent)] rounded-full"></div>
                  <span>Critical Thinking</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <div className="w-2 h-2 bg-[var(--accent)] rounded-full"></div>
                  <span>Analytical Reasoning</span>
                </div>
              </div>
            </div>
            
            <div className="max-w-3xl mx-auto mb-16">
              <div className="premium-card p-8 relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="text-center mb-6 pt-4">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                    Start Your Analysis
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Enter any complex topic, analytical question, or scenario for comprehensive multi-perspective analysis
                  </p>
                </div>
                
                <div className="relative mb-6">
                  <textarea
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    placeholder="e.g., Should AI systems be allowed to make autonomous decisions in healthcare?"
                    className="premium-textarea w-full h-32 p-5 text-base resize-none transition-all duration-200 focus:h-36"
                    style={{
                      background: 'linear-gradient(135deg, var(--input-bg) 0%, rgba(135, 187, 162, 0.02) 100%)'
                    }}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-[var(--text-secondary)]">
                    {selectedTopic.length}/500
                  </div>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={() => handleStartAnalysis()}
                    disabled={!selectedTopic.trim()}
                    className="premium-btn px-8 py-4 flex items-center gap-3 text-lg font-semibold w-full justify-center group transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                  >
                    <span>Begin Analysis</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <div className="text-center">
                    <div className="text-xs text-[var(--text-secondary)] mb-3 font-medium">
                      Or try a sample topic:
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {["AI in Healthcare", "Genetic Engineering", "Privacy vs Security"].map((topic, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedTopic(exampleTopics[index])}
                          className="px-3 py-1.5 text-xs bg-[var(--accent-light)]/20 text-[var(--accent)] rounded-full hover:bg-[var(--accent-light)]/30 transition-colors border border-[var(--accent)]/20"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  Explore Complex Debates
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  See how Lattice breaks down nuanced topics across multiple analytical frameworks
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exampleTopics.slice(0, 6).map((topic, index) => {
                  const categories = ["Healthcare Analysis", "Technology Policy", "Economic Theory", "Bioanalysis", "Corporate Law", "Digital Rights"];
                    
                  return (
                    <button
                      key={index}
                      onClick={() => handleStartAnalysis(topic)}
                      className="text-left p-5 bg-[var(--surface-elevated)] hover:bg-[var(--card-bg)] rounded-xl border border-[var(--input-border)] hover:border-[var(--accent)]/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-[var(--accent)]" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-[var(--accent)] font-medium mb-1">
                            {categories[index]}
                          </div>
                          <h4 className="text-sm font-medium text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                            {topic}
                          </h4>
                        </div>
                      </div>
                      
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-24 bg-[var(--card-bg)]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-4">
              Comprehensive Analysis Tools
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Every analysis includes multiple perspectives, visual insights, and research recommendations. 
              Experience sophisticated AI-powered reasoning across different analytical frameworks.
            </p>
          </div>

          <div className="space-y-16">
            {features.map((feature, index) => {
              const enhancedDescriptions = [
                "Examine complex topics through consequence-based, rule-based, character-based, and practical frameworks. Get nuanced insights that consider multiple stakeholder perspectives and analytical dimensions.",
                "Interactive diagrams that visualize argument structures and relationships between ideas. Export as Mermaid diagrams or view in real-time with AI-generated visual representations.",
                "AI-powered suggestions for relevant articles, papers, and resources to deepen your understanding. Curated from academic databases and trusted sources."
              ];
              
              return (
                <div key={index} className={`flex items-start gap-12 ${index % 2 === 1 ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[var(--accent)] rounded-lg flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-[var(--foreground)]">
                          {feature.title}
                        </h3>
                      </div>
                    </div>
                    
                    <p className="text-[var(--text-secondary)] leading-relaxed text-base">
                      {enhancedDescriptions[index]}
                    </p>
                    
                    <div className="flex gap-3 text-sm">
                      {[
                        ["Multi-Perspective", "Visual Mapping", "Research Discovery"][index % 3],
                        ["Consequence-Based", "Interactive", "Curated Sources"][index % 3],
                        ["Rule-Based", "Exportable", "Academic Papers"][index % 3]
                      ].filter(Boolean).map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="w-full h-80 bg-[var(--background)] rounded-xl border border-[var(--input-border)] overflow-hidden">
                      <Image
                        src={`/${['analysis', 'diagram', 'readings'][index]}.png`}
                        alt={`${feature.title} Preview`}
                        width={600}
                        height={320}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}