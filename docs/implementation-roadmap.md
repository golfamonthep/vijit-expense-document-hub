# Implementation Roadmap

## ภาพรวม

roadmap นี้ใช้สำหรับจัดลำดับการพัฒนา `Vijit Expense Document Hub` จากศูนย์ โดยในระยะปัจจุบันยังอยู่ที่ planning phase เท่านั้น

หลักสำคัญของ roadmap:

- ทำทีละ phase อย่างชัดเจน
- แยกงาน planning, modeling, intake, extraction, review และ reporting ออกจากกัน
- ไม่เริ่ม webhook, schema จริง หรือ deployment ก่อนถึง phase ที่เหมาะสม

## Phase 0: Planning Baseline

เป้าหมาย:

- สร้าง source of truth สำหรับ product, architecture, data model, roadmap และ security

Outputs:

- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/implementation-roadmap.md`
- `docs/security.md`

Dependencies:

- product direction ที่ชัดเจน

Definition of done:

- เอกสารหลักครบ
- terminology สอดคล้องกัน
- workflow หลักและข้อห้ามสำคัญถูกระบุครบ

## Phase 1: Repo Scaffolding And Conventions

เป้าหมาย:

- วางโครง repo application โดยยังไม่ลง business features
- กำหนด coding conventions, folder structure และ shared project standards

Outputs:

- app scaffold
- lint/typecheck/build baseline
- environment variable conventions
- module boundaries ระดับ repo

Dependencies:

- Phase 0 approved

Definition of done:

- repo พร้อมเริ่ม implementation แบบ modular
- ไม่มี business logic สำคัญที่ยังบังคับให้ตัดสินใจผิดตั้งแต่โครงสร้าง

## Phase 2: Conceptual Data Model To Actual Schema

เป้าหมาย:

- แปลง conceptual model เป็น schema design ที่พร้อมใช้จริง

Outputs:

- table plan
- relationship plan
- migration strategy
- role และ access assumptions ระดับ data layer

Dependencies:

- data model และ security docs ต้อง review แล้ว

Definition of done:

- schema direction ชัดเจนและสอดคล้องกับ document-first model

หมายเหตุ:

- phase นี้เป็นอนาคต ยังไม่อยู่ในงานปัจจุบัน

## Phase 3: Document Intake And Storage

เป้าหมาย:

- สร้างระบบรับเอกสารและเก็บ `Document` ให้ครบก่อนขั้น extraction

Outputs:

- web upload flow
- document storage integration
- document metadata persistence
- inbox-ready document lifecycle

Dependencies:

- schema baseline
- storage decisions

Definition of done:

- ทุก incoming file กลายเป็น `Document` ได้
- เอกสารถูกเก็บอย่างปลอดภัยและตรวจสอบแหล่งที่มาได้

หมายเหตุ:

- LINE webhook ยังเป็น future implementation detail จนกว่าจะถึง phase intake channel integration ที่พร้อมจริง

## Phase 4: AI Extraction Pipeline

เป้าหมาย:

- เพิ่มความสามารถให้ AI อ่านเอกสารและสร้าง extracted suggestions

Outputs:

- extraction service boundary
- raw extraction storage
- normalized extracted fields
- confidence และ warning strategy

Dependencies:

- document storage พร้อม
- security rules สำหรับ AI boundary ชัดเจน

Definition of done:

- ระบบสร้าง extraction suggestion ได้โดยไม่เปลี่ยน human approval rule

## Phase 5: Expense Matching Workflow

เป้าหมาย:

- รวมเอกสารที่เกี่ยวข้องกันเป็น `ExpenseCase`

Outputs:

- case creation rules
- document-to-case linking workflow
- duplicate/missing evidence indicators

Dependencies:

- extraction outputs และ document metadata พร้อมใช้งาน

Definition of done:

- สามารถสร้างและ review `ExpenseCase` ที่มีหลายหลักฐานได้

## Phase 6: Review And Approval UI

เป้าหมาย:

- สร้าง workflow ที่ reviewer และ approver ใช้งานได้จริง

Outputs:

- inbox views
- review views
- editable extracted data
- approval and rejection actions
- audit-aware status transitions

Dependencies:

- expense case workflow พร้อม
- role assumptions ชัดเจน

Definition of done:

- human review และ approval ทำงานครบตาม rule
- AI ไม่ bypass approval flow

## Phase 7: Thai Monthly Report Generation

เป้าหมาย:

- สร้าง output หลัก `ใบรับรองแทนใบเสร็จรับเงิน`

Outputs:

- monthly report generation flow
- Word export using `docx`
- evidence page bundling strategy

Dependencies:

- approved cases พร้อมใช้งาน
- reporting period logic ชัดเจน

Definition of done:

- สร้างรายงานที่มี summary table, total amount, Thai baht text, certifying paragraph, signature lines และ evidence pages ได้จาก approved cases

## Phase 8: Operational Hardening And Deployment

เป้าหมาย:

- เตรียมระบบสำหรับการใช้งานจริงและ deployment

Outputs:

- observability baseline
- deployment pipeline
- operational runbook
- performance/security hardening

Dependencies:

- core product flow ผ่านการทดสอบครบ

Definition of done:

- ระบบพร้อม deploy ตามมาตรฐานที่ยอมรับได้

## Explicitly Not In Current Phase

สิ่งต่อไปนี้เป็น future work ไม่ใช่งานของ phase ปัจจุบัน:

- application code
- LINE webhook
- Supabase schema implementation
- deployment

## Recommended Immediate Next Step

หลังจาก roadmap นี้ถูก review แล้ว ควรทำ stakeholder review ของเอกสารทั้งหมดก่อนเริ่ม Phase 1 เพื่อยืนยัน:

- terminology
- workflow states
- approval expectations
- accounting output expectations
