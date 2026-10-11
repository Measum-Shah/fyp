import { useState, useEffect } from "react";
import type { UserRole, InstitutionType } from "../types";

export interface RoleAccessState {
  role: UserRole;
  institutionType: InstitutionType;
  branchId: number | null;
  isAdmin: boolean;
  isFaculty: boolean;
  isStudent: boolean;
  setRole: (role: UserRole) => void;
  setInstitutionType: (type: InstitutionType) => void;
  setBranchId: (id: number | null) => void;
  getTermLabel: (singular: string, plural?: string) => string;
}

export function useRoleAccess(): RoleAccessState {
  const [role, setRoleState] = useState<UserRole>(() => {
    const storedUser = localStorage.getItem("erp_user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.user_type === "teacher" || u.user_type === "faculty" || u.user_type === "trainer" || u.user_type === "staff") return "faculty";
        if (u.user_type === "student" || u.user_type === "learner") return "student";
      } catch { /* fallback */ }
    }
    return (localStorage.getItem("erp_academic_role") as UserRole) || "admin";
  });

  const [institutionType, setInstitutionTypeState] = useState<InstitutionType>(() => {
    return (localStorage.getItem("erp_academic_inst_type") as InstitutionType) || "university";
  });

  const [branchId, setBranchIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem("erp_academic_branch_id");
    return saved ? Number(saved) : null;
  });

  // Listen for changes from other components
  useEffect(() => {
    const handleInstChange = () => {
      const saved = localStorage.getItem("erp_academic_inst_type");
      if (saved) setInstitutionTypeState(saved as InstitutionType);
    };
    const handleBranchChange = () => {
      const saved = localStorage.getItem("erp_academic_branch_id");
      setBranchIdState(saved ? Number(saved) : null);
    };
    window.addEventListener("institutionTypeChanged", handleInstChange);
    window.addEventListener("branchIdChanged", handleBranchChange);
    return () => {
      window.removeEventListener("institutionTypeChanged", handleInstChange);
      window.removeEventListener("branchIdChanged", handleBranchChange);
    };
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem("erp_academic_role", newRole);
  };

  const setInstitutionType = (newType: InstitutionType) => {
    setInstitutionTypeState(newType);
    localStorage.setItem("erp_academic_inst_type", newType);
    // Reset branch when institution changes
    setBranchIdState(null);
    localStorage.removeItem("erp_academic_branch_id");
    window.dispatchEvent(new Event("institutionTypeChanged"));
    window.dispatchEvent(new Event("branchIdChanged"));
  };

  const setBranchId = (id: number | null) => {
    setBranchIdState(id);
    if (id === null) {
      localStorage.removeItem("erp_academic_branch_id");
    } else {
      localStorage.setItem("erp_academic_branch_id", String(id));
    }
    window.dispatchEvent(new Event("branchIdChanged"));
  };

  const getTermLabel = (singular: string, plural?: string): string => {
    const isPlural = !!plural;
    switch (singular.toLowerCase()) {
      case "semester":
        if (institutionType === "school") return isPlural ? "Grade Terms" : "Grade Term";
        if (institutionType === "institute") return isPlural ? "Training Modules" : "Training Module";
        return isPlural ? "Semesters" : "Semester";
      case "grade":
      case "level":
        if (institutionType === "school") return isPlural ? "Grades" : "Grade";
        if (institutionType === "institute") return isPlural ? "Levels" : "Level";
        return isPlural ? "Years" : "Year";
      case "teacher":
      case "faculty":
        if (institutionType === "school") return isPlural ? "Teachers" : "Teacher";
        if (institutionType === "institute") return isPlural ? "Trainers" : "Trainer";
        return isPlural ? "Faculty" : "Faculty";
      case "student":
        if (institutionType === "institute") return isPlural ? "Learners" : "Learner";
        return isPlural ? "Students" : "Student";
      default:
        return isPlural ? plural || singular : singular;
    }
  };

  return {
    role,
    institutionType,
    branchId,
    isAdmin: role === "admin",
    isFaculty: role === "faculty",
    isStudent: role === "student",
    setRole,
    setInstitutionType,
    setBranchId,
    getTermLabel,
  };
}