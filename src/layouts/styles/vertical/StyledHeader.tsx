// Third-party Imports
import styled from '@emotion/styled';
import type { CSSObject } from '@emotion/styled';

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses';

// Config Imports
import siteConfig from '@configs/siteConfig';

type StyledHeaderProps = {
  overrideStyles?: CSSObject;
};

const StyledHeader = styled.header<StyledHeaderProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 100%;
  shrink: 0;
  min-block-size: var(--header-height);

  .${verticalLayoutClasses.navbar} {
    position: relative;
    padding-block: 10px;
    padding-inline: ${siteConfig.layoutPadding}px;
    inline-size: 100%;
    margin-inline: auto;
    max-inline-size: ${siteConfig.compactContentWidth}px;
  }

  ${({ overrideStyles }) => overrideStyles}
`;

export default StyledHeader;
