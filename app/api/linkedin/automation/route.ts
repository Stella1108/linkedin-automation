import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, views_per_day, messages_per_day, connections_per_day } = body;

    console.log('⚡ Updating automation settings for account:', accountId);

    // Validate required fields
    if (!accountId || views_per_day === undefined || messages_per_day === undefined || connections_per_day === undefined) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate limits
    if (views_per_day > 100 || messages_per_day > 50 || connections_per_day > 30) {
      return NextResponse.json(
        { error: 'Daily limits exceeded maximum allowed values' },
        { status: 400 }
      );
    }

    // Update automation settings in database
    const { data: updatedAccount, error: updateError } = await supabase
      .from('linkedin_accounts')
      .update({
        automation_settings: {
          views_per_day,
          messages_per_day,
          connections_per_day
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update automation settings' },
        { status: 500 }
      );
    }

    console.log('✅ Automation settings updated successfully for:', accountId);

    return NextResponse.json({
      account: updatedAccount,
      message: 'Automation settings updated successfully!'
    });

  } catch (error: any) {
    console.error('❌ Unexpected error in automation settings:', error);
    return NextResponse.json(
      { error: `Failed to update settings: ${error.message}` },
      { status: 500 }
    );
  }
}