'use client';

import { Typography, type SxProps } from '@mui/material';

interface TextInfoProps {
  label: string;
  value: string;
  icon?: React.ReactElement;
}

const sxTextField: SxProps = {
  width: '100%',
  borderBottom: 'thin solid var(--mui-palette-divider)',
  padding: '8px 0',
  marginBottom: '20px',
  cursor: 'text'
};

const TextInfo = (props: TextInfoProps) => {
  const { label, value, icon } = props;

  return (
    <Typography className="flex gap-3 items-center" sx={sxTextField}>
      {icon} {label}: <strong>{value}</strong>
    </Typography>
  );
};

export default TextInfo;
