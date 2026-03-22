<template>
  <div class="page projects-page">
    <!-- 孩子选择器 -->
    <ChildSelector @child-changed="onChildChanged" />

    <!-- Tab 切换 -->
    <div class="tab-bar">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- 我的 Tab -->
    <div v-if="activeTab === 'mine'" class="tab-content">
      <!-- 创建新项目 -->
      <div class="create-section">
        <div class="create-header">
          <h3>🤖 AI智能创建项目</h3>
          <p class="subtitle">告诉AI你想培养什么能力，让AI帮你规划</p>
        </div>

        <div class="input-group">
          <input 
            v-model="newProjectGoal" 
            placeholder="例如：培养时间管理能力"
            @keyup.enter="generateProject"
          />
        </div>

        <!-- 时长选择 -->
        <div class="duration-select">
          <span class="label">项目时长：</span>
          <div class="duration-options">
            <button 
              v-for="d in durationOptions" 
              :key="d"
              class="duration-btn"
              :class="{ active: selectedDuration === d }"
              @click="selectedDuration = d"
            >
              {{ d }}天
            </button>
          </div>
        </div>

        <button 
          class="btn-primary ai-btn"
          @click="generateProject"
          :disabled="!newProjectGoal.trim() || isGenerating"
        >
          <span v-if="isGenerating">🤖 AI设计中...</span>
          <span v-else>🤖 让AI设计项目</span>
        </button>

        <!-- AI 生成预览 -->
        <div v-if="aiGeneratedProject" class="ai-preview">
          <div class="preview-header">
            <h4>{{ aiGeneratedProject.icon }} {{ aiGeneratedProject.name }}</h4>
            <p>{{ aiGeneratedProject.vision }}</p>
          </div>
          <div class="preview-stats">
            <span>📅 {{ aiGeneratedProject.duration }}天</span>
            <span>📊 {{ aiGeneratedProject.steps.length }}个阶段</span>
            <span>✅ {{ getTotalTasks() }}个任务</span>
          </div>
          <button class="btn-secondary" @click="showReviewModal = true">
            👀 预览详情 & 审核
          </button>
        </div>
      </div>

      <!-- 进行中的项目 -->
      <div v-if="activeProjects.length > 0" class="projects-list">
        <h3 class="section-title">进行中的项目</h3>
        <div 
          v-for="project in activeProjects" 
          :key="project.id" 
          class="project-card"
          @click="viewProject(project)"
        >
          <div class="project-icon">{{ project.icon }}</div>
          <div class="project-info">
            <h4>{{ project.name }}</h4>
            <p class="project-vision">{{ project.vision }}</p>
            <div class="project-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getProjectProgress(project) + '%' }"></div>
              </div>
              <span class="progress-text">{{ getProjectProgress(project) }}%</span>
            </div>
          </div>
          <button class="action-btn" @click.stop="deleteProject(project)">×</button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">🎯</div>
        <p>还没有进行中的项目</p>
        <p class="sub">使用AI创建你的第一个成长项目吧！</p>
      </div>
    </div>

    <!-- 任务管理 Tab -->
    <div v-if="activeTab === 'tasks'" class="tab-content">
      <router-link to="/tasks" class="tab-link-card">
        <span class="link-icon">📋</span>
        <span class="link-text">日常任务管理</span>
        <span class="link-arrow">→</span>
      </router-link>
      <p class="tab-tip">管理孩子的日常任务和打卡</p>
    </div>

    <!-- 项目管理 Tab -->
    <div v-if="activeTab === 'templates'" class="tab-content">
      <p class="tab-tip">项目管理模板功能开发中...</p>
    </div>

    <!-- 底部导航 -->
    <BottomNav />

    <!-- 家长审核弹窗 -->
    <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal = false">
      <div class="review-modal">
        <div class="modal-header">
          <h3>👀 审核AI生成内容</h3>
          <button class="close-btn" @click="showReviewModal = false">×</button>
        </div>
        
        <div class="modal-body">
          <!-- 项目愿景 -->
          <div class="review-section">
            <label>🎯 目标愿景</label>
            <textarea 
              v-model="reviewData.vision" 
              rows="2"
              class="review-textarea"
            ></textarea>
          </div>

          <!-- 阶段列表 -->
          <div v-for="(step, sIdx) in reviewData.steps" :key="sIdx" class="review-section">
            <div class="step-header">
              <label>── 第{{ step.stepNumber }}阶段: {{ step.name }} ({{ step.startDay }}-{{ step.endDay }}天) ──</label>
            </div>
            
            <!-- 任务列表 -->
            <div v-for="(task, tIdx) in step.tasks" :key="tIdx" class="review-task-item">
              <div class="task-header">
                <span class="task-day">📅 第{{ task.day }}天</span>
                <button class="delete-task-btn" @click="deleteReviewTask(sIdx, tIdx)">删除</button>
              </div>
              <input 
                v-model="task.title" 
                placeholder="任务标题"
                class="review-input"
              />
              <textarea 
                v-model="task.description" 
                placeholder="任务描述"
                rows="2"
                class="review-textarea"
              ></textarea>
              <div class="task-meta">
                <span>⏱️ {{ task.duration }}</span>
                <span>{{ task.type }}</span>
              </div>
              <p class="task-tip">{{ task.tip }}</p>
            </div>

            <!-- 添加任务按钮 -->
            <button class="add-task-btn" @click="addReviewTask(sIdx)">
              + 添加任务
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="showReviewModal = false">取消</button>
          <button class="btn-primary" @click="confirmAndStartProject">全部通过，开始项目</button>
        </div>
      </div>
    </div>

    <!-- 项目详情弹窗 -->
    <div v-if="selectedProject" class="modal-overlay" @click.self="selectedProject = null">
      <div class="project-detail-modal">
        <div class="modal-header">
          <h3>{{ selectedProject.icon }} {{ selectedProject.name }}</h3>
          <button class="close-btn" @click="selectedProject = null">×</button>
        </div>
        
        <div class="modal-body">
          <p class="project-vision-detail">{{ selectedProject.vision }}</p>
          
          <!-- 进度 -->
          <div class="detail-progress">
            <div class="progress-bar large">
              <div class="progress-fill" :style="{ width: getProjectProgress(selectedProject) + '%' }"></div>
            </div>
            <span>第{{ getCurrentProjectDay() }}天 / 共{{ selectedProject.duration }}天</span>
          </div>

          <!-- 阶段卡片 -->
          <div class="steps-showcase">
            <div 
              v-for="(step, idx) in selectedProjectSteps" 
              :key="idx"
              class="step-card"
              :class="{ 
                completed: idx < selectedProjectSteps.filter((_, i) => i < idx && isStepCompleted(selectedProject!.id, i + 1)).length,
                current: idx === (selectedProject?.currentStep ?? 1) - 1,
                locked: idx > (selectedProject?.currentStep ?? 1) - 1
              }"
            >
              <span class="step-status">
                <template v-if="idx < selectedProjectSteps.filter((_, i) => i < idx && isStepCompleted(selectedProject!.id, i + 1)).length">✅</template>
                <template v-else-if="idx === (selectedProject?.currentStep ?? 1) - 1">🔓</template>
                <template v-else>🔒</template>
              </span>
              <span class="step-name">{{ step.name }}</span>
            </div>
          </div>

          <!-- 今日任务 -->
          <div v-if="todayTasks.length > 0" class="today-task-section">
            <h4>📅 今日任务 (第{{ getCurrentProjectDay() }}天)</h4>
            <div v-for="task in todayTasks" :key="task.id" class="today-task-card">
              <div class="task-info">
                <span class="task-title">{{ task.title }}</span>
                <span class="task-duration">⏱️ {{ task.duration }}</span>
              </div>
              <p class="task-desc">{{ task.description }}</p>
              <p class="task-tip">{{ task.tip }}</p>
              <div class="task-actions">
                <button 
                  v-if="task.status === 'pending'"
                  class="btn-complete"
                  @click="completeTask(task)"
                >
                  ✅ 完成打卡
                </button>
                <span v-else class="task-completed">已完成 ✓</span>
              </div>
            </div>
          </div>
          <div v-else class="no-task">
            <p>今天的任务已完成，明天继续加油！</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { store } from '../stores/store';
