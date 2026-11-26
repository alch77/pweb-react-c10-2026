import { useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import type { WorkMode } from '../types';
import { splitSkills } from '../utils/application';
import type { NewApplicationInput } from '../utils/application';

type Field = 'company' | 'role' | 'skills' | 'cvVersion' | 'appliedDate';
interface Props { onSubmit: (input: NewApplicationInput) => string | null; onClose: () => void }

export function ApplicationForm({ onSubmit, onClose }: Props) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('Remote');
  const [status, setStatus] = useState<'WISHLIST' | 'APPLIED'>('WISHLIST');
  const [skills, setSkills] = useState('');
  const [cvVersion, setCv] = useState('');
  const [appliedDate, setDate] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const refs: Record<Field, RefObject<HTMLInputElement | null>> = {
    company: useRef<HTMLInputElement>(null),
    role: useRef<HTMLInputElement>(null),
    skills: useRef<HTMLInputElement>(null),
    cvVersion: useRef<HTMLInputElement>(null),
    appliedDate: useRef<HTMLInputElement>(null),
  };
  const ORDER: Field[] = ['company', 'role', 'skills', 'cvVersion', 'appliedDate'];

  const fail = (errs: Partial<Record<Field, string>>) => {
    setErrors(errs);
    const first = ORDER.find((f) => errs[f]);
    if (first) refs[first].current?.focus(); // auto-focus input error pertama
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<Field, string>> = {};
    if (!company.trim()) errs.company = 'Perusahaan wajib diisi.';
    if (!role.trim()) errs.role = 'Role wajib diisi.';
    if (splitSkills(skills).length === 0) errs.skills = 'Isi minimal 1 skill (pisahkan dengan koma).';
    if (status === 'APPLIED') {
      if (!cvVersion.trim()) errs.cvVersion = 'Versi CV wajib diisi.';
      if (!appliedDate) errs.appliedDate = 'Tanggal lamaran wajib diisi.';
    }
    if (Object.keys(errs).length > 0) return fail(errs);

    const dupErr = onSubmit({ company, role, workMode, status, requiredSkills: splitSkills(skills), cvVersion, appliedDate, source: 'manual' });
    if (dupErr) return fail({ company: dupErr });
    onClose();
  };

  const Err = ({ f }: { f: Field }) => (errors[f] ? <p className="err">{errors[f]}</p> : null);

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
        <h3>Catat Lamaran</h3>
        <label>Perusahaan<input ref={refs.company} value={company} onChange={(e) => setCompany(e.target.value)} /></label><Err f="company" />
        <label>Posisi / Role<input ref={refs.role} value={role} onChange={(e) => setRole(e.target.value)} /></label><Err f="role" />
        <label>Mode Kerja
          <select value={workMode} onChange={(e) => setWorkMode(e.target.value as WorkMode)}>
            <option>Remote</option><option>Hybrid</option><option>Onsite</option>
          </select>
        </label>
        <label>Status Awal
          <select value={status} onChange={(e) => setStatus(e.target.value as 'WISHLIST' | 'APPLIED')}>
            <option value="WISHLIST">WISHLIST</option><option value="APPLIED">APPLIED</option>
          </select>
        </label>
        <label>Required Skills (pisahkan koma)<input ref={refs.skills} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, CSS" /></label><Err f="skills" />
        {status === 'APPLIED' && (
          <>
            <label>Versi CV<input ref={refs.cvVersion} value={cvVersion} onChange={(e) => setCv(e.target.value)} placeholder="Kapten-CV-v2.pdf" /></label><Err f="cvVersion" />
            <label>Tanggal Melamar<input ref={refs.appliedDate} type="date" value={appliedDate} onChange={(e) => setDate(e.target.value)} /></label><Err f="appliedDate" />
          </>
        )}
        <div className="row end">
          <button type="button" className="btn" onClick={onClose}>Batal</button>
          <button className="btn primary">Simpan</button>
        </div>
      </form>
    </div>
  );
}
