<template>
  <div class="page tasks-page">
    <div class="header-bar">
      <router-link to="/" class="back-btn">←</router-link>
      <h2>任务管理</h2>
      <button class="unlock-btn" @click="goToUpgrade" v-if="!isPro">解锁</button>
      <span v-else></span>
    </div>

    <!-- 孩子选择器 -->
    <div class="child-selector" v-if="children.length > 1">
      <button 
        v-for="child in children" 
        :key="child.id"
        class="child-tab"
        :class="{ active: selectedChildId === child.id }"
        @click="selectedChildId = child.id"
      >
        {{ child.avatar }} {{ child.name }}
      </button>
    </div>

    <!-- 任务列表 -->
    <div class="tasks-container" v-if="currentChild">
      <div class="tasks-list" v-if="tasks.length > 0">
        <div v-for="task in tasks" :key="task.id" class="task-card">
          <div class="task-icon-wrapper">
            <span class="task-icon">{{ task.icon }}</span>
          </div>
          <div class="task-info">
            <span class="task-name">{{ task.name }}</span>
            <div class="task-meta">
              <span class="task-points">
                <span class="plus">+{{ task.points }}</span>
                <span class="minus">-{{ task.deductPoints }}</span>
              </span>
              <span class="task-category" :style="{ color: getCategoryColor(task.category) }">
                {{ getCategoryLabel(task.category) }}
              </span>
            </div>
          </div>
          <div class="task-actions">
            <button class="action-btn edit" @click="editTask(task)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="action-btn delete" @click="confirmDelete(task)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="empty-state" v-else>
        <div class="empty-icon">📋</div>
        <p>还没有任务</p>
        <p class="sub">添加任务让孩子来完成吧</p>
      </div>
    </div>
    <div class="empty-state" v-else>
      <div class="empty-icon">👶</div>
      <p>请先添加孩子</p>
      <router-link to="/children" class="btn-link">去添加</router-link>
    </div>

    <!-- 添加/编辑表单 -->
    <div class="add-section" v-if="currentChild">
      <div class="form-header">
        <h3>{{ editingTask ? '编辑任务' : '添加新任务' }}</h3>
      </div>
      
      <!-- 图标选择 -->
      <div class="picker-section">
        <label class="picker-label">选择图标</label>
        <div class="icon-picker">
          <button 
            v-for="icon in iconOptions" 
            :key="icon"
            class="icon-option"
            :class="{ selected: newTask.icon === icon }"
            @click="newTask.icon = icon"
          >
            {{ icon }}
          </button>
        </div>
      </div>

      <!-- 分类选择 -->
      <div class="picker-section">
        <label class="picker-label">任务分类</label>
        <div class="category-picker">
          <button 
            v-for="cat in categoryOptions" 
            :key="cat"
            class="cat-option"
            :class="{ selected: newTask.category === cat }"
            :style="newTask.category === cat ? { background: getCategoryColor(cat) } : {}"
            @click="newTask.category = cat"
          >
            {{ getCategoryLabel(cat) }}
          </button>
        </div>
      </div>

      <!-- 任务名称 -->
      <div class="input-group">
        <input v-model="newTask.name" placeholder="输入任务名称，如：按时起床" />
      </div>

      <!-- 积分设置 -->
      <div class="points-row">
        <div class="point-group">
          <label>完成加分</label>
          <div class="stepper">
            <button @click="newTask.points = Math.max(1, newTask.points - 1)">−</button>
            <span class="value">{{ newTask.points }}</span>
            <button @click="newTask.points++">+</button>
          </div>
        </div>
        <div class="point-group">
          <label>未完成扣分</label>
          <div class="stepper">
            <button @click="newTask.deductPoints = Math.max(0, newTask.deductPoints - 1)">−</button>
            <span class="value">{{ newTask.deductPoints }}</span>
            <button @click="newTask.deductPoints++">+</button>
          </div>
        </div>
      </div>

      <!-- 预设任务 -->
      <div class="presets-section">
        <label class="picker-label">快速添加</label>
        <div class="preset-tasks">
          <button 
            v-for="preset in presetTasks" 
            :key="preset.name"
            class="preset-btn"
            @click="applyPreset(preset)"
          >
            <span>{{ preset.icon }}</span>
            <span>{{ preset.name }}</span>
          </button>
        </div>
      </div>

      <!-- 提交按钮 -->
      <button class="btn-primary" @click="saveTask" :disabled="!newTask.name.trim()">
        {{ editingTask ? '保存修改' : '添加任务' }}
      </button>
      <button class="btn-secondary" v-if="editingTask" @click="cancelEdit">取消</button>
    </div>

    <!-- 限制提示 -->
    <div class="limit-card" v-if="!canAddTask && currentChild">
      <div class="limit-icon">⚡</div>
      <p>免费版最多添加 3 个任务</p>
      <button class="btn-secondary" @click="goToUpgrade">升级解锁更多</button>
    </div>

    <!-- 底部导航 -->
    <BottomNav />

    <!-- 确认删除弹窗 -->
    <div class="modal" v-if="showDeleteConfirm">
      <div class="modal-content">
        <div class="modal-icon">⚠️</div>
        <p>确定删除任务</p>
        <p class="task-name-confirm">"{{ deleteTarget?.name }}"</p>
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
import type { Task, TaskCategory } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import BottomNav from '../components/BottomNav.vue';

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

const iconOptions = ['🌅', '📚', '📖', '🏃', '🧹', '🍎', '💤', '✏️', '🎵', '🎨', '🚿', '🛏️', '🧼', '🦷', '🎮'];
const categoryOptions: TaskCategory[] = ['study', 'life', 'exercise', 'other'];

