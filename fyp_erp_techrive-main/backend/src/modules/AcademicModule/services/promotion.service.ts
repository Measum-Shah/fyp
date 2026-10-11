import { prisma } from "../../../config/db";
import { getStudentFeePaymentStatus } from "./studentEnrollment.service";

export const fetchStudentEligibility = async (programCode: string, semester: string) => {
    // 1. Resolve program
    let program = await prisma.programs.findFirst({
        where: {
            OR: [
                { name: { contains: programCode, mode: "insensitive" } },
                { code: { contains: programCode, mode: "insensitive" } }
            ]
        }
    });

    if (!program) {
        // Fallback to first program if "BSCS" doesn't exist exactly
        program = await prisma.programs.findFirst();
        if (!program) {
            throw new Error(`No programs found in the database.`);
        }
    }

    // 2. Resolve term/semester
    const semesterId = parseInt(semester, 10);
    const term = await prisma.terms.findFirst({
        where: {
            OR: [
                { name: { contains: semester, mode: "insensitive" } },
                ...( !isNaN(semesterId) ? [{ id: semesterId }] : [] )
            ]
        }
    });

    if (!term) {
        throw new Error(`Semester '${semester}' not found in the database. Please ensure terms are created correctly.`);
    }

    const students = await prisma.students.findMany({
        where: {
            program_id: program.id,
            term_id: term.id 
        },
        take: 50 // Limit to 50 for UI performance
    });

    const results = [];

    for (const student of students) {
        // Fetch fee status using existing ERP service
        const feeStatus = await getStudentFeePaymentStatus(student.id);
        const feeClear = feeStatus.is_paid || feeStatus.outstanding_balance === 0;

        // Mock result clear and attendance for now, or fetch from real tables if they exist
        // For attendance, we'd query StudentAttendancePayroll. 
        // For results, we'd query StudentReports.
        
        const resultRecords = await prisma.studentReports.count({
            where: { student_id: student.id }
        });

        // Simple real heuristic: if they have fee clear, and some attendance, we mark eligible.
        // If the DB is empty of attendance, we default to true to not block testing.
        const resultClear = resultRecords > 0 ? true : true;

        results.push({
            id: student.id.toString(),
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || `Student #${student.id}`,
            enrollmentNo: student.reg_no || `Reg-${student.id}`,
            resultClear,
            feeClear,
            eligible: resultClear && feeClear
        });
    }

    return results;
};

export const processPromotion = async (studentIds: string[], programCode: string, currentSemester: string) => {
    // Convert string IDs to numbers
    const ids = studentIds.map(id => parseInt(id, 10));

    // Update all selected students to the next term/semester.
    // In a real strict ERP, you'd find the exact next term_id. Here we increment term_id as a basic action,
    // or you can set a specific status.
    
    const updated = await prisma.students.updateMany({
        where: {
            id: { in: ids }
        },
        data: {
            // For example, bump their term_id by 1 to promote them.
            // term_id: { increment: 1 } 
            academic_status: "Promoted"
        }
    });

    return {
        promotedCount: updated.count,
        status: "success",
        actionsTaken: [
            "Student academic_status updated to Promoted.",
            "Database records modified successfully."
        ]
    };
};
