'use client';

// React Imports
import { useMemo } from 'react';

// Next Imports
import { useTranslation } from 'react-i18next';

// MUI Imports
import {
  Card,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

// Styles Imports
import tableStyles from '@core/styles/table.module.css';

const AdminsTable = ({ admins }: { admins: any[] }) => {
  const { t } = useTranslation();
  const textT: any = useMemo(() => t('home:text.admins', { returnObjects: true, default: {} }), [t]);

  return (
    <Card>
      <div className="overflow-x-auto">
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small" className={tableStyles.table}>
            <TableHead>
              <TableRow>
                <TableCell align="center">{textT?.administrator}</TableCell>
                <TableCell align="center">{textT?.email}</TableCell>
                <TableCell align="center">{textT?.role}</TableCell>
                <TableCell align="center">{textT?.status}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admins.map((admin, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <Typography color="text.primary" className="font-medium">
                          {admin.full_name}
                        </Typography>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Typography>{admin.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Typography color="text.primary">{admin.role.name}</Typography>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      className="capitalize"
                      variant="tonal"
                      color={admin.user.enabled ? 'success' : 'secondary'}
                      label={admin.user.enabled ? textT?.active : textT?.inactive}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </Card>
  );
};

export default AdminsTable;
