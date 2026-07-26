<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'
import type { Incident } from '@/models'
import { INCIDENT_CATEGORIES, INCIDENT_PRIORITIES, INCIDENT_STATUSES } from '@/models'
import { useSEO } from '@/composables/useSEO'
import { useIncidentStore } from '@/stores/use-incident-store'
import {
  categoryLabels,
  priorityLabels,
  statusLabels,
} from '@/utils/incident-labels'
import { formatThaiDateTime } from '@/utils/date-format'

useSEO({
  title: 'ภาพรวมเหตุการณ์',
  description: 'ภาพรวมและสถานะการแก้ไขเหตุภายในโรงเรียน',
  keywords: ['School SOS', 'แจ้งเหตุ', 'โรงเรียน'],
})

const router = useRouter()
const incidentStore = useIncidentStore()
const {
  incidents,
  visibleIncidents,
  newIncidentCount,
  filters,
  isLoading,
  error,
} = storeToRefs(incidentStore)
const { smAndDown } = useDisplay()

const headers = [
  { title: 'Incident ID', key: 'incidentCode', sortable: false },
  { title: 'เหตุการณ์', key: 'title', sortable: false },
  { title: 'หมวด', key: 'category', sortable: false },
  { title: 'สถานที่', key: 'location', sortable: false },
  { title: 'Priority', key: 'confirmedPriority', sortable: false },
  { title: 'สถานะ', key: 'status', sortable: false },
  { title: 'ผู้รับผิดชอบ', key: 'assigneeName', sortable: false },
  { title: 'เวลาที่แจ้ง', key: 'createdAt', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const statusOptions = INCIDENT_STATUSES.map(value => ({ title: statusLabels[value], value }))
const priorityOptions = INCIDENT_PRIORITIES.map(value => ({ title: priorityLabels[value], value }))
const categoryOptions = INCIDENT_CATEGORIES.map(value => ({ title: categoryLabels[value], value }))

const summary = computed(() => ({
  all: incidents.value.length,
  new: incidents.value.filter(item => item.status === 'NEW').length,
  inProgress: incidents.value.filter(item => item.status === 'IN_PROGRESS').length,
  resolved: incidents.value.filter(item => item.status === 'RESOLVED').length,
}))

function openIncident(incident: Incident) {
  router.push(`/incidents/${incident.id}`)
}

onMounted(() => incidentStore.fetchIncidents())
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
      <div>
        <div class="d-flex align-center gap-2">
          <h1 class="text-h4 font-weight-bold">
            ภาพรวมเหตุการณ์
          </h1>
          <VBadge
            v-if="newIncidentCount > 0"
            :content="newIncidentCount"
            color="primary"
            inline
            aria-label="จำนวนเหตุใหม่"
          />
        </div>
        <p class="text-body-1 text-medium-emphasis mt-1 mb-0">
          ติดตามการรับเรื่อง การดำเนินการ และการปิดเหตุภายในโรงเรียน
        </p>
      </div>
      <VBtn color="primary" prepend-icon="ri-alarm-warning-line" to="/report" size="large">
        แจ้งเหตุใหม่
      </VBtn>
    </div>

    <VRow class="mb-2">
      <VCol cols="6" md="3">
        <VCard>
          <VCardText>
            <div class="text-body-2 text-medium-emphasis">
              เหตุทั้งหมด
            </div>
            <div class="text-h4 font-weight-bold mt-1">
              {{ summary.all }}
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" md="3">
        <VCard>
          <VCardText>
            <div class="text-body-2 text-medium-emphasis">
              เหตุใหม่
            </div>
            <div class="text-h4 font-weight-bold text-primary mt-1">
              {{ summary.new }}
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" md="3">
        <VCard>
          <VCardText>
            <div class="text-body-2 text-medium-emphasis">
              กำลังดำเนินการ
            </div>
            <div class="text-h4 font-weight-bold text-warning mt-1">
              {{ summary.inProgress }}
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" md="3">
        <VCard>
          <VCardText>
            <div class="text-body-2 text-medium-emphasis">
              แก้ไขแล้ว
            </div>
            <div class="text-h4 font-weight-bold text-success mt-1">
              {{ summary.resolved }}
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VCard class="mt-4">
      <VCardTitle class="d-flex flex-wrap align-center justify-space-between gap-3 pa-5">
        <span>รายการ Incident</span>
        <div class="d-flex flex-wrap gap-2 filter-controls">
          <VTextField
            v-model="filters.search"
            label="ค้นหา"
            placeholder="รหัส / ชื่อเหตุ"
            prepend-inner-icon="ri-search-line"
            clearable
            hide-details
            density="compact"
            min-width="200"
          />
          <VSelect
            v-model="filters.status"
            :items="statusOptions"
            label="สถานะ"
            clearable
            hide-details
            density="compact"
            min-width="170"
          />
          <VSelect
            v-model="filters.priority"
            :items="priorityOptions"
            label="Priority"
            clearable
            hide-details
            density="compact"
            min-width="170"
          />
          <VSelect
            v-model="filters.category"
            :items="categoryOptions"
            label="หมวด"
            clearable
            hide-details
            density="compact"
            min-width="200"
          />
          <VBtn variant="text" prepend-icon="ri-filter-off-line" @click="incidentStore.clearFilters">
            ล้างตัวกรอง
          </VBtn>
        </div>
      </VCardTitle>
      <VDivider />

      <VAlert v-if="error" type="error" variant="tonal" class="ma-5">
        <div class="d-flex flex-wrap align-center justify-space-between gap-3">
          <span>ไม่สามารถโหลดรายการเหตุได้ กรุณาลองใหม่</span>
          <VBtn size="small" variant="outlined" @click="incidentStore.fetchIncidents">
            ลองใหม่
          </VBtn>
        </div>
      </VAlert>

      <div v-if="isLoading" class="pa-5">
        <VSkeletonLoader type="table-row-divider@5" />
      </div>

      <template v-else-if="!error">
        <div v-if="visibleIncidents.length === 0" class="text-center pa-10">
          <VIcon icon="ri-inbox-2-line" size="56" color="primary" class="mb-3" />
          <h2 class="text-h6">
            ยังไม่มี Incident ในระบบ
          </h2>
          <p class="text-medium-emphasis mt-1">
            เริ่มต้นโดยแจ้งเหตุใหม่
          </p>
          <VBtn color="primary" to="/report" class="mt-3">
            แจ้งเหตุใหม่
          </VBtn>
        </div>

        <VDataTable
          v-else-if="!smAndDown"
          :headers="headers"
          :items="visibleIncidents"
          item-value="id"
          hide-default-footer
          :items-per-page="-1"
        >
          <template #[`item.title`]="{ item }">
            <div class="py-2" style="max-inline-size: 260px">
              <div class="d-flex align-center gap-2">
                <span class="font-weight-medium">{{ item.title }}</span>
                <VIcon
                  v-if="item.imageCount > 0"
                  icon="ri-image-line"
                  size="16"
                  color="medium-emphasis"
                  :title="`${item.imageCount} รูป`"
                />
              </div>
              <div class="text-caption text-medium-emphasis text-truncate">
                {{ item.summary }}
              </div>
            </div>
          </template>
          <template #[`item.category`]="{ item }">
            {{ categoryLabels[item.category] }}
          </template>
          <template #[`item.confirmedPriority`]="{ item }">
            <IncidentPriorityChip :priority="item.confirmedPriority" />
          </template>
          <template #[`item.status`]="{ item }">
            <IncidentStatusChip :status="item.status" />
          </template>
          <template #[`item.assigneeName`]="{ item }">
            {{ item.assigneeName || 'ยังไม่ระบุ' }}
          </template>
          <template #[`item.createdAt`]="{ item }">
            {{ formatThaiDateTime(item.createdAt) }}
          </template>
          <template #[`item.actions`]="{ item }">
            <VBtn
              icon="ri-arrow-right-line"
              variant="text"
              aria-label="เปิดรายละเอียด Incident"
              @click="openIncident(item)"
            />
          </template>
        </VDataTable>

        <div v-else class="pa-4">
          <VCard
            v-for="incident in visibleIncidents"
            :key="incident.id"
            variant="outlined"
            class="mb-3"
            tabindex="0"
            role="link"
            @click="openIncident(incident)"
            @keydown.enter="openIncident(incident)"
          >
            <VCardText>
              <div class="d-flex justify-space-between gap-3">
                <div>
                  <div class="text-caption text-primary font-weight-medium">
                    {{ incident.incidentCode }}
                  </div>
                  <div class="font-weight-bold mt-1">
                    {{ incident.title }}
                  </div>
                </div>
                <VIcon icon="ri-arrow-right-s-line" />
              </div>
              <div class="text-body-2 text-medium-emphasis mt-2">
                {{ incident.location }}
              </div>
              <div class="d-flex flex-wrap gap-2 mt-3">
                <IncidentPriorityChip :priority="incident.confirmedPriority" />
                <IncidentStatusChip :status="incident.status" />
                <VChip
                  v-if="incident.imageCount > 0"
                  size="small"
                  variant="tonal"
                  prepend-icon="ri-image-line"
                >
                  {{ incident.imageCount }}
                </VChip>
              </div>
              <div class="text-caption text-medium-emphasis mt-3">
                {{ incident.assigneeName || 'ยังไม่ระบุผู้รับผิดชอบ' }} · {{ formatThaiDateTime(incident.createdAt) }}
              </div>
            </VCardText>
          </VCard>
        </div>
      </template>
    </VCard>
  </div>
</template>

<style scoped>
.filter-controls {
  inline-size: min(100%, 590px);
}

@media (max-width: 600px) {
  .filter-controls,
  .filter-controls > * {
    inline-size: 100%;
  }
}
</style>
