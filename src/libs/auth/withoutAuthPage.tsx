import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { getAdminSessionData } from '@controllers/Administrator.Controller';

import authOptions from '@libs/auth/authOptions';

const withoutAuthPage = (Component: any) => {
  return async function WithPageAuth(props: any) {
    const session = await getServerSession(authOptions);

    if (session) {
      const admin = await getAdminSessionData(session?.user?.email);

      if (admin) {
        redirect('/');
      }
    }

    return <Component {...props} />;
  };
};

export default withoutAuthPage;
