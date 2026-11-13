export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          agent: string
          checks: Json
          company_id: string | null
          duration_ms: number
          id: string
          output: string
          simulated: boolean
          sources_used: string[]
          started_at: string
        }
        Insert: {
          agent: string
          checks?: Json
          company_id?: string | null
          duration_ms?: number
          id?: string
          output?: string
          simulated?: boolean
          sources_used?: string[]
          started_at?: string
        }
        Update: {
          agent?: string
          checks?: Json
          company_id?: string | null
          duration_ms?: number
          id?: string
          output?: string
          simulated?: boolean
          sources_used?: string[]
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_access_state: {
        Row: {
          blocked: boolean
          id: string
          reason: string | null
        }
        Insert: {
          blocked?: boolean
          id: string
          reason?: string | null
        }
        Update: {
          blocked?: boolean
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          company_id: string | null
          content: string
          created_at: string
          guard_class: string | null
          id: string
          role: string
          sources: Json
        }
        Insert: {
          company_id?: string | null
          content: string
          created_at?: string
          guard_class?: string | null
          id?: string
          role: string
          sources?: Json
        }
        Update: {
          company_id?: string | null
          content?: string
          created_at?: string
          guard_class?: string | null
          id?: string
          role?: string
          sources?: Json
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          member_page_url: string | null
          name: string
          website_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_page_url?: string | null
          name: string
          website_url: string
        }
        Update: {
          created_at?: string
          id?: string
          member_page_url?: string | null
          name?: string
          website_url?: string
        }
        Relationships: []
      }
      company_priorities: {
        Row: {
          company_id: string
          priority: string
        }
        Insert: {
          company_id: string
          priority: string
        }
        Update: {
          company_id?: string
          priority?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_priorities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          company_id: string
          opportunity_id: string
          saved: boolean
          vote: string | null
        }
        Insert: {
          company_id: string
          opportunity_id: string
          saved?: boolean
          vote?: string | null
        }
        Update: {
          company_id?: string
          opportunity_id?: string
          saved?: boolean
          vote?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          check_first: string
          company_id: string
          created_at: string
          matched_profile_item_ids: string[]
          next_step: string
          opportunity_id: string
          reason: string
          score: number
        }
        Insert: {
          check_first: string
          company_id: string
          created_at?: string
          matched_profile_item_ids?: string[]
          next_step: string
          opportunity_id: string
          reason: string
          score: number
        }
        Update: {
          check_first?: string
          company_id?: string
          created_at?: string
          matched_profile_item_ids?: string[]
          next_step?: string
          opportunity_id?: string
          reason?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "matches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          audience: string | null
          deadline_or_date: string | null
          external_key: string
          id: string
          key_requirements: string | null
          location_mode: string
          next_step_url: string | null
          purpose: string | null
          retrieved_at: string
          simulated: boolean
          source_name: string
          source_url: string | null
          summary: string
          title: string
          type: string
        }
        Insert: {
          audience?: string | null
          deadline_or_date?: string | null
          external_key: string
          id?: string
          key_requirements?: string | null
          location_mode?: string
          next_step_url?: string | null
          purpose?: string | null
          retrieved_at?: string
          simulated?: boolean
          source_name: string
          source_url?: string | null
          summary?: string
          title: string
          type: string
        }
        Update: {
          audience?: string | null
          deadline_or_date?: string | null
          external_key?: string
          id?: string
          key_requirements?: string | null
          location_mode?: string
          next_step_url?: string | null
          purpose?: string | null
          retrieved_at?: string
          simulated?: boolean
          source_name?: string
          source_url?: string | null
          summary?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      profile_changes: {
        Row: {
          changed_at: string
          company_id: string
          field: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          changed_at?: string
          company_id: string
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          changed_at?: string
          company_id?: string
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_changes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_items: {
        Row: {
          company_id: string
          confirmed_by_user: boolean
          evidence_quote: string | null
          field: string
          id: string
          kind: string
          retrieved_at: string
          source_url: string | null
          value: string
        }
        Insert: {
          company_id: string
          confirmed_by_user?: boolean
          evidence_quote?: string | null
          field: string
          id?: string
          kind: string
          retrieved_at?: string
          source_url?: string | null
          value: string
        }
        Update: {
          company_id?: string
          confirmed_by_user?: boolean
          evidence_quote?: string | null
          field?: string
          id?: string
          kind?: string
          retrieved_at?: string
          source_url?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      source_checks: {
        Row: {
          found: number
          last_checked: string
          message: string | null
          source_name: string
          status: string
        }
        Insert: {
          found?: number
          last_checked?: string
          message?: string | null
          source_name: string
          status: string
        }
        Update: {
          found?: number
          last_checked?: string
          message?: string | null
          source_name?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      replace_generated_profile: {
        Args: { p_company_id: string; p_items: Json }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
