export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          status: string
          settings: Json
          openclaw_session_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          status?: string
          settings?: Json
          openclaw_session_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          description?: string | null
          status?: string
          settings?: Json
          openclaw_session_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          status: string
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          status?: string
          added_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          status?: string
          added_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          project_id: string
          user_id: string | null
          role: string
          content: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id?: string | null
          role: string
          content: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string | null
          role?: string
          content?: string
          metadata?: Json
          created_at?: string
        }
      }
      tokens: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          key_encrypted: string
          status: string
          last_used_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          key_encrypted: string
          status?: string
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          key_encrypted?: string
          status?: string
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          token_id: string | null
          provider: string
          model: string | null
          input_tokens: number
          output_tokens: number
          total_tokens: number
          cost_usd: number
          request_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token_id?: string | null
          provider: string
          model?: string | null
          input_tokens?: number
          output_tokens?: number
          total_tokens?: number
          cost_usd?: number
          request_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token_id?: string | null
          provider?: string
          model?: string | null
          input_tokens?: number
          output_tokens?: number
          total_tokens?: number
          cost_usd?: number
          request_type?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type TeamMember = Database['public']['Tables']['team_members']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Token = Database['public']['Tables']['tokens']['Row']
export type UsageLog = Database['public']['Tables']['usage_logs']['Row']

// 新增类型定义
export interface Skill {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  permissions: string[];
}

export interface AgentSkill {
  id: string;
  agent_id: string;
  skill_id: string;
  granted_at: string;
}

export interface Resource {
  id: string;
  user_id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}