<template>
  <section class="story-reader">
    <div class="story-reader__toolbar">
      <button type="button" class="story-reader__back" @click="closeReader">
        {{ t('stories.reader.back') }}
      </button>

      <div class="story-reader__brand">
        <span class="story-reader__brand-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M5.5 5.5A2.5 2.5 0 0 1 8 3h10.5v14H8A2.5 2.5 0 0 0 5.5 19.5V5.5Zm0 0H4.75A1.75 1.75 0 0 0 3 7.25v11A2.75 2.75 0 0 1 5.75 21H19a2 2 0 0 0 2-2V4.5A1.5 1.5 0 0 0 19.5 3H8A2.5 2.5 0 0 0 5.5 5.5Zm4 2h6m-6 3h6m-6 3h4"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
            />
          </svg>
        </span>
        <span class="story-reader__brand-label">{{ story.title }}</span>
      </div>

      <div class="story-reader__counter">
        {{ t('stories.reader.pageCounter', { current: pageIndex + 1, total: story.pages.length }) }}
      </div>
    </div>

    <div
      class="story-reader__stage"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
    >
      <Transition :name="transitionNameResolved" mode="out-in">
        <article
          :key="`${story.id}-${pageIndex}`"
          class="story-sheet"
          :class="{ 'is-dragging': isDragging }"
          :style="dragStyle"
        >
          <div class="story-sheet__page story-sheet__page--image">
            <img :src="currentPage.image" :alt="currentPage.imageAlt" draggable="false" />
          </div>

          <div class="story-sheet__page story-sheet__page--text">
            <div class="story-sheet__chapter">
              {{ t('stories.reader.chapterLabel', { current: pageIndex + 1, total: story.pages.length }) }}
            </div>

            <h2 class="story-sheet__title">{{ currentPage.title }}</h2>

            <div class="story-sheet__body">
              <p
                v-for="paragraph in narratedParagraphs"
                :key="`${pageIndex}-${paragraph.index}`"
                class="story-sheet__paragraph"
                :class="`is-${paragraph.state}`"
              >
                <span class="story-sheet__spoken">{{ paragraph.spokenText }}</span>
                <span class="story-sheet__pending">{{ paragraph.pendingText }}</span>
              </p>
            </div>

            <button type="button" class="story-reader__listen" @click="toggleNarration">
              <span class="story-reader__listen-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 14h3.5L12 18V6L7.5 10H4v4Zm11.5-4.5a4.5 4.5 0 0 1 0 5m2.5-7.5a8 8 0 0 1 0 10"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                  />
                </svg>
              </span>
              {{ isNarrating ? t('stories.reader.stop') : t('stories.reader.listen') }}
            </button>
          </div>
        </article>
      </Transition>
    </div>

    <div class="story-reader__footer">
      <div class="story-reader__progress" aria-hidden="true">
        <span
          v-for="(_, index) in story.pages"
          :key="`${story.id}-page-${index}`"
          class="story-reader__dot"
          :class="{ 'is-active': index === pageIndex }"
        />
      </div>

      <span class="story-reader__hint">{{ t('stories.reader.swipeHint') }}</span>

      <div class="story-reader__actions">
        <button
          type="button"
          class="story-reader__nav"
          :disabled="!canGoPrevious"
          @click="goPrevious"
        >
          {{ t('stories.reader.previous') }}
        </button>
        <button
          type="button"
          class="story-reader__nav"
          :disabled="!canGoNext"
          @click="goNext"
        >
          {{ t('stories.reader.next') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useStoryNarration } from '@/composables/useStoryNarration'
import { useStorySwipe } from '@/composables/useStorySwipe'
import type { LocalizedStory } from '@/types/stories'

const props = defineProps<{
  story: LocalizedStory
  pageIndex: number
  transitionName: 'story-slide-next' | 'story-slide-previous'
}>()

const emit = defineEmits<{
  close: []
  next: []
  previous: []
}>()

const { t } = useI18n()
const { prefersReducedMotion } = useReducedMotion()

const currentPage = computed(() => props.story.pages[props.pageIndex] ?? props.story.pages[0])
const currentParagraphs = computed(() => currentPage.value.paragraphs)
const canGoPrevious = computed(() => props.pageIndex > 0)
const canGoNext = computed(() => props.pageIndex < props.story.pages.length - 1)
const transitionNameResolved = computed(() =>
  prefersReducedMotion.value ? 'story-static' : props.transitionName
)

const { isNarrating, narratedParagraphs, stopNarration, toggleNarration } = useStoryNarration({
  paragraphs: currentParagraphs,
  rate: 0.92,
})

function closeReader() {
  stopNarration()
  emit('close')
}

function goNext() {
  stopNarration()
  emit('next')
}

function goPrevious() {
  stopNarration()
  emit('previous')
}

const { dragStyle, isDragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
  useStorySwipe({
    canGoNext: () => canGoNext.value,
    canGoPrevious: () => canGoPrevious.value,
    onGoNext: goNext,
    onGoPrevious: goPrevious,
  })
</script>

<style scoped>
.story-reader {
  display: grid;
  gap: 1.4rem;
  width: min(100%, 78rem);
  height: calc(100dvh - 8.1rem);
  max-height: 46rem;
  min-height: 0;
  margin: 0 auto;
  grid-template-rows: auto minmax(0, 1fr) auto;
}

.story-reader__toolbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
}

.story-reader__back,
.story-reader__nav,
.story-reader__listen {
  border: none;
  transition: transform 0.22s ease, box-shadow 0.22s ease, opacity 0.22s ease;
}

.story-reader__back,
.story-reader__nav {
  border-radius: 999px;
  padding: 0.85rem 1.2rem;
  background: rgba(255, 255, 255, 0.92);
  color: #26405f;
  font-weight: 700;
  box-shadow: 0 12px 28px rgba(28, 45, 67, 0.12);
}

.story-reader__back:is(:hover, :focus-visible),
.story-reader__nav:is(:hover, :focus-visible),
.story-reader__listen:is(:hover, :focus-visible) {
  transform: translateY(-2px);
}

.story-reader__back:focus-visible,
.story-reader__nav:focus-visible,
.story-reader__listen:focus-visible {
  outline: 3px solid rgba(61, 91, 225, 0.2);
  outline-offset: 3px;
}

.story-reader__brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  min-width: 0;
  justify-self: center;
}

