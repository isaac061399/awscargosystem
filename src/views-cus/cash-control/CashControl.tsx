'use client';

// React Imports
import { useMemo, useState } from 'react';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// MUI Imports
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography
} from '@mui/material';

// Component Imports
import DashboardLayout from '@/components/layout/DashboardLayout';
import CashControlToOpen from './CashControlToOpen';
import CashControlToClose from './CashControlToClose';
import CashControlClosed from './CashControlClosed';

// Utils Imports
import { CashRegisterStatus } from '@/prisma/generated/enums';

const defaultAlertState = { open: false, type: 'success', message: '' };

const CashControl = ({ cashRegister, redirect }: { cashRegister?: any; redirect?: string }) => {
  const { t } = useTranslation();
  const textT: any = useMemo(() => t('cash-control:text', { returnObjects: true, default: {} }), [t]);

  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });
  const [successOpen, setSuccessOpen] = useState(false);

  const isReadyToOpen = !cashRegister;
  const isReadyToClose = cashRegister && cashRegister.status === CashRegisterStatus.OPEN;
  const isClosed = cashRegister && cashRegister.status === CashRegisterStatus.CLOSED;

  const handlePrintTicket = async () => {
    const pdfUrl = `/api/cash-registers/today-ticket`;
    const win = window.open(pdfUrl, '_blank');

    if (win) {
      // Auto print when the new tab loads
      win.onload = () => {
        win.print();
      };
    }
  };

  return (
    <DashboardLayout>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <div className="flex items-center justify-between mb-3">
            <Typography variant="h3" className="flex items-center gap-1">
              {textT?.title}
            </Typography>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="small"
                variant="contained"
                color="primary"
                startIcon={<i className="ri-printer-line" />}
                onClick={handlePrintTicket}>
                {textT?.btnPrint}
              </Button>
            </div>
          </div>
          <Divider />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Card>
            {alertState.open && <CardHeader title={<Alert severity={alertState.type}>{alertState.message}</Alert>} />}

            <CardContent>
              {isReadyToOpen ? (
                <CashControlToOpen setAlertState={setAlertState} redirect={redirect} />
              ) : isReadyToClose ? (
                <CashControlToClose
                  cashRegister={cashRegister}
                  setAlertState={setAlertState}
                  setSuccessOpen={setSuccessOpen}
                />
              ) : isClosed ? (
                <CashControlClosed cashRegister={cashRegister} />
              ) : null}
            </CardContent>

            {/* Success dialog */}
            <Dialog
              open={successOpen}
              onClose={() => {}} // disable close on outside click
              aria-labelledby="dialog-success-title"
              maxWidth="xs"
              fullWidth>
              <DialogTitle id="dialog-success-title">{textT?.dialogSuccess?.title}</DialogTitle>
              <DialogContent dividers className="flex flex-col gap-6">
                <Stack direction="column" spacing={2}>
                  <Button
                    LinkComponent={Link}
                    variant="contained"
                    color="primary"
                    href={`/print/cash-register/${cashRegister.id}?or=1`}
                    target="_blank">
                    {textT?.dialogSuccess?.print}
                  </Button>
                  <Button variant="outlined" color="primary" onClick={() => setSuccessOpen(false)}>
                    {textT?.dialogSuccess?.close}
                  </Button>
                </Stack>
              </DialogContent>
            </Dialog>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default CashControl;
