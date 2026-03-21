<template>
  <div class="page tasks-page">
    <div class="header-bar">
      <router-link to="/" class="back-btn">←</router-link>
      <h2>任务管理</h2>
      <button class="upgrade-btn" @click="goToUpgrade" v-if="!isPro">解锁</button>
      <span v-else></span>
    </div>

    <div class="child-selector" v-if="children.length > 1">
      <span 
        v-for="child in children" 
        :key="child.id"
        class="child-tab"
        :class="{ active: selectedChildId === child.id }"
        @click="selectedChildId = child.id"
      >
        {{ child.avatar }} {{ child.name }}
      </span>
    </div>

    <div class="tasks-list" v-if="tasks.length > 0">
      <div v-for="task in tasks" :key="task.id" class="task-card">
        <span class="task-icon">{{ task.icon }}</span>
        <div class="task-info">
          <span class="task-name">{{ task.name }}</span>
          <span class="task-points">+{{ task.points }}分 / -{{ task.deductPoints }}分</span>
        </div>
        <button class="edit-btn" @click="editTask(task)">编辑</button>
        <button class="delete-btn" @click="confirmDelete(task)">删除</button>
      </div>
    </div>

    <div class="empty-state" v-else-if="currentChild">
      <p>还没有任务</p>
      <p class="sub">添加任务让孩子来完成吧</p>
    </div>
    <div class="empty-state" v-else>
      <p>请先添加孩子</p>
      <router-link to="/children" class="btn-link">去添加</router-link>
    </div>

    <div class="add-section" v-if="currentChild">
      <h3>{{ editingTask ? '编辑任务' : '添加任务' }}</h3>
      
      <div class="icon-picker">
        <span 
          v-for="icon in iconOptions" 
          :key="icon"
          class="icon-option"
          :class="{ selected: newTask.icon === icon }"
          @click="newTask.icon = icon"
        >{{ icon }}</span>
      </div>

      <div class="input-group">
        <input v-model="newTask.name" placeholder="任务名称，如：按时起床" />
      </div>

      <div class="points-input">
        <div class="point-group">
          <label>完成加分</label>
          <div class="stepper">
            <button @click="newTask.points = Math.max(1, newTask.points - 1)">-</button>
            <span>{{ newTask.points }}</span>
            <button @click="newTask.points++">+</button>
          </div>
        </div>
        <div class="point-group">
          <label>未完成扣分</label>
          <div class="stepper">
            <button @click="newTask.deductPoints = Math.max(0, newTask.deductPoints - 1)">-</button>
            <span>{{ newTask.deductPoints }}</span>
            <button @click="newTask.deductPoints++">+</button>
          </div>
        </div>
      </div>

      <div class="preset-tasks">
        <span>预设：</span>
        <button 
          v-for="preset in presetTasks" 
          :key="preset.name"
          @click="applyPreset(preset)"
        >{{ preset.icon }} {{ preset.name }}</button>
      </div>

      <button class="btn-primary" @click="saveTask" :disabled="!newTask.name.trim()">
        {{ editingTask ? '保存' : '添加' }}
      </button>
      <button class="btn-secondary" v-if="editingTask" @click="cancelEdit">取消</button>
    </div>

    <div class="limit-notice" v-if="!canAddTask && currentChild">
      <p>免费版最多添加3个任务</p>
      <button class="btn-secondary" @click="goToUpgrade">升级解锁更多</button>
    </div>

    <div class="nav-bar">
      <router-link to="/" class="nav-item">
        <span class="nav-icon">🏠</span>
        <span>首页</span>
      </router-link>
      <router-link to="/children" class="nav-item">
        <span class="nav-icon">👶</span>
        <span>孩子</span>
      </router-link>
      <router-link to="/tasks" class="nav-item active">
        <span class="nav-icon">📋</span>
        <span>任务</span>
      </router-link>
      <router-link to="/rewards" class="nav-item">
        <span class="nav-icon">🎁</span>
        <span>奖励</span>
      </router-link>
    </div>

    <!-- 确认删除弹窗 -->
    <div class="modal" v-if="showDeleteConfirm">
      <div class="modal-content">
        <p>确定删除任务 "{{ deleteTarget?.name }}" 吗？</p>
        <div class="modal-btns">
          <button @click="showDeleteConfirm = false">取消</button>
          <button class="danger" @click="deleteTask">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../stores/store';
import type { Task } from '../types';

const router = useRouter();
const isPro = computed(() => store.isPro);
const children = computed(() => store.getChildren());
const currentChild = computed(() => store.getCurrentChild());

const selectedChildId = ref<string>('');
watch(currentChild, (child) => {
  if (child) selectedChildId.value = child.id;
}, { immediate: true });

