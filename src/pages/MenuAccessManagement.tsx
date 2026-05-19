import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { roleAPI, menuAPI } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';
import { AlertTriangle, Key, Shield, Menu, Plus, Trash2, Eye, Edit, Trash, FileEdit, RefreshCw } from 'lucide-react';

interface Role {
  id: number;
  role_name: string;
  description: string;
  created_at: string;
}

interface Menu {
  id: number;
  label: string;
  link: string;
  icon: string;
  parent_id: number | null;
  order_index: number;
  is_active: boolean;
}

interface RoleMenu {
  menu_id: number;
  menu_title: string;
  permissions: {
    read: boolean;
    write: boolean;
    edit: boolean;
    delete: boolean;
  };
}

interface RoleMenusResponse {
  role_id: number;
  role_name: string;
  menus: RoleMenu[];
}

export function MenuAccessManagement() {
  const { canRead, canWrite, canDelete } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [roleMenus, setRoleMenus] = useState<RoleMenusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Load roles and menus on component mount
  useEffect(() => {
    if (canRead()) {
      loadRoles();
      loadAllMenus();
    }
  }, []);

  // Load role menus when role is selected
  useEffect(() => {
    if (selectedRole) {
      loadRoleMenus(selectedRole);
    }
  }, [selectedRole]);

  const loadRoles = async () => {
    try {
      const response = await roleAPI.getAllRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Failed to load roles');
    }
  };

  const loadAllMenus = async () => {
    try {
      setIsLoading(true);
      const response = await menuAPI.getAllMenus();
      
      console.log('All menus API response:', response); // Debug log
      
      if (response && response.success && response.data) {
        // Transform API response to expected format
        const menusArray = Array.isArray(response.data) ? response.data : [];
        const transformedMenus = menusArray.map((menu: any) => ({
          id: menu.id,
          label: menu.label || menu.title,
          link: menu.link,
          icon: menu.icon,
          parent_id: menu.parent_id,
          order_index: menu.order_index || 0,
          is_active: menu.is_active !== false
        }));
        
        setAllMenus(transformedMenus);
        toast.success(`Loaded ${transformedMenus.length} system menus`);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Error loading menus:', error);
      toast.error('Failed to load system menus from API');
      
      // Comprehensive fallback menu data matching your API structure
      const fallbackMenus: Menu[] = [
        { id: 1, label: 'Dashboard', link: '/dashboard', icon: 'LayoutDashboard', parent_id: null, order_index: 1, is_active: true },
        { id: 2, label: 'Create Questions', link: '/create-questions', icon: 'Plus', parent_id: null, order_index: 2, is_active: true },
        { id: 3, label: 'All Questions', link: '/all-questions', icon: 'FileText', parent_id: null, order_index: 3, is_active: true },
        { id: 4, label: 'Students', link: '/students', icon: 'Users', parent_id: null, order_index: 4, is_active: true },
        { id: 5, label: 'Exam Schedule', link: '/exam-schedule', icon: 'Calendar', parent_id: null, order_index: 5, is_active: true },
        { id: 6, label: 'Users Management', link: '/users-management', icon: 'UserCheck', parent_id: null, order_index: 6, is_active: true },
        { id: 7, label: 'Role Management', link: '/role-management', icon: 'Shield', parent_id: null, order_index: 7, is_active: true },
        { id: 8, label: 'Menu Management', link: '/menu-management', icon: 'Menu', parent_id: null, order_index: 8, is_active: true },
        { id: 9, label: 'Menu Access Management', link: '/menu-access-management', icon: 'Key', parent_id: null, order_index: 9, is_active: true },
        { id: 10, label: 'Department Management', link: '/department-management', icon: 'Building', parent_id: null, order_index: 10, is_active: true },
        { id: 11, label: 'Subject Management', link: '/subject-management', icon: 'BookOpen', parent_id: null, order_index: 11, is_active: true },
        { id: 12, label: 'Subject Department Mapping', link: '/subject-department-mapping', icon: 'Layers', parent_id: null, order_index: 12, is_active: true }
      ];
      
      setAllMenus(fallbackMenus);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoleMenus = async (roleId: number) => {
    try {
      setIsLoading(true);
      const response = await menuAPI.getRoleMenus(roleId);
      
      console.log('Role menus API response:', response); // Debug log
      
      // Handle different response formats
      let menusArray = [];
      if (Array.isArray(response)) {
        menusArray = response;
      } else if (response && Array.isArray(response.data)) {
        menusArray = response.data;
      } else if (response && response.menus && Array.isArray(response.menus)) {
        menusArray = response.menus;
      } else {
        console.warn('Unexpected API response format:', response);
        menusArray = [];
      }
      
      // Transform API response to expected format
      const transformedMenus = menusArray.map((item: any) => ({
        menu_id: item.menu_details?.id || item.id,
        menu_title: item.menu_details?.label || item.title || item.label,
        permissions: typeof item.permissions === 'string' 
          ? JSON.parse(item.permissions) 
          : item.permissions || { read: false, write: false, edit: false, delete: false }
      }));
      
      const roleMenusData: RoleMenusResponse = {
        role_id: roleId,
        role_name: roles.find(r => r.id === roleId)?.role_name || '',
        menus: transformedMenus
      };
      
      setRoleMenus(roleMenusData);
    } catch (error) {
      console.error('Error loading role menus:', error);
      toast.error('Failed to load role menus');
      
      // Fallback to empty state
      const mockRoleMenus: RoleMenusResponse = {
        role_id: roleId,
        role_name: roles.find(r => r.id === roleId)?.role_name || '',
        menus: []
      };
      setRoleMenus(mockRoleMenus);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignMenu = async (menuId: number, permissions: any) => {
    if (!selectedRole) return;

    if (!canWrite()) {
      toast.error('You do not have permission to assign menu access');
      return;
    }

    try {
      setIsAssigning(true);
      const menuAssignments = [
        {
          menu_id: menuId,
          permissions: permissions
        }
      ];
      
      const response = await menuAPI.assignMenusToRole(selectedRole, menuAssignments);

      toast.success('Menu assigned successfully');
      loadRoleMenus(selectedRole);
    } catch (error) {
      console.error('Error assigning menu:', error);
      toast.error('Failed to assign menu');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveMenu = async (menuId: number) => {
    if (!selectedRole) return;

    if (!canDelete()) {
      toast.error('You do not have permission to remove menu access');
      return;
    }

    try {
      await menuAPI.removeMenuFromRole(selectedRole, menuId);
      toast.success('Menu access removed successfully');
      loadRoleMenus(selectedRole);
    } catch (error) {
      console.error('Error removing menu:', error);
      toast.error('Failed to remove menu access');
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'read': return <Eye className="w-3 h-3" />;
      case 'write': return <Plus className="w-3 h-3" />;
      case 'edit': return <Edit className="w-3 h-3" />;
      case 'delete': return <Trash className="w-3 h-3" />;
      default: return null;
    }
  };

  const isMenuAssigned = (menuId: number) => {
    return roleMenus?.menus.some(rm => rm.menu_id === menuId) || false;
  };

  const getMenuPermissions = (menuId: number) => {
    const roleMenu = roleMenus?.menus.find(rm => rm.menu_id === menuId);
    return roleMenu?.permissions || { read: false, write: false, edit: false, delete: false };
  };

  if (!canRead()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-800">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <Key className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Access Management</h1>
          <p className="text-gray-600">Control which menus are accessible to different roles</p>
        </div>
      </div>

      {/* Role Selection */}
      {!canWrite() && !canDelete() && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You can view menu access, but you do not have permission to grant or remove access.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Select Role
          </CardTitle>
          <CardDescription>Choose a role to manage its menu access permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedRole?.toString() || ''}
            onValueChange={(value) => setSelectedRole(parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a role to manage menu access" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>{role.role_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {role.description}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Menu Access Management */}
      {selectedRole && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Menus */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Menu className="w-5 h-5" />
                    System Menus
                  </CardTitle>
                  <CardDescription>Manage menu access for the selected role</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadAllMenus}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Menus
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="ml-2">Loading system menus...</span>
                </div>
              ) : allMenus.length > 0 ? (
                allMenus
                  .filter(menu => menu.is_active)
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((menu) => {
                  const assigned = isMenuAssigned(menu.id);
                  const permissions = getMenuPermissions(menu.id);

                  return (
                    <div
                      key={menu.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        assigned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Menu className="w-4 h-4" />
                          <span className="font-medium">{menu.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {menu.link}
                          </Badge>
                          {assigned && (
                            <Badge className="text-xs bg-green-100 text-green-800">
                              Access Granted
                            </Badge>
                          )}
                        </div>
                        {assigned ? (
                          canDelete() && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveMenu(menu.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Remove Access
                            </Button>
                          )
                        ) : (
                          canWrite() && (
                            <MenuAccessForm
                              menuId={menu.id}
                              onAssign={handleAssignMenu}
                              isAssigning={isAssigning}
                            />
                          )
                        )}
                      </div>

                      {assigned && (
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">Permissions:</span>
                          {Object.entries(permissions).map(([permission, enabled]) => (
                            <div
                              key={permission}
                              className={`flex items-center gap-1 px-2 py-1 rounded ${
                                enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {getPermissionIcon(permission)}
                              <span className="capitalize">{permission}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Menu className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No system menus available</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadAllMenus}
                    className="mt-2"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Loading
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role Menu Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Access Summary
              </CardTitle>
              <CardDescription>
                Menu access permissions for {roles.find(r => r.id === selectedRole)?.role_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="ml-2">Loading access permissions...</span>
                </div>
              ) : roleMenus && roleMenus.menus.length > 0 ? (
                <div className="space-y-3">
                  {roleMenus.menus.map((roleMenu) => (
                    <div key={roleMenu.menu_id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{roleMenu.menu_title}</span>
                        {canDelete() && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMenu(roleMenu.menu_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {Object.entries(roleMenu.permissions).map(([permission, enabled]) => (
                          enabled && (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {getPermissionIcon(permission)}
                              <span className="ml-1 capitalize">{permission}</span>
                            </Badge>
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    {canWrite()
                      ? 'No menu access has been granted to this role yet. Use the controls on the left to assign menu access.'
                      : 'No menu access has been granted to this role yet.'}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Component for assigning menu access with permissions
interface MenuAccessFormProps {
  menuId: number;
  onAssign: (menuId: number, permissions: any) => void;
  isAssigning: boolean;
}

function MenuAccessForm({ menuId, onAssign, isAssigning }: MenuAccessFormProps) {
  const [permissions, setPermissions] = useState({
    read: true, // Default to read permission
    write: false,
    edit: false,
    delete: false
  });
  const [showForm, setShowForm] = useState(false);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked
    }));
  };

  const handleAssign = () => {
    // Ensure at least read permission is selected
    const finalPermissions = {
      ...permissions,
      read: permissions.read || permissions.write || permissions.edit || permissions.delete
    };
    
    onAssign(menuId, finalPermissions);
    setShowForm(false);
    setPermissions({ read: true, write: false, edit: false, delete: false });
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'read': return <Eye className="w-3 h-3" />;
      case 'write': return <Plus className="w-3 h-3" />;
      case 'edit': return <Edit className="w-3 h-3" />;
      case 'delete': return <Trash className="w-3 h-3" />;
      default: return null;
    }
  };

  const hasAtLeastOnePermission = Object.values(permissions).some(Boolean);

  if (!showForm) {
    return (
      <Button size="sm" onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
        <Plus className="w-3 h-3 mr-1" />
        Grant Access
      </Button>
    );
  }

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-white shadow-sm min-w-[250px]">
      <div className="text-sm font-medium text-gray-900">Select Permissions:</div>
      <div className="space-y-2">
        {Object.entries(permissions).map(([permission, checked]) => (
          <div key={permission} className="flex items-center space-x-2">
            <Checkbox
              id={`${menuId}-${permission}`}
              checked={checked}
              onCheckedChange={(checked) => handlePermissionChange(permission, !!checked)}
            />
            <label
              htmlFor={`${menuId}-${permission}`}
              className="text-sm flex items-center gap-1 cursor-pointer hover:text-blue-600"
            >
              {getPermissionIcon(permission)}
              <span className="capitalize">{permission}</span>
            </label>
          </div>
        ))}
      </div>
      {!hasAtLeastOnePermission && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
          Please select at least one permission
        </div>
      )}
      <div className="flex gap-2">
        <Button 
          size="sm" 
          onClick={handleAssign} 
          disabled={isAssigning || !hasAtLeastOnePermission}
          className="bg-green-600 hover:bg-green-700"
        >
          {isAssigning ? 'Granting...' : 'Grant Access'}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => {
            setShowForm(false);
            setPermissions({ read: true, write: false, edit: false, delete: false });
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
