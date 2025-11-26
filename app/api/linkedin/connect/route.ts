// app/api/linkedin/connect/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { LinkedInAutomation } from '@/lib/puppeteer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, targetProfileUrl, message } = body;

    if (!accountId || !targetProfileUrl) {
      return NextResponse.json(
        { error: 'Account ID and target profile URL are required' },
        { status: 400 }
      );
    }

    // Get account credentials
    const { data: account, error: accountError } = await supabase
      .from('linkedin_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Create connection request record
    const { data: connectionRequest, error: insertError } = await supabase
      .from('connection_requests')
      .insert({
        account_id: accountId,
        target_profile_url: targetProfileUrl,
        message: message || '',
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Send connection request using Puppeteer
    const linkedin = new LinkedInAutomation();
    await linkedin.init();

    try {
      const loginSuccess = await linkedin.login({
        email: account.email,
        password: 'need-to-store-password-securely' // You'll need to handle password storage securely
      });

      if (!loginSuccess) {
        throw new Error('Failed to login to LinkedIn');
      }

      const connectionSuccess = await linkedin.sendConnectionRequest(targetProfileUrl, message);

      // Update connection request status
      await supabase
        .from('connection_requests')
        .update({
          status: connectionSuccess ? 'sent' : 'failed',
          sent_at: connectionSuccess ? new Date().toISOString() : null
        })
        .eq('id', connectionRequest.id);

      // Update account last active
      await supabase
        .from('linkedin_accounts')
        .update({ last_active: new Date().toISOString() })
        .eq('id', accountId);

      await linkedin.close();

      return NextResponse.json({
        success: connectionSuccess,
        message: connectionSuccess 
          ? 'Connection request sent successfully!' 
          : 'Failed to send connection request'
      });

    } catch (puppeteerError) {
      await linkedin.close();
      
      // Update connection request as failed
      await supabase
        .from('connection_requests')
        .update({ status: 'failed' })
        .eq('id', connectionRequest.id);

      throw puppeteerError;
    }

  } catch (error: any) {
    console.error('Error sending connection:', error);
    return NextResponse.json(
      { error: 'Failed to send connection request' },
      { status: 500 }
    );
  }
}