const tasks = computed(() => store.getTasks(selectedChildId.value));
const canAddTask = computed(() => store.canAddTask(selectedChildId.value));

const iconOptions = ['🌅', '📚', '📖', '🏃', '🧹', '🍎', '💤', '✏️', '🎵', '🎨', '🚿', '🛏️'];
const presetTasks = [
  { name: '按时起床', icon: '🌅', points: 5, deductPoints: 3 },
  { name: '认真作业', icon: '📚', points: 10, deductPoints: 5 },
  { name: '主动阅读', icon: '📖', points: 5, deductPoints: 2 },
  { name: '整理房间', icon: '🧹', points: 5, deductPoints: 3 },
  { name: '早睡早起', icon: '💤', points: 5, deductPoints: 3 },
];

const newTask = ref({
  name: '',
  icon: '🌅',
  points: 5,
  deductPoints: 3,
});

const editingTask = ref<Task | null>(null);
const showDeleteConfirm = ref(false);
const deleteTarget = ref<Task | null>(null);

const applyPreset = (preset: typeof presetTasks[0]) => {
  newTask.value.name = preset.name;
  newTask.value.icon = preset.icon;
  newTask.value.points = preset.points;
  newTask.value.deductPoints = preset.deductPoints;
};

const saveTask = () => {
  if (!newTask.value.name.trim() || !selectedChildId.value) return;
  
  if (editingTask.value) {
    store.updateTask(editingTask.value.id, {
      name: newTask.value.name,
      icon: newTask.value.icon,
      points: newTask.value.points,
      deductPoints: newTask.value.deductPoints,
    });
    cancelEdit();
  } else {
    if (store.addTask(selectedChildId.value, newTask.value.name, newTask.value.points, newTask.value.deductPoints, newTask.value.icon)) {
      resetForm();
    }
  }
};

const editTask = (task: Task) => {
  editingTask.value = task;
  newTask.value = {
    name: task.name,
    icon: task.icon,
    points: task.points,
    deductPoints: task.deductPoints,
  };
};

const cancelEdit = () => {
  editingTask.value = null;
  resetForm();
};

const resetForm = () => {
  newTask.value = { name: '', icon: '🌅', points: 5, deductPoints: 3 };
};

const confirmDelete = (task: Task) => {
  deleteTarget.value = task;
  showDeleteConfirm.value = true;
};

const deleteTask = () => {
  if (deleteTarget.value) {
    store.removeTask(deleteTarget.value.id);
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
  }
};

const goToUpgrade = () => router.push('/upgrade');
</script>

<style scoped>
.tasks-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.header-bar {
  background: white;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn {
  font-size: 20px;
  color: #333;
  text-decoration: none;
}

.header-bar h2 {
  font-size: 17px;
  margin: 0;
}

.upgrade-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
}

.child-selector {
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.child-tab {
  padding: 8px 16px;
  background: white;
  border-radius: 20px;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
}

.child-tab.active {
  background: #667eea;
  color: white;
}

.tasks-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-icon {
  font-size: 28px;
}

.task-info {
  flex: 1;
}

.task-name {
  display: block;
  font-size: 15px;
  font-weight: 500;
}

.task-points {
  font-size: 12px;
  color: #999;
}

.edit-btn, .delete-btn {
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  cursor: pointer;
}

.edit-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.delete-btn {
  background: #ffebee;
  color: #f44336;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.empty-state .sub {
  font-size: 13px;
  margin-top: 8px;
}

.btn-link {
  display: inline-block;
  margin-top: 12px;
  color: #667eea;
}

.add-section {
  margin: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.add-section h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.icon-option {
  font-size: 24px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
}

.icon-option.selected {
  background: #e8e4f8;
}

.input-group {
  margin-bottom: 16px;
}

.input-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
}

.points-input {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.point-group {
  flex: 1;
}

.point-group label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  padding: 4px;
  border-radius: 8px;
}

.stepper button {
  width: 32px;
  height: 32px;
  border: none;
  background: white;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.stepper span {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
}

.preset-tasks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #666;
}

.preset-tasks button {
  padding: 4px 10px;
  background: #f5f5f5;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 13px;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
  margin-bottom: 10px;
}

.btn-primary:disabled {
  opacity: 0.5;
}

.btn-secondary {
  width: 100%;
  padding: 12px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}

.limit-notice {
  margin: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  text-align: center;
}

.limit-notice p {
  color: #999;
  margin-bottom: 12px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 16px;
  width: 80%;
  max-width: 300px;
  text-align: center;
}

.modal-btns {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.modal-btns button {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: #f5f5f5;
}

.modal-btns button.danger {
  background: #f44336;
  color: white;
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