import { aiService } from '../services/ai';
import type { Project, AIProjectResult, AIStepResult, GeneratedProjectTask } from '../types';
import BottomNav from '../components/BottomNav.vue';
import ChildSelector from '../components/ChildSelector.vue';

const tabs = [
  { id: 'mine', name: '我的', icon: '👤' },
  { id: 'tasks', name: '任务管理', icon: '📋' },
  { id: 'templates', name: '项目管理', icon: '📁' },
];

const activeTab = ref('mine');
const currentChild = computed(() => store.getCurrentChild());

const onChildChanged = (_childId: string) => {
  // 刷新项目列表
};

// 创建项目
const newProjectGoal = ref('');
const selectedDuration = ref(14);
const durationOptions = [7, 14, 21, 30];
const isGenerating = ref(false);
const aiGeneratedProject = ref<AIProjectResult | null>(null);
const showReviewModal = ref(false);
const selectedProject = ref<Project | null>(null);

// 审核数据
const reviewData = ref<AIProjectResult>({
  name: '',
  description: '',
  duration: 14,
  difficulty: 1,
  icon: '',
  rewardPoints: 0,
  vision: '',
  finalProduct: '',
  realWorldConnection: '',
  steps: [],
});

// 项目列表
const activeProjects = computed(() => {
  if (!currentChild.value) return [];
  return store.getActiveProjects(currentChild.value.id);
});

  // 项目详情
