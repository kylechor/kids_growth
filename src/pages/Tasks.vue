<template>
  <div class="page tasks-page">
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
      <!-- 我的任务 -->
      <div class="section-block">
        <div class="section-header">
          <h3>📋 我的任务</h3>
          <button class="manage-btn" @click="activeTab = 'tasks'">管理</button>
        </div>

        <!-- 今日进度卡片 -->
        <div class="today-progress-card" v-if="currentChild && tasks.length > 0">
          <div class="progress-info">
            <span class="date-label">{{ currentDate }} {{ weekday }}</span>
            <span class="task-count">{{ completedCount }}/{{ tasks.length }} 任务</span>
          </div>
          <div class="progress-bar-wrapper">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="points-info" :class="todayPointsClass">
            {{ todayPoints > 0 ? '+' : '' }}{{ todayPoints }} 积分
          </div>
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

        <!-- 2列任务网格 -->
        <div class="tasks-grid" v-if="currentChild && filteredTasks.length > 0">
          <div 
            v-for="task in filteredTasks" 
            :key="task.id"
            class="task-card-grid"
            :class="{ completed: getRecordStatus(task.id) }"
            @click="toggleTask(task)"
          >
            <div class="task-icon">{{ task.icon }}</div>
            <div class="task-info">
              <span class="task-name">{{ task.name }}</span>
              <span class="task-points">+{{ task.points }}</span>
            </div>
            <div class="task-check" :class="{ checked: getRecordStatus(task.id) }">
              <svg v-if="getRecordStatus(task.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state small" v-else-if="currentChild">
          <div class="empty-icon">📋</div>
          <p>还没有任务</p>
          <button class="btn-link" @click="activeTab = 'tasks'">去添加</button>
        </div>
      </div>

      <!-- 我的项目 -->
      <div class="section-block">
        <div class="section-header">
          <h3>🎯 我的项目</h3>
          <button class="manage-btn" @click="activeTab = 'projects'">查看全部</button>
        </div>

        <!-- 项目列表 -->
        <div class="projects-mini-list" v-if="activeProjects.length > 0">
          <div 
            v-for="project in activeProjects.slice(0, 3)" 
            :key="project.id"
            class="project-mini-card"
            @click="viewProject(project)"
          >
            <span class="project-icon">{{ project.icon }}</span>
            <div class="project-info">
              <span class="project-name">{{ project.name }}</span>
              <div class="project-progress-mini">
                <div class="progress-bar-mini">
                  <div class="progress-fill" :style="{ width: getProjectProgress(project) + '%' }"></div>
                </div>
                <span class="progress-text">{{ getProjectProgress(project) }}%</span>
              </div>
            </div>
            <span class="project-day">第{{ getProjectDayMini(project) }}天</span>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state small" v-else-if="currentChild">
          <div class="empty-icon">🎯</div>
          <p>还没有进行中的项目</p>
          <button class="btn-link" @click="activeTab = 'projects'">去创建</button>
        </div>
      </div>

      <!-- 无孩子时 -->
      <div class="empty-state" v-if="!currentChild">
        <div class="empty-icon">👶</div>
        <p>请先添加孩子</p>
        <router-link to="/children" class="btn-link">去添加</router-link>
      </div>
    </div>

    <!-- 任务管理 Tab -->
    <div v-if="activeTab === 'tasks'" class="tab-content">
      <!-- 操作按钮 -->
      <div class="action-buttons" v-if="currentChild">
        <button class="action-btn-main" @click="showAddTaskModal = true">
          ➕ 添加任务
        </button>
        <button class="action-btn-main ai" @click="showAIGenerateModal = true">
          🤖 AI创建
        </button>
      </div>

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

        <!-- AI 智能生成 -->
        <div class="ai-task-section">
          <div class="ai-divider">
            <span class="ai-line"></span>
            <span class="ai-text">🤖 AI 智能生成</span>
            <span class="ai-line"></span>
          </div>
          
          <div class="ai-input-group">
            <input 
              v-model="aiTaskGoal" 
              placeholder="例如：培养孩子的时间管理能力"
              @keyup.enter="generateTasks"
            />
            <button 
              class="ai-btn"
              @click="generateTasks"
              :disabled="!aiTaskGoal.trim() || isGeneratingTasks"
            >
              {{ isGeneratingTasks ? '生成中...' : '生成推荐任务' }}
            </button>
          </div>
          
          <p v-if="aiTaskError" class="task-error">{{ aiTaskError }}</p>
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
    </div>

    <!-- 项目管理 Tab -->
    <div v-if="activeTab === 'projects'" class="tab-content">
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

    <!-- AI 生成任务弹窗 -->
    <div v-if="showAIGenerateModal" class="modal-overlay" @click.self="closeAIGenerateModal">
      <div class="ai-generate-modal">
        <div class="modal-header">
          <h3>🤖 AI 创建任务</h3>
          <button class="close-btn" @click="closeAIGenerateModal">×</button>
        </div>
        
        <div class="modal-body">
          <!-- 输入描述 -->
          <div class="ai-input-section" v-if="aiGeneratedTasks.length === 0">
            <p class="ai-tip">描述你想培养孩子的能力或习惯，AI将为你生成3个推荐任务</p>
            <div class="ai-input-group">
              <input 
                v-model="aiTaskGoal" 
                placeholder="例如：培养时间管理能力、养成整理习惯"
                @keyup.enter="generateTasks"
              />
            </div>
            <p v-if="aiTaskError" class="task-error">{{ aiTaskError }}</p>
          </div>

          <!-- 生成的任务列表 -->
          <div class="ai-tasks-list" v-else>
            <p class="preview-tip">AI 生成了 {{ aiGeneratedTasks.length }} 个任务，可以删除不需要的</p>
            <div 
              v-for="(task, index) in aiGeneratedTasks" 
              :key="index"
              class="ai-task-card"
            >
              <button class="delete-task-btn" @click="removeGeneratedTask(index)">×</button>
              <span class="task-icon">{{ task.icon }}</span>
              <div class="task-content">
                <span class="task-name">{{ task.name }}</span>
                <div class="task-tags">
                  <span class="task-tag cat" :style="{ background: getCategoryColor(task.category) }">
                    {{ getCategoryLabel(task.category) }}
                  </span>
                  <span class="task-tag freq">{{ getFrequencyLabel(task.frequency) }}</span>
                  <span class="task-tag points">+{{ task.points }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <template v-if="aiGeneratedTasks.length === 0">
            <button class="btn-secondary" @click="closeAIGenerateModal">取消</button>
            <button class="btn-primary" @click="generateTasks" :disabled="!aiTaskGoal.trim() || isGeneratingTasks">
              {{ isGeneratingTasks ? '生成中...' : '生成任务' }}
            </button>
          </template>
          <template v-else>
            <button class="btn-secondary" @click="closeAIGenerateModal">取消</button>
            <button class="btn-primary" @click="confirmAddAIGeneratedTasks" :disabled="aiGeneratedTasks.length === 0">
              确定创建
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- 添加任务弹窗 -->
    <div v-if="showAddTaskModal" class="modal-overlay" @click.self="closeAddTaskModal">
      <div class="add-task-modal">
        <div class="modal-header">
          <h3>➕ 添加任务</h3>
          <button class="close-btn" @click="closeAddTaskModal">×</button>
        </div>
        
        <div class="modal-body">
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
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeAddTaskModal">取消</button>
          <button class="btn-primary" @click="quickAddTask" :disabled="!newTask.name.trim()">
            添加
          </button>
        </div>
      </div>
    </div>

    <!-- 家长审核弹窗 - PBL项目 -->
    <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal = false">
      <div class="review-modal pbl-modal">
        <div class="modal-header">
          <h3>👀 审核PBL项目</h3>
          <button class="close-btn" @click="showReviewModal = false">×</button>
        </div>
        
        <div class="modal-body">
          <!-- 项目概览 -->
          <div class="pbl-overview">
            <div class="pbl-vision">
              <label>💫 愿景激励</label>
              <textarea 
                v-model="reviewData.vision" 
                rows="1"
                class="review-textarea"
                placeholder="用孩子能理解的语言，描述完成项目后的美好画面"
              ></textarea>
            </div>
            
            <div class="pbl-final-product">
              <label>🏆 最终作品</label>
              <input 
                v-model="reviewData.finalProduct" 
                class="review-input"
                placeholder="项目完成时，孩子会创造出什么？"
              />
            </div>
            
            <div class="pbl-real-world">
              <label>🌍 真实连接</label>
              <input 
                v-model="reviewData.realWorldConnection" 
                class="review-input"
                placeholder="这个项目如何连接到真实世界？"
              />
            </div>
          </div>

          <div v-for="(step, sIdx) in reviewData.steps" :key="sIdx" class="review-section">
            <div class="step-header">
              <label>── 第{{ step.stepNumber }}阶段: {{ step.name }} ({{ step.startDay }}-{{ step.endDay }}天) ──</label>
            </div>
            
            <div v-for="(task, tIdx) in step.tasks" :key="tIdx" class="review-task-item pbl-task">
              <div class="task-header">
                <span class="task-day">📅 第{{ task.day }}天</span>
                <span class="task-type-badge">{{ getTaskTypeLabel(task.type) }}</span>
                <button class="delete-task-btn" @click="deleteReviewTask(sIdx, tIdx)">×</button>
              </div>
              <input 
                v-model="task.title" 
                placeholder="任务标题"
                class="review-input task-title-input"
              />
              <textarea 
                v-model="task.description" 
                placeholder="用孩子的第一人称描述：我需要做什么？"
                rows="1"
                class="review-textarea"
              ></textarea>
              <div class="task-meta-row">
                <span class="meta-item">⏱️ {{ task.duration }}</span>
                <input 
                  v-model="task.deliverable" 
                  placeholder="📦 当日产出"
                  class="deliverable-input"
                />
              </div>
              <div v-if="task.skillsTrained && task.skillsTrained.length > 0" class="skills-tags">
                <span v-for="skill in task.skillsTrained" :key="skill" class="skill-tag">{{ skill }}</span>
              </div>
              <p class="task-tip">{{ task.tip }}</p>
            </div>

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
          
          <div class="detail-progress">
            <div class="progress-bar large">
              <div class="progress-fill" :style="{ width: getProjectProgress(selectedProject) + '%' }"></div>
            </div>
            <span>第{{ getCurrentProjectDay() }}天 / 共{{ selectedProject.duration }}天</span>
          </div>

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
                  @click="completeProjectTask(task)"
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
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../stores/store';
import type { Task, TaskCategory, Project, AIProjectResult, AIStepResult, GeneratedProjectTask } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import BottomNav from '../components/BottomNav.vue';
import ChildSelector from '../components/ChildSelector.vue';
import { aiService, type AIGeneratedTask, type AITaskResult } from '../services/ai';

const router = useRouter();

const tabs = [
  { id: 'mine', name: '我的', icon: '👤' },
  { id: 'tasks', name: '任务管理', icon: '📋' },
  { id: 'projects', name: '项目管理', icon: '🎯' },
];

const activeTab = ref('mine');
const selectedCategory = ref<string>('all');
const currentChild = computed(() => store.getCurrentChild());

const selectedChildId = ref<string>(store.getCurrentChild()?.id || '');
watch(currentChild, (child) => {
  if (child) selectedChildId.value = child.id;
}, { immediate: true });

const onChildChanged = (childId: string) => {
  selectedChildId.value = childId;
  loadRecords();
};

// ===== 任务相关 =====
const tasks = computed(() => store.getTasks(selectedChildId.value));
const canAddTask = computed(() => store.canAddTask(selectedChildId.value));

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

const todayPoints = computed(() => currentChild.value ? store.getTodayPoints(currentChild.value.id) : 0);

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

// ===== AI 任务生成 =====
const aiTaskGoal = ref('');
const isGeneratingTasks = ref(false);
const aiGeneratedTasks = ref<AIGeneratedTask[]>([]);
const showAIGenerateModal = ref(false);
const showAddTaskModal = ref(false);
const aiTaskError = ref<string>('');

const closeAIGenerateModal = () => {
  showAIGenerateModal.value = false;
  aiGeneratedTasks.value = [];
  aiTaskGoal.value = '';
  aiTaskError.value = '';
};

const removeGeneratedTask = (index: number) => {
  aiGeneratedTasks.value.splice(index, 1);
};

const closeAddTaskModal = () => {
  showAddTaskModal.value = false;
  resetForm();
};

const quickAddTask = () => {
  if (!newTask.value.name.trim() || !selectedChildId.value) return;
  store.addTask(selectedChildId.value, newTask.value.name, newTask.value.points, newTask.value.deductPoints, newTask.value.icon, newTask.value.category);
  closeAddTaskModal();
};

const getFrequencyLabel = (freq: string): string => {
  const labels: Record<string, string> = {
    once: '单次',
    daily: '每天',
    weekly: '每周'
  };
  return labels[freq] || freq;
};

const generateTasks = async () => {
  if (!aiTaskGoal.value.trim() || isGeneratingTasks.value) return;
  
  isGeneratingTasks.value = true;
  aiTaskError.value = '';
  
  try {
    const result: AITaskResult = await aiService.generateTasks(aiTaskGoal.value);
    
    if (result.success && result.tasks) {
      aiGeneratedTasks.value = result.tasks;
    } else if (result.error) {
      aiTaskError.value = result.error.message;
    }
  } catch (error) {
    console.error('Failed to generate tasks:', error);
    aiTaskError.value = '生成失败，请稍后重试';
  } finally {
    isGeneratingTasks.value = false;
  }
};

const confirmAddAIGeneratedTasks = () => {
  if (!selectedChildId.value || aiGeneratedTasks.value.length === 0) return;
  
  aiGeneratedTasks.value.forEach(task => {
    store.addTask(
      selectedChildId.value,
      task.name,
      task.points,
      task.deductPoints,
      task.icon,
      task.category
    );
    // Update frequency after creation
    const tasks = store.getTasks(selectedChildId.value);
    const createdTask = tasks.find(t => t.name === task.name);
    if (createdTask) {
      store.updateTask(createdTask.id, { frequency: task.frequency });
    }
  });
  
  closeAIGenerateModal();
};

// 打卡状态
const recordStatus = ref<Record<string, boolean>>({});

const loadRecords = () => {
  if (!currentChild.value) {
    recordStatus.value = {};
    return;
  }
  const records = store.getRecords(currentChild.value.id);
  recordStatus.value = {};
  records.forEach(r => {
    recordStatus.value[r.taskId] = r.completed;
  });
};

watch(selectedChildId, () => {
  loadRecords();
});

const getRecordStatus = (taskId: string) => recordStatus.value[taskId] || false;

const toggleTask = (task: Task) => {
  if (!currentChild.value) return;
  const wasCompleted = recordStatus.value[task.id];
  const newStatus = !wasCompleted;
  recordStatus.value[task.id] = newStatus;
  store.toggleRecord(currentChild.value.id, task.id, newStatus, task.points);
};

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

const getCategoryLabel = (cat: string) => {
  if (cat === 'all') return '全部';
  return CATEGORY_LABELS[cat as TaskCategory] || cat;
};
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

// ===== 项目相关 =====
const newProjectGoal = ref('');
const selectedDuration = ref(14);
const durationOptions = [7, 14, 21, 30];
const isGenerating = ref(false);
const aiGeneratedProject = ref<AIProjectResult | null>(null);
const showReviewModal = ref(false);
const selectedProject = ref<Project | null>(null);

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

// 任务类型标签映射
const getTaskTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    explore: '🔍 探究',
    act: '🎯 行动',
    reflect: '💭 反思',
    create: '🎨 创作',
    share: '📢 分享'
  };
  return labels[type] || type;
};

