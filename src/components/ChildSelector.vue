<template>
  <div class="child-selector" v-if="children.length >= 1">
    <div class="children-scroll">
      <button 
        v-for="child in children" 
        :key="child.id"
        class="child-tab"
        :class="{ active: selectedChildId === child.id }"
        @click="selectChild(child.id)"
      >
        <span class="child-avatar">{{ child.avatar }}</span>
        <span class="child-name">{{ child.name }}</span>
      </button>
      <button class="add-btn" @click="goToChildren">+</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../stores/store';

const router = useRouter();

const goToChildren = () => router.push('/children');

const emit = defineEmits<{
  (e: 'childChanged', childId: string): void;
}>();

const children = computed(() => store.getChildren());

const selectedChildId = ref<string>('');

// 初始化选中当前孩子
watch(() => store.getCurrentChild(), (child) => {
  if (child) {
    selectedChildId.value = child.id;
  } else if (children.value.length > 0) {
    selectedChildId.value = children.value[0].id;
  }
}, { immediate: true });

const selectChild = (id: string) => {
  selectedChildId.value = id;
  store.setCurrentChild(id);
  emit('childChanged', id);
};
</script>

<style scoped>
.child-selector {
  background: var(--color-bg-card);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.children-scroll {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  padding: 0 var(--space-md);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.children-scroll::-webkit-scrollbar {
  display: none;
}

.child-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: var(--color-bg);
  border: 2px solid transparent;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.child-tab.active {
  background: var(--gradient-hero);
  color: white;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.child-tab .child-avatar {
  font-size: 16px;
}

.child-tab .child-name {
  font-size: 12px;
  font-weight: 600;
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-bg);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-xl);
  color: var(--color-primary);
  font-size: 18px;
  font-weight: 300;
  cursor: pointer;
  flex-shrink: 0;
}
</style>
