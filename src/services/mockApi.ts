// Mock API service - Replace with your actual backend API calls

export interface User {
  id: string;
  email: string;
  displayName?: string;
}

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

// Mock data storage
let mockUser: User | null = null;
let mockProfiles: Profile[] = [];
let mockGoals: Goal[] = [];
let mockFiles: StudyFile[] = [];
let mockPlans: StudyPlan[] = [];
let mockDailyContent: DailyContent[] = [];

// Initialize with localStorage
const loadFromStorage = () => {
  try {
    mockUser = JSON.parse(localStorage.getItem('mockUser') || 'null');
    mockProfiles = JSON.parse(localStorage.getItem('mockProfiles') || '[]');
    mockGoals = JSON.parse(localStorage.getItem('mockGoals') || '[]');
    mockFiles = JSON.parse(localStorage.getItem('mockFiles') || '[]');
    mockPlans = JSON.parse(localStorage.getItem('mockPlans') || '[]');
    mockDailyContent = JSON.parse(localStorage.getItem('mockDailyContent') || '[]');
  } catch (e) {
    console.error('Error loading from storage:', e);
  }
};

const saveToStorage = () => {
  localStorage.setItem('mockUser', JSON.stringify(mockUser));
  localStorage.setItem('mockProfiles', JSON.stringify(mockProfiles));
  localStorage.setItem('mockGoals', JSON.stringify(mockGoals));
  localStorage.setItem('mockFiles', JSON.stringify(mockFiles));
  localStorage.setItem('mockPlans', JSON.stringify(mockPlans));
  localStorage.setItem('mockDailyContent', JSON.stringify(mockDailyContent));
};

loadFromStorage();

// Auth API
export const mockAuth = {
  signIn: async (email: string, password: string): Promise<User> => {
    // TODO: Replace with actual API call
    // Example: const response = await fetch('/api/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) });
    await new Promise(resolve => setTimeout(resolve, 500));
    mockUser = { id: 'user-' + Date.now(), email };
    saveToStorage();
    return mockUser;
  },

  signUp: async (email: string, password: string, displayName?: string): Promise<User> => {
    // TODO: Replace with actual API call
    // Example: const response = await fetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, displayName }) });
    await new Promise(resolve => setTimeout(resolve, 500));
    mockUser = { id: 'user-' + Date.now(), email, displayName };
    
    // Create initial profile
    mockProfiles.push({
      id: mockUser.id,
      tokens: 100,
      streak: 0,
      display_name: displayName,
    });
    
    saveToStorage();
    return mockUser;
  },

  signOut: async (): Promise<void> => {
    // TODO: Replace with actual API call
    // Example: await fetch('/api/auth/signout', { method: 'POST' });
    await new Promise(resolve => setTimeout(resolve, 300));
    mockUser = null;
    saveToStorage();
  },

  getCurrentUser: (): User | null => {
    return mockUser;
  },
};

// Profile API
export const mockProfileApi = {
  getProfile: async (userId: string): Promise<Profile | null> => {
    // TODO: Replace with actual API call
    // Example: const response = await fetch(`/api/profiles/${userId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProfiles.find(p => p.id === userId) || null;
  },

  updateProfile: async (userId: string, updates: Partial<Profile>): Promise<void> => {
    // TODO: Replace with actual API call
    // Example: await fetch(`/api/profiles/${userId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockProfiles.findIndex(p => p.id === userId);
    if (index !== -1) {
      mockProfiles[index] = { ...mockProfiles[index], ...updates };
      saveToStorage();
    }
  },
};

// Goals API
export const mockGoalsApi = {
  getGoals: async (userId: string): Promise<Goal[]> => {
    // TODO: Replace with actual API call
    // Example: const response = await fetch(`/api/goals?userId=${userId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockGoals.filter(g => g.user_id === userId && !g.completed);
  },

  createGoal: async (userId: string, title: string, priority: string): Promise<Goal> => {
    // TODO: Replace with actual API call
    // Example: const response = await fetch('/api/goals', { method: 'POST', body: JSON.stringify({ userId, title, priority }) });
    await new Promise(resolve => setTimeout(resolve, 300));
    const newGoal: Goal = {
      id: 'goal-' + Date.now(),
      user_id: userId,
      title,
      priority,
      completed: false,
      created_at: new Date().toISOString(),
    };
    mockGoals.push(newGoal);
    saveToStorage();
    return newGoal;
  },

  updateGoal: async (goalId: string, updates: Partial<Goal>): Promise<void> => {
    // TODO: Replace with actual API call
    // Example: await fetch(`/api/goals/${goalId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockGoals.findIndex(g => g.id === goalId);
    if (index !== -1) {
      mockGoals[index] = { ...mockGoals[index], ...updates };
      saveToStorage();
    }
  },
};

