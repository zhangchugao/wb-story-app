<template>
  <el-container class="layout">
    <!-- 桌面侧边栏 -->
    <el-aside v-if="!isMobile" :width="collapsed ? '72px' : '230px'" class="aside">
      <SideMenu :compact="collapsed" />
    </el-aside>

    <!-- 移动端抽屉侧边栏 -->
    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      size="240px"
      :with-header="false"
      class="mobile-drawer"
    >
      <SideMenu @select="drawerVisible = false" />
    </el-drawer>

    <el-container class="main-wrap">
      <el-header class="header">
        <div class="header-left">
          <!-- 移动端汉堡菜单 -->
          <el-icon v-if="isMobile" class="collapse-btn menu-toggle" @click="drawerVisible = true">
            <Menu />
          </el-icon>
          <!-- 桌面折叠按钮 -->
          <el-icon v-else class="collapse-btn" @click="collapsed = !collapsed">
            <Expand v-if="collapsed" />
            <Fold v-else />
          </el-icon>
          <el-breadcrumb separator="/" :class="{ 'mobile-crumb': isMobile }">
            <el-breadcrumb-item v-if="!isMobile">听故事</el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag v-if="!isMobile" type="success" size="small" effect="plain">管理端</el-tag>
          <el-dropdown @command="onCommand">
            <div class="user-chip">
              <span class="avatar">{{ username.charAt(0).toUpperCase() }}</span>
              <span v-if="!isMobile" class="name">{{ username }}</span>
              <el-icon v-if="!isMobile"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="content" :class="{ 'mobile-content': isMobile }">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/store'
import { useMobile } from '@/utils/useMobile'
import SideMenu from '@/components/SideMenu.vue'
import { Expand, Fold, ArrowDown, Menu } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const store = useAdminStore()
const collapsed = ref(false)
const drawerVisible = ref(false)
const { isMobile } = useMobile()
const username = computed(() => store.userInfo?.username || 'admin')

function onCommand(cmd: string) {
  if (cmd === 'logout') {
    store.logout()
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
.layout { height: 100vh; height: 100dvh; }

.aside {
  background: #fff;
  border-right: 1px solid #eef2f0;
  display: flex;
  flex-direction: column;
  transition: width .25s ease;
  overflow: hidden;
}

.main-wrap { overflow: hidden; }
.header {
  background: #fff;
  border-bottom: 1px solid #eef2f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
}
.header-left { display: flex; align-items: center; gap: 18px; }
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  &:hover { color: var(--mint); }
}
.header-right { display: flex; align-items: center; gap: 16px; }
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  .avatar {
    width: 32px; height: 32px; border-radius: 10px;
    background: var(--mint-soft); color: var(--mint-deep);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 14px;
  }
  .name { font-size: 14px; font-weight: 500; }
}

.content {
  padding: 24px;
  overflow: auto;
  background: var(--page-bg);
}

// 移动端适配
.mobile-drawer {
  :deep(.el-drawer__body) { padding: 0; }
}
.mobile-crumb { font-size: 13px; }
.mobile-content { padding: 14px; }
</style>
