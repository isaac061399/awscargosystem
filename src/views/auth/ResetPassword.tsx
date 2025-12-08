'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// MUI Imports
import { Button, Card, CardContent, Divider, IconButton, InputAdornment, TextField, Typography } from '@mui/material';

// Component Imports
import DirectionalIcon from '@components/DirectionalIcon';
import Logo from '@components/layout/shared/Logo';
import LangSelector from '@libs/translate/LangSelector';

// Helper Imports
import { requestResetPassword } from '@helpers/request';

const ResetPassword = ({ token, userId }: { token: string; userId: string }) => {
  const { t, i18n } = useTranslation('reset-password');
  const textT: any = useMemo(() => t('text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('form', { returnObjects: true, default: {} }), [t]);

  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClickShowPassword = () => setIsPasswordShown((show) => !show);

  const handleClickShowConfirmPassword = () => setIsConfirmPasswordShown((show) => !show);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(
      () => ({
        password: '',
        confirmPassword: ''
      }),
      []
    ),
    validationSchema: yup.object({
      password: yup.string().required(formT?.errors?.password),
      confirmPassword: yup
        .string()
        .required(formT?.errors?.confirmPassword)
        .oneOf([yup.ref('password')], formT?.errors?.confirmPasswordMatch)
    }),
    onSubmit: async (values) => {
      setError('');

      try {
        const result: any = await requestResetPassword(
          { password: values.password, token: token, id: userId },
          i18n.language
        );

        if (!result.valid) {
          const message = result.message || formT?.errorMessage;

          setError(message);

          return;
        }

        setShowSuccess(true);

        return;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // console.error(e);
        setError(formT?.errorMessage);

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
          <Typography variant="h4">{!showSuccess ? textT?.title : textT?.successTitle}</Typography>
          <div className="flex flex-col gap-5">
            <Typography className="mbs-1">{!showSuccess ? textT?.subtitle : textT?.successSubtitle}</Typography>
            {!showSuccess && (
              <form noValidate onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
                <TextField
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
                  disabled={formik.isSubmitting}
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
                <TextField
                  fullWidth
                  required
                  type={isConfirmPasswordShown ? 'text' : 'password'}
                  label={formT?.labels?.confirmPassword}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••"
                  autoComplete="current-password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  error={Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword)}
                  color={Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword) ? 'error' : 'primary'}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                  disabled={formik.isSubmitting}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            edge="end"
                            onClick={handleClickShowConfirmPassword}
                            onMouseDown={(e) => e.preventDefault()}
                            tabIndex={-1}>
                            <i className={isConfirmPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />

                {error !== '' && (
                  <div className="gap-x-3 gap-y-1 w-full text-center text-error">
                    <p>{error}</p>
                  </div>
                )}

                <Button type="submit" variant="contained" fullWidth loading={formik.isSubmitting}>
                  {formT?.submitButton}
                </Button>
              </form>
            )}

            <Typography className="flex justify-center items-center" color="primary">
              <Link href="/auth/login" className="flex items-center">
                <span>{textT?.backToLogin}</span>
                <DirectionalIcon ltrIconClass="ri-arrow-right-s-line" rtlIconClass="ri-arrow-left-s-line" />
              </Link>
            </Typography>

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

export default ResetPassword;
