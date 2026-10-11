/**
 * ─── HR & Payroll — Sample Data Seeder ───────────────────────────────────────
 *
 * Seeds Pakistani sample data through the SAME service-layer functions the
 * API uses (createCompany, createEmployee, createAttendance, ...) rather
 * than writing directly with `prisma.X.create()` — the services already
 * know how to default every legacy NOT-NULL column and compute derived
 * fields (holiday.days, salary sheet codes, ...) correctly.
 *
 * SCOPE: every HR & Payroll table this project has an actual service/route
 * for. A few things intentionally routed around:
 *   - `payrollRun.service.ts` — a batch endpoint that generates many salary
 *     sheets at once from a staff_ids[] list. Salary sheets are seeded
 *     directly via `createSalarySheet` per employee instead, since that's
 *     simpler to make idempotent-on-failure and doesn't require guessing at
 *     ledger/financial-year ids beyond what salary sheets already need.
 *
 * FIXED vs the previous version of this file: it imported
 * `staffRelative.service` and `staffExperience.service`, neither of which
 * exists in this codebase — the actual modules are `family.service.ts`
 * (createFamily) and `experience.service.ts` (createExperience), both of
 * which write to the same `staff_families` / `staff_experiences` tables the
 * old names implied. The script could not run at all before this fix.
 *
 * IDEMPOTENT: every insert in this script goes through `createOrSkip()`,
 * which looks the row up by its natural key first and only creates it if
 * missing — and falls back to the same lookup if the create call itself
 * throws a duplicate/conflict error (either our own service-layer
 * `AppError.conflict(...)` or a raw Postgres unique-constraint hit, P2002).
 * That means:
 *   - Nothing already in the database is ever re-inserted or duplicated.
 *   - It's safe to run this script repeatedly (e.g. after adding new seed
 *     entries below) — anything that already exists is skipped and logged,
 *     everything new is created.
 *   - A run interrupted partway through (failed connection, Ctrl-C, ...)
 *     can just be re-run from the top with no cleanup needed.
 *
 * Run with: npm run seed   (see package.json)
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db";
import { Prisma } from "../generated/prisma/client";
import { AppError } from "../modules/hrandPayrollModule/utils/app-error";

import { createCompany } from "../modules/hrandPayrollModule/services/company.service";
import { createBranch } from "../modules/hrandPayrollModule/services/branch.service";
import { createDepartment } from "../modules/hrandPayrollModule/services/department.service";
import { createEmployee, updateEmployee } from "../modules/hrandPayrollModule/services/employee.service";
import { createWorkShift } from "../modules/hrandPayrollModule/services/workShift.service";
import { createHoliday } from "../modules/hrandPayrollModule/services/holiday.service";
import { createMonth } from "../modules/hrandPayrollModule/services/month.service";
import { createYear } from "../modules/hrandPayrollModule/services/year.service";
import { createBankAccount } from "../modules/hrandPayrollModule/services/bankAccount.service";
import { createEmergencyContact } from "../modules/hrandPayrollModule/services/emergencyContact.service";
import { createFamily } from "../modules/hrandPayrollModule/services/family.service";
import { createExperience } from "../modules/hrandPayrollModule/services/experience.service";
import { createStaffType } from "../modules/hrandPayrollModule/services/staffType.service";
import { createStaffQualification } from "../modules/hrandPayrollModule/services/staffQualification.service";
import { createStaffAsset } from "../modules/hrandPayrollModule/services/staffAsset.service";
import { createEobiEntry } from "../modules/hrandPayrollModule/services/eobi.service";
import { createAttendanceStatus } from "../modules/hrandPayrollModule/services/attendanceStatus.service";
import { createAttendance } from "../modules/hrandPayrollModule/services/attendance.service";
import { createAttendanceSummary } from "../modules/hrandPayrollModule/services/attendanceSummary.service";
import { createLeaveType } from "../modules/hrandPayrollModule/services/leaveType.service";
import { createLeaveStatus } from "../modules/hrandPayrollModule/services/leaveStatus.service";
import { createLeaveEntitlement } from "../modules/hrandPayrollModule/services/leaveEntitlement.service";
import { createLeaveRequest } from "../modules/hrandPayrollModule/services/leaveRequest.service";
import { createLoanType } from "../modules/hrandPayrollModule/services/loanType.service";
import { createLoanPlan } from "../modules/hrandPayrollModule/services/loanPlan.service";
import {
  createLoanRequest as createLoan,
  changeLoanRequestStatus,
} from "../modules/hrandPayrollModule/services/loanRequest.service";
import { createIncrement } from "../modules/hrandPayrollModule/services/increment.service";
import { createPerformance } from "../modules/hrandPayrollModule/services/performance.service";
import { createBranchTransfer } from "../modules/hrandPayrollModule/services/branchTransfer.service";
import { createResignation } from "../modules/hrandPayrollModule/services/resignation.service";
import { createTermination } from "../modules/hrandPayrollModule/services/termination.service";
import { createSalarySheet } from "../modules/hrandPayrollModule/services/salary.service";
import { createFiscalYear } from "../modules/hrandPayrollModule/services/fiscalYear.service";
import { createTaxSlab } from "../modules/hrandPayrollModule/services/taxSlab.service";
import { createAllowanceType } from "../modules/hrandPayrollModule/services/allowanceType.service";
import {
  uploadStaffToDevice,
  syncAttendanceFromDevice,
} from "../modules/hrandPayrollModule/services/biometricDevice.service";
import { MockBiometricDeviceClient } from "../modules/hrandPayrollModule/services/biometric/mockDeviceClient";
import { ZKTECO_LOG_TYPE } from "../modules/hrandPayrollModule/constants/biometricDevice.constants";

const log = (msg: string) => console.log(`  ${msg}`);
const section = (msg: string) => console.log(`\n▶ ${msg}`);

let createdCount = 0;
let skippedCount = 0;

/**
 * True for both shapes "this already exists" takes in this codebase: our
 * own `AppError.conflict(...)` (statusCode 409) thrown by services that
 * check uniqueness themselves, and a raw Postgres unique-constraint
 * violation (Prisma error code P2002) for the handful of writes that go
 * straight through `prisma.X.create()`.
 */
function isDuplicateError(err: unknown): boolean {
  if (err instanceof AppError && err.statusCode === 409) return true;
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return true;
  return false;
}

/**
 * Idempotent create. Looks the row up first via `findExisting` (the
 * record's natural key — a name, a staff_id, a date range, ...) and only
 * calls `createFn` if nothing was found. If `createFn` itself throws a
 * duplicate/conflict error — because the service enforces the uniqueness
 * server-side, or a rare race between the lookup and the insert — this
 * falls back to the same lookup instead of failing the whole seed run.
 *
 * This is what makes the script safe to re-run: anything already in the
 * database is skipped (and logged) rather than duplicated or throwing.
 */
async function createOrSkip<T>(
  label: string,
  // `findExisting` intentionally returns `any`, not `T | null`: it's a raw
  // `prisma.X.findFirst(...)` returning every column on the row, while `T`
  // (inferred from `createFn`) is usually a narrower service-layer "select"
  // type. The raw row always structurally satisfies the narrower type, but
  // TypeScript can't see that through two independently-inferred function
  // params, so the lookup is loosely typed here and cast to `T` below.
  findExisting: () => Promise<any>,
  createFn: () => Promise<T>
): Promise<T> {
  const existing = await findExisting();
  if (existing) {
    skippedCount++;
    log(`⏭  Skipped ${label} (already exists)`);
    return existing as T;
  }

  try {
    const created = await createFn();
    createdCount++;
    return created;
  } catch (err) {
    if (isDuplicateError(err)) {
      const foundAfterConflict = await findExisting();
      if (foundAfterConflict) {
        skippedCount++;
        log(`⏭  Skipped ${label} (already exists)`);
        return foundAfterConflict as T;
      }
    }
    throw err;
  }
}

/** Throws a clear error instead of silently passing `undefined` into a create() call if a seed reference typo'd a key/index. */
function need<T>(record: Record<string, T>, key: string, label: string): T {
  const value = record[key];
  if (value === undefined) {
    throw new Error(`Seed data error: no ${label} named "${key}" was created earlier in this script.`);
  }
  return value;
}
function needEmployee(list: { id: number; name: string; branch: string }[], index: number) {
  const value = list[index];
  if (value === undefined) {
    throw new Error(`Seed data error: no employee at index ${index} was created earlier in this script.`);
  }
  return value;
}

