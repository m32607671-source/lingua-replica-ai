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
      achievement_progress: {
        Row: {
          achievement_id: string
          completed: boolean
          progress: number
          target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          completed?: boolean
          progress?: number
          target?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          completed?: boolean
          progress?: number
          target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_progress_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          category: string
          code: string
          coin_reward: number
          condition_target: number | null
          condition_type: string | null
          created_at: string
          description: string
          hidden: boolean
          icon: string
          id: string
          rarity: Database["public"]["Enums"]["cosmetic_rarity"]
          title: string
          title_reward: string | null
          xp_reward: number
        }
        Insert: {
          category?: string
          code: string
          coin_reward?: number
          condition_target?: number | null
          condition_type?: string | null
          created_at?: string
          description: string
          hidden?: boolean
          icon?: string
          id?: string
          rarity?: Database["public"]["Enums"]["cosmetic_rarity"]
          title: string
          title_reward?: string | null
          xp_reward?: number
        }
        Update: {
          category?: string
          code?: string
          coin_reward?: number
          condition_target?: number | null
          condition_type?: string | null
          created_at?: string
          description?: string
          hidden?: boolean
          icon?: string
          id?: string
          rarity?: Database["public"]["Enums"]["cosmetic_rarity"]
          title?: string
          title_reward?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
      challenge_progress: {
        Row: {
          challenge_id: string
          claimed: boolean
          completed: boolean
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          claimed?: boolean
          completed?: boolean
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          claimed?: boolean
          completed?: boolean
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          active: boolean
          code: string
          coin_reward: number
          cosmetic_reward_id: string | null
          created_at: string
          description: string
          ends_at: string
          id: string
          kind: Database["public"]["Enums"]["challenge_kind"]
          metric: string
          starts_at: string
          target: number
          title: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          code: string
          coin_reward?: number
          cosmetic_reward_id?: string | null
          created_at?: string
          description: string
          ends_at: string
          id?: string
          kind: Database["public"]["Enums"]["challenge_kind"]
          metric: string
          starts_at: string
          target: number
          title: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          code?: string
          coin_reward?: number
          cosmetic_reward_id?: string | null
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["challenge_kind"]
          metric?: string
          starts_at?: string
          target?: number
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
      clan_war_contributions: {
        Row: {
          clan_id: string
          contributions: number
          id: string
          score: number
          updated_at: string
          user_id: string
          war_id: string
        }
        Insert: {
          clan_id: string
          contributions?: number
          id?: string
          score?: number
          updated_at?: string
          user_id: string
          war_id: string
        }
        Update: {
          clan_id?: string
          contributions?: number
          id?: string
          score?: number
          updated_at?: string
          user_id?: string
          war_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_war_contributions_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_war_contributions_war_id_fkey"
            columns: ["war_id"]
            isOneToOne: false
            referencedRelation: "clan_wars"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_wars: {
        Row: {
          clan_a: string
          clan_b: string
          coin_pool: number
          created_at: string
          ends_at: string
          id: string
          score_a: number
          score_b: number
          starts_at: string
          status: Database["public"]["Enums"]["clan_war_status"]
          trophy_reward: number
          updated_at: string
          winner_clan: string | null
        }
        Insert: {
          clan_a: string
          clan_b: string
          coin_pool?: number
          created_at?: string
          ends_at: string
          id?: string
          score_a?: number
          score_b?: number
          starts_at: string
          status?: Database["public"]["Enums"]["clan_war_status"]
          trophy_reward?: number
          updated_at?: string
          winner_clan?: string | null
        }
        Update: {
          clan_a?: string
          clan_b?: string
          coin_pool?: number
          created_at?: string
          ends_at?: string
          id?: string
          score_a?: number
          score_b?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["clan_war_status"]
          trophy_reward?: number
          updated_at?: string
          winner_clan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clan_wars_clan_a_fkey"
            columns: ["clan_a"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_wars_clan_b_fkey"
            columns: ["clan_b"]
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
          trophies: number
          updated_at: string
          wars_played: number
          wars_won: number
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
          trophies?: number
          updated_at?: string
          wars_played?: number
          wars_won?: number
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
          trophies?: number
          updated_at?: string
          wars_played?: number
          wars_won?: number
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
      cosmetics: {
        Row: {
          available: boolean
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          metadata: Json
          name: string
          preview_url: string | null
          price_coins: number | null
          rarity: Database["public"]["Enums"]["cosmetic_rarity"]
          type: Database["public"]["Enums"]["cosmetic_type"]
          unlock_ref: string | null
          unlock_via: string | null
        }
        Insert: {
          available?: boolean
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json
          name: string
          preview_url?: string | null
          price_coins?: number | null
          rarity?: Database["public"]["Enums"]["cosmetic_rarity"]
          type: Database["public"]["Enums"]["cosmetic_type"]
          unlock_ref?: string | null
          unlock_via?: string | null
        }
        Update: {
          available?: boolean
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json
          name?: string
          preview_url?: string | null
          price_coins?: number | null
          rarity?: Database["public"]["Enums"]["cosmetic_rarity"]
          type?: Database["public"]["Enums"]["cosmetic_type"]
          unlock_ref?: string | null
          unlock_via?: string | null
        }
        Relationships: []
      }
      daily_streaks: {
        Row: {
          current_streak: number
          freezes_available: number
          last_active_date: string | null
          longest_streak: number
          milestones_claimed: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          freezes_available?: number
          last_active_date?: string | null
          longest_streak?: number
          milestones_claimed?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          freezes_available?: number
          last_active_date?: string | null
          longest_streak?: number
          milestones_claimed?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      equipped_cosmetics: {
        Row: {
          cosmetic_id: string
          equipped_at: string
          type: Database["public"]["Enums"]["cosmetic_type"]
          user_id: string
        }
        Insert: {
          cosmetic_id: string
          equipped_at?: string
          type: Database["public"]["Enums"]["cosmetic_type"]
          user_id: string
        }
        Update: {
          cosmetic_id?: string
          equipped_at?: string
          type?: Database["public"]["Enums"]["cosmetic_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipped_cosmetics_cosmetic_id_fkey"
            columns: ["cosmetic_id"]
            isOneToOne: false
            referencedRelation: "cosmetics"
            referencedColumns: ["id"]
          },
        ]
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
      events: {
        Row: {
          active: boolean
          banner_color: string | null
          code: string
          coin_multiplier: number
          created_at: string
          description: string | null
          ends_at: string
          id: string
          name: string
          starts_at: string
          xp_multiplier: number
        }
        Insert: {
          active?: boolean
          banner_color?: string | null
          code: string
          coin_multiplier?: number
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          name: string
          starts_at: string
          xp_multiplier?: number
        }
        Update: {
          active?: boolean
          banner_color?: string | null
          code?: string
          coin_multiplier?: number
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          name?: string
          starts_at?: string
          xp_multiplier?: number
        }
        Relationships: []
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
      owned_cosmetics: {
        Row: {
          acquired_at: string
          acquired_via: string | null
          cosmetic_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          acquired_via?: string | null
          cosmetic_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          acquired_via?: string | null
          cosmetic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owned_cosmetics_cosmetic_id_fkey"
            columns: ["cosmetic_id"]
            isOneToOne: false
            referencedRelation: "cosmetics"
            referencedColumns: ["id"]
          },
        ]
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
          country: string | null
          created_at: string
          equipped_title: string | null
          full_name: string | null
          id: string
          last_activity_date: string | null
          learning_language: string
          level: number
          native_language: string
          plan: string
          rank_points: number
          rank_tier: string
          streak: number
          total_games: number
          total_wins: number
          translations_count: number
          updated_at: string
          words_count: number
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number
          country?: string | null
          created_at?: string
          equipped_title?: string | null
          full_name?: string | null
          id: string
          last_activity_date?: string | null
          learning_language?: string
          level?: number
          native_language?: string
          plan?: string
          rank_points?: number
          rank_tier?: string
          streak?: number
          total_games?: number
          total_wins?: number
          translations_count?: number
          updated_at?: string
          words_count?: number
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number
          country?: string | null
          created_at?: string
          equipped_title?: string | null
          full_name?: string | null
          id?: string
          last_activity_date?: string | null
          learning_language?: string
          level?: number
          native_language?: string
          plan?: string
          rank_points?: number
          rank_tier?: string
          streak?: number
          total_games?: number
          total_wins?: number
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
      team_activity: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          team_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          team_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_chat_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_glossary: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          source_language: string
          target_language: string
          team_id: string
          term: string
          translation: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          source_language?: string
          target_language?: string
          team_id: string
          term: string
          translation: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          source_language?: string
          target_language?: string
          team_id?: string
          term?: string
          translation?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_glossary_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          joined_at: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_project_assignments: {
        Row: {
          assigned_at: string
          assignment_role: Database["public"]["Enums"]["team_assignment_role"]
          project_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assignment_role: Database["public"]["Enums"]["team_assignment_role"]
          project_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assignment_role?: Database["public"]["Enums"]["team_assignment_role"]
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "team_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_projects: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          progress: number
          source_language: string
          status: Database["public"]["Enums"]["team_project_status"]
          target_language: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          progress?: number
          source_language?: string
          status?: Database["public"]["Enums"]["team_project_status"]
          target_language?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          progress?: number
          source_language?: string
          status?: Database["public"]["Enums"]["team_project_status"]
          target_language?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          emoji: string
          id: string
          invite_code: string
          member_count: number
          name: string
          owner_id: string
          project_count: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          invite_code?: string
          member_count?: number
          name: string
          owner_id: string
          project_count?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          invite_code?: string
          member_count?: number
          name?: string
          owner_id?: string
          project_count?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          final_rank: number | null
          games_played: number
          id: string
          joined_at: string
          rewards_claimed: boolean
          score: number
          tournament_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          final_rank?: number | null
          games_played?: number
          id?: string
          joined_at?: string
          rewards_claimed?: boolean
          score?: number
          tournament_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          final_rank?: number | null
          games_played?: number
          id?: string
          joined_at?: string
          rewards_claimed?: boolean
          score?: number
          tournament_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          coin_pool: number
          cosmetic_reward_id: string | null
          created_at: string
          description: string | null
          ends_at: string
          entry_cost: number
          game_code: string | null
          id: string
          kind: Database["public"]["Enums"]["challenge_kind"]
          max_participants: number | null
          name: string
          participant_count: number
          starts_at: string
          status: Database["public"]["Enums"]["tournament_status"]
          updated_at: string
          xp_pool: number
        }
        Insert: {
          coin_pool?: number
          cosmetic_reward_id?: string | null
          created_at?: string
          description?: string | null
          ends_at: string
          entry_cost?: number
          game_code?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["challenge_kind"]
          max_participants?: number | null
          name: string
          participant_count?: number
          starts_at: string
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
          xp_pool?: number
        }
        Update: {
          coin_pool?: number
          cosmetic_reward_id?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string
          entry_cost?: number
          game_code?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["challenge_kind"]
          max_participants?: number | null
          name?: string
          participant_count?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
          xp_pool?: number
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
      xp_transactions: {
        Row: {
          accuracy_bonus: number
          amount: number
          base_xp: number
          combo_bonus: number
          created_at: string
          difficulty_mult: number
          id: string
          notes: string | null
          ref_id: string | null
          ref_type: string | null
          source: Database["public"]["Enums"]["xp_source"]
          streak_bonus: number
          user_id: string
        }
        Insert: {
          accuracy_bonus?: number
          amount: number
          base_xp?: number
          combo_bonus?: number
          created_at?: string
          difficulty_mult?: number
          id?: string
          notes?: string | null
          ref_id?: string | null
          ref_type?: string | null
          source: Database["public"]["Enums"]["xp_source"]
          streak_bonus?: number
          user_id: string
        }
        Update: {
          accuracy_bonus?: number
          amount?: number
          base_xp?: number
          combo_bonus?: number
          created_at?: string
          difficulty_mult?: number
          id?: string
          notes?: string | null
          ref_id?: string | null
          ref_type?: string | null
          source?: Database["public"]["Enums"]["xp_source"]
          streak_bonus?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _team_limits: {
        Args: { _plan: Database["public"]["Enums"]["subscription_plan"] }
        Returns: {
          max_members: number
          max_projects: number
          max_teams: number
        }[]
      }
      admin_diagnostics: { Args: never; Returns: Json }
      assign_project_member: {
        Args: {
          _project_id: string
          _role: Database["public"]["Enums"]["team_assignment_role"]
          _user_id: string
        }
        Returns: Json
      }
      award_xp: {
        Args: {
          _accuracy?: number
          _base: number
          _combo?: number
          _difficulty?: number
          _ref_id?: string
          _ref_type?: string
          _source: Database["public"]["Enums"]["xp_source"]
          _streak_bonus?: number
          _user: string
        }
        Returns: number
      }
      can_manage_team: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      claim_challenge_reward: { Args: { _challenge_id: string }; Returns: Json }
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
      create_team: {
        Args: { _description?: string; _emoji?: string; _name: string }
        Returns: Json
      }
      create_team_project: {
        Args: {
          _description?: string
          _name: string
          _source_language?: string
          _target_language?: string
          _team_id: string
        }
        Returns: Json
      }
      ensure_my_account_initialized: { Args: never; Returns: Json }
      equip_cosmetic: { Args: { _cosmetic_id: string }; Returns: Json }
      evaluate_achievements: { Args: { _user: string }; Returns: Json }
      finalize_clan_war: { Args: { _war_id: string }; Returns: Json }
      finalize_tournament: { Args: { _tid: string }; Returns: Json }
      get_active_event_multipliers: {
        Args: never
        Returns: {
          coin_mult: number
          xp_mult: number
        }[]
      }
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
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      join_clan: { Args: { _clan_id: string }; Returns: Json }
      join_team_by_code: { Args: { _code: string }; Returns: Json }
      join_tournament: { Args: { _tid: string }; Returns: Json }
      leaderboard_global: {
        Args: {
          _country?: string
          _language?: string
          _limit?: number
          _metric?: string
        }
        Returns: {
          avatar_url: string
          coins: number
          country: string
          equipped_title: string
          full_name: string
          learning_language: string
          level: number
          rank: number
          rank_points: number
          rank_tier: string
          total_wins: number
          user_id: string
          xp: number
        }[]
      }
      leave_clan: { Args: never; Returns: Json }
      leave_team: { Args: { _team_id: string }; Returns: Json }
      level_for_xp: { Args: { _xp: number }; Returns: number }
      level_tier: { Args: { _level: number }; Returns: string }
      purchase_cosmetic: { Args: { _cosmetic_id: string }; Returns: Json }
      purchase_skin: { Args: { _skin_id: string }; Returns: Json }
      rank_tier_for_points: { Args: { _pts: number }; Returns: string }
      regenerate_team_invite_code: { Args: { _team_id: string }; Returns: Json }
      remove_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: Json
      }
      start_clan_war: {
        Args: { _clan_a: string; _clan_b: string; _minutes?: number }
        Returns: Json
      }
      submit_game_score: {
        Args: { _duration_seconds?: number; _game_code: string; _score: number }
        Returns: Json
      }
      submit_game_score_v2: {
        Args: {
          _accuracy?: number
          _combo?: number
          _difficulty?: string
          _duration?: number
          _game_code: string
          _score: number
          _won?: boolean
        }
        Returns: Json
      }
      team_member_role: {
        Args: { _team_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["team_role"]
      }
      tick_challenges: {
        Args: { _delta: number; _metric: string; _user: string }
        Returns: undefined
      }
      track_subscription_access_event: {
        Args: {
          _details?: Json
          _event_type: string
          _plan: Database["public"]["Enums"]["subscription_plan"]
        }
        Returns: undefined
      }
      update_daily_streak: { Args: { _user: string }; Returns: Json }
      update_team_member_role: {
        Args: {
          _role: Database["public"]["Enums"]["team_role"]
          _team_id: string
          _user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      challenge_kind: "daily" | "weekly" | "monthly"
      clan_war_status: "scheduled" | "active" | "completed"
      coin_tx_kind: "earn" | "spend" | "refund" | "bonus"
      cosmetic_rarity: "common" | "rare" | "epic" | "legendary" | "mythic"
      cosmetic_type:
        | "character_skin"
        | "companion_skin"
        | "frame"
        | "title"
        | "badge"
        | "accessory"
      payment_status: "unpaid" | "pending" | "paid" | "refunded" | "failed"
      skin_rarity: "common" | "rare" | "epic" | "legendary"
      subscription_plan: "free" | "pro" | "business"
      subscription_status: "active" | "expired" | "pending" | "cancelled"
      team_assignment_role: "translator" | "reviewer"
      team_project_status:
        | "draft"
        | "active"
        | "review"
        | "completed"
        | "archived"
      team_role:
        | "owner"
        | "admin"
        | "manager"
        | "translator"
        | "reviewer"
        | "viewer"
      tournament_status: "scheduled" | "active" | "completed" | "cancelled"
      xp_source:
        | "game"
        | "win"
        | "challenge"
        | "achievement"
        | "daily_login"
        | "streak"
        | "clan_war"
        | "tournament"
        | "event"
        | "companion"
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
      challenge_kind: ["daily", "weekly", "monthly"],
      clan_war_status: ["scheduled", "active", "completed"],
      coin_tx_kind: ["earn", "spend", "refund", "bonus"],
      cosmetic_rarity: ["common", "rare", "epic", "legendary", "mythic"],
      cosmetic_type: [
        "character_skin",
        "companion_skin",
        "frame",
        "title",
        "badge",
        "accessory",
      ],
      payment_status: ["unpaid", "pending", "paid", "refunded", "failed"],
      skin_rarity: ["common", "rare", "epic", "legendary"],
      subscription_plan: ["free", "pro", "business"],
      subscription_status: ["active", "expired", "pending", "cancelled"],
      team_assignment_role: ["translator", "reviewer"],
      team_project_status: [
        "draft",
        "active",
        "review",
        "completed",
        "archived",
      ],
      team_role: [
        "owner",
        "admin",
        "manager",
        "translator",
        "reviewer",
        "viewer",
      ],
      tournament_status: ["scheduled", "active", "completed", "cancelled"],
      xp_source: [
        "game",
        "win",
        "challenge",
        "achievement",
        "daily_login",
        "streak",
        "clan_war",
        "tournament",
        "event",
        "companion",
      ],
    },
  },
} as const
