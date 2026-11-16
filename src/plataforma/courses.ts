import type { Course } from './api';

// Formulário de curso do catálogo (Immersia).

export type CourseForm = {
  title: string;
  description: string;
  validity_months: string;
  workload_hours: string;
  syllabus: string;
  technical_lead: string;
};

export const emptyCourse: CourseForm = {
  title: '',
  description: '',
  validity_months: '12',
  workload_hours: '',
  syllabus: '',
  technical_lead: '',
};

export const courseForm = (c: Course): CourseForm => ({
  title: c.title,
  description: c.description ?? '',
  validity_months: c.validity_months ? String(c.validity_months) : '',
  workload_hours: c.workload_hours ? String(Number(c.workload_hours)) : '',
  syllabus: c.syllabus ?? '',
  technical_lead: c.technical_lead ?? '',
});

const orNull = (v: string) => v.trim() || null;

export const courseBody = (f: CourseForm) => ({
  title: f.title.trim(),
  description: orNull(f.description),
  validity_months: f.validity_months ? Number(f.validity_months) : null,
  workload_hours: f.workload_hours
    ? Number(f.workload_hours.replace(',', '.'))
    : null,
  syllabus: orNull(f.syllabus),
  technical_lead: orNull(f.technical_lead),
});
