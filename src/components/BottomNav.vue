<template>
  <div class="nav-bar">
    <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
      <span class="nav-icon">🏠</span>
      <span>首页</span>
    </router-link>
    <router-link to="/badges" class="nav-item" :class="{ active: $route.path === '/badges' }">
      <span class="nav-icon">🏆</span>
      <span>成就</span>
    </router-link>
    <router-link to="/tasks" class="nav-item" :class="{ active: $route.path === '/tasks' }">
      <span class="nav-icon">📋</span>
      <span>任务</span>
    </router-link>
    <router-link to="/rewards" class="nav-item" :class="{ active: $route.path === '/rewards' }">
      <span class="nav-icon">🎁</span>
      <span>奖励</span>
    </router-link>
    <router-link to="/children" class="nav-item" :class="{ active: $route.path === '/children' }">
      <span class="nav-icon">👶</span>
      <span>孩子</span>
    </router-link>
  </div>
</template>

<script setup lang="ts">
// 统一底部导航栏组件
</script>

<style scoped>
.nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-around;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 12px));
  box-shadow: 0 -1px 0 var(--color-border, #e2e8f0), 0 -4px 12px rgba(0, 0, 0, 0.05);
  z-index: 50;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-decoration: none;
  color: var(--color-text-muted, #94a3b8);
  font-size: 10px;
  font-weight: 500;
  padding: 4px 12px;
  transition: all 0.15s ease;
  min-width: 50px;
}

.nav-item .nav-icon {
  font-size: 22px;
  transition: transform 0.15s ease;
}

.nav-item.active {
  color: var(--color-primary, #6366f1);
}

.nav-item.active .nav-icon {
  transform: scale(1.1);
}
</style>
