<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { ResolveIncidentBody } from '@/models'

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [value: ResolveIncidentBody]
}>()

const valid = ref(false)
const form = reactive({
  actionTaken: '',
  resolutionResult: '',
  resolutionNote: '',
  actorName: '',
})

const required = (value: string) => value.trim().length > 0 || 'กรุณากรอกข้อมูล'

watch(() => props.modelValue, (open) => {
  if (!open)
    return
  Object.assign(form, {
    actionTaken: '',
    resolutionResult: '',
    resolutionNote: '',
    actorName: '',
  })
})

function close() {
  emit('update:modelValue', false)
}

function submit() {
  if (!valid.value)
    return
  emit('submit', {
    actionTaken: form.actionTaken,
    resolutionResult: form.resolutionResult,
    resolutionNote: form.resolutionNote.trim() || undefined,
    actorName: form.actorName.trim() || undefined,
  })
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="640"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="pa-5">
        ปิดเหตุ
      </VCardTitle>
      <VDivider />
      <VForm v-model="valid" @submit.prevent="submit">
        <VCardText class="pa-5">
          <VAlert type="info" variant="tonal" class="mb-5">
            เมื่อยืนยัน ระบบจะเปลี่ยนสถานะเป็น RESOLVED และสร้างรายงานสรุป
          </VAlert>
          <VTextarea
            v-model="form.actionTaken"
            label="สิ่งที่ดำเนินการ *"
            :rules="[required]"
            rows="3"
            auto-grow
          />
          <VTextarea
            v-model="form.resolutionResult"
            label="ผลลัพธ์ *"
            :rules="[required]"
            rows="3"
            auto-grow
          />
          <VTextarea
            v-model="form.resolutionNote"
            label="หมายเหตุเพิ่มเติม"
            rows="2"
            auto-grow
          />
          <VTextField
            v-model="form.actorName"
            label="ชื่อผู้ดำเนินการ"
          />
        </VCardText>
        <VCardActions class="justify-end pa-5 pt-0">
          <VBtn variant="text" :disabled="loading" @click="close">
            ยกเลิก
          </VBtn>
          <VBtn color="success" type="submit" :loading="loading" :disabled="!valid">
            ยืนยันปิดเหตุ
          </VBtn>
        </VCardActions>
      </VForm>
    </VCard>
  </VDialog>
</template>
