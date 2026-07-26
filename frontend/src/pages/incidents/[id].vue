<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type {
  IncidentPriority,
  IncidentStatus,
  ResolveIncidentBody,
} from '@/models'
import { INCIDENT_PRIORITIES, INCIDENT_STATUSES } from '@/models'
import { incidentApi } from '@/apis/incident-api'
import { useSEO } from '@/composables/useSEO'
import { useIncidentStore } from '@/stores/use-incident-store'
import { useNotificationStore } from '@/stores/use-notification-store'
import {
  priorityLabels,
  statusLabels,
} from '@/utils/incident-labels'
import { formatThaiDateTime } from '@/utils/date-format'

useSEO({
  title: 'รายละเอียด Incident',
  description: 'ติดตามและจัดการเหตุภายในโรงเรียน',
  keywords: ['School SOS', 'Incident'],
})

const route = useRoute()
const incidentStore = useIncidentStore()
const notificationStore = useNotificationStore()
const {
  selectedIncident: incident,
  selectedTimeline: timeline,
  isLoading,
  isSubmitting,
  error,
} = storeToRefs(incidentStore)

const management = reactive({
  assigneeName: '',
  confirmedPriority: 'UNASSIGNED' as IncidentPriority,
  actorName: '',
})
const progress = reactive({ description: '', actorName: '' })
const resolveDialog = ref(false)
const confirmDialog = ref(false)
const pendingStatus = ref<IncidentStatus | null>(null)

const priorityOptions = INCIDENT_PRIORITIES.map(value => ({ title: priorityLabels[value], value }))
const statusIndex = (status: IncidentStatus) => INCIDENT_STATUSES.indexOf(status)
const imageUrl = computed(() => incidentApi.imageUrl(incident.value?.imageUrl))
const id = computed(() => route.path.split('/').filter(Boolean).at(-1) ?? '')

watch(incident, (value) => {
  if (!value)
    return
  management.assigneeName = value.assigneeName ?? ''
  management.confirmedPriority = value.confirmedPriority
}, { immediate: true })

async function load() {
  try {
    await incidentStore.fetchIncidentById(id.value)
  }
  catch {
    // Store exposes the user-facing error state.
  }
}

async function saveManagement() {
  if (!incident.value)
    return
  try {
    await incidentStore.updateIncident(incident.value.id, {
      assigneeName: management.assigneeName,
      confirmedPriority: management.confirmedPriority,
      actorName: management.actorName.trim() || undefined,
    })
    notificationStore.showNotification('บันทึกผู้รับผิดชอบและ Priority สำเร็จ')
  }
  catch {
    notificationStore.showNotification('ไม่สามารถบันทึกข้อมูลได้', 'error')
  }
}

async function requestStatus(status: IncidentStatus) {
  if (!incident.value)
    return
  if (statusIndex(status) < statusIndex(incident.value.status)) {
    pendingStatus.value = status
    confirmDialog.value = true
    return
  }
  await applyStatus(status)
}

async function applyStatus(status: IncidentStatus) {
  if (!incident.value)
    return
  try {
    await incidentStore.changeStatus(incident.value.id, {
      status,
      actorName: management.actorName.trim() || undefined,
    })
    notificationStore.showNotification('เปลี่ยน Status สำเร็จ')
  }
  catch {
    notificationStore.showNotification('ไม่สามารถเปลี่ยน Status ได้', 'error')
  }
  finally {
    confirmDialog.value = false
    pendingStatus.value = null
  }
}

async function addProgress() {
  if (!incident.value || !progress.description.trim())
    return
  try {
    await incidentStore.addProgress(incident.value.id, {
      description: progress.description,
      actorName: progress.actorName.trim() || undefined,
    })
    progress.description = ''
    progress.actorName = ''
    notificationStore.showNotification('บันทึกความคืบหน้าสำเร็จ')
  }
  catch {
    notificationStore.showNotification('ไม่สามารถบันทึกความคืบหน้าได้', 'error')
  }
}

async function resolveIncident(body: ResolveIncidentBody) {
  if (!incident.value)
    return
  try {
    await incidentStore.resolveIncident(incident.value.id, body)
    resolveDialog.value = false
    notificationStore.showNotification('ปิดเหตุสำเร็จ')
  }
  catch {
    notificationStore.showNotification('ไม่สามารถปิดเหตุได้', 'error')
  }
}

onMounted(load)
onBeforeRouteLeave(() => incidentStore.resetSelectedIncident())
</script>

