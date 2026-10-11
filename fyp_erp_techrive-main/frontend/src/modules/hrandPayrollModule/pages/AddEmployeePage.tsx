import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeDashboardLayout from "../layout/EmployeeDashboardLayout";
import type { EmployeeSectionNavTab } from "../components/EmployeeSectionNav";
import EmployeeForm from "../components/EmployeeForm";
import type { EmployeeFormSection } from "../components/EmployeeForm";
import EmployeeFormActionsBar from "../components/EmployeeFormActionsBar";
import StaffQualificationsDraftPanel, {
  type DraftStaffQualification,
} from "../components/StaffQualificationsDraftPanel";
import StaffAssetsDraftPanel, { type DraftStaffAsset } from "../components/StaffAssetsDraftPanel";
import ExperienceDraftPanel, { type DraftExperience } from "../components/ExperienceDraftPanel";
import FamilyDraftPanel, { type DraftFamily } from "../components/FamilyDraftPanel";
import EmergencyContactDraftPanel, {
  type DraftEmergencyContact,
} from "../components/EmergencyContactDraftPanel";
import PerformanceDraftPanel, { type DraftPerformance } from "../components/PerformanceDraftPanel";
import Toast from "../components/Toast";
import { useLookups } from "../hooks/useLookups";
import { useCompanies } from "../hooks/useCompanies";
import { useNotification } from "../hooks/useNotification";
import {
  employeeAPI,
  getApiErrorMessage,
  getApiFieldErrors,
  resolveEmployeeFileUrl,
} from "../services/employee.service";
import { toCreatePayload } from "../services/employee.validation";
import { staffQualificationAPI } from "../services/staffQualification.service";
import { toCreatePayload as toQualificationCreatePayload } from "../services/staffQualification.validation";
import type { StaffQualificationFormValues } from "../services/staffQualification.types";
import { staffAssetAPI } from "../services/staffAsset.service";
import { toCreatePayload as toAssetCreatePayload } from "../services/staffAsset.validation";
import type { StaffAssetFormValues } from "../services/staffAsset.types";
import { experienceAPI } from "../services/experience.service";
import { toCreatePayload as toExperienceCreatePayload } from "../services/experience.validation";
import type { ExperienceFormValues } from "../services/experience.types";
import { familyAPI } from "../services/family.service";
import { toCreatePayload as toFamilyCreatePayload } from "../services/family.validation";
import type { FamilyFormValues } from "../services/family.types";
import { emergencyContactAPI } from "../services/emergencyContact.service";
import { toCreatePayload as toEmergencyContactCreatePayload } from "../services/emergencyContact.validation";
import type { EmergencyContactFormValues } from "../services/emergencyContact.types";
import { performanceAPI } from "../services/performance.service";
import { toCreatePayload as toPerformanceCreatePayload } from "../services/performance.validation";
import type { PerformanceFormValues } from "../services/performance.types";
import type { EmployeeFormValues } from "../services/employee.types";
import "./employee-module.css";

// Local-only id generator for draft rows (never sent to the API).
let draftKeySeq = 0;
const nextDraftKey = () => `draft-${Date.now()}-${draftKeySeq++}`;

const FORM_ID = "add-employee-form";

// ─── Tab configuration ────────────────────────────────────────────────────────
// Identical shape/order to EmployeeProfilePage's TABS list — Experience,
// Family, Emergency Contacts and Performance are captured here too (as
// drafts, since there's no employee id yet — see the *DraftPanel components
// and handleSubmit below), so the same EmployeeSectionNav reads consistently
// across Add / View / Edit and every record type is entered in one place:
// the employee's own profile, never a separate standalone page.
type AddTab =
  | EmployeeFormSection
  | "experience" | "family" | "emergency" | "performance"
  | "qualifications" | "assets";

