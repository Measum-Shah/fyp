import { Request, Response } from "express";
import * as payrollReportService from "../services/payrollReport.service";
import {
  GrossSalaryQuery,
  LoanRegisterQuery,
  PayrollRunSummaryQuery,
  SalaryRegisterQuery,
  SalarySlipsQuery,
} from "../validators/payrollReport.validator";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /reports/payroll-run-summary ───────────────────────────────────────
export const getPayrollRunSummaryReport = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as PayrollRunSummaryQuery;
    const result = await payrollReportService.getPayrollRunSummaryReport(query);

    return res.status(200).json({
      message: "Payroll run summary report generated successfully",
      data: result.data,
      meta: { totalRuns: result.totalRuns },
    });
  } catch (error) {
    return handleError(res, error, "GetPayrollRunSummaryReport error:");
  }
};

// ─── GET /reports/salary-register ───────────────────────────────────────────
export const getSalaryRegisterReport = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as SalaryRegisterQuery;
    const result = await payrollReportService.getSalaryRegisterReport(query);

    return res.status(200).json({
      message: "Salary register report generated successfully",
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    });
  } catch (error) {
    return handleError(res, error, "GetSalaryRegisterReport error:");
  }
};

// ─── GET /reports/loan-register ─────────────────────────────────────────────
export const getLoanRegisterReport = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as LoanRegisterQuery;
    const result = await payrollReportService.getLoanRegisterReport(query);

    return res.status(200).json({
      message: "Loan register report generated successfully",
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    });
  } catch (error) {
    return handleError(res, error, "GetLoanRegisterReport error:");
  }
};

// ─── GET /reports/gross-salary ───────────────────────────────────────────────
export const getGrossSalaryReport = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as GrossSalaryQuery;
    const result = await payrollReportService.getGrossSalaryReport(query);

    return res.status(200).json({
      message: "Gross salary report generated successfully",
      data: result.data,
      meta: {
        employeeCount: result.employeeCount,
        totalGross: result.totalGross,
        totalNet: result.totalNet,
        totalAllowances: result.totalAllowances,
        totalDeductions: result.totalDeductions,
        month_id: result.month_id,
        year_id: result.year_id,
        allowanceColumns: result.allowanceColumns,
        deductionColumns: result.deductionColumns,
        payrollDeductionColumns: result.payrollDeductionColumns,
      },
    });
  } catch (error) {
    return handleError(res, error, "GetGrossSalaryReport error:");
  }
};

// ─── GET /reports/salary-slips ───────────────────────────────────────────────
export const getSalarySlips = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as SalarySlipsQuery;
    const result = await payrollReportService.getSalarySlips(query);

    return res.status(200).json({
      message: "Salary slips generated successfully",
      data: result.data,
      meta: { total: result.total },
    });
  } catch (error) {
    return handleError(res, error, "GetSalarySlips error:");
  }
};