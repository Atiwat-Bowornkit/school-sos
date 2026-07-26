<script setup lang="ts">
import type { TimelineEvent } from '@/models'
import { formatThaiDateTime } from '@/utils/date-format'

defineProps<{ events: TimelineEvent[] }>()

const eventIcons: Record<TimelineEvent['eventType'], string> = {
  INCIDENT_CREATED: 'ri-add-circle-line',
  AI_ANALYZED: 'ri-sparkling-line',
  ASSIGNEE_UPDATED: 'ri-user-settings-line',
  PRIORITY_UPDATED: 'ri-flag-line',
  STATUS_CHANGED: 'ri-arrow-left-right-line',
  PROGRESS_RECORDED: 'ri-file-list-3-line',
  INCIDENT_RESOLVED: 'ri-checkbox-circle-line',
  CLOSURE_SUMMARY_GENERATED: 'ri-file-check-line',
}
</script>

<template>
  <VTimeline v-if="events.length" side="end" align="start" density="compact">
    <VTimelineItem
      v-for="event in events"
      :key="event.id"
      dot-color="primary"
      size="small"
    >
      <template #icon>
        <VIcon :icon="eventIcons[event.eventType]" size="16" />
      </template>
      <div class="pb-3">
        <div class="font-weight-medium">
          {{ event.title }}
        </div>
        <div v-if="event.description" class="text-body-2 text-medium-emphasis mt-1">
          {{ event.description }}
        </div>
        <div class="text-caption text-disabled mt-1">
          {{ event.actorName }} · {{ formatThaiDateTime(event.createdAt) }}
        </div>
      </div>
    </VTimelineItem>
  </VTimeline>
  <div v-else class="text-center text-medium-emphasis py-6">
    ยังไม่มี Timeline
  </div>
</template>
