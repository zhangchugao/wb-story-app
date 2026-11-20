<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="title">热搜词</h2>
        <p class="subtitle">小程序搜索页展示的热门关键词</p>
      </div>
      <el-button type="primary" @click="dialogVisible = true">
        <el-icon style="margin-right:4px"><Plus /></el-icon>添加热搜词
      </el-button>
    </div>

    <div class="page-card" style="max-width:760px">
      <div class="tag-cloud">
        <div v-for="item in list" :key="item.id" class="hot-tag">
          <span class="rank">{{ item.weight }}</span>
          <span class="word">{{ item.keyword }}</span>
          <el-icon class="del" @click="remove(item)"><Close /></el-icon>
        </div>
        <el-empty v-if="!list.length" description="还没有热搜词" :image-size="70" />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="添加热搜词" width="420px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="关键词" prop="keyword">
          <el-input v-model="form.keyword" placeholder="如：小红帽" />
        </el-form-item>
        <el-form-item label="权重">
          <el-input-number v-model="form.weight" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Close } from '@element-plus/icons-vue'
import { hotKeywordApi } from '@/api'
import type { HotKeyword } from '@/types'

const list = ref<HotKeyword[]>([])
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ keyword: '', weight: 0, sort_order: 0 })
const rules: FormRules = { keyword: [{ required: true, message: '请输入关键词', trigger: 'blur' }] }

async function load() { try { list.value = await hotKeywordApi.list() } catch { /* 已提示 */ } }
async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  await hotKeywordApi.create(form)
  ElMessage.success('已添加')
  dialogVisible.value = false
  load()
}
async function remove(item: HotKeyword) {
  await ElMessageBox.confirm(`删除热搜词「${item.keyword}」？`, '提示', { type: 'warning' })
  await hotKeywordApi.remove(item.id)
  ElMessage.success('已删除')
  load()
}
onMounted(load)
</script>

<style scoped lang="scss">
.tag-cloud { display: flex; flex-wrap: wrap; gap: 14px; }
.hot-tag {
  display: flex; align-items: center; gap: 10px;
  background: var(--mint-soft);
  border-radius: 12px;
  padding: 10px 14px;
  transform: perspective(400px) rotateX(3deg);
  transition: transform .2s ease;
  &:hover { transform: perspective(400px) rotateX(0) translateY(-3px); }
  .rank {
    width: 24px; height: 24px; border-radius: 8px;
    background: var(--mint); color: #fff;
    font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
  .word { font-size: 14px; font-weight: 600; color: var(--mint-deep); }
  .del { cursor: pointer; color: #9ca3af; margin-left: 4px; &:hover { color: #ef4444; } }
}
</style>