<template>
  <div>
    <div v-if="isLoading && !incident" class="py-10">
      <VSkeletonLoader type="heading, paragraph, card, card" />
    </div>

    <VAlert v-else-if="error && !incident" type="error" variant="tonal">
      <div class="d-flex flex-wrap align-center justify-space-between gap-3">
        <span>ไม่สามารถโหลดรายละเอียด Incident ได้</span>
        <div class="d-flex gap-2">
          <VBtn variant="text" to="/">
            กลับ Dashboard
          </VBtn>
          <VBtn variant="outlined" @click="load">
            ลองใหม่
          </VBtn>
        </div>
      </div>
    </VAlert>

    <template v-else-if="incident">
      <div class="d-flex flex-wrap align-start justify-space-between gap-4 mb-6">
        <div>
          <VBtn variant="text" prepend-icon="ri-arrow-left-line" to="/" class="mb-2 px-0">
            กลับ Dashboard
          </VBtn>
          <div class="text-caption text-primary font-weight-medium">
            {{ incident.incidentCode }}
          </div>
          <h1 class="text-h4 font-weight-bold mt-1">
            {{ incident.title }}
          </h1>
          <div class="d-flex flex-wrap gap-2 mt-3">
            <IncidentStatusChip :status="incident.status" />
            <IncidentPriorityChip :priority="incident.confirmedPriority" />
            <span class="text-body-2 text-medium-emphasis align-self-center">
              แจ้งเมื่อ {{ formatThaiDateTime(incident.createdAt) }}
            </span>
          </div>
        </div>
      </div>

      <VRow>
        <VCol cols="12" lg="7">
          <VCard class="mb-5">
            <VCardTitle class="pa-5">
              ข้อมูลเหตุ
            </VCardTitle>
            <VDivider />
            <VCardText class="pa-5">
              <div class="detail-grid">
                <div>
                  <div class="detail-label">
                    ข้อความต้นฉบับ
                  </div>
                  <p>{{ incident.rawDescription }}</p>
                </div>
                <div>
                  <div class="detail-label">
                    AI Summary
                  </div>
                  <p>{{ incident.summary }}</p>
                </div>
                <div>
                  <div class="detail-label">
                    หมวด
                  </div>
                  <IncidentCategoryChip :category="incident.category" />
                </div>
                <div>
                  <div class="detail-label">
                    สถานที่
                  </div>
                  <p>{{ incident.location }}</p>
                </div>
                <div>
                  <div class="detail-label">
                    ชื่อผู้แจ้ง
                  </div>
                  <p>{{ incident.reporterName || 'ไม่ระบุ' }}</p>
                </div>
                <div>
                  <div class="detail-label">
                    Suggested Priority
                  </div>
                  <IncidentPriorityChip :priority="incident.suggestedPriority" />
                </div>
                <div>
                  <div class="detail-label">
                    เหตุผลของ Priority
                  </div>
                  <p>{{ incident.priorityReason }}</p>
                </div>
                <div>
                  <div class="detail-label">
                    แหล่งวิเคราะห์
                  </div>
                  <VChip
                    :color="incident.aiAnalysisSource === 'deepseek' ? 'primary' : 'warning'"
                    variant="tonal"
                    size="small"
                  >
                    {{ incident.aiAnalysisSource === 'deepseek' ? 'School SOS AI' : 'วิเคราะห์ด้วยระบบสำรอง' }}
                  </VChip>
                </div>
              </div>
              <div v-if="imageUrl" class="mt-5">
                <div class="detail-label mb-2">
                  ภาพแนบ
                </div>
                <VImg
                  :src="imageUrl"
                  max-height="420"
                  cover
                  class="rounded border"
                  :alt="`ภาพประกอบ ${incident.title}`"
                />
              </div>
            </VCardText>
          </VCard>

          <VCard v-if="incident.status === 'IN_PROGRESS'" class="mb-5">
            <VCardTitle class="pa-5">
              บันทึกความคืบหน้า
            </VCardTitle>
            <VDivider />
            <VCardText class="pa-5">
              <VTextarea
                v-model="progress.description"
                label="รายละเอียดความคืบหน้า *"
                rows="3"
                auto-grow
              />
              <VTextField v-model="progress.actorName" label="ชื่อผู้ดำเนินการ" />
              <div class="d-flex justify-end">
                <VBtn
                  color="primary"
                  :loading="isSubmitting"
                  :disabled="!progress.description.trim()"
                  @click="addProgress"
                >
                  บันทึกความคืบหน้า
                </VBtn>
              </div>
            </VCardText>
          </VCard>

          <VCard class="mb-5">
            <VCardTitle class="pa-5">
              Timeline
            </VCardTitle>
            <VDivider />
            <VCardText class="pa-5">
              <IncidentTimeline :events="timeline" />
            </VCardText>
          </VCard>

          <VCard v-if="incident.status === 'RESOLVED'">
            <VCardTitle class="pa-5">
              Closure Summary
            </VCardTitle>
            <VDivider />
            <VCardText class="pa-5">
              <VAlert type="success" variant="tonal" class="mb-5">
                เหตุได้รับการแก้ไขแล้วเมื่อ {{ formatThaiDateTime(incident.resolvedAt) }}
              </VAlert>
              <div class="detail-grid">
                <div>
                  <div class="detail-label">
                    สิ่งที่ดำเนินการ
                  </div>
                  <p>{{ incident.actionTaken }}</p>
                </div>
                <div>
                  <div class="detail-label">
                    ผลลัพธ์
                  </div>
                  <p>{{ incident.resolutionResult }}</p>
                </div>
                <div v-if="incident.resolutionNote">
                  <div class="detail-label">
                    หมายเหตุ
                  </div>
                  <p>{{ incident.resolutionNote }}</p>
                </div>
                <div>
                  <div class="detail-label">
                    แหล่งรายงาน
                  </div>
                  <p>{{ incident.aiClosureSource === 'deepseek' ? 'School SOS AI' : 'ระบบสำรอง' }}</p>
                </div>
              </div>
              <VDivider class="my-5" />
              <div class="detail-label">
                รายงานสรุป
              </div>
              <p class="text-body-1 closure-text">
                {{ incident.closureSummary }}
              </p>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" lg="5">
          <VCard class="mb-5">
            <VCardTitle class="pa-5">
              การจัดการเหตุ
            </VCardTitle>
            <VDivider />
            <VCardText class="pa-5">
              <VTextField v-model="management.assigneeName" label="ชื่อผู้รับผิดชอบ *" />
              <VSelect
                v-model="management.confirmedPriority"
                :items="priorityOptions"
                label="Priority ที่ยืนยัน *"
              />
              <VTextField v-model="management.actorName" label="ชื่อผู้ดำเนินการ (ไม่บังคับ)" />
              <VBtn
                color="primary"
                block
                :loading="isSubmitting"
                :disabled="!management.assigneeName.trim()"
                @click="saveManagement"
              >
                บันทึกผู้รับผิดชอบและ Priority
              </VBtn>
            </VCardText>
          </VCard>

          <VCard>
            <VCardTitle class="pa-5">
              Status Workflow
            </VCardTitle>
            <VDivider />
            <VCardText class="pa-5">
              <div class="status-track mb-6">
                <div
                  v-for="status in INCIDENT_STATUSES"
                  :key="status"
                  class="status-step"
                  :class="{ active: statusIndex(status) <= statusIndex(incident.status) }"
                >
                  <VIcon
                    :icon="statusIndex(status) <= statusIndex(incident.status) ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'"
                  />
                  <span>{{ statusLabels[status] }}</span>
                </div>
              </div>

              <VBtn
                v-if="incident.status === 'NEW'"
                color="primary"
                block
                :disabled="!incident.assigneeName"
                :loading="isSubmitting"
                @click="requestStatus('ACKNOWLEDGED')"
              >
                รับเรื่อง
              </VBtn>

              <div v-else-if="incident.status === 'ACKNOWLEDGED'" class="d-grid gap-3">
                <VBtn color="primary" :loading="isSubmitting" @click="requestStatus('IN_PROGRESS')">
                  เริ่มดำเนินการ
                </VBtn>
                <VBtn variant="outlined" @click="requestStatus('NEW')">
                  ย้อนกลับเป็นเหตุใหม่
                </VBtn>
              </div>

              <div v-else-if="incident.status === 'IN_PROGRESS'" class="d-grid gap-3">
                <VBtn color="success" @click="resolveDialog = true">
                  ปิดเหตุ
                </VBtn>
                <VBtn variant="outlined" @click="requestStatus('ACKNOWLEDGED')">
                  ย้อนกลับเป็นรับเรื่องแล้ว
                </VBtn>
              </div>

              <VAlert v-else type="success" variant="tonal">
                เหตุได้รับการแก้ไขและปิดแล้ว
              </VAlert>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </template>

    <IncidentResolveDialog
      v-model="resolveDialog"
      :loading="isSubmitting"
      @submit="resolveIncident"
    />

    <VDialog v-model="confirmDialog" max-width="480">
      <VCard>
        <VCardTitle class="pa-5">
          ยืนยันการย้อนสถานะ
        </VCardTitle>
        <VCardText>
          ต้องการย้อนสถานะเป็น {{ pendingStatus ? statusLabels[pendingStatus] : '' }} ใช่หรือไม่?
          ระบบจะบันทึกการเปลี่ยนแปลงนี้ใน Timeline
        </VCardText>
        <VCardActions class="justify-end pa-5 pt-0">
          <VBtn variant="text" @click="confirmDialog = false">
            ยกเลิก
          </VBtn>
          <VBtn
            color="warning"
            :loading="isSubmitting"
            @click="pendingStatus && applyStatus(pendingStatus)"
          >
            ยืนยัน
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.detail-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-label {
  color: rgb(var(--v-theme-on-surface), 0.65);
  font-size: 0.8125rem;
  margin-block-end: 4px;
}

.closure-text {
  line-height: 1.8;
  white-space: pre-line;
}

.status-track {
  display: grid;
  gap: 12px;
}

.status-step {
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-on-surface), 0.45);
  gap: 10px;
}

.status-step.active {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.d-grid {
  display: grid;
}

@media (max-width: 600px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