const selectedProjectSteps = computed(() => {
  if (!selectedProject.value) return [];
  const duration = selectedProject.value.duration;
  const steps: AIStepResult[] = [];
  
  // 简化：直接从AI结果重建阶段信息
  // 实际项目中应该存储完整阶段信息
  const daysPerStep = Math.ceil(duration / 4);
  
  for (let i = 0; i < 4; i++) {
    const startDay = i * daysPerStep + 1;
    const endDay = Math.min((i + 1) * daysPerStep, duration);
    if (startDay <= duration) {
      steps.push({
        stepNumber: i + 1,
        name: `阶段${i + 1}`,
        description: '',
        startDay,
        endDay,
        celebration: '',
        tasks: [],
      });
    }
  }
  
  return steps;
});

const todayTasks = computed(() => {
  if (!selectedProject.value) return [];
  return store.getTodayProjectTasks(selectedProject.value.id);
});

// 方法
const generateProject = async () => {
  if (!newProjectGoal.value.trim() || isGenerating.value) return;
  
  isGenerating.value = true;
  try {
    const result = await aiService.generateProject(newProjectGoal.value, selectedDuration.value);
    aiGeneratedProject.value = result;
    reviewData.value = JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error('Failed to generate project:', error);
  } finally {
    isGenerating.value = false;
  }
};

const getTotalTasks = (): number => {
  if (!aiGeneratedProject.value) return 0;
  return aiGeneratedProject.value.steps.reduce((sum, step) => sum + step.tasks.length, 0);
};

const getProjectProgress = (project: Project): number => {
  const tasks = store.getProjectTasks(project.id);
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
};

const getCurrentProjectDay = (): number => {
  if (!selectedProject.value) return 0;
  return store.getProjectDay(selectedProject.value.id);
};

const isStepCompleted = (projectId: string, stepNumber: number): boolean => {
  const tasks = store.getProjectTasks(projectId);
  const stepTasks = tasks.filter(t => t.stepNumber === stepNumber);
  return stepTasks.length > 0 && stepTasks.every(t => t.status === 'completed');
};

const deleteReviewTask = (stepIdx: number, taskIdx: number) => {
  reviewData.value.steps[stepIdx].tasks.splice(taskIdx, 1);
};

const addReviewTask = (stepIdx: number) => {
  const step = reviewData.value.steps[stepIdx];
  const lastTaskDay = step.tasks.length > 0 
    ? step.tasks[step.tasks.length - 1].day 
    : step.startDay - 1;
  
  step.tasks.push({
    day: lastTaskDay + 1,
    title: '新任务',
    description: '请描述任务内容...',
    duration: '15分钟',
    tip: '💡 加油！',
    type: 'act' as const,
  });
};

const confirmAndStartProject = () => {
  if (!currentChild.value || !aiGeneratedProject.value) return;
  
  // 创建项目
  const project = store.addProject(currentChild.value.id, reviewData.value);
  
  // 创建故事
  store.createProjectStory(
    project.id,
    reviewData.value.vision,
    reviewData.value.steps.map(s => ({
      stepNumber: s.stepNumber,
      title: s.name,
      celebration: s.celebration,
    }))
  );
  
  // 添加微任务
  store.addProjectTasks(project.id, reviewData.value.steps);
  
  // 关闭弹窗
  showReviewModal.value = false;
  aiGeneratedProject.value = null;
  newProjectGoal.value = '';
  
  // 显示新项目
  viewProject(project);
};

const viewProject = (project: Project) => {
  selectedProject.value = project;
};

const completeTask = (task: GeneratedProjectTask) => {
  store.completeProjectTask(task.id);
};

const deleteProject = (project: Project) => {
  if (confirm(`确定删除项目"${project.name}"吗？`)) {
    store.deleteProject(project.id);
  }
};
</script>

<style scoped>
.projects-page {
  padding-bottom: 80px;
}

.header-bar h2 {
  text-align: center;
  padding: var(--space-md);
  font-size: var(--font-size-xl);
}

/* Tab Bar */
.tab-bar {
  display: flex;
  padding: 0 var(--space-md);
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.tab-btn {
  flex: 1;
  padding: 10px;
  background: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--color-primary);
  color: white;
}

