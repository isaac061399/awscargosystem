'use client';

// React Imports
import { useMemo, useState } from 'react';

// Next Imports
import { useTranslation } from 'react-i18next';

// MUI Imports
import { Button, Tooltip } from '@mui/material';

// Utils Imports
import { requestCleanCache } from '@/helpers/request';

type ClearCacheButtonProps = {
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  onlyIcon?: boolean;
  route?: string;
};

const ClearCacheButton = ({ variant, size, onlyIcon, route }: ClearCacheButtonProps) => {
  // Hooks
  const { t, i18n } = useTranslation('common');
  const textT: any = useMemo(() => t('cache', { returnObjects: true, default: {} }), [t]);

  // States
  const [iconState, setIconState] = useState<'normal' | 'loading' | 'success' | 'error'>('normal');

  const handleOnClick = async () => {
    setIconState('loading');

    const result = await requestCleanCache(i18n.language, route);

    if (!result.valid) {
      setIconState('error');
    } else {
      setIconState('success');
    }

    setTimeout(() => {
      setIconState('normal');
    }, 3000);
  };

  if (process.env.CACHE_ENABLED !== 'true') {
    return null;
  }

  const iconClass =
    iconState === 'normal'
      ? 'ri-brush-2-line'
      : iconState === 'loading'
        ? 'ri-loader-4-line animate-spin'
        : iconState === 'success'
          ? 'ri-check-line'
          : 'ri-error-warning-line';

  const tooltipText =
    iconState === 'normal'
      ? textT?.btnClearCache
      : iconState === 'loading'
        ? textT?.btnClearCache
        : iconState === 'success'
          ? textT?.msgCacheCleared
          : textT?.errorMsgCacheCleared;

  return (
    <Tooltip title={tooltipText} open={iconState === 'success'}>
      <Button
        variant={variant}
        color="error"
        onClick={handleOnClick}
        disabled={iconState === 'loading'}
        size={size}
        startIcon={!onlyIcon && <i className={iconClass} />}>
        {onlyIcon && <i className={iconClass} />}
        {!onlyIcon && textT?.btnClearCache}
      </Button>
    </Tooltip>
  );
};

export default ClearCacheButton;
