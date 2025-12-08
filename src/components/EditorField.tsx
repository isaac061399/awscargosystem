'use client';

import dynamic from 'next/dynamic';
import { CircularProgress, FormControl, FormHelperText, FormLabel, Typography } from '@mui/material';
import { type EditorProps } from '@components/editor/Editor';

const Editor = dynamic(() => import('@components/editor/Editor'), {
  ssr: false,
  loading: () => (
    <Typography className="text-center">
      <CircularProgress color="secondary" />
    </Typography>
  )
});

interface EditorFieldProps {
  fullWidth?: boolean;
  required?: boolean;
  label?: string;
  value?: string;
  error?: boolean;
  color?: 'error' | 'primary' | 'secondary' | 'info' | 'success' | 'warning';
  helperText?: string | false;
}

const EditorField = ({
  locale,
  fullWidth,
  required,
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  color,
  helperText,
  disabled,
  fileManager
}: EditorFieldProps & EditorProps) => {
  return (
    <FormControl fullWidth={fullWidth} error={error} color={color}>
      {Boolean(label) && (
        <FormLabel error={error} color={color} className="mb-2">
          {required ? `${label} *` : label}
        </FormLabel>
      )}

      <Editor
        locale={locale}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        fileManager={fileManager}
      />

      {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default EditorField;