/** date-only arithmetic, e.g. `shiftYears("2024-08-01", -8)` → "2016-08-01". */
function shiftYears(dateStr: string, years: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}
function shiftDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Seeding HR & Payroll sample data (Pakistan)");
  console.log("═══════════════════════════════════════════════════════════");

  // ─── 1. Companies ──────────────────────────────────────────────────────
  section("Companies");
  const companySeeds = [
    { name: "Techrive Education Network", description: "A multi-campus private education network operating across Pakistan.", ntn: "1234567-8", phone: "042-111-222-333", address: "12-A Gulberg III, Lahore, Punjab" },
    { name: "Riverside School System", description: "A K-12 private school system based in Faisalabad.", ntn: "2345678-1", phone: "041-111-222-444", address: "Susan Road, Faisalabad, Punjab" },
    { name: "Crescent Academy Group", description: "A group of colleges offering intermediate and A-Level programs.", ntn: "3456789-2", phone: "061-111-222-555", address: "Bosan Road, Multan, Punjab" },
    { name: "Horizon Learning Network", description: "A technical and vocational training network.", ntn: "4567890-3", phone: "091-111-222-666", address: "University Road, Peshawar, KPK" },
    { name: "Al-Falah Educational Trust", description: "A non-profit trust operating schools for underserved communities.", ntn: "5678901-4", phone: "052-111-222-777", address: "Paris Road, Sialkot, Punjab" },
    { name: "Metro Business Institute", description: "A business and IT training institute with evening programs.", ntn: "6789012-5", phone: "051-111-222-888", address: "Murree Road, Rawalpindi, Punjab" },
    // ── Added: 4 more companies (7–10) ─────────────────────────────────
    { name: "Bright Future School Network", description: "A growing K-12 network serving second-tier cities in Punjab.", ntn: "7890123-6", phone: "055-111-222-999", address: "GT Road, Gujranwala, Punjab" },
    { name: "Al-Noor Institute of Technology", description: "A technical training institute focused on IT and engineering trades.", ntn: "8901234-7", phone: "022-111-222-000", address: "Auto Bhan Road, Hyderabad, Sindh" },
    { name: "Pearl Vale Academy Group", description: "A group of colleges and schools serving northern Sindh.", ntn: "9012345-8", phone: "071-111-222-111", address: "Barrage Road, Sukkur, Sindh" },
    { name: "National Skills Academy", description: "A vocational and skills-training academy for Balochistan.", ntn: "0123456-9", phone: "081-111-222-222", address: "Airport Road, Quetta, Balochistan" },
  ];
  const companies: Record<string, number> = {};
  for (const c of companySeeds) {
    const created = await createOrSkip(
      `company '${c.name}'`,
      () =>
        prisma.erpCompanies.findFirst({
          where: { name: { equals: c.name, mode: "insensitive" } },
          select: { id: true, name: true },
        }),
      () => createCompany(c as any)
    );
    companies[c.name] = created.id;
    log(`Company: ${created.name} (id ${created.id})`);
  }

  // ─── 2. Branches ───────────────────────────────────────────────────────
  section("Branches");
  // ip/port here are the branch's biometric (ZKTeco) terminal — see
  // biometricDevice.service.ts, which reads these two columns directly off
  // erp_branches rather than a separate config table. Karachi Campus is
  // deliberately left with an empty port to exercise
  // biometricDevice.constants.ts's DEFAULT_ZKTECO_PORT (4370) fallback —
  // every other branch sets it explicitly.
  const branchSeeds = [
    { name: "Lahore Campus", companyName: "Techrive Education Network", phone: "042-35761234", cell: "0300-1234567", email: "lahore@techrive.edu.pk", address: "Gulberg III, Lahore, Punjab", ip: "192.168.10.101", port: "4370" },
    { name: "Karachi Campus", companyName: "Techrive Education Network", phone: "021-34561234", cell: "0301-2345678", email: "karachi@techrive.edu.pk", address: "Clifton Block 5, Karachi, Sindh", ip: "192.168.10.102", port: "" },
    { name: "Islamabad Campus", companyName: "Techrive Education Network", phone: "051-2345678", cell: "0302-3456789", email: "islamabad@techrive.edu.pk", address: "F-8 Markaz, Islamabad, ICT", ip: "192.168.10.103", port: "4370" },
    { name: "Faisalabad Campus", companyName: "Riverside School System", phone: "041-8765432", cell: "0303-1112222", email: "faisalabad@riverside.edu.pk", address: "Susan Road, Faisalabad, Punjab", ip: "192.168.10.104", port: "4370" },
    { name: "Multan Campus", companyName: "Crescent Academy Group", phone: "061-4567890", cell: "0304-2223333", email: "multan@crescentacademy.edu.pk", address: "Bosan Road, Multan, Punjab", ip: "192.168.10.105", port: "4370" },
    { name: "Peshawar Campus", companyName: "Horizon Learning Network", phone: "091-2223344", cell: "0305-3334444", email: "peshawar@horizonlearning.edu.pk", address: "University Road, Peshawar, KPK", ip: "192.168.10.106", port: "4370" },
    { name: "Sialkot Campus", companyName: "Al-Falah Educational Trust", phone: "052-3344556", cell: "0306-4445555", email: "sialkot@alfalahtrust.edu.pk", address: "Paris Road, Sialkot, Punjab", ip: "192.168.10.107", port: "4370" },
    { name: "Rawalpindi Campus", companyName: "Metro Business Institute", phone: "051-5556677", cell: "0307-5556666", email: "rawalpindi@metrobusiness.edu.pk", address: "Murree Road, Rawalpindi, Punjab", ip: "192.168.10.108", port: "4370" },
    // ── Added: 4 more branches (one per new company, 9–12) ─────────────
    { name: "Gujranwala Campus", companyName: "Bright Future School Network", phone: "055-3344556", cell: "0308-1112223", email: "gujranwala@brightfuture.edu.pk", address: "GT Road, Gujranwala, Punjab", ip: "192.168.10.109", port: "4370" },
    { name: "Hyderabad Campus", companyName: "Al-Noor Institute of Technology", phone: "022-4455667", cell: "0309-2223334", email: "hyderabad@alnoortech.edu.pk", address: "Auto Bhan Road, Hyderabad, Sindh", ip: "192.168.10.110", port: "4370" },
    { name: "Sukkur Campus", companyName: "Pearl Vale Academy Group", phone: "071-5566778", cell: "0310-3334445", email: "sukkur@pearlvale.edu.pk", address: "Barrage Road, Sukkur, Sindh", ip: "192.168.10.111", port: "4370" },
    { name: "Quetta Campus", companyName: "National Skills Academy", phone: "081-6677889", cell: "0311-4445556", email: "quetta@nationalskills.edu.pk", address: "Airport Road, Quetta, Balochistan", ip: "192.168.10.112", port: "4370" },
  ];
  const branches: Record<string, number> = {};
  const branchCompany: Record<string, number> = {};
  for (const b of branchSeeds) {
    const { companyName, ...branchFields } = b;
    const companyId = need(companies, companyName, "company");
    const branch = await createOrSkip(
      `branch '${b.name}'`,
      () => prisma.erpBranches.findFirst({ where: { name: { equals: b.name, mode: "insensitive" } }, select: { id: true, name: true } }),
      () => createBranch({ ...branchFields, company_id: companyId } as any)
    );
    branches[b.name] = branch.id;
    branchCompany[b.name] = companyId;
    log(`Branch: ${branch.name} (id ${branch.id}, company: ${companyName})`);

    // Backfill ip/port onto a branch that already existed from a previous
    // run (createOrSkip above returns the pre-existing row as-is, without
    // touching it) — so re-running this script after adding device columns
    // to a DB that already has these branches still ends up with every
    // branch configured, not just newly-created ones.
    const currentDevice = await prisma.erpBranches.findFirst({
      where: { id: branch.id },
      select: { ip: true, port: true },
    });
    if (currentDevice && (currentDevice.ip !== b.ip || currentDevice.port !== b.port)) {
      await prisma.erpBranches.update({
        where: { id: branch.id },
        data: { ip: b.ip, port: b.port },
      });
      log(`  ↳ Device config set: ip=${b.ip}, port=${b.port || "(default 4370)"}`);
    }
  }

  // ─── 3. Departments (with description) ────────────────────────────────
  section("Departments");
  const departmentSeeds = [
    { name: "Administration", description: "Handles day-to-day campus operations, front desk, and general administration." },
    { name: "Academics", description: "Teaching staff and academic coordination across all grade levels." },
    { name: "Finance & Accounts", description: "Payroll, accounts payable/receivable, and financial reporting." },
    { name: "Human Resources", description: "Recruitment, employee records, benefits, and HR policy." },
    { name: "IT & Systems", description: "Campus network, hardware support, and the ERP system itself." },
    { name: "Examinations", description: "Exam scheduling, result compilation, and academic integrity." },
    { name: "Admissions & Marketing", description: "Student enrollment, campus tours, and outreach campaigns." },
    { name: "Transport", description: "School van/bus routes, driver scheduling, and vehicle maintenance." },
    { name: "Library", description: "Library operations, cataloguing, and student lending records." },
    { name: "Sports & Extracurricular", description: "Sports facilities, inter-campus tournaments, and clubs/societies." },
    { name: "Procurement & Facilities", description: "Purchasing, vendor management, and building/facilities upkeep." },
    { name: "Legal & Compliance", description: "Contracts, regulatory filings, and policy compliance." },
    // ── Added: 3 more departments (13–15) ──────────────────────────────
    { name: "Research & Development", description: "Curriculum development, academic research, and program innovation." },
    { name: "Student Affairs", description: "Student counseling, discipline, and campus welfare services." },
    { name: "Health & Safety", description: "Campus health services, safety inspections, and emergency preparedness." },
  ];
  const departments: Record<string, number> = {};
  for (const d of departmentSeeds) {
    const dept = await createOrSkip(
      `department '${d.name}'`,
      () => prisma.departments.findFirst({ where: { name: { equals: d.name, mode: "insensitive" } }, select: { id: true, name: true } }),
      () => createDepartment({
        ...d,
        company_id: need(companies, "Techrive Education Network", "company"),
        branch_id: need(branches, "Lahore Campus", "branch"),
      } as any)
    );
    departments[d.name] = dept.id;
    log(`Department: ${dept.name} (id ${dept.id})`);
  }

  // ─── 3b. Staff Types ────────────────────────────────────────────────────
  section("Staff Types");
  const staffTypeSeeds = [
    { name: "Teaching", staff_type_code: "TCH", description: "Teaching faculty across all grade levels." },
    { name: "Non-Teaching", staff_type_code: "NTC", description: "Support staff not directly involved in classroom teaching." },
    { name: "Administrative", staff_type_code: "ADM", description: "Office, HR, IT, and finance staff." },
    { name: "Management", staff_type_code: "MGT", description: "Branch and department heads." },
  ];
  for (const st of staffTypeSeeds) {
    await createOrSkip(
      `staff type '${st.name}'`,
      () => prisma.staffType.findFirst({ where: { name: { equals: st.name, mode: "insensitive" } }, select: { id: true } }),
      () => createStaffType(st as any)
    );
  }
  log(`Staff types ready: ${staffTypeSeeds.length}`);
  // NOTE: Employee.staff_type is still a free-text field (not yet wired to
  // this lookup's id) — the values used on the employee seeds below
  // ("Teaching", "Administrative", "Management") were chosen to match these
  // staff type names so the two line up, even though there's no FK yet.

  section("Work Shifts");
  const standardWeek = [1, 2, 3, 4, 5, 6, 7].map((day) =>
    day === 7
      ? { day, on_off: 0 } // Sunday off
      : { day, on_off: 1, start_time: "09:00", end_time: "17:00" }
  );
  const shortFridayWeek = [1, 2, 3, 4, 5, 6, 7].map((day) => {
    if (day === 7) return { day, on_off: 0 }; // Sunday off
    if (day === 5) return { day, on_off: 1, start_time: "09:00", end_time: "13:00" }; // Friday short day
    return { day, on_off: 1, start_time: "08:30", end_time: "16:30" };
  });
  const workShifts: Record<string, number> = {};
  const workShiftSeeds = [
    { name: "General Shift", grace_in: 10, grace_out: 10, week: standardWeek },
    { name: "Morning Shift (Short Friday)", grace_in: 15, grace_out: 10, week: shortFridayWeek },
  ];
  for (const ws of workShiftSeeds) {
    const created = await createOrSkip(
      `work shift '${ws.name}'`,
      () =>
        prisma.erpHrmWorkShifts.findFirst({
          where: { name: { equals: ws.name, mode: "insensitive" }, branch_id: null },
          select: { id: true, name: true },
        }),
      () => createWorkShift(ws as any)
    );
    workShifts[ws.name] = created.id;
    log(`Work shift: ${created.name} (id ${created.id})`);
  }

  // ─── 5. Holidays (Pakistan, 2026) ─────────────────────────────────────
  section("Holidays");
  const holidaySeeds = [
    { holiday_name: "Kashmir Solidarity Day", start_date: "2026-02-05", end_date: "2026-02-05" },
    { holiday_name: "Pakistan Day", start_date: "2026-03-23", end_date: "2026-03-23" },
    { holiday_name: "Eid-ul-Fitr", start_date: "2026-03-20", end_date: "2026-03-22" },
    { holiday_name: "Labour Day", start_date: "2026-05-01", end_date: "2026-05-01" },
    { holiday_name: "Eid-ul-Adha", start_date: "2026-05-27", end_date: "2026-05-29" },
    { holiday_name: "Independence Day", start_date: "2026-08-14", end_date: "2026-08-14" },
    { holiday_name: "Iqbal Day", start_date: "2026-11-09", end_date: "2026-11-09" },
    { holiday_name: "Quaid-e-Azam Day", start_date: "2026-12-25", end_date: "2026-12-25" },
  ];
  for (const h of holidaySeeds) {
    const created = await createOrSkip(
      `holiday '${h.holiday_name}'`,
      () =>
        prisma.erpHolidays.findFirst({
          where: {
            holiday_name: { equals: h.holiday_name, mode: "insensitive" },
            start_date: new Date(`${h.start_date}T00:00:00.000Z`),
            end_date: new Date(`${h.end_date}T00:00:00.000Z`),
          },
          select: { id: true, holiday_name: true },
        }),
      () => createHoliday(h as any)
    );
    log(`Holiday: ${created.holiday_name} (${h.start_date} → ${h.end_date})`);
  }

  // ─── 6. Months & Years (lookups) ──────────────────────────────────────
  section("Months");
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const months: Record<string, number> = {};
  for (const title of monthNames) {
    const created = await createOrSkip(
      `month '${title}'`,
      () => prisma.months.findFirst({ where: { title: { equals: title, mode: "insensitive" } }, select: { id: true } }),
      () => createMonth({ title } as any)
    );
    months[title] = created.id;
  }
  log(`Months ready: January – December`);

  section("Years");
  const years: Record<string, number> = {};
  for (const y of [2025, 2026]) {
    const created = await createOrSkip(
      `year ${y}`,
      () => prisma.years.findUnique({ where: { id: y }, select: { id: true } }),
      () => createYear({ year: y } as any)
    );
    years[String(y)] = created.id;
  }
  log(`Years ready: ${Object.keys(years).join(", ")}`);

  // ─── 7. Employees (+ linked erp_users login accounts) ─────────────────
  section("Employees");

  // Core, per-person facts. Every other profile field (mother's name, date
  // of birth, blood group, personal email, CNIC issue/expiry, skills,
  // contract info, ...) is *derived* from these by buildEmployeeSeed()
  // below, so every employee row ends up with the full profile filled in
  // instead of leaving half the staff form blank.
  type BaseEmployeeSeed = {
    reg_no: string;
    first_name: string;
    last_name: string;
    father_name: string;
    email: string;
    mobile_1: string;
    gender: "Male" | "Female";
    cnic: string;
    city: string;
    country: string;
    qualification: string;
    staff_type: string;
    designation: string;
    department_id: number;
    branch_id: number;
    branch: string;
    join_date: string;
    age: number;
    managerRegNo?: string;
  };
  const baseEmployeeSeeds: BaseEmployeeSeed[] = [
    { reg_no: "TR-2024-001", first_name: "Ahmed", last_name: "Raza Malik", father_name: "Muhammad Iqbal Malik", email: "ahmed.malik@techrive.edu.pk", mobile_1: "0300-1112223", gender: "Male" as const, cnic: "35202-1234567-1", city: "Lahore", country: "Pakistan", qualification: "MBA (Education Management)", staff_type: "Management", designation: "Branch Manager", department_id: need(departments, "Administration", "department"), branch_id: need(branches, "Lahore Campus", "branch"), branch: "Lahore Campus", join_date: "2022-01-10", age: 41 },
    { reg_no: "TR-2024-002", first_name: "Fatima", last_name: "Zahra Bibi", father_name: "Ghulam Abbas", email: "fatima.zahra@techrive.edu.pk", mobile_1: "0301-2223334", gender: "Female" as const, cnic: "35202-2345678-2", city: "Lahore", country: "Pakistan", qualification: "M.Ed", staff_type: "Teaching", designation: "Senior Teacher", department_id: need(departments, "Academics", "department"), branch_id: need(branches, "Lahore Campus", "branch"), branch: "Lahore Campus", join_date: "2022-03-15", age: 34, managerRegNo: "TR-2024-001" },
    { reg_no: "TR-2024-003", first_name: "Muhammad", last_name: "Bilal Khan", father_name: "Sher Khan", email: "bilal.khan@techrive.edu.pk", mobile_1: "0321-3334445", gender: "Male" as const, cnic: "42101-3456789-3", city: "Karachi", country: "Pakistan", qualification: "ACCA", staff_type: "Administrative", designation: "Finance Manager", department_id: need(departments, "Finance & Accounts", "department"), branch_id: need(branches, "Karachi Campus", "branch"), branch: "Karachi Campus", join_date: "2021-07-01", age: 38 },
    { reg_no: "TR-2024-004", first_name: "Ayesha", last_name: "Siddiqui", father_name: "Anwar Siddiqui", email: "ayesha.siddiqui@techrive.edu.pk", mobile_1: "0333-4445556", gender: "Female" as const, cnic: "42201-4567890-4", city: "Karachi", country: "Pakistan", qualification: "MS Computer Science", staff_type: "Administrative", designation: "IT Administrator", department_id: need(departments, "IT & Systems", "department"), branch_id: need(branches, "Karachi Campus", "branch"), branch: "Karachi Campus", join_date: "2023-02-20", age: 29, managerRegNo: "TR-2024-003" },
    { reg_no: "TR-2024-005", first_name: "Hassan", last_name: "Abbas Shah", father_name: "Syed Zulfiqar Abbas Shah", email: "hassan.shah@techrive.edu.pk", mobile_1: "0345-5556667", gender: "Male" as const, cnic: "61101-5678901-5", city: "Islamabad", country: "Pakistan", qualification: "BS Software Engineering", staff_type: "Administrative", designation: "Network Administrator", department_id: need(departments, "IT & Systems", "department"), branch_id: need(branches, "Islamabad Campus", "branch"), branch: "Islamabad Campus", join_date: "2023-06-05", age: 27 },
    { reg_no: "TR-2024-006", first_name: "Sana", last_name: "Fatima Chaudhry", father_name: "Rashid Chaudhry", email: "sana.chaudhry@techrive.edu.pk", mobile_1: "0311-6667778", gender: "Female" as const, cnic: "61101-6789012-6", city: "Islamabad", country: "Pakistan", qualification: "MBA (HR)", staff_type: "Administrative", designation: "HR Executive", department_id: need(departments, "Human Resources", "department"), branch_id: need(branches, "Islamabad Campus", "branch"), branch: "Islamabad Campus", join_date: "2022-09-12", age: 31 },
    { reg_no: "TR-2024-007", first_name: "Imran", last_name: "Ali Butt", father_name: "Nazir Ahmed Butt", email: "imran.butt@techrive.edu.pk", mobile_1: "0322-7778889", gender: "Male" as const, cnic: "35201-7890123-7", city: "Lahore", country: "Pakistan", qualification: "M.Phil Mathematics", staff_type: "Teaching", designation: "Lecturer", department_id: need(departments, "Academics", "department"), branch_id: need(branches, "Lahore Campus", "branch"), branch: "Lahore Campus", join_date: "2023-08-01", age: 30, managerRegNo: "TR-2024-001" },
    { reg_no: "TR-2024-008", first_name: "Zainab", last_name: "Tariq", father_name: "Tariq Mehmood", email: "zainab.tariq@techrive.edu.pk", mobile_1: "0334-8889990", gender: "Female" as const, cnic: "35202-8901234-8", city: "Lahore", country: "Pakistan", qualification: "BBA", staff_type: "Administrative", designation: "Admin Officer", department_id: need(departments, "Administration", "department"), branch_id: need(branches, "Lahore Campus", "branch"), branch: "Lahore Campus", join_date: "2024-01-15", age: 25, managerRegNo: "TR-2024-001" },
    { reg_no: "TR-2024-009", first_name: "Usman", last_name: "Ghani Awan", father_name: "Ghulam Rasool Awan", email: "usman.awan@techrive.edu.pk", mobile_1: "0300-9990001", gender: "Male" as const, cnic: "42301-9012345-9", city: "Karachi", country: "Pakistan", qualification: "B.Com", staff_type: "Administrative", designation: "Accountant", department_id: need(departments, "Finance & Accounts", "department"), branch_id: need(branches, "Karachi Campus", "branch"), branch: "Karachi Campus", join_date: "2023-11-20", age: 33, managerRegNo: "TR-2024-003" },
    { reg_no: "TR-2024-010", first_name: "Mariam", last_name: "Yousaf", father_name: "Yousaf Masih", email: "mariam.yousaf@techrive.edu.pk", mobile_1: "0345-0001112", gender: "Female" as const, cnic: "42101-0123456-0", city: "Karachi", country: "Pakistan", qualification: "B.Ed", staff_type: "Teaching", designation: "Academic Coordinator", department_id: need(departments, "Academics", "department"), branch_id: need(branches, "Karachi Campus", "branch"), branch: "Karachi Campus", join_date: "2022-05-18", age: 36 },
    { reg_no: "TR-2024-011", first_name: "Bilal", last_name: "Ahmed Qureshi", father_name: "Sarfraz Ahmed Qureshi", email: "bilal.qureshi@techrive.edu.pk", mobile_1: "0312-1112223", gender: "Male" as const, cnic: "61101-1234567-1", city: "Islamabad", country: "Pakistan", qualification: "BS Accounting & Finance", staff_type: "Administrative", designation: "Office Assistant", department_id: need(departments, "Administration", "department"), branch_id: need(branches, "Islamabad Campus", "branch"), branch: "Islamabad Campus", join_date: "2024-03-01", age: 24 },
    { reg_no: "TR-2024-012", first_name: "Rabia", last_name: "Hameed", father_name: "Abdul Hameed", email: "rabia.hameed@techrive.edu.pk", mobile_1: "0323-2223334", gender: "Female" as const, cnic: "61101-2345678-2", city: "Islamabad", country: "Pakistan", qualification: "BBA (HR)", staff_type: "Administrative", designation: "Receptionist", department_id: need(departments, "Human Resources", "department"), branch_id: need(branches, "Islamabad Campus", "branch"), branch: "Islamabad Campus", join_date: "2024-06-10", age: 23 },
    { reg_no: "TR-2024-013", first_name: "Kamran", last_name: "Iqbal Sheikh", father_name: "Iqbal Ahmed Sheikh", email: "kamran.sheikh@techrive.edu.pk", mobile_1: "0300-3334445", gender: "Male" as const, cnic: "35201-3456780-1", city: "Lahore", country: "Pakistan", qualification: "M.Phil Chemistry", staff_type: "Teaching", designation: "Lecturer", department_id: need(departments, "Academics", "department"), branch_id: need(branches, "Lahore Campus", "branch"), branch: "Lahore Campus", join_date: "2024-08-01", age: 28, managerRegNo: "TR-2024-001" },
    { reg_no: "TR-2024-014", first_name: "Sadia", last_name: "Perveen Malik", father_name: "Malik Ghulam Farid", email: "sadia.malik@techrive.edu.pk", mobile_1: "0301-4445556", gender: "Female" as const, cnic: "42101-4567891-2", city: "Karachi", country: "Pakistan", qualification: "BBA", staff_type: "Administrative", designation: "Admin Officer", department_id: need(departments, "Administration", "department"), branch_id: need(branches, "Karachi Campus", "branch"), branch: "Karachi Campus", join_date: "2024-09-15", age: 26, managerRegNo: "TR-2024-003" },
    { reg_no: "TR-2024-015", first_name: "Waqas", last_name: "Ahmed Niazi", father_name: "Ahmed Yar Niazi", email: "waqas.niazi@techrive.edu.pk", mobile_1: "0322-5556667", gender: "Male" as const, cnic: "61101-5678902-3", city: "Islamabad", country: "Pakistan", qualification: "MBA", staff_type: "Management", designation: "Assistant Branch Manager", department_id: need(departments, "Administration", "department"), branch_id: need(branches, "Islamabad Campus", "branch"), branch: "Islamabad Campus", join_date: "2023-04-10", age: 35 },
    { reg_no: "TR-2024-016", first_name: "Hina", last_name: "Riaz Chaudhry", father_name: "Riaz Ahmed Chaudhry", email: "hina.chaudhry@techrive.edu.pk", mobile_1: "0333-6667778", gender: "Female" as const, cnic: "42201-6789013-4", city: "Karachi", country: "Pakistan", qualification: "M.Ed", staff_type: "Teaching", designation: "Senior Teacher", department_id: need(departments, "Academics", "department"), branch_id: need(branches, "Karachi Campus", "branch"), branch: "Karachi Campus", join_date: "2022-11-01", age: 37 },
    { reg_no: "TR-2024-017", first_name: "Danish", last_name: "Iqbal Warraich", father_name: "Iqbal Hussain Warraich", email: "danish.warraich@techrive.edu.pk", mobile_1: "0345-7778889", gender: "Male" as const, cnic: "35202-7890124-5", city: "Lahore", country: "Pakistan", qualification: "BS Computer Science", staff_type: "Administrative", designation: "IT Support Engineer", department_id: need(departments, "IT & Systems", "department"), branch_id: need(branches, "Lahore Campus", "branch"), branch: "Lahore Campus", join_date: "2024-02-20", age: 26, managerRegNo: "TR-2024-001" },
    { reg_no: "TR-2024-018", first_name: "Nida", last_name: "Batool Rizvi", father_name: "Syed Anwar Rizvi", email: "nida.rizvi@techrive.edu.pk", mobile_1: "0312-8889990", gender: "Female" as const, cnic: "61101-8901235-6", city: "Islamabad", country: "Pakistan", qualification: "MBA (HR)", staff_type: "Administrative", designation: "HR Coordinator", department_id: need(departments, "Human Resources", "department"), branch_id: need(branches, "Islamabad Campus", "branch"), branch: "Islamabad Campus", join_date: "2023-10-05", age: 30, managerRegNo: "TR-2024-015" },
    // ── Added: 10 more employees, 2 per new branch/company ────────────────
    { reg_no: "TR-2024-019", first_name: "Tariq", last_name: "Mehmood Bhatti", father_name: "Ashraf Mehmood Bhatti", email: "tariq.bhatti@riverside.edu.pk", mobile_1: "0300-1119991", gender: "Male" as const, cnic: "33100-1112223-1", city: "Faisalabad", country: "Pakistan", qualification: "M.Sc Statistics", staff_type: "Administrative", designation: "Exam Controller", department_id: need(departments, "Examinations", "department"), branch_id: need(branches, "Faisalabad Campus", "branch"), branch: "Faisalabad Campus", join_date: "2022-08-15", age: 39 },
    { reg_no: "TR-2024-020", first_name: "Sobia", last_name: "Akram", father_name: "Muhammad Akram", email: "sobia.akram@riverside.edu.pk", mobile_1: "0301-2229992", gender: "Female" as const, cnic: "33100-2223334-2", city: "Faisalabad", country: "Pakistan", qualification: "BBA (Marketing)", staff_type: "Administrative", designation: "Admissions Officer", department_id: need(departments, "Admissions & Marketing", "department"), branch_id: need(branches, "Faisalabad Campus", "branch"), branch: "Faisalabad Campus", join_date: "2023-09-01", age: 27, managerRegNo: "TR-2024-019" },
    { reg_no: "TR-2024-021", first_name: "Fahad", last_name: "Ali Gondal", father_name: "Mushtaq Ali Gondal", email: "fahad.gondal@crescentacademy.edu.pk", mobile_1: "0322-3339993", gender: "Male" as const, cnic: "36302-3334445-3", city: "Multan", country: "Pakistan", qualification: "B.Com", staff_type: "Administrative", designation: "Transport Coordinator", department_id: need(departments, "Transport", "department"), branch_id: need(branches, "Multan Campus", "branch"), branch: "Multan Campus", join_date: "2023-01-10", age: 32 },
    { reg_no: "TR-2024-022", first_name: "Mehwish", last_name: "Iqbal", father_name: "Muhammad Iqbal Rana", email: "mehwish.iqbal@crescentacademy.edu.pk", mobile_1: "0333-4449994", gender: "Female" as const, cnic: "36302-4445556-4", city: "Multan", country: "Pakistan", qualification: "MLIS (Library & Info. Science)", staff_type: "Non-Teaching", designation: "Librarian", department_id: need(departments, "Library", "department"), branch_id: need(branches, "Multan Campus", "branch"), branch: "Multan Campus", join_date: "2024-04-05", age: 28, managerRegNo: "TR-2024-021" },
    { reg_no: "TR-2024-023", first_name: "Yasir", last_name: "Khan Afridi", father_name: "Sher Zaman Afridi", email: "yasir.afridi@horizonlearning.edu.pk", mobile_1: "0345-5559995", gender: "Male" as const, cnic: "17301-5556667-5", city: "Peshawar", country: "Pakistan", qualification: "BS Sports Sciences", staff_type: "Non-Teaching", designation: "Sports Coordinator", department_id: need(departments, "Sports & Extracurricular", "department"), branch_id: need(branches, "Peshawar Campus", "branch"), branch: "Peshawar Campus", join_date: "2022-06-20", age: 34 },
    { reg_no: "TR-2024-024", first_name: "Sundas", last_name: "Gul", father_name: "Habib Gul Khan", email: "sundas.gul@horizonlearning.edu.pk", mobile_1: "0311-6669996", gender: "Female" as const, cnic: "17301-6667778-6", city: "Peshawar", country: "Pakistan", qualification: "M.Ed", staff_type: "Teaching", designation: "Teacher", department_id: need(departments, "Academics", "department"), branch_id: need(branches, "Peshawar Campus", "branch"), branch: "Peshawar Campus", join_date: "2023-10-15", age: 29, managerRegNo: "TR-2024-023" },
    { reg_no: "TR-2024-025", first_name: "Adeel", last_name: "Sarwar Butt", father_name: "Muhammad Sarwar Butt", email: "adeel.butt@alfalahtrust.edu.pk", mobile_1: "0334-7779997", gender: "Male" as const, cnic: "34603-7778889-7", city: "Sialkot", country: "Pakistan", qualification: "B.Sc Engineering Technology", staff_type: "Administrative", designation: "Procurement Officer", department_id: need(departments, "Procurement & Facilities", "department"), branch_id: need(branches, "Sialkot Campus", "branch"), branch: "Sialkot Campus", join_date: "2023-05-12", age: 31 },
    { reg_no: "TR-2024-026", first_name: "Rimsha", last_name: "Noor", father_name: "Noor Ahmed Bajwa", email: "rimsha.noor@alfalahtrust.edu.pk", mobile_1: "0300-8889998", gender: "Female" as const, cnic: "34603-8889990-8", city: "Sialkot", country: "Pakistan", qualification: "BBA (HR)", staff_type: "Administrative", designation: "HR Assistant", department_id: need(departments, "Human Resources", "department"), branch_id: need(branches, "Sialkot Campus", "branch"), branch: "Sialkot Campus", join_date: "2024-07-01", age: 24, managerRegNo: "TR-2024-025" },
    { reg_no: "TR-2024-027", first_name: "Salman", last_name: "Raza Qadri", father_name: "Ghulam Qadri", email: "salman.qadri@metrobusiness.edu.pk", mobile_1: "0321-9990009", gender: "Male" as const, cnic: "37405-9990001-9", city: "Rawalpindi", country: "Pakistan", qualification: "LLB", staff_type: "Management", designation: "Compliance Officer", department_id: need(departments, "Legal & Compliance", "department"), branch_id: need(branches, "Rawalpindi Campus", "branch"), branch: "Rawalpindi Campus", join_date: "2022-02-14", age: 40 },
    { reg_no: "TR-2024-028", first_name: "Iqra", last_name: "Yasmeen", father_name: "Muhammad Yasin", email: "iqra.yasmeen@metrobusiness.edu.pk", mobile_1: "0345-1110001", gender: "Female" as const, cnic: "37405-1112223-1", city: "Rawalpindi", country: "Pakistan", qualification: "B.Com", staff_type: "Administrative", designation: "Accounts Officer", department_id: need(departments, "Finance & Accounts", "department"), branch_id: need(branches, "Rawalpindi Campus", "branch"), branch: "Rawalpindi Campus", join_date: "2023-12-01", age: 26, managerRegNo: "TR-2024-027" },
  ];

  // ── Added: 72 more employees (029–100), generated programmatically so
  // the headcount reaches 100 without hand-writing 72 literal objects.
  // Distributed round-robin across all 12 branches (10 companies) and
  // cycled across all 15 departments so every company/department combo
  // gets real coverage, not just the original 6 companies/12 departments.
  const allBranchNamesForGeneration = [
    "Lahore Campus", "Karachi Campus", "Islamabad Campus", "Faisalabad Campus", "Multan Campus",
    "Peshawar Campus", "Sialkot Campus", "Rawalpindi Campus", "Gujranwala Campus", "Hyderabad Campus",
    "Sukkur Campus", "Quetta Campus",
  ];
  const branchCityForGeneration: Record<string, string> = {
    "Lahore Campus": "Lahore", "Karachi Campus": "Karachi", "Islamabad Campus": "Islamabad",
    "Faisalabad Campus": "Faisalabad", "Multan Campus": "Multan", "Peshawar Campus": "Peshawar",
    "Sialkot Campus": "Sialkot", "Rawalpindi Campus": "Rawalpindi", "Gujranwala Campus": "Gujranwala",
    "Hyderabad Campus": "Hyderabad", "Sukkur Campus": "Sukkur", "Quetta Campus": "Quetta",
  };
  const branchToCompanyDomain: Record<string, string> = {
    "Lahore Campus": "techrive.edu.pk", "Karachi Campus": "techrive.edu.pk", "Islamabad Campus": "techrive.edu.pk",
    "Faisalabad Campus": "riverside.edu.pk", "Multan Campus": "crescentacademy.edu.pk", "Peshawar Campus": "horizonlearning.edu.pk",
    "Sialkot Campus": "alfalahtrust.edu.pk", "Rawalpindi Campus": "metrobusiness.edu.pk",
    "Gujranwala Campus": "brightfuture.edu.pk", "Hyderabad Campus": "alnoortech.edu.pk",
    "Sukkur Campus": "pearlvale.edu.pk", "Quetta Campus": "nationalskills.edu.pk",
  };
  const cnicPrefixByCityForGeneration: Record<string, string> = {
    Lahore: "35202", Karachi: "42101", Islamabad: "61101", Faisalabad: "33100", Multan: "36302",
    Peshawar: "17301", Sialkot: "34603", Rawalpindi: "37405",
    Gujranwala: "34101", Hyderabad: "41304", Sukkur: "45201", Quetta: "53101",
  };
  const deptRoleProfile: Record<string, { staffType: string; designations: string[] }> = {
    "Administration": { staffType: "Administrative", designations: ["Admin Officer", "Office Assistant", "Front Desk Executive", "Administrative Assistant"] },
    "Academics": { staffType: "Teaching", designations: ["Teacher", "Lecturer", "Subject Head", "Academic Coordinator"] },
    "Finance & Accounts": { staffType: "Administrative", designations: ["Accounts Officer", "Accountant", "Finance Assistant", "Junior Accountant"] },
    "Human Resources": { staffType: "Administrative", designations: ["HR Assistant", "HR Officer", "Recruitment Executive", "HR Coordinator"] },
    "IT & Systems": { staffType: "Administrative", designations: ["IT Support Engineer", "Network Engineer", "System Administrator", "Software Developer"] },
    "Examinations": { staffType: "Administrative", designations: ["Exam Coordinator", "Result Compilation Officer", "Exam Assistant"] },
    "Admissions & Marketing": { staffType: "Administrative", designations: ["Admissions Officer", "Marketing Executive", "Outreach Coordinator"] },
    "Transport": { staffType: "Non-Teaching", designations: ["Transport Coordinator", "Route Supervisor", "Transport Assistant"] },
    "Library": { staffType: "Non-Teaching", designations: ["Librarian", "Library Assistant", "Cataloguing Officer"] },
    "Sports & Extracurricular": { staffType: "Non-Teaching", designations: ["Sports Coordinator", "Physical Education Teacher", "Activities Officer"] },
    "Procurement & Facilities": { staffType: "Administrative", designations: ["Procurement Officer", "Facilities Assistant", "Vendor Coordinator"] },
    "Legal & Compliance": { staffType: "Management", designations: ["Compliance Officer", "Legal Assistant", "Contracts Officer"] },
    "Research & Development": { staffType: "Administrative", designations: ["Research Associate", "Curriculum Developer", "R&D Officer"] },
    "Student Affairs": { staffType: "Non-Teaching", designations: ["Student Affairs Officer", "Counselor", "Discipline Officer"] },
    "Health & Safety": { staffType: "Non-Teaching", designations: ["Safety Officer", "Health & Safety Coordinator", "Campus Nurse"] },
  };
  const qualificationByStaffTypeForGeneration: Record<string, string[]> = {
    Teaching: ["B.Ed", "M.Ed", "M.Phil Education", "MA English", "MSc Mathematics"],
    Administrative: ["BBA", "B.Com", "MBA", "BS Computer Science", "BS Accounting & Finance"],
    Management: ["MBA", "MS Management", "LLB", "MBA (Finance)"],
    "Non-Teaching": ["BA", "Diploma in relevant field", "BSc", "Intermediate"],
  };
  const staffTypeSalaryBaseForGeneration: Record<string, number> = {
    Management: 90000, Teaching: 55000, Administrative: 45000, "Non-Teaching": 40000,
  };
  const generatedFirstNamesMale = [
    "Adnan", "Nauman", "Faisal", "Junaid", "Tanveer", "Shahzad", "Naveed", "Aamir", "Sohail", "Waseem",
    "Rashid", "Zulfiqar", "Arslan", "Farrukh", "Rizwan", "Shoaib", "Nadeem", "Tahir", "Saad", "Yasin",
    "Irfan", "Shahbaz", "Mudassar", "Ahsan", "Khurram", "Mubashir", "Rehan", "Zeeshan", "Asif", "Noman",
  ];
  const generatedFirstNamesFemale = [
    "Saima", "Farah", "Amna", "Sidra", "Uzma", "Asma", "Rabia", "Shazia", "Naila", "Sobia",
    "Anum", "Sehrish", "Fariha", "Nazia", "Sumaira", "Aqsa", "Hafsa", "Maha", "Laiba", "Anosha",
    "Kiran", "Erum", "Shaista", "Ghazala", "Wajeeha", "Tehmina", "Saadia", "Beenish", "Madiha", "Rukhsar",
  ];
  const generatedSurnames = [
    "Chishti", "Baig", "Zaidi", "Cheema", "Bhutta", "Randhawa", "Yousafzai", "Marwat", "Leghari", "Bhatti",
    "Soomro", "Memon", "Jatoi", "Baloch", "Magsi", "Khoso", "Chandio", "Rind", "Bugti", "Marri",
    "Warraich", "Dogar", "Sandhu", "Gill", "Chaudhary", "Rana", "Minhas", "Mirza", "Khokhar", "Sial",
  ];
  const fatherFirstNamePoolForGeneration = ["Muhammad", "Ghulam", "Abdul", "Sher", "Rashid", "Nazir", "Anwar", "Riaz", "Iqbal", "Ahmed"];
  const deptNamesForGeneration = Object.keys(deptRoleProfile);

  const GENERATED_EMPLOYEE_COUNT = 72; // 28 hand-written + 72 generated = 100 total
  for (let n = 0; n < GENERATED_EMPLOYEE_COUNT; n++) {
    const idx = 28 + n; // 0-based overall index → reg_no 029..100
    const regNo = `TR-2024-${String(idx + 1).padStart(3, "0")}`;
    const branchName = allBranchNamesForGeneration[n % allBranchNamesForGeneration.length]!;
    const deptName = deptNamesForGeneration[(n + Math.floor(n / allBranchNamesForGeneration.length)) % deptNamesForGeneration.length]!;
    const profile = deptRoleProfile[deptName]!;
    const isMale = n % 2 === 0;
    const genderForGeneration: "Male" | "Female" = isMale ? "Male" : "Female";
    const firstName = isMale
      ? generatedFirstNamesMale[n % generatedFirstNamesMale.length]!
      : generatedFirstNamesFemale[n % generatedFirstNamesFemale.length]!;
    const surname = generatedSurnames[n % generatedSurnames.length]!;
    const city = branchCityForGeneration[branchName]!;
    const cnicPrefix = cnicPrefixByCityForGeneration[city] ?? "35202";
    const cnicMiddle = String(1000000 + idx * 137).slice(0, 7);
    const cnicCheckDigit = idx % 10;
    const qualificationPool = qualificationByStaffTypeForGeneration[profile.staffType] ?? qualificationByStaffTypeForGeneration["Administrative"]!;
    const domain = branchToCompanyDomain[branchName]!;

    baseEmployeeSeeds.push({
      reg_no: regNo,
      first_name: firstName,
      last_name: surname,
      father_name: `${fatherFirstNamePoolForGeneration[idx % fatherFirstNamePoolForGeneration.length]} ${surname}`,
      // Local-part includes the employee number to guarantee uniqueness
      // across the whole 100-person roster without a runtime collision
      // check — a common real-world convention when generating accounts
      // in bulk (see also DEFAULT_PASSWORD / employeeNNN login pattern).
      email: `${firstName.toLowerCase()}.${surname.toLowerCase()}${idx + 1}@${domain}`,
      mobile_1: `03${((idx * 7) % 90).toString().padStart(2, "0")}-${String(1000000 + idx * 457).slice(0, 7)}`,
      gender: genderForGeneration,
      cnic: `${cnicPrefix}-${cnicMiddle}-${cnicCheckDigit}`,
      city,
      country: "Pakistan",
      qualification: qualificationPool[idx % qualificationPool.length]!,
      staff_type: profile.staffType,
      designation: profile.designations[idx % profile.designations.length]!,
      department_id: need(departments, deptName, "department"),
      branch_id: need(branches, branchName, "branch"),
      branch: branchName,
      join_date: shiftDays("2022-01-15", (idx * 11) % 1300),
      age: 24 + (idx % 20),
    });
  }

  const motherNames = [
    "Nasreen Akhtar", "Shabana Kausar", "Rehana Begum", "Naheed Akhtar", "Farzana Bibi",
    "Yasmin Sultana", "Nasim Akhtar", "Shazia Parveen", "Robina Yasmin", "Talat Jabeen",
    "Samina Chaudhry", "Rubina Shaheen", "Nighat Bano", "Saira Batool", "Amina Bibi",
    "Rukhsana Kausar", "Parveen Akhtar", "Zubaida Begum", "Shagufta Naz", "Tahira Sultana",
    "Musarrat Jabeen", "Kishwar Sultana", "Farida Yasmin", "Bushra Rafique", "Uzma Kausar",
    "Sadia Bano", "Firdous Akhtar", "Nazia Perveen",
  ];
  const bloodGroups = ["A+", "B+", "O+", "AB+", "A-", "B-", "O+", "A+"];
  // Rough basic-salary bands by designation seniority, PKR/month — also
  // used by the Salary Sheets section later so the two stay consistent.
  const basicSalaryByEmployee = [
    150000, 75000, 110000, 95000, 70000, 85000, 70000, 55000, 65000, 78000, 60000, 45000,
    70000, 55000, 100000, 75000, 65000, 60000,
    // ── Added employees (19–28) ──
    68000, 52000, 50000, 52000, 48000, 62000, 55000, 50000, 95000, 54000,
    // ── Added employees (29–100, generated) — base salary by staff_type
    // (Management/Teaching/Administrative/Non-Teaching), with a small
    // per-employee spread so the 72 generated rows aren't identical.
    ...baseEmployeeSeeds.slice(28).map((b, n) => {
      const staffTypeSalaryBase: Record<string, number> = {
        Management: 90000, Teaching: 55000, Administrative: 45000, "Non-Teaching": 40000,
      };
      return (staffTypeSalaryBase[b.staff_type] ?? 45000) + (n % 10) * 2500;
    }),
  ];
  const cityAreaCode: Record<string, string> = {
    Lahore: "042", Karachi: "021", Islamabad: "051",
    Faisalabad: "041", Multan: "061", Peshawar: "091", Sialkot: "052", Rawalpindi: "051",
    Gujranwala: "055", Hyderabad: "022", Sukkur: "071", Quetta: "081",
  };
  const cityMotherTongue: Record<string, string> = {
    Lahore: "Punjabi", Karachi: "Urdu", Islamabad: "Pashto",
    Faisalabad: "Punjabi", Multan: "Saraiki", Peshawar: "Pashto", Sialkot: "Punjabi", Rawalpindi: "Punjabi",
    Gujranwala: "Punjabi", Hyderabad: "Sindhi", Sukkur: "Sindhi", Quetta: "Balochi",
  };
  const cityState: Record<string, string> = {
    Lahore: "Punjab", Karachi: "Sindh", Islamabad: "Islamabad Capital Territory",
    Faisalabad: "Punjab", Multan: "Punjab", Peshawar: "Khyber Pakhtunkhwa", Sialkot: "Punjab", Rawalpindi: "Punjab",
    Gujranwala: "Punjab", Hyderabad: "Sindh", Sukkur: "Sindh", Quetta: "Balochistan",
  };
  const skillByStaffType: Record<string, string> = {
    Teaching: "Lesson planning, classroom management, subject-matter mentoring.",
    Administrative: "MS Office, record-keeping, cross-department coordination.",
    Management: "Team leadership, budgeting, stakeholder communication.",
    "Non-Teaching": "Operations support, scheduling, and facility coordination.",
  };

  /** Fills in every extended profile field on a base employee record from a handful of core facts, so nothing is left blank. */
  function buildEmployeeSeed(b: (typeof baseEmployeeSeeds)[number]) {
    const dob = shiftYears(b.join_date, -b.age);
    const cnicIssueDate = shiftYears(b.join_date, -8);
    const cnicExpiryDate = shiftYears(cnicIssueDate, 10);
    const firstNameLower = b.first_name.toLowerCase().replace(/[^a-z]/g, "");
    const areaCode = cityAreaCode[b.city] ?? "042";
    const idx = Number(b.reg_no.slice(-3)) - 1;

    return {
      ...b,
      mother_name: motherNames[idx % motherNames.length]!,
      date_of_birth: dob,
      marital_status: b.age >= 30 ? "Married" : "Single",
      blood_group: bloodGroups[idx % bloodGroups.length]!,
      nationality: "Pakistani",
      mother_tongue: cityMotherTongue[b.city] ?? "Urdu",
      disability: 0 as const,
      address: `House ${100 + idx}, ${b.city === "Lahore" ? "Model Town" : b.city === "Karachi" ? "Gulshan-e-Iqbal" : b.city === "Islamabad" ? "G-9 Sector" : `${b.city} Cantt`}, ${b.city}`,
      home_phone: `${areaCode}-3${String(4000000 + idx * 1111).slice(0, 7)}`,
      mobile_2: `03${((idx + 4) % 9) + 1}${String(5000000 + idx * 2222).slice(0, 7)}`,
      pemail: `${firstNameLower}.personal@gmail.com`,
      temp_address: "Same as permanent address",
      state: cityState[b.city] ?? "Punjab",
      temp_state: cityState[b.city] ?? "Punjab",
      temp_country: "Pakistan",
      cnic_issue_date: cnicIssueDate,
      cnic_expiry_date: cnicExpiryDate,
      expiry_date: shiftYears(b.join_date, 5), // staff ID/contract review date
      ntn: b.staff_type === "Management" || b.designation.includes("Finance") || b.designation.includes("Accountant") ? `NTN-${1000000 + idx}` : undefined,
      staff_image: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${b.first_name} ${b.last_name}`)}&background=random`,
      skill: skillByStaffType[b.staff_type] ?? "General administrative support.",
      experience: `${3 + (idx % 7)}+ years in similar educational/administrative roles.`,
      other_info: `Joined via campus referral program. Emergency contact on file.`,
      job_status: "Full-time",
      probation: "Completed",
      start_day_contract: b.join_date,
      end_day_contract: undefined, // open-ended/permanent — no fixed contract end
      first_registration_code: `FRC-${b.reg_no}`,

      // ─── Salary Structure ───────────────────────────────────────────────
      // Now a normal part of createEmployee()/updateEmployee() (see
      // employee.service.ts) — Payroll Run reads these straight off the
      // staff row, so every seeded employee needs them or a run would
      // silently compute a ₨0 sheet.
      basic_salary: basicSalaryByEmployee[idx] ?? 60000,
      house_rent: Math.round((basicSalaryByEmployee[idx] ?? 60000) * 0.45),
      medical_allowances: Math.round((basicSalaryByEmployee[idx] ?? 60000) * 0.1),
      conveyance: 8000,
      tax_percentage: 5,
      epf_amount: 0,
      eobi_amount: 2600,
      bank_account: `PK${36 + idx}TECH000${1000000000 + idx * 111}`,
    };
  }

  const employeeSeeds = baseEmployeeSeeds.map(buildEmployeeSeed);

  const employees: { id: number; name: string; branch: string }[] = [];
  const DEFAULT_PASSWORD = "Employee@123";
  let adminActorId = 0;

  for (let i = 0; i < employeeSeeds.length; i++) {
    const e = employeeSeeds[i]!;
    // `staff` uniqueness spans three columns (reg_no/email/cnic) via the
    // service's own assertUniqueFields — so unlike the single-natural-key
    // entities above, the pre-check here mirrors that OR directly rather
    // than using the generic createOrSkip() helper (which expects one
    // lookup to describe "does this exist"). The erp_users row and the
    // staff row are also two separate creates that need to succeed/skip
    // together, which createOrSkip isn't shaped for either.
    const existingStaff = await prisma.staff.findFirst({
      where: {
        deleted_at: null,
        OR: [{ reg_no: e.reg_no }, { email: e.email }, { cnic: e.cnic }],
      },
      select: { id: true, reg_no: true, status: true },
    });

    if (existingStaff) {
      skippedCount++;
      employees.push({ id: existingStaff.id, name: `${e.first_name} ${e.last_name}`, branch: e.branch });
      if (adminActorId === 0) {
        const existingUser = await prisma.erpUsers.findFirst({ where: { email: e.email }, select: { id: true } });
        if (existingUser) adminActorId = existingUser.id;
      }

      // The employee row already existed — but it may have been created by
      // an earlier version of this script that didn't fill in the extended
      // profile fields yet. Refresh it (skipped only for an Inactive/
      // terminated employee, since updateEmployee() refuses to touch those).
      if (existingStaff.status !== "Active") {
        log(`⏭  Skipped employee ${e.first_name} ${e.last_name} (already exists, reg_no ${existingStaff.reg_no}, status ${existingStaff.status ?? "unknown"} — profile not touched)`);
      } else {
        const { branch, age, managerRegNo, ...employeeInput } = e;
        await updateEmployee(existingStaff.id, employeeInput as any);
        log(`⏭  Employee ${e.first_name} ${e.last_name} already existed (reg_no ${existingStaff.reg_no}) — profile fields refreshed`);
      }
      continue;
    }

    let user = await prisma.erpUsers.findFirst({ where: { email: e.email }, select: { id: true } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
      try {
        user = await prisma.erpUsers.create({
          data: {
            name: `${e.first_name} ${e.last_name}`,
            email: e.email,
            password: hashedPassword,
            string_password: DEFAULT_PASSWORD,
            branch_id: e.branch_id,
            user_type: "staff",
            active: 1,
            status: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      } catch (err) {
        if (isDuplicateError(err)) {
          user = await prisma.erpUsers.findFirst({ where: { email: e.email }, select: { id: true } });
        }
        if (!user) throw err;
      }
    }
    if (adminActorId === 0) adminActorId = user.id;

    const { branch, age, managerRegNo, ...employeeInput } = e;
    const employee = await createEmployee({
      ...employeeInput,
      user_id: user.id,
      password: DEFAULT_PASSWORD,
    } as any);

    employees.push({ id: employee.id, name: `${e.first_name} ${e.last_name}`, branch });
    createdCount++;
    log(`Created employee: ${e.first_name} ${e.last_name} (staff id ${employee.id}, login ${e.email})`);
  }

  // ─── 7b. Reporting lines (reports_to) ──────────────────────────────────
  // A manager's staff id only exists once THAT employee has been created,
  // so wiring reports_to happens as a second pass over the finished
  // `employees` list rather than inline during creation above (some
  // managers, like Waqas for Nida, are created after their report).
  section("Reporting Lines");
  for (const e of employeeSeeds) {
    if (!e.managerRegNo) continue;
    const manager = employeeSeeds.find((m) => m.reg_no === e.managerRegNo);
    if (!manager) continue;
    const employeeIdx = employeeSeeds.indexOf(e);
    const managerIdx = employeeSeeds.indexOf(manager);
    const emp = needEmployee(employees, employeeIdx);
    const mgr = needEmployee(employees, managerIdx);

    const current = await prisma.staff.findUnique({ where: { id: emp.id }, select: { reports_to: true, status: true } });
    if (current?.status !== "Active") continue; // updateEmployee() refuses Inactive staff
    if (current?.reports_to === mgr.id) {
      skippedCount++;
      log(`⏭  Skipped reporting line for ${emp.name} (already set)`);
      continue;
    }
    await updateEmployee(emp.id, { reports_to: mgr.id } as any);
    createdCount++;
    log(`${emp.name} now reports to ${mgr.name}`);
  }

  // ─── 8. Per-employee sub-records ──────────────────────────────────────
  section("Bank Accounts, Emergency Contacts, Family, Experience, Qualification, EOBI");
  const banks = ["Habib Bank Limited (HBL)", "United Bank Limited (UBL)", "MCB Bank", "Meezan Bank", "Allied Bank", "Bank Alfalah"];
  const relations = ["Father", "Mother", "Spouse", "Brother", "Sister"];
  const priorEmployers = ["City School System", "Beaconhouse School Network", "The Educators", "LGS Group", "Roots Millennium Schools", "Aitchison College"];
  const maleFirstNames = ["Ali", "Omar", "Hamza", "Bilal", "Asad", "Fahad", "Kashif", "Adeel", "Zeeshan", "Salman", "Usman", "Hassan"];
  const femaleFirstNames = ["Ayesha", "Sana", "Hira", "Mahnoor", "Iqra", "Nimra", "Rida", "Warda", "Alina", "Komal", "Sadia", "Mariam"];

  /** Real full names for relatives instead of a placeholder like "Father of Ahmed" — Father/Mother reuse the names already on the employee's own profile; Spouse/Brother/Sister get a plausible generated name sharing the employee's surname. */
  function relativeName(emp: (typeof employeeSeeds)[number], relation: string, idx: number): { name: string; gender: string } {
    if (relation === "Father") return { name: emp.father_name, gender: "Male" };
    if (relation === "Mother") return { name: emp.mother_name, gender: "Female" };
    const surname = emp.last_name.split(" ").pop() ?? emp.last_name;
    if (relation === "Spouse") {
      const oppositePool = emp.gender === "Male" ? femaleFirstNames : maleFirstNames;
      return { name: `${oppositePool[idx % oppositePool.length]} ${surname}`, gender: emp.gender === "Male" ? "Female" : "Male" };
    }
    if (relation === "Sister") return { name: `${femaleFirstNames[idx % femaleFirstNames.length]} ${surname}`, gender: "Female" };
    return { name: `${maleFirstNames[idx % maleFirstNames.length]} ${surname}`, gender: "Male" }; // Brother (default)
  }

  for (let i = 0; i < employees.length; i++) {
    const emp = needEmployee(employees, i);
    const bank = banks[i % banks.length]!;
    const relation = relations[i % relations.length]!;
    const relative = relativeName(employeeSeeds[i]!, relation, i);

    await createOrSkip(
      `bank account for ${emp.name}`,
      () => prisma.staffBankAccounts.findFirst({ where: { staff_id: emp.id }, select: { id: true } }),
      () =>
        createBankAccount({
          staff_id: emp.id,
          account_title: emp.name,
          account_number: `PK${36 + i}TECH000${1000000000 + i * 111}`,
          bank_branch: `${bank} — ${emp.branch.replace(" Campus", "")} Branch`,
        } as any)
    );

    await createOrSkip(
      `emergency contact for ${emp.name}`,
      () => prisma.staffEmergencyContacts.findFirst({ where: { staff_id: emp.id }, select: { id: true } }),
      () =>
        createEmergencyContact({
          staff_id: emp.id,
          name: relative.name,
          relation,
          phone: `03${(i % 9) + 1}${String(1000000 + i * 11111).slice(0, 7)}`,
          email: `emergency.contact${i + 1}@example.com`,
        } as any)
    );

    await createOrSkip(
      `family record for ${emp.name}`,
      () => prisma.staffFamilies.findFirst({ where: { staff_id: emp.id }, select: { id: true } }),
      () =>
        createFamily({
          staff_id: emp.id,
          name: relative.name,
          relation,
          phone: `03${(i % 9) + 2}${String(2000000 + i * 11111).slice(0, 7)}`,
          gender: relative.gender,
          cnic: `3520${i}-${1000000 + i * 999}-${(i % 9) + 1}`,
          workplace: i % 3 === 0 ? "Homemaker" : "Private Sector",
        } as any)
    );

    await createOrSkip(
      `experience record for ${emp.name}`,
      () => prisma.staffExperiences.findFirst({ where: { staff_id: emp.id }, select: { id: true } }),
      () =>
        createExperience({
          staff_id: emp.id,
          name: priorEmployers[i % priorEmployers.length]!,
          designation: "Similar role prior to joining Techrive",
          from_date: "2018-06-01",
          to_date: "2021-12-31",
        } as any)
    );

    await createOrSkip(
      `qualification record for ${emp.name}`,
      () =>
        prisma.staffQualifications.findFirst({
          where: { staff_id: emp.id, degree: employeeSeeds[i]!.qualification },
          select: { id: true },
        }),
      () =>
        createStaffQualification({
          staff_id: emp.id,
          degree: employeeSeeds[i]!.qualification,
          institute: i % 2 === 0 ? "University of the Punjab" : "University of Karachi",
          board_or_university: i % 2 === 0 ? "University of the Punjab" : "University of Karachi",
          passing_year: 2016 + (i % 6),
          grade_or_cgpa: i % 3 === 0 ? "3.6 CGPA" : "A Grade",
        } as any)
    );

    await createOrSkip(
      `EOBI entry for ${emp.name}`,
      () => prisma.eobiEpfRegister.findFirst({ where: { staff_id: emp.id }, select: { id: true } }),
      () =>
        createEobiEntry({
          staff_id: emp.id,
          branch_id: branches[emp.branch],
          company_id: need(branchCompany, emp.branch, "branch company"),
          eobi_amount: 2600, // standard EOBI employer contribution ballpark (PKR)
          epf_amount: 2600, // standard EPF contribution ballpark (PKR)
        } as any)
    );
  }
  log(`Bank/Emergency/Family/Experience/Qualification/EOBI processed for all ${employees.length} employees`);

  section("Staff Assets");
  // One asset per employee, chosen by role, plus a couple of employees with
  // a second item — 20 rows total across the 18 employees.
  const assetByStaffType: Record<string, { asset_name: string; asset_type: string }> = {
    Teaching: { asset_name: "Epson Projector", asset_type: "Projector" },
    Administrative: { asset_name: "Dell Latitude Laptop", asset_type: "Laptop" },
    Management: { asset_name: "HP EliteBook Laptop", asset_type: "Laptop" },
  };
  const staffAssetSeeds = baseEmployeeSeeds.map((b, idx) => {
    const template = assetByStaffType[b.staff_type] ?? { asset_name: "Dell Latitude Laptop", asset_type: "Laptop" };
    return {
      employee: idx,
      asset_name: template.asset_name,
      asset_type: template.asset_type,
      serial_number: `${template.asset_type.slice(0, 2).toUpperCase()}-${2200 + idx}-${String(1000 + idx * 37).slice(0, 4)}`,
      asset_code: `AST-${String(idx + 1).padStart(3, "0")}`,
      issue_date: b.join_date,
      condition: idx % 4 === 0 ? "New" : idx % 4 === 3 ? "Fair" : "Good",
    };
  });
  // A couple of extra secondary assets for staff whose role needs one.
  staffAssetSeeds.push(
    { employee: 4, asset_name: "Cisco Network Switch (Spare)", asset_type: "Networking Equipment", serial_number: "CS-2960-1187", asset_code: "AST-019", issue_date: "2023-06-10", condition: "Good" },
    { employee: 2, asset_name: "Company Mobile Phone", asset_type: "Mobile Phone", serial_number: "IMEI-3311228899", asset_code: "AST-020", issue_date: "2021-07-15", condition: "Fair" }
  );
  for (const sa of staffAssetSeeds) {
    const emp = needEmployee(employees, sa.employee);
    await createOrSkip(
      `staff asset '${sa.asset_name}' for ${emp.name}`,
      () => prisma.staffAssets.findFirst({ where: { serial_number: sa.serial_number }, select: { id: true } }),
      () =>
        createStaffAsset({
          staff_id: emp.id,
          asset_name: sa.asset_name,
          asset_type: sa.asset_type,
          serial_number: sa.serial_number,
          asset_code: sa.asset_code,
          issue_date: sa.issue_date,
          condition: sa.condition,
        } as any)
    );
  }
  log(`Staff assets ready: ${staffAssetSeeds.length}`);

  // ─── 9. Attendance Statuses ────────────────────────────────────────────
  section("Attendance Statuses");
  const attendanceStatusSeeds = [
    { title: "Present", display_class: "success" },
    { title: "Absent", display_class: "danger" },
    { title: "Late", display_class: "warning" },
    { title: "Half Day", display_class: "info" },
    { title: "On Leave", display_class: "neutral" },
  ];
  const attendanceStatuses: Record<string, number> = {};
  for (const as of attendanceStatusSeeds) {
    const created = await createOrSkip(
      `attendance status '${as.title}'`,
      () => prisma.erpAttendanceStatuses.findFirst({ where: { title: { equals: as.title, mode: "insensitive" } }, select: { id: true, title: true } }),
      () => createAttendanceStatus(as as any)
    );
    attendanceStatuses[as.title] = created.id;
    log(`Attendance status: ${created.title} (id ${created.id})`);
  }

  // ─── 10. Attendance records (3 work-weeks, ALL employees) ─────────────
  section("Attendance Records");
  // Mon–Fri across three weeks (Sundays are the weekly off day per the
  // work-shift seeds above) — 15 dates × 18 employees = 270 records, so
  // every employee ends up with a solid multi-week attendance history
  // instead of just a handful of rows for a handful of people.
  const attendanceDates = [
    "2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09",
    "2026-01-12", "2026-01-13", "2026-01-14", "2026-01-15", "2026-01-16",
    "2026-01-19", "2026-01-20", "2026-01-21", "2026-01-22", "2026-01-23",
  ];
  let attendanceCount = 0;
  for (let i = 0; i < employees.length; i++) {
    const emp = needEmployee(employees, i);
    for (let d = 0; d < attendanceDates.length; d++) {
      const date = attendanceDates[d]!;
      // Deterministic but varied mix: mostly Present, with Late/Half Day/
      // Absent sprinkled in per employee so the data doesn't look robotic.
      const roll = (i * 7 + d * 3) % 20;
      const statusTitle = roll === 0 ? "Absent" : roll === 1 || roll === 2 ? "Late" : roll === 3 ? "Half Day" : "Present";
      await createOrSkip(
        `attendance for ${emp.name} on ${date}`,
        () =>
          prisma.employeeAttendance.findFirst({
            where: { employee_id: emp.id, attendance_date: new Date(`${date}T00:00:00.000Z`) },
            select: { id: true },
          }),
        () =>
          createAttendance({
            employee_id: emp.id,
            branch_id: need(branches, emp.branch, "branch"),
            attendance_date: date,
            status: need(attendanceStatuses, statusTitle, "attendance status"),
            timeIn: statusTitle === "Absent" ? undefined : statusTitle === "Late" ? "09:35" : statusTitle === "Half Day" ? "09:00" : "08:55",
            timeOut: statusTitle === "Absent" ? undefined : statusTitle === "Half Day" ? "13:00" : "17:05",
          } as any)
      );
      attendanceCount++;
    }
  }
  log(`Attendance records processed: ${attendanceCount} across all ${employees.length} employees for Jan 5–23, 2026`);

  // ─── 11. Attendance Summaries (Jan 2026, all employees) ───────────────
  section("Attendance Summaries");
  for (let i = 0; i < employees.length; i++) {
    const emp = needEmployee(employees, i);
    const monthId = need(months, "January", "month");
    const yearId = need(years, "2026", "year");
    const totalAbsents = attendanceDates.filter((_, d) => (i * 7 + d * 3) % 20 === 0).length;
    await createOrSkip(
      `attendance summary for ${emp.name}`,
      () => prisma.attendanceSummary.findFirst({ where: { staff_id: emp.id, month_id: monthId, year_id: yearId }, select: { id: true } }),
      () =>
        createAttendanceSummary({
          branch_id: need(branches, emp.branch, "branch"),
          staff_id: emp.id,
          month_id: monthId,
          year_id: yearId,
          total_absents: totalAbsents,
          pay_status: "Unpaid",
          remarks: totalAbsents > 0 ? `${totalAbsents} unapproved absence(s) recorded in January.` : undefined,
        } as any)
    );
  }
  log(`Attendance summaries processed for ${employees.length} employees`);

  // ─── 12. Leave Types ────────────────────────────────────────────────────
  section("Leave Types");
  const leaveTypeSeeds = [
    { name: "Annual Leave", permitted_days: 14, type: "Paid" },
    { name: "Sick Leave", permitted_days: 10, type: "Paid" },
    { name: "Casual Leave", permitted_days: 8, type: "Paid" },
    { name: "Maternity Leave", permitted_days: 90, type: "Paid" },
    { name: "Hajj Leave", permitted_days: 30, type: "Unpaid" },
  ];
  const leaveTypes: Record<string, number> = {};
  for (const lt of leaveTypeSeeds) {
    const created = await createOrSkip(
      `leave type '${lt.name}'`,
      () =>
        prisma.erpHrmLeaveTypes.findFirst({
          where: { name: { equals: lt.name, mode: "insensitive" } },
          select: { id: true, name: true },
        }),
      () => createLeaveType({ ...lt, year: 2026 } as any)
    );
    leaveTypes[lt.name] = created.id;
    log(`Leave type: ${created.name} (id ${created.id})`);
  }

  // ─── 13. Leave Statuses ─────────────────────────────────────────────────
  section("Leave Statuses");
  const leaveStatusNames = ["Pending", "Approved", "Rejected", "Cancelled"];
  const leaveStatuses: Record<string, number> = {};
  for (const name of leaveStatusNames) {
    const created = await createOrSkip(
      `leave status '${name}'`,
      () =>
        prisma.erpHrmLeaveStatuses.findFirst({
          where: { name: { equals: name, mode: "insensitive" } },
          select: { id: true, name: true },
        }),
      () => createLeaveStatus({ name } as any)
    );
    leaveStatuses[name] = created.id;
    log(`Leave status: ${created.name} (id ${created.id})`);
  }

  // ─── 14. Leave Entitlements ─────────────────────────────────────────────
  section("Leave Entitlements");
  // Every employee gets an Annual Leave entitlement; a subset also gets a
  // second (Sick/Casual/Maternity/Hajj) entitlement for variety — 28 rows
  // total across the 18 employees.
  const entitlementSeeds: { employee: number; type: string; no_of_days: number; days_used: number }[] = [];
  for (let i = 0; i < baseEmployeeSeeds.length; i++) {
    entitlementSeeds.push({ employee: i, type: "Annual Leave", no_of_days: 14, days_used: i % 8 });
  }
  for (const i of [0, 1, 5, 8, 9, 12, 15]) {
    entitlementSeeds.push({ employee: i, type: "Sick Leave", no_of_days: 10, days_used: (i * 3) % 6 });
  }
  entitlementSeeds.push(
    { employee: 3, type: "Casual Leave", no_of_days: 8, days_used: 2 },
    { employee: 5, type: "Maternity Leave", no_of_days: 90, days_used: 0 },
    { employee: 4, type: "Hajj Leave", no_of_days: 30, days_used: 0 }
  );
  for (const es of entitlementSeeds) {
    const emp = needEmployee(employees, es.employee);
    const leaveTypeId = need(leaveTypes, es.type, "leave type");
    await createOrSkip(
      `leave entitlement (${es.type}) for ${emp.name}`,
      () =>
        prisma.erpHrmLeaveEntitlements.findFirst({
          where: { employee_id: emp.id, leave_type_id: leaveTypeId },
          select: { id: true },
        }),
      () =>
        createLeaveEntitlement({
          employee_id: emp.id,
          leave_type_id: leaveTypeId,
          no_of_days: es.no_of_days,
          days_used: es.days_used,
          start_date: "2026-01-01",
          end_date: "2026-12-31",
          credited_date: "2026-01-01",
        } as any)
    );
  }
  log(`Leave entitlements processed: ${entitlementSeeds.length}`);

  // ─── 15. Leave Requests ─────────────────────────────────────────────────
  section("Leave Requests");
  // One request per employee, cycling type/status/dates for variety, plus
  // two longer special-case requests — 20 rows total.
  const leaveRequestTypeCycle = ["Annual Leave", "Sick Leave", "Casual Leave"];
  const leaveRequestStatusCycle = ["Approved", "Pending", "Rejected"];
  const leaveRequestSeeds: {
    employee: number;
    type: string;
    status: string;
    start: string;
    end: string;
    days: number;
    comments: string;
    remarks?: string;
  }[] = [];
  for (let i = 0; i < baseEmployeeSeeds.length; i++) {
    const type = leaveRequestTypeCycle[i % leaveRequestTypeCycle.length]!;
    const status = leaveRequestStatusCycle[i % leaveRequestStatusCycle.length]!;
    const days = type === "Annual Leave" ? 3 : type === "Sick Leave" ? 1 : 2;
    const start = shiftDays("2026-02-01", i * 3);
    const end = shiftDays(start, days - 1);
    leaveRequestSeeds.push({
      employee: i,
      type,
      status,
      start,
      end,
      days,
      comments: `${type} request for personal reasons.`,
      remarks: status === "Rejected" ? "Insufficient notice period provided — please resubmit." : undefined,
    });
  }
  leaveRequestSeeds.push(
    { employee: 5, type: "Maternity Leave", status: "Approved", start: "2026-04-01", end: "2026-06-29", days: 90, comments: "Maternity leave as per policy." },
    { employee: 4, type: "Hajj Leave", status: "Pending", start: "2026-05-15", end: "2026-06-14", days: 30, comments: "Performing Hajj this year, In Sha Allah." }
  );
  for (const lr of leaveRequestSeeds) {
    const emp = needEmployee(employees, lr.employee);
    const leaveTypeId = need(leaveTypes, lr.type, "leave type");
    await createOrSkip(
      `leave request (${lr.type}) for ${emp.name}`,
      () =>
        prisma.erpHrmLeaveRequests.findFirst({
          where: {
            employee_id: emp.id,
            leave_type_id: leaveTypeId,
            start_date: new Date(`${lr.start}T00:00:00.000Z`),
          },
          select: { id: true },
        }),
      () =>
        createLeaveRequest({
          employee_id: emp.id,
          leave_type_id: leaveTypeId,
          branch_id: need(branches, emp.branch, "branch"),
          leave_status: need(leaveStatuses, lr.status, "leave status"),
          start_date: lr.start,
          end_date: lr.end,
          total_days: lr.days,
          applied_date: lr.start,
          comments: lr.comments,
          remarks: lr.remarks,
        } as any)
    );
  }
  log(`Leave requests processed: ${leaveRequestSeeds.length}`);

  // ─── 16. Loan Types & Loan Plans ────────────────────────────────────────
  section("Loan Types & Plans");
  const loanTypeSeeds = [
    { loan_type: "Salary Advance", description: "Short-term advance against upcoming salary, recovered in the next payroll cycle." },
    { loan_type: "Personal Loan", description: "General-purpose interest-free loan for personal needs, repaid over several months." },
    { loan_type: "Education Loan", description: "Loan for employees' children's tuition or admission expenses." },
    { loan_type: "Eid Advance", description: "Seasonal advance granted around Eid-ul-Fitr and Eid-ul-Adha." },
  ];
  for (const lt of loanTypeSeeds) {
    await createOrSkip(
      `loan type '${lt.loan_type}'`,
      // erp_loans has no unique constraint / service-level uniqueness check
      // on loan_type (see loanType.service.ts) — checked manually here so
      // re-running the seed doesn't pile up duplicate loan types.
      () => prisma.erpLoans.findFirst({ where: { loan_type: { equals: lt.loan_type, mode: "insensitive" } }, select: { loan_id: true } }),
      () => createLoanType(lt as any)
    );
  }
  log(`Loan types ready: ${loanTypeSeeds.length}`);

  const loanPlanSeeds = [
    { loan_installment: "Single deduction", tenure: "1 Month", extra_pay: "None" },
    { loan_installment: "Equal monthly deduction", tenure: "6 Months", extra_pay: "None" },
    { loan_installment: "Equal monthly deduction", tenure: "12 Months", extra_pay: "None" },
  ];
  for (const lp of loanPlanSeeds) {
    await createOrSkip(
      `loan plan '${lp.loan_installment} / ${lp.tenure}'`,
      // Same situation as loan types: erp_loan_plans has no uniqueness
      // guard of its own, so this is checked here instead.
      () =>
        prisma.erpLoanPlans.findFirst({
          where: { loan_installment: lp.loan_installment, tenure: lp.tenure },
          select: { loan_plan_id: true },
        }),
      () => createLoanPlan(lp as any)
    );
  }
  log(`Loan plans ready: ${loanPlanSeeds.length}`);

  // ─── 17. Loans (request_loan_employee, via loanRequest.service.ts) ────
  section("Loans");
  // One loan per employee for the first 16 employees, cycling loan type and
  // decision status — 16 rows total, so the loans list has real variety
  // instead of a handful of hand-picked examples.
  const loanTypeCycle = ["Salary Advance", "Personal Loan", "Education Loan", "Eid Advance"];
  const loanSeeds: {
    employee: number;
    type: string;
    amount: number;
    installments: number;
    status: number;
    reason: string;
    remarks?: string;
  }[] = [];
  for (let i = 0; i < baseEmployeeSeeds.length - 2; i++) {
    const type = loanTypeCycle[i % loanTypeCycle.length]!;
    const status = [1, 0, 2][i % 3]!; // Approved, Pending, Rejected
    loanSeeds.push({
      employee: i,
      type,
      amount: 20000 + (i % 6) * 15000,
      installments: type === "Salary Advance" || type === "Eid Advance" ? 1 : 6,
      status,
      reason: `${type} requested for personal financial need.`,
      remarks: status === 2 ? "Declined pending review of existing obligations." : undefined,
    });
  }
  for (const lo of loanSeeds) {
    const emp = needEmployee(employees, lo.employee);

    // No uniqueness check in loanRequest.service.ts beyond "does the
    // referenced employee/branch exist" — so duplicates are prevented here.
    // Skipping a pre-existing loan also means skipping the status
    // follow-up call below, since it was already applied (or
    // intentionally left Pending) the first time this ran.
    const existingLoan = await prisma.requestLoanEmployee.findFirst({
      where: { staff_id: emp.id, type: lo.type, amount: lo.amount },
      select: { id: true },
    });
    if (existingLoan) {
      skippedCount++;
      log(`⏭  Skipped loan (${lo.type}) for ${emp.name} (already exists)`);
      continue;
    }

    const created = await createLoan({
      staff_id: emp.id,
      branch_id: need(branches, emp.branch, "branch"),
      type: lo.type,
      amount: lo.amount,
      installments: lo.installments,
      effective_from: "2026-01-01",
      reason: lo.reason,
    } as any);
    createdCount++;

    // status can't be set on create (always starts Pending) — apply the
    // decision as a follow-up action, same as a reviewer would in the UI.
    if (lo.status !== 0) {
      await changeLoanRequestStatus(created.id, { status: lo.status, remarks: lo.remarks } as any, adminActorId);
    }
  }
  log(`Loans processed: ${loanSeeds.length}`);

  // ─── 18. Increments ─────────────────────────────────────────────────────
  section("Increments");
  // Every employee gets one increment record — 18 rows total.
  const incrementReasonCycle = [
    "Annual performance-based increment.",
    "Cost-of-living adjustment.",
    "Promotion-linked increment.",
  ];
  const incrementSeeds: {
    employee: number;
    reason: string;
    basic_salary: number;
    previous_gross_salary: number;
    New_salary_increment: number;
    Amount: number;
  }[] = [];
  for (let i = 0; i < baseEmployeeSeeds.length; i++) {
    const basic = 50000 + (i % 10) * 6000;
    const previousGross = Math.round(basic * 1.25);
    const bump = 5000 + (i % 4) * 2500;
    incrementSeeds.push({
      employee: i,
      reason: incrementReasonCycle[i % incrementReasonCycle.length]!,
      basic_salary: basic,
      previous_gross_salary: previousGross,
      New_salary_increment: previousGross + bump,
      Amount: bump,
    });
  }
  for (const inc of incrementSeeds) {
    const emp = needEmployee(employees, inc.employee);
    await createOrSkip(
      `increment for ${emp.name}`,
      () => prisma.incrementPfs.findFirst({ where: { staff_id: emp.id, increment_date: "2026-01-01" }, select: { id: true } }),
      () =>
        createIncrement({
          staff_id: emp.id,
          branch_id: need(branches, emp.branch, "branch"),
          reason: inc.reason,
          increment_date: "2026-01-01",
          basic_salary: inc.basic_salary,
          previous_gross_salary: inc.previous_gross_salary,
          New_salary_increment: inc.New_salary_increment,
          Amount: inc.Amount,
        } as any)
    );
  }
  log(`Increments processed: ${incrementSeeds.length}`);

  // ─── 19. Performance Reviews ─────────────────────────────────────────────
  section("Performance Reviews");
  // One January review per employee, cycling ratings — 18 rows total.
  const performanceRatingCycle = ["Excellent", "Good", "Average"];
  const performanceSeeds: {
    employee: number;
    lecture_deliver: string;
    confidence: string;
    punctuality: string;
    moral_values: string;
    student_feedback: string;
    month: string;
  }[] = [];
  for (let i = 0; i < baseEmployeeSeeds.length; i++) {
    const primary = performanceRatingCycle[i % performanceRatingCycle.length]!;
    const secondary = performanceRatingCycle[(i + 1) % performanceRatingCycle.length]!;
    performanceSeeds.push({
      employee: i,
      lecture_deliver: primary,
      confidence: secondary,
      punctuality: primary,
      moral_values: "Excellent",
      student_feedback: secondary,
      month: "01",
    });
  }
  for (const p of performanceSeeds) {
    const emp = needEmployee(employees, p.employee);
    await createOrSkip(
      `performance review for ${emp.name}`,
      () => prisma.staffPerformances.findFirst({ where: { user_id: emp.id, month: p.month }, select: { id: true } }),
      () =>
        createPerformance({
          staff_id: emp.id,
          lecture_deliver: p.lecture_deliver,
          confidence: p.confidence,
          punctuality: p.punctuality,
          moral_values: p.moral_values,
          student_feedback: p.student_feedback,
          month: p.month,
        } as any)
    );
  }
  log(`Performance reviews processed: ${performanceSeeds.length}`);

  // ─── 20. Branch Transfers ────────────────────────────────────────────────
  section("Branch Transfers");
  const branchTransfer = needEmployee(employees, 11); // Rabia Hameed, Islamabad → Lahore
  await createOrSkip(
    `branch transfer for ${branchTransfer.name}`,
    () => prisma.staffBranchTransfer.findFirst({ where: { staff_id: branchTransfer.id }, select: { id: true } }),
    () =>
      createBranchTransfer(
        {
          staff_id: branchTransfer.id,
          to_branch: need(branches, "Lahore Campus", "branch"),
          date: "2026-04-01",
          reason: "Relocating to Lahore for family reasons; requesting transfer to Lahore Campus.",
        } as any,
        adminActorId
      )
  );
  log(`Branch transfer processed (${branchTransfer.name}: Islamabad → Lahore)`);

  // ─── 21. Resignation ──────────────────────────────────────────────────────
  section("Resignation");
  const resigningEmployee = needEmployee(employees, 8); // Usman Ghani Awan
  await createOrSkip(
    `resignation for ${resigningEmployee.name}`,
    () => prisma.resigns.findFirst({ where: { user_id: BigInt(resigningEmployee.id) }, select: { id: true } }),
    () =>
      createResignation({
        staff_id: resigningEmployee.id,
        branch_id: need(branches, resigningEmployee.branch, "branch"),
        role_id: 1,
        reason: "Pursuing higher education (ACCA) abroad.",
        notice_period: "30 days",
        last_day_of_work: "2026-03-01",
      } as any)
  );
  log(`Resignation processed (${resigningEmployee.name})`);

  // ─── 22. Termination ────────────────────────────────────────────────────
  // NOTE: creating a termination immediately flips the employee to Inactive
  // (see termination.service.ts) — this is the one seed record that changes
  // an employee's live status, by design, so the termination workflow has
  // something real to show. Skipped (not re-applied) if it already ran.
  section("Termination");
  const terminatedEmployee = needEmployee(employees, 4); // Hassan Abbas Shah
  await createOrSkip(
    `termination for ${terminatedEmployee.name}`,
    () => prisma.terminations.findFirst({ where: { user_id: terminatedEmployee.id }, select: { id: true } }),
    () =>
      createTermination({
        staff_id: terminatedEmployee.id,
        reason: "Repeated unauthorized absences despite prior warnings.",
        warnings: "Verbal warning on 2025-11-10; written warning on 2025-12-05.",
      } as any)
  );
  log(`Termination processed (${terminatedEmployee.name})`);

  // ─── 22b. Fiscal Years ───────────────────────────────────────────────────
  // Pakistani fiscal year runs July–June. FY 2024–2025 stands in as "the
  // previous fiscal year" (closed/inactive); FY 2025–2026 is "current" and
  // is what Nov/Dec 2025 salary sheets below are tied to via financial_year
  // (== fiscal_year_id — see salary.service.ts).
  section("Fiscal Years");
  const fiscalYearSeeds = [
    { name: "FY 2024-2025", start_date: "2024-07-01", end_date: "2025-06-30", status: 0 },
    { name: "FY 2025-2026", start_date: "2025-07-01", end_date: "2026-06-30", status: 1 },
  ];
  const fiscalYears: Record<string, number> = {};
  for (const fy of fiscalYearSeeds) {
    const created = await createOrSkip(
      `fiscal year '${fy.name}'`,
      () =>
        prisma.erpFinancialYears.findFirst({
          where: {
            deleted_at: null,
            OR: [
              { name: { equals: fy.name, mode: "insensitive" } },
              // A fiscal year with a *different* name can already occupy this
              // date range (createFiscalYear enforces no-overlap at the
              // service layer — see assertNoOverlap() in fiscalYear.service.ts
              // — so a plain name lookup isn't enough to detect it).
              { start_date: { lte: new Date(fy.end_date) }, end_date: { gte: new Date(fy.start_date) } },
            ],
          },
          select: { id: true, name: true },
        }),
      () => createFiscalYear(fy as any)
    );
    fiscalYears[fy.name] = created.id;
    log(`Fiscal year: ${created.name} (id ${created.id})`);
  }

  // ─── 22c. Tax Slabs (progressive, FBR-style, monthly PKR amounts) ──────
  // Tied to the CURRENT fiscal year — resolveAutoTaxAmount() in
  // salary.service.ts looks these up by fiscal_year_id at salary-sheet
  // creation time, so this is what makes tax_amount below get computed by
  // the app instead of typed in by hand. fixed_amount already bakes in the
  // cumulative tax from every lower slab (see tax-calculation.util.ts), so
  // each boundary lines up with the previous slab's tax at that point.
  section("Tax Slabs");
  const currentFiscalYearId = need(fiscalYears, "FY 2025-2026", "fiscal year");
  const taxSlabSeeds = [
    { min_amount: 0, max_amount: 50000, fixed_amount: 0, tax_percent: 0 },
    { min_amount: 50001, max_amount: 100000, fixed_amount: 0, tax_percent: 2.5 },
    { min_amount: 100001, max_amount: 200000, fixed_amount: 1250, tax_percent: 12.5 },
    { min_amount: 200001, max_amount: 350000, fixed_amount: 13750, tax_percent: 22.5 },
    { min_amount: 350001, max_amount: null, fixed_amount: 47500, tax_percent: 32.5 },
  ];
  for (const [order, ts] of taxSlabSeeds.entries()) {
    await createOrSkip(
      `tax slab #${order + 1} (${ts.min_amount}–${ts.max_amount ?? "∞"}) for FY 2025-2026`,
      () =>
        prisma.hrTaxSlabs.findFirst({
          where: { fiscal_year_id: currentFiscalYearId, min_amount: ts.min_amount },
          select: { id: true },
        }),
      () => createTaxSlab({ ...ts, fiscal_year_id: currentFiscalYearId, slab_order: order + 1 } as any)
    );
  }
  log(`Tax slabs ready: ${taxSlabSeeds.length} progressive slabs for FY 2025-2026`);

  // ─── 22d. Allowance Types (10, mixed fixed/percentage) ─────────────────
  // These replace the old flat medical_allowance/house_rent_allowance/
  // conveyance_allowance columns as the source of truth for gross salary
  // below — createSalarySheet() resolves percentage types against
  // basic_salary and fixed types against their own default_value (see
  // resolveAllowances() in salary.service.ts) whenever an `allowances`
  // array is passed, instead of a manually-entered gross_salary.
  section("Allowance Types");
  const allowanceTypeSeeds = [
    { name: "House Rent Allowance", code: "HRA", calculation_type: "PERCENTAGE", default_value: 45, is_taxable: 1 }, // 45% of basic
    { name: "Medical Allowance", code: "MED", calculation_type: "PERCENTAGE", default_value: 10, is_taxable: 0 }, // 10% of basic, tax-exempt
    { name: "Conveyance Allowance", code: "CONV", calculation_type: "FIXED", default_value: 8000, is_taxable: 1 },
    { name: "Utility Allowance", code: "UTIL", calculation_type: "FIXED", default_value: 5000, is_taxable: 1 },
    { name: "Mobile Allowance", code: "MOB", calculation_type: "FIXED", default_value: 2000, is_taxable: 1 },
    { name: "Fuel Allowance", code: "FUEL", calculation_type: "FIXED", default_value: 10000, is_taxable: 1 },
    { name: "Meal Allowance", code: "MEAL", calculation_type: "FIXED", default_value: 3000, is_taxable: 0 },
    { name: "Attendance Allowance", code: "ATT", calculation_type: "FIXED", default_value: 2500, is_taxable: 1 },
    { name: "Performance Allowance", code: "PERF", calculation_type: "PERCENTAGE", default_value: 5, is_taxable: 1 }, // 5% of basic
    { name: "Special Allowance", code: "SPEC", calculation_type: "FIXED", default_value: 4000, is_taxable: 1 },
  ];
  const allowanceTypes: Record<string, number> = {};
  for (const at of allowanceTypeSeeds) {
    const created = await createOrSkip(
      `allowance type '${at.name}'`,
      () => prisma.hrAllowanceTypes.findFirst({ where: { name: { equals: at.name, mode: "insensitive" } }, select: { id: true, name: true } }),
      () => createAllowanceType(at as any)
    );
    allowanceTypes[at.name] = created.id;
    log(`Allowance type: ${created.name} (id ${created.id})`);
  }
  log(`Allowance types ready: ${allowanceTypeSeeds.length} (mix of fixed and percentage-of-basic)`);

  // ─── 23. Salary Sheets (historical months — Nov & Dec 2025) ────────────
  // Deliberately NOT generating sheets for Jan/Feb 2026: `listEligibleStaff`
  // in payrollRun.service.ts only offers staff who *don't* already have a
  // sheet for the selected branch/month, so if every employee already had a
  // January sheet there'd be nothing left to run payroll against in the UI.
  // These two months instead give the Payroll Reports pages some real
  // history, while January/February stay open for testing Payroll Run.
  //
  // gross_salary and tax_amount are DELIBERATELY not passed here — passing
  // `allowances` instead makes createSalarySheet() derive both from the
  // allowance types + tax slabs seeded just above (see resolveAllowances(),
  // computeAutoGrossSalary() and resolveAutoTaxAmount() in
  // salary.service.ts), so every sheet's numbers are the app's own
  // calculation, not something typed in here to look right.
  section("Salary Sheets (historical)");
  const salarySheetMonths = [
    { month_id: "11", year_id: 2025, date: "2025-11-30" },
    { month_id: "12", year_id: 2025, date: "2025-12-31" },
  ];
  // Every employee gets House Rent + Medical + Conveyance (the old
  // three legacy allowances, now resolved dynamically); a rotating subset
  // also gets 1–2 of the remaining allowance types for real variety in
  // salary structures, per the brief's "different employees, different
  // salary structures" requirement.
  const allowanceCombinationCycle = [
    ["House Rent Allowance", "Medical Allowance", "Conveyance Allowance"],
    ["House Rent Allowance", "Medical Allowance", "Conveyance Allowance", "Utility Allowance"],
    ["House Rent Allowance", "Medical Allowance", "Conveyance Allowance", "Mobile Allowance", "Meal Allowance"],
    ["House Rent Allowance", "Medical Allowance", "Conveyance Allowance", "Fuel Allowance"],
    ["House Rent Allowance", "Medical Allowance", "Conveyance Allowance", "Attendance Allowance", "Performance Allowance"],
    ["House Rent Allowance", "Medical Allowance", "Conveyance Allowance", "Special Allowance"],
  ];
  for (const { month_id, year_id, date } of salarySheetMonths) {
    for (let i = 0; i < employees.length; i++) {
      const emp = needEmployee(employees, i);
      const branchId = need(branches, emp.branch, "branch");
      const basic = basicSalaryByEmployee[i] ?? 60000;
      const allowanceNames = allowanceCombinationCycle[i % allowanceCombinationCycle.length]!;

      await createOrSkip(
        `salary sheet for ${emp.name} (${month_id}/${year_id})`,
        () =>
          prisma.erpStaffSalaries.findFirst({
            where: { staff_id: emp.id, branch_id: branchId, month_id, year_id },
            select: { id: true },
          }),
        () =>
          createSalarySheet({
            staff_id: emp.id,
            branch_id: branchId,
            ledger_id: 1,
            financial_year: currentFiscalYearId,
            date,
            month_id,
            year_id,
            staff_category: "Permanent",
            bank_account: `PK${36 + i}TECH000${1000000000 + i * 111}`,
            basic_salary: basic,
            allowances: allowanceNames.map((name) => ({ allowance_type_id: need(allowanceTypes, name, "allowance type") })),
            eobi_amount: 2600,
            pay_status: "Yes",
            salary_status: "Paid",
          } as any)
      );
    }
  }
  log(`Salary sheets processed for ${employees.length} employees across ${salarySheetMonths.length} historical months (Nov–Dec 2025)`);
  log(`Gross salary and tax on every sheet were computed by createSalarySheet() itself from allowance types + tax slabs — nothing hardcoded.`);
  log(`January & February 2026 intentionally left with NO salary sheets — use those in Payroll Run to test generating them.`);

  // ─── 24. Biometric Device — Test Sync (mock device) ────────────────────
  // Exercises the exact code path a real ZKTeco terminal will hit —
  // biometricDevice.service.ts's uploadStaffToDevice/syncAttendanceFromDevice
  // — against a MockBiometricDeviceClient seeded with fake punches, instead
  // of real hardware. `deviceClientOverride` (see biometricDevice.service.ts)
  // is what makes that possible: it's only ever passed from here, so the
  // controller/API path (real ZKTeco terminals) is completely unaffected.
  //
  // Idempotent by construction rather than via createOrSkip:
  // syncAttendanceFromDevice only inserts a row when none exists yet for
  // that employee/day, and only ever updates timeOut on a type=1 (time-out)
  // punch — so re-running this section against an already-synced DB just
  // re-applies the same timeOut values and skips the inserts, with nothing
  // duplicated.
  section("Biometric Device — Test Sync (mock device)");
  const biometricBranchId = need(branches, "Lahore Campus", "branch");
  const biometricBranchDevice = await prisma.erpBranches.findFirst({
    where: { id: biometricBranchId },
    select: { ip: true, port: true },
  });
  const mockDevice = new MockBiometricDeviceClient(
    biometricBranchDevice?.ip ?? "192.168.10.101",
    biometricBranchDevice?.port ? parseInt(biometricBranchDevice.port, 10) : 4370
  );

  const uploadResult = await uploadStaffToDevice(biometricBranchId, mockDevice);
  log(`Mock staff upload: ${uploadResult.uploaded} of ${uploadResult.total} active Lahore Campus staff registered on the device.`);

  // Three employees, three different merge paths for syncAttendanceFromDevice:
  const empDeviceFreshDay = needEmployee(employees, 0); // Ahmed Raza Malik — brand-new day: punch in + punch out in one sync
  const empDeviceExistingRow = needEmployee(employees, 1); // Fatima Zahra Bibi — already has an "Absent" row (no timeIn/timeOut) for 2026-01-20 from section 10; the device now reports she badged out that day
  const empDeviceStillIn = needEmployee(employees, 6); // Imran Ali Butt — brand-new day, punched in but no punch out yet ("still at work")

  mockDevice.seedAttendanceLogs([
    { deviceUserId: String(empDeviceFreshDay.id), timestamp: new Date("2026-01-26T08:58:00"), type: ZKTECO_LOG_TYPE.TIME_IN },
    { deviceUserId: String(empDeviceFreshDay.id), timestamp: new Date("2026-01-26T17:02:00"), type: ZKTECO_LOG_TYPE.TIME_OUT },
    { deviceUserId: String(empDeviceExistingRow.id), timestamp: new Date("2026-01-20T17:10:00"), type: ZKTECO_LOG_TYPE.TIME_OUT },
    { deviceUserId: String(empDeviceStillIn.id), timestamp: new Date("2026-01-26T09:10:00"), type: ZKTECO_LOG_TYPE.TIME_IN },
  ]);

  const syncResult = await syncAttendanceFromDevice(biometricBranchId, undefined, mockDevice);
  log(`Mock attendance sync: ${syncResult.message}`);
  log(
    `  ${empDeviceFreshDay.name}: new Present row for 2026-01-26 (08:58 → 17:02)`
  );
  log(
    `  ${empDeviceExistingRow.name}: existing 2026-01-20 "Absent" row updated with timeOut 17:10`
  );
  log(
    `  ${empDeviceStillIn.name}: new row for 2026-01-26 with timeIn 09:10, still no timeOut`
  );

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Done. Summary:");
  console.log(`  Companies / Branches:  ${Object.keys(companies).length} companies, ${Object.keys(branches).length} branches`);
  console.log(`  Departments:           ${Object.keys(departments).length}`);
  console.log(`  Employees on record:   ${employeeSeeds.length}  (login password for all: ${DEFAULT_PASSWORD})`);
  console.log(`  Fiscal Years:          ${Object.keys(fiscalYears).length}`);
  console.log(`  Tax Slabs:             ${taxSlabSeeds.length} (FY 2025-2026, progressive)`);
  console.log(`  Allowance Types:       ${Object.keys(allowanceTypes).length} (mix of fixed / percentage-of-basic)`);
  console.log(`  Rows created this run: ${createdCount}`);
  console.log(`  Rows skipped (already existed): ${skippedCount}`);
  console.log("═══════════════════════════════════════════════════════════\n");
}

main()
  .catch((err) => {
    console.error("\n✗ Seeding failed:\n");
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });