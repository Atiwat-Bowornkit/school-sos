<script setup lang="ts">
import { ref } from 'vue'
import { incidentApi } from '@/apis/incident-api'
import type { Incident } from '@/models'
import { statusLabels, priorityLabels, categoryLabels } from '@/utils/incident-labels'
import { formatThaiDateTime } from '@/utils/date-format'
import { useSEO } from '@/composables/useSEO'

useSEO({
  title: 'ติดตามเหตุ',
  description: 'ตรวจสอบสถานะเหตุที่แจ้ง',
  keywords: ['School SOS', 'ติดตามเหตุ', 'ตรวจสอบ'],
})

const code = ref('')
const isLoading = ref(false)
const error = ref('')
const incident = ref<Incident | null>(null)
const notFound = ref(false)

async function lookup() {
  const trimmed = code.value.trim()
  if (!trimmed) {
    error.value = 'กรุณากรอก Incident Code'
    return
  }
  isLoading.value = true
  error.value = ''
  incident.value = null
  notFound.value = false
  try {
    const response = await incidentApi.lookupByCode(trimmed)
    incident.value = response.data
  }
  catch (caught) {
    if (caught instanceof Error && caught.message.includes('404')) {
      notFound.value = true
    }
    else {
      error.value = caught instanceof Error ? caught.message : 'ไม่สามารถค้นหาได้'
    }
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="track-page mx-auto">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">
        ติดตามสถานะเหตุ
      </h1>
      <p class="text-body-1 text-medium-emphasis mt-1">
        กรอก Incident Code เพื่อตรวจสอบสถานะล่าสุดของเหตุที่คุณแจ้ง
      </p>
    </div>

    <VCard class="mb-5">
      <VCardText class="pa-5">
        <VAlert v-if="error" type="error" variant="tonal" closable class="mb-4" @click:close="error = ''">
          {{ error }}
        </VAlert>

        <VForm @submit.prevent="lookup">
          <VTextField
            v-model="code"
            label="Incident Code"
            placeholder="เช่น SOS-2026-ABC123"
            prepend-inner-icon="ri-fingerprint-line"
            hint="กรอกรหัสเหตุที่ได้รับหลังจากแจ้งเหตุ"
            persistent-hint
            :disabled="isLoading"
            clearable
          />
          <VBtn
            type="submit"
            color="primary"
            :loading="isLoading"
            :disabled="!code.trim()"
            class="mt-3"
          >
            <VIcon start icon="ri-search-line" />
            ค้นหา
          </VBtn>
        </VForm>
      </VCardText>
    </VCard>

    <VAlert
      v-if="notFound"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      <div class="d-flex flex-wrap align-center gap-3">
        <div>
          <div class="font-weight-medium">ไม่พบ Incident</div>
          <div class="text-body-2">กรุณาตรวจสอบ Incident Code ของคุณอีกครั้ง</div>
        </div>
      </div>
    </VAlert>

    <VCard v-if="incident" variant="outlined">
      <VCardItem>
        <template #prepend>
          <IncidentStatusChip :status="incident.status" />
        </template>
        <VCardTitle>{{ incident.title }}</VCardTitle>
        <VCardSubtitle class="text-primary">{{ incident.incidentCode }}</VCardSubtitle>
      </VCardItem>

      <VCardText class="pa-5 pt-0">
        <VDivider class="mb-4" />
        <div class="detail-grid">
          <div>
            <div class="detail-label">สถานะ</div>
            <IncidentStatusChip :status="incident.status" />
          </div>
          <div>
            <div class="detail-label">ความสำคัญ</div>
            <IncidentPriorityChip :priority="incident.confirmedPriority" />
          </div>
          <div>
            <div class="detail-label">หมวด</div>
            <span>{{ categoryLabels[incident.category] }}</span>
          </div>
          <div>
            <div class="detail-label">สถานที่</div>
            <span>{{ incident.location }}</span>
          </div>
          <div>
            <div class="detail-label">ผู้รับผิดชอบ</div>
            <span>{{ incident.assigneeName || 'ยังไม่ระบุ' }}</span>
          </div>
          <div>
            <div class="detail-label">แจ้งเมื่อ</div>
            <span>{{ formatThaiDateTime(incident.createdAt) }}</span>
          </div>
        </div>

        <div v-if="incident.summary" class="mt-4">
          <div class="detail-label">Summary</div>
          <p>{{ incident.summary }}</p>
        </div>

        <div class="mt-4">
          <VBtn variant="outlined" :to="`/incidents/${incident.id}`">
            ดูรายละเอียดเพิ่มเติม
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <div class="text-center mt-6">
      <VBtn variant="text" to="/report" prepend-icon="ri-alarm-warning-line">
        แจ้งเหตุใหม่
      </VBtn>
    </div>
  </div>
</template>

<style scoped>
.track-page {
  max-inline-size: 720px;
}

.detail-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow-wrap: break-word;
  word-break: break-word;
}

.detail-label {
  color: rgb(var(--v-theme-on-surface), 0.65);
  font-size: 0.8125rem;
  margin-block-end: 4px;
}

@media (max-width: 600px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
