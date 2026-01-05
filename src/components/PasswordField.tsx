'use client';

import { useState } from 'react';
import { IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material';

const PasswordField = (props: TextFieldProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                edge="end"
                onClick={() => setVisible(!visible)}
                onMouseDown={(e) => e.preventDefault()}
                tabIndex={-1}>
                <i className={visible ? 'ri-eye-line' : 'ri-eye-off-line'} />
              </IconButton>
            </InputAdornment>
          )
        }
      }}
    />
  );
};

export default PasswordField;
