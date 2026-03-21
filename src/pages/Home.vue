<template>
  <div class="page home">
    <!-- 打卡天数横幅 -->
    <div class="streak-banner" v-if="currentChild && streakDays > 0">
      <div class="streak-content">
        <span class="fire">🔥</span>
        <div class="streak-info">
          <span class="streak-days">{{ streakDays }}</span>
          <span class="streak-label">天连续打卡</span>
        </div>
      </div>
      <router-link to="/badges" class="view-badges">
        成就
        <span class="arrow">→</span>
      </router-link>
    </div>

    <!-- 头部信息 -->
    <div class="hero-header" :class="{ 'has-streak': streakDays > 0 }">
      <div class="child-info" @click="goToChildren">
        <div class="avatar-wrapper">
          <span class="avatar">{{ currentChild?.avatar || '👶' }}</span>
          <span class="status-dot" v-if="currentChild"></span>
        </div>
        <div class="child-meta">
          <span class="name">{{ currentChild?.name || '点击添加孩子' }}</span>
          <span class="hint" v-if="!currentChild">开启成长之旅</span>
        </div>
      </div>
      <div class="total-points" v-if="currentChild">
        <span class="points-value">{{ totalPoints }}</span>
        <span class="points-label">积分</span>
      </div>
    </div>

    <!-- 日期显示 -->
    <div class="date-card">
      <div class="date-main">
        <span class="date-number">{{ currentDate }}</span>
        <span class="date-weekday">{{ weekday }}</span>
      </div>
      <div class="date-message">{{ weekdayMessage }}</div>
    </div>

    <!-- 进度卡片 -->
    <div class="progress-card" v-if="currentChild && tasks.length > 0">
      <div class="progress-header">
        <span class="progress-title">今日进度</span>
        <span class="progress-count">
          <span class="completed">{{ completedCount }}</span>
          <span class="separator">/</span>
          <span class="total">{{ tasks.length }}</span>
        </span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <div class="progress-footer" v-if="completedCount === tasks.length && tasks.length > 0">
        <span class="celebrate">🎉 全部完成！太棒了！</span>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="tasks-section" v-if="currentChild">
      <div class="section-header">
        <h3>今日任务</h3>
        <router-link to="/tasks" class="manage-link">管理</router-link>
      </div>
      
      <!-- 分类筛选 -->
      <div class="filter-tabs" v-if="categories.length > 1">
        <button 
          v-for="cat in categories" 
          :key="cat"
          class="filter-tab"
          :class="{ active: selectedCategory === cat }"
          @click="selectedCategory = cat"
        >
          {{ getCategoryLabel(cat) }}
        </button>
      </div>

      <div class="tasks-list" v-if="filteredTasks.length > 0">
        <div 
          v-for="task in filteredTasks" 
          :key="task.id"
          class="task-item"
          :class="{ completed: getRecordStatus(task.id) }"
          @click="toggleTask(task)"
        >
          <div class="task-category-bar" :style="{ background: getCategoryColor(task.category) }"></div>
          <div class="task-icon">{{ task.icon }}</div>
          <div class="task-content">
            <span class="task-name">{{ task.name }}</span>
            <div class="task-meta">
              <span class="task-points">+{{ task.points }}</span>
              <span class="task-penalty" v-if="task.deductPoints > 0">-{{ task.deductPoints }}</span>
            </div>
          </div>
          <div class="task-check" :class="{ checked: getRecordStatus(task.id) }">
            <svg v-if="getRecordStatus(task.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
      </div>
      <div class="empty-tasks" v-else>
        <div class="empty-icon">📋</div>
        <p>还没有任务</p>
        <button class="btn-primary" @click="goToTasks">添加任务</button>
      </div>
    </div>

    <!-- 今日汇总 -->
    <div class="summary-section" v-if="currentChild && tasks.length > 0">
      <div class="summary-row">
        <div class="summary-item highlight">
          <span class="summary-label">今日积分</span>
          <span class="summary-value" :class="todayPointsClass">
            {{ todayPoints > 0 ? '+' : '' }}{{ todayPoints }}
          </span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-label">累计积分</span>
          <span class="summary-value">{{ totalPoints }}</span>
        </div>
      </div>
    </div>

    <!-- 庆祝动画 -->
    <Transition name="celebration">
      <div class="celebration-overlay" v-if="showCelebration">
        <div class="celebration-content">
          <div class="confetti-icon">🎉</div>
          <div class="celebration-text">太棒了！</div>
        </div>
      </div>
    </Transition>

    <!-- 底部导航 -->
    <div class="nav-bar">
      <router-link to="/" class="nav-item active">
        <span class="nav-icon">🏠</span>
        <span>首页</span>
      </router-link>
      <router-link to="/badges" class="nav-item">
        <span class="nav-icon">🏆</span>
        <span>成就</span>
      </router-link>
      <router-link to="/tasks" class="nav-item">
        <span class="nav-icon">📋</span>
        <span>任务</span>
      </router-link>
      <router-link to="/rewards" class="nav-item">
        <span class="nav-icon">🎁</span>
        <span>奖励</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../stores/store';
