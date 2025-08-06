export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          query?: string;
          operationName?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      ai_runs: {
        Row: {
          confidence: number | null;
          created_at: string;
          error_message: string | null;
          id: number;
          prompt: string;
          recipe_id: string;
          response: Json | null;
          status: Database["public"]["Enums"]["ai_status"];
        };
        Insert: {
          confidence?: number | null;
          created_at?: string;
          error_message?: string | null;
          id?: never;
          prompt: string;
          recipe_id: string;
          response?: Json | null;
          status: Database["public"]["Enums"]["ai_status"];
        };
        Update: {
          confidence?: number | null;
          created_at?: string;
          error_message?: string | null;
          id?: never;
          prompt?: string;
          recipe_id?: string;
          response?: Json | null;
          status?: Database["public"]["Enums"]["ai_status"];
        };
        Relationships: [
          {
            foreignKeyName: "ai_runs_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          allergens: Json;
          calorie_target: number;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          allergens?: Json;
          calorie_target: number;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          allergens?: Json;
          calorie_target?: number;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          carbs_g: number | null;
          created_at: string;
          description: string | null;
          fat_g: number | null;
          id: string;
          ingredients: Json;
          is_manual_override: boolean;
          kcal: number | null;
          name: string;
          protein_g: number | null;
          steps: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          carbs_g?: number | null;
          created_at?: string;
          description?: string | null;
          fat_g?: number | null;
          id?: string;
          ingredients: Json;
          is_manual_override?: boolean;
          kcal?: number | null;
          name: string;
          protein_g?: number | null;
          steps: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          carbs_g?: number | null;
          created_at?: string;
          description?: string | null;
          fat_g?: number | null;
          id?: string;
          ingredients?: Json;
          is_manual_override?: boolean;
          kcal?: number | null;
          name?: string;
          protein_g?: number | null;
          steps?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      validate_ingredients: {
        Args: { ingredients: Json };
        Returns: boolean;
      };
    };
    Enums: {
      ai_status: "pending" | "success" | "error";
      unit_type:
        | "g"
        | "dag"
        | "kg"
        | "ml"
        | "l"
        | "łyżeczka"
        | "łyżka"
        | "szklanka"
        | "pęczek"
        | "garść"
        | "sztuka"
        | "plaster"
        | "szczypta"
        | "ząbek";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ai_status: ["pending", "success", "error"],
      unit_type: [
        "g",
        "dag",
        "kg",
        "ml",
        "l",
        "łyżeczka",
        "łyżka",
        "szklanka",
        "pęczek",
        "garść",
        "sztuka",
        "plaster",
        "szczypta",
        "ząbek",
      ],
    },
  },
} as const;
