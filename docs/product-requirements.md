# Product Requirements

## ภาพรวมผลิตภัณฑ์

`Vijit Expense Document Hub` เป็นระบบ workflow สำหรับรับเอกสารค่าใช้จ่าย ตรวจสอบข้อมูลด้วย AI จัดกลุ่มเอกสารที่เกี่ยวข้อง และให้ผู้มีหน้าที่ตรวจสอบอนุมัติก่อนสร้างผลลัพธ์ทางบัญชีรายเดือน

แนวทางของระบบคือ `document-first accounting workflow`

`LINE / Web Upload / Future Email -> Document Inbox -> AI Extraction -> Expense Case Matching -> Human Review -> Approval -> Monthly Accounting Outputs`

Paypers ถูกใช้เป็นเพียง workflow reference เท่านั้น ไม่ใช่ต้นแบบสำหรับการคัดลอก branding, wording, UI, หรือ asset

## ปัญหาที่ต้องการแก้

ปัจจุบันกระบวนการจัดการเอกสารค่าใช้จ่ายมักมีปัญหาเหล่านี้:

- หลักฐานค่าใช้จ่ายมาจากหลายช่องทางและกระจัดกระจาย
- เอกสารหนึ่งรายการอาจต้องใช้หลักฐานหลายไฟล์ เช่น order screenshot, receipt, payment slip
- ข้อมูลบัญชีต้องคีย์หรือเทียบด้วยมือ ใช้เวลามาก
- เอกสารอาจขาดข้อมูล, ซ้ำซ้อน, หรือจับคู่ผิดรายการได้ง่าย
- การอนุมัติและการ audit ย้อนหลังทำได้ยากหากไม่มี log ที่ดี

## วิสัยทัศน์

สร้างระบบกลางสำหรับรับและจัดการเอกสารค่าใช้จ่ายที่:

- รับเอกสารจากหลายช่องทางได้
- เปลี่ยนทุกไฟล์ให้เป็น `Document` ก่อนเสมอ
- ใช้ AI ช่วยอ่านข้อมูลและเสนอ field ที่เกี่ยวข้อง
- รวมหลักฐานที่เกี่ยวข้องเป็น `ExpenseCase`
- บังคับให้มี human review และ approval
- สร้างเอกสารสรุปรายเดือนสำหรับงานบัญชีได้อย่างเป็นระบบ

## ผู้ใช้งานหลัก

- Staff ผู้ส่งเอกสารค่าใช้จ่าย
- Reviewer ผู้ตรวจสอบความถูกต้องของเอกสารและข้อมูล
- Approver ผู้อนุมัติรายการ
- Accounting/Admin ผู้สร้างและส่งออกรายงานรายเดือน
- System administrator ในอนาคตสำหรับดูแล integration และสิทธิ์

## ขอบเขตระยะปัจจุบัน

เอกสารฉบับนี้กำหนด requirement สำหรับช่วง planning เท่านั้น โดยยังไม่รวม:

- application code
- LINE webhook implementation
- Supabase schema implementation
- deployment implementation

## Functional Areas

### 1. Intake

ระบบควรรองรับการรับข้อมูลจาก:

- LINE group
- LINE private chat
- Web upload
- Future Email
- Manual text entry

หลักฐานที่คาดว่าจะพบ:

- payment slip
- receipt
- tax invoice
- cash bill
- utility bill
- order screenshot
- PDF
- image files เช่น JPG, PNG และ HEIC เมื่อเหมาะสม
- plain expense text

ข้อกำหนดสำคัญ:

- ทุกไฟล์หรือข้อความที่เข้ามาต้องถูกบันทึกเป็น `Document` ก่อน
- ช่องทางรับข้อมูลต้องออกแบบให้เป็น pluggable channel
- LINE เป็นเพียงหนึ่งใน input channel ไม่ใช่ศูนย์กลางของระบบทั้งหมด

### 2. Document Inbox

`Document Inbox` เป็นพื้นที่กลางสำหรับจัดการเอกสารที่เพิ่งเข้าระบบ

ความสามารถที่ต้องรองรับ:

- แสดงรายการ `Document` ใหม่
- แสดงสถานะการประมวลผลเบื้องต้น
- แยกเอกสารที่ต้อง review เพิ่ม
- เตรียมข้อมูลสำหรับขั้น AI extraction และ matching

### 3. AI Extraction

AI ทำหน้าที่ช่วยอ่านข้อความจากเอกสารและเสนอข้อมูลสำคัญ เช่น:

- document date
- payment date
- vendor
- tax ID
- amount before VAT
- VAT
- withholding tax
- net amount
- currency
- document type
- payment method
- bank name
- transfer reference
- category suggestion
- confidence score
- warnings

