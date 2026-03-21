import type { Child, Task, DailyRecord, Reward, Redemption, AppState } from '../types';

const STORAGE_KEY = 'grow_points_data';

interface StorageData {
  children: Child[];
  tasks: Task[];
  records: DailyRecord[];
  rewards: Reward[];
  redemptions: Redemption[];
  appState: AppState;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

class Store {
  private data: StorageData;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      this.data = JSON.parse(saved);
    } else {
      this.data = {
        children: [],
        tasks: [],
        records: [],
        rewards: [],
        redemptions: [],
        appState: { isPro: false, currentChildId: null },
      };
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  // App State
  get isPro(): boolean {
    return this.data.appState.isPro;
  }

  set isPro(value: boolean) {
    this.data.appState.isPro = value;
    this.save();
  }

  unlockPro(): void {
    this.data.appState.isPro = true;
    this.save();
  }

  // Children
  getChildren(): Child[] {
    return this.data.children;
  }

  getChild(id: string): Child | undefined {
    return this.data.children.find(c => c.id === id);
  }

  getCurrentChild(): Child | undefined {
    if (!this.data.appState.currentChildId) return undefined;
    return this.getChild(this.data.appState.currentChildId);
  }

  setCurrentChild(id: string): void {
    this.data.appState.currentChildId = id;
    this.save();
  }

  addChild(name: string, avatar: string): Child | null {
    if (!this.data.appState.isPro && this.data.children.length >= 1) {
      return null;
    }
    const child: Child = {
      id: generateId(),
      name,
      avatar,
      createdAt: new Date().toISOString(),
    };
    this.data.children.push(child);
    if (!this.data.appState.currentChildId) {
      this.data.appState.currentChildId = child.id;
    }
    this.save();
    return child;
  }

  removeChild(id: string): void {
    this.data.children = this.data.children.filter(c => c.id !== id);
    this.data.tasks = this.data.tasks.filter(t => t.childId !== id);
    this.data.records = this.data.records.filter(r => r.childId !== id);
    this.data.redemptions = this.data.redemptions.filter(r => r.childId !== id);
    if (this.data.appState.currentChildId === id) {
      this.data.appState.currentChildId = this.data.children[0]?.id || null;
    }
    this.save();
  }

  canAddChild(): boolean {
    return this.data.appState.isPro || this.data.children.length < 1;
  }

  // Tasks
  getTasks(childId: string): Task[] {
    return this.data.tasks.filter(t => t.childId === childId);
  }

  addTask(childId: string, name: string, points: number, deductPoints: number, icon: string): Task | null {
    const childTasks = this.getTasks(childId);
    if (!this.data.appState.isPro && childTasks.length >= 3) {
      return null;
    }
    const task: Task = {
      id: generateId(),
      childId,
      name,
      points,
      deductPoints,
      icon,
    };
    this.data.tasks.push(task);
    this.save();
    return task;
  }

  updateTask(taskId: string, updates: Partial<Omit<Task, 'id' | 'childId'>>): void {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
      this.save();
    }
  }

  removeTask(taskId: string): void {
    this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
    this.save();
  }

  canAddTask(childId: string): boolean {
    const childTasks = this.getTasks(childId);
    return this.data.appState.isPro || childTasks.length < 3;
  }

  // Daily Records
  getRecords(childId: string, date?: string): DailyRecord[] {
    return this.data.records.filter(r => {
      if (r.childId !== childId) return false;
      if (date && r.date !== date) return false;
      return true;
    });
  }

  toggleRecord(childId: string, taskId: string, completed: boolean, points: number): void {
    const today = getToday();
    const existing = this.data.records.find(r => r.childId === childId && r.taskId === taskId && r.date === today);
    
    if (existing) {
      existing.completed = completed;
      existing.points = points;
    } else {
      this.data.records.push({
        id: generateId(),
        date: today,
        childId,
        taskId,
        completed,
        points,
      });
    }
    this.save();
  }

  // Points Calculation
  getTodayPoints(childId: string): number {
    const today = getToday();
    return this.data.records
      .filter(r => r.childId === childId && r.date === today)
      .reduce((sum, r) => sum + (r.completed ? r.points : -r.points + r.points), 0);
  }

  getTotalPoints(childId: string): number {
    const child = this.getChild(childId);
    if (!child) return 0;

    const startDate = new Date(child.createdAt);
    const today = new Date();
    let total = 0;

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = this.data.records.filter(r => r.childId === childId && r.date === dateStr);
      const tasks = this.getTasks(childId);
      
      dayRecords.forEach(r => {
        const task = tasks.find(t => t.id === r.taskId);
        if (task) {
          total += r.completed ? task.points : -task.deductPoints;
        }
      });
    }
    return total;
  }

  getPointsHistory(childId: string): { date: string; points: number }[] {
    const dates = new Set(
      this.data.records
        .filter(r => r.childId === childId)
        .map(r => r.date)
    );

    return Array.from(dates)
      .sort()
      .map(date => {
        const dayRecords = this.data.records.filter(r => r.childId === childId && r.date === date);
        const tasks = this.getTasks(childId);
        let dayPoints = 0;
        dayRecords.forEach(r => {
          const task = tasks.find(t => t.id === r.taskId);
          if (task) {
            dayPoints += r.completed ? task.points : -task.deductPoints;
          }
        });
        return { date, points: dayPoints };
      });
  }

  // Rewards
  getRewards(): Reward[] {
    return this.data.rewards;
  }

  addReward(name: string, points: number, icon: string): void {
    this.data.rewards.push({
      id: generateId(),
      name,
      points,
      icon,
    });
    this.save();
  }

  removeReward(rewardId: string): void {
    this.data.rewards = this.data.rewards.filter(r => r.id !== rewardId);
    this.save();
  }

  // Redemptions
  getRedemptions(childId: string): Redemption[] {
    return this.data.redemptions
      .filter(r => r.childId === childId)
      .sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
  }

  redeemReward(childId: string, reward: Reward): boolean {
    const total = this.getTotalPoints(childId);
    if (total < reward.points) return false;

    this.data.redemptions.push({
      id: generateId(),
      childId,
      rewardId: reward.id,
      rewardName: reward.name,
      points: reward.points,
      redeemedAt: new Date().toISOString(),
    });
    this.save();
    return true;
  }

  // Reset
  resetAll(): void {
    this.data = {
      children: [],
      tasks: [],
      records: [],
      rewards: [],
      redemptions: [],
      appState: { isPro: false, currentChildId: null },
    };
    this.save();
  }
}

export const store = new Store();
