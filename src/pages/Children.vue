<template>
  <div class="page children-page">
    <div class="header-bar">
      <router-link to="/" class="back-btn">←</router-link>
      <h2>孩子管理</h2>
      <button class="unlock-btn" @click="goToUpgrade" v-if="!isPro">解锁</button>
      <span v-else></span>
    </div>

    <!-- 孩子列表 -->
    <div class="children-list" v-if="children.length > 0">
      <div 
        v-for="child in children" 
        :key="child.id"
        class="child-card"
        :class="{ active: child.id === currentChildId }"
        @click="selectChild(child.id)"
      >
        <div class="child-avatar">
          <span class="avatar">{{ child.avatar }}</span>
          <span class="status" :class="{ online: child.id === currentChildId }"></span>
        </div>
        <div class="child-info">
          <span class="name">{{ child.name }}</span>
          <span class="points">
            <span class="icon">⭐</span>
            {{ store.getTotalPoints(child.id) }} 积分
          </span>
        </div>
        <button class="delete-btn" @click.stop="confirmDelete(child)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- 添加孩子 -->
    <div class="add-section" v-if="canAddChild">
      <div class="form-header">
        <h3>添加孩子</h3>
      </div>
      
      <div class="avatar-picker-section">
        <label>选择头像</label>
        <div class="avatar-picker">
          <button 
            v-for="avatar in avatarOptions" 
            :key="avatar"
            class="avatar-option"
            :class="{ selected: newChildAvatar === avatar }"
            @click="newChildAvatar = avatar"
          >
            {{ avatar }}
          </button>
        </div>
      </div>

      <div class="input-group">
        <input 
          v-model="newChildName" 
          placeholder="输入孩子姓名"
          @keyup.enter="addChild"
        />
      </div>

      <button class="btn-primary" @click="addChild" :disabled="!newChildName.trim()">
        添加孩子
      </button>
    </div>

    <!-- 限制提示 -->
    <div class="limit-card" v-else>
      <div class="limit-icon">👨‍👩‍👧</div>
      <p>免费版最多添加 1 个孩子</p>
      <button class="btn-secondary" @click="goToUpgrade">升级解锁更多</button>
    </div>

    <!-- 底部导航 -->
    <BottomNav />

    <!-- 确认删除弹窗 -->
    <div class="modal" v-if="showDeleteConfirm">
      <div class="modal-content">
        <div class="modal-icon">⚠️</div>
        <p class="modal-title">确定删除 {{ deleteTarget?.name }} 吗？</p>
        <p class="warning">删除后所有数据将无法恢复</p>
        <div class="modal-btns">
          <button @click="showDeleteConfirm = false">取消</button>
          <button class="danger" @click="deleteChild">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../stores/store';
import type { Child } from '../types';
import BottomNav from '../components/BottomNav.vue';

const router = useRouter();
const isPro = computed(() => store.isPro);
const children = computed(() => store.getChildren());
const currentChildId = computed(() => store.getCurrentChild()?.id);
const canAddChild = computed(() => store.canAddChild());

const avatarOptions = ['👦', '👧', '🧒', '👶', '🐻', '🐰', '🦊', '🐼'];
const newChildName = ref('');
const newChildAvatar = ref('👦');

const showDeleteConfirm = ref(false);
const deleteTarget = ref<Child | null>(null);

const selectChild = (id: string) => {
  store.setCurrentChild(id);
  router.push('/');
};

const addChild = () => {
  if (!newChildName.value.trim()) return;
  const child = store.addChild(newChildName.value.trim(), newChildAvatar.value);
  if (child) {
    newChildName.value = '';
    newChildAvatar.value = '👦';
    router.push('/');
  }
};

const confirmDelete = (child: Child) => {
  deleteTarget.value = child;
  showDeleteConfirm.value = true;
};

const deleteChild = () => {
  if (deleteTarget.value) {
    store.removeChild(deleteTarget.value.id);
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
  }
};

const goToUpgrade = () => router.push('/upgrade');
</script>

<style scoped>
.children-page {
  background: var(--color-bg);
}

/* Header */
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

/* Children List */
.children-list {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.child-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);
  border: 2px solid transparent;
}

.child-card.active {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%);
}

.child-card:active {
  transform: scale(0.99);
}

.child-avatar {
  position: relative;
}

.child-avatar .avatar {
  font-size: 48px;
  display: block;
}

.child-avatar .status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  background: var(--color-text-muted);
  border-radius: 50%;
  border: 3px solid var(--color-bg-card);
}

.child-avatar .status.online {
  background: #22c55e;
}

.child-info {
  flex: 1;
}

.child-info .name {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.child-info .points {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.child-info .points .icon {
  font-size: 12px;
}

.delete-btn {
  width: 40px;
  height: 40px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  border: none;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.delete-btn svg {
  width: 18px;
  height: 18px;
}

.delete-btn:active {
  transform: scale(0.95);
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

.avatar-picker-section {
  margin-bottom: var(--space-md);
}

.avatar-picker-section label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
}

.avatar-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  justify-content: center;
}

.avatar-option {
  width: 56px;
  height: 56px;
  font-size: 28px;
  background: var(--color-bg);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-option.selected {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--color-primary);
  transform: scale(1.1);
}

/* Limit Card */
.limit-card {
  margin: var(--space-md);
  padding: var(--space-xl);
  padding-bottom: 80px;
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  text-align: center;
  box-shadow: var(--shadow-md);
}

.limit-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
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

.modal-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.warning {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-md);
}
</style>