const TABS: EmployeeSectionNavTab[] = [
  { key: "basic", label: "Basic Information" },
  { key: "personal", label: "Personal Details" },
  { key: "contact", label: "Contact Info" },
  { key: "employment", label: "Employment Info" },
  { key: "professional", label: "Professional Profile" },
  { key: "experience", label: "Experience" },
  { key: "family", label: "Family Members" },
  { key: "emergency", label: "Emergency Contacts" },
  { key: "performance", label: "Performance Reviews" },
  { key: "qualifications", label: "Qualifications" },
  { key: "assets", label: "Assets" },
  { key: "salary", label: "Salary" },
];

const AddEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const lookups = useLookups();
  // Same Companies lookup the Branch form uses — reused, not duplicated,
  // for the Employment Details "School" dropdown (labelled "School" for
  // employees; same underlying Company data).
  const { companies } = useCompanies();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [activeTab, setActiveTab] = useState<AddTab>("basic");
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  // ── Wizard step order ────────────────────────────────────────────────────
  // Add Employee is a step-by-step wizard, walked in the same order as the
  // tabs above: Basic Information → … → Salary. `EmployeeForm` already keeps
  // every field's value in state regardless of which section is visible, so
  // moving between steps here never loses data already entered — it only
  // changes which section is rendered.
  const stepKeys = TABS.map((tab) => tab.key) as AddTab[];
  const currentStepIndex = stepKeys.indexOf(activeTab);
  const isFirstStep = currentStepIndex <= 0;
  const isLastStep = currentStepIndex === stepKeys.length - 1; // "salary"

  const goToNextStep = () => {
    if (currentStepIndex < stepKeys.length - 1) {
      setActiveTab(stepKeys[currentStepIndex + 1]);
    }
  };
  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setActiveTab(stepKeys[currentStepIndex - 1]);
    }
  };

  // Profile picture — there's no employee id yet to attach it to, so the
  // file is uploaded immediately (same /employees/upload-profile-image
  // endpoint the Edit Employee page uses to obtain a `staff_image` path)
  // and just staged here. The preview renders straight away from that same
  // path via resolveEmployeeFileUrl, and the path is merged into the
  // create payload on submit so it ends up attached to the new employee.
  const [staffImage, setStaffImage] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handleAvatarSelect = async (file: File) => {
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const uploadRes = await employeeAPI.uploadProfileImage(file);
      setStaffImage(uploadRes.data.staff_image);
    } catch (err) {
      const message = getApiErrorMessage(err);
      setAvatarError(message);
      notifyError(message);
    } finally {
      setAvatarUploading(false);
    }
  };

  // Qualifications / Assets / Experience / Family / Emergency Contacts /
  // Performance Reviews picked while filling out the "Add Employee" form.
  // There's no employee id yet, so these are kept client-side and only
  // posted to the API once the employee has actually been created.
  const [qualificationDrafts, setQualificationDrafts] = useState<DraftStaffQualification[]>([]);
  const [assetDrafts, setAssetDrafts] = useState<DraftStaffAsset[]>([]);
  const [experienceDrafts, setExperienceDrafts] = useState<DraftExperience[]>([]);
  const [familyDrafts, setFamilyDrafts] = useState<DraftFamily[]>([]);
  const [emergencyContactDrafts, setEmergencyContactDrafts] = useState<DraftEmergencyContact[]>([]);
  const [performanceDrafts, setPerformanceDrafts] = useState<DraftPerformance[]>([]);

  const addQualificationDraft = (values: StaffQualificationFormValues) =>
    setQualificationDrafts((prev) => [...prev, { ...values, _key: nextDraftKey() }]);
  const updateQualificationDraft = (key: string, values: StaffQualificationFormValues) =>
    setQualificationDrafts((prev) => prev.map((d) => (d._key === key ? { ...values, _key: key } : d)));
  const removeQualificationDraft = (key: string) =>
    setQualificationDrafts((prev) => prev.filter((d) => d._key !== key));

  const addAssetDraft = (values: StaffAssetFormValues) =>
    setAssetDrafts((prev) => [...prev, { ...values, _key: nextDraftKey() }]);
  const updateAssetDraft = (key: string, values: StaffAssetFormValues) =>
    setAssetDrafts((prev) => prev.map((d) => (d._key === key ? { ...values, _key: key } : d)));
  const removeAssetDraft = (key: string) =>
    setAssetDrafts((prev) => prev.filter((d) => d._key !== key));

  const addExperienceDraft = (values: ExperienceFormValues) =>
    setExperienceDrafts((prev) => [...prev, { ...values, _key: nextDraftKey() }]);
  const updateExperienceDraft = (key: string, values: ExperienceFormValues) =>
    setExperienceDrafts((prev) => prev.map((d) => (d._key === key ? { ...values, _key: key } : d)));
  const removeExperienceDraft = (key: string) =>
    setExperienceDrafts((prev) => prev.filter((d) => d._key !== key));

  const addFamilyDraft = (values: FamilyFormValues) =>
    setFamilyDrafts((prev) => [...prev, { ...values, _key: nextDraftKey() }]);
  const updateFamilyDraft = (key: string, values: FamilyFormValues) =>
    setFamilyDrafts((prev) => prev.map((d) => (d._key === key ? { ...values, _key: key } : d)));
  const removeFamilyDraft = (key: string) =>
    setFamilyDrafts((prev) => prev.filter((d) => d._key !== key));

  const addEmergencyContactDraft = (values: EmergencyContactFormValues) =>
    setEmergencyContactDrafts((prev) => [...prev, { ...values, _key: nextDraftKey() }]);
  const updateEmergencyContactDraft = (key: string, values: EmergencyContactFormValues) =>
    setEmergencyContactDrafts((prev) => prev.map((d) => (d._key === key ? { ...values, _key: key } : d)));
  const removeEmergencyContactDraft = (key: string) =>
    setEmergencyContactDrafts((prev) => prev.filter((d) => d._key !== key));

  const addPerformanceDraft = (values: PerformanceFormValues) =>
    setPerformanceDrafts((prev) => [...prev, { ...values, _key: nextDraftKey() }]);
  const updatePerformanceDraft = (key: string, values: PerformanceFormValues) =>
    setPerformanceDrafts((prev) => prev.map((d) => (d._key === key ? { ...values, _key: key } : d)));
  const removePerformanceDraft = (key: string) =>
    setPerformanceDrafts((prev) => prev.filter((d) => d._key !== key));

  const handleSubmit = async (values: EmployeeFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      // Carry over the picture staged from the profile card above — it was
      // uploaded already (see handleAvatarSelect), `values` itself never
      // holds it since the picture lives outside the tabbed form sections.
      const payload = toCreatePayload({ ...values, staff_image: staffImage || values.staff_image });
      const res = await employeeAPI.create(payload);
      const newEmployeeId = res.data.id;

      // Employee is created — now save any qualifications/assets/experience/
      // family/emergency contacts/performance reviews that were staged
      // above. These are best-effort: a failure here shouldn't make it look
      // like the employee itself failed to save. Experience, Family,
      // Emergency Contacts and Performance all carry their own `staff_id`
      // (locked to a placeholder "0" while there was no employee id yet —
      // see the *DraftPanel components), so it's overridden here with the
      // real id before building each create payload.
      const results = await Promise.allSettled([
        ...qualificationDrafts.map((draft) =>
          staffQualificationAPI.create(toQualificationCreatePayload(newEmployeeId, draft))
        ),
        ...assetDrafts.map((draft) => staffAssetAPI.create(toAssetCreatePayload(newEmployeeId, draft))),
        ...experienceDrafts.map((draft) =>
          experienceAPI.create(toExperienceCreatePayload({ ...draft, staff_id: String(newEmployeeId) }))
        ),
        ...familyDrafts.map((draft) =>
          familyAPI.create(toFamilyCreatePayload({ ...draft, staff_id: String(newEmployeeId) }))
        ),
        ...emergencyContactDrafts.map((draft) =>
          emergencyContactAPI.create(
            toEmergencyContactCreatePayload({ ...draft, staff_id: String(newEmployeeId) })
          )
        ),
        ...performanceDrafts.map((draft) =>
          performanceAPI.create(toPerformanceCreatePayload({ ...draft, staff_id: String(newEmployeeId) }))
        ),
      ]);
      const failedCount = results.filter((r) => r.status === "rejected").length;

      if (failedCount > 0) {
        notifyError(
          `Employee was added, but ${failedCount} related record(s) couldn't be saved. You can add them from the employee's profile.`
        );
      } else {
        notifySuccess(`${res.data.first_name ?? "Employee"} was added successfully.`);
      }

      navigate(`/hr/employees/${newEmployeeId}`);
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      if (fieldErrors) setServerErrors(fieldErrors);
      notifyError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <EmployeeDashboardLayout
        breadcrumbCurrent="Add Employee"
        title="Add Employee"
        profile={{
          placeholder: true,
          name: "New Employee",
          imageUrl: resolveEmployeeFileUrl(staffImage),
          onAvatarSelect: handleAvatarSelect,
          avatarUploading,
          avatarError,
        }}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as AddTab)}
      >
        {/* EmployeeForm stays mounted across every tab switch (fields keep
            their values) — it only renders markup for the section matching
            `activeSection`, so it renders nothing while a non-form tab
            (Experience/Family/Emergency/Performance/Qualifications/Assets)
            is active without needing to be unmounted or hidden via CSS. */}
        <EmployeeForm
          formId={FORM_ID}
          mode="create"
          lookups={{ ...lookups, companies }}
          submitting={submitting}
          serverErrors={serverErrors}
          activeSection={activeTab}
          onSubmit={handleSubmit}
          onValidationError={(section) => setActiveTab(section)}
        />

        {activeTab === "experience" && (
          <ExperienceDraftPanel
            items={experienceDrafts}
            onAdd={addExperienceDraft}
            onUpdate={updateExperienceDraft}
            onRemove={removeExperienceDraft}
          />
        )}

        {activeTab === "family" && (
          <FamilyDraftPanel
            items={familyDrafts}
            onAdd={addFamilyDraft}
            onUpdate={updateFamilyDraft}
            onRemove={removeFamilyDraft}
          />
        )}

        {activeTab === "emergency" && (
          <EmergencyContactDraftPanel
            items={emergencyContactDrafts}
            onAdd={addEmergencyContactDraft}
            onUpdate={updateEmergencyContactDraft}
            onRemove={removeEmergencyContactDraft}
          />
        )}

        {activeTab === "performance" && (
          <PerformanceDraftPanel
            items={performanceDrafts}
            onAdd={addPerformanceDraft}
            onUpdate={updatePerformanceDraft}
            onRemove={removePerformanceDraft}
          />
        )}

        {activeTab === "qualifications" && (
          <StaffQualificationsDraftPanel
            items={qualificationDrafts}
            onAdd={addQualificationDraft}
            onUpdate={updateQualificationDraft}
            onRemove={removeQualificationDraft}
          />
        )}

        {activeTab === "assets" && (
          <StaffAssetsDraftPanel
            items={assetDrafts}
            onAdd={addAssetDraft}
            onUpdate={updateAssetDraft}
            onRemove={removeAssetDraft}
          />
        )}

        {/* Reachable from every tab — including Experience/Family/
            Emergency/Performance/Qualifications/Assets — because it
            submits `#add-employee-form` via the HTML `form`
            attribute rather than needing to be a descendant of it.
            Wizard behaviour: every step shows "Next" (plus "Previous" once
            there's a step to go back to) except the final "Salary" step,
            where "Next" is replaced by "Create Employee" — the only button
            that actually submits the form and creates the employee. */}
        <EmployeeFormActionsBar
          formId={FORM_ID}
          submitting={submitting}
          submitLabel="Create Employee"
          onCancel={() => navigate("/hr/employees")}
          onPrevious={isFirstStep ? undefined : goToPreviousStep}
          isFinalStep={isLastStep}
          onNext={goToNextStep}
        />
      </EmployeeDashboardLayout>

      <Toast notifications={notifications} onDismiss={dismiss} />
    </>
  );
};

export default AddEmployeePage;