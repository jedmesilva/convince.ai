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
      users: {
        Row: {
          id: string
          username: string
          password: string
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          password: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          password?: string
          created_at?: string
        }
        Relationships: []
      }
      prize_pools: {
        Row: {
          id: number
          amount: number
          updated_at: string
        }
        Insert: {
          id?: number
          amount: number
          updated_at?: string
        }
        Update: {
          id?: number
          amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      persuasion_attempts: {
        Row: {
          id: number
          user_id: string | null
          created_at: string
          session_id: string
          status: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          created_at?: string
          session_id: string
          status?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          created_at?: string
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "persuasion_attempts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: number
          text: string
          is_user: boolean
          timestamp: string
          session_id: string
          attempt_id: number | null
        }
        Insert: {
          id?: number
          text: string
          is_user: boolean
          timestamp?: string
          session_id: string
          attempt_id?: number | null
        }
        Update: {
          id?: number
          text?: string
          is_user?: boolean
          timestamp?: string
          session_id?: string
          attempt_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_attempt_id_fkey"
            columns: ["attempt_id"]
            referencedRelation: "persuasion_attempts"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: number
          user_id: string | null
          session_id: string
          amount: number
          status: string
          method: string | null
          timestamp: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          session_id: string
          amount: number
          status: string
          method?: string | null
          timestamp?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          session_id?: string
          amount?: number
          status?: string
          method?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      persuasion_timers: {
        Row: {
          id: number
          attempt_id: number | null
          started_at: string
          duration_seconds: number
        }
        Insert: {
          id?: number
          attempt_id?: number | null
          started_at?: string
          duration_seconds?: number
        }
        Update: {
          id?: number
          attempt_id?: number | null
          started_at?: string
          duration_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "persuasion_timers_attempt_id_fkey"
            columns: ["attempt_id"]
            referencedRelation: "persuasion_attempts"
            referencedColumns: ["id"]
          }
        ]
      }
      convincing_levels: {
        Row: {
          id: number
          attempt_id: number | null
          level: number
          updated_at: string
        }
        Insert: {
          id?: number
          attempt_id?: number | null
          level?: number
          updated_at?: string
        }
        Update: {
          id?: number
          attempt_id?: number | null
          level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "convincing_levels_attempt_id_fkey"
            columns: ["attempt_id"]
            referencedRelation: "persuasion_attempts"
            referencedColumns: ["id"]
          }
        ]
      }
      withdrawals: {
        Row: {
          id: number
          user_id: string | null
          amount: number
          status: string
          method: string
          created_at: string
          session_id: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          amount: number
          status?: string
          method: string
          created_at?: string
          session_id: string
        }
        Update: {
          id?: number
          user_id?: string | null
          amount?: number
          status?: string
          method?: string
          created_at?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}