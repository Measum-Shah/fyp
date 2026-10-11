import React, { useState, useEffect } from "react";
import { teacherService } from "../services/teacherService";
import { DataTable, type Column } from "../../../AcademicModule/components/common/DataTable";

const CommunicationPage: React.FC = () => {
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentMessage, setParentMessage] = useState("");
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await teacherService.getNotices();
      if (res.success) setNotices(res.data);
    } catch (error) {
      console.error("Failed to load notices", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await teacherService.createNotice({ title: announcementTitle, body: announcementBody });
      if (res.success) {
        alert("Announcement sent successfully!");
        setAnnouncementTitle("");
        setAnnouncementBody("");
        fetchNotices();
      }
    } catch (error) {
      alert("Failed to send announcement");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleParentMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await teacherService.messageParent({ email: parentEmail, message: parentMessage });
      if (res.success) {
        alert("Message sent to parent!");
        setParentEmail("");
        setParentMessage("");
      }
    } catch (error) {
      alert("Failed to send message");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<any>[] = [
    { key: "title", header: "Title", render: (r) => r.title || "—" },
    { key: "message", header: "Message", render: (r) => (r.message && r.message.length > 60 ? r.message.substring(0, 60) + "…" : r.message || "—") },
    { key: "status", header: "Status", render: (r) => (
      <span style={{
        display: "inline-block",
        padding: "0.2rem 0.6rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: r.status === 1 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
        color: r.status === 1 ? "#16a34a" : "#dc2626"
      }}>
        {r.status === 1 ? "Active" : "Inactive"}
      </span>
    )},
    { key: "created_at", header: "Date", render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString() : "—" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Communication &amp; Notices</h1>
      </div>

      {/* ── Past Announcements Table ────────────────────────────── */}
      <div className="panel-card">
        <div className="panel-card-header">
          <h3>Past Announcements</h3>
        </div>
        <div className="p-4">
          <DataTable columns={columns} data={notices} loading={loading} />
        </div>
      </div>

      {/* ── Two-column Forms Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── New Class Announcement ─────────────────────────────── */}
        <div className="panel-card">
          <div className="panel-card-header">
            <h3>New Class Announcement</h3>
          </div>
          <div className="p-5">
            <form onSubmit={handleAnnouncementSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="field-label" htmlFor="announcementTitle">Title</label>
                <div className="input-wrap">
                  <input
                    id="announcementTitle"
                    type="text"
                    className="field-input"
                    style={{ paddingLeft: "0.9rem" }}
                    placeholder="Enter announcement title…"
                    value={announcementTitle}
                    onChange={e => setAnnouncementTitle(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="field-label" htmlFor="announcementBody">Body</label>
                <div className="input-wrap">
                  <textarea
                    id="announcementBody"
                    className="field-input"
                    rows={5}
                    style={{ resize: "none", paddingLeft: "0.9rem" }}
                    placeholder="Write your announcement…"
                    value={announcementBody}
                    onChange={e => setAnnouncementBody(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Send Announcement"}
              </button>
            </form>
          </div>
        </div>

        {/* ── Message Parents ────────────────────────────────────── */}
        <div className="panel-card">
          <div className="panel-card-header">
            <h3>Message Parents</h3>
          </div>
          <div className="p-5">
            <form onSubmit={handleParentMessageSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="field-label" htmlFor="parentEmail">Parent Email</label>
                <div className="input-wrap">
                  <input
                    id="parentEmail"
                    type="email"
                    className="field-input"
                    style={{ paddingLeft: "0.9rem" }}
                    placeholder="parent@example.com"
                    value={parentEmail}
                    onChange={e => setParentEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="field-label" htmlFor="parentMessage">Message</label>
                <div className="input-wrap">
                  <textarea
                    id="parentMessage"
                    className="field-input"
                    rows={5}
                    style={{ resize: "none", paddingLeft: "0.9rem" }}
                    placeholder="Write your message to the parent…"
                    value={parentMessage}
                    onChange={e => setParentMessage(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
                style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", boxShadow: "0 4px 18px rgba(22,163,74,0.36)" }}
              >
                {submitting ? "Sending…" : "Send to Parent"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CommunicationPage;
