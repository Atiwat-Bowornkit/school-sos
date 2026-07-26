import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { incidentApi } from '@/apis/incident-api'
import type {
  AddProgressBody,
  ChangeStatusBody,
  CreateIncidentBody,
  Incident,
  IncidentDetail,
  IncidentFilters,
  ResolveIncidentBody,
  UpdateIncidentBody,
} from '@/models'
import { filterIncidents } from '@/utils/incident-labels'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่'
}

export const useIncidentStore = defineStore('IncidentStore', () => {
  const incidents = ref<Incident[]>([])
  const selectedIncident = ref<Incident | null>(null)
  const selectedTimeline = ref<IncidentDetail['timeline']>([])
  const filters = ref<IncidentFilters>({})
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  const visibleIncidents = computed(() => filterIncidents(incidents.value, filters.value))
  const newIncidentCount = computed(() => incidents.value.filter(item => item.status === 'NEW').length)

  async function fetchIncidents() {
    isLoading.value = true
    error.value = null
    try {
      const response = await incidentApi.list()
      incidents.value = response.data
    }
    catch (caught) {
      error.value = errorMessage(caught)
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchIncidentById(id: string) {
    isLoading.value = true
    error.value = null
    try {
      const response = await incidentApi.get(id)
      setSelected(response.data)
      return response.data
    }
    catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    }
    finally {
      isLoading.value = false
    }
  }

  async function createIncident(body: CreateIncidentBody) {
    return submit(() => incidentApi.create(body))
  }

  async function updateIncident(id: string, body: UpdateIncidentBody) {
    return submit(() => incidentApi.update(id, body))
  }

  async function changeStatus(id: string, body: ChangeStatusBody) {
    return submit(() => incidentApi.changeStatus(id, body))
  }

  async function addProgress(id: string, body: AddProgressBody) {
    return submit(() => incidentApi.addProgress(id, body))
  }

  async function resolveIncident(id: string, body: ResolveIncidentBody) {
    return submit(() => incidentApi.resolve(id, body))
  }

  async function submit(call: () => ReturnType<typeof incidentApi.create>) {
    isSubmitting.value = true
    error.value = null
    try {
      const response = await call()
      setSelected(response.data)
      const index = incidents.value.findIndex(item => item.id === response.data.incident.id)
      if (index >= 0)
        incidents.value[index] = response.data.incident
      else incidents.value.unshift(response.data.incident)
      return response.data
    }
    catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    }
    finally {
      isSubmitting.value = false
    }
  }

  function setSelected(detail: IncidentDetail) {
    selectedIncident.value = detail.incident
    selectedTimeline.value = detail.timeline
  }

  function clearFilters() {
    filters.value = {}
  }

  function resetSelectedIncident() {
    selectedIncident.value = null
    selectedTimeline.value = []
    error.value = null
  }

  return {
    incidents,
    selectedIncident,
    selectedTimeline,
    filters,
    visibleIncidents,
    newIncidentCount,
    isLoading,
    isSubmitting,
    error,
    fetchIncidents,
    fetchIncidentById,
    createIncident,
    updateIncident,
    changeStatus,
    addProgress,
    resolveIncident,
    clearFilters,
    resetSelectedIncident,
  }
})
