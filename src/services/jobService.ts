import type { JobListing } from '../types';

export type JobSource = 'live' | 'local';
const LIVE_URL = 'https://remotive.com/api/remote-jobs?category=software-dev&limit=30';
const LOCAL_URL = '/magang-fallback.json';

export async function fetchJobs(source: JobSource, signal: AbortSignal): Promise<JobListing[]> {
  const res = await fetch(source === 'live' ? LIVE_URL : LOCAL_URL, { signal });
  if (!res.ok) throw new Error(`Server mengembalikan error (${res.status}).`);
  const data: unknown = await res.json();
  const list = Array.isArray(data) ? data : (data as { jobs?: unknown }).jobs;
  if (!Array.isArray(list)) throw new Error('Format data tidak valid.');
  return (list as JobListing[]).map((j) => ({ ...j, tags: j.tags ?? [] }));
}
