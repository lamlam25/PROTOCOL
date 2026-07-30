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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      archive_items: {
        Row: {
          content_body: string | null
          content_body_bn: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_bn: string | null
          id: string
          is_published: boolean
          item_type: string
          media_ipfs_cid: string | null
          media_url: string | null
          published_date: string | null
          source_citation: string | null
          source_url: string | null
          thumbnail_url: string | null
          title: string
          title_bn: string | null
          verification_status: string
        }
        Insert: {
          content_body?: string | null
          content_body_bn?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          id?: string
          is_published?: boolean
          item_type: string
          media_ipfs_cid?: string | null
          media_url?: string | null
          published_date?: string | null
          source_citation?: string | null
          source_url?: string | null
          thumbnail_url?: string | null
          title: string
          title_bn?: string | null
          verification_status?: string
        }
        Update: {
          content_body?: string | null
          content_body_bn?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          id?: string
          is_published?: boolean
          item_type?: string
          media_ipfs_cid?: string | null
          media_url?: string | null
          published_date?: string | null
          source_citation?: string | null
          source_url?: string | null
          thumbnail_url?: string | null
          title?: string
          title_bn?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "archive_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_allocations: {
        Row: {
          allocated_amount: number
          category: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          description_bn: string | null
          fiscal_period: string | null
          id: string
          source: string | null
          title: string
          title_bn: string | null
        }
        Insert: {
          allocated_amount: number
          category: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          description_bn?: string | null
          fiscal_period?: string | null
          id?: string
          source?: string | null
          title: string
          title_bn?: string | null
        }
        Update: {
          allocated_amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          description_bn?: string | null
          fiscal_period?: string | null
          id?: string
          source?: string | null
          title?: string
          title_bn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_transactions: {
        Row: {
          allocation_id: string | null
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          description_bn: string | null
          disbursement_date: string
          id: string
          ipfs_receipt_cid: string | null
          onchain_tx_hash: string | null
          recipient_name: string | null
          recipient_name_bn: string | null
          transaction_type: string
          victim_id: string | null
        }
        Insert: {
          allocation_id?: string | null
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          disbursement_date?: string
          id?: string
          ipfs_receipt_cid?: string | null
          onchain_tx_hash?: string | null
          recipient_name?: string | null
          recipient_name_bn?: string | null
          transaction_type?: string
          victim_id?: string | null
        }
        Update: {
          allocation_id?: string | null
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          disbursement_date?: string
          id?: string
          ipfs_receipt_cid?: string | null
          onchain_tx_hash?: string | null
          recipient_name?: string | null
          recipient_name_bn?: string | null
          transaction_type?: string
          victim_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_transactions_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "budget_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transactions_victim_id_fkey"
            columns: ["victim_id"]
            isOneToOne: false
            referencedRelation: "victims"
            referencedColumns: ["id"]
          },
        ]
      }
      case_updates: {
        Row: {
          attachment_ipfs_cid: string | null
          case_id: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          milestone_type: string
          update_date: string
          update_text: string
          update_text_bn: string | null
        }
        Insert: {
          attachment_ipfs_cid?: string | null
          case_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          milestone_type?: string
          update_date?: string
          update_text: string
          update_text_bn?: string | null
        }
        Update: {
          attachment_ipfs_cid?: string | null
          case_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          milestone_type?: string
          update_date?: string
          update_text?: string
          update_text_bn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_updates_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          assigned_lawyer_id: string | null
          case_number: string | null
          case_type: string
          court_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_bn: string | null
          filed_date: string | null
          id: string
          is_published: boolean
          status: string
          title: string
          title_bn: string | null
          updated_at: string
          victim_id: string | null
        }
        Insert: {
          assigned_lawyer_id?: string | null
          case_number?: string | null
          case_type: string
          court_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          filed_date?: string | null
          id?: string
          is_published?: boolean
          status?: string
          title: string
          title_bn?: string | null
          updated_at?: string
          victim_id?: string | null
        }
        Update: {
          assigned_lawyer_id?: string | null
          case_number?: string | null
          case_type?: string
          court_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          filed_date?: string | null
          id?: string
          is_published?: boolean
          status?: string
          title?: string
          title_bn?: string | null
          updated_at?: string
          victim_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_assigned_lawyer_id_fkey"
            columns: ["assigned_lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_victim_id_fkey"
            columns: ["victim_id"]
            isOneToOne: false
            referencedRelation: "victims"
            referencedColumns: ["id"]
          },
        ]
      }
      false_case_evidence: {
        Row: {
          accused_full_name: string
          accused_full_name_bn: string | null
          alibi_timestamp: string | null
          case_reference_number: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          district: string | null
          evidence_files: Json
          id: string
          review_notes: string | null
          reviewed_by: string | null
          status: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          accused_full_name: string
          accused_full_name_bn?: string | null
          alibi_timestamp?: string | null
          case_reference_number?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          evidence_files?: Json
          id?: string
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          accused_full_name?: string
          accused_full_name_bn?: string | null
          alibi_timestamp?: string | null
          case_reference_number?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          evidence_files?: Json
          id?: string
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "false_case_evidence_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "false_case_evidence_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forensic_checks: {
        Row: {
          created_at: string
          created_by: string | null
          ela_heatmap_ipfs_cid: string | null
          ela_score: number | null
          file_sha256: string
          id: string
          ipfs_cid: string | null
          ocr_extracted_fields: Json
          ocr_raw_text: string | null
          onchain_contract_address: string | null
          onchain_tx_hash: string | null
          phash: string | null
          phash_matches: Json
          related_id: string
          related_table: string
          review_notes: string | null
          review_status: string
          reviewed_by: string | null
          risk_flag: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ela_heatmap_ipfs_cid?: string | null
          ela_score?: number | null
          file_sha256: string
          id?: string
          ipfs_cid?: string | null
          ocr_extracted_fields?: Json
          ocr_raw_text?: string | null
          onchain_contract_address?: string | null
          onchain_tx_hash?: string | null
          phash?: string | null
          phash_matches?: Json
          related_id: string
          related_table: string
          review_notes?: string | null
          review_status?: string
          reviewed_by?: string | null
          risk_flag?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ela_heatmap_ipfs_cid?: string | null
          ela_score?: number | null
          file_sha256?: string
          id?: string
          ipfs_cid?: string | null
          ocr_extracted_fields?: Json
          ocr_raw_text?: string | null
          onchain_contract_address?: string | null
          onchain_tx_hash?: string | null
          phash?: string | null
          phash_matches?: Json
          related_id?: string
          related_table?: string
          review_notes?: string | null
          review_status?: string
          reviewed_by?: string | null
          risk_flag?: string
        }
        Relationships: [
          {
            foreignKeyName: "forensic_checks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forensic_checks_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyers: {
        Row: {
          bar_registration_no: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          full_name: string
          full_name_bn: string | null
          id: string
          is_active: boolean
          specialization: string[]
        }
        Insert: {
          bar_registration_no?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          full_name: string
          full_name_bn?: string | null
          id?: string
          is_active?: boolean
          specialization?: string[]
        }
        Update: {
          bar_registration_no?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          full_name?: string
          full_name_bn?: string | null
          id?: string
          is_active?: boolean
          specialization?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          district: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          district?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      submission_throttle: {
        Row: {
          count: number
          day: string
          id: string
          ip_hash: string
          route: string
        }
        Insert: {
          count?: number
          day?: string
          id?: string
          ip_hash: string
          route: string
        }
        Update: {
          count?: number
          day?: string
          id?: string
          ip_hash?: string
          route?: string
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          description_bn: string | null
          event_date: string
          event_time: string | null
          id: string
          is_published: boolean
          related_archive_item_id: string | null
          source_citation: string | null
          title: string
          title_bn: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          is_published?: boolean
          related_archive_item_id?: string | null
          source_citation?: string | null
          title: string
          title_bn?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          is_published?: boolean
          related_archive_item_id?: string | null
          source_citation?: string | null
          title?: string
          title_bn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_related_archive_item_id_fkey"
            columns: ["related_archive_item_id"]
            isOneToOne: false
            referencedRelation: "archive_items"
            referencedColumns: ["id"]
          },
        ]
      }
      victims: {
        Row: {
          age: number | null
          created_at: string
          created_by: string | null
          district: string | null
          full_name: string
          full_name_bn: string | null
          gender: string | null
          id: string
          incident_date: string | null
          incident_location: string | null
          incident_location_bn: string | null
          is_published: boolean
          photo_ipfs_cid: string | null
          photo_url: string | null
          status: string
          story_summary: string | null
          story_summary_bn: string | null
          upazila: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          full_name: string
          full_name_bn?: string | null
          gender?: string | null
          id?: string
          incident_date?: string | null
          incident_location?: string | null
          incident_location_bn?: string | null
          is_published?: boolean
          photo_ipfs_cid?: string | null
          photo_url?: string | null
          status: string
          story_summary?: string | null
          story_summary_bn?: string | null
          upazila?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          full_name?: string
          full_name_bn?: string | null
          gender?: string | null
          id?: string
          incident_date?: string | null
          incident_location?: string | null
          incident_location_bn?: string | null
          is_published?: boolean
          photo_ipfs_cid?: string | null
          photo_url?: string | null
          status?: string
          story_summary?: string | null
          story_summary_bn?: string | null
          upazila?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "victims_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_tasks: {
        Row: {
          assigned_volunteer_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_bn: string | null
          district: string | null
          due_date: string | null
          geo_lat: number | null
          geo_lng: number | null
          id: string
          status: string
          task_type: string
          title: string
          title_bn: string | null
          upazila: string | null
        }
        Insert: {
          assigned_volunteer_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          district?: string | null
          due_date?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          status?: string
          task_type: string
          title: string
          title_bn?: string | null
          upazila?: string | null
        }
        Update: {
          assigned_volunteer_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          district?: string | null
          due_date?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          status?: string
          task_type?: string
          title?: string
          title_bn?: string | null
          upazila?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_tasks_assigned_volunteer_id_fkey"
            columns: ["assigned_volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteers: {
        Row: {
          availability: string | null
          created_at: string
          district: string | null
          email: string | null
          full_name: string
          full_name_bn: string | null
          id: string
          motivation: string | null
          phone: string | null
          profile_id: string | null
          reviewed_by: string | null
          skillsets: string[]
          status: string
          upazila: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name: string
          full_name_bn?: string | null
          id?: string
          motivation?: string | null
          phone?: string | null
          profile_id?: string | null
          reviewed_by?: string | null
          skillsets?: string[]
          status?: string
          upazila?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name?: string
          full_name_bn?: string | null
          id?: string
          motivation?: string | null
          phone?: string | null
          profile_id?: string | null
          reviewed_by?: string | null
          skillsets?: string[]
          status?: string
          upazila?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteers_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
