# Architecture

## ภาพรวมเชิงสถาปัตยกรรม

ระบบนี้ถูกออกแบบเป็น `document-first accounting workflow system` ที่แยกความรับผิดชอบของแต่ละ subsystem ออกจากกันอย่างชัดเจน เพื่อหลีกเลี่ยงการผูกติดระหว่าง intake channel, AI extraction, approval logic และ reporting

หลักการสำคัญ:

- ทุก incoming item กลายเป็น `Document` ก่อน
- AI extraction สร้าง suggestion และ raw extraction record เท่านั้น
- การจับคู่เอกสารเป็น `ExpenseCase` แยกจาก intake
- approval เป็น human-controlled transition
- accounting outputs สร้างจาก approved cases เท่านั้น

## System Flow

`LINE / Web Upload / Future Email -> Document Inbox -> AI Extraction -> Expense Case Matching -> Human Review -> Approval -> Monthly Accounting Outputs`

## Logical Subsystems

### 1. Intake Channels

หน้าที่:

- รับ input จากหลายช่องทาง
- normalize metadata เบื้องต้นให้พร้อมเข้าสู่ระบบ
- ส่งต่อเข้า `Document Inbox`

ขอบเขต:

- LINE
- Web upload
- Future Email
- Manual text entry

ข้อกำหนดทางสถาปัตยกรรม:

- channel adapter ต้องแยกจาก business workflow
- intake channel ต้องสามารถเพิ่มหรือลดได้โดยไม่กระทบ core document workflow มาก

### 2. Document Storage And Metadata

หน้าที่:

- เก็บไฟล์ต้นฉบับและข้อมูลอ้างอิงของ `Document`
- เก็บ metadata ของแหล่งที่มา, เวลา, sender, content type, และ processing status
- ทำให้ `Document` เป็น source object ตัวแรกของระบบ

ข้อกำหนดทางสถาปัตยกรรม:

- file storage และ business metadata ต้องเชื่อมกันอย่างชัดเจน
- เอกสารถูกมองเป็น sensitive และ untrusted input

### 3. AI Extraction Boundary

หน้าที่:

- อ่าน `Document`
- สร้าง extracted fields และ confidence/warnings
- เก็บ raw extraction output สำหรับ audit และ review

ข้อกำหนดทางสถาปัตยกรรม:

- extraction layer ต้องไม่ทำ approval
- extraction result ต้องสามารถถูกแทนที่หรือแก้ไขโดย reviewer
- model/provider integration ต้องถูกห่ออยู่หลัง service boundary เพื่อเปลี่ยน implementation ได้ในอนาคต

### 4. Expense Case Matching

หน้าที่:

- รวม `Document` หลายใบที่เกี่ยวข้องกันเป็น `ExpenseCase`
- เสนอความเป็นไปได้ของการจับคู่และให้มนุษย์ยืนยัน

ข้อกำหนดทางสถาปัตยกรรม:

- matching logic ต้องแยกจาก intake และ extraction
- matching ต้องรองรับเอกสารหลายชนิดต่อ case เดียว
- ห้ามออกแบบให้พึ่ง adjacency ของ LINE message เป็นหลัก

### 5. Review And Approval Application Layer

หน้าที่:

- ให้ผู้ใช้ตรวจเอกสาร ดู extraction และแก้ไข field
- ให้ reviewer และ approver เปลี่ยนสถานะ case ตามสิทธิ์
- บันทึก approval actions และเหตุผลที่เกี่ยวข้อง

ข้อกำหนดทางสถาปัตยกรรม:

- review และ approval เป็น application workflow ที่ควบคุมด้วย role
- state transition ต้อง audit ได้
- approval logic ต้องไม่กระจายอยู่หลาย subsystem แบบซ้ำซ้อน

### 6. Report Generation Layer

หน้าที่:

- สร้าง `Monthly Accounting Outputs`
- โดยเฉพาะเอกสาร `ใบรับรองแทนใบเสร็จรับเงิน` รายเดือน

ข้อกำหนดทางสถาปัตยกรรม:

- report layer อ่านจาก approved cases
- report generation ไม่ควรแก้ business truth ย้อนกลับไปยังต้นทาง
- output ควรสร้างซ้ำได้จากข้อมูลที่ approved แล้ว
- สำหรับรายงาน `ใบรับรองแทนใบเสร็จรับเงิน` ควรรองรับ evidence pages แบบ one expense case per page where practical

