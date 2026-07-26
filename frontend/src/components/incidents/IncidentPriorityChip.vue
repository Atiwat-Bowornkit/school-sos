<script setup lang="ts">
import type { IncidentPriority } from '@/models'
import { priorityColors, priorityLabels } from '@/utils/incident-labels'

defineProps<{ priority: IncidentPriority }>()
</script>

<template>
  <VChip :color="priorityColors[priority]" size="small" label>
    Priority {{ priorityLabels[priority] }}
  </VChip>
</template>
