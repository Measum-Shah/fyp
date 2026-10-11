import React, { useEffect, useState } from "react";
import { teacherService } from "../services/teacherService";
import { DataTable, type Column } from "../../../AcademicModule/components/common/DataTable";

const TimetablePage: React.FC = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSchedule = () => {
    setLoading(true);
    setError("");
    teacherService.getTimetable()
      .then(res => {
        if (res.success) {
          setSchedule(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(err => setError(err.response?.data?.message || "Unable to load timetable."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const columns: Column<any>[] = [
    { key: "day", header: "Day", render: (r) => r.day },
    { key: "time", header: "Time", render: (r) => r.start_time && r.end_time ? `${new Date(r.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(r.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : r.time_slot },
    { key: "subject", header: "Subject", render: (r) => r.subject },
    { key: "room", header: "Room", render: (r) => r.room },
    { key: "section", header: "Section", render: (r) => r.section },
  ];

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <h3>My Timetable</h3>
        <button type="button" onClick={loadSchedule} className="teacher-attendance-save">Refresh</button>
      </div>
      {error && <div className="teacher-attendance-message error">{error}</div>}
      <div className="p-4">
        <DataTable columns={columns} data={schedule} loading={loading} />
      </div>
    </div>
  );
};

export default TimetablePage;
