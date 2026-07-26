<script setup lang="ts">
import { reactive } from 'vue'
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
  description: 'แจ้งเหตุภายในโรงเรียนและตรวจสอบข้อมูลด้วย AI',
  keywords: ['School SOS', 'แจ้งเหตุ'],
})

const reportStore = useReportStore()
const notificationStore = useNotificationStore()
const {
  form,
  imagePreview,
  imageName,
  aiSource,
  followUpQuestion,
  followUpAnswer,
  currentStep,
  isAnalyzing,
  isSubmitting,
  error,
  createdIncident,
} = storeToRefs(reportStore)

const fieldErrors = reactive<Record<string, string>>({})
const categoryOptions = INCIDENT_CATEGORIES.map(value => ({ title: categoryLabels[value], value }))
const priorityOptions = INCIDENT_PRIORITIES.map(value => ({ title: priorityLabels[value], value }))

function validateBase(): boolean {
  Object.keys(fieldErrors).forEach(key => delete fieldErrors[key])
  Object.assign(fieldErrors, validateReportBase({
    description: form.value.description,
    category: form.value.category,
    location: form.value.location,
  }))
  return Object.keys(fieldErrors).length === 0
}

async function analyze() {
  if (!validateBase())
    return
  currentStep.value = 2
  try {
    const result = await reportStore.analyze()
    if (result.source === 'fallback') {
      notificationStore.showNotification(
        'ระบบ AI ไม่พร้อมใช้งาน แต่สามารถตรวจสอบและกรอกข้อมูลด้วยตนเองได้',
        'warning',
      )
    }
  }
  catch {
    notificationStore.showNotification('ไม่สามารถวิเคราะห์ข้อมูลได้ กรุณาลองใหม่', 'error')
  }
}

async function answerFollowUp() {
  if (!followUpAnswer.value.trim()) {
    fieldErrors.followUpAnswer = 'กรุณาตอบคำถามก่อนวิเคราะห์อีกครั้ง'
    return
  }
  delete fieldErrors.followUpAnswer
  await analyze()
}

async function onFileSelected(value: File | File[] | null) {
  const file = Array.isArray(value) ? value[0] : value
  if (!file)
    return
  delete fieldErrors.image
  try {
    const dataUrl = await resizeIncidentImage(file)
    reportStore.setImage(file.name, dataUrl)
  }
  catch (caught) {
    fieldErrors.image = caught instanceof Error ? caught.message : 'ไม่สามารถอ่านรูปภาพได้'
    reportStore.removeImage()
  }
}

function reviewIsValid(): boolean {
  const checks: Array<[string, string, string]> = [
    ['title', form.value.title, 'กรุณาระบุชื่อ Incident'],
    ['summary', form.value.summary, 'กรุณาระบุ Summary'],
    ['priorityReason', form.value.priorityReason, 'กรุณาระบุเหตุผลของ Priority'],
  ]
  checks.forEach(([key, value, message]) => {
    if (!value.trim())
      fieldErrors[key] = message
    else delete fieldErrors[key]
  })
  return checks.every(([key]) => !fieldErrors[key])
}

async function submit() {
  if (!reviewIsValid())
    return
  try {
    await reportStore.submit()
    notificationStore.showNotification('สร้าง Incident สำเร็จ')
  }
  catch {
    notificationStore.showNotification('ไม่สามารถสร้าง Incident ได้', 'error')
  }
}

onBeforeRouteLeave(() => reportStore.reset())
</script>

