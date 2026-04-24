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
  public: {
    Tables: {
      branches: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          is_main: boolean
          name: string
          organization_id: string
          phone: string | null
          settings: Json
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_main?: boolean
          name: string
          organization_id: string
          phone?: string | null
          settings?: Json
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_main?: boolean
          name?: string
          organization_id?: string
          phone?: string | null
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          branch_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          organization_id: string
          reference_id: string | null
          reference_type: string | null
          session_id: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Insert: {
          amount: number
          branch_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id: string
          reference_id?: string | null
          reference_type?: string | null
          session_id: string
          type: Database["public"]["Enums"]["cash_movement_type"]
        }
        Update: {
          amount?: number
          branch_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          reference_id?: string | null
          reference_type?: string | null
          session_id?: string
          type?: Database["public"]["Enums"]["cash_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          branch_id: string
          closed_at: string | null
          closed_by: string | null
          closing_amount: number | null
          difference: number | null
          expected_amount: number | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_amount: number
          organization_id: string
          status: string
        }
        Insert: {
          branch_id: string
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_amount?: number
          organization_id: string
          status?: string
        }
        Update: {
          branch_id?: string
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_amount?: number
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      current_account_transactions: {
        Row: {
          account_id: string
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          organization_id: string
          sale_id: string | null
          type: Database["public"]["Enums"]["account_transaction_type"]
        }
        Insert: {
          account_id: string
          amount: number
          balance_after: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id: string
          sale_id?: string | null
          type: Database["public"]["Enums"]["account_transaction_type"]
        }
        Update: {
          account_id?: string
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          sale_id?: string | null
          type?: Database["public"]["Enums"]["account_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "current_account_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "current_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "current_account_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cat_sale"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      current_accounts: {
        Row: {
          balance: number
          created_at: string
          credit_limit: number | null
          customer_id: string
          id: string
          notes: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          credit_limit?: number | null
          customer_id: string
          id?: string
          notes?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          credit_limit?: number | null
          customer_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "current_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "current_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          alias: string | null
          birthday: string | null
          created_at: string
          cuit: string | null
          dni: string | null
          email: string | null
          full_name: string
          has_account: boolean
          id: string
          is_active: boolean
          notes: string | null
          organization_id: string
          phone: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          alias?: string | null
          birthday?: string | null
          created_at?: string
          cuit?: string | null
          dni?: string | null
          email?: string | null
          full_name: string
          has_account?: boolean
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id: string
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          alias?: string | null
          birthday?: string | null
          created_at?: string
          cuit?: string | null
          dni?: string | null
          email?: string | null
          full_name?: string
          has_account?: boolean
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          branch_id: string
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          organization_id: string
          receipt_url: string | null
          session_id: string | null
          supplier_id: string | null
        }
        Insert: {
          amount: number
          branch_id: string
          category?: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          organization_id: string
          receipt_url?: string | null
          session_id?: string | null
          supplier_id?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          organization_id?: string
          receipt_url?: string | null
          session_id?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          afip_comp_nro: number | null
          afip_comp_tipo: number | null
          afip_punto_venta: number | null
          branch_id: string
          cae: string | null
          cae_vto: string | null
          created_at: string
          customer_address: string | null
          customer_cuit: string | null
          customer_id: string | null
          customer_name: string | null
          id: string
          invoice_type: Database["public"]["Enums"]["invoice_type"]
          issued_at: string | null
          items: Json
          organization_id: string
          pdf_url: string | null
          qr_data: string | null
          sale_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          afip_comp_nro?: number | null
          afip_comp_tipo?: number | null
          afip_punto_venta?: number | null
          branch_id: string
          cae?: string | null
          cae_vto?: string | null
          created_at?: string
          customer_address?: string | null
          customer_cuit?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          invoice_type: Database["public"]["Enums"]["invoice_type"]
          issued_at?: string | null
          items?: Json
          organization_id: string
          pdf_url?: string | null
          qr_data?: string | null
          sale_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          afip_comp_nro?: number | null
          afip_comp_tipo?: number | null
          afip_punto_venta?: number | null
          branch_id?: string
          cae?: string | null
          cae_vto?: string | null
          created_at?: string
          customer_address?: string | null
          customer_cuit?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          invoice_type?: Database["public"]["Enums"]["invoice_type"]
          issued_at?: string | null
          items?: Json
          organization_id?: string
          pdf_url?: string | null
          qr_data?: string | null
          sale_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          organization_id: string
          read_at: string | null
          sent_at: string | null
          title: string
          type: Database["public"]["Enums"]["alert_type"]
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          organization_id: string
          read_at?: string | null
          sent_at?: string | null
          title: string
          type: Database["public"]["Enums"]["alert_type"]
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          organization_id?: string
          read_at?: string | null
          sent_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["alert_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          cuit: string | null
          currency: string
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json
          slug: string
          timezone: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          cuit?: string | null
          currency?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json
          slug: string
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          cuit?: string | null
          currency?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json
          slug?: string
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pending_sales: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          items: Json
          label: string | null
          notes: string | null
          organization_id: string
          session_id: string | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          items?: Json
          label?: string | null
          notes?: string | null
          organization_id: string
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          items?: Json
          label?: string | null
          notes?: string | null
          organization_id?: string
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_sales_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          change_pct: number | null
          changed_at: string
          changed_by: string | null
          id: string
          organization_id: string
          price_cost_new: number | null
          price_cost_old: number | null
          price_sell_new: number | null
          price_sell_old: number | null
          product_id: string
          reason: string | null
        }
        Insert: {
          change_pct?: number | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          organization_id: string
          price_cost_new?: number | null
          price_cost_old?: number | null
          price_sell_new?: number | null
          price_sell_old?: number | null
          product_id: string
          reason?: string | null
        }
        Update: {
          change_pct?: number | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          organization_id?: string
          price_cost_new?: number | null
          price_cost_old?: number | null
          price_sell_new?: number | null
          price_sell_old?: number | null
          product_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          organization_id: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          organization_id: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_negative: boolean
          barcode: string | null
          brand: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          label_template: Json | null
          name: string
          organization_id: string
          price_cost: number | null
          price_sell: number
          price_sell_b: number | null
          sku: string | null
          stock_current: number
          stock_max: number | null
          stock_min: number
          tax_rate: number
          track_stock: boolean
          unit: string
          updated_at: string
        }
        Insert: {
          allow_negative?: boolean
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          label_template?: Json | null
          name: string
          organization_id: string
          price_cost?: number | null
          price_sell?: number
          price_sell_b?: number | null
          sku?: string | null
          stock_current?: number
          stock_max?: number | null
          stock_min?: number
          tax_rate?: number
          track_stock?: boolean
          unit?: string
          updated_at?: string
        }
        Update: {
          allow_negative?: boolean
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          label_template?: Json | null
          name?: string
          organization_id?: string
          price_cost?: number | null
          price_sell?: number
          price_sell_b?: number | null
          sku?: string | null
          stock_current?: number
          stock_max?: number | null
          stock_min?: number
          tax_rate?: number
          track_stock?: boolean
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dni: string | null
          full_name: string | null
          id: string
          is_super_admin: boolean
          phone: string | null
          preferences: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dni?: string | null
          full_name?: string | null
          id: string
          is_super_admin?: boolean
          phone?: string | null
          preferences?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dni?: string | null
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          phone?: string | null
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          organization_id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          organization_id: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          organization_id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          barcode: string | null
          created_at: string
          discount_pct: number
          id: string
          name: string
          organization_id: string
          product_id: string | null
          quantity: number
          sale_id: string
          subtotal: number
          tax_rate: number
          unit_price: number
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          discount_pct?: number
          id?: string
          name: string
          organization_id: string
          product_id?: string | null
          quantity?: number
          sale_id: string
          subtotal: number
          tax_rate?: number
          unit_price: number
        }
        Update: {
          barcode?: string | null
          created_at?: string
          discount_pct?: number
          id?: string
          name?: string
          organization_id?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          subtotal?: number
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_paid: number | null
          branch_id: string
          change_amount: number | null
          completed_at: string | null
          created_at: string
          customer_id: string | null
          discount_amount: number
          discount_pct: number
          hold_label: string | null
          id: string
          notes: string | null
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          sale_number: number | null
          session_id: string | null
          sold_by: string | null
          status: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          branch_id: string
          change_amount?: number | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          discount_pct?: number
          hold_label?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_number?: number | null
          session_id?: string | null
          sold_by?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          branch_id?: string
          change_amount?: number | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          discount_pct?: number
          hold_label?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_number?: number | null
          session_id?: string | null
          sold_by?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at: string
          current_stock: number | null
          id: string
          is_resolved: boolean
          organization_id: string
          product_id: string
          resolved_at: string | null
          threshold: number | null
        }
        Insert: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          current_stock?: number | null
          id?: string
          is_resolved?: boolean
          organization_id: string
          product_id: string
          resolved_at?: string | null
          threshold?: number | null
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          current_stock?: number | null
          id?: string
          is_resolved?: boolean
          organization_id?: string
          product_id?: string
          resolved_at?: string | null
          threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          is_active: boolean
          max_branches: number
          max_users: number
          mp_plan_id: string | null
          name: string
          price_ars: number
          type: Database["public"]["Enums"]["plan_type"]
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_branches?: number
          max_users?: number
          mp_plan_id?: string | null
          name: string
          price_ars?: number
          type: Database["public"]["Enums"]["plan_type"]
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_branches?: number
          max_users?: number
          mp_plan_id?: string | null
          name?: string
          price_ars?: number
          type?: Database["public"]["Enums"]["plan_type"]
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          mp_payer_id: string | null
          mp_subscription_id: string | null
          organization_id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_payer_id?: string | null
          mp_subscription_id?: string | null
          organization_id: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_payer_id?: string | null
          mp_subscription_id?: string | null
          organization_id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          organization_id: string
          product_id: string
          supplier_id: string
          supplier_price: number | null
          supplier_sku: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id: string
          product_id: string
          supplier_id: string
          supplier_price?: number | null
          supplier_sku?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          product_id?: string
          supplier_id?: string
          supplier_price?: number | null
          supplier_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          alias: string | null
          category: string | null
          contact_name: string | null
          created_at: string
          cuil: string | null
          cuit: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          alias?: string | null
          category?: string | null
          contact_name?: string | null
          created_at?: string
          cuil?: string | null
          cuit?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          alias?: string | null
          category?: string | null
          contact_name?: string | null
          created_at?: string
          cuil?: string | null
          cuit?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_ids: { Args: never; Returns: string[] }
      get_user_role: {
        Args: { org_id: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
      is_super_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      account_transaction_type: "charge" | "payment" | "adjustment"
      alert_type: "low_stock" | "out_of_stock" | "price_change" | "subscription"
      cash_movement_type:
        | "sale"
        | "expense"
        | "deposit"
        | "withdrawal"
        | "opening"
        | "closing"
      invoice_status: "draft" | "issued" | "canceled" | "voided"
      invoice_type: "A" | "B" | "C" | "ticket" | "non_fiscal"
      member_role: "owner" | "admin" | "cashier"
      payment_method:
        | "cash"
        | "debit"
        | "credit"
        | "transfer"
        | "mercadopago"
        | "current_account"
        | "mixed"
      plan_type: "free_trial" | "basic" | "pro"
      sale_status: "completed" | "on_hold" | "canceled" | "refunded"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "paused"
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
      account_transaction_type: ["charge", "payment", "adjustment"],
      alert_type: ["low_stock", "out_of_stock", "price_change", "subscription"],
      cash_movement_type: [
        "sale",
        "expense",
        "deposit",
        "withdrawal",
        "opening",
        "closing",
      ],
      invoice_status: ["draft", "issued", "canceled", "voided"],
      invoice_type: ["A", "B", "C", "ticket", "non_fiscal"],
      member_role: ["owner", "admin", "cashier"],
      payment_method: [
        "cash",
        "debit",
        "credit",
        "transfer",
        "mercadopago",
        "current_account",
        "mixed",
      ],
      plan_type: ["free_trial", "basic", "pro"],
      sale_status: ["completed", "on_hold", "canceled", "refunded"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "paused",
      ],
    },
  },
} as const

