<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="title">故事管理</h2>
        <p class="subtitle">共 {{ total }} 个故事</p>
      </div>
      <el-button type="primary" @click="openCreate">
        <el-icon style="margin-right:4px"><Plus /></el-icon>新增故事
      </el-button>
    </div>

    <div class="page-card">
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索标题或作者" clearable class="filter-keyword" @keyup.enter="load" />
        <el-select v-model="query.categoryId" placeholder="全部分类" clearable class="filter-category" @change="load">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable class="filter-status" @change="load">
          <el-option label="已上架" :value="1" />
          <el-option label="已下架" :value="0" />
        </el-select>
        <el-button @click="load">搜索</el-button>
      </div>

      <div class="table-wrap">
        <el-table :data="list" v-loading="loading" stripe style="width:100%" min-width="900">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column label="故事" min-width="200">
            <template #default="{ row }">
              <div class="story-cell">
                <div class="cover-thumb" :style="coverStyle(row)">♪</div>
                <div>
                  <div class="story-name">{{ row.title }}</div>
                  <div class="story-author">{{ row.author || '佚名' }} · {{ row.narrator || '—' }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="category_name" label="分类" width="110" />
          <el-table-column label="时长" width="90">
            <template #default="{ row }">{{ fmtDuration(row.duration) }}</template>
          </el-table-column>
          <el-table-column label="播放量" width="110">
            <template #default="{ row }">{{ formatNum(row.play_count) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '已上架' : '已下架' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="toggleStatus(row)">
                {{ row.status === 1 ? '下架' : '上架' }}
              </el-button>
              <el-button link type="primary" size="small" @click="openEpisodes(row)">分集</el-button>
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="load"
          @current-change="load"
        />
      </div>
    </div>

    <!-- 故事编辑弹窗 -->
    <el-dialog v-model="editVisible" :title="editingId ? '编辑故事' : '新增故事'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="故事标题" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="作者"><el-input v-model="form.author" placeholder="如：格林兄弟" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主播"><el-input v-model="form.narrator" placeholder="如：甜甜姐姐" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="分类">
          <el-select v-model="form.category_id" placeholder="选择分类" style="width:100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="一句话介绍这个故事" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="封面URL"><el-input v-model="form.cover_url" placeholder="/static/xxx.png" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="音频URL"><el-input v-model="form.audio_url" placeholder="/api/audio/xxx.mp3" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="时长(秒)"><el-input-number v-model="form.duration" :min="0" style="width:100%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序权重"><el-input-number v-model="form.sort_order" :min="0" style="width:100%" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分集管理弹窗 -->
    <el-dialog v-model="episodeVisible" :title="`分集管理 · ${currentStory?.title || ''}`" width="720px" destroy-on-close>
      <div class="ep-toolbar">
        <el-button type="primary" size="small" @click="addEpisode">新增分集</el-button>
      </div>
      <div class="table-wrap">
        <el-table :data="episodes" v-loading="epLoading" stripe size="small" min-width="680">
          <el-table-column prop="episode_no" label="集数" width="80" />
          <el-table-column label="标题" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.title" size="small" @blur="updateEp(row)" />
            </template>
          </el-table-column>
          <el-table-column label="音频URL" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.audio_url" size="small" placeholder="/api/audio/..." @blur="updateEp(row)" />
            </template>
          </el-table-column>
          <el-table-column label="时长(秒)" width="110">
            <template #default="{ row }">
              <el-input-number v-model="row.duration" :min="0" size="small" controls-position="right" @change="updateEp(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button link type="danger" size="small" @click="removeEp(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="episodeVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { storyApi, categoryApi } from '@/api'
import type { Story, Category, Episode, StoryPayload } from '@/types'

const list = ref<Story[]>([])
const categories = ref<Category[]>([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const query = reactive({ page: 1, pageSize: 10, keyword: '', categoryId: '' as number | '', status: '' as number | '' })

const editVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const form = reactive<StoryPayload>({ title: '', author: '', narrator: '', category_id: null, description: '', cover_url: '', audio_url: '', duration: 0, sort_order: 0, status: 1 })
const rules: FormRules = { title: [{ required: true, message: '请输入标题', trigger: 'blur' }] }

const episodeVisible = ref(false)
const episodes = ref<Episode[]>([])
const currentStory = ref<Story | null>(null)
const epLoading = ref(false)

const coverColors = ['#FFAB91', '#80DEB1', '#92B4F4', '#FFD166', '#B39DDB', '#6FCFBF']
function coverStyle(row: any) {
  const c = coverColors[(row.id - 1) % coverColors.length]
  return { background: c }
}
function formatNum(n: number) { return n >= 10000 ? (n / 10000).toFixed(1) + '万' : String(n) }
function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${s < 10 ? '0' + s : s}`
}

async function load() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: query.page, pageSize: query.pageSize }
    if (query.keyword) params.keyword = query.keyword
    if (query.categoryId) params.categoryId = query.categoryId
    if (query.status !== '') params.status = query.status
    const res = await storyApi.list(params)
    list.value = res.list
    total.value = res.total
  } catch { /* 已提示 */ } finally { loading.value = false }
}

async function loadCategories() {
  try { categories.value = await categoryApi.list() } catch { /* ignore */ }
}

function resetForm() {
  Object.assign(form, { title: '', author: '', narrator: '', category_id: null, description: '', cover_url: '', audio_url: '', duration: 0, sort_order: 0, status: 1 })
}

function openCreate() {
  editingId.value = null
  resetForm()
  editVisible.value = true
}

function openEdit(row: any) {
  editingId.value = row.id
  Object.assign(form, {
    title: row.title, author: row.author, narrator: row.narrator,
    category_id: row.category_id, description: row.description,
    cover_url: row.cover_url, audio_url: row.audio_url,
    duration: row.duration, sort_order: row.sort_order, status: row.status,
  })
  editVisible.value = true
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingId.value) await storyApi.update(editingId.value, form)
    else await storyApi.create(form)
    ElMessage.success('保存成功')
    editVisible.value = false
    load()
  } catch { /* 已提示 */ } finally { saving.value = false }
}

async function toggleStatus(row: any) {
  await storyApi.setStatus(row.id, row.status === 1 ? 0 : 1)
  ElMessage.success('状态已更新')
  load()
}

async function remove(row: any) {
  await ElMessageBox.confirm(`确定删除「${row.title}」吗？该操作不可恢复。`, '提示', { type: 'warning' })
  await storyApi.remove(row.id)
  ElMessage.success('已删除')
  load()
}

async function openEpisodes(row: any) {
  currentStory.value = row
  episodeVisible.value = true
  epLoading.value = true
  try { episodes.value = await storyApi.episodes(row.id) } catch { /* 已提示 */ } finally { epLoading.value = false }
}

async function addEpisode() {
  if (!currentStory.value) return
  const no = Math.max(0, ...episodes.value.map((e) => e.episode_no)) + 1
  const created = await storyApi.addEpisode(currentStory.value.id, {
    title: `第${no}集`, episode_no: no, audio_url: '', duration: 0,
  })
  episodes.value.push(created)
  ElMessage.success('已添加')
}

async function updateEp(row: any) {
  await storyApi.updateEpisode(row.id, { title: row.title, audio_url: row.audio_url, duration: row.duration })
}

async function removeEp(row: any) {
  await ElMessageBox.confirm('确定删除这一集吗？', '提示', { type: 'warning' })
  await storyApi.removeEpisode(row.id)
  episodes.value = episodes.value.filter((e) => e.id !== row.id)
  ElMessage.success('已删除')
}

onMounted(() => { load(); loadCategories() })
</script>

<style scoped lang="scss">
.toolbar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.filter-keyword { width: 240px; }
.filter-category { width: 160px; }
.filter-status { width: 140px; }
.story-cell { display: flex; align-items: center; gap: 12px; }
.cover-thumb {
  width: 44px; height: 44px; flex-shrink: 0;
  border-radius: 10px; color: #fff; font-size: 20px;
  display: flex; align-items: center; justify-content: center;
  transform: rotateY(-8deg);
  box-shadow: 0 4px 10px rgba(0,0,0,.1);
}
.story-name { font-size: 14px; font-weight: 600; }
.story-author { font-size: 12px; color: #9ca3af; margin-top: 3px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 20px; }
.ep-toolbar { margin-bottom: 16px; }

@media (max-width: 768px) {
  .toolbar { gap: 8px; }
  .filter-keyword { width: 100%; }
  .filter-category, .filter-status { flex: 1; min-width: 0; width: auto; }
  .pagination { justify-content: center; }
}
</style>
