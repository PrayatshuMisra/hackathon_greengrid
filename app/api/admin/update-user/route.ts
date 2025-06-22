import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { userId, update } = await req.json();

  if (!userId || typeof update !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }


  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
} 