import type { Task, TaskCategory } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';

const router = useRouter();
const currentChild = computed(() => store.getCurrentChild());
const tasks = computed(() => currentChild.value ? store.getTasks(currentChild.value.id) : []);
const totalPoints = computed(() => currentChild.value ? store.getTotalPoints(currentChild.value.id) : 0);
const todayPoints = computed(() => currentChild.value ? store.getTodayPoints(currentChild.value.id) : 0);
const streakDays = computed(() => currentChild.value ? store.getStreak(currentChild.value.id) : 0);

const recordStatus = ref<Record<string, boolean>>({});
const showCelebration = ref(false);
const selectedCategory = ref<string>('all');

// 分类相关
const categories = computed(() => {
  const cats = new Set(tasks.value.map(t => t.category));
  return ['all', ...Array.from(cats)] as string[];
});

const filteredTasks = computed(() => {
  if (selectedCategory.value === 'all') return tasks.value;
  return tasks.value.filter(t => t.category === selectedCategory.value);
});

const completedCount = computed(() => 
  tasks.value.filter(t => getRecordStatus(t.id)).length
);

const progressPercent = computed(() => 
  tasks.value.length > 0 ? (completedCount.value / tasks.value.length) * 100 : 0
);

const todayPointsClass = computed(() => {
  if (todayPoints.value > 0) return 'positive';
  if (todayPoints.value < 0) return 'negative';
  return 'zero';
});

const currentDate = computed(() => {
  const today = new Date();
  return `${today.getMonth() + 1}月${today.getDate()}日`;
});

const weekday = computed(() => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[new Date().getDay()];
});

const weekdayMessage = computed(() => {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return '周末愉快！';
  return '新的一天，加油！';
});

const getCategoryLabel = (cat: string) => {
  if (cat === 'all') return '全部';
  return CATEGORY_LABELS[cat as TaskCategory] || cat;
};

const getCategoryColor = (cat: TaskCategory) => {
  return CATEGORY_COLORS[cat] || '#8b5cf6';
};

const getRecordStatus = (taskId: string) => recordStatus.value[taskId] || false;

const toggleTask = (task: Task) => {
  if (!currentChild.value) return;
  const wasCompleted = recordStatus.value[task.id];
  const newStatus = !wasCompleted;
  recordStatus.value[task.id] = newStatus;
  store.toggleRecord(currentChild.value.id, task.id, newStatus, task.points);
  
  if (newStatus && !wasCompleted) {
    showCelebration.value = true;
    setTimeout(() => {
      showCelebration.value = false;
    }, 1500);
  }
};

const loadRecords = () => {
  if (!currentChild.value) return;
  const records = store.getRecords(currentChild.value.id);
  records.forEach(r => {
    recordStatus.value[r.taskId] = r.completed;
  });
};

const goToChildren = () => router.push('/children');
const goToTasks = () => router.push('/tasks');

onMounted(loadRecords);
</script>

<style scoped>
/* Hero Header */
.hero-header {
  background: var(--gradient-hero);
  padding: var(--space-lg);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-header.has-streak {
  border-radius: 0 0 24px 24px;
}

.child-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
}

.avatar-wrapper {
  position: relative;
}

.avatar {
  font-size: 48px;
  display: block;
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: #22c55e;
  border-radius: 50%;
  border: 3px solid white;
}

.child-meta {
  display: flex;
  flex-direction: column;
}

