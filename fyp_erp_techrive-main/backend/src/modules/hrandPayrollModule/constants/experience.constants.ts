// ─── Staff Experience Constants ──────────────────────────────────────────────
// Table: staff_experiences — prior work history per employee. staff_bi_id
// (nullable, references staff_basic_information which is out of scope) is
// left null on every record, same treatment as elsewhere in this module.

export const EXPERIENCE_NAME_MAX_LENGTH = 50;
export const EXPERIENCE_DESIGNATION_MAX_LENGTH = 50;
