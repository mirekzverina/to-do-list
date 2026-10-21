<script lang="ts">
let isDragging = false;
</script>

<script setup lang="ts">
import { computed, nextTick, ref, watch, onUnmounted } from 'vue';
import { Lightbulb, Activity, CircleCheck, Trash2 } from 'lucide-vue-next';
import { VueDraggable } from 'vue-draggable-plus';
import TaskCard from './TaskCard.vue';

import type { Task, TaskColumnConfig } from '../types/task';

const props = defineProps<{
    column: TaskColumnConfig;
    tasks: Task[];
}>();

const isClearing = ref(false);

let clearTimer: ReturnType<typeof setTimeout> | undefined;

function clearColumn() {
    if (isClearing.value || columnTasks.value.length === 0) return;

    isClearing.value = true;

    clearTimer = setTimeout(() => {
        emit('clear-column', props.column.id);
        isClearing.value = false;
    }, 250);
}

onUnmounted(() => {
    clearTimeout(clearTimer);
});

const emit = defineEmits<{
    (
        event: 'move-task',
        taskId: string,
        targetStatus: Task['status'],
        targetIndex: number,
    ): void;

    (event: 'delete-task', taskId: string): void;
    (event: 'edit-task', taskId: string, title: string): void;
    (event: 'clear-column', status: Task['status']): void;
}>();

const columnTasks = computed(() =>
    props.tasks
        .filter((task) => task.status === props.column.id)
        .sort((a, b) => a.order - b.order),
);

const columnElement = ref<HTMLElement | null>(null);

function onDragStart() {
    isDragging = true;
}

function onDragFinish() {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            isDragging = false;
        });
    });
}

function getTaskElements(): HTMLElement[] {
    return Array.from(
        columnElement.value?.querySelectorAll<HTMLElement>(
            '.task-column__tasks > .task-card',
        ) ?? [],
    );
}

const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
);

watch(
    () => columnTasks.value.map((task) => task.id).join('|'),
    async (_, oldIds) => {
        if (!oldIds || isDragging || prefersReducedMotion.matches) return;

        const previousElements = getTaskElements();

        const previousPositions = new Map(
            previousElements.map((element) => [
                element.dataset.taskId ?? '',
                element.getBoundingClientRect(),
            ]),
        );

        const previousIds = new Set(oldIds.split('|'));

        await nextTick();

        for (const element of getTaskElements()) {
            const taskId = element.dataset.taskId;
            if (!taskId) continue;

            const previous = previousPositions.get(taskId);

            if (!previousIds.has(taskId)) {
                element.animate(
                    [
                        {
                            opacity: 0,
                            transform: 'translateY(-12px) scale(0.96)',
                        },
                        {
                            opacity: 1,
                            transform: 'translateY(0) scale(1)',
                        },
                    ],
                    {
                        duration: 420,
                        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    },
                );

                continue;
            }

            if (!previous) continue;

            const current = element.getBoundingClientRect();
            const deltaY = previous.top - current.top;

            if (Math.abs(deltaY) < 1) continue;

            element.animate(
                [
                    { transform: `translateY(${deltaY}px)` },
                    { transform: 'translateY(0)' },
                ],
                {
                    duration: 420,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                },
            );
        }
    },
    { flush: 'pre' },
);

function onDragEnd(event: {
    item: HTMLElement;
    to: HTMLElement;
    newIndex?: number;
}) {
    const taskId = event.item.dataset.taskId;
    const targetStatus = event.to.dataset.status as Task['status'] | undefined;

    if (taskId && targetStatus) {
        emit('move-task', taskId, targetStatus, event.newIndex ?? 0);
    }
}
const icons = {
    open: Lightbulb,
    progress: Activity,
    done: CircleCheck,
};
</script>

