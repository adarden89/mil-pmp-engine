/**
 * Hand-maintained to match supabase/migrations. Regenerate with
 * `npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts`
 * once the project is linked, and keep the domain unions below.
 */

import type { ProductId } from "@/lib/catalog";
import type { RankBand } from "@/lib/eligibility";
import type { Branch } from "@/lib/translation-schema";

type Timestamp = string;

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type ConsentState = "granted" | "denied" | "unknown";
export type ConversionStatus = "pending" | "sent" | "failed" | "skipped";
export type UsageKind = "pmi_narrative" | "resume_bullets";
export type VerificationStatus = "unverified" | "supervisor_reviewed";

type ExperienceEntryFields = {
  title: string;
  role: string | null;
  start_month: string | null;
  end_month: string | null;
  is_project: boolean | null;
  led: boolean | null;
  objective: string | null;
  responsibilities: string | null;
  deliverables: string | null;
  stakeholders: string | null;
  outcomes: string | null;
  evidence_notes: string | null;
  verifier_role: string | null;
  verification_status: VerificationStatus;
  verification_note: string | null;
  resume_draft: Json | null;
  resume_final: Json | null;
};

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
          kind: UsageKind;
          created_at: Timestamp;
        };
        Insert: {
          user_id: string;
          model: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          kind?: UsageKind;
          created_at?: Timestamp;
        };
        Update: {
          model?: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
        };
        Relationships: [];
      };
      experience_entries: {
        Row: ExperienceEntryFields & { id: string; user_id: string; created_at: Timestamp; updated_at: Timestamp };
        Insert: Partial<ExperienceEntryFields> & {
          title: string;
          id?: string;
          user_id: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<ExperienceEntryFields> & { updated_at?: Timestamp };
        Relationships: [];
      };
      saved_translations: {
        Row: {
          id: string;
          user_id: string;
          branch: Branch;
          project_title: string;
          civilian_project_title: string;
          start_month: string;
          end_month: string;
          input: Json;
          translation: Json;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          branch: Branch;
          project_title: string;
          civilian_project_title: string;
          start_month: string;
          end_month: string;
          input: Json;
          translation: Json;
          created_at?: Timestamp;
        };
        Update: never;
        Relationships: [];
      };
      member_plans: {
        Row: {
          user_id: string;
          input: Json | null;
          completed: string[];
          mapper: Json;
          pathway: Json | null;
          updated_at: Timestamp;
        };
        Insert: {
          user_id: string;
          input?: Json | null;
          completed?: string[];
          mapper?: Json;
          pathway?: Json | null;
          updated_at?: Timestamp;
        };
        Update: {
          input?: Json | null;
          completed?: string[];
          mapper?: Json;
          pathway?: Json | null;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      checkout_attribution: {
        Row: {
          checkout_session_id: string;
          user_id: string | null;
          fbp: string | null;
          fbc: string | null;
          ttclid: string | null;
          ttp: string | null;
          client_ip: string | null;
          user_agent: string | null;
          event_source_url: string | null;
          consent: ConsentState;
          branch: Branch | null;
          paygrade_group: RankBand | null;
          landing_path: string | null;
          created_at: Timestamp;
        };
        Insert: {
          checkout_session_id: string;
          user_id?: string | null;
          fbp?: string | null;
          fbc?: string | null;
          ttclid?: string | null;
          ttp?: string | null;
          client_ip?: string | null;
          user_agent?: string | null;
          event_source_url?: string | null;
          consent?: ConsentState;
          branch?: Branch | null;
          paygrade_group?: RankBand | null;
          landing_path?: string | null;
          created_at?: Timestamp;
        };
        Update: { user_id?: string | null };
        Relationships: [];
      };
      conversion_events: {
        Row: {
          id: number;
          platform: "meta" | "tiktok";
          event_name: string;
          event_id: string;
          status: ConversionStatus;
          attempts: number;
          response_code: number | null;
          last_error: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          platform: "meta" | "tiktok";
          event_name: string;
          event_id: string;
          status: ConversionStatus;
          attempts?: number;
          response_code?: number | null;
          last_error?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          status?: ConversionStatus;
          attempts?: number;
          response_code?: number | null;
          last_error?: string | null;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      email_deliveries: {
        Row: {
          id: number;
          dedupe_key: string;
          kind: string;
          to_email: string;
          provider_message_id: string | null;
          status: "pending" | "sent" | "failed";
          last_error: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          dedupe_key: string;
          kind: string;
          to_email: string;
          provider_message_id?: string | null;
          status: "pending" | "sent" | "failed";
          last_error?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          provider_message_id?: string | null;
          status?: "pending" | "sent" | "failed";
          last_error?: string | null;
          updated_at?: Timestamp;
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
