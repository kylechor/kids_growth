<template>
  <div class="page home">
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
    </div>

    <div class="tasks-section" v-if="currentChild">
      <h3>今日任务</h3>
      <div class="tasks-list" v-if="tasks.length > 0">
        <div 
          v-for="task in tasks" 
          :key="task.id"
          class="task-item"
          :class="{ completed: getRecordStatus(task.id) }"
          @click="toggleTask(task)"
        >
          <span class="task-icon">{{ task.icon }}</span>
          <span class="task-name">{{ task.name }}</span>
          <span class="task-points">+{{ task.points }} / -{{ task.deductPoints }}</span>
          <span class="check-icon">{{ getRecordStatus(task.id) ? '✓' : '' }}</span>
        </div>
      </div>
      <div class="empty-tasks" v-else>
        <p>还没有任务</p>
        <button class="btn-primary" @click="goToTasks">添加任务</button>
      </div>
    </div>

    <div class="today-summary" v-if="currentChild && tasks.length > 0">
      <div class="summary-item">
        <span class="label">今日积分</span>
        <span class="value" :class="{ positive: todayPoints >= 0, negative: todayPoints < 0 }">
          {{ todayPoints >= 0 ? '+' : '' }}{{ todayPoints }}
        </span>
      </div>
      <div class="summary-item">
        <span class="label">累计积分</span>
        <span class="value">{{ totalPoints }}</span>
      </div>
    </div>

    <div class="nav-bar">
      <router-link to="/" class="nav-item active">
        <span class="nav-icon">🏠</span>
        <span>首页</span>
      </router-link>
      <router-link to="/children" class="nav-item">
        <span class="nav-icon">👶</span>
        <span>孩子</span>
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
import type { Task } from '../types';

const router = useRouter();
const currentChild = computed(() => store.getCurrentChild());
const tasks = computed(() => currentChild.value ? store.getTasks(currentChild.value.id) : []);
const totalPoints = computed(() => currentChild.value ? store.getTotalPoints(currentChild.value.id) : 0);
const todayPoints = computed(() => currentChild.value ? store.getTodayPoints(currentChild.value.id) : 0);

const recordStatus = ref<Record<string, boolean>>({});

const todayText = computed(() => {
  const today = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${today.getMonth() + 1}月${today.getDate()}日 ${weekdays[today.getDay()]}`;
});

const getRecordStatus = (taskId: string) => recordStatus.value[taskId] || false;

const toggleTask = (task: Task) => {
  if (!currentChild.value) return;
  const newStatus = !recordStatus.value[task.id];
  recordStatus.value[task.id] = newStatus;
  store.toggleRecord(currentChild.value.id, task.id, newStatus, task.points);
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
  background: #f5f5f5;
  padding-bottom: 80px;
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
  font-size: 32px;
}

.name {
  font-size: 18px;
  font-weight: 600;
  flex: 1;
}

.total-points {
  background: rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.no-child {
  padding: 16px;
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
}

.date-display {
  text-align: center;
  padding: 16px;
  font-size: 16px;
  color: #666;
  background: white;
}

.tasks-section {
  padding: 16px;
}

.tasks-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.task-item:active {
  transform: scale(0.98);
}

.task-item.completed {
  background: #e8f5e9;
}

.task-icon {
  font-size: 24px;
}

.task-name {
  flex: 1;
  font-size: 15px;
}

.task-points {
  font-size: 12px;
  color: #999;
}

.check-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #4caf50;
}

.task-item.completed .check-icon {
  background: #4caf50;
  border-color: #4caf50;
  color: white;
}

.empty-tasks {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 12px;
}

.empty-tasks p {
  color: #999;
  margin-bottom: 16px;
}

.today-summary {
  margin: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  display: flex;
  justify-content: space-around;
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
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.summary-item .value.positive {
  color: #4caf50;
}

.summary-item .value.negative {
  color: #f44336;
}

.nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 8px 0 20px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
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
  font-size: 20px;
}
</style>
