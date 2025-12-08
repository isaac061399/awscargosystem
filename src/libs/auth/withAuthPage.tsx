import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { getAdminSessionData } from '@controllers/Administrator.Controller';
import { hasAllPermissions } from '@helpers/permissions';

import authOptions from '@libs/auth/authOptions';

const withAuthPage = (requiredPermissions: string[], Component: any) => {
  return async function WithPageAuth(props: any) {
    const session = await getServerSession(authOptions);

    if (!session) {
      redirect('/auth/login');
    }

    const admin = await getAdminSessionData(session?.user?.email);

    if (!admin) {
      redirect('/auth/login');
    }

    if (!hasAllPermissions(requiredPermissions, admin.permissions)) {
      redirect('/unauthorized');
    }

    return <Component {...props} />;
  };
};

export default withAuthPage;