ข้อกำหนดสำคัญ:

- ต้องเก็บ raw extraction output
- AI output เป็น suggestion เท่านั้น
- AI ต้องไม่ auto-approve accounting records
- ระบบต้องรองรับการแก้ไข field โดยมนุษย์ภายหลัง

### 4. Expense Case Matching

ระบบต้องสามารถจัดกลุ่ม `Document` หลายรายการให้เป็น `ExpenseCase` เดียวกันได้

ตัวอย่างเอกสารที่อาจอยู่ใน case เดียวกัน:

- order screenshot
- receipt หรือ invoice
- payment slip
- supporting note
- supporting image

ข้อกำหนดสำคัญ:

- ห้ามสมมติว่าไฟล์ที่ส่งติดกันใน LINE เป็น case เดียวกันเสมอ
- การ matching ควรพิจารณาจาก sender, เวลา, amount, vendor, date และหลักฐานอื่น
- ต้องมี human review ก่อนยืนยันการจับคู่ที่มีผลต่อบัญชี

### 5. Human Review

ระบบ review ต้องรองรับอย่างน้อย:

- ดูเอกสารต้นฉบับและ metadata
- ดูผล AI extraction
- แก้ไขข้อมูลที่ AI เสนอ
- ดูความครบถ้วนของหลักฐานใน `ExpenseCase`
- เห็น warning เช่น duplicate, missing evidence, low confidence

### 6. Approval

Approval เป็น human-controlled state transition

เงื่อนไขขั้นต่ำก่อน approval:

- มี expense date
- มี description
- มี amount
- มีอย่างน้อยหนึ่ง evidence document
- มี reviewer หรือ approver action ที่บันทึกไว้

ข้อกำหนดสำคัญ:

- approval ต้องถูกบันทึกใน `audit logs`
- approved output ต้องมาจาก approved cases เท่านั้น

### 7. Monthly Accounting Outputs

ผลลัพธ์หลักระยะแรกคือเอกสารรายเดือน `ใบรับรองแทนใบเสร็จรับเงิน` สำหรับ บริษัท วิจิตรโอสถ จำกัด

เอกสารต้องมีองค์ประกอบอย่างน้อย:

- summary table
- columns: `ลำดับ`, `วัน/เดือน/ปี`, `รายละเอียดการจ่าย`, `จำนวนเงิน`, `หมายเหตุ`
- total amount
- Thai baht text
- certifying paragraph
- signature lines
- evidence pages
- one expense case per page where practical

ข้อกำหนดสำคัญ:

- รายงานต้องอิงจาก approved cases เท่านั้น
- เอกสารรายงานถือเป็น output layer ไม่ใช่ source of truth แทนข้อมูลต้นทาง

## Non-Functional Requirements

- เก็บสถาปัตยกรรมแบบ modular
- แยก concerns ของ intake, extraction, matching, review, approval, reporting และ audit
- รองรับ sensitive document handling
- ไม่ hardcode secrets
- เตรียม model ให้ขยายเป็น multi-company ได้ในอนาคต

## Success Criteria

ระบบในอนาคตถือว่าเข้าใกล้เป้าหมายเมื่อสามารถ:

- รับเอกสารจากมากกว่าหนึ่งช่องทางได้
- เก็บทุก incoming item เป็น `Document`
- ใช้ AI ช่วยอ่านเอกสารได้โดยไม่แทนที่ human approval
- รวมหลักฐานที่เกี่ยวข้องเป็น `ExpenseCase`
- ให้ reviewer และ approver ทำงานใน flow เดียวกันได้
- สร้างรายงาน `ใบรับรองแทนใบเสร็จรับเงิน` ได้จาก approved cases
- ตรวจสอบย้อนหลังได้จาก `audit logs`

## Non-Goals For Phase 1

สิ่งต่อไปนี้ไม่ใช่เป้าหมายของระยะ planning ปัจจุบัน:

- การ implement UI จริง
- การ implement LINE webhook จริง
- การสร้าง Supabase schema จริง
- การ deploy ระบบจริง
- การ finalize รูปแบบ integration อื่นทั้งหมด

## Acceptance-Oriented Requirements

เอกสาร requirement ชุดนี้ถือว่าเพียงพอเมื่อ:

- นิยาม workflow หลักชัดเจน
- functional areas ครบตั้งแต่ intake ถึง reporting
- ระบุข้อห้ามเรื่อง auto-approval ชัดเจน
- ระบุ role ของมนุษย์ใน review และ approval ชัดเจน
- ระบุ output หลักทางบัญชีชัดเจน
- ขอบเขต planning phase กับ future implementation ถูกแยกชัด
