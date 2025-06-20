import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe("Supabase Events Table Tests (Rule 5)", () => {
  let insertedEventId: string;

  it("inserts a new event and retrieves it", async () => {
    const { data: insertData, error: insertError } = await supabase
      .from("events")
      .insert([
        {
          title: "Hackathon Clean-Up Drive",
          event_type: "cleanup",
          organizer_name: "GreenGrid Team",
          start_date: new Date().toISOString(),
          location_name: "Main Campus",
          latitude: 12.971598,
          longitude: 77.594566,
          city: "Bengaluru",
        },
      ])
      .select();

    expect(insertError).toBeNull();
    expect(insertData?.[0]).toHaveProperty("id");
    insertedEventId = insertData?.[0].id;
  });

  it("fetches upcoming events in Bengaluru", async () => {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, city, start_date")
      .eq("city", "Bengaluru")
      .gt("start_date", new Date().toISOString());

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    data?.forEach((e) => {
      expect(e.city).toBe("Bengaluru");
    });
  });

  it("cleans up inserted test event", async () => {
    if (!insertedEventId) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", insertedEventId);

    expect(error).toBeNull();
  });
});
