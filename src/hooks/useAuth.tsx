import { useState, useEffect } from 'react';
import { mockAuth, User } from '@/services/mockApi';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const currentUser = mockAuth.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const signOut = async () => {
    await mockAuth.signOut();
    setUser(null);
  };

  return { user, loading, signOut };
}
