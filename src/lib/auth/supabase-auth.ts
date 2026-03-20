import { createClient } from '@/lib/supabase/server'

export interface User {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
}

/**
 * Get the current authenticated user from Supabase
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return null
    }
    
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()
    
    return {
      id: authUser.id,
      email: authUser.email || '',
      display_name: profile?.display_name || authUser.user_metadata?.full_name || null,
      avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}