<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/use-auth-store'
import { useNotificationStore } from '@/stores/use-notification-store'
import { useSEO } from '@/composables/useSEO'

useSEO({
  title: 'เข้าสู่ระบบ',
  description: 'เข้าสู่ระบบสำหรับผู้รับเหตุ',
  keywords: ['School SOS', 'เข้าสู่ระบบ'],
})

definePage({ meta: { layout: 'blank', public: true } })

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const form = reactive({
  username: '',
  password: '',
})
const isSubmitting = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (!form.username.trim() || !form.password) {
    error.value = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
    return
  }
  isSubmitting.value = true
  try {
    await authStore.login(form.username, form.password)
    notificationStore.showNotification('เข้าสู่ระบบสำเร็จ')
    router.push('/')
  }
  catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'เข้าสู่ระบบไม่สำเร็จ'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-5">
    <VCard class="auth-card" max-width="480" width="100%">
      <VCardText class="pa-8">
        <div class="text-center mb-6">
          <VIcon icon="ri-shield-keyhole-line" size="48" color="primary" />
          <h1 class="text-h4 font-weight-bold mt-3">เข้าสู่ระบบ</h1>
          <p class="text-body-1 text-medium-emphasis mt-1">สำหรับผู้รับเหตุเท่านั้น</p>
        </div>

        <VAlert v-if="error" type="error" variant="tonal" closable class="mb-4" @click:close="error = ''">
          {{ error }}
        </VAlert>

        <VForm @submit.prevent="submit">
          <VTextField
            v-model="form.username"
            label="ชื่อผู้ใช้"
            prepend-inner-icon="ri-user-line"
            autocomplete="username"
            :disabled="isSubmitting"
          />
          <VTextField
            v-model="form.password"
            label="รหัสผ่าน"
            type="password"
            prepend-inner-icon="ri-lock-line"
            autocomplete="current-password"
            :disabled="isSubmitting"
            class="mt-3"
          />
          <VBtn
            type="submit"
            color="primary"
            size="large"
            block
            :loading="isSubmitting"
            class="mt-5"
          >
            เข้าสู่ระบบ
          </VBtn>
        </VForm>

        <VDivider class="my-6" />

        <div class="text-center">
          <p class="text-body-2 text-medium-emphasis">
            ต้องการแจ้งเหตุ? <VBtn variant="plain" to="/report" density="compact">แจ้งเหตุใหม่</VBtn>
          </p>
          <p class="text-body-2 text-medium-emphasis mt-1">
            <VBtn variant="plain" to="/" density="compact">กลับหน้าแรก</VBtn>
          </p>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-block-size: 100dvh;
}

.auth-card {
  border-radius: 12px;
}
</style>
