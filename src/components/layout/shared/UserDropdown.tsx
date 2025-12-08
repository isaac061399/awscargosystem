'use client';

// React Imports
import { useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

// Next Imports
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTranslation } from 'react-i18next';

// MUI Imports
import { styled } from '@mui/material/styles';
import {
  Avatar,
  Badge,
  Button,
  ClickAwayListener,
  Divider,
  Fade,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Typography
} from '@mui/material';

// Utils Imports
import { stringAvatar } from '@libs/utils';
import { useAdmin } from '@components/AdminProvider';

// Styled component for badge content
const BadgeContentSpan = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: 'var(--mui-palette-success-main)',
  boxShadow: '0 0 0 2px var(--mui-palette-background-paper)'
});

const UserDropdown = () => {
  // Hooks
  const router = useRouter();
  const { data: admin } = useAdmin();

  const { t } = useTranslation('common');
  const textT: any = useMemo(() => t('navbar', { returnObjects: true, default: {} }), [t]);

  // States
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // Refs
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleDropdownOpen = (event: MouseEvent<HTMLDivElement>) => {
    setOpen((prevState) => !prevState);
    setAnchorEl(event.currentTarget);
  };

  const handleDropdownClose = (event?: MouseEvent<HTMLLIElement> | (MouseEvent | TouchEvent), url?: string) => {
    if (url) {
      router.push(url);
    }

    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return;
    }

    setOpen(false);
  };

  return (
    <>
      <Badge
        ref={anchorRef}
        overlap="circular"
        badgeContent={<BadgeContentSpan onClick={handleDropdownOpen} />}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className="mis-2">
        <Avatar
          ref={anchorRef}
          onClick={handleDropdownOpen}
          className="cursor-pointer bs-[38px]! is-[38px]!"
          alt={`${admin?.name}`}
          {...stringAvatar(`${admin?.name}`)}
        />
      </Badge>
      <Popper
        open={open}
        transition
        disablePortal
        placement="bottom-end"
        anchorEl={anchorEl}
        className="min-is-60 mbs-4! z-1">
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top'
            }}>
            <Paper className="shadow-lg!">
              <ClickAwayListener onClickAway={(e) => handleDropdownClose(e as MouseEvent | TouchEvent)}>
                <MenuList>
                  <div className="flex items-center plb-2 pli-4 gap-2" tabIndex={-1}>
                    <Avatar alt={`${admin?.name}`} {...stringAvatar(`${admin?.name}`)} />
                    <div className="flex items-start flex-col">
                      <Typography className="font-medium" color="text.primary">
                        {admin?.name}
                      </Typography>
                      <Typography variant="caption">{`${admin?.role}`}</Typography>
                    </div>
                  </div>
                  <Divider className="mlb-1!" />
                  <MenuItem className="gap-3">
                    <Link href={`/profile`} className="flex items-start gap-2">
                      <i className="ri-user-3-line" />
                      <Typography color="text.primary">{textT?.myProfile}</Typography>
                    </Link>
                  </MenuItem>
                  <div className="flex items-center plb-2 pli-4">
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      size="small"
                      endIcon={<i className="ri-logout-box-r-line" />}
                      onClick={() => signOut()}
                      sx={{ '& .MuiButton-endIcon': { marginInlineStart: 1.5 } }}>
                      {textT?.logout}
                    </Button>
                  </div>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};

export default UserDropdown;
