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

const MAX_IMAGES = 5

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
  isSubmitting,
  error,
  createdIncident,
} = storeToRefs(reportStore)

const images = ref<Array<{ name: string; dataUrl: string }>>([])
const imageError = ref('')

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

async function onFilesSelected(value: File | File[] | null) {
  imageError.value = ''
  const files = value ? (Array.isArray(value) ? value : [value]) : []
  const totalAfterAdd = images.value.length + files.length
  if (totalAfterAdd > MAX_IMAGES) {
    imageError.value = `สามารถแนบรูปได้สูงสุด ${MAX_IMAGES} รูป (ปัจจุบันมี ${images.value.length} รูป)`
    return
  }
  for (const file of files) {
    try {
      const dataUrl = await resizeIncidentImage(file)
      images.value.push({ name: file.name, dataUrl })
    }
    catch (caught) {
      imageError.value = caught instanceof Error ? caught.message : 'ไม่สามารถอ่านรูปภาพได้'
    }
  }
}

function removeImage(index: number) {
  images.value.splice(index, 1)
  imageError.value = ''
}

async function submit() {
  if (!validate()) return
  try {
    reportStore.form.imagesDataUrl = images.value.map(img => img.dataUrl)
    await reportStore.submit()
    notificationStore.showNotification('สร้าง Incident สำเร็จ')
  }
  catch {
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
          label="ภาพประกอบ (ไม่บังคับ, สูงสุด 5 รูป)"
          accept="image/jpeg,image/png,image/webp"
          prepend-icon="ri-image-add-line"
          :error-messages="imageError"
          multiple
          show-size
          :disabled="images.length >= MAX_IMAGES"
          @update:model-value="onFilesSelected"
        />
        <div class="text-caption text-medium-emphasis mt-1 mb-3">
          แนบแล้ว {{ images.length }} / {{ MAX_IMAGES }} รูป
        </div>

        <div v-if="images.length > 0" class="image-grid mt-2">
          <div
            v-for="(img, index) in images"
            :key="index"
            class="image-card"
          >
            <VImg
              :src="img.dataUrl"
              max-height="180"
              cover
              class="rounded border"
              :alt="`รูปที่ ${index + 1}: ${img.name}`"
            />
            <div class="image-card-overlay">
              <VBtn
                icon="ri-delete-bin-line"
                size="small"
                color="error"
                variant="flat"
                @click="removeImage(index)"
                aria-label="ลบรูป {{ index + 1 }}"
              />
            </div>
            <div class="text-caption text-medium-emphasis text-truncate mt-1">
              {{ img.name }}
            </div>
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

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.image-card {
  position: relative;
  border: 1px solid rgb(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 8px;
}

.image-card-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-card:hover .image-card-overlay {
  opacity: 1;
}
</style>
