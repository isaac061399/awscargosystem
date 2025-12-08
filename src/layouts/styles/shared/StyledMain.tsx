// Third-party Imports
import styled from '@emotion/styled';

// Config Imports
import siteConfig from '@configs/siteConfig';

type StyledMainProps = {
  isContentCompact: boolean;
};

const StyledMain = styled.main<StyledMainProps>`
  padding: ${siteConfig.layoutPadding}px;
  ${({ isContentCompact }) =>
    isContentCompact &&
    `
    margin-inline: auto;
    max-inline-size: ${siteConfig.compactContentWidth}px;
  `}
`;

export default StyledMain;
