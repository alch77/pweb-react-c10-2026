import { useEffect, useState } from 'react';
import type { JobListing } from '../types';
import { fetchJobs } from '../services/jobService';
import type { JobSource } from '../services/jobService';

export function useJobs(source: JobSource) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchJobs(source, controller.signal)
      .then((data) => setJobs(data))
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setJobs([]);
        setError(e instanceof TypeError ? 'Gagal terhubung ke server (cek koneksi internet).' : e instanceof Error ? e.message : 'Terjadi kesalahan.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [source, attempt]);

  return { jobs, loading, error, retry: () => setAttempt((n) => n + 1) };
}
