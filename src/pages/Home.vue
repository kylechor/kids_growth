<template>
  <div class="page home">
    <!-- 打卡天数横幅 -->
    <div class="streak-banner" v-if="currentChild && streakDays > 0">
      <span class="fire">🔥</span>
      <span class="streak-text">已连续打卡 <strong>{{ streakDays }}</strong> 天</span>
      <router-link to="/badges" class="view-badges">查看成就</router-link>
    </div>

    <div class="header">
      <div class="child-info" v-if="currentChild" @click="goToChildren">
        <span class="avatar">{{ currentChild.avatar }}</span>
        <span class="name">{{ currentChild.name }}</span>
        <span class="total-points">{{ totalPoints }}分</span>
      </div>
      <div class="no-child" v-else @click="goToChildren">
        <span>+ 添加孩子</span>
      </div>
    </div>

    <div class="date-display">
      {{ todayText }}
      <span class="weekday-hint">{{ weekdayHint }}</span>
    </div>

    <!-- 进度卡片 -->
    <div class="progress-card" v-if="currentChild && tasks.length > 0">
      <div class="progress-header">
        <span class="progress-title">今日进度</span>
        <span class="progress-count">{{ completedCount }}/{{ tasks.length }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <div class="progress-tip" v-if="completedCount === tasks.length && tasks.length > 0">
        🌟 太棒了！今日任务全部完成！
      </div>
    </div>

    <div class="tasks-section" v-if="currentChild">
      <div class="section-header">
        <h3>今日任务</h3>
        <router-link to="/tasks" class="manage-link">管理</router-link>
      </div>
      
      <!-- 分类筛选 -->
      <div class="category-tabs" v-if="categories.length > 1">
        <span 
          v-for="cat in categories" 
          :key="cat"
          class="cat-tab"
          :class="{ active: selectedCategory === cat }"
          @click="selectedCategory = cat"
        >
          {{ getCategoryLabel(cat) }}
        </span>
      </div>

      <div class="tasks-list" v-if="filteredTasks.length > 0">
        <div 
          v-for="task in filteredTasks" 
          :key="task.id"
          class="task-item"
          :class="{ completed: getRecordStatus(task.id), [task.category]: true }"
          @click="toggleTask(task)"
        >
          <div class="task-category-dot" :style="{ background: getCategoryColor(task.category) }"></div>
          <span class="task-icon">{{ task.icon }}</span>
          <div class="task-content">
            <span class="task-name">{{ task.name }}</span>
            <span class="task-points">+{{ task.points }} / -{{ task.deductPoints }}</span>
          </div>
          <div class="check-circle" :class="{ checked: getRecordStatus(task.id) }">
            <span v-if="getRecordStatus(task.id)">✓</span>
          </div>
        </div>
      </div>
      <div class="empty-tasks" v-else>
        <p>还没有任务</p>
        <button class="btn-primary" @click="goToTasks">添加任务</button>
      </div>
    </div>

    <!-- 今日积分汇总 -->
    <div class="today-summary" v-if="currentChild && tasks.length > 0">
      <div class="summary-item main">
        <span class="label">今日积分</span>
        <span class="value" :class="{ positive: todayPoints > 0, negative: todayPoints < 0, zero: todayPoints === 0 }">
          {{ todayPoints > 0 ? '+' : '' }}{{ todayPoints }}
        </span>
      </div>
      <div class="summary-item">
        <span class="label">累计积分</span>
        <span class="value">{{ totalPoints }}</span>
      </div>
    </div>

    <!-- 完成任务庆祝动画 -->
    <div class="celebration" v-if="showCelebration">
      <div class="confetti">🎉</div>
      <div class="celebration-text">太棒了！</div>
    </div>

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

const getCategoryLabel = (cat: string) => {
  if (cat === 'all') return '全部';
  return CATEGORY_LABELS[cat as TaskCategory] || cat;
};

const getCategoryColor = (cat: TaskCategory) => {
  return CATEGORY_COLORS[cat] || '#8b5cf6';
};

const todayText = computed(() => {
  const today = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${today.getMonth() + 1}月${today.getDate()}日 ${weekdays[today.getDay()]}`;
});

const weekdayHint = computed(() => {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return '周末愉快！';
  return '加油！新的一天';
});

const getRecordStatus = (taskId: string) => recordStatus.value[taskId] || false;

const toggleTask = (task: Task) => {
  if (!currentChild.value) return;
  const wasCompleted = recordStatus.value[task.id];
  const newStatus = !wasCompleted;
  recordStatus.value[task.id] = newStatus;
  store.toggleRecord(currentChild.value.id, task.id, newStatus, task.points);
  
  // 显示庆祝动画
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
.home {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding-bottom: 90px;
}

.streak-banner {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.streak-banner .fire {
  font-size: 20px;
}

.streak-banner strong {
  font-size: 18px;
}

.view-badges {
  margin-left: 12px;
  background: rgba(255,255,255,0.2);
  padding: 4px 10px;
  border-radius: 12px;
  color: white;
  text-decoration: none;
  font-size: 12px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  color: white;
}

.child-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.avatar {
  font-size: 40px;
}

.name {
  font-size: 20px;
  font-weight: 600;
  flex: 1;
}

.total-points {
  background: rgba(255,255,255,0.2);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 500;
}

.no-child {
  padding: 20px;
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  font-size: 16px;
}

.date-display {
  text-align: center;
  padding: 16px;
  font-size: 16px;
  color: #333;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.weekday-hint {
  font-size: 13px;
  color: #999;
}

.progress-card {
  margin: 16px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-title {
  font-size: 14px;
  color: #666;
}

.progress-count {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

.progress-bar {
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 5px;
  transition: width 0.3s ease;
}

.progress-tip {
  margin-top: 10px;
  text-align: center;
  color: #10b981;
  font-size: 13px;
}

.tasks-section {
  padding: 0 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  font-size: 16px;
  color: #333;
  margin: 0;
}

.manage-link {
  font-size: 13px;
  color: #667eea;
  text-decoration: none;
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.cat-tab {
  padding: 6px 14px;
  background: white;
  border-radius: 16px;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  color: #666;
}

.cat-tab.active {
  background: #667eea;
  color: white;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  background: white;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.task-item:active {
  transform: scale(0.98);
}

.task-item.completed {
  background: #f0fdf4;
  opacity: 0.8;
}

.task-category-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.task-icon {
  font-size: 28px;
}

.task-content {
  flex: 1;
}

.task-name {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.task-item.completed .task-name {
  text-decoration: line-through;
  color: #999;
}

.task-points {
  font-size: 12px;
  color: #999;
}

.check-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: white;
  transition: all 0.2s;
}

.check-circle.checked {
  background: #10b981;
  border-color: #10b981;
}

.empty-tasks {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 16px;
}

.empty-tasks p {
  color: #999;
  margin-bottom: 16px;
}

.today-summary {
  margin: 16px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.summary-item {
  text-align: center;
}

.summary-item .label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.summary-item .value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.summary-item .value.positive {
  color: #10b981;
}

.summary-item .value.negative {
  color: #ef4444;
}

.summary-item .value.zero {
  color: #999;
}

.celebration {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  text-align: center;
  animation: celebrationPop 1.5s ease-out forwards;
}

.celebration .confetti {
  font-size: 80px;
  animation: confettiBounce 1.5s ease-out;
}

.celebration .celebration-text {
  font-size: 28px;
  font-weight: 700;
  color: #10b981;
  margin-top: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

@keyframes celebrationPop {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  40% { transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
}

@keyframes confettiBounce {
  0% { transform: scale(0) rotate(0deg); }
  50% { transform: scale(1.2) rotate(180deg); }
  100% { transform: scale(1) rotate(360deg); }
}

.nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 8px 0 24px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.08);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #999;
  font-size: 11px;
}

.nav-item.active {
  color: #667eea;
}

.nav-icon {
  font-size: 22px;
}

.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}
</style>
