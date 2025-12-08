'use client';

// React Imports
import { useMemo } from 'react';

// Next Imports
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// Third-party Imports
import classnames from 'classnames';

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav';

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses';

import siteConfig from '@/configs/siteConfig';

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav();

  const { t } = useTranslation('common');
  const textT: any = useMemo(() => t('footer', { returnObjects: true, default: {} }), [t]);

  return (
    <div
      className={classnames(verticalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}>
      <p>
        <span>{`© ${new Date().getFullYear()} - ${textT?.prefixAuthor} `}</span>
        <Link href={siteConfig.authorUrl} target="_blank" className="text-primary">
          {siteConfig.authorName}
        </Link>
      </p>
      {!isBreakpointReached && (
        <div className="flex items-center gap-4">
          {textT?.links?.map((l: any, i: number) => (
            <Link
              key={`footerLink${i}`}
              href={l.link || '/'}
              target={l.target !== '' ? l.target : undefined}
              className="text-primary">
              {l.label}
            </Link>
          ))}
          <span>v{siteConfig.version}</span>
        </div>
      )}
    </div>
  );
};

export default FooterContent;
