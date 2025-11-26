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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      anonymous_message_log: {
        Row: {
          anonymous_id: string
          conversation_id: string
          created_at: string
          id: string
          message_id: string
          real_sender_id: string
        }
        Insert: {
          anonymous_id: string
          conversation_id: string
          created_at?: string
          id?: string
          message_id: string
          real_sender_id: string
        }
        Update: {
          anonymous_id?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_id?: string
          real_sender_id?: string
        }
        Relationships: []
      }
      call_history: {
        Row: {
          call_type: string
          contact_avatar: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          duration_seconds: number
          id: string
          user_id: string
        }
        Insert: {
          call_type: string
          contact_avatar?: string | null
          contact_name: string
          contact_phone: string
          created_at?: string
          duration_seconds?: number
          id?: string
          user_id: string
        }
        Update: {
          call_type?: string
          contact_avatar?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          anonymous_revoked_at: string | null
          anonymous_revoked_by: string | null
          can_post_anonymously: boolean | null
          cleared_at: string | null
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          left_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          anonymous_revoked_at?: string | null
          anonymous_revoked_by?: string | null
          can_post_anonymously?: boolean | null
          cleared_at?: string | null
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          left_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          anonymous_revoked_at?: string | null
          anonymous_revoked_by?: string | null
          can_post_anonymously?: boolean | null
          cleared_at?: string | null
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          left_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          auto_delete_after: unknown
          avatar_url: string | null
          created_at: string
          created_by: string
          encrypted_metadata: string | null
          id: string
          name: string | null
          settings: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          auto_delete_after?: unknown
          avatar_url?: string | null
          created_at?: string
          created_by: string
          encrypted_metadata?: string | null
          id?: string
          name?: string | null
          settings?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          auto_delete_after?: unknown
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          encrypted_metadata?: string | null
          id?: string
          name?: string | null
          settings?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      deleted_direct_contacts: {
        Row: {
          deleted_at: string
          id: string
          other_user_id: string
          user_id: string
        }
        Insert: {
          deleted_at?: string
          id?: string
          other_user_id: string
          user_id: string
        }
        Update: {
          deleted_at?: string
          id?: string
          other_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      file_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          file_id: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          file_id: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          file_id?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_access_logs_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "secure_files"
            referencedColumns: ["id"]
          },
        ]
      }
      file_folders: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_folder_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_folder_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_folder_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "file_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      file_security_scans: {
        Row: {
          created_at: string
          file_id: string | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          scan_results: Json | null
          scan_status: string
          scanned_at: string | null
          threat_detected: string | null
        }
        Insert: {
          created_at?: string
          file_id?: string | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          scan_results?: Json | null
          scan_status?: string
          scanned_at?: string | null
          threat_detected?: string | null
        }
        Update: {
          created_at?: string
          file_id?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          scan_results?: Json | null
          scan_status?: string
          scanned_at?: string | null
          threat_detected?: string | null
        }
        Relationships: []
      }
      file_shares: {
        Row: {
          access_type: string
          created_at: string | null
          current_views: number | null
          expires_at: string | null
          file_id: string
          id: string
          max_views: number | null
          password_hash: string | null
          revoked_at: string | null
          shared_by: string
          shared_with: string | null
        }
        Insert: {
          access_type: string
          created_at?: string | null
          current_views?: number | null
          expires_at?: string | null
          file_id: string
          id?: string
          max_views?: number | null
          password_hash?: string | null
          revoked_at?: string | null
          shared_by: string
          shared_with?: string | null
        }
        Update: {
          access_type?: string
          created_at?: string | null
          current_views?: number | null
          expires_at?: string | null
          file_id?: string
          id?: string
          max_views?: number | null
          password_hash?: string | null
          revoked_at?: string | null
          shared_by?: string
          shared_with?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_shares_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "secure_files"
            referencedColumns: ["id"]
          },
        ]
      }
      file_tags: {
        Row: {
          created_at: string | null
          file_id: string
          id: string
          tag_color: string | null
          tag_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_id: string
          id?: string
          tag_color?: string | null
          tag_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_id?: string
          id?: string
          tag_color?: string | null
          tag_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_tags_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "secure_files"
            referencedColumns: ["id"]
          },
        ]
      }
      file_versions: {
        Row: {
          change_description: string | null
          created_at: string | null
          file_id: string
          file_path: string
          file_size: number
          id: string
          secure_payload: string
          user_id: string
          version_number: number
        }
        Insert: {
          change_description?: string | null
          created_at?: string | null
          file_id: string
          file_path: string
          file_size: number
          id?: string
          secure_payload: string
          user_id: string
          version_number: number
        }
        Update: {
          change_description?: string | null
          created_at?: string | null
          file_id?: string
          file_path?: string
          file_size?: number
          id?: string
          secure_payload?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "file_versions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "secure_files"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions: {
        Row: {
          created_at: string | null
          id: string
          mentioned_user_id: string
          message_id: string
          read_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          message_id: string
          read_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          message_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_drafts: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          replied_to_message_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          replied_to_message_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          replied_to_message_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_drafts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_drafts_replied_to_message_id_fkey"
            columns: ["replied_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: []
      }
      message_reads: {
        Row: {
          created_at: string
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_requests: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          message: string
          status: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          message: string
          status?: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          message?: string
          status?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          anonymous_id: string | null
          conversation_id: string
          created_at: string
          data_payload: string
          edit_count: number | null
          edited_at: string | null
          encrypted_file_metadata: string | null
          entropy_vector: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_anonymous: boolean | null
          is_self_destruct: boolean | null
          message_type: string | null
          reactions_count: number | null
          replied_to_message_id: string | null
          self_destruct_viewed_at: string | null
          self_destruct_viewed_by: string | null
          sender_id: string
          sequence_number: number
        }
        Insert: {
          anonymous_id?: string | null
          conversation_id: string
          created_at?: string
          data_payload: string
          edit_count?: number | null
          edited_at?: string | null
          encrypted_file_metadata?: string | null
          entropy_vector?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_self_destruct?: boolean | null
          message_type?: string | null
          reactions_count?: number | null
          replied_to_message_id?: string | null
          self_destruct_viewed_at?: string | null
          self_destruct_viewed_by?: string | null
          sender_id: string
          sequence_number: number
        }
        Update: {
          anonymous_id?: string | null
          conversation_id?: string
          created_at?: string
          data_payload?: string
          edit_count?: number | null
          edited_at?: string | null
          encrypted_file_metadata?: string | null
          entropy_vector?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_self_destruct?: boolean | null
          message_type?: string | null
          reactions_count?: number | null
          replied_to_message_id?: string | null
          self_destruct_viewed_at?: string | null
          self_destruct_viewed_by?: string | null
          sender_id?: string
          sequence_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_replied_to_message_id_fkey"
            columns: ["replied_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_prekeys: {
        Row: {
          created_at: string
          id: string
          key_id: number
          private_key: string | null
          private_key_encrypted: string | null
          public_key: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_id: number
          private_key?: string | null
          private_key_encrypted?: string | null
          public_key: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_id?: number
          private_key?: string | null
          private_key_encrypted?: string | null
          public_key?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      password_security: {
        Row: {
          created_at: string
          failed_attempts: number | null
          hash_algorithm: string
          hash_rounds: number
          id: string
          last_changed_at: string
          locked_until: string | null
          password_hash: string | null
          password_hash_encrypted: string | null
          previous_hashes: Json | null
          previous_hashes_encrypted: string | null
          salt: string | null
          salt_encrypted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number | null
          hash_algorithm?: string
          hash_rounds?: number
          id?: string
          last_changed_at?: string
          locked_until?: string | null
          password_hash?: string | null
          password_hash_encrypted?: string | null
          previous_hashes?: Json | null
          previous_hashes_encrypted?: string | null
          salt?: string | null
          salt_encrypted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number | null
          hash_algorithm?: string
          hash_rounds?: number
          id?: string
          last_changed_at?: string
          locked_until?: string | null
          password_hash?: string | null
          password_hash_encrypted?: string | null
          previous_hashes?: Json | null
          previous_hashes_encrypted?: string | null
          salt?: string | null
          salt_encrypted?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          closes_at: string | null
          created_at: string | null
          id: string
          message_id: string
          multiple_choice: boolean | null
          options: Json
          question: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string | null
          id?: string
          message_id: string
          multiple_choice?: boolean | null
          options: Json
          question: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string | null
          id?: string
          message_id?: string
          multiple_choice?: boolean | null
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          email_encrypted: string | null
          id: string
          login_username: string | null
          screenshot_protection_enabled: boolean | null
          tailscale_ipv4: string | null
          tailscale_ipv6: string | null
          tailscale_magicdns: string | null
          updated_at: string
          username: string | null
          wallpaper_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_encrypted?: string | null
          id: string
          login_username?: string | null
          screenshot_protection_enabled?: boolean | null
          tailscale_ipv4?: string | null
          tailscale_ipv6?: string | null
          tailscale_magicdns?: string | null
          updated_at?: string
          username?: string | null
          wallpaper_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_encrypted?: string | null
          id?: string
          login_username?: string | null
          screenshot_protection_enabled?: boolean | null
          tailscale_ipv4?: string | null
          tailscale_ipv6?: string | null
          tailscale_magicdns?: string | null
          updated_at?: string
          username?: string | null
          wallpaper_url?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number
          expires_at: string
          id: string
          identifier: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          expires_at: string
          id?: string
          identifier: string
          window_start?: string
        }
        Update: {
          action?: string
          count?: number
          expires_at?: string
          id?: string
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      scheduled_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_self_destruct: boolean | null
          message_type: string | null
          replied_to_message_id: string | null
          scheduled_for: string
          sender_id: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_self_destruct?: boolean | null
          message_type?: string | null
          replied_to_message_id?: string | null
          scheduled_for: string
          sender_id: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_self_destruct?: boolean | null
          message_type?: string | null
          replied_to_message_id?: string | null
          scheduled_for?: string
          sender_id?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      secure_files: {
        Row: {
          content_type: string
          created_at: string
          download_count: number | null
          encrypted_file_metadata: string | null
          entropy_vector: string | null
          file_path: string
          file_size: number
          filename: string
          folder_id: string | null
          id: string
          last_accessed: string | null
          secure_payload: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          content_type: string
          created_at?: string
          download_count?: number | null
          encrypted_file_metadata?: string | null
          entropy_vector?: string | null
          file_path: string
          file_size: number
          filename: string
          folder_id?: string | null
          id?: string
          last_accessed?: string | null
          secure_payload: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          content_type?: string
          created_at?: string
          download_count?: number | null
          encrypted_file_metadata?: string | null
          entropy_vector?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          folder_id?: string | null
          id?: string
          last_accessed?: string | null
          secure_payload?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "secure_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "file_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          additional_data: Json | null
          device_fingerprint: string | null
          event_description: string
          event_type: string
          id: string
          ip_address: unknown
          risk_level: string
          session_id: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          additional_data?: Json | null
          device_fingerprint?: string | null
          event_description: string
          event_type: string
          id?: string
          ip_address?: unknown
          risk_level?: string
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          additional_data?: Json | null
          device_fingerprint?: string | null
          event_description?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          risk_level?: string
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_honeypot: {
        Row: {
          access_timestamp: string | null
          accessor_info: Json | null
          fake_data: string | null
          id: string
        }
        Insert: {
          access_timestamp?: string | null
          accessor_info?: Json | null
          fake_data?: string | null
          id?: string
        }
        Update: {
          access_timestamp?: string | null
          accessor_info?: Json | null
          fake_data?: string | null
          id?: string
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          conversation_id: string
          id: string
          is_typing: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_typing?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_typing?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      updates: {
        Row: {
          created_at: string
          description: string
          display_order: number | null
          expires_at: string
          id: string
          image_url: string | null
          is_active: boolean
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number | null
          expires_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number | null
          expires_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      user_keys: {
        Row: {
          created_at: string
          id: string
          identity_key_private: string | null
          identity_key_private_encrypted: string | null
          identity_key_public: string
          signed_prekey_id: number
          signed_prekey_private: string | null
          signed_prekey_private_encrypted: string | null
          signed_prekey_public: string
          signed_prekey_signature: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          identity_key_private?: string | null
          identity_key_private_encrypted?: string | null
          identity_key_public: string
          signed_prekey_id: number
          signed_prekey_private?: string | null
          signed_prekey_private_encrypted?: string | null
          signed_prekey_public: string
          signed_prekey_signature: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          identity_key_private?: string | null
          identity_key_private_encrypted?: string | null
          identity_key_public?: string
          signed_prekey_id?: number
          signed_prekey_private?: string | null
          signed_prekey_private_encrypted?: string | null
          signed_prekey_public?: string
          signed_prekey_signature?: string
          user_id?: string
        }
        Relationships: []
      }
      user_security: {
        Row: {
          backup_codes: string[] | null
          backup_codes_encrypted: string | null
          created_at: string
          device_fingerprints: Json | null
          failed_login_attempts: number | null
          id: string
          last_login_at: string | null
          locked_until: string | null
          mfa_enabled: boolean | null
          totp_secret: string | null
          totp_secret_encrypted: string | null
          updated_at: string
        }
        Insert: {
          backup_codes?: string[] | null
          backup_codes_encrypted?: string | null
          created_at?: string
          device_fingerprints?: Json | null
          failed_login_attempts?: number | null
          id: string
          last_login_at?: string | null
          locked_until?: string | null
          mfa_enabled?: boolean | null
          totp_secret?: string | null
          totp_secret_encrypted?: string | null
          updated_at?: string
        }
        Update: {
          backup_codes?: string[] | null
          backup_codes_encrypted?: string | null
          created_at?: string
          device_fingerprints?: Json | null
          failed_login_attempts?: number | null
          id?: string
          last_login_at?: string | null
          locked_until?: string | null
          mfa_enabled?: boolean | null
          totp_secret?: string | null
          totp_secret_encrypted?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean
          last_activity: string
          refresh_expires_at: string
          refresh_token: string | null
          refresh_token_encrypted: string | null
          session_token: string | null
          session_token_encrypted: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity?: string
          refresh_expires_at: string
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          session_token?: string | null
          session_token_encrypted?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity?: string
          refresh_expires_at?: string
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          session_token?: string | null
          session_token_encrypted?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_messages: {
        Row: {
          created_at: string | null
          duration_seconds: number
          id: string
          message_id: string
          transcript: string | null
          waveform_data: Json | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds: number
          id?: string
          message_id: string
          transcript?: string | null
          waveform_data?: Json | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number
          id?: string
          message_id?: string
          transcript?: string | null
          waveform_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_credentials: {
        Row: {
          backup_eligible: boolean | null
          backup_state: boolean | null
          counter: number
          created_at: string
          credential_id: string | null
          credential_id_encrypted: string | null
          device_type: string
          id: string
          last_used_at: string | null
          public_key: string | null
          public_key_encrypted: string | null
          transports: string[] | null
          user_id: string
        }
        Insert: {
          backup_eligible?: boolean | null
          backup_state?: boolean | null
          counter?: number
          created_at?: string
          credential_id?: string | null
          credential_id_encrypted?: string | null
          device_type: string
          id?: string
          last_used_at?: string | null
          public_key?: string | null
          public_key_encrypted?: string | null
          transports?: string[] | null
          user_id: string
        }
        Update: {
          backup_eligible?: boolean | null
          backup_state?: boolean | null
          counter?: number
          created_at?: string
          credential_id?: string | null
          credential_id_encrypted?: string | null
          device_type?: string
          id?: string
          last_used_at?: string | null
          public_key?: string | null
          public_key_encrypted?: string | null
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          max_attempts?: number
          operation_type: string
          window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_file_shares: { Args: never; Returns: undefined }
      cleanup_expired_rate_limits: { Args: never; Returns: undefined }
      cleanup_expired_security_data: { Args: never; Returns: undefined }
      cleanup_expired_updates: { Args: never; Returns: undefined }
      cleanup_viewed_self_destruct_messages: { Args: never; Returns: undefined }
      create_direct_conversation: {
        Args: { _name: string; _other_user_id: string }
        Returns: string
      }
      create_group_conversation: {
        Args: { _auto_delete_after?: unknown; _name: string; _settings?: Json }
        Returns: string
      }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string }
        Returns: string
      }
      encrypt_sensitive_data: { Args: { data: string }; Returns: string }
      generate_anonymous_id: {
        Args: { p_conversation_id: string; p_sender_id: string }
        Returns: string
      }
      generate_entropy_vector: { Args: never; Returns: string }
      get_conversation_participant_profiles: {
        Args: { conversation_uuid: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          username: string
        }[]
      }
      get_decrypted_email: { Args: { user_id: string }; Returns: string }
      get_direct_counterparties: {
        Args: { conversation_ids: string[] }
        Returns: {
          avatar_url: string
          conversation_id: string
          display_name: string
          id: string
          username: string
        }[]
      }
      get_direct_counterparty: {
        Args: { conversation_uuid: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          username: string
        }[]
      }
      get_private_keys_honeypot: { Args: never; Returns: string }
      get_public_profile_info: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          username: string
        }[]
      }
      get_secure_email: { Args: { user_uuid: string }; Returns: string }
      get_user_public_keys: {
        Args: { target_user_id: string }
        Returns: {
          identity_key_public: string
          signed_prekey_id: number
          signed_prekey_public: string
          signed_prekey_signature: string
          user_id: string
        }[]
      }
      invalidate_all_user_sessions: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_authenticated_user: { Args: never; Returns: boolean }
      is_service_admin: { Args: never; Returns: boolean }
      log_file_access: {
        Args: {
          p_access_type: string
          p_file_id: string
          p_ip_address?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_additional_data?: Json
          p_device_fingerprint?: string
          p_event_description: string
          p_event_type: string
          p_ip_address?: string
          p_risk_level?: string
          p_session_id?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      mark_messages_as_read: {
        Args: { p_conversation_id: string; p_up_to_message_id?: string }
        Returns: undefined
      }
      mark_self_destruct_viewed: {
        Args: { p_message_id: string; p_viewer_id: string }
        Returns: undefined
      }
      mask_email_for_security: {
        Args: { email_value: string }
        Returns: string
      }
      mask_phone_for_security: {
        Args: { phone_value: string }
        Returns: string
      }
      monitor_suspicious_activity: { Args: never; Returns: undefined }
      process_scheduled_messages: { Args: never; Returns: undefined }
      reset_secure_files_and_pin: { Args: { new_pin: string }; Returns: Json }
      search_profiles: {
        Args: { search_term?: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          username: string
        }[]
      }
      update_last_read_at: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      user_can_access_file: { Args: { file_path: string }; Returns: boolean }
      user_is_conversation_participant: {
        Args: { conversation_id: string; user_id: string }
        Returns: boolean
      }
      validate_all_security_constraints: { Args: never; Returns: boolean }
      validate_call_history_access: {
        Args: { history_user_id: string }
        Returns: boolean
      }
      validate_file_share: {
        Args: { p_password?: string; p_share_id: string }
        Returns: boolean
      }
      validate_profile_access: {
        Args: { profile_user_id: string }
        Returns: boolean
      }
      validate_secure_data_access: {
        Args: { operation: string; table_name: string }
        Returns: boolean
      }
      validate_user_session: {
        Args: { p_session_token: string }
        Returns: {
          expires_at: string
          is_valid: boolean
          user_id: string
        }[]
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