<template>
  <div class="report-page mx-auto">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">
        แจ้งเหตุใหม่
      </h1>
      <p class="text-body-1 text-medium-emphasis mt-1">
        กรอกข้อมูลที่พบ ระบบจะช่วยตรวจความครบถ้วนและเสนอ Priority ก่อนส่ง
      </p>
    </div>

    <VCard v-if="createdIncident" class="success-card">
      <VCardText class="text-center pa-8">
        <VAvatar color="success" variant="tonal" size="72" class="mb-4">
          <VIcon icon="ri-checkbox-circle-line" size="40" />
        </VAvatar>
        <h2 class="text-h5 font-weight-bold">
          สร้าง Incident สำเร็จ
        </h2>
        <p class="text-medium-emphasis mt-2">
          รหัสสำหรับติดตามเหตุ
        </p>
        <div class="text-h4 text-primary font-weight-bold my-4">
          {{ createdIncident.incidentCode }}
        </div>
        <div class="d-flex flex-wrap justify-center gap-3">
          <VBtn color="primary" :to="`/incidents/${createdIncident.id}`">
            เปิดรายละเอียด Incident
          </VBtn>
          <VBtn variant="outlined" to="/">
            กลับ Dashboard
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <template v-else>
      <VCard class="mb-5">
        <VCardText class="pa-5">
          <div class="d-flex align-center step-track">
            <template v-for="step in 3" :key="step">
              <VAvatar
                :color="currentStep >= step ? 'primary' : 'secondary'"
                :variant="currentStep >= step ? 'flat' : 'tonal'"
                size="34"
              >
                {{ step }}
              </VAvatar>
              <div v-if="step < 3" class="step-line" :class="{ active: currentStep > step }" />
            </template>
          </div>
          <div class="d-flex justify-space-between text-caption mt-2">
            <span>ข้อมูลเหตุการณ์</span>
            <span>AI ตรวจข้อมูล</span>
            <span>ตรวจสอบก่อนส่ง</span>
          </div>
        </VCardText>
      </VCard>

      <VAlert v-if="error" type="error" variant="tonal" closable class="mb-4">
        {{ error }}
      </VAlert>

      <VCard v-if="currentStep === 1">
        <VCardTitle class="pa-5">
          ข้อมูลเหตุการณ์
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-5">
          <VTextarea
            v-model="form.description"
            label="รายละเอียดเหตุการณ์ *"
            placeholder="เช่น มีน้ำรั่วตรงบันไดและยังมีนักเรียนเดินผ่าน"
            :error-messages="fieldErrors.description"
            counter
            auto-grow
            rows="4"
          />
          <VSelect
            v-model="form.category"
            :items="categoryOptions"
            label="หมวดเหตุ *"
            :error-messages="fieldErrors.category"
          />
          <VTextField
            v-model="form.location"
            label="สถานที่ *"
            placeholder="ระบุอาคาร ชั้น ห้อง หรือจุดสังเกต"
            :error-messages="fieldErrors.location"
            counter
          />
          <VTextField v-model="form.reporterName" label="ชื่อผู้แจ้ง (ไม่บังคับ)" />
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
              <VBtn
                color="error"
                variant="text"
                size="small"
                prepend-icon="ri-delete-bin-line"
                @click="reportStore.removeImage"
              >
                ลบภาพ
              </VBtn>
            </div>
          </div>
        </VCardText>
        <VCardActions class="justify-end pa-5 pt-0">
          <VBtn color="primary" size="large" :loading="isAnalyzing" @click="analyze">
            ตรวจสอบข้อมูลด้วย AI
          </VBtn>
        </VCardActions>
      </VCard>

      <VCard v-else-if="currentStep === 2">
        <VCardTitle class="pa-5">
          AI ตรวจข้อมูล
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-5">
          <div v-if="isAnalyzing" class="text-center py-10">
            <VProgressCircular indeterminate color="primary" size="48" />
            <p class="mt-4 text-medium-emphasis">
              กำลังตรวจสอบข้อมูลเหตุการณ์...
            </p>
          </div>
          <template v-else-if="followUpQuestion">
            <VAlert type="info" variant="tonal" class="mb-5">
              AI ต้องการข้อมูลเพิ่มเพียงหนึ่งข้อ
            </VAlert>
            <p class="text-h6 mb-4">
              {{ followUpQuestion }}
            </p>
            <VTextarea
              v-model="followUpAnswer"
              label="คำตอบเพิ่มเติม *"
              :error-messages="fieldErrors.followUpAnswer"
              auto-grow
              rows="3"
            />
          </template>
        </VCardText>
        <VCardActions class="justify-space-between pa-5 pt-0">
          <VBtn variant="text" @click="currentStep = 1">
            ย้อนกลับ
          </VBtn>
          <VBtn
            v-if="followUpQuestion"
            color="primary"
            :loading="isAnalyzing"
            @click="answerFollowUp"
          >
            ส่งคำตอบและวิเคราะห์อีกครั้ง
          </VBtn>
        </VCardActions>
      </VCard>

      <VCard v-else>
        <VCardTitle class="pa-5">
          ตรวจสอบก่อนส่ง
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-5">
          <VAlert type="info" variant="tonal" class="mb-5">
            AI เป็นเพียงผู้เสนอแนะ กรุณาตรวจสอบข้อมูลก่อนสร้าง Incident
          </VAlert>
          <VAlert v-if="aiSource === 'fallback'" type="warning" variant="tonal" class="mb-5">
            ระบบ AI ไม่พร้อมใช้งาน กรุณาตรวจสอบและกรอกข้อมูลด้วยตนเอง
          </VAlert>
          <VTextField
            v-model="form.title"
            label="ชื่อ Incident *"
            :error-messages="fieldErrors.title"
          />
          <VTextarea
            v-model="form.summary"
            label="Summary *"
            :error-messages="fieldErrors.summary"
            rows="4"
            auto-grow
          />
          <VSelect
            v-model="form.category"
            :items="categoryOptions"
            label="หมวดเหตุ *"
          />
          <VTextField
            :model-value="priorityLabels[form.suggestedPriority]"
            label="Suggested Priority"
            readonly
          />
          <VSelect
            v-model="form.confirmedPriority"
            :items="priorityOptions"
            label="Priority ที่ยืนยัน *"
          />
          <VTextarea
            v-model="form.priorityReason"
            label="เหตุผลของ Priority *"
            :error-messages="fieldErrors.priorityReason"
            rows="2"
            auto-grow
          />
          <VTextField v-model="form.location" label="สถานที่ *" />
          <VTextField v-model="form.reporterName" label="ชื่อผู้แจ้ง" />
          <VImg
            v-if="imagePreview"
            :src="imagePreview"
            max-height="320"
            cover
            class="rounded"
            alt="ภาพประกอบ Incident ที่กำลังสร้าง"
          />
        </VCardText>
        <VCardActions class="justify-space-between pa-5 pt-0">
          <VBtn variant="text" @click="currentStep = 1">
            ย้อนกลับ
          </VBtn>
          <VBtn color="primary" size="large" :loading="isSubmitting" @click="submit">
            สร้าง Incident
          </VBtn>
        </VCardActions>
      </VCard>
    </template>
  </div>
</template>

<style scoped>
.report-page {
  max-inline-size: 900px;
}

.step-track {
  padding-inline: 12px;
}

.step-line {
  block-size: 3px;
  flex: 1;
  background: rgb(var(--v-theme-on-surface), 0.12);
}

.step-line.active {
  background: rgb(var(--v-theme-primary));
}

.image-preview {
  border: 1px solid rgb(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
}
</style>
