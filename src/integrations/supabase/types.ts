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
      achievements: {
        Row: {
          code: string
          created_at: string
          description: string
          icon: string
          id: string
          title: string
          xp_reward: number
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          title: string
          xp_reward?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      checkout_events: {
        Row: {
          billing: string
          channel: string
          created_at: string
          id: string
          plan: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          billing: string
          channel?: string
          created_at?: string
          id?: string
          plan: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          billing?: string
          channel?: string
          created_at?: string
          id?: string
          plan?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      clan_members: {
        Row: {
          clan_id: string
          contributed_xp: number
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          clan_id: string
          contributed_xp?: number
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          contributed_xp?: number
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_messages: {
        Row: {
          clan_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          clan_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_messages_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clans: {
        Row: {
          created_at: string
          description: string | null
          emoji: string
          id: string
          member_count: number
          name: string
          owner_id: string
          tag: string
          total_xp: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          member_count?: number
          name: string
          owner_id: string
          tag: string
          total_xp?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          member_count?: number
          name?: string
          owner_id?: string
          tag?: string
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["coin_tx_kind"]
          reason: string
          ref_id: string | null
          ref_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["coin_tx_kind"]
          reason: string
          ref_id?: string | null
          ref_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["coin_tx_kind"]
          reason?: string
          ref_id?: string | null
          ref_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      companion_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      companion_prefs: {
        Row: {
          character: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          character?: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          character?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companion_skins: {
        Row: {
          available: boolean
          character: string
          code: string
          created_at: string
          description: string | null
          emoji: string
          featured: boolean
          gradient: string
          id: string
          limited: boolean
          name: string
          price_coins: number
          rarity: Database["public"]["Enums"]["skin_rarity"]
        }
        Insert: {
          available?: boolean
          character: string
          code: string
          created_at?: string
          description?: string | null
          emoji?: string
          featured?: boolean
          gradient?: string
          id?: string
          limited?: boolean
          name: string
          price_coins?: number
          rarity?: Database["public"]["Enums"]["skin_rarity"]
        }
        Update: {
          available?: boolean
          character?: string
          code?: string
          created_at?: string
          description?: string | null
          emoji?: string
          featured?: boolean
          gradient?: string
          id?: string
          limited?: boolean
          name?: string
          price_coins?: number
          rarity?: Database["public"]["Enums"]["skin_rarity"]
        }
        Relationships: []
      }
      equipped_skins: {
        Row: {
          character: string
          equipped_at: string
          skin_id: string
          user_id: string
        }
        Insert: {
          character: string
          equipped_at?: string
          skin_id: string
          user_id: string
        }
        Update: {
          character?: string
          equipped_at?: string
          skin_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipped_skins_skin_id_fkey"
            columns: ["skin_id"]
            isOneToOne: false
            referencedRelation: "companion_skins"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          coins_earned: number
          created_at: string
          duration_seconds: number | null
          game_code: string
          id: string
          score: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          coins_earned?: number
          created_at?: string
          duration_seconds?: number | null
          game_code: string
          id?: string
          score?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          coins_earned?: number
          created_at?: string
          duration_seconds?: number | null
          game_code?: string
          id?: string
          score?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      games: {
        Row: {
          category: string
          code: string
          coin_reward: number
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          sort_order: number
          status: string
          xp_reward: number
        }
        Insert: {
          category: string
          code: string
          coin_reward?: number
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          sort_order?: number
          status?: string
          xp_reward?: number
        }
        Update: {
          category?: string
          code?: string
          coin_reward?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          sort_order?: number
          status?: string
          xp_reward?: number
        }
        Relationships: []
      }
      owned_skins: {
        Row: {
          acquired_at: string
          id: string
          price_paid: number
          skin_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          price_paid?: number
          skin_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          price_paid?: number
          skin_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owned_skins_skin_id_fkey"
            columns: ["skin_id"]
            isOneToOne: false
            referencedRelation: "companion_skins"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          coins: number
          created_at: string
          full_name: string | null
          id: string
          last_activity_date: string | null
          learning_language: string
          level: number
          native_language: string
          plan: string
          streak: number
          translations_count: number
          updated_at: string
          words_count: number
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number
          created_at?: string
          full_name?: string | null
          id: string
          last_activity_date?: string | null
          learning_language?: string
          level?: number
          native_language?: string
          plan?: string
          streak?: number
          translations_count?: number
          updated_at?: string
          words_count?: number
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number
          created_at?: string
          full_name?: string | null
          id?: string
          last_activity_date?: string | null
          learning_language?: string
          level?: number
          native_language?: string
          plan?: string
          streak?: number
          translations_count?: number
          updated_at?: string
          words_count?: number
          xp?: number
        }
        Relationships: []
      }
      subscription_access_events: {
        Row: {
          created_at: string
          details: Json
          event_type: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_diagnostics: { Args: never; Returns: Json }
      companion_daily_used: { Args: { _user_id: string }; Returns: number }
      create_clan: {
        Args: {
          _description?: string
          _emoji?: string
          _name: string
          _tag: string
        }
        Returns: Json
      }
      ensure_my_account_initialized: { Args: never; Returns: Json }
      get_active_plan: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["subscription_plan"]
      }
      get_admin_users: {
        Args: never
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          id: string
          last_sign_in_at: string
          profile_created_at: string
          profile_plan: string
          user_created_at: string
        }[]
      }
      get_my_auth_diagnostics: { Args: never; Returns: Json }
      get_my_subscription_access: { Args: never; Returns: Json }
      has_plan_at_least: {
        Args: {
          _min_plan: Database["public"]["Enums"]["subscription_plan"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_clan_member: {
        Args: { _clan_id: string; _user_id: string }
        Returns: boolean
      }
      join_clan: { Args: { _clan_id: string }; Returns: Json }
      leave_clan: { Args: never; Returns: Json }
      purchase_skin: { Args: { _skin_id: string }; Returns: Json }
      submit_game_score: {
        Args: { _duration_seconds?: number; _game_code: string; _score: number }
        Returns: Json
      }
      track_subscription_access_event: {
        Args: {
          _details?: Json
          _event_type: string
          _plan: Database["public"]["Enums"]["subscription_plan"]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      coin_tx_kind: "earn" | "spend" | "refund" | "bonus"
      payment_status: "unpaid" | "pending" | "paid" | "refunded" | "failed"
      skin_rarity: "common" | "rare" | "epic" | "legendary"
      subscription_plan: "free" | "pro" | "business"
      subscription_status: "active" | "expired" | "pending" | "cancelled"
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
      app_role: ["admin", "user"],
      coin_tx_kind: ["earn", "spend", "refund", "bonus"],
      payment_status: ["unpaid", "pending", "paid", "refunded", "failed"],
      skin_rarity: ["common", "rare", "epic", "legendary"],
      subscription_plan: ["free", "pro", "business"],
      subscription_status: ["active", "expired", "pending", "cancelled"],
    },
  },
} as const
