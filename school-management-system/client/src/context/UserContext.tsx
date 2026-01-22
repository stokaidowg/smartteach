import React, { createContext, useContext, useState } from 'react';

type User = {
  id: string;
  username: string;
  staff_id?: string;
  is_superuser: boolean;
  display_name?: string;
};

type Permission = {
  module: string;
  can_view: boolean;
  can_edit: boolean;
};

type UserContextType = {
  user: User | null;
  token: string | null;
  permissions: Permission[];
  login: (user: User, token: string) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  token: null,
  permissions: [],
  login: () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [permissions, setPermissions] = useState<Permission[]>(() => {
    const stored = localStorage.getItem('permissions');
    return stored ? JSON.parse(stored) : [];
  });

  const login = async (user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    // Fetch permissions after login
    const res = await fetch(`/users/${user.id}/permissions`);
    const perms = await res.json();
    console.log('Fetched permissions:', perms); // <-- Add this line
    setPermissions(perms);
    localStorage.setItem('permissions', JSON.stringify(perms));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPermissions([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
  };

  return (
    <UserContext.Provider value={{ user, token, permissions, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}