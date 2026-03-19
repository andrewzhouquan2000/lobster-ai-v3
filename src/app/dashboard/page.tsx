import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Get user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  const userData = {
    email: user.email || '',
    display_name: userProfile?.display_name || user.email?.split('@')[0] || 'User',
    avatar_url: userProfile?.avatar_url,
  }

  return <DashboardClient user={userData} initialProjects={projects || []} />
}