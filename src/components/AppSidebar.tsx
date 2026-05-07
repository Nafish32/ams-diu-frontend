import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMenu, iconMap } from '../contexts/MenuContext';
import { Button } from './ui/button';
// @ts-ignore
import logoImage from '../assets/logo.png';
import toast from 'react-hot-toast';
import { Link, useLocation } from 'react-router-dom';
import { menuToGroupMapping, groupOrder } from '../config/menuMapping';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { menuItems, isLoading } = useMenu();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <Sidebar className="border-r-2 border-indigo-500" collapsible="icon">
      <div className="h-16 flex items-center px-6 bg-gradient-to-r from-[#2E3094] to-[#4C51BF] text-white border-b border-white-200 shrink-0">
        <div className="flex items-center w-full min-w-0 gap-3">
          <img 
            src={logoImage} 
            alt="Admin Panel Logo" 
            className="flex-shrink-0 object-contain h-10"
          />
        </div>
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Navigation</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <SidebarMenuItem>
                  <div className="flex items-center gap-3 px-3 py-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full border-t-blue-500 animate-spin"></div>
                    <span>Loading menu...</span>
                  </div>
                </SidebarMenuItem>
              ) : (
                (() => {
                  // Normalize: lowercase and collapse spaces
                  const normalize = (s: string) => s?.toLowerCase().replace(/\s+/g, ' ').trim();

                  // Check if item is dashboard
                  const isDashboardItem = (item: any) => {
                    const nLabel = normalize(item?.label || '');
                    const nLink = normalize(item?.link || '');
                    return (
                      nLabel === 'dashboard' ||
                      nLabel.startsWith('dashboard') ||
                      item?.icon === 'LayoutDashboard' ||
                      nLink === '/dashboard' ||
                      nLink.endsWith('dashboard')
                    );
                  };

                  // Whole-word matching: normalize both label and mapping keys, then match
                  const getMatchingGroup = (label: string): { group: string; order: number } | null => {
                    const nLabel = normalize(label);
                    for (const key of Object.keys(menuToGroupMapping)) {
                      const nKey = normalize(key);
                      if (nLabel === nKey) {
                        return menuToGroupMapping[key];
                      }
                    }
                    return null;
                  };

                  // Separate dashboard, grouped, and ungrouped items
                  const dashboardItems = menuItems.filter((item) => isDashboardItem(item));
                  const nonDashboardItems = menuItems.filter((item) => !isDashboardItem(item));

                  const groupBuckets: Record<string, any[]> = {};
                  const other: any[] = [];

                  groupOrder.forEach((groupName) => (groupBuckets[groupName] = []));

                  nonDashboardItems.forEach((item) => {
                    const result = getMatchingGroup(item.label || '');
                    if (result && groupBuckets[result.group]) {
                      // Add order to item for sorting
                      groupBuckets[result.group].push({ ...item, _order: result.order });
                    } else {
                      other.push(item);
                    }
                  });

                  // Sort items within each group by order
                  Object.keys(groupBuckets).forEach((groupName) => {
                    groupBuckets[groupName].sort((a, b) => (a._order || 999) - (b._order || 999));
                  });

                  // Render dashboard first, then groups, then other
                  return (
                    <>
                      {/* DASHBOARD AT TOP */}
                      {dashboardItems.map((item: any) => {
                        const Icon = iconMap[item.icon] || iconMap['LayoutDashboard'];
                        const isActive = location.pathname === item.link;
                        return (
                          <SidebarMenuItem key={item.id}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className={
                                isActive
                                  ? 'bg-gradient-to-r from-[#2E3094] to-[#4C51BF] text-white hover:bg-gradient-to-r hover:from-[#2E3094] hover:to-[#4C51BF] hover:text-white [&_svg]:text-white'
                                  : 'hover:bg-gray-100'
                              }
                            >
                              <Link to={item.link} className={isActive ? 'text-white' : ''}>
                                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                                <span className={isActive ? 'text-white' : ''}>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}

                      {/* GROUPS IN ORDER */}
                      {groupOrder.map((groupName) => {
                        const items = groupBuckets[groupName] || [];
                        if (!items.length) return null;
                        return (
                          <React.Fragment key={groupName}>
                            <SidebarGroupLabel className="px-3 mt-3 text-xs tracking-wide text-gray-500 uppercase">{groupName}</SidebarGroupLabel>
                            {items.map((item: any) => {
                              const Icon = iconMap[item.icon] || iconMap['LayoutDashboard'];
                              const isActive = location.pathname === item.link;
                              return (
                                <SidebarMenuItem key={item.id}>
                                  <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    className={
                                      isActive
                                        ? 'bg-gradient-to-r from-[#2E3094] to-[#4C51BF] text-white hover:bg-gradient-to-r hover:from-[#2E3094] hover:to-[#4C51BF] hover:text-white [&_svg]:text-white'
                                        : 'hover:bg-gray-100'
                                    }
                                  >
                                    <Link to={item.link} className={isActive ? 'text-white' : ''}>
                                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                                      <span className={isActive ? 'text-white' : ''}>{item.label}</span>
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}

                      {/* OTHER */}
                      {other.length > 0 && (
                        <>
                          <SidebarGroupLabel className="px-3 mt-3 text-xs tracking-wide text-gray-500 uppercase">Other</SidebarGroupLabel>
                          {other.map((item: any) => {
                            const Icon = iconMap[item.icon] || iconMap['LayoutDashboard'];
                            const isActive = location.pathname === item.link;
                            return (
                              <SidebarMenuItem key={item.id}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={isActive}
                                  className={isActive ? 'bg-gradient-to-r from-[#2E3094] to-[#4C51BF] text-white hover:bg-gradient-to-r hover:from-[#2E3094] hover:to-[#4C51BF] hover:text-white [&_svg]:text-white' : 'hover:bg-gray-100'}
                                >
                                  <Link to={item.link} className={isActive ? 'text-white' : ''}>
                                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                                    <span className={isActive ? 'text-white' : ''}>{item.label}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </>
                      )}
                    </>
                  );
                })()
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className="px-3 py-4 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[#2E3094] to-[#4C51BF] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{user?.username}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.role_details?.role_name}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="w-full text-red-600 border-red-200 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
