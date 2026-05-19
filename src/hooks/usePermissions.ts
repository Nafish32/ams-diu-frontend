import { useMenu } from '../contexts/MenuContext';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { menuItems } = useMenu();
  const { isSuperAdmin } = useAuth();
  const location = useLocation();

  const getCurrentMenuPermissions = () => {
    if (isSuperAdmin) {
      return {
        edit: true,
        read: true,
        write: true,
        delete: true
      };
    }

    const currentMenu = menuItems.find(menu => menu.link === location.pathname);
    return currentMenu?.permissions || {
      edit: false,
      read: false,
      write: false,
      delete: false
    };
  };

  const hasPermission = (permission: 'read' | 'write' | 'edit' | 'delete') => {
    const permissions = getCurrentMenuPermissions();
    return permissions[permission];
  };

  const canRead = () => hasPermission('read');
  const canWrite = () => hasPermission('write');
  const canEdit = () => hasPermission('edit');
  const canDelete = () => hasPermission('delete');

  return {
    permissions: getCurrentMenuPermissions(),
    hasPermission,
    canRead,
    canWrite,
    canEdit,
    canDelete
  };
};
