<template>
  <div class="page study-page">
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

    <!-- 学习任务 Tab -->
    <div v-if="activeTab === 'tasks'" class="tab-content">
      <!-- 添加任务按钮 -->
      <div class="add-task-bar">
        <button class="add-btn" @click="showAddForm = !showAddForm">
          {{ showAddForm ? '收起' : '+ 添加学习任务' }}
        </button>
        <button class="ai-btn" @click="openAIModal">
          🤖 AI创建
        </button>
      </div>

      <!-- AI 创建弹窗 -->
      <div v-if="showAIModal" class="modal-overlay" @click.self="showAIModal = false">
        <div class="modal-content ai-modal">
          <div class="modal-header">
            <h3>🤖 AI 创建学习任务</h3>
            <button class="modal-close" @click="showAIModal = false">×</button>
          </div>
          
          <div class="modal-body">
            <div class="ai-input-section">
              <label>描述学习目标</label>
              <input 
                v-model="aiGoal" 
                placeholder="例如：提高数学计算能力、培养阅读习惯"
                class="form-input"
                @keyup.enter="generateAIStudyTasks"
              />
              <button class="btn-ai-generate" @click="generateAIStudyTasks" :disabled="aiLoading">
                {{ aiLoading ? '生成中...' : '生成任务' }}
              </button>
            </div>

            <div v-if="aiGeneratedTasks.length > 0" class="ai-tasks-preview">
              <p class="preview-title">生成的学习任务（点击选择）:</p>
              <div v-for="(task, index) in aiGeneratedTasks" :key="index" 
                class="ai-task-item"
                :class="{ selected: selectedAITasks.has(index) }"
                @click="toggleAITaskSelection(index)"
              >
                <div class="task-check">
                  <span v-if="selectedAITasks.has(index)">✓</span>
                </div>
                <div class="task-details">
                  <div class="task-name-row">
                    <span class="task-name">{{ task.name }}</span>
                    <span class="task-subject">{{ task.subject }}</span>
                  </div>
                  <div class="task-meta-row">
                    <span>⏱️ {{ task.estimatedMinutes }}分钟</span>
                    <span>{{ getTimerModeLabel(task.timerMode) }}</span>
                  </div>
                  <p v-if="task.tip" class="task-tip">{{ task.tip }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="showAIModal = false">取消</button>
            <button 
              class="btn-confirm" 
              @click="confirmAICreateTasks"
              :disabled="selectedAITasks.size === 0"
            >
              确定创建 ({{ selectedAITasks.size }})
            </button>
          </div>
        </div>
      </div>

      <!-- 添加表单 -->
      <div v-if="showAddForm" class="add-form">
        <div class="form-row">
          <label>任务名称</label>
          <input v-model="newTask.name" placeholder="例如：数学作业" class="form-input" />
        </div>
        <div class="form-row">
          <label>关联科目</label>
          <select v-model="newTask.subject" class="form-select">
            <option value="">选择科目</option>
            <option value="语文">语文</option>
            <option value="数学">数学</option>
            <option value="英语">英语</option>
            <option value="科学">科学</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div class="form-row inline">
          <div class="form-col">
            <label>计划时间</label>
            <input v-model="newTask.scheduledTime" type="time" class="form-input" />
          </div>
          <div class="form-col">
            <label>预计时长</label>
            <input v-model.number="newTask.estimatedMinutes" type="number" min="1" max="180" class="form-input" />
          </div>
        </div>
        <div class="form-row">
          <label>计时模式</label>
          <div class="timer-modes">
            <button 
              v-for="mode in timerModes" 
              :key="mode.value"
              class="mode-btn"
              :class="{ active: newTask.timerMode === mode.value }"
              @click="newTask.timerMode = mode.value as StudyTask['timerMode']"
            >
              {{ mode.icon }} {{ mode.label }}
            </button>
          </div>
        </div>
        <div v-if="newTask.timerMode === 'countdown'" class="form-row">
          <label>倒计时分钟</label>
          <input v-model.number="newTask.countdownMinutes" type="number" min="1" max="120" class="form-input short" />
        </div>
        <div v-if="newTask.timerMode === 'pomodoro'" class="form-row">
          <label>番茄钟数量</label>
          <input v-model.number="newTask.totalPomodoros" type="number" min="1" max="10" class="form-input short" />
        </div>
        <button class="btn-primary" @click="addTask" :disabled="!newTask.name.trim()">
          添加任务
        </button>
      </div>

      <!-- 待复习提醒 -->
      <div v-if="dueReviews.length > 0" class="review-section">
        <h3 class="section-title">🔄 待复习 ({{ dueReviews.length }})</h3>
        <div v-for="review in dueReviews" :key="review.task.id + review.dueDate" class="review-card">
          <div class="review-info">
            <span class="review-name">{{ review.task.name }}</span>
            <span class="review-date">{{ formatDate(review.dueDate) }} 复习</span>
          </div>
          <button class="review-btn" @click="completeReview(review)">复习完成</button>
        </div>
      </div>

      <!-- 学习任务列表 -->
      <div class="tasks-list">
        <div v-for="task in studyTasks" :key="task.id" class="study-task-card">
          <div class="task-header">
            <div class="task-main">
              <span class="task-icon">{{ getSubjectIcon(task.subject) }}</span>
              <div class="task-info">
                <span class="task-name">{{ task.name }}</span>
                <span class="task-meta">
                  {{ task.subject }} · {{ task.estimatedMinutes }}分钟
                  <span v-if="task.scheduledTime"> · {{ task.scheduledTime }}</span>
                </span>
              </div>
            </div>
            <button class="delete-btn" @click="deleteTask(task)">×</button>
          </div>

          <!-- 计时器区域 -->
          <div v-if="task.timerMode !== 'none'" class="timer-section">
            <div class="timer-display">
              <template v-if="task.timerMode === 'stopwatch'">
                <span class="timer-value">{{ formatTime(getTotalSeconds(task)) }}</span>
                <span class="timer-label">正计时</span>
              </template>
              <template v-else-if="task.timerMode === 'countdown'">
                <span class="timer-value" :class="{ warning: getRemainingSeconds(task) < 60 }">
                  {{ formatTime(getRemainingSeconds(task)) }}
                </span>
                <span class="timer-label">倒计时</span>
              </template>
              <template v-else-if="task.timerMode === 'pomodoro'">
                <span class="timer-value">🍅 {{ task.currentPomodoro || 0 }}/{{ task.totalPomodoros || 4 }}</span>
                <span class="timer-label">番茄钟</span>
              </template>
            </div>
            <div class="timer-controls">
              <button 
                v-if="task.status === 'pending' || task.status === 'paused'"
                class="timer-btn start"
                @click="startTask(task)"
                :disabled="isOtherTaskRunning(task)"
              >
                ▶️ 开始
              </button>
              <button 
                v-if="task.status === 'in_progress'"
                class="timer-btn pause"
                @click="pauseTask(task)"
              >
                ⏸️ 暂停
              </button>
              <button 
                v-if="task.status === 'in_progress' || task.status === 'paused'"
                class="timer-btn complete"
                @click="completeTask(task)"
              >
                ✅ 完成
              </button>
            </div>
          </div>

          <!-- 状态标签 -->
          <div class="task-status">
            <span v-if="task.status === 'completed'" class="status-badge completed">已完成</span>
            <span v-else-if="task.status === 'in_progress'" class="status-badge running">进行中</span>
            <span v-else-if="task.status === 'paused'" class="status-badge paused">已暂停</span>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="studyTasks.length === 0" class="empty-state">
          <div class="empty-icon">📚</div>
          <p>还没有学习任务</p>
          <p class="sub">添加学习任务，开始计时学习吧</p>
        </div>
      </div>
    </div>

    <!-- 成绩管理 Tab -->
    <div v-if="activeTab === 'scores'" class="tab-content">
      <!-- 科目筛选 -->
      <div class="subject-filter">
        <button 
          class="filter-chip"
          :class="{ active: scoreFilter === '' }"
          @click="scoreFilter = ''"
        >
          全部
        </button>
        <button 
          v-for="subject in subjects"
          :key="subject"
          class="filter-chip"
          :class="{ active: scoreFilter === subject }"
          @click="scoreFilter = subject"
        >
          {{ subject }}
        </button>
      </div>

      <!-- 添加成绩按钮 -->
      <div class="add-score-bar">
        <button class="add-score-btn" @click="openScoreModal()">
          + 添加成绩
        </button>
      </div>

      <!-- 成绩列表 -->
      <div class="scores-list">
        <div v-for="score in filteredScores" :key="score.id" class="score-card">
          <div class="score-header">
            <div class="score-info">
              <span class="score-subject">{{ score.subject }}</span>
              <span class="score-type">{{ scoreTypeLabels[score.type] }}</span>
            </div>
            <div class="score-actions">
              <button class="action-btn edit" @click="openScoreModal(score)">✏️</button>
              <button class="action-btn delete" @click="deleteScoreRecord(score)">🗑️</button>
            </div>
          </div>
          <div class="score-main">
            <span class="score-value">{{ score.score }}</span>
            <span class="score-divider">/</span>
            <span class="score-full">{{ score.fullScore }}</span>
            <span class="score-percentage">({{ Math.round((score.score / score.fullScore) * 100) }}%)</span>
          </div>
          <div class="score-meta">
            <span class="score-name">{{ score.name }}</span>
            <span class="score-date">{{ formatScoreDate(score.date) }}</span>
          </div>
          <p v-if="score.note" class="score-note">{{ score.note }}</p>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredScores.length === 0" class="empty-state">
          <div class="empty-icon">📊</div>
          <p>还没有成绩记录</p>
          <p class="sub">点击上方按钮添加成绩</p>
        </div>
      </div>

      <!-- 添加/编辑成绩弹窗 -->
      <div v-if="showScoreModal" class="modal-overlay" @click.self="closeScoreModal">
        <div class="modal-content score-modal">
          <div class="modal-header">
            <h3>{{ editingScore ? '编辑成绩' : '添加成绩' }}</h3>
            <button class="modal-close" @click="closeScoreModal">×</button>
          </div>
          
          <div class="modal-body">
            <div class="form-row">
              <label>科目</label>
              <select v-model="scoreForm.subject" class="form-select">
                <option value="">选择科目</option>
                <option v-for="s in subjects" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="form-row">
              <label>成绩类型</label>
              <select v-model="scoreForm.type" class="form-select">
                <option v-for="(label, key) in scoreTypeLabels" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>
            <div class="form-row">
              <label>名称</label>
              <input v-model="scoreForm.name" placeholder="例如：期中考试" class="form-input" />
            </div>
            <div class="form-row inline">
              <div class="form-col">
                <label>得分</label>
                <input v-model.number="scoreForm.score" type="number" min="0" class="form-input" />
              </div>
              <div class="form-col">
                <label>满分</label>
                <input v-model.number="scoreForm.fullScore" type="number" min="1" class="form-input" />
              </div>
            </div>
            <div class="form-row">
              <label>日期</label>
              <input v-model="scoreForm.date" type="date" class="form-input" />
            </div>
            <div class="form-row">
              <label>备注（可选）</label>
              <input v-model="scoreForm.note" placeholder="添加备注" class="form-input" />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeScoreModal">取消</button>
            <button class="btn-confirm" @click="saveScore" :disabled="!isScoreFormValid">
              保存
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 成绩趋势 Tab -->
    <div v-if="activeTab === 'trends'" class="tab-content">
      <!-- 学习统计概览 -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-info">
            <span class="stat-value">{{ studyStats.totalMinutes }}</span>
            <span class="stat-label">总学习(分钟)</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <span class="stat-value">{{ studyStats.todayMinutes }}</span>
            <span class="stat-label">今日(分钟)</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📆</div>
          <div class="stat-info">
            <span class="stat-value">{{ studyStats.weekMinutes }}</span>
            <span class="stat-label">本周(分钟)</span>
          </div>
        </div>
      </div>

      <!-- 每日学习时间趋势 -->
      <div class="trend-section">
        <h3 class="section-title">📈 每日学习时间</h3>
        <div class="daily-chart">
          <div class="chart-y-axis">
            <span>{{ maxDailyMinutes }}分钟</span>
            <span>{{ Math.round(maxDailyMinutes / 2) }}分钟</span>
            <span>0</span>
          </div>
          <div class="chart-area">
            <div class="chart-bars">
              <div 
                v-for="day in dailyStudyData.slice(-14)" 
                :key="day.date"
                class="bar-wrapper"
              >
                <div 
                  class="chart-bar"
                  :style="{ height: getBarHeight(day.minutes) + '%' }"
                  :title="`${formatChartDate(day.date)}: ${day.minutes}分钟`"
                >
                  <span v-if="day.minutes > 0" class="bar-value">{{ day.minutes }}</span>
                </div>
                <span class="bar-label">{{ formatChartLabel(day.date) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 科目学习时间分布 -->
      <div class="trend-section">
        <h3 class="section-title">📊 科目学习时间</h3>
        <div class="subject-chart">
          <div 
            v-for="(minutes, subject) in studyStats.bySubject" 
            :key="subject"
            class="subject-row"
          >
            <span class="subject-name">{{ getSubjectIcon(subject) }} {{ subject }}</span>
            <div class="subject-bar-wrapper">
              <div 
                class="subject-bar"
                :style="{ width: getSubjectWidth(minutes) + '%' }"
              ></div>
            </div>
            <span class="subject-minutes">{{ minutes }}分钟</span>
          </div>
          <div v-if="Object.keys(studyStats.bySubject).length === 0" class="no-data">
            暂无学习数据
          </div>
        </div>
      </div>

      <!-- 成绩趋势 -->
      <div class="trend-section">
        <h3 class="section-title">🎯 成绩趋势</h3>
        
        <!-- 科目选择 -->
        <div class="score-subject-select">
          <button 
            v-for="subject in availableScoreSubjects" 
            :key="subject"
            class="subject-chip"
            :class="{ active: selectedScoreSubject === subject }"
            @click="selectedScoreSubject = subject"
          >
            {{ subject }}
          </button>
        </div>

        <!-- 成绩柱状图 -->
        <div v-if="scoreTrendData.length > 0" class="score-chart">
          <div class="chart-bars score-bars">
            <div 
              v-for="item in scoreTrendData" 
              :key="item.date"
              class="bar-wrapper"
            >
              <div 
                class="chart-bar score-bar"
                :style="{ height: item.percentage + '%' }"
                :title="`${formatChartDate(item.date)}: ${item.percentage}%`"
              >
                <span v-if="item.percentage > 0" class="bar-value">{{ item.percentage }}%</span>
              </div>
              <span class="bar-label">{{ formatChartLabel(item.date) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="no-data">
          暂无成绩数据，选择科目查看趋势
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { store } from '../stores/store';
import { aiService, type AIStudyTask } from '../services/ai';
import type { StudyTask, Score } from '../types';
import BottomNav from '../components/BottomNav.vue';
import ChildSelector from '../components/ChildSelector.vue';

const tabs = [
  { id: 'tasks', name: '学习任务', icon: '📝' },
  { id: 'scores', name: '成绩管理', icon: '📊' },
  { id: 'trends', name: '成绩趋势', icon: '📈' },
];

const activeTab = ref('tasks');
const currentChild = computed(() => store.getCurrentChild());

const onChildChanged = (_childId: string) => {
  stopTimer();
};

// 表单
const showAddForm = ref(false);
const newTask = ref({
  name: '',
  subject: '',
  scheduledTime: '',
  estimatedMinutes: 30,
  timerMode: 'none' as StudyTask['timerMode'],
  countdownMinutes: 30,
  totalPomodoros: 4,
});

const timerModes = [
  { value: 'none', label: '无', icon: '⏸️' },
  { value: 'stopwatch', label: '正计时', icon: '▶️' },
  { value: 'countdown', label: '倒计时', icon: '⏱️' },
  { value: 'pomodoro', label: '番茄钟', icon: '🍅' },
];

// AI 创建学习任务
const showAIModal = ref(false);
const aiGoal = ref('');
const aiLoading = ref(false);
const aiGeneratedTasks = ref<AIStudyTask[]>([]);
const selectedAITasks = ref<Set<number>>(new Set());

const openAIModal = () => {
  aiGoal.value = '';
  aiGeneratedTasks.value = [];
  selectedAITasks.value = new Set();
  showAIModal.value = true;
};

const generateAIStudyTasks = async () => {
  if (!aiGoal.value.trim()) return;
  
  aiLoading.value = true;
  try {
    const result = await aiService.generateStudyTasks(aiGoal.value);
    if (result.success && result.tasks) {
      aiGeneratedTasks.value = result.tasks;
      selectedAITasks.value = new Set(result.tasks.map((_, i) => i));
    } else if (result.error) {
      // 使用 mock 数据
      aiGeneratedTasks.value = aiService.getMockStudyTasks(aiGoal.value);
      selectedAITasks.value = new Set(aiGeneratedTasks.value.map((_, i) => i));
    }
  } catch {
    aiGeneratedTasks.value = aiService.getMockStudyTasks(aiGoal.value);
    selectedAITasks.value = new Set(aiGeneratedTasks.value.map((_, i) => i));
  }
  aiLoading.value = false;
};

const toggleAITaskSelection = (index: number) => {
  if (selectedAITasks.value.has(index)) {
    selectedAITasks.value.delete(index);
  } else {
    selectedAITasks.value.add(index);
  }
  selectedAITasks.value = new Set(selectedAITasks.value);
};

const confirmAICreateTasks = () => {
  if (!currentChild.value) return;
  
  selectedAITasks.value.forEach(index => {
    const task = aiGeneratedTasks.value[index];
    if (task) {
      store.addStudyTask(
        currentChild.value!.id,
        task.name,
        task.subject,
        undefined,
        task.estimatedMinutes,
        task.timerMode,
        task.countdownMinutes,
        task.totalPomodoros
      );
    }
  });
  
  showAIModal.value = false;
};

const getTimerModeLabel = (mode: string): string => {
  const labels: Record<string, string> = {
    'none': '无计时',
    'stopwatch': '正计时',
    'countdown': '倒计时',
    'pomodoro': '番茄钟',
  };
  return labels[mode] || mode;
};

// 成绩管理
const subjects = ['语文', '数学', '英语', '科学', '其他'];
const scoreTypeLabels: Record<string, string> = {
  test: '测验',
  homework: '作业',
  quiz: '小测',
  exam: '考试',
  other: '其他',
};

const scoreFilter = ref('');
const showScoreModal = ref(false);
const editingScore = ref<Score | null>(null);
const scoreForm = ref({
  subject: '',
  type: 'homework' as string,
  name: '',
  score: 0,
  fullScore: 100,
  date: new Date().toISOString().split('T')[0],
  note: '',
});

const filteredScores = computed(() => {
  if (!currentChild.value) return [];
  return store.getScores(currentChild.value.id, scoreFilter.value || undefined);
});

const isScoreFormValid = computed(() => {
  return scoreForm.value.subject && 
         scoreForm.value.name.trim() && 
         scoreForm.value.score >= 0 && 
         scoreForm.value.fullScore > 0 &&
         scoreForm.value.date;
});

const openScoreModal = (score?: Score) => {
  if (score) {
    editingScore.value = score;
    scoreForm.value = {
      subject: score.subject,
      type: score.type,
      name: score.name,
      score: score.score,
      fullScore: score.fullScore,
      date: score.date,
      note: score.note || '',
    };
  } else {
    editingScore.value = null;
    scoreForm.value = {
      subject: '',
      type: 'homework',
      name: '',
      score: 0,
      fullScore: 100,
      date: new Date().toISOString().split('T')[0],
      note: '',
    };
  }
  showScoreModal.value = true;
};

const closeScoreModal = () => {
  showScoreModal.value = false;
  editingScore.value = null;
};

const saveScore = () => {
  if (!currentChild.value || !isScoreFormValid.value) return;
  
  if (editingScore.value) {
    store.updateScore(editingScore.value.id, {
      subject: scoreForm.value.subject,
      type: scoreForm.value.type as any,
      name: scoreForm.value.name,
      score: scoreForm.value.score,
      fullScore: scoreForm.value.fullScore,
      date: scoreForm.value.date,
      note: scoreForm.value.note || undefined,
    });
  } else {
    store.addScore(
      currentChild.value.id,
      scoreForm.value.subject,
      scoreForm.value.type as any,
      scoreForm.value.name,
      scoreForm.value.score,
      scoreForm.value.fullScore,
      scoreForm.value.date,
      scoreForm.value.note || undefined
    );
  }
  
  closeScoreModal();
};

const deleteScoreRecord = (score: Score) => {
  if (confirm(`确定删除"${score.name}"吗？`)) {
    store.deleteScore(score.id);
  }
};

const formatScoreDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

// 成绩趋势
const dailyStudyData = computed(() => {
  if (!currentChild.value) return [];
  return store.getDailyStudyMinutes(currentChild.value.id, 30);
});

const studyStats = computed(() => {
  if (!currentChild.value) return { totalMinutes: 0, todayMinutes: 0, weekMinutes: 0, bySubject: {} };
  return store.getStudyStats(currentChild.value.id);
});

const maxDailyMinutes = computed(() => {
  const max = Math.max(...dailyStudyData.value.map(d => d.minutes), 1);
  return Math.ceil(max / 10) * 10; // 向上取整到10的倍数
});

const getBarHeight = (minutes: number): number => {
  if (maxDailyMinutes.value === 0) return 0;
  return Math.max((minutes / maxDailyMinutes.value) * 100, minutes > 0 ? 5 : 0);
};

const formatChartDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}-${date.getDate()}`;
};

const formatChartLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${date.getDate()}/${weekdays[date.getDay()]}`;
};

const getSubjectWidth = (minutes: number): number => {
  const maxMinutes = Math.max(...Object.values(studyStats.value.bySubject), 1);
  return (minutes / maxMinutes) * 100;
};

const availableScoreSubjects = computed(() => {
  if (!currentChild.value) return [];
  const scores = store.getScores(currentChild.value.id);
  return [...new Set(scores.map(s => s.subject))];
});

const selectedScoreSubject = ref('');

const scoreTrendData = computed(() => {
  if (!currentChild.value || !selectedScoreSubject.value) return [];
  return store.getScoreTrend(currentChild.value.id, selectedScoreSubject.value);
});

// 计时器
let timerInterval: number | null = null;

// 任务列表
const studyTasks = computed(() => {
  if (!currentChild.value) return [];
  return store.getStudyTasks(currentChild.value.id);
});

const dueReviews = computed(() => {
  if (!currentChild.value) return [];
  return store.getDueReviews(currentChild.value.id);
});

// 方法
const addTask = () => {
  if (!currentChild.value || !newTask.value.name.trim()) return;
  
  store.addStudyTask(
    currentChild.value.id,
    newTask.value.name,
    newTask.value.subject,
    newTask.value.scheduledTime || undefined,
    newTask.value.estimatedMinutes,
    newTask.value.timerMode,
    newTask.value.timerMode === 'countdown' ? newTask.value.countdownMinutes : undefined,
    newTask.value.timerMode === 'pomodoro' ? newTask.value.totalPomodoros : undefined
  );
  
  // 重置表单
  newTask.value = {
    name: '',
    subject: '',
    scheduledTime: '',
    estimatedMinutes: 30,
    timerMode: 'none',
    countdownMinutes: 30,
    totalPomodoros: 4,
  };
  showAddForm.value = false;
};

const deleteTask = (task: StudyTask) => {
  if (confirm(`确定删除"${task.name}"吗？`)) {
    store.deleteStudyTask(task.id);
  }
};

const startTask = (task: StudyTask) => {
  store.startStudyTask(task.id);
  startTimer();
};

const pauseTask = (task: StudyTask) => {
  store.pauseStudyTask(task.id);
  // 保存累计时间
  if (task.timerMode === 'stopwatch') {
    const currentSeconds = Math.floor((Date.now() - (task.startedAt ? new Date(task.startedAt).getTime() : Date.now())) / 1000);
    const total = (task.totalSeconds || 0) + currentSeconds;
    store.updateStudyTask(task.id, { totalSeconds: total, startedAt: undefined });
  }
};

const completeTask = (task: StudyTask) => {
  stopTimer();
  
  if (task.timerMode === 'stopwatch' && task.startedAt) {
    const currentSeconds = Math.floor((Date.now() - new Date(task.startedAt).getTime()) / 1000);
    const total = (task.totalSeconds || 0) + currentSeconds;
    store.completeStudyTask(task.id, Math.ceil(total / 60), total);
  } else if (task.timerMode === 'countdown') {
    store.completeStudyTask(task.id, task.countdownMinutes);
  } else {
    store.completeStudyTask(task.id);
  }
};

const isOtherTaskRunning = (currentTask: StudyTask): boolean => {
  if (!currentChild.value) return false;
  const active = store.getActiveStudyTask(currentChild.value.id);
  return active !== undefined && active.id !== currentTask.id;
};

const getTotalSeconds = (task: StudyTask): number => {
  if (!task.startedAt) return task.totalSeconds || 0;
  const elapsed = Math.floor((Date.now() - new Date(task.startedAt).getTime()) / 1000);
  return (task.totalSeconds || 0) + elapsed;
};

const getRemainingSeconds = (task: StudyTask): number => {
  const total = (task.countdownMinutes || 30) * 60;
  const elapsed = getTotalSeconds(task);
  return Math.max(0, total - elapsed);
};

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (dateStr === today.toISOString().split('T')[0]) return '今天';
  if (dateStr === tomorrow.toISOString().split('T')[0]) return '明天';
  return `${date.getMonth() + 1}-${date.getDate()}`;
};

const getSubjectIcon = (subject: string): string => {
  const icons: Record<string, string> = {
    '语文': '📖',
    '数学': '🔢',
    '英语': '🌍',
    '科学': '🔬',
  };
  return icons[subject] || '📚';
};

const completeReview = (review: { task: StudyTask; dueDate: string }) => {
  const task = review.task;
  const reviewIndex = task.ebbinghaus.reviews.findIndex(r => r.dueDate === review.dueDate);
  if (reviewIndex >= 0) {
    store.completeReview(task.id, reviewIndex);
  }
};

// 计时器循环
const startTimer = () => {
  if (timerInterval) return;
  timerInterval = window.setInterval(() => {
    // 强制更新以刷新显示
    studyTasks.value;
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

onMounted(() => {
  // 检查是否有正在运行的任务
  if (currentChild.value) {
    const active = store.getActiveStudyTask(currentChild.value.id);
    if (active) {
      startTimer();
    }
  }
});

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
.study-page {
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

/* Add Task Bar */
.add-task-bar {
  padding: 0 var(--space-md);
  margin-bottom: var(--space-md);
  display: flex;
  gap: var(--space-sm);
}

.add-btn {
  flex: 1;
  padding: 12px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
}

.ai-btn {
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
}

/* AI Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-md);
}

.ai-modal {
  background: var(--color-bg);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
}

.modal-close {
  width: 32px;
  height: 32px;
  background: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-md);
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
}

.modal-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid var(--color-border);
}

.ai-input-section {
  margin-bottom: var(--space-lg);
}

.ai-input-section label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}

.btn-ai-generate {
  width: 100%;
  margin-top: var(--space-md);
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
}

.btn-ai-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-tasks-preview {
  margin-top: var(--space-lg);
}

.preview-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
}

.ai-task-item {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-sm);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.ai-task-item.selected {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.05);
}

.task-check {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.ai-task-item.selected .task-check {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.task-details {
  flex: 1;
}

.task-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.task-name {
  font-weight: 600;
  font-size: var(--font-size-base);
}

.task-subject {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.task-meta-row {
  display: flex;
  gap: var(--space-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.task-tip {
  margin-top: var(--space-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  background: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  cursor: pointer;
}

.btn-confirm {
  flex: 1;
  padding: 12px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Add Form */
.add-form {
  margin: 0 var(--space-md) var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
}

.form-row {
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.form-row label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  min-width: 70px;
  white-space: nowrap;
}

.form-row.inline {
  display: flex;
  gap: var(--space-md);
}

.form-col {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.form-input,
.form-select {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background: var(--color-bg);
}

.form-input.short {
  width: 80px;
  flex: none;
}

/* Timer Modes */
.timer-modes {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.mode-btn {
  flex: 1;
  min-width: 70px;
  padding: 8px;
  background: var(--color-bg);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Review Section */
.review-section {
  padding: 0 var(--space-md);
  margin-bottom: var(--space-md);
}

.section-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
}

.review-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  background: rgba(245, 158, 11, 0.1);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-xs);
}

.review-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.review-name {
  font-weight: 500;
  font-size: var(--font-size-sm);
}

.review-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.review-btn {
  padding: 6px 12px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
}

/* Tasks List */
.tasks-list {
  padding: 0 var(--space-md);
}

.study-task-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-sm);
}

.task-main {
  display: flex;
  gap: var(--space-md);
}

.task-icon {
  font-size: 24px;
  width: 44px;
  height: 44px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-name {
  font-weight: 600;
  font-size: var(--font-size-base);
}

.task-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.delete-btn {
  width: 28px;
  height: 28px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 16px;
  cursor: pointer;
}

/* Timer Section */
.timer-section {
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-top: var(--space-sm);
}

.timer-display {
  text-align: center;
  margin-bottom: var(--space-md);
}

.timer-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
}

.timer-value.warning {
  color: var(--color-danger);
}

.timer-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.timer-controls {
  display: flex;
  gap: var(--space-sm);
}

.timer-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
}

.timer-btn.start {
  background: var(--color-primary);
  color: white;
}

.timer-btn.pause {
  background: #f59e0b;
  color: white;
}

.timer-btn.complete {
  background: var(--color-success);
  color: white;
}

.timer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Status Badge */
.task-status {
  margin-top: var(--space-sm);
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.status-badge.completed {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.status-badge.running {
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
}

.status-badge.paused {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
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

/* Tabs Content */
.tab-tip {
  text-align: center;
  color: var(--color-text-secondary);
  padding: var(--space-lg);
}

.sub-tip {
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

/* Buttons */
.btn-primary {
  width: 100%;
  padding: 12px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Score Modal */
.score-modal {
  background: var(--color-bg);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 400px;
}

/* Subject Filter */
.subject-filter {
  display: flex;
  gap: var(--space-xs);
  padding: 0 var(--space-md);
  margin-bottom: var(--space-md);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.filter-chip {
  padding: 8px 16px;
  background: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip.active {
  background: var(--color-primary);
  color: white;
}

/* Add Score Bar */
.add-score-bar {
  padding: 0 var(--space-md);
  margin-bottom: var(--space-md);
}

.add-score-btn {
  width: 100%;
  padding: 12px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
}

/* Scores List */
.scores-list {
  padding: 0 var(--space-md);
}

.score-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.score-info {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.score-subject {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--color-primary);
}

.score-type {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background: var(--color-bg);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.score-actions {
  display: flex;
  gap: var(--space-xs);
}

.action-btn {
  width: 28px;
  height: 28px;
  background: var(--color-bg);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-main {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: var(--space-xs);
}

.score-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
}

.score-divider {
  font-size: 20px;
  color: var(--color-text-muted);
}

.score-full {
  font-size: 20px;
  color: var(--color-text-muted);
}

.score-percentage {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-left: var(--space-sm);
}

.score-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.score-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.score-note {
  margin-top: var(--space-sm);
  padding: var(--space-sm);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* Trends Section */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
  padding: 0 var(--space-md);
  margin-bottom: var(--space-lg);
}

.stat-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.stat-icon {
  font-size: 24px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.trend-section {
  padding: 0 var(--space-md);
  margin-bottom: var(--space-xl);
}

.trend-section .section-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--space-md);
  color: var(--color-text-primary);
}

/* Daily Chart */
.daily-chart {
  display: flex;
  gap: var(--space-sm);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 10px;
  color: var(--color-text-muted);
  padding-bottom: 20px;
  min-width: 45px;
  text-align: right;
}

.chart-area {
  flex: 1;
  height: 120px;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 100%;
  padding-bottom: 20px;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  justify-content: flex-end;
}

.chart-bar {
  width: 100%;
  max-width: 20px;
  background: linear-gradient(180deg, var(--color-primary) 0%, rgba(99, 102, 241, 0.5) 100%);
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  position: relative;
  transition: height 0.3s ease;
}

.bar-value {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--color-primary);
  white-space: nowrap;
}

.bar-label {
  font-size: 10px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

/* Subject Chart */
.subject-chart {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
}

.subject-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.subject-row:last-child {
  margin-bottom: 0;
}

.subject-name {
  font-size: var(--font-size-sm);
  min-width: 60px;
}

.subject-bar-wrapper {
  flex: 1;
  height: 12px;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.subject-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary) 0%, rgba(99, 102, 241, 0.6) 100%);
  border-radius: var(--radius-sm);
  transition: width 0.3s ease;
}

.subject-minutes {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  min-width: 50px;
  text-align: right;
}

/* Score Subject Select */
.score-subject-select {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
}

.subject-chip {
  padding: 6px 12px;
  background: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: all 0.2s;
}

.subject-chip.active {
  background: var(--color-primary);
  color: white;
}

/* Score Chart */
.score-chart {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
}

.score-bars .chart-bar {
  background: linear-gradient(180deg, #10b981 0%, rgba(16, 185, 129, 0.5) 100%);
}

.score-bars .bar-value {
  color: #10b981;
}

.no-data {
  text-align: center;
  padding: var(--space-xl);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
