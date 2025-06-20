import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe("Supabase Backend Test (Rule 5)", () => {
  const testTitle = "Test Challenge";

  it("inserts and deletes test challenge safely", async () => {
    const { data: insertData, error: insertError } = await supabase
      .from("challenges")
      .insert([
        {
          title: testTitle,
          description: "Inserted via test",
          points: 50,
          challenge_type: "test",
        },
      ])
      .select();

    expect(insertError).toBeNull();
    expect(insertData?.[0].title).toBe(testTitle);

    const insertedId = insertData?.[0]?.id;

    if (insertedId) {
      const { error: deleteError } = await supabase
        .from("challenges")
        .delete()
        .eq("id", insertedId);

      expect(deleteError).toBeNull();
    }
  });
});
