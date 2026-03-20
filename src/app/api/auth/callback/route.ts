import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get user and create profile if not exists
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (!profile) {
          // Create profile
          const email = user.email || ''
          const displayName = user.user_metadata?.full_name || 
                              user.user_metadata?.name || 
                              email.split('@')[0]
          const avatarUrl = user.user_metadata?.avatar_url || 
                           user.user_metadata?.picture || null
          
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email,
              display_name: displayName,
              avatar_url: avatarUrl,
            })
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`)
}