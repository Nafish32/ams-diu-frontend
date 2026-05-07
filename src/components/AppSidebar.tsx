import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMenu, iconMap } from '../contexts/MenuContext';
import { Button } from './ui/button';
// @ts-ignore
import logoImage from '../assets/logo.png';
import toast from 'react-hot-toast';
import { Link, useLocation } from 'react-router-dom';
import { menuGroupsConfig } from '../config/menuGroups';
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
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
                  // Group definitions imported from config/menuGroups.ts
                  const groupsConfig = menuGroupsConfig;

                  const normalize = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]+/g, '').trim();

                  // Small Levenshtein implementation for tolerant matching
                  const levenshtein = (a: string, b: string) => {
                    if (!a || !b) return Math.max(a?.length || 0, b?.length || 0);
                    const m = a.length;
                    const n = b.length;
                    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
                    for (let i = 0; i <= m; i++) dp[i][0] = i;
                    for (let j = 0; j <= n; j++) dp[0][j] = j;
                    for (let i = 1; i <= m; i++) {
                      for (let j = 1; j <= n; j++) {
                        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
                      }
                    }
                    return dp[m][n];
                  };

                  // Initialize buckets
                  const groupBuckets: Record<string, any[]> = {};
                  Object.keys(groupsConfig).forEach((g) => (groupBuckets[g] = []));
                  const ungrouped: any[] = [];

                  // Assign items to buckets using tolerant matching
                  menuItems.forEach((item) => {
                    const nLabel = normalize(item.label || '');
                    let matched = false;
                    for (const [groupName, keywords] of Object.entries(groupsConfig)) {
                      for (const kw of keywords) {
                        const nKw = normalize(kw);
                        if (!nKw) continue;
                        // direct contains OR short edit distance
                        if (nLabel.includes(nKw) || nKw.includes(nLabel) || levenshtein(nLabel, nKw) <= 2) {
                          groupBuckets[groupName].push(item);
                          matched = true;
                          break;
                        }
                      }
                      if (matched) break;
                    }
                    if (!matched) ungrouped.push(item);
                  });

                  // Render grouped menus in the configured order, only if non-empty
                  return (
                    <>
                      {Object.keys(groupsConfig).map((groupName) => {
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

                      {/* Render any ungrouped/unknown items at the end */}
                      {ungrouped.length > 0 && (
                        <>
                          <SidebarGroupLabel className="px-3 mt-3 text-xs tracking-wide text-gray-500 uppercase">Other</SidebarGroupLabel>
                          {ungrouped.map((item: any) => {
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
