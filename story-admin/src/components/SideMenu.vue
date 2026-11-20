<template>
  <div class="side-inner" :class="{ compact }">
    <div class="brand" @click="go('/dashboard')">
      <div class="brand-logo">♪</div>
      <div v-if="!compact" class="brand-text">
        <strong>听故事</strong>
        <span>管理后台</span>
      </div>
    </div>

    <el-menu
      :default-active="route.path"
      :collapse="compact"
      :collapse-transition="false"
      router
      class="side-menu"
      @select="onSelect"
    >
      <el-menu-item index="/dashboard">
        <el-icon><DataBoard /></el-icon>
        <template #title>概览</template>
      </el-menu-item>
      <el-menu-item index="/stories">
        <el-icon><Reading /></el-icon>
        <template #title>故事管理</template>
      </el-menu-item>
      <el-menu-item index="/categories">
        <el-icon><Files /></el-icon>
        <template #title>分类管理</template>
      </el-menu-item>
      <el-menu-item index="/hot-keywords">
        <el-icon><TrendCharts /></el-icon>
        <template #title>热搜词</template>
      </el-menu-item>
      <el-menu-item index="/users">
        <el-icon><User /></el-icon>
        <template #title>用户管理</template>
      </el-menu-item>
      <el-menu-item index="/upload">
        <el-icon><FolderOpened /></el-icon>
        <template #title>资源管理</template>
      </el-menu-item>
    </el-menu>

    <div class="aside-footer" v-if="!compact">
      <div class="mini-card">
        <span class="mini-dot"></span>
        <span>v1.0 · 用心做好每一个故事</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import {
  DataBoard, Reading, Files, TrendCharts, User, FolderOpened,
} from '@element-plus/icons-vue'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const emit = defineEmits<{ select: [] }>()

const route = useRoute()
const router = useRouter()

function go(path: string) {
  router.push(path)
  emit('select')
}
function onSelect() { emit('select') }
</script>

<style scoped lang="scss">
.side-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.brand {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  cursor: pointer;
  border-bottom: 1px solid #f2f5f3;
  flex-shrink: 0;
}
.brand-logo {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #34d399, #10b981);
  color: #fff;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(16, 185, 129, .3);
  transform: rotate(-6deg);
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  strong { font-size: 17px; }
  span { font-size: 11px; color: #9ca3af; letter-spacing: 1px; }
}
.side-menu {
  border: none;
  flex: 1;
  --el-menu-item-height: 50px;
  :deep(.el-menu-item) {
    margin: 4px 10px;
    border-radius: 10px;
    &.is-active {
      background: var(--mint-soft);
      color: var(--mint-deep);
      font-weight: 600;
    }
  }
}
.aside-footer { padding: 16px; }
.mini-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f7fbf9;
  border-radius: 10px;
  padding: 12px;
  font-size: 11px;
  color: #9ca3af;
  transform: perspective(400px) rotateX(3deg);
}
.mini-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, .15);
}
</style>
