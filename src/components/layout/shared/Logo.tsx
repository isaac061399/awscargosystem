'use client';

// React Imports
// import type { CSSProperties } from 'react';

// Next Imports
import Image from 'next/image';

// Third-party Imports
// import styled from '@emotion/styled';

// Config Imports
import siteConfig from '@configs/siteConfig';

// type LogoTextProps = {
//   color?: CSSProperties['color'];
// };

// const LogoText = styled.span<LogoTextProps>`
//   color: ${({ color }) => color ?? 'var(--mui-palette-text-primary)'};
//   font-size: 1.25rem;
//   line-height: 1.2;
//   font-weight: 600;
//   letter-spacing: 0.15px;
//   text-transform: uppercase;
//   margin-inline-start: 0px;
// `;

const Logo = () => {
  return (
    <div className="flex items-center min-bs-6 gap-2">
      <Image src={siteConfig.siteLogo} alt={siteConfig.siteName} loading="eager" width={180} height={84} />
      {/* <LogoText>{siteConfig.siteName}</LogoText> */}
    </div>
  );
};

export default Logo;
