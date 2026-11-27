import { useEffect, useState } from 'react';
import type { JobListing } from '../types';
import { fetchJobs } from '../services/jobService';
import type { JobSource } from '../services/jobService';

interface JobsState {
  jobs: JobListing[];
  loading: boolean;
  error: string | null;
  key: string;
}

export function useJobs(source: JobSource) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${source}:${attempt}`;
  const [state, setState] = useState<JobsState>({
    jobs: [],
    loading: true,
    error: null,
    key: requestKey,
  });

  useEffect(() => {
    const controller = new AbortController();
    fetchJobs(source, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ jobs: data, loading: false, error: null, key: requestKey });
        }
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        const msg =
          e instanceof TypeError
            ? 'Gagal terhubung ke server (cek koneksi internet).'
            : e instanceof Error
              ? e.message
              : 'Terjadi kesalahan.';
        setState({ jobs: [], loading: false, error: msg, key: requestKey });
      });
    return () => controller.abort();
  }, [source, requestKey]);

  const loading = state.loading || state.key !== requestKey;

  return {
    jobs: state.key === requestKey ? state.jobs : [],
    loading,
    error: state.key === requestKey ? state.error : null,
    retry: () => setAttempt((n) => n + 1),
  };
}
