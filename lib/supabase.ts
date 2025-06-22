import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://lenuuxzhvadftlfbozox.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbnV1eHpodmFkZnRsZmJvem94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMzNjIsImV4cCI6MjA2NTU0OTM2Mn0.YOVr0cGaVyp7APpi4QkimMFjT6DZmyBlNuZMed3STN8"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User Challenge Management Functions
export async function enrollUserInChallenge(userId: string, challengeId: string) {
  try {
    const { data, error } = await supabase
      .from('user_challenges')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        status: 'active',
        progress: 0,
        points_earned: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error enrolling user in challenge:', error)
    return { success: false, error }
  }
}

export async function getUserChallenges(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_challenges')
      .select(`
        *,
        challenge:challenges(
          id,
          title,
          description,
          points,
          difficulty,
          challenge_type,
          duration_days,
          category_id,
          challenge_category:challenge_categories(name, icon, color)
        )
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching user challenges:', error)
    return { success: false, error, data: [] }
  }
}

export async function updateUserPoints(userId: string, pointsToAdd: number) {
  try {
    // First get current user points
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('total_points, level')
      .eq('id', userId)
      .single()

    if (fetchError) throw fetchError

    const newTotalPoints = (currentUser?.total_points || 0) + pointsToAdd
    const newLevel = Math.floor(newTotalPoints / 1000) + 1 // Level up every 1000 points

    // Update user points and level
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        total_points: newTotalPoints,
        level: newLevel
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data, pointsAdded: pointsToAdd, newLevel }
  } catch (error) {
    console.error('Error updating user points:', error)
    return { success: false, error }
  }
}

export async function updateChallengeProgress(userChallengeId: string, progress: number, pointsEarned: number = 0) {
  try {
    const updateData: any = { progress }
    
    if (pointsEarned > 0) {
      updateData.points_earned = pointsEarned
    }
    
    if (progress >= 100) {
      updateData.status = 'completed'
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('user_challenges')
      .update(updateData)
      .eq('id', userChallengeId)
      .select()
      .single()

    if (error) throw error

    // If challenge is completed and points are earned, update user's total points
    if (progress >= 100 && pointsEarned > 0 && data) {
      await updateUserPoints(data.user_id, pointsEarned)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error updating challenge progress:', error)
    return { success: false, error }
  }
}

export async function awardBadgeToUser(userId: string, badgeId: string, challengeId?: string) {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        challenge_id: challengeId,
        earned_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error awarding badge:', error)
    return { success: false, error }
  }
}

export async function getUserBadges(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(
          id,
          name,
          description,
          icon,
          rarity,
          points_required
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching user badges:', error)
    return { success: false, error, data: [] }
  }
}

export async function getAvailableChallenges() {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        challenge_category:challenge_categories(name, icon, color)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching available challenges:', error)
    return { success: false, error, data: [] }
  }
}

export async function checkUserEnrollment(userId: string, challengeId: string) {
  try {
    const { data, error } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { success: true, enrolled: !!data, data }
  } catch (error) {
    console.error('Error checking user enrollment:', error)
    return { success: false, error, enrolled: false }
  }
}
