<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/use-auth-store'

const router = useRouter()
const authStore = useAuthStore()
const menuOpen = ref(false)

function goToLogin() {
  router.push('/login')
}

function logout() {
  menuOpen.value = false
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div v-if="authStore.isLoggedIn" class="d-flex align-center">
    <VMenu v-model="menuOpen" :close-on-content-click="false">
      <template #activator="{ props }">
        <VBtn
          v-bind="props"
          variant="text"
          prepend-icon="ri-account-circle-line"
          class="text-none text-body-2"
          size="small"
        >
          {{ authStore.displayName }}
        </VBtn>
      </template>
      <VCard min-width="200">
        <VCardText class="pa-4">
          <div class="text-body-2 text-medium-emphasis">
            {{ authStore.user?.username }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Role: {{ authStore.user?.role === 'responder' ? 'ผู้รับเหตุ' : authStore.user?.role }}
          </div>
          <VDivider class="my-3" />
          <VBtn variant="text" prepend-icon="ri-logout-box-line" block @click="logout">
            ออกจากระบบ
          </VBtn>
        </VCardText>
      </VCard>
    </VMenu>
  </div>
  <div v-else>
    <VBtn variant="outlined" size="small" prepend-icon="ri-login-box-line" @click="goToLogin">
      เข้าสู่ระบบ
    </VBtn>
  </div>
</template>
