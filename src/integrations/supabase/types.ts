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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      actions_log: {
        Row: {
          action_type: string
          created_at: string
          credits_awarded: number
          id: string
          note: string | null
          user_id: string
          xp_awarded: number
        }
        Insert: {
          action_type: string
          created_at?: string
          credits_awarded?: number
          id?: string
          note?: string | null
          user_id: string
          xp_awarded?: number
        }
        Update: {
          action_type?: string
          created_at?: string
          credits_awarded?: number
          id?: string
          note?: string | null
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          target_id: string | null
          target_type: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          joined_at: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          joined_at?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          joined_at?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          credits_reward: number
          description: string
          description_th: string | null
          goal: number
          id: string
          title: string
          title_th: string | null
          xp_reward: number
        }
        Insert: {
          created_at?: string
          credits_reward?: number
          description: string
          description_th?: string | null
          goal?: number
          id?: string
          title: string
          title_th?: string | null
          xp_reward?: number
        }
        Update: {
          created_at?: string
          credits_reward?: number
          description?: string
          description_th?: string | null
          goal?: number
          id?: string
          title?: string
          title_th?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
      knowledge_articles: {
        Row: {
          author_id: string | null
          author_name: string
          author_role: string
          body_en: string
          body_th: string
          category: string
          cover_url: string | null
          created_at: string
          excerpt_en: string
          excerpt_th: string
          framework: string | null
          id: string
          is_published: boolean
          level: string
          published_at: string
          read_minutes: number
          slug: string
          status: string
          tags: string[]
          title_en: string
          title_th: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string
          author_role?: string
          body_en?: string
          body_th?: string
          category?: string
          cover_url?: string | null
          created_at?: string
          excerpt_en?: string
          excerpt_th?: string
          framework?: string | null
          id?: string
          is_published?: boolean
          level?: string
          published_at?: string
          read_minutes?: number
          slug: string
          status?: string
          tags?: string[]
          title_en: string
          title_th?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          author_role?: string
          body_en?: string
          body_th?: string
          category?: string
          cover_url?: string | null
          created_at?: string
          excerpt_en?: string
          excerpt_th?: string
          framework?: string | null
          id?: string
          is_published?: boolean
          level?: string
          published_at?: string
          read_minutes?: number
          slug?: string
          status?: string
          tags?: string[]
          title_en?: string
          title_th?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_upvotes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_upvotes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          body: string
          created_at: string
          id: string
          tag: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          tag?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          tag?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          carbon_credits: number
          country: string | null
          created_at: string
          display_name: string | null
          handle: string | null
          id: string
          interests: string[] | null
          is_public: boolean
          last_seen_at: string | null
          locale: string
          onboarded_at: string | null
          suspended_at: string | null
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          carbon_credits?: number
          country?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id: string
          interests?: string[] | null
          is_public?: boolean
          last_seen_at?: string | null
          locale?: string
          onboarded_at?: string | null
          suspended_at?: string | null
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          carbon_credits?: number
          country?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          interests?: string[] | null
          is_public?: boolean
          last_seen_at?: string | null
          locale?: string
          onboarded_at?: string | null
          suspended_at?: string | null
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          created_at: string
          credits_spent: number
          id: string
          reward_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_spent: number
          id?: string
          reward_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_spent?: number
          id?: string
          reward_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          category: string
          cost: number
          created_at: string
          description: string
          description_th: string | null
          icon: string
          id: string
          title: string
          title_th: string | null
        }
        Insert: {
          category?: string
          cost: number
          created_at?: string
          description: string
          description_th?: string | null
          icon?: string
          id?: string
          title: string
          title_th?: string | null
        }
        Update: {
          category?: string
          cost?: number
          created_at?: string
          description?: string
          description_th?: string | null
          icon?: string
          id?: string
          title?: string
          title_th?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_user_stats: {
        Row: {
          article_count: number | null
          avatar_url: string | null
          carbon_credits: number | null
          country: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          event_count: number | null
          handle: string | null
          id: string | null
          is_anonymous: boolean | null
          last_seen_at: string | null
          locale: string | null
          roles: Database["public"]["Enums"]["app_role"][] | null
          suspended_at: string | null
          xp: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_grant_role: {
        Args: {
          p_reason?: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      admin_revoke_role: {
        Args: {
          p_reason?: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      admin_set_suspended: {
        Args: { p_reason?: string; p_suspend: boolean; p_user_id: string }
        Returns: undefined
      }
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_action: {
        Args: {
          p_action_type: string
          p_credits: number
          p_note?: string
          p_xp: number
        }
        Returns: {
          action_type: string
          created_at: string
          credits_awarded: number
          id: string
          note: string | null
          user_id: string
          xp_awarded: number
        }
        SetofOptions: {
          from: "*"
          to: "actions_log"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      log_activity: {
        Args: {
          p_entity_id?: string
          p_entity_type?: string
          p_event_type: string
          p_metadata?: Json
        }
        Returns: string
      }
      redeem_reward: {
        Args: { p_reward_id: string }
        Returns: {
          created_at: string
          credits_spent: number
          id: string
          reward_id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "redemptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "user" | "expert" | "moderator" | "admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "expert", "moderator", "admin"],
    },
  },
} as const