// Files API
export const mockFilesApi = {
  uploadFile: async (userId: string, file: File): Promise<StudyFile> => {
    // TODO: Replace with actual API call for file upload
    // Example: const formData = new FormData(); formData.append('file', file);
    // const response = await fetch('/api/files/upload', { method: 'POST', body: formData });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newFile: StudyFile = {
      id: 'file-' + Date.now(),
      user_id: userId,
      file_name: file.name,
      file_path: `${userId}/${Date.now()}_${file.name}`,
      file_type: file.type,
      created_at: new Date().toISOString(),
    };
    mockFiles.push(newFile);
    saveToStorage();
    return newFile;
  },

  getFiles: async (userId: string): Promise<StudyFile[]> => {
    // TODO: Replace with actual API call
    // Example: const response = await fetch(`/api/files?userId=${userId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockFiles.filter(f => f.user_id === userId);
  },
};

// Study Plans API
export const mockPlansApi = {
  generatePlan: async (goalId: string): Promise<StudyPlan> => {
    // TODO: Replace with actual API call to your AI service
    // Example: const response = await fetch('/api/plans/generate', { method: 'POST', body: JSON.stringify({ goalId }) });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const goal = mockGoals.find(g => g.id === goalId);
    const planContent = `# Study Plan for: ${goal?.title || 'Your Goal'}

## Overview
This is your personalized study plan generated by AI.

## Week 1-2: Foundations
- Day 1-3: Introduction and basics
- Day 4-7: Core concepts
- Day 8-14: Practice and review

## Week 3-4: Intermediate
- Day 15-21: Advanced topics
- Day 22-28: Projects and applications

## Week 5-6: Mastery
- Day 29-35: Expert techniques
- Day 36-42: Final project and assessment

*This is a placeholder. Replace with actual AI-generated content from your backend.*`;

    const newPlan: StudyPlan = {
      id: 'plan-' + Date.now(),
      goal_id: goalId,
      plan_content: planContent,
      created_at: new Date().toISOString(),
    };
    mockPlans.push(newPlan);
    saveToStorage();
    return newPlan;
  },

  getPlan: async (goalId: string): Promise<StudyPlan | null> => {
    // TODO: Replace with actual API call
    // Example: const response = await fetch(`/api/plans?goalId=${goalId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockPlans.find(p => p.goal_id === goalId) || null;
  },
};

// Daily Content API
export const mockDailyContentApi = {
  generateDailyContent: async (planId: string, dayNumber: number): Promise<DailyContent> => {
    // TODO: Replace with actual API call to your AI service
    // Example: const response = await fetch('/api/daily-content/generate', { method: 'POST', body: JSON.stringify({ planId, dayNumber }) });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const content = `# Day ${dayNumber} Study Guide

## Morning Session (2 hours)
- Review previous day's material
- Introduction to today's topic
- Key concepts overview

## Afternoon Session (2 hours)
- Deep dive into main topics
- Practical exercises
- Hands-on practice

## Evening Session (1 hour)
- Review and consolidation
- Practice problems
- Prepare for next day

## Resources
- Reading materials
- Video tutorials
- Practice exercises

*This is a placeholder. Replace with actual AI-generated content from your backend.*`;

    const newContent: DailyContent = {
      id: 'content-' + Date.now(),
      plan_id: planId,
      day_number: dayNumber,
      content,
      completed: false,
      created_at: new Date().toISOString(),
    };
    mockDailyContent.push(newContent);
    saveToStorage();
    return newContent;
  },

  getDailyContent: async (planId: string): Promise<DailyContent[]> => {
    // TODO: Replace with actual API call
    // Example: const response = await fetch(`/api/daily-content?planId=${planId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockDailyContent.filter(c => c.plan_id === planId);
  },

  updateDailyContent: async (contentId: string, updates: Partial<DailyContent>): Promise<void> => {
    // TODO: Replace with actual API call
    // Example: await fetch(`/api/daily-content/${contentId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockDailyContent.findIndex(c => c.id === contentId);
    if (index !== -1) {
      mockDailyContent[index] = { ...mockDailyContent[index], ...updates };
      saveToStorage();
    }
  },
};
