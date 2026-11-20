<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="title">资源管理</h2>
        <p class="subtitle">上传音频与封面，路径可直接填入故事表单</p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :md="12">
        <div class="page-card">
          <h3 class="card-title">音频文件</h3>
          <el-upload
            class="upload-zone"
            drag
            :auto-upload="true"
            :show-file-list="false"
            accept=".mp3,.m4a,.aac,.ogg,.wav"
            :http-request="uploadAudio"
          >
            <div class="upload-inner">
              <div class="upload-icon">♪</div>
              <div class="upload-text">拖拽音频到这里，或 <em>点击选择</em></div>
              <div class="upload-tip">支持 mp3 / m4a / aac / ogg / wav，最大 100MB</div>
            </div>
          </el-upload>
          <div v-if="lastAudio" class="result-box">
            <span class="result-label">上传成功，复制路径：</span>
            <el-input :model-value="lastAudio" readonly size="small">
              <template #append>
                <el-button @click="copy(lastAudio)">复制</el-button>
              </template>
            </el-input>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="12">
        <div class="page-card">
          <h3 class="card-title">封面图片</h3>
          <el-upload
            class="upload-zone"
            drag
            :auto-upload="true"
            :show-file-list="false"
            accept=".png,.jpg,.jpeg,.gif,.webp"
            :http-request="uploadImage"
          >
            <div class="upload-inner">
              <div class="upload-icon photo">▣</div>
              <div class="upload-text">拖拽图片到这里，或 <em>点击选择</em></div>
              <div class="upload-tip">支持 png / jpg / gif / webp，最大 10MB</div>
            </div>
          </el-upload>
          <div v-if="lastImage" class="result-box">
            <span class="result-label">上传成功，复制路径：</span>
            <el-input :model-value="lastImage" readonly size="small">
              <template #append>
                <el-button @click="copy(lastImage)">复制</el-button>
              </template>
            </el-input>
            <div class="preview"><img :src="lastImage" alt="预览" /></div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="page-card" style="margin-top:20px">
      <h3 class="card-title">使用说明</h3>
      <ol class="howto">
        <li>在这里上传音频或封面，上传成功后会生成一个路径（如 <code>/api/audio/xxx.mp3</code>）。</li>
        <li>点击「复制」按钮，把路径粘贴到「故事管理 → 编辑 → 音频URL / 封面URL」中。</li>
        <li>音频文件会存放在后端的 <code>storage/audio/</code>，封面在 <code>storage/static/</code>。</li>
        <li>种子数据里的示例路径是占位的，替换成这里上传的真实路径后即可正常播放。</li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { uploadApi } from '@/api'

const lastAudio = ref('')
const lastImage = ref('')

async function uploadAudio(options: UploadRequestOptions) {
  try {
    const res = await uploadApi.audio(options.file as File)
    lastAudio.value = res.url
    options.onSuccess(res)
    ElMessage.success('音频上传成功')
  } catch (e) {
    options.onError(e as never)
  }
}

async function uploadImage(options: UploadRequestOptions) {
  try {
    const res = await uploadApi.image(options.file as File)
    lastImage.value = res.url
    options.onSuccess(res)
    ElMessage.success('图片上传成功')
  } catch (e) {
    options.onError(e as never)
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.info('请手动复制：' + text)
  }
}
</script>

<style scoped lang="scss">
.card-title { font-size: 16px; margin: 0 0 18px; font-weight: 700; }
.upload-zone {
  :deep(.el-upload) { width: 100%; }
  :deep(.el-upload-dragger) {
    width: 100%;
    border-radius: 14px;
    border: 2px dashed #c7e8d8;
    background: #f9fdfb;
    padding: 36px 20px;
    transition: border-color .2s, background .2s;
    &:hover { border-color: var(--mint); background: var(--mint-soft); }
  }
}
.upload-inner { text-align: center; transform: perspective(400px) rotateX(3deg); }
.upload-icon {
  width: 56px; height: 56px; margin: 0 auto 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, #34d399, #10b981);
  color: #fff; font-size: 30px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 22px rgba(16, 185, 129, .28);
  &.photo { font-size: 26px; }
}
.upload-text { font-size: 15px; font-weight: 600; em { color: var(--mint); font-style: normal; } }
.upload-tip { font-size: 12px; color: #9ca3af; margin-top: 8px; }
.result-box { margin-top: 18px; }
.result-label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 8px; }
.preview { margin-top: 12px; img { max-width: 100%; max-height: 160px; border-radius: 10px; box-shadow: 0 6px 18px rgba(0,0,0,.1); } }
.howto { line-height: 2; font-size: 14px; color: #4b5563; padding-left: 22px; margin: 0; code { background: #f0f5f2; padding: 2px 6px; border-radius: 5px; color: var(--mint-deep); font-size: 13px; } }
</style>
