import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

describe("Supabase Profiles Table Test (Rule 5)", () => {
  let authUserId: string
  const testEmail = `testuser-${Date.now()}@example.com`

  beforeAll(async () => {
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: "TestPassword123!",
      email_confirm: true,
    })

    if (error || !data.user) {
      throw new Error("Failed to create test auth user: " + error?.message)
    }

    authUserId = data.user.id
  })

  afterAll(async () => {
    if (authUserId) {
      await supabase.auth.admin.deleteUser(authUserId)
      await supabase.from("profiles").delete().eq("id", authUserId)
    }
  })

  it("inserts and fetches a profile", async () => {
    const { data: insertData, error: insertError } = await supabase
      .from("profiles")
      .insert([
        {
          id: authUserId,
          email: testEmail,
          name: "Test User",
          total_points: 50,
        },
      ])
      .select()

    expect(insertError).toBeNull()
    expect(insertData?.[0].email).toBe(testEmail)
  })
})
