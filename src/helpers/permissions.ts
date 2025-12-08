export const hasAllPermissions = (permissions: string | string[], adminPermissions: string[]) => {
  const array = Array.isArray(permissions) ? permissions : [permissions];

  if (permissions.length === 0) return true;

  for (let i = 0; i < array.length; i++) {
    if (!adminPermissions.includes(array[i])) {
      return false;
    }
  }

  return true;
};

export const hasAtLeastOnePermission = (permissions: string | string[], adminPermissions: string[]) => {
  const array = Array.isArray(permissions) ? permissions : [permissions];

  if (permissions.length === 0) return true;

  for (let i = 0; i < array.length; i++) {
    if (adminPermissions.includes(array[i])) {
      return true;
    }
  }

  return false;
};
