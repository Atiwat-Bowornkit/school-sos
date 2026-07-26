import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { aiApi } from '@/apis/ai-api'
import { incidentApi } from '@/apis/incident-api'
import type {
  AiSource,
  Incident,
  IncidentAnalysisResult,
  IncidentCategory,
  IncidentPriority,
} from '@/models'

interface ReportForm {
  description: string
  category: IncidentCategory | ''
  location: string
  reporterName: string
  title: string
  summary: string
  suggestedCategory: IncidentCategory | ''
  suggestedPriority: IncidentPriority
  confirmedPriority: IncidentPriority
  priorityReason: string
}

function defaults(): ReportForm {
  return {
    description: '',
    category: '',
    location: '',
    reporterName: '',
    title: '',
    summary: '',
    suggestedCategory: '',
    suggestedPriority: 'UNASSIGNED',
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
  const aiResult = ref<IncidentAnalysisResult | null>(null)
  const aiSource = ref<AiSource>('fallback')
  const followUpQuestion = ref<string | null>(null)
  const askedFollowUpQuestion = ref<string | null>(null)
  const followUpAnswer = ref('')
  const followUpAlreadyAsked = ref(false)
  const currentStep = ref(1)
  const isAnalyzing = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)
  const createdIncident = ref<Incident | null>(null)

  async function analyze() {
    if (!form.category)
      throw new Error('กรุณาเลือกหมวดเหตุ')
    isAnalyzing.value = true
    error.value = null
    try {
      const response = await aiApi.analyzeIncident({
        description: form.description,
        selectedCategory: form.category,
        location: form.location,
        followUpAnswer: followUpAnswer.value.trim() || undefined,
        followUpAlreadyAsked: followUpAlreadyAsked.value,
      })
      aiResult.value = response.data
      aiSource.value = response.data.source
      if (response.data.needsFollowUp && response.data.followUpQuestion && !followUpAlreadyAsked.value) {
        followUpQuestion.value = response.data.followUpQuestion
        askedFollowUpQuestion.value = response.data.followUpQuestion
        followUpAlreadyAsked.value = true
        currentStep.value = 2
        return response.data
      }
      followUpQuestion.value = null
      applyAnalysis(response.data)
      currentStep.value = 3
      return response.data
    }
    catch (caught) {
      error.value = message(caught)
      throw caught
    }
    finally {
      isAnalyzing.value = false
    }
  }

  function applyAnalysis(result: IncidentAnalysisResult) {
    if (!result.analysis)
      return
    form.title = result.analysis.title
    form.summary = result.analysis.summary
    form.suggestedCategory = result.analysis.suggestedCategory
    form.category = result.analysis.suggestedCategory
    form.suggestedPriority = result.analysis.suggestedPriority
    form.confirmedPriority = result.analysis.suggestedPriority
    form.priorityReason = result.analysis.priorityReason
  }

  async function submit() {
    if (!form.category)
      throw new Error('กรุณาเลือกหมวดเหตุ')
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
        suggestedPriority: form.suggestedPriority,
        confirmedPriority: form.confirmedPriority,
        priorityReason: form.priorityReason,
        followUpQuestion: askedFollowUpQuestion.value ?? undefined,
        followUpAnswer: followUpAnswer.value.trim() || undefined,
        imageDataUrl: imageDataUrl.value ?? undefined,
        aiAnalysisSource: aiSource.value,
      })
      createdIncident.value = response.data.incident
      return response.data.incident
    }
    catch (caught) {
      error.value = message(caught)
      throw caught
    }
    finally {
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
    aiResult.value = null
    aiSource.value = 'fallback'
    followUpQuestion.value = null
    askedFollowUpQuestion.value = null
    followUpAnswer.value = ''
    followUpAlreadyAsked.value = false
    currentStep.value = 1
    isAnalyzing.value = false
    isSubmitting.value = false
    error.value = null
    createdIncident.value = null
  }

  return {
    form,
    imagePreview,
    imageDataUrl,
    imageName,
    aiResult,
    aiSource,
    followUpQuestion,
    askedFollowUpQuestion,
    followUpAnswer,
    followUpAlreadyAsked,
    currentStep,
    isAnalyzing,
    isSubmitting,
    error,
    createdIncident,
    analyze,
    applyAnalysis,
    submit,
    setImage,
    removeImage,
    reset,
  }
})
