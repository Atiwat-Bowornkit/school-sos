import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { incidentApi } from '@/apis/incident-api'
import type { Incident, IncidentCategory, IncidentPriority } from '@/models'

interface ReportForm {
  description: string
  title: string
  summary: string
  category: IncidentCategory | ''
  location: string
  reporterName: string
  confirmedPriority: IncidentPriority
  priorityReason: string
}

function defaults(): ReportForm {
  return {
    description: '',
    title: '',
    summary: '',
    category: '',
    location: '',
    reporterName: '',
    confirmedPriority: 'UNASSIGNED',
    priorityReason: '',
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่'
}

export const useReportStore = defineStore('ReportStore', () => {
  const form = reactive<ReportForm>(defaults())
  const imagePreview = ref<string | null>(null)
  const imageDataUrl = ref<string | null>(null)
  const imageName = ref<string | null>(null)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)
  const createdIncident = ref<Incident | null>(null)

  async function submit() {
    if (!form.category) throw new Error('กรุณาเลือกหมวดเหตุ')
    isSubmitting.value = true
    error.value = null
    try {
      const response = await incidentApi.create({
        rawDescription: form.description,
        title: form.title,
        summary: form.summary,
        category: form.category,
        location: form.location,
        reporterName: form.reporterName.trim() || undefined,
        confirmedPriority: form.confirmedPriority,
        priorityReason: form.priorityReason,
        imageDataUrl: imageDataUrl.value ?? undefined,
      })
      createdIncident.value = response.data.incident
      return response.data.incident
    } catch (caught) {
      error.value = message(caught)
      throw caught
    } finally {
      isSubmitting.value = false
    }
  }

  function setImage(name: string, dataUrl: string) {
    imageName.value = name
    imagePreview.value = dataUrl
    imageDataUrl.value = dataUrl
  }

  function removeImage() {
    imageName.value = null
    imagePreview.value = null
    imageDataUrl.value = null
  }

  function reset() {
    Object.assign(form, defaults())
    removeImage()
    isSubmitting.value = false
    error.value = null
    createdIncident.value = null
  }

  return {
    form,
    imagePreview,
    imageName,
    isSubmitting,
    error,
    createdIncident,
    submit,
    setImage,
    removeImage,
    reset,
  }
})
