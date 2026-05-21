import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';

import { request } from '../api/client';
import type { AuthErrors, AuthForm, AuthMode, AuthResponse, AuthRole, FormFieldEvent } from '../types';

type LoginPageProps = {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  authForm: AuthForm;
  authErrors: AuthErrors;
  loading: boolean;
  onChange: (event: FormFieldEvent) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const authCopy = {
  login: {
    heading: 'Sign in to your account',
    subtext: 'Access your pipeline, lead notes, and analytics in one clean workspace.',
  },
  register: {
    heading: 'Create your account',
    subtext: 'Set up your workspace, assign access, and start closing faster.',
  },
} satisfies Record<AuthMode, { heading: string; subtext: string }>;

const roleOptions: Array<{ value: AuthRole; label: string; icon: string; description: string }> = [
  { value: 'sales', label: 'Sales rep', icon: 'ti-briefcase', description: 'Manage and qualify leads' },
  { value: 'manager', label: 'Manager', icon: 'ti-chart-bar', description: 'View team pipeline' },
  { value: 'admin', label: 'Admin', icon: 'ti-shield', description: 'Full platform access' },
  { value: 'viewer', label: 'Viewer', icon: 'ti-eye', description: 'Read-only access' },
];

type AuthStep = 1 | 2 | 3;
type SubmitState = 'idle' | 'loading' | 'success';
type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: AuthRole;
};
type LocalErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword' | 'role', string>>;

const initialFormState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'sales',
};

function mergeClassNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <i aria-hidden="true" className={`ti ${name} ${className}`} />;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-xs font-normal text-[#E24B4A]">{message}</p>;
}

function TextField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  prefix,
  rightSlot,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder: string;
  error?: string;
  prefix?: string;
  rightSlot?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">{label}</span>
      <div
        className={mergeClassNames(
          'flex min-h-12 items-center gap-3 rounded-[10px] border-[0.5px] bg-[color:var(--input-bg)] px-3 transition',
          error
            ? 'border-[#E24B4A]'
            : 'border-[color:var(--border)] focus-within:border-[#378ADD] focus-within:shadow-[0_0_0_3px_rgba(55,138,221,0.10)]'
        )}
      >
        {prefix ? <Icon name={prefix} className="text-[17px] text-[color:var(--muted)]" /> : null}
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm font-normal text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
        />
        {rightSlot}
      </div>
      <FieldError message={error} />
    </label>
  );
}

function TogglePill({
  value,
  active,
  onClick,
  className = '',
  icon,
}: {
  value: string;
  active: boolean;
  onClick: () => void;
  className?: string;
  icon?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={mergeClassNames(
        'inline-flex items-center justify-center gap-2 rounded-[10px] border-[0.5px] px-4 py-3 text-sm font-medium transition',
        active ? 'border-[color:var(--border)] bg-white text-[color:var(--text)]' : 'border-transparent bg-transparent text-[color:var(--muted)]',
        className
      )}
    >
      {icon ? <Icon name={icon} className="text-[16px]" /> : null}
      {value}
    </button>
  );
}

