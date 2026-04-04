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
      attendance: {
        Row: {
          audit_note: string | null
          check_in: string
          check_out: string | null
          date: string | null
          gym_id: string
          id: string
          marked_by: string | null
          member_id: string
          method: string
        }
        Insert: {
          audit_note?: string | null
          check_in?: string
          check_out?: string | null
          date?: string | null
          gym_id: string
          id?: string
          marked_by?: string | null
          member_id: string
          method?: string
        }
        Update: {
          audit_note?: string | null
          check_in?: string
          check_out?: string | null
          date?: string | null
          gym_id?: string
          id?: string
          marked_by?: string | null
          member_id?: string
          method?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          gym_id: string
          id: string
          performed_by: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          gym_id: string
          id?: string
          performed_by: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          gym_id?: string
          id?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_codes: {
        Row: {
          code: string
          created_at: string
          date: string
          gym_id: string
          id: string
          qr_token: string
        }
        Insert: {
          code: string
          created_at?: string
          date?: string
          gym_id: string
          id?: string
          qr_token?: string
        }
        Update: {
          code?: string
          created_at?: string
          date?: string
          gym_id?: string
          id?: string
          qr_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_codes_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plans: {
        Row: {
          calories: number | null
          created_at: string
          day_of_week: number
          description: string
          gym_id: string
          id: string
          meal_type: string
          member_id: string
          trainer_id: string | null
        }
        Insert: {
          calories?: number | null
          created_at?: string
          day_of_week: number
          description?: string
          gym_id: string
          id?: string
          meal_type?: string
          member_id: string
          trainer_id?: string | null
        }
        Update: {
          calories?: number | null
          created_at?: string
          day_of_week?: number
          description?: string
          gym_id?: string
          id?: string
          meal_type?: string
          member_id?: string
          trainer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diet_plans_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_plans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_plans_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          converted_member_id: string | null
          created_at: string
          email: string | null
          follow_up_date: string | null
          gym_id: string
          id: string
          interest: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          converted_member_id?: string | null
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          gym_id: string
          id?: string
          interest?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          converted_member_id?: string | null
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          gym_id?: string
          id?: string
          interest?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_converted_member_id_fkey"
            columns: ["converted_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string
          gym_id: string
          id: string
          last_maintenance: string | null
          name: string
          next_maintenance: string | null
          notes: string | null
          purchase_date: string | null
          status: string
          updated_at: string
          warranty_until: string | null
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string
          gym_id: string
          id?: string
          last_maintenance?: string | null
          name: string
          next_maintenance?: string | null
          notes?: string | null
          purchase_date?: string | null
          status?: string
          updated_at?: string
          warranty_until?: string | null
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string
          gym_id?: string
          id?: string
          last_maintenance?: string | null
          name?: string
          next_maintenance?: string | null
          notes?: string | null
          purchase_date?: string | null
          status?: string
          updated_at?: string
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          gym_id: string
          id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          expense_date?: string
          gym_id: string
          id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          gym_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          gym_id: string
          id: string
          member_id: string
          month: number
          rating: number
          year: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          gym_id: string
          id?: string
          member_id: string
          month: number
          rating: number
          year: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          gym_id?: string
          id?: string
          member_id?: string
          month?: number
          rating?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "feedback_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          gym_id: string
          id: string
          max_members: number
          plan_tier: string
          price_monthly: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          gym_id: string
          id?: string
          max_members?: number
          plan_tier?: string
          price_monthly?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          gym_id?: string
          id?: string
          max_members?: number
          plan_tier?: string
          price_monthly?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_subscriptions_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: true
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: string | null
          admin_email: string | null
          admin_initial_password: string | null
          city: string | null
          code: string
          created_at: string
          email: string | null
          gst_number: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          admin_email?: string | null
          admin_initial_password?: string | null
          city?: string | null
          code: string
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          admin_email?: string | null
          admin_initial_password?: string | null
          city?: string | null
          code?: string
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string | null
          created_at: string
          gym_id: string
          id: string
          name: string
          quantity: number
          selling_price: number
          status: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          gym_id: string
          id?: string
          name: string
          quantity?: number
          selling_price?: number
          status?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          gym_id?: string
          id?: string
          name?: string
          quantity?: number
          selling_price?: number
          status?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_sales: {
        Row: {
          gym_id: string
          id: string
          inventory_id: string
          member_id: string | null
          quantity: number
          sold_at: string
          sold_by: string | null
          total_price: number
        }
        Insert: {
          gym_id: string
          id?: string
          inventory_id: string
          member_id?: string | null
          quantity?: number
          sold_at?: string
          sold_by?: string | null
          total_price?: number
        }
        Update: {
          gym_id?: string
          id?: string
          inventory_id?: string
          member_id?: string | null
          quantity?: number
          sold_at?: string
          sold_by?: string | null
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_sales_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_sales_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_sales_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_xp: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          member_id: string
          reason: string | null
          xp: number
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          member_id: string
          reason?: string | null
          xp?: number
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          member_id?: string
          reason?: string | null
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "member_xp_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_xp_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          created_at: string
          due_date: string | null
          email: string | null
          full_name: string
          gym_id: string
          id: string
          joined_at: string
          member_code: string
          phone: string | null
          plan_id: string | null
          status: string
          trainer_id: string | null
          updated_at: string
          user_id: string | null
          weight: string | null
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          email?: string | null
          full_name: string
          gym_id: string
          id?: string
          joined_at?: string
          member_code: string
          phone?: string | null
          plan_id?: string | null
          status?: string
          trainer_id?: string | null
          updated_at?: string
          user_id?: string | null
          weight?: string | null
        }
        Update: {
          created_at?: string
          due_date?: string | null
          email?: string | null
          full_name?: string
          gym_id?: string
          id?: string
          joined_at?: string
          member_code?: string
          phone?: string | null
          plan_id?: string | null
          status?: string
          trainer_id?: string | null
          updated_at?: string
          user_id?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_recipients: {
        Row: {
          created_at: string
          id: string
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string
          gym_id: string
          id: string
          message: string
          target_type: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          gym_id: string
          id?: string
          message: string
          target_type?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          gym_id?: string
          id?: string
          message?: string
          target_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          gym_id: string
          id: string
          member_id: string | null
          method: string
          payment_date: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          gym_id: string
          id?: string
          member_id?: string | null
          method?: string
          payment_date?: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          gym_id?: string
          id?: string
          member_id?: string | null
          method?: string
          payment_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          duration_days: number
          features: string[] | null
          gym_id: string
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_days: number
          features?: string[] | null
          gym_id: string
          id?: string
          is_active?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_days?: number
          features?: string[] | null
          gym_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          gym_id: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          gym_id?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          gym_id?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_logs: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          log_type: string
          logged_at: string
          member_id: string
          notes: string | null
          photo_url: string | null
          unit: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          log_type?: string
          logged_at?: string
          member_id: string
          notes?: string | null
          photo_url?: string | null
          unit?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          log_type?: string
          logged_at?: string
          member_id?: string
          notes?: string | null
          photo_url?: string | null
          unit?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_logs_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          converted_member_id: string | null
          created_at: string
          gym_id: string
          id: string
          referred_email: string | null
          referred_name: string
          referred_phone: string | null
          referrer_member_id: string
          reward_type: string | null
          reward_value: number | null
          status: string
        }
        Insert: {
          converted_member_id?: string | null
          created_at?: string
          gym_id: string
          id?: string
          referred_email?: string | null
          referred_name: string
          referred_phone?: string | null
          referrer_member_id: string
          reward_type?: string | null
          reward_value?: number | null
          status?: string
        }
        Update: {
          converted_member_id?: string | null
          created_at?: string
          gym_id?: string
          id?: string
          referred_email?: string | null
          referred_name?: string
          referred_phone?: string | null
          referrer_member_id?: string
          reward_type?: string | null
          reward_value?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_converted_member_id_fkey"
            columns: ["converted_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_member_id_fkey"
            columns: ["referrer_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string
          date: string
          gym_id: string
          id: string
          trainer_id: string | null
          user_id: string | null
        }
        Insert: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          date?: string
          gym_id: string
          id?: string
          trainer_id?: string | null
          user_id?: string | null
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string
          date?: string
          gym_id?: string
          id?: string
          trainer_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      trainers: {
        Row: {
          created_at: string
          full_name: string
          gym_id: string
          id: string
          joined_at: string
          phone: string | null
          salary: number | null
          specialization: string | null
          status: string
          trainer_code: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          gym_id: string
          id?: string
          joined_at?: string
          phone?: string | null
          salary?: number | null
          specialization?: string | null
          status?: string
          trainer_code: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          gym_id?: string
          id?: string
          joined_at?: string
          phone?: string | null
          salary?: number | null
          specialization?: string | null
          status?: string
          trainer_code?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainers_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          gym_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          gym_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          gym_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string
          day_of_week: number
          exercise_name: string
          gym_id: string
          id: string
          is_done: boolean | null
          member_id: string
          notes: string | null
          reps: string | null
          sets: number | null
          trainer_id: string | null
          week_start: string | null
        }
        Insert: {
          created_at?: string
          day_of_week: number
          exercise_name: string
          gym_id: string
          id?: string
          is_done?: boolean | null
          member_id: string
          notes?: string | null
          reps?: string | null
          sets?: number | null
          trainer_id?: string | null
          week_start?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number
          exercise_name?: string
          gym_id?: string
          id?: string
          is_done?: boolean | null
          member_id?: string
          notes?: string | null
          reps?: string | null
          sets?: number | null
          trainer_id?: string | null
          week_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_freeze_expired_members: { Args: never; Returns: undefined }
      get_user_gym_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "gym_admin" | "trainer" | "member"
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
      app_role: ["super_admin", "gym_admin", "trainer", "member"],
    },
  },
} as const
