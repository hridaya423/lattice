import { Serper } from 'serper';
import { NextRequest, NextResponse } from 'next/server';

const serper = new Serper({
  apiKey: process.env.SERPER_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!process.env.SERPER_API_KEY) {
      return NextResponse.json(
        { error: 'Serper API key not configured' },
        { status: 500 }
      );
    }

    const searchQueries = [
      `${topic} research papers academic articles`,
      `${topic} analysis opinion articles`,
      `${topic} case studies examples`,
      `${topic} analysis perspectives discussion`,
      `${topic} recent news developments`
    ];

    const allResults = [];

    for (const query of searchQueries) {
      try {
        const searchResult = await serper.search(query);

        if (searchResult && searchResult.organic && Array.isArray(searchResult.organic) && searchResult.organic.length > 0) {
          const formattedResults = searchResult.organic
            .slice(0, 3) 
            .filter(result => result && result.link && result.title) 
            .map(result => ({
              url: result.link,
              title: result.title,
              description: result.snippet || '',
            }));
          allResults.push(...formattedResults);
        }
      } catch (error) {
        console.error(`Error searching for "${query}":`, error);
      }
    }

    const uniqueResults = allResults
      .filter((result, index, self) => 
        result && result.url && index === self.findIndex(r => r && r.url === result.url)
      )
      .slice(0, 12);

    return NextResponse.json({
      results: uniqueResults,
    });
  } catch (error) {
    console.error('Error calling Serper API for readings:', error);
    return NextResponse.json(
      { error: 'Failed to search for reading suggestions' },
      { status: 500 }
    );
  }
} 