<script setup lang="ts">
import type { IncidentStatus } from '@/models'
import { statusColors, statusLabels } from '@/utils/incident-labels'

defineProps<{ status: IncidentStatus }>()
</script>

<template>
  <VChip :color="statusColors[status]" size="small" label>
    {{ statusLabels[status] }}
  </VChip>
</template>
