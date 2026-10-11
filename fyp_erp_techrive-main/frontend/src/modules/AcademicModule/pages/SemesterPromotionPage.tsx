import React, { useState } from 'react';
import { toast } from './AcademicLayout';

import API from '../../../api/api';

interface Student {
  id: string;
  name: string;
  enrollmentNo: string;
  resultClear: boolean;
  feeClear: boolean;
  eligible: boolean;
}

// Icons
const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--success, #10b981)' }}>
    <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" clipRule="evenodd" />
  </svg>
);

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--error, #ef4444)' }}>
    <path fillRule="evenodd" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" clipRule="evenodd" />
  </svg>
);

const SemesterPromotionPage: React.FC = () => {
  const [selectedProgram, setSelectedProgram] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch data based on selection
  const fetchEligibility = async () => {
    if (!selectedProgram || !currentSemester) {
      toast.warning('Validation Error', 'Please select Program and Current Semester');
      return;
    }
    
    setLoading(true);
    try {
      const response = await API.get('/academic/promotion/eligibility', {
        params: { program: selectedProgram, semester: currentSemester }
      });
      const data = response.data.data;
      setStudents(data);
      
      const eligibleIds = data.filter((s: Student) => s.eligible).map((s: Student) => s.id);
      setSelectedStudents(new Set(eligibleIds));
      toast.success('Success', 'Student eligibility list generated successfully.');
    } catch (error: any) {
      toast.error('Error', error?.response?.data?.message || 'Failed to fetch student eligibility.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (id: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStudents(newSelected);
  };

  const handlePromote = async () => {
    if (selectedStudents.size === 0) {
      toast.warning('Action Required', 'No students selected for promotion.');
      return;
    }

    if (!window.confirm(`Are you sure you want to promote ${selectedStudents.size} student(s) to the next semester?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await API.post('/academic/promotion/promote', {
        studentIds: Array.from(selectedStudents),
        program: selectedProgram,
        currentSemester: currentSemester
      });
      
      toast.success('Promoted', `${selectedStudents.size} students promoted successfully.`);
      setStudents(prev => prev.filter(s => !selectedStudents.has(s.id)));
      setSelectedStudents(new Set());
    } catch (error) {
      toast.error('Error', 'Failed to promote students.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Semester Promotion</h1>
        <p style={{ color: 'var(--text-dark-sub)', fontSize: '0.95rem' }}>
          Semi-automated bulk promotion for students to the next semester
        </p>
      </header>

      <section className="panel-card" style={{ padding: '2rem', background: 'var(--card-bg)', borderRadius: 'var(--radius-card)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-card)' }}>
        
        {/* Selection Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1.5rem', alignItems: 'end', marginBottom: '2.5rem' }}>
          <div className="field-group">
            <label className="field-label">Class/Program</label>
            <select 
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="field-input"
            >
              <option value="">-- Select Program --</option>
              <option value="BSCS">BS Computer Science</option>
              <option value="BBA">BBA</option>
              <option value="BSSE">BS Software Engineering</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Current Semester</label>
            <select
              value={currentSemester}
              onChange={(e) => setCurrentSemester(e.target.value)}
              className="field-input"
            >
              <option value="">-- Select Semester --</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
          </div>
          <div>
            <button 
              onClick={fetchEligibility}
              disabled={loading}
              className="submit-btn"
              style={{ padding: '0.78rem 1.5rem', margin: 0, minWidth: '160px' }}
            >
              {loading ? (
                <div className="spinner-wrap">
                  <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
                  Checking...
                </div>
              ) : 'Check Eligibility'}
            </button>
          </div>
        </div>

        {/* Results Area */}
        {students.length > 0 && (
          <div style={{ animation: 'fadeSlide 0.4s ease' }}>
            <div className="panel-card-header" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--divider-color)' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-dark)' }}>Eligibility Validation List</h3>
            </div>
            
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'var(--input-bg)' }}>
                  <tr>
                    <th style={{ padding: '1rem', width: '60px', borderBottom: '1px solid var(--card-border)' }}>
                      <input 
                        type="checkbox"
                        checked={selectedStudents.size === students.length && students.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents(new Set(students.map(s => s.id)));
                          } else {
                            setSelectedStudents(new Set());
                          }
                        }}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                      />
                    </th>
                    <th style={{ padding: '1rem', color: 'var(--text-dark-sub)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid var(--card-border)' }}>Student Info</th>
                    <th style={{ padding: '1rem', width: '20%', color: 'var(--text-dark-sub)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid var(--card-border)' }}>Result Clear?</th>
                    <th style={{ padding: '1rem', width: '20%', color: 'var(--text-dark-sub)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid var(--card-border)' }}>Fee Clear?</th>
                    <th style={{ padding: '1rem', width: '20%', color: 'var(--text-dark-sub)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid var(--card-border)' }}>System Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} style={{ borderBottom: '1px solid var(--divider-color)', background: 'var(--card-bg)' }}>
                      <td style={{ padding: '1rem', width: '60px' }}>
                        <input 
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={() => handleCheckboxChange(student.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                        />
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.2rem' }}>{student.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.enrollmentNo}</div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          {student.resultClear ? <IconCheck /> : <IconX />}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          {student.feeClear ? <IconCheck /> : <IconX />}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        {student.eligible ? (
                          <span style={{ display: 'inline-block', padding: '0.35rem 0.75rem', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>Eligible</span>
                        ) : (
                          <span style={{ display: 'inline-block', padding: '0.35rem 0.75rem', background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error-border)', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>Ineligible</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', padding: '1.5rem', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-input)' }}>
              <div>
                <span style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '1.1rem' }}>{selectedStudents.size}</span> 
                <span style={{ color: 'var(--text-dark-sub)', marginLeft: '0.5rem' }}>students selected for promotion</span>
              </div>
              <button 
                onClick={handlePromote}
                disabled={isProcessing || selectedStudents.size === 0}
                className="submit-btn"
                style={{ margin: 0, padding: '0.85rem 2rem', background: 'linear-gradient(135deg, var(--success) 0%, #10b981 100%)', boxShadow: '0 4px 18px rgba(16, 185, 129, 0.3)' }}
              >
                {isProcessing ? (
                  <div className="spinner-wrap">
                    <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                    Processing...
                  </div>
                ) : 'Promote to Next Semester'}
              </button>
            </div>
            
            <div className="alert alert-info" style={{ marginTop: '1.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Background Operations</strong>
                Upon clicking promote, the system will automatically change the current semester, assign next semester's curriculum to the student portals, and generate new fee challans.
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default SemesterPromotionPage;
