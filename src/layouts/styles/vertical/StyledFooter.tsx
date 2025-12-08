// Third-party Imports
import styled from '@emotion/styled';
import type { CSSObject } from '@emotion/styled';

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses';

// Config Imports
import siteConfig from '@configs/siteConfig';

type StyledFooterProps = {
  overrideStyles?: CSSObject;
};

const StyledFooter = styled.footer<StyledFooterProps>`
  margin-inline: auto;
  max-inline-size: ${siteConfig.compactContentWidth}px;

  & .${verticalLayoutClasses.footerContentWrapper} {
    padding-block: 15px;
    padding-inline: ${siteConfig.layoutPadding}px;
  }

  ${({ overrideStyles }) => overrideStyles}
`;

export default StyledFooter;
