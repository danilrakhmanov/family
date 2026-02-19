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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      todos: {
        Row: {
          id: string
          text: string
          completed: boolean
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          text: string
          completed?: boolean
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          text?: string
          completed?: boolean
          user_id?: string
          created_at?: string
        }
      }
      shopping_items: {
        Row: {
          id: string
          name: string
          estimated_price: number | null
          purchased: boolean
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          estimated_price?: number | null
          purchased?: boolean
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          estimated_price?: number | null
          purchased?: boolean
          user_id?: string
          created_at?: string
        }
      }
      movies: {
        Row: {
          id: string
          title: string
          poster_url: string | null
          kinopoisk_id: string | null
          comment: string | null
          watched: boolean
          rating: number | null
          genres: string[] | null
          year: number | null
          description: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          poster_url?: string | null
          kinopoisk_id?: string | null
          comment?: string | null
          watched?: boolean
          rating?: number | null
          genres?: string[] | null
          year?: number | null
          description?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          poster_url?: string | null
          kinopoisk_id?: string | null
          comment?: string | null
          watched?: boolean
          rating?: number | null
          genres?: string[] | null
          year?: number | null
          description?: string | null
          user_id?: string
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          name: string
          target_amount: number
          current_amount: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          target_amount: number
          current_amount?: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          target_amount?: number
          current_amount?: number
          user_id?: string
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          description: string
          amount: number
          date: string
          category: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          description: string
          amount: number
          date?: string
          category?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          date?: string
          category?: string
          user_id?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          event_date: string
          event_time: string | null
          color: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          event_date: string
          event_time?: string | null
          color?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          event_date?: string
          event_time?: string | null
          color?: string
          user_id?: string
          created_at?: string
        }
      }
      wishes: {
        Row: {
          id: string
          title: string
          price: number | null
          priority: number
          comment: string | null
          image_url: string | null
          reserved: boolean
          purchased: boolean
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          price?: number | null
          priority?: number
          comment?: string | null
          image_url?: string | null
          reserved?: boolean
          purchased?: boolean
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          price?: number | null
          priority?: number
          comment?: string | null
          image_url?: string | null
          reserved?: boolean
          purchased?: boolean
          user_id?: string
          created_at?: string
        }
      }
      memories: {
        Row: {
          id: string
          content: string
          image_url: string | null
          happened_at: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          image_url?: string | null
          happened_at: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          image_url?: string | null
          happened_at?: string
          user_id?: string
          created_at?: string
        }
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
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Todo = Database['public']['Tables']['todos']['Row']
export type ShoppingItem = Database['public']['Tables']['shopping_items']['Row']
export type Movie = Database['public']['Tables']['movies']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Wish = Database['public']['Tables']['wishes']['Row']
export type Memory = Database['public']['Tables']['memories']['Row']