function RoleCard({
  label,
  icon,
  description,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={mergeClassNames(
        'flex min-h-28 flex-col justify-between rounded-[10px] border-[0.5px] p-4 text-left transition',
        active
          ? 'border-[1.5px] border-[#185FA5] bg-[#E6F1FB]'
          : 'border-[color:var(--border)] bg-[color:var(--secondary-surface)] hover:border-[color:var(--primary-accent)]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[color:var(--text)]">{label}</p>
          <p className="mt-1 text-xs font-normal leading-5 text-[color:var(--muted)]">{description}</p>
        </div>
        <span
          className={mergeClassNames(
            'grid h-9 w-9 place-items-center rounded-[10px] border-[0.5px] transition',
            active ? 'border-[#185FA5] bg-white text-[#185FA5]' : 'border-[color:var(--border)] bg-white/70 text-[color:var(--muted)]'
          )}
        >
          <Icon name={icon} className="text-[18px]" />
        </span>
      </div>
      <p className={mergeClassNames('text-[11px] font-medium uppercase tracking-[0.24em]', active ? 'text-[#185FA5]' : 'text-[color:var(--muted)]')}>
        {active ? 'Selected' : 'Choose this role'}
      </p>
    </button>
  );
}

function StepIndicator({ currentStep }: { currentStep: AuthStep }) {
  const steps: Array<{ step: AuthStep; label: string }> = [
    { step: 1, label: 'Your basic info' },
    { step: 2, label: 'Choose your role' },
    { step: 3, label: 'Secure your account' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {steps.map((step, index) => {
        const completed = currentStep > step.step;
        const active = currentStep === step.step;

        return (
          <div key={step.step} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={mergeClassNames(
                  'grid h-8 w-8 place-items-center rounded-full border-[0.5px] text-xs font-medium transition',
                  completed
                    ? 'border-[#1D9E75] bg-[#1D9E75] text-white'
                    : active
                      ? 'border-[#378ADD] bg-[#378ADD] text-white'
                      : 'border-[color:var(--border)] bg-[color:var(--secondary-surface)] text-[color:var(--muted)]'
                )}
              >
                {completed ? <Icon name="ti-check" className="text-[14px]" /> : step.step}
              </span>
              <div>
                <p className="text-xs font-medium text-[color:var(--text)]">{step.label}</p>
                <p className="text-[11px] font-normal text-[color:var(--muted)]">Step {step.step}</p>
              </div>
            </div>
            {index < steps.length - 1 ? <span className={mergeClassNames('h-px w-8 bg-[color:var(--border)]', completed ? 'bg-[#1D9E75]' : '')} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = useMemo(() => {
    let nextScore = 0;
    if (password.length >= 8) nextScore += 1;
    if (password.length >= 12) nextScore += 1;
    if (/[A-Z]/.test(password) && /\d/.test(password)) nextScore += 1;
    if (/[^A-Za-z0-9]/.test(password)) nextScore += 1;
    return nextScore;
  }, [password]);

  const safeScore = score === 0 ? 1 : score;
  const label = safeScore === 1 ? 'Weak' : safeScore === 2 ? 'Fair' : safeScore === 3 ? 'Good' : 'Strong';
  const tone = safeScore === 1 ? 'text-[#E24B4A]' : safeScore === 2 ? 'text-[#C98A1B]' : safeScore === 3 ? 'text-[#185FA5]' : 'text-[#1D9E75]';

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={mergeClassNames(
              'h-1.5 rounded-full border-[0.5px] transition-all duration-200',
              index < safeScore
                ? safeScore === 1
                  ? 'border-[#E24B4A] bg-[#E24B4A]'
                  : safeScore === 2
                    ? 'border-[#C98A1B] bg-[#C98A1B]'
                    : safeScore === 3
                      ? 'border-[#185FA5] bg-[#185FA5]'
                      : 'border-[#1D9E75] bg-[#1D9E75]'
                : 'border-[color:var(--border)] bg-[color:var(--secondary-surface)]'
            )}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${tone}`}>{label}</p>
    </div>
  );
}

function SuccessState({ title }: { title: string }) {
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveDot((current) => (current + 1) % 3);
    }, 340);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-[560px] flex-col items-center justify-center px-6 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-[#E6F1FB] text-[#1D9E75]">
        <Icon name="ti-check" className="text-[36px]" />
      </div>
      <h3 className="mt-6 text-[30px] font-medium tracking-[-0.04em] text-[color:var(--text)]">{title}</h3>
      <p className="mt-3 max-w-sm text-[15px] font-normal leading-7 text-[color:var(--muted)]">Redirecting you to the dashboard…</p>
      <div className="mt-6 flex items-center gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <span
            key={index}
            className={mergeClassNames(
              'h-2.5 w-2.5 rounded-full border-[0.5px] transition-all duration-200',
              activeDot === index ? 'scale-110 border-[#1D9E75] bg-[#1D9E75]' : 'border-[color:var(--border)] bg-[color:var(--secondary-surface)]'
            )}
          />
        ))}
      </div>
    </div>
  );
}

const emailRegex = /\S+@\S+\.\S+/;

export default function LoginPage(props: LoginPageProps) {
  const { authMode, setAuthMode } = props;
  const [form, setForm] = useState<FormState>(initialFormState);
  const [registerStep, setRegisterStep] = useState<AuthStep>(1);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LocalErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successDot, setSuccessDot] = useState(0);
  const redirectTimerRef = useRef<number | null>(null);
  const dotTimerRef = useRef<number | null>(null);

  const copy = authCopy[authMode];
  const showRegisterSuccess = authMode === 'register' && submitState === 'success';
  const passwordType = showPassword ? 'text' : 'password';
  const confirmPasswordType = showConfirmPassword ? 'text' : 'password';

  const clearTimers = useCallback(() => {
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    if (dotTimerRef.current) {
      window.clearInterval(dotTimerRef.current);
      dotTimerRef.current = null;
    }
  }, []);

  const resetSession = useCallback(() => {
    clearTimers();
    setSubmitState('idle');
    setSubmitMessage('');
    setFieldErrors({});
    setRegisterStep(1);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSuccessDot(0);
    setForm(initialFormState);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    resetSession();
  }, [authMode, resetSession]);

  useEffect(() => {
    if (submitState !== 'success') return undefined;

    dotTimerRef.current = window.setInterval(() => {
      setSuccessDot((current) => (current + 1) % 3);
    }, 340);

    redirectTimerRef.current = window.setTimeout(() => {
      window.location.assign('/dashboard');
    }, 2000);

    return () => clearTimers();
  }, [submitState, clearTimers]);

  const updateField = (name: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleModeSwitch = (mode: AuthMode) => {
    if (mode === authMode) return;
    setAuthMode(mode);
    resetSession();
  };

  const handleRoleChange = (nextRole: AuthRole) => {
    setForm((current) => ({ ...current, role: nextRole }));
    setFieldErrors((current) => ({ ...current, role: undefined }));
  };

  const validateLogin = () => {
    const nextErrors: LocalErrors = {};
    if (!emailRegex.test(form.email)) nextErrors.email = 'Enter a valid email.';
    if (form.password.trim().length < 6) nextErrors.password = 'Password must be at least 6 characters.';
    return nextErrors;
  };

  const validateRegisterStepOne = () => {
    const nextErrors: LocalErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required.';
    if (!emailRegex.test(form.email)) nextErrors.email = 'Enter a valid work email.';
    return nextErrors;
  };

  const validateRegisterStepThree = () => {
    const nextErrors: LocalErrors = {};
    if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    return nextErrors;
  };

  const finalizeAuth = async (mode: AuthMode) => {
    const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login'
      ? { email: form.email.trim(), password: form.password }
      : {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        };

    const response = await request<AuthResponse>(path, {
      method: 'POST',
      body,
    });

    localStorage.setItem('leadflow_token', response.token);
    localStorage.setItem('leadflow_refresh', response.refreshToken);
    localStorage.setItem('leadflow_user', JSON.stringify(response.user));

    setSubmitMessage(mode === 'login' ? 'Signed in!' : 'Account created!');
    setSubmitState('success');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === 'loading' || submitState === 'success') return;

    setFieldErrors({});

    if (authMode === 'login') {
      const nextErrors = validateLogin();
      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        return;
      }

      try {
        setSubmitState('loading');
        await finalizeAuth('login');
      } catch (error) {
        setSubmitState('idle');
        setFieldErrors((current) => ({
          ...current,
          password: (error as Error).message || 'Unable to sign in.',
        }));
      }
      return;
    }

    if (registerStep === 1) {
      const nextErrors = validateRegisterStepOne();
      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        return;
      }
      setRegisterStep(2);
      return;
    }

    if (registerStep === 2) {
      setRegisterStep(3);
      return;
    }

    const nextErrors = validateRegisterStepThree();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    try {
      setSubmitState('loading');
      await finalizeAuth('register');
    } catch (error) {
      setSubmitState('idle');
      setFieldErrors((current) => ({
        ...current,
        password: (error as Error).message || 'Unable to create account.',
      }));
    }
  };

  const submitLabel = submitState === 'success'
    ? submitMessage
    : authMode === 'login'
      ? 'Sign in'
      : registerStep === 1
        ? 'Continue'
        : registerStep === 2
          ? 'Continue'
          : 'Create account';

  const emailError = fieldErrors.email;
  const passwordError = fieldErrors.password;
  const confirmPasswordError = fieldErrors.confirmPassword;
  const firstNameError = fieldErrors.firstName;
  const lastNameError = fieldErrors.lastName;
  const roleError = fieldErrors.role;

  return (
    <div className="flex min-h-screen items-stretch justify-center bg-[color:var(--page-bg)] p-0 md:p-4">
      <div className="grid min-h-screen w-full overflow-hidden rounded-[18px] border-[0.5px] border-[color:var(--border)] bg-[color:var(--page-bg)] shadow-[var(--shadow)] lg:min-h-[calc(100vh-2rem)] lg:grid-cols-[40%_60%]">
        <section className="relative overflow-hidden px-6 py-8 text-white sm:px-8 lg:px-10 login-left-bg">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[-16%] top-[-12%] h-[360px] w-[360px] rounded-full blur-3xl login-glow-blue"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-18%] right-[-12%] h-[420px] w-[420px] rounded-full blur-3xl login-glow-green"
          />

          <div className="relative z-[1] flex min-h-[calc(100vh-4rem)] flex-col justify-between gap-10 lg:min-h-[calc(100vh-4rem)]">
            <div className="flex items-center gap-2">
              <Icon name="ti-bolt" className="text-[15px] text-white" />
              <span className="text-[15px] font-medium tracking-[0.01em] text-white">Leadflow AI</span>
            </div>

            <div className="max-w-[420px] pt-10 lg:pt-0">
              <h1 className="text-[clamp(2rem,3vw,2.05rem)] font-medium leading-[0.96] tracking-[-0.05em] text-[#5DCAA5]">
                Close deals.
                <br />
                Faster.
              </h1>
              <p className="mt-5 max-w-[360px] text-[12px] font-normal leading-[1.65] text-white/[0.38]">
                Keep every lead, note, and handoff visible in one calm command center built for fast-moving sales teams.
              </p>
            </div>

            <div className="grid max-w-[420px] grid-cols-2 gap-3">
              {[
                { value: '3.2×', label: 'faster close' },
                { value: '94%', label: 'qualify rate' },
                { value: '12k+', label: 'leads tracked' },
                { value: '99.9%', label: 'uptime' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[10px] border-[0.5px] border-white/[0.07] bg-white/[0.04] p-4">
                  <p className="text-[28px] font-medium tracking-[-0.05em] text-white">{stat.value}</p>
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.24em] text-white/[0.45]">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="h-px w-full max-w-[420px] bg-white/[0.1]" />

            <ul className="grid max-w-[420px] gap-3">
              {[
                { tone: 'bg-[#378ADD]', text: 'Role-based access keeps every workspace view scoped correctly.' },
                { tone: 'bg-[#1D9E75]', text: 'Pipeline funnel visibility helps teams spot bottlenecks early.' },
                { tone: 'bg-[#8B5CF6]', text: 'CSV export keeps offline reporting one click away.' },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3 text-[13px] font-normal leading-6 text-white/[0.74]">
                  <span className={mergeClassNames('mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full', item.tone)} />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>

            <div className="inline-flex w-fit items-center gap-2 rounded-[999px] border-[0.5px] border-[rgba(29,158,117,0.25)] bg-[rgba(29,158,117,0.15)] px-4 py-2 text-[12px] font-medium text-[#5DCAA5]">
              <Icon name="ti-shield-check" className="text-[15px]" />
              <span>SOC 2 · TLS 1.3 · GDPR</span>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[color:var(--page-bg)] px-5 py-5 sm:px-8 lg:px-10">
          <div className="w-full max-w-[620px] rounded-[18px] bg-[color:var(--page-bg)] px-5 py-5 text-[color:var(--text)] sm:px-6 sm:py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[color:var(--muted)]">{authMode === 'login' ? 'Welcome back' : 'Create your account'}</p>
                <h2 className="mt-2 text-[30px] font-medium tracking-[-0.04em] text-[color:var(--text)]">{copy.heading}</h2>
                <p className="mt-3 max-w-[36rem] text-[15px] font-normal leading-7 text-[color:var(--muted)]">{copy.subtext}</p>
              </div>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border-[0.5px] border-[color:var(--border)] bg-[color:var(--secondary-surface)] text-[#378ADD]">
                <Icon name="ti-chart-dots" className="text-[17px]" />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-[13px] font-normal text-[color:var(--muted)]">
                {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <button type="button" onClick={() => handleModeSwitch(authMode === 'login' ? 'register' : 'login')} className="ml-2 font-medium text-[#378ADD] transition hover:opacity-85">
                  {authMode === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </p>
            </div>

            <div className="mt-5 flex rounded-[10px] border-[0.5px] border-[color:var(--border)] bg-[color:var(--secondary-surface)] p-1">
              <TogglePill value="Login" icon="ti-login-2" active={authMode === 'login'} onClick={() => handleModeSwitch('login')} className="flex-1" />
              <TogglePill value="Register" icon="ti-user-plus" active={authMode === 'register'} onClick={() => handleModeSwitch('register')} className="flex-1" />
            </div>

            {showRegisterSuccess ? (
              <SuccessState title={submitMessage} />
            ) : (
              <form className="mt-5 grid gap-4" onSubmit={handleSubmit} noValidate>
                {authMode === 'register' ? (
                  <div className="space-y-4">
                    <StepIndicator currentStep={registerStep} />

                    {registerStep === 1 ? (
                      <div className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextField label="First name" name="firstName" value={form.firstName} onChange={updateField('firstName')} placeholder="Arjun" error={firstNameError} prefix="ti-user" />
                          <TextField label="Last name" name="lastName" value={form.lastName} onChange={updateField('lastName')} placeholder="Kumar" error={lastNameError} prefix="ti-user" />
                        </div>
                        <TextField label="Work email" name="email" value={form.email} onChange={updateField('email')} placeholder="ak@company.com" error={emailError} prefix="ti-mail" />
                        <div className="flex justify-end">
                          <button type="submit" className="inline-flex h-[44px] items-center justify-center rounded-[11px] bg-[#0C1A2E] px-5 text-sm font-medium text-white transition hover:opacity-95">
                            Continue
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {registerStep === 2 ? (
                      <div className="grid gap-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {roleOptions.map((option) => (
                            <RoleCard
                              key={option.value}
                              label={option.label}
                              icon={option.icon}
                              description={option.description}
                              active={form.role === option.value}
                              onClick={() => handleRoleChange(option.value)}
                            />
                          ))}
                        </div>
                        {roleError ? <FieldError message={roleError} /> : null}
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setRegisterStep(1)}
                            className="inline-flex h-[44px] items-center justify-center rounded-[11px] border-[0.5px] border-[color:var(--border)] bg-[color:var(--secondary-surface)] px-5 text-sm font-medium text-[color:var(--text)] transition hover:bg-[color:var(--card)]"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            className="inline-flex h-[44px] items-center justify-center rounded-[11px] bg-[#0C1A2E] px-5 text-sm font-medium text-white transition hover:opacity-95"
                          >
                            Continue
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {registerStep === 3 ? (
                      <div className="grid gap-4">
                        <TextField
                          label="Password"
                          name="password"
                          value={form.password}
                          onChange={updateField('password')}
                          type={passwordType}
                          placeholder="••••••••"
                          error={passwordError}
                          prefix="ti-lock"
                          rightSlot={
                            <button
                              type="button"
                              onClick={() => setShowPassword((current) => !current)}
                              className="grid h-8 w-8 place-items-center rounded-[10px] text-[color:var(--muted)] transition"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              <Icon name={showPassword ? 'ti-eye-off' : 'ti-eye'} className="text-[18px]" />
                            </button>
                          }
                        />

                        <PasswordStrength password={form.password} />

                        <TextField
                          label="Confirm password"
                          name="confirmPassword"
                          value={form.confirmPassword}
                          onChange={updateField('confirmPassword')}
                          type={confirmPasswordType}
                          placeholder="••••••••"
                          error={confirmPasswordError}
                          prefix="ti-lock"
                          rightSlot={
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((current) => !current)}
                              className="grid h-8 w-8 place-items-center rounded-[10px] text-[color:var(--muted)] transition"
                              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                            >
                              <Icon name={showConfirmPassword ? 'ti-eye-off' : 'ti-eye'} className="text-[18px]" />
                            </button>
                          }
                        />

                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setRegisterStep(2)}
                            className="inline-flex h-[44px] items-center justify-center rounded-[11px] border-[0.5px] border-[color:var(--border)] bg-[color:var(--secondary-surface)] px-5 text-sm font-medium text-[color:var(--text)] transition hover:bg-[color:var(--card)]"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            disabled={submitState === 'loading'}
                            className={mergeClassNames(
                              'inline-flex h-[44px] items-center justify-center gap-2 px-5 text-sm font-medium text-white transition',
                              submitState === 'success' ? 'rounded-[11px] bg-[#1D9E75]' : 'rounded-[11px] bg-[#0C1A2E]'
                            )}
                          >
                            <Icon name={submitState === 'success' ? 'ti-check' : 'ti-arrow-right'} className="text-[18px]" />
                            {submitState === 'success' ? submitLabel : submitState === 'loading' ? 'Creating account...' : 'Create account'}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <TextField
                      label="Email"
                      name="email"
                      value={form.email}
                      onChange={updateField('email')}
                      placeholder="ak@gmail.com"
                      error={emailError}
                      prefix="ti-mail"
                    />

                    <TextField
                      label="Password"
                      name="password"
                      value={form.password}
                      onChange={updateField('password')}
                      type={passwordType}
                      placeholder="••••••"
                      error={passwordError}
                      prefix="ti-lock"
                      rightSlot={
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="grid h-8 w-8 place-items-center rounded-[10px] text-[color:var(--muted)] transition"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          <Icon name={showPassword ? 'ti-eye-off' : 'ti-eye'} className="text-[18px]" />
                        </button>
                      }
                    />

                    <div className="flex justify-end">
                      <button type="button" className="text-[13px] font-medium text-[#378ADD]">
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={submitState === 'loading'}
                      className={mergeClassNames(
                        'inline-flex h-[44px] w-full items-center justify-center gap-2 px-4 text-sm font-medium text-white transition',
                        submitState === 'success' ? 'rounded-[11px] bg-[#1D9E75]' : 'rounded-[11px] bg-[#0C1A2E]'
                      )}
                    >
                      <Icon name={submitState === 'success' ? 'ti-check' : 'ti-arrow-right'} className="text-[18px]" />
                      {submitState === 'success' ? submitLabel : submitState === 'loading' ? 'Signing in...' : 'Sign in'}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </section>
      </div>
      <div aria-hidden="true" className="sr-only">
        {successDot}
      </div>
    </div>
  );
}