import React, { useEffect, useState } from "react";
import { resolveStudentImageUrl } from "../utils/resolveStudentImageUrl";
import "./FeeStudentPhoto.css";

type FeeStudentPhotoProps = {
  /** Existing students.student_image public path from Fee dashboard/workspace */
  studentImage?: string | null;
  alt?: string;
};

/**
 * Passport-size display of the already-saved Student Enrollment photo.
 * Display-only — does not upload or modify images.
 */
export const FeeStudentPhoto: React.FC<FeeStudentPhotoProps> = ({
  studentImage,
  alt = "Student passport photo",
}) => {
  const url = resolveStudentImageUrl(studentImage);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url || failed) {
    return (
      <div className="fee-student-photo fee-student-photo--placeholder" aria-hidden="true">
        No photo
      </div>
    );
  }

  return (
    <img
      className="fee-student-photo"
      src={url}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
};

export default FeeStudentPhoto;
