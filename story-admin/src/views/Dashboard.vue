<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="title">概览</h2>
        <p class="subtitle">数据一目了然，故事尽在掌握</p>
      </div>
      <el-button :loading="loading" @click="load">刷新数据</el-button>
    </div>

    <el-row :gutter="20">
      <el-col v-for="card in statCards" :key="card.key" :xs="24" :sm="12" :md="6">
        <div class="stat-card" :style="{ '--accent': card.color }">
          <div class="stat-icon">{{ card.icon }}</div>
          <div class="stat-body">
            <div class="stat-label">{{ card.label }}</div>
            <div class="stat-value">{{ formatNum(card.value) }}</div>
          </div>
          <div class="stat-deco"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt">
      <el-col :xs="24" :md="12">
        <div class="page-card">
          <h3 class="card-title">分类分布</h3>
          <div class="bar-chart">
            <div v-for="item in stats.byCategory" :key="item.name" class="bar-row">
              <span class="bar-label">{{ item.name }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: barWidth(item.value) }"></div>
              </div>
              <span class="bar-value">{{ item.value }}</span>
            </div>
            <el-empty v-if="!stats.byCategory.length" description="暂无数据" :image-size="60" />
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="12">
        <div class="page-card">
          <h3 class="card-title">热门故事 Top 5</h3>
          <div class="rank-list">
            <div v-for="(item, i) in stats.topStories" :key="item.id" class="rank-row">
              <span class="rank-num" :class="{ 'top': i < 3 }">{{ i + 1 }}</span>
              <span class="rank-title">{{ item.title }}</span>
              <span class="rank-plays">{{ formatNum(item.play_count) }} 次</span>
            </div>
            <el-empty v-if="!stats.topStories.length" description="暂无数据" :image-size="60" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { statsApi } from '@/api'
import type { Stats } from '@/types'

const loading = ref(false)
const stats = reactive<Stats>({
  storyCount: 0, onlineCount: 0, userCount: 0, favoriteCount: 0,
  totalPlays: 0, historyCount: 0, byCategory: [], topStories: [],
})

const statCards = computed(() => [
  { key: 'stories', label: '故事总数', value: stats.storyCount, icon: '📖', color: '#10b981' },
  { key: 'online', label: '已上架', value: stats.onlineCount, icon: '✅', color: '#0ea5e9' },
  { key: 'users', label: '听友数', value: stats.userCount, icon: '👥', color: '#8b5cf6' },
  { key: 'plays', label: '总播放量', value: stats.totalPlays, icon: '▶', color: '#f59e0b' },
])

function formatNum(n: number) {
  return n >= 10000 ? (n / 10000).toFixed(1) + '万' : String(n)
}

function barWidth(v: number) {
  const max = Math.max(1, ...stats.byCategory.map((c) => c.value))
  return Math.max(6, (v / max) * 100) + '%'
}

async function load() {
  loading.value = true
  try {
    const data = await statsApi.get()
    Object.assign(stats, data)
  } catch {
    // 已提示
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.mt { margin-top: 20px; }

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 16px;
  padding: 24px 20px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(31, 42, 55, .04);
  transform: perspective(600px) rotateX(2deg);
  transition: transform .25s ease, box-shadow .25s ease;
  &:hover {
    transform: perspective(600px) rotateX(0) translateY(-6px);
    box-shadow: 0 18px 40px rgba(31, 42, 55, .1);
  }
}
.stat-icon {
  width: 54px; height: 54px; flex-shrink: 0;
  border-radius: 16px;
  background: color-mix(in srgb, var(--accent) 12%, white);
  color: var(--accent);
  font-size: 26px;
  display: flex; align-items: center; justify-content: center;
}
.stat-body { position: relative; z-index: 1; }
.stat-label { font-size: 13px; color: #9ca3af; }
.stat-value { font-size: 28px; font-weight: 800; margin-top: 4px; }
.stat-deco {
  position: absolute; right: -20px; bottom: -30px;
  width: 100px; height: 100px; border-radius: 50%;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.page-card { padding: 24px; }
.card-title { font-size: 16px; margin: 0 0 20px; font-weight: 700; }

.bar-chart { display: flex; flex-direction: column; gap: 16px; }
.bar-row { display: flex; align-items: center; gap: 12px; }
.bar-label { width: 72px; font-size: 13px; color: #6b7280; flex-shrink: 0; }
.bar-track { flex: 1; height: 10px; background: #f0f5f2; border-radius: 999px; overflow: hidden; }
.bar-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, #34d399, #10b981);
  transition: width .5s ease;
}
.bar-value { width: 24px; text-align: right; font-size: 13px; font-weight: 600; }

.rank-list { display: flex; flex-direction: column; gap: 4px; }
.rank-row {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 8px; border-radius: 10px;
  &:hover { background: #f7fbf9; }
}
.rank-num {
  width: 28px; height: 28px; flex-shrink: 0;
  border-radius: 9px; background: #f0f5f2; color: #9ca3af;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700;
  &.top { background: var(--mint-soft); color: var(--mint-deep); }
}
.rank-title { flex: 1; font-size: 14px; }
.rank-plays { font-size: 12px; color: #9ca3af; }
</style>
