'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { requestGetMediaSignedUrl, requestNewMedia, requestUploadMedia } from '@helpers/request';

import Dropzone from '@components/Dropzone';

interface MediaLibraryAddProps {
  onFinish: () => void;
}

const maxImageSizeUpload = 5 * 1024 * 1024; // 5MB

const defaultAlertState = { open: false, type: 'success', message: '' };

const MediaLibraryAdd = ({ onFinish }: MediaLibraryAddProps) => {
  const { t, i18n } = useTranslation();
  const textT: any = useMemo(() => t('media-selector:add', { returnObjects: true, default: {} }), [t]);

  const [open, setOpen] = useState(false);
  const [alertState, setAlertState] = useState<any>({ ...defaultAlertState });

  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [filesUploadProcess, setFilesUploadProcess] = useState<string[]>([]);

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    if (isUploading) return;

    setOpen(false);
    restartStates();
  };

  const handleUpload = async () => {
    setAlertState({ ...defaultAlertState });

    if (!files || files.length === 0) {
      setAlertState({ open: true, type: 'error', message: textT?.upload?.noFiles });

      return;
    }

    setIsUploading(true);

    const resultUpload = await Promise.all(
      files.map(async (file, index) => {
        const result = await uploadFile(file, index);

        return { file: file.name, result };
      })
    );

    const errorsUpload = resultUpload.reduce<string[]>(function (filtered, option) {
      if (!option.result) {
        filtered.push(option.file);
      }

      return filtered;
    }, []);

    if (errorsUpload.length === 0) {
      setAlertState({ open: true, type: 'success', message: textT?.upload?.success });
    } else if (errorsUpload.length === files.length) {
      setAlertState({ open: true, type: 'error', message: textT?.upload?.error });
    } else {
      const message = `${textT?.upload?.warning} ${errorsUpload.join(', ')}`;

      setAlertState({ open: true, type: 'warning', message });
    }

    setTimeout(() => {
      handleClose();
      onFinish();
    }, 5000);
  };

  const uploadFile = async (file: File, index: number) => {
    // get signed url for upload
    const signedUrlResult = await requestGetMediaSignedUrl(
      {
        fileName: file.name,
        fileType: file.type
      },
      i18n.language
    );

    if (!signedUrlResult.valid) {
      return false;
    }

    // upload file to s3
    const uploadResult = await requestUploadMedia(signedUrlResult.url, file, (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);

        setFilesUploadProcess((prevState) => {
          const newState = [...prevState];

          newState[index] = `${textT?.upload?.uploading} ${file.name} (${percent}%)`;

          return newState;
        });
      }
    });

    if (!uploadResult) {
      return false;
    }

    // get image data
    const imageData: any = await loadImageData(file);

    // save media data
    const saveResult = await requestNewMedia(
      {
        src: signedUrlResult.key,
        thumbnail: signedUrlResult.key,
        name: file.name,
        size: file.size,
        type: file.type,
        width: imageData?.width,
        height: imageData?.height
      },
      i18n.language
    );

    if (!saveResult.valid) {
      return false;
    }

    return true;
  };

  const loadImageData = async (file: File) => {
    return new Promise((resolve) => {
      const img = new Image();

      img.src = URL.createObjectURL(file);

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
    });
  };

  const restartStates = () => {
    setFiles([]);
    setFilesUploadProcess([]);
    setIsUploading(false);
    setAlertState({ ...defaultAlertState });
  };

  return (
    <>
      <Button
        size="small"
        variant="contained"
        color="primary"
        onClick={handleOpen}
        startIcon={<i className="ri-add-large-line" />}>
        {textT?.btnAdd}
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
        aria-labelledby="media-create-title">
        <DialogTitle id="media-create-title">{textT?.dialogTitle}</DialogTitle>
        <DialogContent dividers>
          <Dropzone
            acceptedFiles={['image/*']}
            dropzoneText={textT?.dropzone?.text}
            dropzoneMaxSizeText={textT?.dropzone?.maxSizeText}
            onChange={(files) => setFiles(files)}
            maxFiles={10}
            maxFileSize={maxImageSizeUpload}
            showPreviews
          />

          {filesUploadProcess.length > 0 && (
            <Box sx={{ mt: 3 }}>
              {filesUploadProcess.map((process, index) => (
                <Typography key={`uploadingProcess${index}`}>{process}</Typography>
              ))}
            </Box>
          )}

          {alertState.open && (
            <Alert severity={alertState.type} sx={{ mt: 3 }}>
              {alertState.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="secondary" onClick={handleClose} disabled={isUploading}>
            {textT?.btnCancel}
          </Button>
          <Button variant="contained" color="primary" onClick={handleUpload} loading={isUploading}>
            {textT?.btnUpload}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MediaLibraryAdd;
