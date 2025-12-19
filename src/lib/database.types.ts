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
      provider_capabilities: {
        Row: any
        Insert: any
        Update: any
      }
      user_api_keys: {
        Row: any
        Insert: any
        Update: any
      }
      model_configurations: {
        Row: any
        Insert: any
        Update: any
      }
      api_usage_logs: {
        Row: any
        Insert: any
        Update: any
      }
      user_preferences: {
        Row: any
        Insert: any
        Update: any
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
