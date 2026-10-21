/**
 * Hand-maintained to match supabase/migrations. Regenerate with
 * `npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts`
 * once the project is linked, and keep the domain unions below.
 */

import type { ProductId } from "@/lib/catalog";

type Timestamp = string;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          branch: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          email?: string | null;
          branch?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          email?: string | null;
          branch?: string | null;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      stripe_customers: {
        Row: {
          user_id: string;
          stripe_customer_id: string;
          default_payment_method_id: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          user_id: string;
          stripe_customer_id: string;
          default_payment_method_id?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          stripe_customer_id?: string;
          default_payment_method_id?: string | null;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          product_id: ProductId;
          amount_cents: number;
          currency: string;
          source: "checkout" | "upsell";
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          status: "paid" | "refunded";
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: ProductId;
          amount_cents: number;
          currency?: string;
          source: "checkout" | "upsell";
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          status?: "paid" | "refunded";
          created_at?: Timestamp;
        };
        Update: {
          status?: "paid" | "refunded";
        };
        Relationships: [];
      };
      entitlements: {
        Row: {
          user_id: string;
          product_id: ProductId;
          purchase_id: string | null;
          granted_at: Timestamp;
          revoked_at: Timestamp | null;
        };
        Insert: {
          user_id: string;
          product_id: ProductId;
          purchase_id?: string | null;
          granted_at?: Timestamp;
          revoked_at?: Timestamp | null;
        };
        Update: {
          purchase_id?: string | null;
          granted_at?: Timestamp;
          revoked_at?: Timestamp | null;
        };
        Relationships: [];
      };
      stripe_events: {
        Row: { id: string; type: string; received_at: Timestamp; processed_at: Timestamp | null };
        Insert: { id: string; type: string; received_at?: Timestamp; processed_at?: Timestamp | null };
        Update: { processed_at?: Timestamp | null };
        Relationships: [];
      };
      flashcard_progress: {
        Row: {
          user_id: string;
          card_id: string;
          box: number;
          correct: number;
          incorrect: number;
          last_reviewed_at: Timestamp;
          due_at: Timestamp;
        };
        Insert: {
          user_id: string;
          card_id: string;
          box: number;
          correct?: number;
          incorrect?: number;
          last_reviewed_at: Timestamp;
          due_at: Timestamp;
        };
        Update: {
          box?: number;
          correct?: number;
          incorrect?: number;
          last_reviewed_at?: Timestamp;
          due_at?: Timestamp;
        };
        Relationships: [];
      };
      translation_usage: {
        Row: {
          id: number;
          user_id: string;
          model: string;
          input_tokens: number | null;
          output_tokens: number | null;
          created_at: Timestamp;
        };
        Insert: {
          user_id: string;
          model: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          created_at?: Timestamp;
        };
        Update: {
          model?: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
