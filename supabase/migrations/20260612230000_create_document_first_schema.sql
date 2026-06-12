create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text,
  default_currency text not null default 'THB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_default_currency_check check (default_currency ~ '^[A-Z]{3}$')
);

create table if not exists public.line_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  line_user_id text not null unique,
  display_name text,
  role text not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint line_users_role_check check (role in ('staff', 'reviewer', 'approver', 'admin'))
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source_type text not null,
  source_channel_id text,
  source_user_id text,
  original_file_name text,
  mime_type text,
  storage_bucket text not null,
  storage_path text not null,
  document_type text not null default 'unknown',
  status text not null default 'received',
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_source_type_check check (source_type in ('line', 'web_upload', 'email', 'manual')),
  constraint documents_document_type_check check (document_type in ('unknown', 'slip', 'receipt', 'tax_invoice', 'cash_bill', 'utility_bill', 'order_screenshot', 'pdf', 'text_note', 'other')),
  constraint documents_status_check check (status in ('received', 'extracted', 'matched', 'archived', 'rejected'))
);

create table if not exists public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  model_name text not null,
  raw_text text,
  extracted_payload jsonb not null default '{}'::jsonb,
  confidence_score numeric,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint document_extractions_confidence_score_check check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1))
);

create table if not exists public.expense_cases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  case_no text not null unique,
  month text not null,
  status text not null default 'inbox',
  expense_date date,
  description text,
  vendor text,
  amount numeric(12,2),
  vat_amount numeric(12,2),
  withholding_tax numeric(12,2),
  net_amount numeric(12,2),
  currency text not null default 'THB',
  category text,
  payment_method text,
  bank_name text,
  transfer_ref text,
  confidence_score numeric,
  reviewer_note text,
  submitted_by_line_user_id text,
  approved_by uuid references public.line_users(id) on delete set null,
  approved_at timestamptz,
  exported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expense_cases_status_check check (status in ('inbox', 'needs_review', 'ready_to_approve', 'approved', 'rejected', 'exported')),
  constraint expense_cases_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint expense_cases_confidence_score_check check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),
  constraint expense_cases_month_check check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  constraint expense_cases_approved_requires_human_check check (
    status <> 'approved' or approved_by is not null
  )
);

create table if not exists public.expense_case_documents (
  id uuid primary key default gen_random_uuid(),
  expense_case_id uuid not null references public.expense_cases(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  role text not null default 'supporting_doc',
  page_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint expense_case_documents_role_check check (role in ('payment_slip', 'order_proof', 'receipt', 'tax_invoice', 'utility_bill', 'supporting_doc', 'other')),
  constraint expense_case_documents_unique unique (expense_case_id, document_id)
);

create table if not exists public.accounting_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  month text not null,
  report_type text not null,
  status text not null default 'draft',
  storage_bucket text,
  storage_path text,
  generated_by uuid references public.line_users(id) on delete set null,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounting_reports_month_check check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  constraint accounting_reports_report_type_check check (report_type in ('substitute_receipt', 'payment_voucher', 'monthly_pack', 'export_sheet')),
  constraint accounting_reports_status_check check (status in ('draft', 'generated', 'sent_to_accountant', 'archived'))
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  accounting_report_id uuid not null references public.accounting_reports(id) on delete cascade,
  export_type text not null,
  storage_bucket text,
  storage_path text,
  external_url text,
  created_at timestamptz not null default now(),
  constraint report_exports_export_type_check check (export_type in ('docx', 'pdf', 'xlsx', 'csv', 'google_sheet', 'google_drive_folder'))
);

create table if not exists public.company_integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  integration_type text not null,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'inactive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_integrations_integration_type_check check (integration_type in ('line', 'google_drive', 'google_sheets', 'gmail', 'vercel', 'openai')),
  constraint company_integrations_status_check check (status in ('inactive', 'active', 'error'))
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  actor_line_user_id text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists line_users_company_id_idx on public.line_users (company_id);
create index if not exists line_users_line_user_id_idx on public.line_users (line_user_id);
create index if not exists documents_company_id_idx on public.documents (company_id);
create index if not exists documents_source_type_idx on public.documents (source_type);
create index if not exists documents_document_type_idx on public.documents (document_type);
create index if not exists documents_status_idx on public.documents (status);
create index if not exists expense_cases_company_id_idx on public.expense_cases (company_id);
create index if not exists expense_cases_month_idx on public.expense_cases (month);
create index if not exists expense_cases_status_idx on public.expense_cases (status);
create index if not exists expense_cases_transfer_ref_idx on public.expense_cases (transfer_ref);
create index if not exists expense_case_documents_expense_case_id_idx on public.expense_case_documents (expense_case_id);
create index if not exists expense_case_documents_document_id_idx on public.expense_case_documents (document_id);
create index if not exists accounting_reports_company_id_idx on public.accounting_reports (company_id);
create index if not exists accounting_reports_month_idx on public.accounting_reports (month);
create index if not exists accounting_reports_status_idx on public.accounting_reports (status);
create index if not exists company_integrations_company_id_idx on public.company_integrations (company_id);
create index if not exists company_integrations_status_idx on public.company_integrations (status);
create index if not exists audit_logs_company_id_idx on public.audit_logs (company_id);

alter table public.companies enable row level security;
alter table public.line_users enable row level security;
alter table public.documents enable row level security;
alter table public.document_extractions enable row level security;
alter table public.expense_cases enable row level security;
alter table public.expense_case_documents enable row level security;
alter table public.accounting_reports enable row level security;
alter table public.report_exports enable row level security;
alter table public.company_integrations enable row level security;
alter table public.audit_logs enable row level security;

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

drop trigger if exists line_users_set_updated_at on public.line_users;
create trigger line_users_set_updated_at
before update on public.line_users
for each row
execute function public.set_updated_at();

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

drop trigger if exists expense_cases_set_updated_at on public.expense_cases;
create trigger expense_cases_set_updated_at
before update on public.expense_cases
for each row
execute function public.set_updated_at();

drop trigger if exists accounting_reports_set_updated_at on public.accounting_reports;
create trigger accounting_reports_set_updated_at
before update on public.accounting_reports
for each row
execute function public.set_updated_at();

drop trigger if exists company_integrations_set_updated_at on public.company_integrations;
create trigger company_integrations_set_updated_at
before update on public.company_integrations
for each row
execute function public.set_updated_at();
