export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Company = {
  id: string;
  name: string;
  tax_id: string | null;
  default_currency: string;
  created_at: string;
  updated_at: string;
};

export type LineUserRole = "staff" | "reviewer" | "approver" | "admin";

export type LineUser = {
  id: string;
  company_id: string | null;
  line_user_id: string;
  display_name: string | null;
  role: LineUserRole;
  created_at: string;
  updated_at: string;
};

export type DocumentSourceType = "line" | "web_upload" | "email" | "manual";
export type DocumentType =
  | "unknown"
  | "slip"
  | "receipt"
  | "tax_invoice"
  | "cash_bill"
  | "utility_bill"
  | "order_screenshot"
  | "pdf"
  | "text_note"
  | "other";
export type DocumentStatus =
  | "received"
  | "extracted"
  | "matched"
  | "archived"
  | "rejected";

export type Document = {
  id: string;
  company_id: string;
  source_type: DocumentSourceType;
  source_channel_id: string | null;
  source_user_id: string | null;
  original_file_name: string | null;
  mime_type: string | null;
  storage_bucket: string;
  storage_path: string;
  document_type: DocumentType;
  status: DocumentStatus;
  received_at: string;
  created_at: string;
  updated_at: string;
};

export type DocumentExtraction = {
  id: string;
  document_id: string;
  model_name: string;
  raw_text: string | null;
  extracted_payload: Json;
  confidence_score: number | null;
  warnings: Json;
  created_at: string;
};

export type ExpenseCaseStatus =
  | "inbox"
  | "needs_review"
  | "ready_to_approve"
  | "approved"
  | "rejected"
  | "exported";

export type ExpenseCase = {
  id: string;
  company_id: string;
  case_no: string;
  month: string;
  status: ExpenseCaseStatus;
  expense_date: string | null;
  description: string | null;
  vendor: string | null;
  amount: number | null;
  vat_amount: number | null;
  withholding_tax: number | null;
  net_amount: number | null;
  currency: string;
  category: string | null;
  payment_method: string | null;
  bank_name: string | null;
  transfer_ref: string | null;
  confidence_score: number | null;
  reviewer_note: string | null;
  submitted_by_line_user_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  exported_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ExpenseCaseDocumentRole =
  | "payment_slip"
  | "order_proof"
  | "receipt"
  | "tax_invoice"
  | "utility_bill"
  | "supporting_doc"
  | "other";

export type ExpenseCaseDocument = {
  id: string;
  expense_case_id: string;
  document_id: string;
  role: ExpenseCaseDocumentRole;
  page_order: number;
  created_at: string;
};

export type AccountingReportType =
  | "substitute_receipt"
  | "payment_voucher"
  | "monthly_pack"
  | "export_sheet";
export type AccountingReportStatus =
  | "draft"
  | "generated"
  | "sent_to_accountant"
  | "archived";

export type AccountingReport = {
  id: string;
  company_id: string;
  month: string;
  report_type: AccountingReportType;
  status: AccountingReportStatus;
  storage_bucket: string | null;
  storage_path: string | null;
  generated_by: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportExportType =
  | "docx"
  | "pdf"
  | "xlsx"
  | "csv"
  | "google_sheet"
  | "google_drive_folder";

export type ReportExport = {
  id: string;
  accounting_report_id: string;
  export_type: ReportExportType;
  storage_bucket: string | null;
  storage_path: string | null;
  external_url: string | null;
  created_at: string;
};

export type CompanyIntegrationType =
  | "line"
  | "google_drive"
  | "google_sheets"
  | "gmail"
  | "vercel"
  | "openai";
export type CompanyIntegrationStatus = "inactive" | "active" | "error";

export type CompanyIntegration = {
  id: string;
  company_id: string;
  integration_type: CompanyIntegrationType;
  config: Json;
  status: CompanyIntegrationStatus;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  company_id: string | null;
  actor_line_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  payload: Json;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Omit<Company, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Company, "id" | "created_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
      line_users: {
        Row: LineUser;
        Insert: Omit<LineUser, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<LineUser, "id" | "created_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, "id" | "received_at" | "created_at" | "updated_at"> & {
          id?: string;
          received_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Document, "id" | "created_at" | "received_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
      document_extractions: {
        Row: DocumentExtraction;
        Insert: Omit<DocumentExtraction, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<DocumentExtraction, "id" | "created_at">>;
        Relationships: [];
      };
      expense_cases: {
        Row: ExpenseCase;
        Insert: Omit<ExpenseCase, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ExpenseCase, "id" | "created_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
      expense_case_documents: {
        Row: ExpenseCaseDocument;
        Insert: Omit<ExpenseCaseDocument, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ExpenseCaseDocument, "id" | "created_at">>;
        Relationships: [];
      };
      accounting_reports: {
        Row: AccountingReport;
        Insert: Omit<AccountingReport, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<AccountingReport, "id" | "created_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
      report_exports: {
        Row: ReportExport;
        Insert: Omit<ReportExport, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ReportExport, "id" | "created_at">>;
        Relationships: [];
      };
      company_integrations: {
        Row: CompanyIntegration;
        Insert: Omit<CompanyIntegration, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<CompanyIntegration, "id" | "created_at">> & {
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<AuditLog, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
