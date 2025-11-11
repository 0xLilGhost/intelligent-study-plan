// API service for Spring Boot backend
// Update API_BASE_URL to match your Spring Boot server address
const API_BASE_URL = 'http://localhost:8080/api'; // Change this to your backend URL

export interface User {
  id: string;
  email: string;
  displayName?: string;
}

// Auth token management
const TOKEN_KEY = 'auth_token';

const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Helper function for API calls with auth
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle unauthorized
  if (response.status === 401) {
    removeAuthToken();
    window.location.href = '/auth';
  }

  return response;
};

export interface Profile {
  id: string;
  tokens: number;
  streak: number;
  display_name?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  priority: string;
  completed: boolean;
  created_at: string;
}

export interface StudyFile {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

export interface StudyPlan {
  id: string;
  goal_id: string;
  plan_content: string;
  created_at: string;
}

export interface DailyContent {
  id: string;
  plan_id: string;
  day_number: number;
  content: string;
  completed: boolean;
  created_at: string;
}

// User cache for session management
let currentUser: User | null = null;

const loadUserFromStorage = () => {
  try {
    const token = getAuthToken();
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      currentUser = JSON.parse(userData);
    }
  } catch (e) {
    console.error('Error loading user from storage:', e);
  }
};

loadUserFromStorage();

// Auth API
export const mockAuth = {
  signIn: async (email: string, password: string): Promise<User> => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    // Adjust based on your Spring Boot response structure
    // Expecting: { token: string, user: { id, email, displayName } }
    setAuthToken(data.token);
    currentUser = data.user;
    localStorage.setItem('user_data', JSON.stringify(currentUser));
    return currentUser;
  },

  signUp: async (email: string, password: string, displayName?: string): Promise<User> => {
    const response = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    // Adjust based on your Spring Boot response structure
    setAuthToken(data.token);
    currentUser = data.user;
    localStorage.setItem('user_data', JSON.stringify(currentUser));
    return currentUser;
  },

  signOut: async (): Promise<void> => {
    // Optional: call logout endpoint if you have one
    // await apiCall('/auth/logout', { method: 'POST' });
    removeAuthToken();
    localStorage.removeItem('user_data');
    currentUser = null;
  },

  getCurrentUser: (): User | null => {
    return currentUser;
  },
};

// Profile API
export const mockProfileApi = {
  getProfile: async (userId: string): Promise<Profile | null> => {
    const response = await apiCall(`/profile/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return await response.json();
  },

  updateProfile: async (userId: string, updates: Partial<Profile>): Promise<void> => {
    const response = await apiCall(`/profile/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
  },
};

// Goals API
export const mockGoalsApi = {
  getGoals: async (userId: string): Promise<Goal[]> => {
    const response = await apiCall(`/goals?userId=${userId}&completed=false`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch goals');
    }

    return await response.json();
  },

  createGoal: async (userId: string, title: string, priority: string): Promise<Goal> => {
    const response = await apiCall('/goals', {
      method: 'POST',
      body: JSON.stringify({ userId, title, priority }),
    });

    if (!response.ok) {
      throw new Error('Failed to create goal');
    }

    return await response.json();
  },

  updateGoal: async (goalId: string, updates: Partial<Goal>): Promise<void> => {
    const response = await apiCall(`/goals/${goalId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update goal');
    }
  },
};

// Files API
export const mockFilesApi = {
  uploadFile: async (userId: string, file: File): Promise<StudyFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return await response.json();
  },

  getFiles: async (userId: string): Promise<StudyFile[]> => {
    const response = await apiCall(`/files?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }

    return await response.json();
  },
};

// Study Plans API
export const mockPlansApi = {
  generatePlan: async (goalId: string): Promise<StudyPlan> => {
    const response = await apiCall('/ai/generate-plan', {
      method: 'POST',
      body: JSON.stringify({ goalId }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate plan');
    }

    return await response.json();
  },

  getPlan: async (goalId: string): Promise<StudyPlan | null> => {
    const response = await apiCall(`/plans?goalId=${goalId}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch plan');
    }

    const plans = await response.json();
    return plans.length > 0 ? plans[0] : null;
  },
};

// Daily Content API
export const mockDailyContentApi = {
  generateDailyContent: async (planId: string, dayNumber: number): Promise<DailyContent> => {
    const response = await apiCall('/ai/generate-daily-content', {
      method: 'POST',
      body: JSON.stringify({ planId, dayNumber }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate daily content');
    }

    return await response.json();
  },

  getDailyContent: async (planId: string): Promise<DailyContent[]> => {
    const response = await apiCall(`/daily-content?planId=${planId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch daily content');
    }

    return await response.json();
  },

  updateDailyContent: async (contentId: string, updates: Partial<DailyContent>): Promise<void> => {
    const response = await apiCall(`/daily-content/${contentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update daily content');
    }
  },
};