<template>
    <section
        ref="columnElement"
        class="task-column"
        :class="`task-column--${column.id}`"
    >
        <header class="task-column__header">
            <div class="task-column__heading">
                <span class="task-column__dot"></span>

                <h2>{{ column.title }}</h2>

                <div class="task-column__header-actions">
                    <span class="task-column__count">
                        {{ columnTasks.length }}
                    </span>

                    <button
                        type="button"
                        class="task-column__clear"
                        :disabled="columnTasks.length === 0 || isClearing"
                        :aria-label="`Clear ${props.column.id} tasks`"
                        title="Clear all tasks"
                        @click="clearColumn"
                    >
                        <Trash2 :size="14" :stroke-width="2" />
                    </button>
                </div>
            </div>

            <component
                :is="icons[column.id]"
                class="task-column__icon"
                :size="24"
                :stroke-width="2"
            />

            <p class="task-column__description">
                {{ column.description }}
            </p>
        </header>

        <VueDraggable
            :model-value="columnTasks"
            class="task-column__tasks"
            :data-status="column.id"
            group="kanban-tasks"
            :animation="250"
            :easing="'cubic-bezier(0.22, 1, 0.36, 1)'"
            :empty-insert-threshold="60"
            :swap-threshold="0.5"
            :invert-swap="true"
            :inverted-swap-threshold="0.5"
            :force-fallback="true"
            :fallback-on-body="true"
            :fallback-tolerance="4"
            :delay-on-touch-only="true"
            :delay="180"
            :touch-start-threshold="5"
            ghost-class="task-card--ghost"
            chosen-class="task-card--chosen"
            drag-class="task-card--dragging"
            filter=".task-card__delete, .task-card__edit, .task-card__edit-input"
            :prevent-on-filter="false"
            @start="onDragStart"
            @end="onDragEnd"
            @unchoose="onDragFinish"
        >
            <TaskCard
                v-for="task in columnTasks"
                :key="task.id"
                :task="task"
                :is-column-clearing="isClearing"
                @delete-task="emit('delete-task', $event)"
                @edit-task="(taskId, title) => emit('edit-task', taskId, title)"
            />
        </VueDraggable>
    </section>
</template>

