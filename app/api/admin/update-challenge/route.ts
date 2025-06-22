import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { action, data, id } = await req.json();

  if (!action || typeof data !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (action === "create") {
    const { data: result, error } = await supabase
      .from("challenges")
      .insert([data])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: result });
  }

  if (action === "update") {
    if (!id) {
      return NextResponse.json({ error: "Missing challenge id for update" }, { status: 400 });
    }

    const { data: result, error } = await supabase
      .from("challenges")
      .update(data)
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: result });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
