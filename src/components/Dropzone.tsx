import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, IconButton, List, ListItemAvatar, Avatar, ListItemText, ListItem } from '@mui/material';

import { formatFileSize } from '@libs/utils';

const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type PreviewFile = File & {
  preview?: string;
};

type DropzoneProps = {
  acceptedFiles?: string[];
  dropzoneText?: string;
  dropzoneMaxSizeText?: string;
  onChange?: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  showPreviews?: boolean;
  resetOnDrop?: boolean;
  disabled?: boolean;
};

const formatAcceptedFiles = (acceptedFiles: string[]) => {
  const result: any = {};

  acceptedFiles.forEach((file) => {
    result[file] = [];
  });

  return result;
};

const Dropzone = (props: DropzoneProps) => {
  const {
    acceptedFiles = ['image/*'],
    dropzoneText,
    dropzoneMaxSizeText,
    onChange,
    maxFiles = DEFAULT_MAX_FILES,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    showPreviews = true,
    resetOnDrop = false,
    disabled
  } = props;

  const [files, setFiles] = useState<PreviewFile[]>([]);

  useEffect(() => {
    if (onChange) {
      onChange(files);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const mappedFiles: PreviewFile[] = acceptedFiles
      .filter((file) => file.size <= maxFileSize)
      .map((file) =>
        Object.assign(file, {
          preview: file.type.startsWith('image') ? URL.createObjectURL(file) : undefined
        })
      );

    if (resetOnDrop || maxFiles <= 1) {
      setFiles(mappedFiles);
    } else {
      setFiles((prev) => [...prev, ...mappedFiles]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = (file: PreviewFile) => {
    setFiles((prev) => prev.filter((f) => f !== file));
    if (file.preview) URL.revokeObjectURL(file.preview);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: formatAcceptedFiles(acceptedFiles),
    multiple: maxFiles > 1,
    maxFiles,
    maxSize: maxFileSize,
    noKeyboard: true,
    disabled
  });

  return (
    <Box sx={{ mx: 'auto', mb: 2 }}>
      <Box
        {...getRootProps()}
        sx={{
          border: '1px dashed',
          borderColor: 'text.secondary',
          padding: 10,
          textAlign: 'center',
          borderRadius: 2,
          cursor: 'pointer',
          backgroundColor: isDragActive ? '#f0f0f0' : 'transparent'
        }}>
        <input {...getInputProps()} />
        <Typography>
          <i className="ri-upload-cloud-2-line text-5xl text-secondary mb-1" />
        </Typography>
        <Typography variant="h4" className="text-secondary mb-1">
          {dropzoneText || `Drag & drop some files here, or click to select files`}
        </Typography>
        <Typography className="text-secondary">
          {dropzoneMaxSizeText
            ? dropzoneMaxSizeText.replace('{{ size }}', formatFileSize(maxFileSize))
            : `Max size: ${formatFileSize(maxFileSize)} per file`}
        </Typography>
      </Box>

      {showPreviews && files.length > 0 && (
        <List sx={{ mb: 2 }}>
          {files.map((file, idx) => (
            <ListItem
              key={idx}
              secondaryAction={
                <IconButton edge="end" onClick={() => handleRemove(file)}>
                  <i className="ri-close-circle-fill" />
                </IconButton>
              }>
              <ListItemAvatar>
                <Avatar variant="rounded" src={file.preview} sx={{ bgcolor: !file.preview ? 'grey.300' : undefined }}>
                  {!file.preview && <i className="ri-file-3-fill" />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={file.name}
                secondary={`${file.type || 'Unknown type'} · ${formatFileSize(file.size)}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default Dropzone;
