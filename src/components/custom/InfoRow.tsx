import { Stack, Typography } from '@mui/material';

type InfoRowProps = {
  label: string;
  value: React.ReactNode;
};

const InfoRow = ({ label, value }: InfoRowProps) => {
  return (
    <Stack direction="row" spacing={2} alignItems="baseline">
      <Typography variant="body1" fontWeight={600} sx={{ width: 195, minWidth: 195 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
        {value && value !== '' ? value : '—'}
      </Typography>
    </Stack>
  );
};

export default InfoRow;
