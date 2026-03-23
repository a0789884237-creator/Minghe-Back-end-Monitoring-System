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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      assessment_results: {
        Row: {
          ai_summary: string | null
          answers: Json
          created_at: string
          health_report: Json | null
          id: string
          max_score: number
          scale_type: string
          severity: string
          total_score: number
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          answers?: Json
          created_at?: string
          health_report?: Json | null
          id?: string
          max_score?: number
          scale_type?: string
          severity?: string
          total_score?: number
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          answers?: Json
          created_at?: string
          health_report?: Json | null
          id?: string
          max_score?: number
          scale_type?: string
          severity?: string
          total_score?: number
          user_id?: string
        }
        Relationships: []
      }
      case_formulations: {
        Row: {
          automatic_thoughts: string[] | null
          behaviors: string[] | null
          core_beliefs: string[] | null
          created_at: string
          current_stage: string
          emotions: string[] | null
          id: string
          maintaining_factors: string[] | null
          presenting_problems: string[] | null
          progress_notes: string | null
          protective_factors: string[] | null
          risk_level: string | null
          session_count: number
          therapy_goals: string[] | null
          triggering_factors: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          automatic_thoughts?: string[] | null
          behaviors?: string[] | null
          core_beliefs?: string[] | null
          created_at?: string
          current_stage?: string
          emotions?: string[] | null
          id?: string
          maintaining_factors?: string[] | null
          presenting_problems?: string[] | null
          progress_notes?: string | null
          protective_factors?: string[] | null
          risk_level?: string | null
          session_count?: number
          therapy_goals?: string[] | null
          triggering_factors?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          automatic_thoughts?: string[] | null
          behaviors?: string[] | null
          core_beliefs?: string[] | null
          created_at?: string
          current_stage?: string
          emotions?: string[] | null
          id?: string
          maintaining_factors?: string[] | null
          presenting_problems?: string[] | null
          progress_notes?: string | null
          protective_factors?: string[] | null
          risk_level?: string | null
          session_count?: number
          therapy_goals?: string[] | null
          triggering_factors?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_feedback: {
        Row: {
          conversation_id: string | null
          created_at: string
          feedback_text: string | null
          id: string
          message_index: number
          prompt_version_id: string | null
          rating: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          message_index: number
          prompt_version_id?: string | null
          rating: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          message_index?: number
          prompt_version_id?: string | null
          rating?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_feedback_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      counseling_knowledge: {
        Row: {
          answer_text: string
          category: string | null
          created_at: string
          description: string | null
          embedding: string | null
          id: string
          keywords: string[] | null
          question: string
          search_text: unknown
          source: string | null
          strategy_labels: string[] | null
        }
        Insert: {
          answer_text: string
          category?: string | null
          created_at?: string
          description?: string | null
          embedding?: string | null
          id?: string
          keywords?: string[] | null
          question: string
          search_text?: unknown
          source?: string | null
          strategy_labels?: string[] | null
        }
        Update: {
          answer_text?: string
          category?: string | null
          created_at?: string
          description?: string | null
          embedding?: string | null
          id?: string
          keywords?: string[] | null
          question?: string
          search_text?: unknown
          source?: string | null
          strategy_labels?: string[] | null
        }
        Relationships: []
      }
      emotion_states: {
        Row: {
          anxiety_score: number
          arousal: number
          created_at: string
          desire_score: number
          dominant_emotion: string
          id: string
          source: string | null
          user_id: string
          valence: number
        }
        Insert: {
          anxiety_score?: number
          arousal?: number
          created_at?: string
          desire_score?: number
          dominant_emotion?: string
          id?: string
          source?: string | null
          user_id: string
          valence?: number
        }
        Update: {
          anxiety_score?: number
          arousal?: number
          created_at?: string
          desire_score?: number
          dominant_emotion?: string
          id?: string
          source?: string | null
          user_id?: string
          valence?: number
        }
        Relationships: []
      }
      knowledge_edges: {
        Row: {
          context: string | null
          created_at: string
          id: string
          relation: string
          source_entity: string
          target_entity: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          relation: string
          source_entity: string
          target_entity: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          relation?: string
          source_entity?: string
          target_entity?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      knowledge_entities: {
        Row: {
          attributes: Json | null
          created_at: string
          entity_type: string
          id: string
          last_mentioned_at: string | null
          mention_count: number | null
          name: string
          user_id: string
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          entity_type?: string
          id?: string
          last_mentioned_at?: string | null
          mention_count?: number | null
          name: string
          user_id: string
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          entity_type?: string
          id?: string
          last_mentioned_at?: string | null
          mention_count?: number | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      periodic_reports: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          period_end: string
          period_start: string
          report_data: Json
          report_type: string
          summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          period_end: string
          period_start: string
          report_data?: Json
          report_type?: string
          summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          period_end?: string
          period_start?: string
          report_data?: Json
          report_type?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plants: {
        Row: {
          ai_analysis: Json | null
          bloom_color: string | null
          content: string
          created_at: string
          growth_stage: number
          id: string
          is_public: boolean
          mood_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          bloom_color?: string | null
          content: string
          created_at?: string
          growth_stage?: number
          id?: string
          is_public?: boolean
          mood_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          bloom_color?: string | null
          content?: string
          created_at?: string
          growth_stage?: number
          id?: string
          is_public?: boolean
          mood_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          garden_level: number
          id: string
          is_first_login: boolean
          life_stage: string | null
          report_frequency: string[] | null
          total_seeds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          garden_level?: number
          id?: string
          is_first_login?: boolean
          life_stage?: string | null
          report_frequency?: string[] | null
          total_seeds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          garden_level?: number
          id?: string
          is_first_login?: boolean
          life_stage?: string | null
          report_frequency?: string[] | null
          total_seeds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prompt_versions: {
        Row: {
          ab_weight: number
          content: string
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          positive_feedback: number
          prompt_type: string
          quality_score: number | null
          total_feedback: number
          updated_at: string
          version: number
        }
        Insert: {
          ab_weight?: number
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          positive_feedback?: number
          prompt_type?: string
          quality_score?: number | null
          total_feedback?: number
          updated_at?: string
          version?: number
        }
        Update: {
          ab_weight?: number
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          positive_feedback?: number
          prompt_type?: string
          quality_score?: number | null
          total_feedback?: number
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      question_banks: {
        Row: {
          category: string
          created_at: string
          follow_up_questions: string[] | null
          id: string
          is_active: boolean
          life_stage: string
          primary_question: string
          priority: number
        }
        Insert: {
          category: string
          created_at?: string
          follow_up_questions?: string[] | null
          id?: string
          is_active?: boolean
          life_stage: string
          primary_question: string
          priority?: number
        }
        Update: {
          category?: string
          created_at?: string
          follow_up_questions?: string[] | null
          id?: string
          is_active?: boolean
          life_stage?: string
          primary_question?: string
          priority?: number
        }
        Relationships: []
      }
      response_evaluations: {
        Row: {
          conversation_id: string | null
          created_at: string
          empathy_score: number | null
          evaluation_details: Json | null
          id: string
          memory_utilization: number | null
          message_index: number
          overall_score: number | null
          professionalism_score: number | null
          prompt_version_id: string | null
          safety_score: number | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          empathy_score?: number | null
          evaluation_details?: Json | null
          id?: string
          memory_utilization?: number | null
          message_index: number
          overall_score?: number | null
          professionalism_score?: number | null
          prompt_version_id?: string | null
          safety_score?: number | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          empathy_score?: number | null
          evaluation_details?: Json | null
          id?: string
          memory_utilization?: number | null
          message_index?: number
          overall_score?: number | null
          professionalism_score?: number | null
          prompt_version_id?: string | null
          safety_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "response_evaluations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_evaluations_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_inbox: {
        Row: {
          ai_report: Json | null
          content: string
          created_at: string
          id: string
          risk_level: string | null
          risk_score: number | null
          security_tips: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_report?: Json | null
          content: string
          created_at?: string
          id?: string
          risk_level?: string | null
          risk_score?: number | null
          security_tips?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_report?: Json | null
          content?: string
          created_at?: string
          id?: string
          risk_level?: string | null
          risk_score?: number | null
          security_tips?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_memories: {
        Row: {
          access_count: number | null
          category: string
          content: string
          created_at: string
          decay_score: number | null
          id: string
          importance: number | null
          last_accessed_at: string | null
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_count?: number | null
          category?: string
          content: string
          created_at?: string
          decay_score?: number | null
          id?: string
          importance?: number | null
          last_accessed_at?: string | null
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_count?: number | null
          category?: string
          content?: string
          created_at?: string
          decay_score?: number | null
          id?: string
          importance?: number | null
          last_accessed_at?: string | null
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_counseling_by_text: {
        Args: { match_count?: number; search_query: string }
        Returns: {
          answer_text: string
          id: string
          keywords: string[]
          question: string
          rank: number
          strategy_labels: string[]
        }[]
      }
      search_counseling_knowledge:
        | {
            Args: {
              match_count?: number
              match_threshold?: number
              query_embedding: string
            }
            Returns: {
              answer_text: string
              id: string
              keywords: string[]
              question: string
              similarity: number
              strategy_labels: string[]
            }[]
          }
        | {
            Args: {
              match_count?: number
              match_threshold?: number
              query_embedding: string
            }
            Returns: {
              answer_text: string
              id: string
              keywords: string[]
              question: string
              similarity: number
              strategy_labels: string[]
            }[]
          }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
    Enums: {},
  },
} as const
