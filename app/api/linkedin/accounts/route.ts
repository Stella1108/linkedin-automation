import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { LinkedInConnector } from '@/lib/linkedin-connector';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let connector: LinkedInConnector | null = null;
  
  try {
    const body = await request.json();
    const { fullName, email, location } = body;

    console.log('🚀 Starting manual LinkedIn connection for:', email);

    // Validate required fields
    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('linkedin_accounts')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAccount) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    console.log('🔐 Starting LinkedIn manual login flow...');
    
    connector = new LinkedInConnector();
    
    // Start manual login flow
    console.log('📝 Calling startManualLoginFlow...');
    const connectionResult = await connector.startManualLoginFlow({
      fullName,
      email,
      location: location || ''
    });

    console.log('📊 Connection result:', connectionResult);

    if (!connectionResult.success) {
      console.error('❌ LinkedIn connection failed:', connectionResult.error);
      return NextResponse.json(
        { 
          error: connectionResult.error || 'LinkedIn connection failed. Please try again.' 
        },
        { status: 400 }
      );
    }

    console.log('✅ LinkedIn connection successful, creating account record...');

    // Create account record with user-provided data only
    const { data: newAccount, error: insertError } = await supabase
      .from('linkedin_accounts')
      .insert({
        full_name: fullName.trim(),
        email: email.toLowerCase().trim(),
        profile_url: `https://linkedin.com/in/${fullName.toLowerCase().replace(/\s+/g, '-')}`,
        location: location?.trim() || '',
        status: 'connected',
        connection_status: 'active',
        last_active: new Date().toISOString(),
        connected_at: new Date().toISOString(),
        automation_settings: {
          views_per_day: 10,
          messages_per_day: 5,
          connections_per_day: 15
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create account record' },
        { status: 500 }
      );
    }

    console.log('🎉 LinkedIn account connected successfully for:', email);

    return NextResponse.json({
      account: newAccount,
      message: 'LinkedIn account connected successfully!'
    });

  } catch (error: any) {
    console.error('❌ Unexpected error in LinkedIn connection:', error);
    return NextResponse.json(
      { error: `Connection failed: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (connector) {
      await connector.close();
    }
  }
}

export async function GET(request: Request) {
  try {
    console.log('📥 Fetching LinkedIn accounts...');
    
    const { data: accounts, error } = await supabase
      .from('linkedin_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully fetched ${accounts?.length || 0} accounts`);
    return NextResponse.json(accounts || []);

  } catch (error: any) {
    console.error('❌ Unexpected error fetching accounts:', error);
    return NextResponse.json(
      { error: `Failed to fetch accounts: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');

    console.log('🗑️ Request to delete account:', accountId);

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // First, check if the account exists
    const { data: existingAccount, error: fetchError } = await supabase
      .from('linkedin_accounts')
      .select('id, full_name')
      .eq('id', accountId)
      .single();

    if (fetchError || !existingAccount) {
      console.error('Account not found:', accountId);
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    console.log(`🗑️ Deleting account: ${existingAccount.full_name} (${accountId})`);

    // Delete the account
    const { error: deleteError } = await supabase
      .from('linkedin_accounts')
      .delete()
      .eq('id', accountId);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      );
    }

    console.log('✅ Account deleted successfully:', accountId);

    return NextResponse.json({
      message: 'Account deleted successfully!'
    });

  } catch (error: any) {
    console.error('❌ Unexpected error in account deletion:', error);
    return NextResponse.json(
      { error: `Deletion failed: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, fullName, email, location, status } = body;

    console.log('✏️ Request to update account:', id);

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Check if account exists
    const { data: existingAccount, error: fetchError } = await supabase
      .from('linkedin_accounts')
      .select('id, full_name')
      .eq('id', id)
      .single();

    if (fetchError || !existingAccount) {
      console.error('Account not found for update:', id);
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    console.log(`✏️ Updating account: ${existingAccount.full_name} (${id})`);

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (fullName !== undefined) {
      updateData.full_name = fullName.trim();
      console.log('📝 Updating full name');
    }
    
    if (email !== undefined) {
      // Validate email if provided
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }
      updateData.email = email.toLowerCase().trim();
      console.log('📝 Updating email');
    }
    
    if (location !== undefined) {
      updateData.location = location.trim();
      console.log('📝 Updating location');
    }
    
    if (status !== undefined) {
      updateData.status = status;
      console.log('📝 Updating status:', status);
    }

    // Update account
    const { data: updatedAccount, error: updateError } = await supabase
      .from('linkedin_accounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update account' },
        { status: 500 }
      );
    }

    console.log('✅ Account updated successfully:', id);

    return NextResponse.json({
      account: updatedAccount,
      message: 'Account updated successfully!'
    });

  } catch (error: any) {
    console.error('❌ Unexpected error in account update:', error);
    return NextResponse.json(
      { error: `Update failed: ${error.message}` },
      { status: 500 }
    );
  }
}