import { useState, useEffect } from "react";
import { StudentAPI } from "../services/api";

export function useStudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    StudentAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useStudentCourses() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    StudentAPI.getCourses()
      .then(res => setData(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
