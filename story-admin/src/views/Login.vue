<template>
  <div class="login-page">
    <div class="bg-shape shape-a"></div>
    <div class="bg-shape shape-b"></div>

    <div class="login-stage">
      <div class="login-card">
        <div class="brand">
          <div class="logo">♪</div>
          <h1>听故事 · 管理后台</h1>
          <p>让好声音陪伴每一天</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
          <el-form-item label="账号" prop="username">
            <el-input v-model="form.username" size="large" placeholder="请输入管理员账号" prefix-icon="User" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" size="large" type="password" show-password placeholder="请输入密码" prefix-icon="Lock" />
          </el-form-item>
          <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">
            登 录
          </el-button>
        </el-form>

        <div class="hint">默认账号 admin / admin123（可在 .env 修改）</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAdminStore } from '@/store'

const router = useRouter()
const route = useRoute()
const store = useAdminStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({ username: 'admin', password: 'admin123' })
const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await store.login(form.username, form.password)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch {
    // 错误已由 axios 拦截器提示
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0fdf8 0%, #e6f5ef 50%, #dcf0e8 100%);
  overflow: hidden;
}
.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
}
.shape-a {
  width: 480px; height: 480px;
  top: -160px; left: -140px;
  background: radial-gradient(circle, rgba(52, 211, 153, .25), transparent 70%);
}
.shape-b {
  width: 420px; height: 420px;
  bottom: -160px; right: -120px;
  background: radial-gradient(circle, rgba(110, 231, 183, .3), transparent 70%);
}

.login-stage {
  perspective: 1200px;
  z-index: 1;
  width: 420px;
  max-width: calc(100vw - 40px);
}
.login-card {
  background: #fff;
  border-radius: 24px;
  padding: 40px 36px 32px;
  box-shadow: 0 30px 70px rgba(31, 42, 55, .12), 0 8px 20px rgba(16, 185, 129, .08);
  transform: rotateX(4deg) rotateY(-3deg);
  transition: transform .4s ease, box-shadow .4s ease;
  &:hover {
    transform: rotateX(0) rotateY(0) translateY(-6px);
    box-shadow: 0 40px 80px rgba(31, 42, 55, .16), 0 12px 28px rgba(16, 185, 129, .12);
  }
}
.brand { text-align: center; margin-bottom: 28px; }
.logo {
  width: 64px; height: 64px;
  margin: 0 auto 16px;
  border-radius: 20px;
  background: linear-gradient(135deg, #34d399, #10b981);
  color: #fff;
  font-size: 36px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 12px 26px rgba(16, 185, 129, .35);
  transform: rotate(-8deg);
}
.brand h1 { font-size: 22px; margin: 0 0 8px; }
.brand p { font-size: 13px; color: #9ca3af; margin: 0; }

.submit-btn {
  width: 100%;
  height: 46px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
}
.hint {
  text-align: center;
  font-size: 12px;
  color: #b0b7bf;
  margin-top: 20px;
}
</style>
