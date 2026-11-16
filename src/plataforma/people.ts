import type { BackRole, User } from './api';
import { formatCpf } from './format';

// Formulário de pessoa (Pessoas e gestores de uma organização).

export type PersonForm = {
  id?: string;
  name: string;
  email: string;
  cpf: string;
  role: BackRole;
  password: string;
  active: boolean;
};
export const blank: PersonForm = {
  name: '',
  email: '',
  cpf: '',
  role: 'student',
  password: '',
  active: true,
};

/** Corpo para criar ou editar uma pessoa a partir do formulário. */
export function personBody(form: PersonForm, companyId?: string | null) {
  const login = {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase() || null,
    cpf: form.cpf.trim() || null,
  };
  if (form.id)
    return {
      ...login,
      active: form.active,
      ...(form.password ? { password: form.password } : {}),
    };
  return {
    ...login,
    role: form.role,
    password: form.password,
    company_id: companyId ?? undefined,
  };
}

export const formFrom = (u: User): PersonForm => ({
  id: u.id,
  name: u.name,
  email: u.email ?? '',
  cpf: u.cpf ? formatCpf(u.cpf) : '',
  role: u.role,
  password: '',
  active: u.active,
});