const presetTasks = [
  { name: '按时起床', icon: '🌅', points: 5, deductPoints: 3, category: 'life' as TaskCategory },
  { name: '认真作业', icon: '📚', points: 10, deductPoints: 5, category: 'study' as TaskCategory },
  { name: '主动阅读', icon: '📖', points: 5, deductPoints: 2, category: 'study' as TaskCategory },
  { name: '整理房间', icon: '🧹', points: 5, deductPoints: 3, category: 'life' as TaskCategory },
  { name: '早睡早起', icon: '💤', points: 5, deductPoints: 3, category: 'life' as TaskCategory },
  { name: '体育锻炼', icon: '🏃', points: 8, deductPoints: 4, category: 'exercise' as TaskCategory },
];

const newTask = ref({
  name: '',
  icon: '🌅',
  points: 5,
  deductPoints: 3,
  category: 'other' as TaskCategory,
});

const editingTask = ref<Task | null>(null);
const showDeleteConfirm = ref(false);
const deleteTarget = ref<Task | null>(null);

const applyPreset = (preset: typeof presetTasks[0]) => {
  newTask.value.name = preset.name;
  newTask.value.icon = preset.icon;
  newTask.value.points = preset.points;
  newTask.value.deductPoints = preset.deductPoints;
  newTask.value.category = preset.category;
};

const saveTask = () => {
  if (!newTask.value.name.trim() || !selectedChildId.value) return;
  
  if (editingTask.value) {
    store.updateTask(editingTask.value.id, {
      name: newTask.value.name,
      icon: newTask.value.icon,
      points: newTask.value.points,
      deductPoints: newTask.value.deductPoints,
      category: newTask.value.category,
    });
    cancelEdit();
  } else {
    if (store.addTask(selectedChildId.value, newTask.value.name, newTask.value.points, newTask.value.deductPoints, newTask.value.icon, newTask.value.category)) {
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
    category: task.category || 'other',
  };
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const cancelEdit = () => {
  editingTask.value = null;
  resetForm();
};

const resetForm = () => {
  newTask.value = { name: '', icon: '🌅', points: 5, deductPoints: 3, category: 'other' };
};

const getCategoryLabel = (cat: TaskCategory) => CATEGORY_LABELS[cat];
const getCategoryColor = (cat: TaskCategory) => CATEGORY_COLORS[cat];

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
  background: var(--color-bg);
}

/* Header Bar */
.unlock-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 500;
  box-shadow: var(--shadow-md);
}

/* Child Selector */
.child-selector {
  padding: var(--space-md);
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.child-tab {
  padding: 10px 20px;
  background: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.child-tab.active {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-md);
}

/* Tasks Container */
.tasks-container {
  padding: 0 var(--space-md);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.task-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.task-card:active {
  transform: scale(0.99);
}

.task-icon-wrapper {
  width: 48px;
  height: 48px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-icon {
  font-size: 24px;
}

.task-info {
  flex: 1;
}

.task-info .task-name {
  display: block;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.task-points {
  font-size: var(--font-size-xs);
}

.task-points .plus {
  color: var(--color-success);
  font-weight: 600;
}

.task-points .minus {
  color: var(--color-text-muted);
  margin-left: 4px;
}

.task-category {
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.task-actions {
  display: flex;
  gap: var(--space-xs);
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.action-btn.edit {
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.action-btn:active {
  transform: scale(0.95);
}

/* Empty State */
.empty-state {
  padding: var(--space-2xl) var(--space-md);
  text-align: center;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: var(--space-md);
}

.empty-state p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

.empty-state .sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-xs);
}

.btn-link {
  display: inline-block;
  margin-top: var(--space-md);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

/* Add Section */
.add-section {
  margin: var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding-bottom: 80px;
}

.form-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--space-lg);
  text-align: center;
}

.picker-section {
  margin-bottom: var(--space-lg);
}

.picker-label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
  font-weight: 500;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.icon-option {
  width: 44px;
  height: 44px;
  font-size: 22px;
  background: var(--color-bg);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-option.selected {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--color-primary);
  transform: scale(1.1);
}

.category-picker {
  display: flex;
  gap: var(--space-sm);
}

.cat-option {
  flex: 1;
  padding: 10px var(--space-sm);
  background: var(--color-bg);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
  font-weight: 500;
}

.cat-option.selected {
  color: white;
  box-shadow: var(--shadow-sm);
}

/* Points Row */
.points-row {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.point-group {
  flex: 1;
}

.point-group label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
  text-align: center;
}

.stepper {
  display: flex;
  align-items: center;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: var(--space-xs);
}

.stepper button {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.stepper button:active {
  transform: scale(0.95);
  box-shadow: none;
}

.stepper .value {
  flex: 1;
  text-align: center;
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-primary);
}

/* Presets */
.presets-section {
  margin-bottom: var(--space-lg);
}

.preset-tasks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--color-bg);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preset-btn:active {
  transform: scale(0.98);
  background: var(--color-bg-card);
}

/* Limit Card */
.limit-card {
  margin: var(--space-md);
  padding: var(--space-lg);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%);
  border: 1px dashed var(--color-primary);
  border-radius: var(--radius-lg);
  text-align: center;
}

.limit-icon {
  font-size: 32px;
  margin-bottom: var(--space-sm);
}

.limit-card p {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
}

/* Modal */
.modal-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
}

.task-name-confirm {
  font-weight: 600;
  color: var(--color-text);
  margin: var(--space-sm) 0 var(--space-md);
}
</style>
