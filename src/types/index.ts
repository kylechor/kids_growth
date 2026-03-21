// 任务分类
export type TaskCategory = 'study' | 'life' | 'exercise' | 'other';

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  study: '📚 学习',
  life: '🏠 生活',
  exercise: '🏃 运动',
  other: '✨ 其他',
};

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  study: '#667eea',
  life: '#f59e0b',
  exercise: '#10b981',
  other: '#8b5cf6',
};

export interface Child {
  id: string;
  name: string;
  avatar: string; // emoji
  createdAt: string;
  streakDays: number; // 连续打卡天数
  maxStreakDays: number; // 历史最高连续天数
}

export interface Task {
  id: string;
  childId: string;
  name: string;
  points: number;
  deductPoints: number;
  icon: string; // emoji
  category: TaskCategory; // 任务分类
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

// 徽章类型
export type BadgeType = 
  | 'first_login'      // 首次使用
  | 'first_task'      // 完成第一个任务
  | 'streak_3'        // 连续3天打卡
  | 'streak_7'        // 连续7天打卡
  | 'streak_30'       // 连续30天打卡
  | 'points_100'      // 累计100积分
  | 'points_500'     // 累计500积分
  | 'points_1000'    // 累计1000积分
  | 'rewards_1'       // 首次兑换奖励
  | 'perfect_day'     // 完美一天（所有任务都完成）
  | 'early_bird'      // 早起达人
  | 'bookworm';       // 阅读小达人

export interface Badge {
  id: string;
  childId: string;
  type: BadgeType;
  earnedAt: string;
}

export interface BadgeDefinition {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { type: 'first_login', name: '初次见面', description: '开始使用成长积分宝', icon: '👋', color: '#667eea' },
  { type: 'first_task', name: '初试牛刀', description: '完成第一个任务', icon: '🎯', color: '#10b981' },
  { type: 'streak_3', name: '三天打鱼', description: '连续打卡3天', icon: '🔥', color: '#f59e0b' },
  { type: 'streak_7', name: '一周之星', description: '连续打卡7天', icon: '⭐', color: '#eab308' },
  { type: 'streak_30', name: '月度冠军', description: '连续打卡30天', icon: '🏆', color: '#ef4444' },
  { type: 'points_100', name: '百分少年', description: '累计获得100积分', icon: '💯', color: '#3b82f6' },
  { type: 'points_500', name: '五百达人', description: '累计获得500积分', icon: '💎', color: '#8b5cf6' },
  { type: 'points_1000', name: '千分王者', description: '累计获得1000积分', icon: '👑', color: '#f59e0b' },
  { type: 'rewards_1', name: '首次兑换', description: '兑换第一个奖励', icon: '🎁', color: '#ec4899' },
  { type: 'perfect_day', name: '完美一天', description: '当天所有任务都完成', icon: '🌟', color: '#14b8a6' },
  { type: 'early_bird', name: '早起达人', description: '早上8点前完成任务', icon: '🌅', color: '#f97316' },
  { type: 'bookworm', name: '阅读小书虫', description: '累计完成10次阅读任务', icon: '📚', color: '#6366f1' },
];

export const DEFAULT_TASKS: Omit<Task, 'id' | 'childId'>[] = [
  { name: '按时起床', points: 5, deductPoints: 3, icon: '🌅' },
  { name: '认真作业', points: 10, deductPoints: 5, icon: '📚' },
  { name: '主动阅读', points: 5, deductPoints: 2, icon: '📖' },
];
