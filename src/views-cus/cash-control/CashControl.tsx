'use client';

// React Imports
import { useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';

// MUI Imports
import { Alert, Card, CardContent, CardHeader, Divider, Grid, Typography } from '@mui/material';

// Component Imports
import DashboardLayout from '@/components/layout/DashboardLayout';
import CashControlToOpen from './CashControlToOpen';
import CashControlToClose from './CashControlToClose';
import CashControlClosed from './CashControlClosed';

// Utils Imports
import { CashRegisterStatus } from '@/prisma/generated/enums';

const defaultAlertState = { open: false, type: 'success', message: '' };

const CashControl = ({ cashRegister }: { cashRegister?: any }) => {
  const { t } = useTranslation();
  const textT: any = useMemo(() => t('cash-control:text', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const isReadyToOpen = !cashRegister;
  const isReadyToClose = cashRegister && cashRegister.status === CashRegisterStatus.OPEN;
  const isClosed = cashRegister && cashRegister.status === CashRegisterStatus.CLOSED;

  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className="flex items-center justify-between mb-3">
            <Typography variant="h3" className="flex items-center gap-1">
              {textT?.title}
            </Typography>
            <div className="flex items-center gap-2"></div>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Card>
            {alertState.open && <CardHeader title={<Alert severity={alertState.type}>{alertState.message}</Alert>} />}

            <CardContent>
              {isReadyToOpen ? (
                <CashControlToOpen setAlertState={setAlertState} />
              ) : isReadyToClose ? (
                <CashControlToClose cashRegister={cashRegister} setAlertState={setAlertState} />
              ) : isClosed ? (
                <CashControlClosed cashRegister={cashRegister} />
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default CashControl;
