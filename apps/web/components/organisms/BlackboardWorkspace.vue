<template>
  <div class="blackboard-layout">
    <BlackboardToolbar
      :can-clear="isFreeDrawing"
      :clear-label="t('blackboard.toolbar.clear')"
      :colors="colorOptions"
      :palette-label="t('blackboard.toolbar.palette')"
      :selected-color="selectedColor"
      @clear="workspaceStore.requestClear"
      @select-color="workspaceStore.selectColor"
    />

    <div class="blackboard-content">
      <BlackboardActivitySelector
        :active-activity="activeActivity"
        :activities="activityOptions"
        :mascot-alt="t('blackboard.mascotAlt')"
        @select="workspaceStore.setActivity"
      />

      <div class="board-area">
        <div class="board-frame">
          <BlackboardFreeCanvas
            v-if="activeActivity === 'free'"
            :clear-version="clearVersion"
            :selected-color="selectedColor"
          />
          <BlackboardNumbersTrace
            v-else-if="activeActivity === 'numbers'"
            @finalizado="handleActivityClose"
          />
          <BlackboardFiguresTrace
            v-else
            @finalizado="handleActivityClose"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import BlackboardActivitySelector from '@/components/molecules/BlackboardActivitySelector.vue'
import BlackboardToolbar from '@/components/molecules/BlackboardToolbar.vue'
import BlackboardFreeCanvas from '@/components/organisms/BlackboardFreeCanvas.vue'
import BlackboardFiguresTrace from '@/components/organisms/BlackboardFiguresTrace.vue'
import BlackboardNumbersTrace from '@/components/organisms/BlackboardNumbersTrace.vue'
import { useBlackboardWorkspaceStore } from '@/stores/blackboard/workspace'

const workspaceStore = useBlackboardWorkspaceStore()
const { t } = useI18n()

workspaceStore.reset()

const { activeActivity, clearVersion, isFreeDrawing, selectedColor } = storeToRefs(workspaceStore)

const colorOptions = computed(() =>
  workspaceStore.colors.map((color) => ({
    ...color,
    label: t(color.labelKey),
  }))
)

const activityOptions = computed(() =>
  workspaceStore.activities.map((activity) => ({
    ...activity,
    label: t(activity.labelKey),
  }))
)

function handleActivityClose() {
  workspaceStore.setActivity('free')
}
</script>

<style scoped>
.blackboard-layout {
  display: grid;
  gap: 1.2rem;
  min-height: 100dvh;
  padding: 1rem;
  background:
    radial-gradient(circle at top, rgba(191, 219, 254, 0.35), transparent 35%),
    linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}

.blackboard-content {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.board-area {
  min-width: 0;
}

.board-frame {
  height: clamp(320px, 75dvh, 800px);
  border: 8px solid #475569;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  overflow: hidden;
}

@media (max-width: 820px) {
  .blackboard-layout {
    padding: 0.85rem;
  }

  .blackboard-content {
    grid-template-columns: 1fr;
  }

  .board-frame {
    height: clamp(260px, 70dvh, 85dvh);
  }
}
</style>
