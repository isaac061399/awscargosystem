'use client';

// React Imports
import { useState } from 'react';

// Next Imports
import Image from 'next/image';

// MUI Imports
import {
  Box,
  ButtonBase,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Typography
} from '@mui/material';

import MediaLibrarySelector from '@components/media-selector/MediaLibrarySelector';

interface ImageFieldProps {
  fullWidth?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  value?: any;
  onChange?: (media: any) => void;
  error?: boolean;
  color?: 'error' | 'primary' | 'secondary' | 'info' | 'success' | 'warning';
  helperText?: string | false;
  disabled?: boolean;
  fileManager?: { title: string; canAdd: boolean; canDelete: boolean };
}

const ImageField = ({
  fullWidth,
  required,
  label,
  placeholder,
  value,
  onChange,
  error,
  color,
  helperText,
  disabled,
  fileManager
}: ImageFieldProps) => {
  const [fileManagerOpen, setFileManagerOpen] = useState(false);

  const handleFileManagerOpen = () => {
    if (disabled) return;
    setFileManagerOpen(true);
  };

  const handleFileManagerClose = () => {
    setFileManagerOpen(false);
  };

  const handleFileManagerSelect = (media: any) => {
    if (disabled) return;

    if (onChange) {
      onChange(media);
    }

    handleFileManagerClose();
  };

  return (
    <FormControl fullWidth={fullWidth} error={error} color={color}>
      {Boolean(label) && (
        <FormLabel error={error} color={color} className="mb-2">
          {required ? `${label} *` : label}
        </FormLabel>
      )}

      {value ? (
        <Card variant="outlined">
          <CardHeader subheader={value.name} className="text-center" sx={{ p: 2 }} />
          <Box
            sx={{
              flex: 1,
              width: '100%',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden'
            }}>
            <Image
              src={value.thumbnail}
              alt={value.name}
              width={250}
              height={150}
              style={{
                objectFit: 'contain',
                maxHeight: '100%',
                maxWidth: '100%'
              }}
            />
          </Box>
          <CardActions className="flex item-center justify-center gap-3" sx={{ p: 2 }}>
            <IconButton>
              <i className="ri-edit-2-line" onClick={() => handleFileManagerOpen()} />
            </IconButton>
            <IconButton>
              <i className="ri-delete-bin-2-line" onClick={() => handleFileManagerSelect(null)} />
            </IconButton>
          </CardActions>
        </Card>
      ) : (
        <Card variant="outlined">
          <ButtonBase onClick={() => handleFileManagerOpen()} sx={{ width: '100%' }}>
            <CardContent className="flex flex-col justify-center" sx={{ height: 200 }}>
              <Typography className="mb-4">
                <i className="ri-image-2-line text-6xl"></i>
              </Typography>
              {placeholder && <Typography>{placeholder}</Typography>}
            </CardContent>
          </ButtonBase>
        </Card>
      )}

      {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}

      {fileManagerOpen && (
        <Dialog open={true} onClose={handleFileManagerClose} fullWidth maxWidth="lg">
          <DialogContent>
            <MediaLibrarySelector
              title={fileManager?.title}
              canAdd={fileManager?.canAdd}
              canDelete={fileManager?.canDelete}
              onSelect={handleFileManagerSelect}
              onCancel={handleFileManagerClose}
            />
          </DialogContent>
        </Dialog>
      )}
    </FormControl>
  );
};

export default ImageField;