.story-reader__brand-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.65rem;
  height: 2.65rem;
  border-radius: 16px;
  background: linear-gradient(180deg, #5b73ec 0%, #4761e6 100%);
  color: #fff;
  box-shadow: 0 12px 28px rgba(71, 97, 230, 0.2);
}

.story-reader__brand-badge svg,
.story-reader__listen-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.story-reader__brand-label {
  min-width: 0;
  color: #1d2d49;
  font-size: clamp(1.2rem, 1.6vw, 1.8rem);
  font-weight: 800;
  letter-spacing: 0.02em;
}

.story-reader__counter {
  justify-self: end;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: #5a6f8b;
  font-size: 0.95rem;
  font-weight: 700;
}

.story-reader__stage {
  display: flex;
  min-height: 0;
  height: 100%;
  padding: 1rem;
  border-radius: 34px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.88), transparent 30%),
    linear-gradient(145deg, #edf3ff 0%, #fff8ef 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 24px 48px rgba(38, 62, 98, 0.1);
  touch-action: pan-y;
  cursor: grab;
}

.story-sheet {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(1rem, 2vw, 1.9rem);
  min-height: 0;
  height: 100%;
  padding: clamp(1rem, 2vw, 1.6rem);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 22px 42px rgba(39, 60, 88, 0.11),
    inset 0 0 0 1px rgba(123, 148, 188, 0.12);
  transform-origin: center;
}

.story-sheet.is-dragging {
  transition: none;
  cursor: grabbing;
}

.story-sheet__page {
  min-height: 0;
}

.story-sheet__page--image {
  display: flex;
}

.story-sheet__page--image img {
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
  border-radius: 30px;
  display: block;
  user-select: none;
  box-shadow: 0 18px 36px rgba(29, 45, 70, 0.12);
}

.story-sheet__page--text {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  align-content: start;
  gap: 1rem;
  min-height: 0;
  padding-left: clamp(0.5rem, 1vw, 1rem);
  border-left: 1px solid rgba(206, 216, 231, 0.8);
}

