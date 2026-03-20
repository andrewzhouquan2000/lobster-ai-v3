import { createClient } from '@/lib/supabase/server'
import type { Database, Project, Message, TeamMember } from '@/lib/types/database'
import { randomUUID } from 'crypto'

// ============================================
// Project Operations
// ============================================

export async function createProject(
  ownerId: string, 
  name: string, 
  description?: string
): Promise<Project | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      owner_id: ownerId,
      name,
      description: description || null,
      status: 'active',
      settings: {},
    })
    .select()
    .single()
  
  if (error) {
    console.error('Create project error:', error)
    return null
  }
  
  return data
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Get project error:', error)
    return null
  }
  
  return data
}

export async function getProjectsByOwner(ownerId: string): Promise<Project[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
  
  if (error) {
    console.error('Get projects error:', error)
    return []
  }
  
  return data || []
}

export async function updateProject(
  id: string, 
  updates: Partial<Project>
): Promise<Project | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Update project error:', error)
    return null
  }
  
  return data
}

export async function deleteProject(id: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('projects')
    .update({ 
      status: 'deleted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  
  return !error
}

// ============================================
// Message Operations
// ============================================

export async function createMessage(
  projectId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<Message | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      project_id: projectId,
      user_id: userId || null,
      role,
      content,
      metadata: metadata || {},
    })
    .select()
    .single()
  
  if (error) {
    console.error('Create message error:', error)
    return null
  }
  
  // Update project updated_at
  await supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId)
  
  return data
}

export async function getMessagesByProject(
  projectId: string, 
  limit = 100
): Promise<Message[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .limit(limit)
  
  if (error) {
    console.error('Get messages error:', error)
    return []
  }
  
  return data || []
}

// ============================================
// Team Member Operations
// ============================================

export async function addTeamMember(
  userId: string,
  agentId: string
): Promise<TeamMember | null> {
  const supabase = await createClient()
  
  // Check if already exists
  const { data: existing } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .single()
  
  if (existing) {
    // Already in team, just update status to active
    const { data, error } = await supabase
      .from('team_members')
      .update({ status: 'active' })
      .eq('id', existing.id)
      .select()
      .single()
    
    return error ? null : data
  }
  
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      user_id: userId,
      agent_id: agentId,
      status: 'active',
    })
    .select()
    .single()
  
  if (error) {
    console.error('Add team member error:', error)
    return null
  }
  
  return data
}

export async function removeTeamMember(
  userId: string,
  agentId: string
): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('team_members')
    .update({ status: 'removed' })
    .eq('user_id', userId)
    .eq('agent_id', agentId)
  
  return !error
}

export async function getTeamMembersByUser(userId: string): Promise<TeamMember[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('added_at', { ascending: false })
  
  if (error) {
    console.error('Get team members error:', error)
    return []
  }
  
  return data || []
}

export async function toggleTeamMemberStatus(
  userId: string,
  agentId: string,
  status: 'active' | 'inactive'
): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('team_members')
    .update({ status })
    .eq('user_id', userId)
    .eq('agent_id', agentId)
  
  return !error
}

// ============================================
// Profile Operations
// ============================================

export async function getProfile(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Get profile error:', error)
    return null
  }
  
  return data
}

export async function updateProfile(
  userId: string, 
  updates: { display_name?: string; avatar_url?: string }
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    console.error('Update profile error:', error)
    return null
  }
  
  return data
}