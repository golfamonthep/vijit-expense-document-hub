# Security

## ภาพรวม

เอกสารนี้สรุป security constraints สำหรับ `Vijit Expense Document Hub` ในระดับ planning เพื่อให้การพัฒนาในอนาคตไม่หลุดจากหลักพื้นฐานด้านความปลอดภัยของเอกสาร, สิทธิ์การเข้าถึง, AI boundary และข้อมูลบัญชี

ระบบนี้ต้องถือว่าไฟล์ที่อัปโหลดเข้ามาเป็นทั้ง:

- sensitive data
- untrusted input

## Security Principles

- ไม่ hardcode secrets
- แยก privileged backend work ออกจาก client
- ใช้ least privilege สำหรับ service และ actor ต่าง ๆ
- บังคับ human approval สำหรับ accounting outcome
- เก็บ audit logs สำหรับเหตุการณ์สำคัญ
- ป้องกันการรั่วไหลของข้อมูลอ่อนไหวใน logs, prompts และ exports

## Secret Management

ข้อกำหนด:

- ห้ามเก็บ secrets ใน source code
- ห้าม commit `.env`, `.env.local`, service role keys, LINE tokens หรือ OpenAI keys
- environment-specific secrets ต้องถูกจัดการผ่านระบบ secret management ที่เหมาะสมในอนาคต

Planning-time rule:

- เอกสารและ implementation ต่อจากนี้ต้องสมมติว่า secrets ถูก inject จาก environment เท่านั้น

## Service-Role Isolation

ข้อกำหนด:

- privileged credentials เช่น Supabase service role ต้องใช้เฉพาะ server-side
- client-facing layer ต้องไม่เข้าถึง privileged storage หรือ admin capability โดยตรง

Planning-time implication:

- architecture และ schema ในอนาคตต้องแยก role ของ user-facing access กับ backend maintenance clearly

## Sensitive Document Handling

ข้อกำหนด:

- เอกสารทุกชนิด เช่น receipt, slip, invoice, PDF, image และ extracted text ต้องถือเป็น sensitive
- document storage ต้องรองรับ private access
- การ preview หรือ download ควรใช้ signed access mechanism

Planning-time implication:

- ห้ามวางแผนให้เอกสารหลักฐานถูกเปิด public โดย default

## Webhook Signature Verification

ข้อกำหนดในอนาคต:

- หากมี LINE webhook ภายหลัง ต้อง verify webhook signature ก่อนประมวลผล event

หมายเหตุ:

- webhook ยังไม่อยู่ใน scope ปัจจุบัน แต่ requirement นี้ต้องถูกเก็บเป็น security baseline ตั้งแต่ตอนวางแผน

## Prompt Injection And Untrusted Content

ข้อกำหนด:

- ข้อความจาก OCR, เอกสาร, PDF, image annotation หรือ comment ต้องถูกมองเป็น untrusted content
- ห้ามให้ AI-extracted content สามารถสั่ง shell commands, package installs, config changes หรือ privileged actions ได้
- AI output ต้องไม่ถูกใช้เป็น final accounting truth โดยไม่มี human review

Planning-time implication:

- extraction layer ในอนาคตต้องถูกล้อมด้วย validation, review และ audit boundary

## Logging Restrictions

ข้อกำหนด:

- หลีกเลี่ยงการ log ข้อมูลอ่อนไหวแบบเต็ม เช่น
  - full personal data
  - full bank account numbers
  - full tokens
  - full document text เมื่อไม่จำเป็น
- logs ควรเก็บเฉพาะข้อมูลที่จำเป็นต่อการตรวจสอบและ troubleshooting

Planning-time implication:

- observability design ในอนาคตต้องมี redaction strategy

## Reviewer And Approver Separation

ข้อกำหนด:

- review และ approval ต้องมี actor traceability
- ทุก approval/rejection action ต้อง audit ได้
- role separation ระหว่าง reviewer, approver และ admin ต้องถูกพิจารณาอย่างชัดเจนใน implementation phase

Planning-time implication:

- data model และ workflow state design ต้องรองรับการเก็บ actor และ action history

## Audit Logging

เหตุการณ์สำคัญที่ควรมี audit:

- document creation
- extraction creation
- matching or rematching
- manual field edits
- approval or rejection
- report generation
- report export

ข้อกำหนด:

- audit log ต้องผูกกับ entity ที่เกี่ยวข้องและ actor ที่ทำเหตุการณ์นั้น

## Data Retention And Privacy Considerations

ข้อพิจารณาที่ต้องชัดเจนในระยะ implementation:

- retention period ของเอกสาร
- retention period ของ extraction output
- retention period ของ report exports
- การลบหรือ archive ข้อมูล
- หลักการเข้าถึงข้อมูลย้อนหลังของผู้เกี่ยวข้อง

Planning-time note:

- ยังไม่กำหนด policy รายละเอียด ณ ตอนนี้ แต่ต้องถือว่า retention/privacy เป็นข้อกำหนดระดับระบบ ไม่ใช่เรื่องเสริม

## Current Scope Vs Future Runtime Controls

Current planning scope:

- นิยามหลักการความปลอดภัย
- ระบุข้อห้ามสำคัญ
- ระบุ boundary ที่ implementation ต้องเคารพ

Future runtime controls:

- actual access control
- row-level security
- signed URL implementation
- secret provisioning
- webhook signature verification implementation
- audit pipeline implementation

## Security Acceptance Baseline

เอกสารนี้ถือว่าเพียงพอสำหรับระยะ planning เมื่อ:

- ระบุ secret management rule ชัดเจน
- ระบุ service-role isolation ชัดเจน
- ระบุการป้องกัน prompt injection จาก document content ชัดเจน
- ระบุการจัดการเอกสารอ่อนไหวชัดเจน
- ระบุ role separation และ audit logging ชัดเจน
- ไม่เร่งลงรายละเอียด runtime implementation ก่อนเวลาอันควร