.story-sheet__chapter {
  width: fit-content;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background: #eef3ff;
  color: #5d74d7;
  font-size: 0.92rem;
  font-weight: 800;
}

.story-sheet__title {
  margin: 0;
  color: #4b63df;
  font-size: clamp(1.8rem, 2.5vw, 2.7rem);
  line-height: 1.08;
}

.story-sheet__body {
  display: grid;
  align-content: start;
  gap: 1rem;
  min-height: 0;
  overflow: auto;
  padding-right: 0.2rem;
}

.story-sheet__paragraph {
  margin: 0;
  color: #1f2a3f;
  font-size: clamp(1.18rem, 1.45vw, 1.55rem);
  font-weight: 700;
  line-height: 1.34;
  transition: color 0.2s ease;
}

.story-sheet__paragraph.is-active,
.story-sheet__paragraph.is-complete {
  color: #6077e1;
}

.story-sheet__spoken {
  color: #4b63df;
}

.story-sheet__pending {
  color: #1f2a3f;
}

.story-sheet__paragraph.is-complete .story-sheet__pending {
  color: #6077e1;
}

.story-reader__listen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  width: fit-content;
  padding: 0.95rem 1.45rem;
  border-radius: 999px;
  background: linear-gradient(180deg, #6ac28e 0%, #59b27d 100%);
  color: #fff;
  font-size: 1.03rem;
  font-weight: 800;
  box-shadow: 0 18px 34px rgba(89, 178, 125, 0.22);
}

.story-reader__listen-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.story-reader__footer {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
}

.story-reader__progress {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.story-reader__dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 999px;
  background: rgba(143, 156, 183, 0.24);
}

.story-reader__dot.is-active {
  width: 1.6rem;
  background: #5a72e8;
}

.story-reader__hint {
  justify-self: center;
  color: #627694;
  font-size: 0.95rem;
  font-weight: 600;
}

.story-reader__actions {
  display: flex;
  gap: 0.75rem;
}

.story-reader__nav:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 10px 25px rgba(28, 45, 67, 0.08);
}

.story-slide-next-enter-active,
.story-slide-next-leave-active,
.story-slide-previous-enter-active,
.story-slide-previous-leave-active {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.story-slide-next-enter-from,
.story-slide-previous-leave-to {
  opacity: 0;
  transform: translateX(52px);
}

.story-slide-next-leave-to,
.story-slide-previous-enter-from {
  opacity: 0;
  transform: translateX(-52px);
}

.story-static-enter-active,
.story-static-leave-active {
  transition: none;
}

@media (max-width: 900px) {
  .story-reader {
    height: auto;
    max-height: none;
  }

  .story-reader__toolbar,
  .story-reader__footer {
    grid-template-columns: 1fr;
  }

  .story-reader__brand,
  .story-reader__hint,
  .story-reader__counter,
  .story-reader__progress {
    justify-self: start;
  }

  .story-sheet {
    grid-template-columns: 1fr;
    height: auto;
  }

  .story-sheet__page--image {
    min-height: 19rem;
  }

  .story-sheet__page--text {
    padding-left: 0;
    border-left: none;
    border-top: 1px solid rgba(206, 216, 231, 0.8);
    padding-top: 1.2rem;
  }
}

@media (max-width: 640px) {
  .story-reader {
    gap: 1rem;
  }

  .story-reader__stage {
    padding: 0.75rem;
    border-radius: 24px;
    cursor: default;
  }

  .story-sheet {
    padding: 0.9rem;
    border-radius: 24px;
  }

  .story-sheet__page--image {
    min-height: 16rem;
  }

  .story-reader__actions {
    width: 100%;
  }

  .story-reader__nav {
    flex: 1;
  }

  .story-reader__listen {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-reader__back,
  .story-reader__nav,
  .story-reader__listen,
  .story-sheet__paragraph {
    transition: none;
  }

  .story-reader__back:is(:hover, :focus-visible),
  .story-reader__nav:is(:hover, :focus-visible),
  .story-reader__listen:is(:hover, :focus-visible) {
    transform: none;
  }
}
</style>
