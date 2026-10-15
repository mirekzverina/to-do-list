<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';

import { siVuedotjs, siTypescript, siSass } from 'simple-icons';
import { GripVertical } from 'lucide-vue-next';

const technologies = [
    { name: 'Vue 3', icon: siVuedotjs, className: 'vue' },
    { name: 'TypeScript', icon: siTypescript, className: 'typescript' },
    { name: 'SCSS', icon: siSass, className: 'scss' },
    { name: 'SortableJS', icon: null, className: 'sortable' },
];

const isOpen = ref(false);
const techStackRef = ref<HTMLElement | null>(null);

function handlePointerDown(event: PointerEvent) {
    if (
        techStackRef.value &&
        !techStackRef.value.contains(event.target as Node)
    ) {
        isOpen.value = false;
    }
}

function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        isOpen.value = false;
    }
}

watch(isOpen, (open) => {
    if (open) {
        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
    } else {
        document.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('keydown', handleKeyDown);
    }
});

onUnmounted(() => {
    document.removeEventListener('pointerdown', handlePointerDown);
    document.removeEventListener('keydown', handleKeyDown);
});

function handlePointerEnter(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
        isOpen.value = true;
    }
}

function handlePointerLeave(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
        isOpen.value = false;
    }
}
</script>

<template>
    <div
        ref="techStackRef"
        class="tech-stack"
        :class="{ 'tech-stack--open': isOpen }"
        @pointerenter="handlePointerEnter"
        @pointerleave="handlePointerLeave"
    >
        <button
            type="button"
            class="tech-stack__trigger"
            :aria-expanded="isOpen"
            aria-controls="tech-stack-panel"
            @click="isOpen = !isOpen"
        >
            <span class="tech-stack__dot"></span>
            Built With
        </button>

        <div id="tech-stack-panel" class="tech-stack__panel" :inert="!isOpen">
            <div
                v-for="technology in technologies"
                :key="technology.name"
                class="tech-stack__technology"
                :class="`tech-stack__technology--${technology.className}`"
            >
                <GripVertical
                    v-if="technology.className === 'sortable'"
                    :size="22"
                    aria-hidden="true"
                />

                <svg
                    v-else
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path :d="technology.icon!.path" />
                </svg>
                <span>{{ technology.name }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.tech-stack {
    position: absolute;
    top: 32px;
    right: 40px;
    z-index: 20;

    &__trigger {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 16px;
        border: 1px solid rgb(190 210 245 / 18%);
        border-radius: 999px;
        background: rgb(17 29 47 / 78%);
        backdrop-filter: blur(14px);
        font-size: 0.78rem;
        font-weight: 600;
        color: #d5e3f5;
        box-shadow: 0 8px 30px rgb(0 0 0 / 15%);
        cursor: pointer;

        transition:
            transform 200ms ease,
            color 200ms ease,
            border-color 200ms ease,
            background-color 200ms ease,
            box-shadow 200ms ease;
    }

    &__dot {
        width: 7px;
        height: 7px;
        flex-shrink: 0;
        border-radius: 50%;
        background: #69c5ff;
        box-shadow: 0 0 10px #69c5ff;

        transition:
            transform 200ms ease,
            background-color 300ms ease,
            box-shadow 200ms ease;
    }

    @media (hover: hover) and (pointer: fine) {
        &__trigger:hover {
            transform: translateY(-2px);
            color: #fff;
            border-color: rgb(105 197 255 / 35%);
            background: rgb(24 43 67 / 92%);
            box-shadow:
                0 10px 30px rgb(0 0 0 / 22%),
                0 0 24px rgb(105 197 255 / 12%);
        }

        &__trigger:hover .tech-stack__dot {
            transform: scale(1.35);
            box-shadow:
                0 0 8px #69c5ff,
                0 0 18px rgb(105 197 255 / 55%);
        }
    }

    &__panel {
        position: absolute;
        top: calc(100% + 14px);
        right: 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 190px;
        padding: 22px 24px;
        border: 1px solid rgb(190 210 245 / 16%);
        border-radius: 18px;
        background: rgb(16 28 45 / 92%);
        backdrop-filter: blur(20px);
        box-shadow:
            0 18px 45px rgb(0 0 0 / 25%),
            0 0 30px rgb(105 197 255 / 6%);

        opacity: 0;
        visibility: hidden;
        transform: translateY(-6px);
        pointer-events: none;

        transition:
            opacity 200ms ease,
            visibility 200ms ease,
            transform 200ms ease;

        &::before {
            content: '';
            position: absolute;
            top: -7px;
            right: 30px;
            width: 14px;
            height: 14px;
            border-top: 1px solid rgb(190 210 245 / 16%);
            border-left: 1px solid rgb(190 210 245 / 16%);
            background: rgb(16 28 45 / 92%);
            transform: rotate(45deg);
        }
    }

    &__technology {
        display: flex;
        align-items: center;
        gap: 14px;
        white-space: nowrap;
        font-size: 0.82rem;
        font-weight: 600;
        color: #d5e3f5;

        svg {
            width: 22px;
            height: 22px;
            flex-shrink: 0;
        }

        &--vue svg {
            color: #42b883;
        }

        &--typescript svg {
            color: #3178c6;
        }

        &--scss svg {
            color: #cc6699;
        }

        &--sortable svg {
            color: #69c5ff;
        }
    }

    &--open {
        .tech-stack__panel {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
            pointer-events: auto;
        }
    }
}

@media (max-width: 768px) {
    .tech-stack {
        top: 16px;
        right: 16px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .tech-stack {
        &__trigger,
        &__dot,
        &__panel {
            transition: none;
        }
    }
}
</style>
