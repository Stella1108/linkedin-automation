// app/api/linkedin/scrape/route.ts
import { NextResponse } from 'next/server';
import { LinkedInScraper, ScrapingResult } from '@/lib/linkedin-scraper';

// ⭐ Use Node.js runtime for Puppeteer
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    console.log('🎯 Starting REAL LinkedIn scraping for:', email);

    const scraper = new LinkedInScraper();
    
    try {
      await scraper.init();
      const result: ScrapingResult = await scraper.scrapeLinkedInProfile(email, password, fullName);

      if (result.success && result.profile) {
        console.log('✅ REAL LinkedIn data scraped successfully:', {
          name: result.profile.fullName,
          connections: result.profile.connections,
          location: result.profile.location
        });

        return NextResponse.json({
          success: true,
          profile: result.profile,
          message: `Successfully scraped LinkedIn profile! Found ${result.profile.connections} connections.`
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'Scraping failed'
        }, { status: 400 });
      }

    } catch (scrapingError) {
      console.error('Scraping process error:', scrapingError);
      return NextResponse.json({
        success: false,
        error: 'Scraping process failed'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}