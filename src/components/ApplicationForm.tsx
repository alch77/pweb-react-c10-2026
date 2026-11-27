import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
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

  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const skillsRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fail = (errs: Partial<Record<Field, string>>) => {
    setErrors(errs);
    if (errs.company) companyRef.current?.focus();
    else if (errs.role) roleRef.current?.focus();
    else if (errs.skills) skillsRef.current?.focus();
    else if (errs.cvVersion) cvRef.current?.focus();
    else if (errs.appliedDate) dateRef.current?.focus();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<Field, string>> = {};
    if (!company.trim()) errs.company = 'Nama perusahaan wajib diisi.';
    if (!role.trim()) errs.role = 'Posisi / role wajib diisi.';
    if (splitSkills(skills).length === 0) errs.skills = 'Isi minimal 1 skill (pisahkan dengan koma).';
    if (status === 'APPLIED') {
      if (!cvVersion.trim()) errs.cvVersion = 'Versi CV wajib diisi untuk status APPLIED.';
      if (!appliedDate) errs.appliedDate = 'Tanggal melamar wajib diisi untuk status APPLIED.';
    }
    if (Object.keys(errs).length > 0) return fail(errs);

    const dupErr = onSubmit({
      company,
      role,
      workMode,
      status,
      requiredSkills: splitSkills(skills),
      cvVersion,
      appliedDate,
      source: 'manual',
    });
    if (dupErr) return fail({ company: dupErr });
    onClose();
  };

  return (
    <motion.div
      className="overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <motion.form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        noValidate
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="modal-header">
          <div>
            <h3 id="form-modal-title">Register New Mission</h3>
            <small>Catat lamaran baru ke dalam War Room Pipeline.</small>
          </div>
          <button type="button" className="btn ghost sm" aria-label="Tutup dialog" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="form-group" style={{ marginTop: 16 }}>
          <div className="form-group-title">Informasi Posisi</div>
          <label>
            Perusahaan<span className="req">*</span>
            <input ref={companyRef} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Contoh: Nusantara Cloud" />
          </label>
          {errors.company && <p className="err">{errors.company}</p>}

          <label>
            Posisi / Role<span className="req">*</span>
            <input ref={roleRef} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Contoh: Frontend Developer Intern" />
          </label>
          {errors.role && <p className="err">{errors.role}</p>}

          <div className="cols" style={{ gap: 12 }}>
            <label>
              Mode Kerja<span className="req">*</span>
              <select value={workMode} onChange={(e) => setWorkMode(e.target.value as WorkMode)}>
                <option>Remote</option>
                <option>Hybrid</option>
                <option>Onsite</option>
              </select>
            </label>
            <label>
              Status Awal<span className="req">*</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'WISHLIST' | 'APPLIED')}>
                <option value="WISHLIST">WISHLIST</option>
                <option value="APPLIED">APPLIED</option>
              </select>
            </label>
          </div>
        </div>

        <div className="form-group">
          <div className="form-group-title">Kebutuhan Skill</div>
          <label>
            Required Skills (pisahkan dengan koma)<span className="req">*</span>
            <input ref={skillsRef} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, CSS" />
          </label>
          {errors.skills && <p className="err">{errors.skills}</p>}
        </div>

        {status === 'APPLIED' && (
          <div className="form-group">
            <div className="form-group-title">Detail Pengiriman</div>
            <label>
              Versi CV<span className="req">*</span>
              <input ref={cvRef} value={cvVersion} onChange={(e) => setCv(e.target.value)} placeholder="Contoh: Kapten-CV-v2.pdf" />
            </label>
            {errors.cvVersion && <p className="err">{errors.cvVersion}</p>}

            <label>
              Tanggal Melamar<span className="req">*</span>
              <input ref={dateRef} type="date" value={appliedDate} onChange={(e) => setDate(e.target.value)} />
            </label>
            {errors.appliedDate && <p className="err">{errors.appliedDate}</p>}
          </div>
        )}

        <div className="row end" style={{ marginTop: 22 }}>
          <button type="button" className="btn ghost" onClick={onClose}>Batal</button>
          <button type="submit" className="btn primary">Simpan Lamaran</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