/* Create Section */
.create-section {
  margin: var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
}

.create-header h3 {
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-xs);
}

.subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-md);
}

.input-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  margin-bottom: var(--space-md);
}

.input-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Duration Select */
.duration-select {
  margin-bottom: var(--space-md);
}

.duration-select .label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
}

.duration-options {
  display: flex;
  gap: var(--space-sm);
}

.duration-btn {
  flex: 1;
  padding: 10px;
  background: var(--color-bg);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.duration-btn.active {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* AI Preview */
.ai-preview {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05));
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-primary);
}

.preview-header h4 {
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-xs);
}

.preview-header p {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
}

.preview-stats {
  display: flex;
  gap: var(--space-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-md);
}

.ai-btn {
  width: 100%;
}

/* Project Cards */
.projects-list {
  padding: 0 var(--space-md);
}

.section-title {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
}

.project-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.project-card:active {
  transform: scale(0.98);
}

.project-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-info {
  flex: 1;
}

.project-info h4 {
  font-size: var(--font-size-base);
  margin-bottom: 4px;
}

.project-vision {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-sm);
}

.project-progress {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-bg);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  transition: width 0.3s;
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  font-weight: 600;
}

.action-btn {
  width: 32px;
  height: 32px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 18px;
  cursor: pointer;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-2xl);
}

.empty-icon {
  font-size: 56px;
  margin-bottom: var(--space-md);
}

.empty-state p {
  color: var(--color-text-secondary);
}

.sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-xs);
}

/* Tab Link */
.tab-link-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin: var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-text);
}

.link-icon {
  font-size: 24px;
}

.link-text {
  flex: 1;
  font-weight: 500;
}

.link-arrow {
  color: var(--color-text-muted);
}

.tab-tip {
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  padding: var(--space-md);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.review-modal,
.project-detail-modal {
  width: 100%;
  max-height: 85vh;
  background: var(--color-bg);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  font-size: var(--font-size-lg);
}

.close-btn {
  width: 32px;
  height: 32px;
  background: var(--color-bg);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md);
}

.modal-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg-card);
  border-top: 1px solid var(--color-border);
}

.modal-footer .btn-secondary,
.modal-footer .btn-primary {
  flex: 1;
}

/* Review Section */
.review-section {
  margin-bottom: var(--space-lg);
}

.review-section label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--space-sm);
}

.step-header {
  margin-bottom: var(--space-md);
}

.review-input,
.review-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-sm);
  resize: none;
}

.review-textarea {
  font-family: inherit;
}

/* Review Task Item */
.review-task-item {
  padding: var(--space-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-sm);
}

.task-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.task-day {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
}

.delete-task-btn {
  padding: 4px 8px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
}

.task-meta {
  display: flex;
  gap: var(--space-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: var(--space-sm) 0;
}

.task-tip {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
}

.add-task-btn {
  width: 100%;
  padding: 10px;
  background: var(--color-bg);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.add-task-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Project Detail */
.project-vision-detail {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-lg);
}

.detail-progress {
  margin-bottom: var(--space-lg);
  text-align: center;
}

.detail-progress span {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-xs);
}

.progress-bar.large {
  height: 10px;
}

/* Steps Showcase */
.steps-showcase {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  overflow-x: auto;
  padding: var(--space-xs);
}

.step-card {
  flex: 1;
  min-width: 70px;
  padding: var(--space-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  text-align: center;
  transition: all 0.2s;
}

.step-card.completed {
  background: rgba(16, 185, 129, 0.1);
}

.step-card.current {
  background: rgba(99, 102, 241, 0.1);
  border: 2px solid var(--color-primary);
}

.step-card.locked {
  opacity: 0.5;
}

.step-status {
  display: block;
  font-size: 20px;
  margin-bottom: 4px;
}

.step-name {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* Today Task */
.today-task-section h4 {
  font-size: var(--font-size-base);
  margin-bottom: var(--space-md);
}

.today-task-card {
  padding: var(--space-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-md);
}

.today-task-card .task-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.task-title {
  font-weight: 600;
  font-size: var(--font-size-base);
}

.task-duration {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
}

.task-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
}

.task-actions {
  margin-top: var(--space-md);
}

.btn-complete {
  width: 100%;
  padding: 12px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
}

.task-completed {
  display: block;
  text-align: center;
  color: var(--color-success);
  font-weight: 600;
}

.no-task {
  text-align: center;
  padding: var(--space-lg);
  color: var(--color-text-muted);
}

/* Buttons */
.btn-primary {
  padding: 12px 24px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 12px 24px;
  background: var(--color-bg);
  color: var(--color-text);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
}
</style>
