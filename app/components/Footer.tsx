'use client';

import { Github } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--card-bg)] border-t border-[var(--input-border)] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center overflow-hidden">
                <Image 
                  src="/logo.png" 
                  alt="Lattice Logo" 
                  width={20} 
                  height={20}
                  className="object-contain"
                />
              </div>
              <span className="premium-header text-lg">Lattice</span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4 max-w-md">
              Professional multi-perspective analysis platform for complex topics. 
              Examine complex scenarios and debates through systematic frameworks.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="#" 
                className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                title="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--foreground)] text-sm mb-4">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/analyze" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  Analyze
                </Link>
              </li>
             
            </ul>
          </div>


        </div>

        <div className="mt-8 pt-8 border-t border-[var(--input-border)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-[var(--text-secondary)]">
              Built with ❤️ by Hridya
          </div>
         
        </div>
      </div>
    </footer>
  );
}