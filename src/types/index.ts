export interface Child {
  id: string;
  name: string;
  avatar: string; // emoji
  createdAt: string;
}

export interface Task {
  id: string;
  childId: string;
  name: string;
  points: number;
  deductPoints: number;
  icon: string; // emoji
}

export interface DailyRecord {
  id: string;
  date: string;
  childId: string;
  taskId: string;
  completed: boolean;
  points: number;
}

export interface Reward {
  id: string;
  name: string;
  points: number;
  icon: string;
}

export interface Redemption {
  id: string;
  childId: string;
  rewardId: string;
  rewardName: string;
  points: number;
  redeemedAt: string;
}

export interface AppState {
  isPro: boolean;
  currentChildId: string | null;
}

export const DEFAULT_TASKS: Omit<Task, 'id' | 'childId'>[] = [
  { name: '按时起床', points: 5, deductPoints: 3, icon: '🌅' },
  { name: '认真作业', points: 10, deductPoints: 5, icon: '📚' },
  { name: '主动阅读', points: 5, deductPoints: 2, icon: '📖' },
];
