'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import { Button, Card, CardContent, Divider, IconButton, InputAdornment, TextField, Typography } from '@mui/material';

// Component Imports
import Logo from '@components/layout/shared/Logo';
import LangSelector from '@libs/translate/LangSelector';

// Helpers Imports
import { requestLost2FA, requestVerify2FALogin } from '@helpers/request';

const Login = () => {
  const router = useRouter();

  const { t, i18n } = useTranslation('login');
  const textT: any = useMemo(() => t('text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('form', { returnObjects: true, default: {} }), [t]);

  const [is2faChecked, setIs2faChecked] = useState(false);
  const [is2faRequired, setIs2faRequired] = useState(false);
  const [success, setSuccess] = useState('');
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState('');
  const [autoFocusState, setAutoFocusState] = useState({ email: true, password: false, code: false });

  const handleClickShowPassword = () => setIsPasswordShown((show) => !show);

  const handleReset2fa = async (e: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
    e.preventDefault();
    setIsRedirecting(true);

    await requestLost2FA({ email: formik.values.email }, i18n.language);

    setIsRedirecting(false);
    setIs2faChecked(false);
    setIs2faRequired(false);
    setSuccess(textT?.successLost2FACodes);
    setTimeout(() => {
      setSuccess('');
    }, 5000);
  };

  let codeValidation = yup.string();

  if (is2faRequired) {
    codeValidation = codeValidation.required(formT?.errors?.code);
  }

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        email: '',
        password: '',
        code: ''
      }),
      []
    ),
    validationSchema: yup.object({
      email: yup.string().required(formT?.errors?.email).email(formT?.errors?.invalidEmail),
      password: yup.string().required(formT?.errors?.password),
      code: codeValidation
    }),
    onSubmit: async (values) => {
      setError('');

      try {
        // verify 2fa
        if (!is2faChecked) {
          setIs2faChecked(true);
          const required2fa = await requestVerify2FALogin(values.email, i18n.language);

          if (required2fa.required) {
            setAutoFocusState({ email: false, password: false, code: true });
            setIs2faRequired(true);

            return;
          }
        }

        // login
        const result: any = await signIn('credentials', {
          email: values.email,
          password: values.password,
          code: is2faRequired ? values.code : undefined,
          redirect: false
        });

        if (!result.ok) {
          setError(formT?.errorMessage);
          setAutoFocusState({ email: false, password: true, code: false });
          setIs2faChecked(false);
          setIs2faRequired(false);
          formik.setFieldValue('password', '');
          formik.setFieldValue('code', '');

          return;
        }

        setIsRedirecting(true);
        router.push('/');

        return;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // console.error(e);
        setError(formT?.errorMessage);
        setAutoFocusState({ email: false, password: true, code: false });
        setIs2faChecked(false);
        setIs2faRequired(false);
        formik.setFieldValue('password', '');
        formik.setFieldValue('code', '');

        return;
      }
    }
  });

  return (
    <div className="flex flex-col justify-center items-center min-bs-dvh relative p-6">
      <Card className="flex flex-col sm:is-[450px]">
        <CardContent className="p-6 sm:p-12!">
          <Link href="/" className="flex justify-center items-center mbe-6">
            <Logo />
          </Link>
          <div className="flex flex-col gap-5">
            {!is2faRequired ? (
              <div>
                <Typography variant="h4">{textT?.title}</Typography>
                <Typography className="mbs-1">{textT?.subtitle}</Typography>
              </div>
            ) : (
              <div>
                <Typography variant="h4">{textT?.text2fa?.title}</Typography>
                <Typography className="mbs-1">{textT?.text2fa?.subtitle}</Typography>
                <Typography className="mbs-1">{textT?.text2fa?.text}</Typography>
              </div>
            )}

            <form noValidate onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
              {!is2faRequired ? (
                <>
                  <TextField
                    autoFocus={autoFocusState.email}
                    fullWidth
                    required
                    type="email"
                    id="email"
                    name="email"
                    label={formT?.labels?.email}
                    placeholder="your@email.com"
                    autoComplete="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    error={Boolean(formik.touched.email && formik.errors.email)}
                    color={Boolean(formik.touched.email && formik.errors.email) ? 'error' : 'primary'}
                    helperText={formik.touched.email && formik.errors.email}
                    disabled={formik.isSubmitting || isRedirecting}
                  />
                  <TextField
                    autoFocus={autoFocusState.password}
                    fullWidth
                    required
                    type={isPasswordShown ? 'text' : 'password'}
                    label={formT?.labels?.password}
                    id="password"
                    name="password"
                    placeholder="••••••"
                    autoComplete="current-password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    error={Boolean(formik.touched.password && formik.errors.password)}
                    color={Boolean(formik.touched.password && formik.errors.password) ? 'error' : 'primary'}
                    helperText={formik.touched.password && formik.errors.password}
                    disabled={formik.isSubmitting || isRedirecting}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              edge="end"
                              onClick={handleClickShowPassword}
                              onMouseDown={(e) => e.preventDefault()}
                              tabIndex={-1}>
                              <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                </>
              ) : (
                <TextField
                  autoFocus={autoFocusState.code}
                  fullWidth
                  required
                  type="text"
                  id="code"
                  name="code"
                  label={formT?.labels?.code}
                  placeholder="XXXXXX"
                  autoComplete="code"
                  value={formik.values.code}
                  onChange={formik.handleChange}
                  error={Boolean(formik.touched.code && formik.errors.code)}
                  color={Boolean(formik.touched.code && formik.errors.code) ? 'error' : 'primary'}
                  helperText={formik.touched.code && formik.errors.code}
                  disabled={formik.isSubmitting || isRedirecting}
                />
              )}

              {error !== '' && (
                <div className="gap-x-3 gap-y-1 w-full text-center text-error">
                  <p>{error}</p>
                </div>
              )}

              {success !== '' && (
                <div className="gap-x-3 gap-y-1 w-full text-center text-success">
                  <p>{success}</p>
                </div>
              )}

              <Button type="submit" variant="contained" fullWidth loading={formik.isSubmitting || isRedirecting}>
                {formT?.submitButton}
              </Button>

              <div className="gap-x-3 gap-y-1 flex-wrap w-full text-center text-primary">
                {!is2faRequired ? (
                  <Link href="/auth/forgot-password" aria-label={textT?.forgotPass} tabIndex={-1}>
                    {textT?.forgotPass}
                  </Link>
                ) : (
                  <Link href="/" aria-label={textT?.lost2FACodes} tabIndex={-1} onClick={handleReset2fa}>
                    {textT?.lost2FACodes}
                  </Link>
                )}
              </div>
            </form>

            <Divider />

            <div className="flex justify-center">
              <LangSelector />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
