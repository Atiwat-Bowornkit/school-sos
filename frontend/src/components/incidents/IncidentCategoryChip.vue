<script setup lang="ts">
import type { IncidentCategory } from '@/models'
import { categoryLabels } from '@/utils/incident-labels'

defineProps<{ category: IncidentCategory }>()
</script>

<template>
  <VChip color="primary" variant="tonal" size="small" label>
    {{ categoryLabels[category] }}
  </VChip>
</template>
