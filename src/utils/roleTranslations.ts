export const getRoleDisplayName = (roleName: string): string => {
  switch (roleName) {
    case 'coordinador':
      return 'Coordinador';
    case 'familyviewer':
      return 'Familiar';
    case 'familyadmin':
      return 'Tutor';
    case 'adminaccount':
      return 'Administrador';
    case 'superadmin':
      return 'Super Administrador';
    default:
      return roleName || 'Sin rol';
  }
};

export const getRoleColor = (roleName: string): string => {
  switch (roleName) {
    case 'coordinador':
      return 'bg-purple-100 text-purple-800';
    case 'familyviewer':
      return 'bg-blue-100 text-blue-800';
    case 'familyadmin':
      return 'bg-green-100 text-green-800';
    case 'adminaccount':
      return 'bg-orange-100 text-orange-800';
    case 'superadmin':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
