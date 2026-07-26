<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { INCIDENT_CATEGORIES, INCIDENT_PRIORITIES } from '@/models'
import { useSEO } from '@/composables/useSEO'
import { useNotificationStore } from '@/stores/use-notification-store'
import { useReportStore } from '@/stores/use-report-store'
import { categoryLabels, priorityLabels } from '@/utils/incident-labels'
import { resizeIncidentImage } from '@/utils/image-resize'
import { validateReportBase } from '@/utils/report-validation'

useSEO({
  title: 'แจ้งเหตุใหม่',
  description: 'แจ้งเหตุภายในโรงเรียน',
  keywords: ['School SOS', 'แจ้งเหตุ'],
})

const reportStore = useReportStore()
onMounted(() => reportStore.reset())
const notificationStore = useNotificationStore()
const {
  form,
  imagePreview,
  imageName,
  isSubmitting,
  error,
  createdIncident,
} = storeToRefs(reportStore)

const fieldErrors = reactive<Record<string, string>>({})
const categoryOptions = INCIDENT_CATEGORIES.map(value => ({ title: categoryLabels[value], value }))
const priorityOptions = INCIDENT_PRIORITIES.map(value => ({ title: priorityLabels[value], value }))

function validate(): boolean {
  Object.keys(fieldErrors).forEach(key => delete fieldErrors[key])
  Object.assign(fieldErrors, validateReportBase({
    description: form.value.description,
    category: form.value.category,
    location: form.value.location,
  }))
  if (!form.value.title.trim()) fieldErrors.title = 'กรุณาระบุชื่อ Incident'
  else delete fieldErrors.title
  if (!form.value.summary.trim()) fieldErrors.summary = 'กรุณาระบุ Summary'
  else delete fieldErrors.summary
  if (!form.value.priorityReason.trim()) fieldErrors.priorityReason = 'กรุณาระบุเหตุผลของ Priority'
  else delete fieldErrors.priorityReason
  return Object.keys(fieldErrors).length === 0
}

async function onFileSelected(value: File | File[] | null) {
  const file = Array.isArray(value) ? value[0] : value
  if (!file) return
  delete fieldErrors.image
  try {
    const dataUrl = await resizeIncidentImage(file)
    reportStore.setImage(file.name, dataUrl)
  } catch (caught) {
    fieldErrors.image = caught instanceof Error ? caught.message : 'ไม่สามารถอ่านรูปภาพได้'
    reportStore.removeImage()
  }
}

async function submit() {
  if (!validate()) return
  try {
    await reportStore.submit()
    notificationStore.showNotification('สร้าง Incident สำเร็จ')
  } catch {
    notificationStore.showNotification('ไม่สามารถสร้าง Incident ได้', 'error')
  }
}
</script>

<template>
  <div class="report-page mx-auto">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">แจ้งเหตุใหม่</h1>
      <p class="text-body-1 text-medium-emphasis mt-1">กรอกข้อมูลเหตุการณ์และส่งตรงโดยไม่ผ่าน AI</p>
    </div>

    <VCard v-if="createdIncident" class="success-card">
      <VCardText class="text-center pa-8">
        <VAvatar color="success" variant="tonal" size="72" class="mb-4">
          <VIcon icon="ri-checkbox-circle-line" size="40" />
        </VAvatar>
        <h2 class="text-h5 font-weight-bold">สร้าง Incident สำเร็จ</h2>
        <p class="text-medium-emphasis mt-2">รหัสสำหรับติดตามเหตุ</p>
        <div class="text-h4 text-primary font-weight-bold my-4">{{ createdIncident.incidentCode }}</div>
        <div class="d-flex flex-wrap justify-center gap-3">
          <VBtn color="primary" :to="`/incidents/${createdIncident.id}`">เปิดรายละเอียด Incident</VBtn>
          <VBtn variant="outlined" to="/">กลับ Dashboard</VBtn>
          <VBtn variant="tonal" @click="reportStore.reset()">แจ้งเหตุอีก</VBtn>
        </div>
      </VCardText>
    </VCard>

    <VCard v-else>
      <VCardText class="pa-5">
        <VAlert v-if="error" type="error" variant="tonal" closable class="mb-4">{{ error }}</VAlert>

        <VTextarea
          v-model="form.description"
          label="รายละเอียดเหตุการณ์ *"
          placeholder="เช่น มีน้ำรั่วตรงบันไดและยังมีนักเรียนเดินผ่าน"
          :error-messages="fieldErrors.description"
          counter
          auto-grow
          rows="4"
        />
        <VTextField
          v-model="form.title"
          label="ชื่อ Incident *"
          placeholder="น้ำรั่วบริเวณบันไดอาคารเรียน 1"
          :error-messages="fieldErrors.title"
        />
        <VTextarea
          v-model="form.summary"
          label="Summary *"
          placeholder="สรุปเหตุการณ์สั้นๆ"
          :error-messages="fieldErrors.summary"
          rows="3"
          auto-grow
        />
        <VSelect v-model="form.category" :items="categoryOptions" label="หมวดเหตุ *" :error-messages="fieldErrors.category" />
        <VTextField v-model="form.location" label="สถานที่ *" placeholder="ระบุอาคาร ชั้น ห้อง หรือจุดสังเกต" :error-messages="fieldErrors.location" counter />
        <VTextField v-model="form.reporterName" label="ชื่อผู้แจ้ง (ไม่บังคับ)" />
        <VSelect v-model="form.confirmedPriority" :items="priorityOptions" label="ความสำคัญ *" />
        <VTextarea v-model="form.priorityReason" label="เหตุผลของความสำคัญ *" :error-messages="fieldErrors.priorityReason" rows="2" auto-grow />

        <VFileInput
          label="ภาพประกอบ (ไม่บังคับ, 1 ภาพ)"
          accept="image/jpeg,image/png,image/webp"
          prepend-icon="ri-image-add-line"
          :error-messages="fieldErrors.image"
          show-size
          @update:model-value="onFileSelected"
        />
        <div v-if="imagePreview" class="image-preview pa-3 mt-2">
          <VImg :src="imagePreview" max-height="320" cover :alt="`ภาพแนบ ${imageName}`" />
          <div class="d-flex align-center justify-space-between mt-2">
            <span class="text-caption text-medium-emphasis">{{ imageName }}</span>
            <VBtn color="error" variant="text" size="small" prepend-icon="ri-delete-bin-line" @click="reportStore.removeImage">ลบภาพ</VBtn>
          </div>
        </div>
      </VCardText>
      <VCardActions class="justify-end pa-5 pt-0">
        <VBtn color="primary" size="large" :loading="isSubmitting" @click="submit">
          สร้าง Incident
        </VBtn>
      </VCardActions>
    </VCard>
  </div>
</template>

<style scoped>
.report-page { max-inline-size: 900px; }
.image-preview {
  border: 1px solid rgb(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
}
</style>