.child-meta .name {
  font-size: var(--font-size-xl);
  font-weight: 600;
}

.child-meta .hint {
  font-size: var(--font-size-sm);
  opacity: 0.8;
}

.total-points {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background: rgba(255, 255, 255, 0.2);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(4px);
}

.total-points .points-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  line-height: 1;
}

.total-points .points-label {
  font-size: var(--font-size-xs);
  opacity: 0.8;
}

/* Streak Banner */
.streak-banner {
  background: var(--color-bg-card);
  padding: var(--space-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
}

.streak-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.streak-content .fire {
  font-size: 28px;
}

.streak-info {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.streak-days {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
}

.streak-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.view-badges {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: 500;
  padding: var(--space-xs) var(--space-sm);
  background: rgba(99, 102, 241, 0.1);
  border-radius: var(--radius-full);
}

.view-badges .arrow {
  font-size: 12px;
}

/* Date Card */
.date-card {
  margin: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-md);
}

.date-main {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
}

.date-number {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text);
}

.date-weekday {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: var(--color-bg);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.date-message {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 500;
}

/* Progress Card */
.progress-card {
  margin: 0 var(--space-md) var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.progress-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.progress-count {
  font-size: var(--font-size-sm);
}

.progress-count .completed {
  font-weight: 700;
  color: var(--color-primary);
}

.progress-count .separator {
  color: var(--color-text-muted);
  margin: 0 2px;
}

.progress-count .total {
  color: var(--color-text-secondary);
}

.progress-track {
  height: 8px;
  background: var(--color-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: var(--radius-full);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-footer {
  margin-top: var(--space-sm);
  text-align: center;
}

.progress-footer .celebrate {
  font-size: var(--font-size-sm);
  color: var(--color-success);
  font-weight: 500;
}

/* Tasks Section */
.tasks-section {
  padding: 0 var(--space-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.section-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0;
}

.manage-link {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.filter-tabs {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--space-xs);
}

.filter-tab {
  padding: 8px 16px;
  background: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.filter-tab.active {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-md);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.task-item {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.task-item:active {
  transform: scale(0.99);
}

.task-item.completed {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%);
}

.task-category-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.task-icon {
  font-size: 28px;
  z-index: 1;
}

.task-content {
  flex: 1;
  z-index: 1;
}

.task-name {
  display: block;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 2px;
}

.task-item.completed .task-name {
  text-decoration: line-through;
  opacity: 0.6;
}

.task-meta {
  display: flex;
  gap: var(--space-sm);
  font-size: var(--font-size-xs);
}

.task-points {
  color: var(--color-success);
  font-weight: 600;
}

.task-penalty {
  color: var(--color-danger);
  opacity: 0.7;
}

.task-check {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  z-index: 1;
}

.task-check.checked {
  background: var(--color-success);
  border-color: var(--color-success);
  transform: scale(1.1);
}

.task-check svg {
  width: 16px;
  height: 16px;
  color: white;
}

.empty-tasks {
  text-align: center;
  padding: var(--space-xl);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
}

.empty-tasks p {
  color: var(--color-text-muted);
  margin-bottom: var(--space-md);
}

/* Summary Section */
.summary-section {
  margin: var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.summary-row {
  display: flex;
  align-items: center;
}

.summary-divider {
  width: 1px;
  height: 48px;
  background: var(--color-border);
  margin: 0 var(--space-lg);
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-item.highlight {
  flex: 1.5;
}

.summary-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
}

.summary-value.positive {
  color: var(--color-success);
}

.summary-value.negative {
  color: var(--color-danger);
}

.summary-value.zero {
  color: var(--color-text-muted);
}

/* Celebration Animation */
.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-celebration);
}

.celebration-content {
  text-align: center;
  animation: celebrationPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.confetti-icon {
  font-size: 80px;
  animation: bounce 0.6s ease infinite alternate;
}

.celebration-text {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  margin-top: var(--space-md);
}

@keyframes celebrationPop {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0% { transform: translateY(0); }
  100% { transform: translateY(-10px); }
}

.celebration-enter-active {
  animation: celebrationPop 0.3s ease;
}

.celebration-leave-active {
  animation: celebrationPop 0.3s ease reverse;
}
</style>
