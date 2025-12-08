'use client';

// React Imports
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

// MUI Imports
import { Alert, Button, Card, CardContent, Divider, FormControlLabel, Grid, Switch, Typography } from '@mui/material';

// Components Imports
import TextInfo from '@components/TextInfo';

// Helpers Imports
import { requestEditUser } from '@helpers/request';
import { userProviders } from '@libs/constants';

const defaultAlertState = { open: false, type: 'success', message: '' };

const Profile = ({ user }: { user: any }) => {
  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('users-edition:tabs.profile', { returnObjects: true, default: {} }), [t]);

  const [status, setStatus] = useState<boolean>(user.enabled);
  const [loading, setLoading] = useState<boolean>(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const handleSave = async () => {
    setLoading(true);
    setAlertState({ ...defaultAlertState });

    try {
      const result = await requestEditUser(user.id, { enabled: status }, i18n.language);

      setLoading(false);

      if (!result.valid) {
        return setAlertState({ open: true, type: 'error', message: result.message || textT?.errorMessage });
      }

      setAlertState({ open: true, type: 'success', message: textT?.successMessage });

      setTimeout(() => {
        setAlertState({ ...defaultAlertState });
      }, 5000);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // console.error(error);
      return setAlertState({ open: true, type: 'error', message: textT?.errorMessage });
    }
  };

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextInfo label={textT?.labels?.name} value={user.name} />
                <TextInfo label={textT?.labels?.email} value={user.email} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextInfo
                  label={textT?.labels?.emailNotifications}
                  value={user.email_notifications ? textT?.labels?.active : textT?.labels?.inactive}
                />
                <TextInfo
                  label={textT?.labels?.pushNotifications}
                  value={user.push_notifications ? textT?.labels?.active : textT?.labels?.inactive}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="medium"
                      checked={status}
                      onChange={(e) => {
                        setStatus(e.target.checked);
                      }}
                    />
                  }
                  label={textT?.labels?.enabled}
                />
              </Grid>
              {alertState.open && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity={alertState.type}>{alertState.message}</Alert>
                </Grid>
              )}
              <Grid size={{ xs: 12 }} className="flex gap-4 flex-wrap">
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  loading={loading}
                  startIcon={<i className="ri-save-line" />}>
                  {textT?.btnSave}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
          <Divider />
          <CardContent>
            <Typography variant="h4" className="flex gap-3 items-center mb-4">
              <i className="ri-device-line text-3xl"></i> {textT?.accountsTitle}
            </Typography>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                {user.accounts?.length === 0 ? (
                  <Typography>{textT?.noAccountsText}</Typography>
                ) : (
                  <>
                    {user.accounts.map((a: any, index: number) => (
                      <TextInfo
                        key={`account${index}`}
                        label="ID"
                        value={a.provider_id}
                        icon={<i className={userProviders[a.provider as keyof typeof userProviders]?.icon} />}
                      />
                    ))}
                  </>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Profile;
