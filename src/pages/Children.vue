<template>
  <div class="page children-page">
    <div class="header-bar">
      <router-link to="/" class="back-btn">←</router-link>
      <h2>孩子管理</h2>
      <button class="upgrade-btn" @click="goToUpgrade" v-if="!isPro">解锁</button>
      <span v-else></span>
    </div>

    <div class="children-list">
      <div 
        v-for="child in children" 
        :key="child.id"
        class="child-card"
        :class="{ active: child.id === currentChildId }"
        @click="selectChild(child.id)"
      >
        <span class="avatar">{{ child.avatar }}</span>
        <div class="info">
          <span class="name">{{ child.name }}</span>
          <span class="points">{{ store.getTotalPoints(child.id) }} 积分</span>
        </div>
        <button class="delete-btn" @click.stop="confirmDelete(child)">删除</button>
      </div>
    </div>

    <div class="add-section" v-if="canAddChild">
      <h3>添加孩子</h3>
      <div class="avatar-picker">
        <span 
          v-for="avatar in avatarOptions" 
          :key="avatar"
          class="avatar-option"
          :class="{ selected: newChildAvatar === avatar }"
          @click="newChildAvatar = avatar"
        >{{ avatar }}</span>
      </div>
      <div class="input-group">
        <input 
          v-model="newChildName" 
          placeholder="输入孩子姓名"
          @keyup.enter="addChild"
        />
      </div>
      <button class="btn-primary" @click="addChild" :disabled="!newChildName.trim()">
        添加
      </button>
    </div>
    <div class="limit-notice" v-else>
      <p>免费版最多添加1个孩子</p>
      <button class="btn-secondary" @click="goToUpgrade">升级解锁更多</button>
    </div>

    <div class="nav-bar">
      <router-link to="/" class="nav-item">
        <span class="nav-icon">🏠</span>
        <span>首页</span>
      </router-link>
      <router-link to="/children" class="nav-item active">
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

    <!-- 确认删除弹窗 -->
    <div class="modal" v-if="showDeleteConfirm">
      <div class="modal-content">
        <p>确定删除 {{ deleteTarget?.name }} 吗？</p>
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

.children-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.child-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border: 2px solid transparent;
}

.child-card.active {
  border-color: #667eea;
}

.avatar {
  font-size: 36px;
}

.info {
  flex: 1;
}

.name {
  display: block;
  font-size: 16px;
  font-weight: 600;
}

.points {
  font-size: 13px;
  color: #999;
}

.delete-btn {
  background: #ffebee;
  color: #f44336;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
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

.avatar-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.avatar-option {
  font-size: 28px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  background: #f5f5f5;
}

.avatar-option.selected {
  background: #e8e4f8;
}

.input-group {
  margin-bottom: 12px;
}

.input-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
}

.limit-notice {
  margin: 16px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  text-align: center;
}

.limit-notice p {
  color: #999;
  margin-bottom: 12px;
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
}

.btn-primary:disabled {
  opacity: 0.5;
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
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

.warning {
  color: #f44336;
  font-size: 13px;
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
