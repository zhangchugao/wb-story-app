<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="title">分类管理</h2>
        <p class="subtitle">管理故事分类与展示顺序</p>
      </div>
      <el-button type="primary" @click="openCreate">
        <el-icon style="margin-right:4px"><Plus /></el-icon>新增分类
      </el-button>
    </div>

    <div class="page-card">
      <div class="table-wrap">
        <el-table :data="list" v-loading="loading" stripe style="width:100%" min-width="720">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="分类名" min-width="160">
            <template #default="{ row }">
              <div class="cat-cell">
                <span class="cat-icon">{{ row.name.charAt(0) }}</span>
                <strong>{{ row.name }}</strong>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="icon" label="图标标识" min-width="120" />
          <el-table-column label="排序" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.sort_order" :min="0" size="small" controls-position="right" @change="update(row)" />
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" min-width="170" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑分类' : '新增分类'" width="460px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="分类名" prop="name">
          <el-input v-model="form.name" placeholder="如：童话寓言" />
        </el-form-item>
        <el-form-item label="图标标识">
          <el-input v-model="form.icon" placeholder="如：fairy（可选）" />
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="form.sort_order" :min="0" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { categoryApi } from '@/api'
import type { Category } from '@/types'

const list = ref<Category[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({ name: '', icon: '', sort_order: 0 })
const rules: FormRules = { name: [{ required: true, message: '请输入分类名', trigger: 'blur' }] }

async function load() {
  loading.value = true
  try { list.value = await categoryApi.list() } catch { /* 已提示 */ } finally { loading.value = false }
}
function openCreate() { editingId.value = null; Object.assign(form, { name: '', icon: '', sort_order: 0 }); dialogVisible.value = true }
function openEdit(row: any) { editingId.value = row.id; Object.assign(form, { name: row.name, icon: row.icon, sort_order: row.sort_order }); dialogVisible.value = true }
async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (editingId.value) await categoryApi.update(editingId.value, form)
  else await categoryApi.create(form)
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}
async function update(row: any) {
  await categoryApi.update(row.id, { sort_order: row.sort_order })
  ElMessage.success('已保存')
}
async function remove(row: any) {
  await ElMessageBox.confirm(`确定删除分类「${row.name}」吗？`, '提示', { type: 'warning' })
  try {
    await categoryApi.remove(row.id)
    ElMessage.success('已删除')
    load()
  } catch { /* 有故事的分类后端会拒绝，已提示 */ }
}
onMounted(load)
</script>

<style scoped lang="scss">
.cat-cell { display: flex; align-items: center; gap: 10px; }
.cat-icon {
  width: 32px; height: 32px; border-radius: 10px;
  background: var(--mint-soft); color: var(--mint-deep);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700;
}
</style>