const activeProjects = computed(() => {
  if (!currentChild.value) return [];
  return store.getActiveProjects(currentChild.value.id);
});

const selectedProjectSteps = computed(() => {
  if (!selectedProject.value) return [];
  const duration = selectedProject.value.duration;
  const steps: AIStepResult[] = [];
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

const generateProject = async () => {
  if (!newProjectGoal.value.trim() || isGenerating.value) return;
  
  isGenerating.value = true;
  try {
    const result = await aiService.generateProject(newProjectGoal.value, selectedDuration.value);
    if (result.error) {
      alert(result.error.message);
      return;
    }
    aiGeneratedProject.value = result;
    reviewData.value = JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error('Failed to generate project:', error);
    alert('生成失败，请稍后重试');
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

const getProjectDayMini = (project: Project): number => {
  return store.getProjectDay(project.id);
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
  
  const project = store.addProject(currentChild.value.id, reviewData.value);
  
  store.createProjectStory(
    project.id,
    reviewData.value.vision,
    reviewData.value.steps.map(s => ({
      stepNumber: s.stepNumber,
      title: s.name,
      celebration: s.celebration,
    }))
  );
  
  store.addProjectTasks(project.id, reviewData.value.steps);
  
  showReviewModal.value = false;
  aiGeneratedProject.value = null;
  newProjectGoal.value = '';
  
  viewProject(project);
};

const viewProject = (project: Project) => {
  selectedProject.value = project;
};

const completeProjectTask = (task: GeneratedProjectTask) => {
  store.completeProjectTask(task.id);
};

const deleteProject = (project: Project) => {
  if (confirm(`确定删除项目"${project.name}"吗？`)) {
    store.deleteProject(project.id);
  }
};
</script>

<style scoped>
.tasks-page {
  background: var(--color-bg);
  padding-bottom: 80px;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  padding: var(--space-md);
  gap: var(--space-sm);
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

/* Tab Content */
.tab-content {
  padding: var(--space-md);
  padding-bottom: var(--space-md);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.action-btn-main {
  flex: 1;
  padding: 12px;
  background: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn-main:active {
  transform: scale(0.98);
}

.action-btn-main.ai {
  background: var(--gradient-primary);
  color: white;
}

/* 今日进度卡片 */
.today-progress-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.date-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.task-count {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 600;
}

.progress-bar-wrapper {
  height: 8px;
  background: var(--color-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-sm);
}

.progress-bar-wrapper .progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: var(--radius-full);
  transition: width 0.3s;
}

.points-info {
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-align: center;
}

.points-info.positive {
  color: var(--color-success);
}

.points-info.negative {
  color: var(--color-danger);
}

.points-info.zero {
  color: var(--color-text-muted);
}

/* 区块样式 */
.section-block {
  margin-bottom: var(--space-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.section-header h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin: 0;
}

.manage-btn {
  padding: 4px 12px;
  background: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  cursor: pointer;
}

/* 项目迷你卡片 */
.projects-mini-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.project-mini-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 90px;
}

.project-mini-card:active {
  transform: scale(0.99);
}

.project-mini-card .project-icon {
  font-size: 24px;
  width: 36px;
  height: 36px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-mini-card .project-info {
  flex: 1;
  min-width: 0;
}

.project-mini-card .project-name {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-progress-mini {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.progress-bar-mini {
  flex: 1;
  height: 4px;
  background: var(--color-bg);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-mini .progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 2px;
}

.project-mini-card .progress-text {
  font-size: 10px;
  color: var(--color-primary);
  font-weight: 600;
  min-width: 30px;
  text-align: right;
}

.project-mini-card .project-day {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* 空状态 */
.empty-state.small {
  padding: var(--space-lg);
}

.empty-state.small .empty-icon {
  font-size: 36px;
}

/* 分类筛选 */
.filter-tabs {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--space-xs);
}

.filter-tab {
  padding: 6px 14px;
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

/* 2列任务网格 */
.tasks-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
}

.task-card-grid {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
  position: relative;
  min-height: 90px;
}

.task-card-grid:active {
  transform: scale(0.98);
}

.task-card-grid.completed {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%);
}

.task-card-grid .task-icon {
  font-size: 24px;
}

.task-card-grid .task-info {
  text-align: center;
}

.task-card-grid .task-name {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0;
}

.task-card-grid.completed .task-name {
  text-decoration: line-through;
  opacity: 0.7;
}

.task-card-grid .task-points {
  font-size: 10px;
  color: var(--color-success);
  font-weight: 600;
}

.task-card-grid .task-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.task-card-grid .task-check.checked {
  background: var(--color-success);
  border-color: var(--color-success);
}

.task-card-grid .task-check svg {
  width: 10px;
  height: 10px;
  color: white;
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

.task-card.completed {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%);
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

.task-info.completed .task-name {
  text-decoration: line-through;
  opacity: 0.7;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.task-points {
  font-size: var(--font-size-xs);
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

/* Mine Tab - 今日打卡样式 */
.task-card .task-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-card .task-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-card .task-info .task-points {
  font-size: 11px;
}

.task-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.task-check.checked {
  background: var(--color-success);
  border-color: var(--color-success);
}

.task-check svg {
  width: 14px;
  height: 14px;
  color: white;
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
  background: none;
  border: none;
  font-size: var(--font-size-base);
  cursor: pointer;
}

/* Add Section */
.add-section {
  margin: var(--space-md);
  padding: var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
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

.input-group {
  margin-bottom: var(--space-lg);
}

.input-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  background: var(--color-bg);
}

.input-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

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

/* AI Task Section */
.ai-task-section {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px dashed var(--color-border);
}

.ai-divider {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.ai-line {
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.ai-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.ai-input-group {
  display: flex;
  gap: var(--space-sm);
}

.ai-input-group input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  background: var(--color-bg);
}

.ai-input-group input:focus {
  outline: none;
  border-color: var(--color-primary);
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
  white-space: nowrap;
}

.ai-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-error {
  margin-top: var(--space-sm);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  text-align: center;
}

/* AI Tasks Preview */
.preview-tip {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
  text-align: center;
}

.ai-tasks-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-height: 300px;
  overflow-y: auto;
}

.ai-task-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  padding-right: var(--space-xl);
}

.delete-ai-task {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  border: none;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-task-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-task-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ai-task-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
}

.ai-task-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-xs);
}

.ai-task-points {
  color: var(--color-success);
  font-weight: 600;
}

.ai-task-cat {
  font-weight: 500;
}

/* AI 生成任务弹窗 */
.ai-generate-modal {
  width: 100%;
  max-height: 80vh;
  background: var(--color-bg);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ai-input-section {
  padding: var(--space-md);
}

.ai-tip {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: var(--space-md);
}

.ai-input-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  background: var(--color-bg-card);
}

.ai-input-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.ai-tasks-list {
  padding: var(--space-md);
}

.ai-task-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-sm);
}

.ai-task-card .task-icon {
  font-size: 28px;
  width: 44px;
  height: 44px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-task-card .task-content {
  flex: 1;
  min-width: 0;
}

.ai-task-card .task-name {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.ai-task-card .task-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.ai-task-card .task-tag {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 10px;
  color: white;
}

.ai-task-card .task-tag.cat {
  color: white;
}

.ai-task-card .task-tag.freq {
  background: var(--color-bg);
  color: var(--color-text-secondary);
}

.ai-task-card .task-tag.points {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.delete-task-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  border: none;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-error {
  margin-top: var(--space-sm);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  text-align: center;
}

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
  margin-bottom: var(--space-sm);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  width: 100%;
  padding: 12px;
  background: var(--color-bg);
  color: var(--color-text);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
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

/* 项目管理样式 */
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
  margin-bottom: 0;
}

.section-title {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: var(--space-lg) var(--space-md) var(--space-md);
}

.project-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  margin: 0 var(--space-md) var(--space-sm);
  cursor: pointer;
  transition: all 0.2s;
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

.review-input,
.review-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-xs);
  resize: none;
  background: var(--color-bg);
}

.review-task-item {
  padding: var(--space-sm);
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-xs);
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
  margin: var(--space-xs) 0;
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
  padding: 12px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: var(--radius-md);
}

.no-task {
  text-align: center;
  padding: var(--space-lg);
  color: var(--color-text-muted);
}
</style>
