import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { CalendarDays, CheckCircle2, IdCard, KeyRound, Mail, Upload, UserRound } from 'lucide-react';

import FilterSelect from '../components/FilterSelect';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../auth/useAuth';
import { usePlatformData } from '../data/PlatformDataContext';
import { roleLabels, usersSeed, type UserSex } from '../data/mockPlatform';
import { getApiErrorMessage, updateCurrentProfile } from '../lib/apiClient';

type EmailState = 'verified' | 'pending' | 'changed';
type SaveFeedback = {
  tone: 'error' | 'info' | 'success';
  text: string;
};

const sexOptions: Array<{ value: UserSex; label: string }> = [
  { value: 'not_informed', label: 'Não informado' },
  { value: 'female', label: 'Feminino' },
  { value: 'male', label: 'Masculino' },
  { value: 'other', label: 'Outro' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Profile() {
  const { accessToken, updateSessionUser, user } = useAuth();
  const platformData = usePlatformData();
  const initialUserRecord = usersSeed.find((record) => record.email === user?.email);
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [documentNumber, setDocumentNumber] = useState(initialUserRecord?.documentNumber ?? '');
  const [sex, setSex] = useState<UserSex>(initialUserRecord?.sex ?? 'not_informed');
  const [birthDate, setBirthDate] = useState(initialUserRecord?.birthDate ?? '');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  useEffect(() => {
    if (!user) return;

    const userRecord = usersSeed.find((record) => record.email === user.email);
    setFullName(user.name);
    setEmail(user.email);
    setDocumentNumber(userRecord?.documentNumber ?? '');
    setSex(userRecord?.sex ?? 'not_informed');
    setBirthDate(userRecord?.birthDate ?? '');
  }, [platformData.version, user]);

  if (!user) return null;

  const sessionUser = user;
  const currentUserRecord = initialUserRecord;
  const organizationLabel = sessionUser.organizationName ?? 'Immersia';
  const roleLabel = roleLabels[sessionUser.role];
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOriginalEmail = sessionUser.email.trim().toLowerCase();
  const emailChanged = normalizedEmail !== normalizedOriginalEmail;
  const sanitizedEmailVerificationCode = emailVerificationCode.trim();
  const canConfirmEmailCode = emailChanged && sanitizedEmailVerificationCode.length === 6;

  let emailState: EmailState;

  if (emailChanged) {
    emailState = 'changed';
  } else {
    emailState = currentUserRecord?.status === 'active' ? 'verified' : 'pending';
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSaveFeedback(null);
    setPhotoFileName(file.name);
    setPhotoPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  function handleReset() {
    setFullName(sessionUser.name);
    setEmail(sessionUser.email);
    setDocumentNumber(currentUserRecord?.documentNumber ?? '');
    setSex(currentUserRecord?.sex ?? 'not_informed');
    setBirthDate(currentUserRecord?.birthDate ?? '');
    setEmailVerificationCode('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPhotoFileName(null);
    setSaveFeedback(null);
    setPhotoPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  function handleConfirmEmailCode() {
    if (!canConfirmEmailCode) return;

    setSaveFeedback({
      tone: 'success',
      text: 'Código informado. Salve as alterações para validar a troca de e-mail.',
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const changedName = fullName.trim() !== sessionUser.name;
    const changedEmail = emailChanged;
    const changedPersonalData =
      documentNumber.trim() !== (currentUserRecord?.documentNumber ?? '') ||
      sex !== (currentUserRecord?.sex ?? 'not_informed') ||
      birthDate !== (currentUserRecord?.birthDate ?? '');
    const changedPhoto = Boolean(photoFileName || photoPreview);
    const changedPassword = Boolean(currentPassword || newPassword || confirmPassword);

    if (!accessToken) {
      setSaveFeedback({
        tone: 'error',
        text: 'Sua sessão expirou. Entre novamente.',
      });
      return;
    }

    if (changedPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setSaveFeedback({
          tone: 'error',
          text: 'Preencha a senha atual, a nova senha e a confirmação.',
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        setSaveFeedback({
          tone: 'error',
          text: 'A confirmação da nova senha não confere.',
        });
        return;
      }

      if (newPassword.length < 8) {
        setSaveFeedback({
          tone: 'error',
          text: 'A nova senha precisa ter pelo menos 8 caracteres.',
        });
        return;
      }
    }

    if (changedEmail && !canConfirmEmailCode) {
      setSaveFeedback({
        tone: 'error',
        text: 'Informe o código de 6 dígitos para alterar o e-mail.',
      });
      return;
    }

    if (!changedName && !changedEmail && !changedPersonalData && !changedPassword) {
      setSaveFeedback({
        tone: 'info',
        text: changedPhoto
          ? 'A foto foi pré-visualizada localmente. Upload real de imagem ainda não está habilitado.'
          : 'Nenhuma alteração foi identificada para envio.',
      });
      return;
    }

    const queuedChanges: string[] = [];

    if (changedName) queuedChanges.push('nome');
    if (changedEmail) queuedChanges.push('e-mail');
    if (changedPersonalData) queuedChanges.push('dados pessoais');
    if (changedPassword) queuedChanges.push('senha');

    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const updatedUser = await updateCurrentProfile(accessToken, {
        name: fullName.trim(),
        email: normalizedEmail,
        documentNumber: documentNumber.trim(),
        sex,
        birthDate,
        currentPassword: changedPassword ? currentPassword : undefined,
        newPassword: changedPassword ? newPassword : undefined,
        emailVerificationCode: changedEmail ? sanitizedEmailVerificationCode : undefined,
      });

      updateSessionUser(updatedUser);
      await platformData.refresh();

      setSaveFeedback({
        tone: 'success',
        text: `Alterações salvas: ${queuedChanges.join(', ')}.${
          changedPhoto ? ' A foto permanece apenas como pré-visualização local.' : ''
        }`,
      });
    } catch (error) {
      setSaveFeedback({
        tone: 'error',
        text: getApiErrorMessage(error, 'Não foi possível salvar o perfil.'),
      });
    } finally {
      setIsSaving(false);
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setEmailVerificationCode('');
  }

  const emailStatusCopy =
    emailState === 'verified'
      ? 'E-mail verificado'
      : emailState === 'pending'
        ? 'Verificação pendente'
        : 'Novo e-mail aguardando validação';

  const emailStatusStyles =
    emailState === 'verified'
      ? 'status-pill status-pill-success'
      : 'status-pill border-amber-300/20 bg-amber-400/10 text-amber-100';

  const emailConfirmationHint = emailChanged
    ? 'Salve as alterações para iniciar a validação do novo endereço. Depois, informe o código de 6 dígitos recebido por e-mail.'
    : 'O campo será habilitado quando houver uma troca de e-mail pendente.';

  const feedbackStyles =
    saveFeedback?.tone === 'error'
      ? 'border-rose-300/20 bg-rose-500/10 text-rose-100'
      : saveFeedback?.tone === 'success'
      ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
      : 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100';

  return (
    <div className="space-y-8">
      <PageHeader title="Dados do usuário" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="__enableXr__ admin-card space-y-8">
          <div className="grid gap-8 xl:grid-cols-[220px_1fr]">
            <div className="flex w-full flex-col items-center gap-4">
              <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-[36px] border border-white/12 bg-cyan-400/10 ring-1 ring-cyan-300/20">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Pré-visualização da foto do usuário"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-semibold text-cyan-100">
                    {getInitials(fullName || sessionUser.name)}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-center">
                <p className="text-sm font-semibold text-white">Foto do perfil</p>
              </div>

              <label htmlFor="profile-photo-upload" className="secondary-btn cursor-pointer">
                <Upload className="h-4 w-4" />
                Enviar foto
              </label>

              <input
                id="profile-photo-upload"
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                onChange={handlePhotoChange}
              />

              <p className="text-center text-xs text-white/45">
                {photoFileName ? photoFileName : 'PNG ou JPG, até 5 MB'}
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="profile-field md:col-span-2">
                  <label htmlFor="profile-name" className="field-label">
                    Nome completo
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      id="profile-name"
                      type="text"
                      value={fullName}
                      onChange={(event) => {
                        setSaveFeedback(null);
                        setFullName(event.target.value);
                      }}
                      className="admin-input pl-11"
                      placeholder="Nome completo"
                    />
                  </div>
                </div>

                <div className="profile-field md:col-span-2">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                    <label htmlFor="profile-email" className="field-label mb-0">
                      E-mail
                    </label>
                    <span className={emailStatusStyles}>
                      <CheckCircle2 className="h-4 w-4" />
                      {emailStatusCopy}
                    </span>
                  </div>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setSaveFeedback(null);
                        setEmail(event.target.value);
                        setEmailVerificationCode('');
                      }}
                      className="admin-input pl-11"
                      placeholder="E-mail"
                    />
                  </div>

                  <div className="mt-5 rounded-[26px] border border-cyan-300/10 bg-cyan-400/[0.04] p-5">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Confirmação de e-mail</h3>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">
                        {emailConfirmationHint}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="relative w-full sm:max-w-[260px]">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                        <input
                          id="profile-email-code"
                          type="text"
                          inputMode="numeric"
                          value={emailVerificationCode}
                          onChange={(event) => {
                            setSaveFeedback(null);
                            setEmailVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                          }}
                          className="admin-input pl-11 disabled:cursor-not-allowed disabled:bg-white/[0.03] disabled:text-white/35"
                          aria-label="Código de confirmação recebido por e-mail"
                          placeholder={emailChanged ? '000000' : 'Aguardando troca'}
                          maxLength={6}
                          disabled={!emailChanged}
                        />
                      </div>

                      <button
                        type="button"
                        className="secondary-btn min-h-12 px-6 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/35 sm:w-auto"
                        disabled={!canConfirmEmailCode}
                        onClick={handleConfirmEmailCode}
                      >
                        Confirmar código
                      </button>
                    </div>
                  </div>
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-document" className="field-label">
                    Documento
                  </label>
                  <div className="relative">
                    <IdCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      id="profile-document"
                      type="text"
                      value={documentNumber}
                      onChange={(event) => {
                        setSaveFeedback(null);
                        setDocumentNumber(event.target.value);
                      }}
                      className="admin-input pl-11"
                      placeholder="CPF ou documento interno"
                    />
                  </div>
                </div>

                <div className="profile-field">
                  <span className="field-label">Sexo</span>
                  <FilterSelect
                    value={sex}
                    options={sexOptions}
                    ariaLabel="Selecionar sexo"
                    onChange={(value) => {
                      setSaveFeedback(null);
                      setSex(value as UserSex);
                    }}
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-birth-date" className="field-label">
                    Data de nascimento
                  </label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      id="profile-birth-date"
                      type="date"
                      value={birthDate}
                      onChange={(event) => {
                        setSaveFeedback(null);
                        setBirthDate(event.target.value);
                      }}
                      className="admin-input pl-11"
                    />
                  </div>
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-organization" className="field-label">
                    Organização
                  </label>
                  <input
                    id="profile-organization"
                    type="text"
                    value={organizationLabel}
                    readOnly
                    className="admin-input profile-input-readonly cursor-default text-white/55"
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="profile-role" className="field-label">
                    Perfil de acesso
                  </label>
                  <input
                    id="profile-role"
                    type="text"
                    value={roleLabel}
                    readOnly
                    className="admin-input profile-input-readonly cursor-default text-white/55"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">Senha da conta</h2>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Use uma senha com pelo menos 8 caracteres e combine letras, números e símbolos.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div className="profile-field">
                  <label htmlFor="current-password" className="field-label">
                    Senha atual
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(event) => {
                        setSaveFeedback(null);
                        setCurrentPassword(event.target.value);
                      }}
                      className="admin-input pl-11"
                      placeholder="Digite a sua senha atual"
                    />
                  </div>
                </div>

                <div className="profile-field">
                  <label htmlFor="new-password" className="field-label">
                    Nova senha
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => {
                        setSaveFeedback(null);
                        setNewPassword(event.target.value);
                      }}
                      className="admin-input pl-11"
                      placeholder="Defina uma nova senha"
                    />
                  </div>
                </div>

                <div className="profile-field">
                  <label htmlFor="confirm-password" className="field-label">
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setSaveFeedback(null);
                        setConfirmPassword(event.target.value);
                      }}
                      className="admin-input pl-11"
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>
              </div>

              {saveFeedback ? (
                <div className={`rounded-[20px] border px-4 py-3 text-sm font-medium ${feedbackStyles}`}>
                  {saveFeedback.text}
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="ghost-btn" onClick={handleReset}>
                Descartar alterações
              </button>
              <button type="submit" className="primary-btn sm:w-auto sm:px-6" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