<style scoped lang="scss">
.task-column {
    --accent: #66adff;
    --accent-rgb: 82 153 255;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: visible;

    position: relative;
    isolation: isolate;

    min-width: 0;
    padding: 18px 12px;

    border: 1px solid transparent;
    border-radius: 18px;

    background:
        radial-gradient(
            ellipse 65px 70px at 0% 0%,
            rgb(var(--accent-rgb) / 3%),
            transparent 100%
        ),
        radial-gradient(
            ellipse 65px 70px at 100% 0%,
            rgb(var(--accent-rgb) / 3%),
            transparent 100%
        ),
        radial-gradient(
            ellipse 70px 75px at 0% 100%,
            rgb(var(--accent-rgb) / 3%),
            transparent 100%
        ),
        radial-gradient(
            ellipse 70px 75px at 100% 100%,
            rgb(var(--accent-rgb) / 4%),
            transparent 100%
        ),
        linear-gradient(
            180deg,
            rgb(17 27 41 / 65%) 0%,
            rgb(11 20 32 / 55%) 100%
        );

    box-shadow:
        inset 0 1px 0 rgb(255 255 255 / 10%),
        inset 0 35px 65px -45px rgb(var(--accent-rgb) / 8%),
        inset 0 -45px 90px -45px rgb(var(--accent-rgb) / 10%),
        inset 35px 0 75px -55px rgb(var(--accent-rgb) / 6%),
        inset -35px 0 75px -55px rgb(var(--accent-rgb) / 6%),
        0 0 4px rgb(var(--accent-rgb) / 10%),
        0 12px 35px rgb(0 0 0 / 25%);

    transition:
        border-color 250ms ease,
        box-shadow 250ms ease;

    &--progress {
        --accent: #ffb347;
        --accent-rgb: 255 179 71;
    }

    &--done {
        --accent: #3ff0b0;
        --accent-rgb: 43 255 156;
    }

    &::before {
        content: '';
        position: absolute;
        inset: -1px;
        z-index: 2;
        border-radius: inherit;
        padding: 1px;
        pointer-events: none;

        background:
            radial-gradient(
                ellipse 110px 110px at 0% 0%,
                rgb(var(--accent-rgb) / 100%) 0%,
                rgb(var(--accent-rgb) / 55%) 45%,
                transparent 100%
            ),
            radial-gradient(
                ellipse 110px 110px at 100% 0%,
                rgb(var(--accent-rgb) / 100%) 0%,
                rgb(var(--accent-rgb) / 55%) 45%,
                transparent 100%
            ),
            radial-gradient(
                ellipse 110px 110px at 0% 100%,
                rgb(var(--accent-rgb) / 100%) 0%,
                rgb(var(--accent-rgb) / 55%) 45%,
                transparent 100%
            ),
            radial-gradient(
                ellipse 110px 110px at 100% 100%,
                rgb(var(--accent-rgb) / 100%) 0%,
                rgb(var(--accent-rgb) / 55%) 45%,
                transparent 100%
            ),
            linear-gradient(
                rgb(var(--accent-rgb) / 20%),
                rgb(var(--accent-rgb) / 20%)
            );

        mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);

        mask-composite: exclude;
    }

    &::after {
        content: '';
        position: absolute;
        inset: -2px;
        z-index: -2;
        border-radius: inherit;
        pointer-events: none;

        background:
            radial-gradient(
                ellipse 100px 65px at 0% 100%,
                rgb(60 155 255 / 10%),
                transparent 100%
            ),
            radial-gradient(
                ellipse 120px 80px at 100% 0%,
                rgb(101 229 188 / 5%),
                transparent 100%
            ),
            radial-gradient(
                ellipse 120px 80px at 100% 100%,
                rgb(101 229 188 / 5%),
                transparent 100%
            );

        filter: blur(6px);
    }

    &__header {
        position: relative;
        margin-bottom: 22px;
        padding-right: 22px;
    }

    &__heading {
        display: flex;
        align-items: center;
        gap: 9px;
    }

    &__dot {
        position: relative;

        width: 13px;
        height: 13px;
        flex-shrink: 0;
        border-radius: 50%;

        background: var(--accent);

        box-shadow:
            inset 0 1px 0 rgb(255 255 255 / 15%),
            0 0 12px rgb(var(--accent-rgb) / 30%);
    }

    h2 {
        color: #f8fbff;
        font-size: 14px;
        font-weight: 650;
        white-space: nowrap;
    }

    &__icon {
        position: absolute;
        top: 0;
        right: 0;

        color: var(--accent);

        filter: drop-shadow(0 0 5px rgb(var(--accent-rgb) / 55%))
            drop-shadow(0 0 12px rgb(var(--accent-rgb) / 20%));
    }

    &__description {
        margin-top: 10px;
        color: #9aadc6;
        font-size: 11px;
        line-height: 1.5;
    }

    &__tasks {
        display: flex;
        flex-direction: column;
        gap: 10px;

        flex: 1 1 auto;
        min-height: 0;
        padding: 4px 3px 12px;
        box-sizing: border-box;

        overflow-y: auto;
        overflow-x: hidden;

        scrollbar-gutter: auto;
        overscroll-behavior: contain;

        scrollbar-width: thin;
        scrollbar-color: rgb(var(--accent-rgb) / 55%) transparent;

        &::-webkit-scrollbar {
            width: 5px;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }

        &::-webkit-scrollbar-thumb {
            border-radius: 10px;
            background: rgb(var(--accent-rgb) / 55%);
        }

        &::-webkit-scrollbar-thumb:hover {
            background: rgb(var(--accent-rgb) / 85%);
        }
    }

    &__header-actions {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
    }

    &__count,
    &__clear {
        display: grid;
        place-items: center;

        width: 26px;
        height: 26px;
        flex-shrink: 0;
        padding: 0;

        border: 1px solid transparent;
        border-radius: 50%;
        background: rgb(255 255 255 / 7%);
    }

    &__count {
        color: #a9bad0;
        font-size: 11px;
        font-weight: 500;
        line-height: 1;
    }

    &__clear {
        color: #8295ae;
        cursor: pointer;

        transition:
            background-color 200ms ease,
            border-color 200ms ease,
            color 200ms ease,
            box-shadow 200ms ease,
            transform 200ms ease;

        &:hover:not(:disabled) {
            background: rgb(255 90 105 / 12%);
            border-color: rgb(255 110 125 / 20%);
            color: #ff6b7b;

            box-shadow: 0 0 12px rgb(255 85 105 / 10%);

            transform: scale(1.05);
        }

        &:active:not(:disabled) {
            transform: scale(0.96);
        }

        &:disabled {
            opacity: 0.3;
            cursor: default;
        }

        &:focus-visible {
            outline: 2px solid #ff8792;
            outline-offset: 3px;
        }
    }
}

@media (max-width: 768px) {
    .task-column {
        &__tasks {
            overscroll-behavior-y: auto;
            scrollbar-gutter: auto;
            padding-left: 12px;
            padding-right: 12px;
        }
    }
}

@media (max-width: 380px) {
    .task-column {
        min-width: 0;
        padding: 14px 8px;

        &__tasks {
            padding-left: 8px;
            padding-right: 8px;
        }
    }
}
</style>
