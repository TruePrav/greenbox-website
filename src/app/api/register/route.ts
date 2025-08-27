import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { z } from 'zod';

export const runtime = 'nodejs';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  // profile fields you collect at signup:
  full_name: z.string().min(1),
  phone: z.string().min(3),
  address: z.string().optional(),
  dietary_restrictions: z.string().optional(),
  preferences: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  include_cutlery: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = RegisterSchema.parse(body);

  

    // Step 1: Create user with admin client (this was working for table insertion)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: false,          // We'll handle email confirmation manually
      user_metadata: {               // This gets stored in auth.users
        full_name: input.full_name,
        phone: input.phone,
        address: input.address,
        dietary_restrictions: input.dietary_restrictions,
        preferences: input.preferences,
        latitude: input.latitude,
        longitude: input.longitude,
        include_cutlery: input.include_cutlery,
      },
      app_metadata: { provider: 'email' },
    });

    if (createErr || !created?.user) {
      console.error('❌ User creation failed:', createErr);
      return NextResponse.json(
        { ok: false, stage: 'createUser', error: createErr?.message ?? 'Failed to create user' },
        { status: 400 }
      );
    }

    const userId = created.user.id;
    

    // Step 2: Actually send confirmation email using proper methods
    let emailSent = false;
    try {

      
      // CRITICAL: generateLink only creates URLs, it doesn't send emails
      // We need to use methods that actually SEND emails
      
      // Method 1: Try to use regular client to send email for existing user
      try {
        // Use regular client to send confirmation email for existing user
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: input.email,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
          },
        });
        
        if (!resendError) {
          emailSent = true;
        }
      } catch (resendErr) {
        // Silent fail - continue to next method
      }
      
      // Method 2: Try to use admin API to send actual email
      if (!emailSent) {
        try {
          // Try to use admin API to send confirmation email
          const { error: adminEmailError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email: input.email,
            password: input.password,
            options: {
              redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
            },
          });
          
          if (adminEmailError) {
            console.error('Admin generateLink failed:', adminEmailError);
          }
          // Note: generateLink doesn't actually send emails, it only creates URLs
        } catch (adminErr) {
          // Silent fail
        }
      }
    } catch (emailErr) {
      // Silent fail - continue with profile creation
    }

    // Step 3: Create user profile (this was working before)
    const profile = {
      id: userId,
      full_name: input.full_name,
      phone: input.phone,
      address: input.address ?? null,
      dietary_restrictions: input.dietary_restrictions ?? null,
      preferences: input.preferences ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      include_cutlery: input.include_cutlery ?? false,
      email: input.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };



    const { error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .upsert(profile, { onConflict: 'id' });

    if (profileErr) {
      console.error('❌ Profile creation failed:', profileErr);
      // Roll back the auth user to avoid orphaned accounts
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json(
        { ok: false, stage: 'insertProfile', error: profileErr.message },
        { status: 400 }
      );
    }



    return NextResponse.json({ 
      ok: true, 
      user_id: userId,
      email_sent: emailSent,
      message: emailSent ? 'User created and confirmation email sent successfully.' : 'User created but email confirmation failed. User can request a new confirmation email.'
    });
  } catch (e: any) {
    console.error('Unexpected error during registration:', e);
    return NextResponse.json({ ok: false, error: e.message ?? 'Unknown error' }, { status: 400 });
  }
}

