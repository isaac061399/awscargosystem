'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// MUI Imports
import { Button, Card, CardContent, Divider, TextField, Typography } from '@mui/material';

// Form Imports
import { useFormik } from 'formik';
import * as yup from 'yup';

// Component Imports
import DirectionalIcon from '@components/DirectionalIcon';
import Logo from '@components/layout/shared/Logo';
import LangSelector from '@libs/translate/LangSelector';

// Helper Imports
import { requestForgotPassword } from '@helpers/request';

const ForgotPassword = () => {
  const { t, i18n } = useTranslation('forgot-password');
  const textT: any = useMemo(() => t('text', { returnObjects: true, default: {} }), [t]);
  const formT: any = useMemo(() => t('form', { returnObjects: true, default: {} }), [t]);

  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: useMemo(() => ({ email: '' }), []),
    validationSchema: yup.object({
      email: yup.string().required(formT?.errors?.email).email(formT?.errors?.invalidEmail)
    }),
    onSubmit: async (values) => {
      setError('');

      try {
        const result: any = await requestForgotPassword({ email: values.email }, i18n.language);

        if (!result.valid) {
          const message = result.message || formT?.errorMessage;

          setError(message);

          return;
        }

        setShowSuccess(true);
        formik.resetForm();

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
                  autoFocus
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
                  disabled={formik.isSubmitting}
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
                <DirectionalIcon ltrIconClass="ri-arrow-left-s-line" rtlIconClass="ri-arrow-right-s-line" />
                <span>{textT?.backToLogin}</span>
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

export default ForgotPassword;
