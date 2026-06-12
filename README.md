# Vijit Expense Document Hub

ระบบนี้เป็นโครงการตั้งต้นสำหรับสร้าง `Paypers-style AI Expense Document Hub` ของ บริษัท วิจิตรโอสถ จำกัด โดยเน้นแนวคิด `document-first accounting workflow` ไม่ใช่ระบบที่เริ่มจากการสร้าง expense record โดยตรง

สถานะปัจจุบัน: `planning phase only`

## เป้าหมายของโครงการ

- รองรับการรับเอกสารค่าใช้จ่ายจากหลายช่องทาง เช่น LINE, Web Upload และ Future Email
- ให้ทุกไฟล์ที่อัปโหลดเข้าสู่ระบบในฐานะ `Document` ก่อนเสมอ
- ใช้ AI เพื่อช่วย extraction และ suggestion เท่านั้น
- จัดกลุ่มเอกสารที่เกี่ยวข้องให้เป็น `ExpenseCase`
- ให้มนุษย์เป็นผู้ review และ approve ทุกกรณี
- สร้างรายงานบัญชีรายเดือน โดยเฉพาะเอกสาร `ใบรับรองแทนใบเสร็จรับเงิน`

## Product Flow

`LINE / Web Upload / Future Email -> Document Inbox -> AI Extraction -> Expense Case Matching -> Human Review -> Approval -> Monthly Accounting Outputs`

## หลักการสำคัญ

- ระบบนี้เป็น `document-first`, ไม่ใช่ `expense-first`
- AI extraction เป็นเพียงข้อมูลแนะนำ และต้องไม่ auto-approve รายการบัญชี
- Human approval เป็นข้อบังคับ
- ต้องมี `audit logs`
- ออกแบบให้รองรับบริษัทเดียวก่อน แต่ขยายเป็นหลายบริษัทได้ในอนาคต
- เก็บ implementation ให้ modular
- ห้าม hardcode secrets

## Technology Direction

Stack ที่ตั้งเป้าไว้สำหรับการพัฒนาในระยะถัดไป:

- Next.js App Router
- TypeScript
- Supabase PostgreSQL
- Supabase Storage
- LINE Messaging API
- OpenAI vision extraction
- `docx` package
- GitHub
- Vercel

## สิ่งที่ยังไม่ทำในระยะนี้

เอกสารชุดนี้มีไว้สำหรับการวางแผนเท่านั้น และยังไม่รวม:

- application code
- LINE webhook
- Supabase schema
- deployment

## เอกสารหลัก

- [Product Requirements](docs/product-requirements.md)
- [Architecture](docs/architecture.md)
- [Data Model](docs/data-model.md)
- [Implementation Roadmap](docs/implementation-roadmap.md)
- [Security](docs/security.md)

## Supabase Schema Baseline

The repository now includes a first-pass document-first Supabase schema in:

- `supabase/migrations/20260612230000_create_document_first_schema.sql`
- `supabase/seed.sql`

This baseline is file-based only and does not require real Supabase, LINE, OpenAI, or Vercel secrets to review or commit.

Suggested local commands once the Supabase CLI is available:

```bash
supabase start
supabase db reset
supabase migration list
```

If the project is linked to a remote Supabase database later:

```bash
supabase db push --include-seed
supabase migration list
```

## ขอบเขตเริ่มต้น

ในระยะ planning นี้ เอกสารทั้งหมดจะทำหน้าที่เป็น source of truth สำหรับ:

- product direction
- conceptual architecture
- conceptual data model
- phased delivery roadmap
- security constraints

เอกสารเหล่านี้ควรถูก review ร่วมกันก่อนเริ่ม scaffold repo หรือออกแบบ schema จริง
