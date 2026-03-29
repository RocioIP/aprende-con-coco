<template>
  <section class="home-hero">
    <div class="home-hero__content">
      <div class="home-hero__visual">
        <div class="home-hero__bubble">
          {{ displayedText }}
        </div>

        <div class="home-hero__mascot">
          <img
            src="/images/global/coco-saludando.jpg"
            :alt="t('home.mascotAlt')"
            class="home-hero__image"
          />
        </div>
      </div>

      <div class="home-hero__actions">
        <!-- <p v-if="!child" class="home-hero__guest-note">
          {{ t('home.guestNote') }}
        </p> -->
        <HomeActionLinks @navigate="cancel" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import HomeActionLinks from '@/components/molecules/HomeActionLinks.vue'
import { useAuthSession } from '@/composables/useAuthSession'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'
import { useTypedText } from '@/composables/useTypedText'

const { t } = useI18n()
const { child } = useAuthSession()
const childName = computed(() => child.value?.name?.trim() || 'peque')
const fullText = computed(() => t('home.greeting', { name: childName.value }))
const { speak, cancel } = useSpeechSynthesis()
const { displayedText, startTyping, stopTyping } = useTypedText({
  intervalMs: 100,
})

function syncGreeting() {
  startTyping(fullText.value)
  speak(fullText.value)
}

onMounted(() => {
  syncGreeting()
})

watch(fullText, () => {
  syncGreeting()
})

onBeforeUnmount(() => {
  stopTyping()
  cancel()
})
</script>

<style scoped>
.home-hero {
  display: grid;
  align-content: center;
  height: calc(100dvh - 6rem);
  padding: 0.15rem 1rem 0.75rem;
  box-sizing: border-box;
  overflow: clip;
}

.home-hero__content {
  display: grid;
  grid-template-columns: minmax(24rem, 36rem) minmax(19rem, 22.5rem);
  align-items: start;
  justify-content: center;
  gap: 2.6rem;
  width: min(100%, 67rem);
  margin: 0 auto;
  min-height: 0;
  transform: translateY(-1.35rem);
}

.home-hero__visual {
  display: grid;
  grid-template-columns: minmax(11rem, 13.5rem) minmax(17rem, 21.5rem);
  align-items: start;
  gap: 0.9rem;
  min-width: 0;
}

.home-hero__bubble {
  position: relative;
  margin-top: 0.5rem;
  padding: 1rem 1.25rem;
  border-radius: 2rem;
  background: linear-gradient(135deg, #fff2c7 0%, #ffe3ec 100%);
  color: #1c2d43;
  font-size: clamp(1.15rem, 1.55vw, 1.55rem);
  font-weight: 700;
  line-height: 1.2;
  box-shadow: 0 12px 30px rgba(31, 45, 72, 0.1);
}

.home-hero__bubble::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -0.8rem;
  width: 1.6rem;
  height: 1.6rem;
  background: #f7dde3;
  clip-path: polygon(0 50%, 100% 0, 100% 100%);
  transform: translateY(-50%);
}

.home-hero__mascot {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  margin-top: 0;
  min-width: 0;
}

.home-hero__image {
  width: 100%;
  max-width: 21.5rem;
  max-height: min(28rem, calc(100dvh - 8.2rem));
  height: auto;
  object-fit: contain;
}

.home-hero__actions {
  display: grid;
  gap: 0.9rem;
  align-self: start;
  position: relative;
  z-index: 1;
}

.home-hero__guest-note {
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.82);
  color: #40536f;
  font-size: 0.98rem;
  line-height: 1.45;
  box-shadow: 0 10px 24px rgba(31, 45, 72, 0.08);
}

@media (max-width: 900px) {
  .home-hero {
    height: calc(100dvh - 5.5rem);
    padding-block: 0.2rem 0.75rem;
  }

  .home-hero__content {
    grid-template-columns: minmax(19rem, 28rem) minmax(14rem, 17rem);
    gap: 1.4rem;
    width: min(100%, 53rem);
    transform: translateY(-0.85rem);
  }

  .home-hero__visual {
    grid-template-columns: minmax(8.5rem, 10.5rem) minmax(13rem, 17rem);
    gap: 0.55rem;
  }

  .home-hero__bubble {
    margin-top: 0.35rem;
    padding: 0.85rem 1rem;
    font-size: clamp(1rem, 1.35vw, 1.2rem);
  }

  .home-hero__image {
    max-width: 17rem;
    max-height: min(22rem, calc(100dvh - 8.3rem));
  }
}

@media (max-width: 640px) {
  .home-hero {
    height: auto;
    padding-block: 0.75rem 1.25rem;
  }

  .home-hero__content {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 0.9rem;
    transform: none;
  }

  .home-hero__visual {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 0.75rem;
  }

  .home-hero__bubble {
    margin-top: 0;
    max-width: min(22rem, 92vw);
    font-size: clamp(1.1rem, 4.4vw, 1.35rem);
    text-align: center;
  }

  .home-hero__bubble::after {
    top: auto;
    right: 50%;
    bottom: -0.7rem;
    transform: translateX(50%) rotate(90deg);
  }

  .home-hero__image {
    width: auto;
    max-width: 11rem;
    max-height: none;
  }
}
</style>
