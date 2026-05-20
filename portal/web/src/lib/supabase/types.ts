export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspace_preferences: {
        Row: {
          workspace_id: string;
          active_year: number | null;
          harvest_prices: Json;
          weather_location: Json | null;
          frost_window: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          active_year?: number | null;
          harvest_prices?: Json;
          weather_location?: Json | null;
          frost_window?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          active_year?: number | null;
          harvest_prices?: Json;
          weather_location?: Json | null;
          frost_window?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["workspace_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          created_at?: string;
        };
      };
      seed_templates: {
        Row: {
          id: string;
          legacy_id: string | null;
          family: string;
          latin_family: string;
          crop: string;
          variety: string;
          method: string;
          forsaddStart: number | null;
          forsaddEnd: number | null;
          transplantStart: number | null;
          transplantEnd: number | null;
          directStart: number | null;
          directEnd: number | null;
          harvestStart: number | null;
          harvestEnd: number | null;
          culture_time: string;
          spacing: string;
          row_spacing: string;
          seed_per_75: number | null;
          seed_per_m2: number | null;
          harvest_interval: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          legacy_id?: string | null;
          family?: string;
          latin_family?: string;
          crop: string;
          variety?: string;
          method?: string;
          forsaddStart?: number | null;
          forsaddEnd?: number | null;
          transplantStart?: number | null;
          transplantEnd?: number | null;
          directStart?: number | null;
          directEnd?: number | null;
          harvestStart?: number | null;
          harvestEnd?: number | null;
          culture_time?: string;
          spacing?: string;
          row_spacing?: string;
          seed_per_75?: number | null;
          seed_per_m2?: number | null;
          harvest_interval?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          legacy_id?: string | null;
          family?: string;
          latin_family?: string;
          crop?: string;
          variety?: string;
          method?: string;
          forsaddStart?: number | null;
          forsaddEnd?: number | null;
          transplantStart?: number | null;
          transplantEnd?: number | null;
          directStart?: number | null;
          directEnd?: number | null;
          harvestStart?: number | null;
          harvestEnd?: number | null;
          culture_time?: string;
          spacing?: string;
          row_spacing?: string;
          seed_per_75?: number | null;
          seed_per_m2?: number | null;
          harvest_interval?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      personal_seeds: {
        Row: {
          id: string;
          workspace_id: string;
          template_id: string | null;
          legacy_id: string | null;
          family: string;
          latin_family: string;
          crop: string;
          variety: string;
          method: string;
          schedule: Json;
          culture_time: string;
          spacing: string;
          row_spacing: string;
          seed_per_75: number | null;
          seed_per_m2: number | null;
          expiration_year: number | null;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          template_id?: string | null;
          legacy_id?: string | null;
          family?: string;
          latin_family?: string;
          crop: string;
          variety?: string;
          method?: string;
          schedule?: Json;
          culture_time?: string;
          spacing?: string;
          row_spacing?: string;
          seed_per_75?: number | null;
          seed_per_m2?: number | null;
          expiration_year?: number | null;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          template_id?: string | null;
          legacy_id?: string | null;
          family?: string;
          latin_family?: string;
          crop?: string;
          variety?: string;
          method?: string;
          schedule?: Json;
          culture_time?: string;
          spacing?: string;
          row_spacing?: string;
          seed_per_75?: number | null;
          seed_per_m2?: number | null;
          expiration_year?: number | null;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      seed_stock_batches: {
        Row: {
          id: string;
          workspace_id: string;
          personal_seed_id: string | null;
          legacy_id: string | null;
          name: string;
          crop: string;
          variety: string;
          quantity: number;
          purchase_year: number | null;
          expiration_year: number | null;
          supplier: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          personal_seed_id?: string | null;
          legacy_id?: string | null;
          name?: string;
          crop?: string;
          variety?: string;
          quantity?: number;
          purchase_year?: number | null;
          expiration_year?: number | null;
          supplier?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          personal_seed_id?: string | null;
          legacy_id?: string | null;
          name?: string;
          crop?: string;
          variety?: string;
          quantity?: number;
          purchase_year?: number | null;
          expiration_year?: number | null;
          supplier?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      seed_stock_usages: {
        Row: {
          id: string;
          workspace_id: string;
          seed_stock_batch_id: string | null;
          task_id: string | null;
          crop_id: string | null;
          seed_count: number;
          note: string;
          used_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          seed_stock_batch_id?: string | null;
          task_id?: string | null;
          crop_id?: string | null;
          seed_count: number;
          note?: string;
          used_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          seed_stock_batch_id?: string | null;
          task_id?: string | null;
          crop_id?: string | null;
          seed_count?: number;
          note?: string;
          used_at?: string;
        };
      };
      sections: {
        Row: {
          id: string;
          workspace_id: string;
          legacy_id: string | null;
          name: string;
          description: string;
          family: string;
          rotation_enabled: boolean;
          rotation_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          legacy_id?: string | null;
          name: string;
          description?: string;
          family?: string;
          rotation_enabled?: boolean;
          rotation_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          legacy_id?: string | null;
          name?: string;
          description?: string;
          family?: string;
          rotation_enabled?: boolean;
          rotation_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      fields: {
        Row: {
          id: string;
          workspace_id: string;
          section_id: string | null;
          legacy_id: string | null;
          name: string;
          type: Database["public"]["Enums"]["field_type"];
          description: string;
          width_m: number | null;
          length_m: number | null;
          rows: number | null;
          rotation_deg: number;
          position_x: number | null;
          position_y: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          section_id?: string | null;
          legacy_id?: string | null;
          name: string;
          type?: Database["public"]["Enums"]["field_type"];
          description?: string;
          width_m?: number | null;
          length_m?: number | null;
          rows?: number | null;
          rotation_deg?: number;
          position_x?: number | null;
          position_y?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          section_id?: string | null;
          legacy_id?: string | null;
          name?: string;
          type?: Database["public"]["Enums"]["field_type"];
          description?: string;
          width_m?: number | null;
          length_m?: number | null;
          rows?: number | null;
          rotation_deg?: number;
          position_x?: number | null;
          position_y?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      crops: {
        Row: {
          id: string;
          workspace_id: string;
          personal_seed_id: string | null;
          legacy_id: string | null;
          title: string;
          batch_name: string;
          area_m2: number | null;
          note: string;
          start_year: number;
          end_year: number;
          schedule: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          personal_seed_id?: string | null;
          legacy_id?: string | null;
          title: string;
          batch_name?: string;
          area_m2?: number | null;
          note?: string;
          start_year: number;
          end_year: number;
          schedule?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          personal_seed_id?: string | null;
          legacy_id?: string | null;
          title?: string;
          batch_name?: string;
          area_m2?: number | null;
          note?: string;
          start_year?: number;
          end_year?: number;
          schedule?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      crop_fields: {
        Row: {
          crop_id: string;
          field_id: string;
          planned_rows: number | null;
          planned_area_m2: number | null;
          row_spacing_cm: number | null;
          plant_spacing_cm: number | null;
          planned_seed_count: number | null;
          seed_stock_batch_id: string | null;
        };
        Insert: {
          crop_id: string;
          field_id: string;
          planned_rows?: number | null;
          planned_area_m2?: number | null;
          row_spacing_cm?: number | null;
          plant_spacing_cm?: number | null;
          planned_seed_count?: number | null;
          seed_stock_batch_id?: string | null;
        };
        Update: {
          crop_id?: string;
          field_id?: string;
          planned_rows?: number | null;
          planned_area_m2?: number | null;
          row_spacing_cm?: number | null;
          plant_spacing_cm?: number | null;
          planned_seed_count?: number | null;
          seed_stock_batch_id?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          workspace_id: string;
          crop_id: string | null;
          field_id: string | null;
          title: string;
          description: string;
          status: Database["public"]["Enums"]["task_status"];
          due_date: string | null;
          completed_at: string | null;
          source: Database["public"]["Enums"]["task_source"];
          legacy_event_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          crop_id?: string | null;
          field_id?: string | null;
          title: string;
          description?: string;
          status?: Database["public"]["Enums"]["task_status"];
          due_date?: string | null;
          completed_at?: string | null;
          source?: Database["public"]["Enums"]["task_source"];
          legacy_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          crop_id?: string | null;
          field_id?: string | null;
          title?: string;
          description?: string;
          status?: Database["public"]["Enums"]["task_status"];
          due_date?: string | null;
          completed_at?: string | null;
          source?: Database["public"]["Enums"]["task_source"];
          legacy_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      crop_plantings: {
        Row: {
          id: string;
          workspace_id: string;
          crop_id: string | null;
          field_id: string | null;
          task_id: string | null;
          plant_count: number | null;
          row_count: number | null;
          area_m2: number | null;
          note: string;
          planted_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          crop_id?: string | null;
          field_id?: string | null;
          task_id?: string | null;
          plant_count?: number | null;
          row_count?: number | null;
          area_m2?: number | null;
          note?: string;
          planted_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          crop_id?: string | null;
          field_id?: string | null;
          task_id?: string | null;
          plant_count?: number | null;
          row_count?: number | null;
          area_m2?: number | null;
          note?: string;
          planted_at?: string;
        };
      };
      harvest_entries: {
        Row: {
          id: string;
          workspace_id: string;
          crop_id: string | null;
          field_id: string | null;
          personal_seed_id: string | null;
          legacy_id: string | null;
          legacy_event_id: string | null;
          title: string;
          kg: number;
          area_m2: number | null;
          week: number | null;
          month: number | null;
          year: number;
          manual: boolean;
          more_to_harvest: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          crop_id?: string | null;
          field_id?: string | null;
          personal_seed_id?: string | null;
          legacy_id?: string | null;
          legacy_event_id?: string | null;
          title: string;
          kg?: number;
          area_m2?: number | null;
          week?: number | null;
          month?: number | null;
          year: number;
          manual?: boolean;
          more_to_harvest?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          crop_id?: string | null;
          field_id?: string | null;
          personal_seed_id?: string | null;
          legacy_id?: string | null;
          legacy_event_id?: string | null;
          title?: string;
          kg?: number;
          area_m2?: number | null;
          week?: number | null;
          month?: number | null;
          year?: number;
          manual?: boolean;
          more_to_harvest?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_workspace_for_current_user: {
        Args: {
          workspace_name: string;
          workspace_slug: string;
        };
        Returns: string;
      };
    };
    Enums: {
      workspace_role: "owner" | "admin" | "member" | "viewer";
      field_type:
        | "bed"
        | "greenhouse"
        | "path"
        | "tree"
        | "house"
        | "fence"
        | "wall"
        | "hedge"
        | "other";
      task_status: "open" | "done" | "archived";
      task_source: "manual" | "import" | "system";
    };
    CompositeTypes: Record<string, never>;
  };
};
