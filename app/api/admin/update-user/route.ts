import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { userId, update } = await req.json();

    if (!userId || typeof update !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", userId)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If status is being updated, also update user_challenges
    if (update.status === 'suspended' || update.status === 'active') {
      let challengeStatusUpdate, challengeStatusError;
      if (update.status === 'suspended') {
        ({ error: challengeStatusError } = await supabase
          .from('user_challenges')
          .update({ status: 'suspended' })
          .eq('user_id', userId));
      } else if (update.status === 'active') {
        ({ error: challengeStatusError } = await supabase
          .from('user_challenges')
          .update({ status: 'active' })
          .eq('user_id', userId)
          .eq('status', 'suspended'));
      }
      if (challengeStatusError) {
        return NextResponse.json({ error: challengeStatusError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("/api/admin/update-user error:", error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