### 7. Audit Logging And Observability

หน้าที่:

- บันทึกเหตุการณ์สำคัญของระบบ
- รองรับการตรวจสอบย้อนหลัง
- รองรับ operational visibility ในอนาคต

ตัวอย่างเหตุการณ์ที่ควร audit:

- document created
- extraction created
- case matched หรือ rematched
- review edited fields
- approval หรือ rejection
- report generated หรือ exported

## High-Level Data Flow

1. Input channel รับไฟล์หรือข้อความเข้ามา
2. ระบบสร้าง `Document` และเก็บไฟล์พร้อม metadata
3. `Document` ถูกส่งเข้าสู่ extraction flow
4. AI extraction สร้าง suggestion และ raw extraction output
5. matching flow จัดเอกสารเป็น `ExpenseCase`
6. reviewer ตรวจสอบและแก้ไขข้อมูล
7. approver อนุมัติหรือปฏิเสธ
8. approved cases ถูกใช้เพื่อสร้าง monthly accounting outputs

## Trust Boundaries

ระบบควรมอง boundary หลักดังนี้:

- external input boundary
  - ไฟล์, รูปภาพ, PDF, OCR text, และ message content จากภายนอกเป็น untrusted input
- AI boundary
  - AI output เป็น suggestion ที่อาจผิด, ขาด, หรือถูก prompt injection ได้
- privileged backend boundary
  - งานที่ใช้ secret หรือ elevated privileges ต้องแยกจาก client
- approval boundary
  - การตัดสินใจทางบัญชีสุดท้ายต้องอยู่ที่ authorized human actor

## Modularity Decisions

เพื่อให้ implementation ในอนาคตดูแลง่าย ควรยึด decisions ต่อไปนี้:

- channel adapters ต้องแยกจาก domain workflow
- `Document`, `ExpenseCase`, approval และ reporting ต้องมีขอบเขต domain ชัดเจน
- AI extraction provider integration ต้องซ่อนอยู่หลัง abstraction
- report generation ต้องเป็น downstream consumer ของ approved data
- audit logging ต้องเป็น cross-cutting concern ที่สอดคล้องกันทั้งระบบ

## Deferred Decisions

หัวข้อต่อไปนี้ตั้งใจเลื่อนไปตัดสินใจในระยะ implementation:

- exact queueing strategy
- background job mechanism
- exact OCR prompt structure
- exact schema fields และ indexes
- exact role model และ permission matrix
- exact report template layout ระดับ pixel/detail
- exact deployment topology

## Current Scope Vs Future Scope

Current scope ของเอกสารนี้:

- logical architecture
- subsystem boundaries
- trust boundaries
- architecture decisions ระดับ concept

Future scope:

- application code
- webhook implementation
- schema implementation
- deployment implementation

## Current Schema Baseline

The current repository baseline now includes a first-pass SQL schema under `supabase/migrations/`.

Key assumptions reflected in that schema:

- `documents` is still the system intake root for every uploaded file.
- `document_extractions` stores advisory AI output only and does not approve accounting outcomes.
- `expense_cases` is the human-reviewed accounting object and can link to multiple documents through `expense_case_documents`.
- monthly grouping currently uses a simple `month` text field in `YYYY-MM` format for both `expense_cases` and `accounting_reports`
- `accounting_reports` remains a downstream reporting layer intended to be generated from approved `expense_cases`

This keeps the architecture aligned with the document-first workflow while avoiding premature implementation of webhook, dashboard, or AI execution details.

## STEP 07 Web Upload Addition

STEP 07 adds a second intake adapter alongside LINE:

- `GET /admin/upload` renders the temporary admin upload page
- `POST /api/admin/documents/upload` validates multipart upload input on the server
- the route reuses the shared document intake service to store the file and create the `documents` row
- uploads remain document-first and write audit logs before any future extraction or matching work

This keeps the architecture aligned with the intended intake boundary:

`LINE / Web Upload -> Document Inbox -> Later Extraction / Review`

The temporary admin gate is intentionally lightweight and runtime-only:

- `ADMIN_SECRET` is validated server-side when configured
- missing `ADMIN_SECRET` does not break build or static rendering
- missing Supabase runtime env fails gracefully at request time instead of at build time
