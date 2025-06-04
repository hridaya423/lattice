import FirecrawlApp from '@mendable/firecrawl-js';
import { NextRequest, NextResponse } from 'next/server';

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json(
        { error: 'Firecrawl API key not configured' },
        { status: 500 }
      );
    }

    const searchQueries = [
      `${topic} research papers academic articles`,
      `${topic} analysis opinion articles`,
      `${topic} case studies examples`,
      `${topic} ethics philosophy discussion`,
      `${topic} recent news developments`
    ];

    const allResults = [];

    for (const query of searchQueries) {
      try {
        const searchResult = await firecrawl.search(query, {
          limit: 3,
          lang: 'en',
          country: 'us'
        });

        if (searchResult.success && searchResult.data) {
          allResults.push(...searchResult.data);
        }
      } catch (error) {
        console.error(`Error searching for "${query}":`, error);
      }
    }

    const uniqueResults = allResults
      .filter((result, index, self) => 
        index === self.findIndex(r => r.url === result.url)
      )
      .slice(0, 12);

    return NextResponse.json({
      results: uniqueResults,
    });
  } catch (error) {
    console.error('Error calling Firecrawl API for readings:', error);
    return NextResponse.json(
      { error: 'Failed to search for reading suggestions' },
      { status: 500 }
    );
  }
} 