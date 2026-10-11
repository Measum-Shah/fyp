import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "./AcademicLayout";

const API_BASE = "http://localhost:5000/api";

const AlumniDirectoryPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState<any[]>([]);

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("erp_token");
      const res = await axios.get(`${API_BASE}/academic/alumni/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAlumni(res.data.data);
      }
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-page-container">
      <header className="erp-page-header">
        <div className="erp-page-header-text">
          <h1>Alumni Directory</h1>
          <p>List of all graduated students</p>
        </div>
      </header>

      <div className="erp-card">
        {loading ? (
          <p>Loading alumni directory...</p>
        ) : alumni.length === 0 ? (
          <p>No alumni found.</p>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Registration No.</th>
                <th>Email</th>
                <th>Program ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {alumni.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.reg_no || "-"}</td>
                  <td>{student.mt_email || "-"}</td>
                  <td>{student.program_id || "-"}</td>
                  <td><span className="erp-badge erp-badge-success">{student.admission_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AlumniDirectoryPage;
