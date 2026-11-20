<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="title">用户管理</h2>
        <p class="subtitle">共 {{ total }} 位听友</p>
      </div>
    </div>

    <div class="page-card">
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索昵称或 openid" clearable class="user-search" @keyup.enter="load" />
        <el-button @click="load">搜索</el-button>
      </div>
      <div class="table-wrap">
        <el-table :data="list" v-loading="loading" stripe style="width:100%" min-width="680">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column label="用户" min-width="200">
            <template #default="{ row }">
              <div class="user-cell">
                <span class="avatar">{{ row.nickname.charAt(0) }}</span>
                <div>
                  <div class="nickname">{{ row.nickname }}</div>
                  <div class="openid">{{ row.openid }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="收藏" width="100">
            <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.favorite_count }}</el-tag></template>
          </el-table-column>
          <el-table-column label="收听记录" width="110">
            <template #default="{ row }"><el-tag size="small" effect="plain" type="success">{{ row.history_count }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="created_at" label="注册时间" min-width="180" />
        </el-table>
      </div>
      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="load" @current-change="load"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { userApi } from '@/api'
import type { UserItem } from '@/types'

const list = ref<UserItem[]>([])
const total = ref(0)
const loading = ref(false)
const query = reactive({ page: 1, pageSize: 10, keyword: '' })

async function load() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: query.page, pageSize: query.pageSize }
    if (query.keyword) params.keyword = query.keyword
    const res = await userApi.list(params)
    list.value = res.list
    total.value = res.total
  } catch { /* 已提示 */ } finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped lang="scss">
.toolbar { display: flex; gap: 12px; margin-bottom: 20px; }
.user-search { width: 260px; }
.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar {
  width: 40px; height: 40px; flex-shrink: 0; border-radius: 12px;
  background: linear-gradient(135deg, #a7f3d0, #10b981);
  color: #fff; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.nickname { font-size: 14px; font-weight: 600; }
.openid { font-size: 11px; color: #c0c6cd; margin-top: 3px; font-family: monospace; }
.pagination { display: flex; justify-content: flex-end; margin-top: 20px; }

@media (max-width: 768px) {
  .user-search { width: 100%; }
  .pagination { justify-content: center; }
}
</style>
