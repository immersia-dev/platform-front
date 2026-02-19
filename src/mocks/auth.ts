export const MOCK_PASSWORD = '123456789';

export type MockUserRole = 'student' | 'instructor';

const mockUsersByEmail: Record<string, MockUserRole> = {
  'aluno@immersia.com': 'student',
  'instrutor@immersia.com': 'instructor',
};

export function resolveRoleByLogin(login: string): MockUserRole {
  const normalizedLogin = login.trim().toLowerCase();
  return mockUsersByEmail[normalizedLogin] ?? 'student';
}

export function isValidMockPassword(password: string): boolean {
  return password === MOCK_PASSWORD;
}
