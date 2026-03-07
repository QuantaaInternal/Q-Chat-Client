import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/serverClient';

type ProfileRow = {
  full_name: string | null;
  avatar_url: string | null;
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle<ProfileRow>();

    const fullName =
      profile?.full_name ??
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null;
    const avatarUrl =
      profile?.avatar_url ??
      (user.user_metadata?.avatar_url as string | undefined) ??
      null;

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email ?? null,
          fullName,
          avatarUrl,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

