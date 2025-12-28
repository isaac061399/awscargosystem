'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { currencies } from '@/libs/constants';

import { useConfig } from './ConfigProvider';
import { formatMoney } from '@/libs/utils';

export default function ExchangeComponent() {
  const { configuration } = useConfig();
  const sellingRate = configuration ? configuration.selling_exchange_rate : 0;
  const buyingRate = configuration ? configuration.buying_exchange_rate : 0;

  const { t } = useTranslation('common');
  const textT: any = useMemo(() => t('navbar', { returnObjects: true, default: {} }), [t]);

  return (
    <div className="text-xs text-gray-600 mr-3">
      <span className="whitespace-nowrap">
        {textT?.sellValue} {currencies.USD.symbol}:{' '}
        <span className="font-semibold text-gray-900">{formatMoney(sellingRate, `${currencies.CRC.symbol} `)}</span>
        <span className="mx-1 text-gray-400">|</span>
        {textT?.buyValue} {currencies.USD.symbol}:{' '}
        <span className="font-semibold text-gray-900">{formatMoney(buyingRate, `${currencies.CRC.symbol} `)}</span>
      </span>
    </div>
  );
}
