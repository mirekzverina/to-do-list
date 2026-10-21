<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue';

import {
    GripVertical,
    Trash2,
    Pencil,
    Check,
    Code2,
    FileText,
    Palette,
    Target,
    Settings2,
    ListTodo,
} from 'lucide-vue-next';

import type { Task, TaskCategory } from '../types/task';

const props = defineProps<{
    task: Task;
    isColumnClearing?: boolean;
}>();

const emit = defineEmits<{
    (
        event: 'move-task',
        taskId: string,
        targetStatus: Task['status'],
        targetIndex: number,
    ): void;

    (event: 'delete-task', taskId: string): void;
    (event: 'edit-task', taskId: string, title: string): void;
}>();

const isDeleting = ref(false);
const isEditing = ref(false);
const editedTitle = ref('');
const editInput = ref<HTMLInputElement | null>(null);
const editButton = ref<HTMLButtonElement | null>(null);

const colorCategories = ['blue', 'mint', 'purple', 'coral'];

const colorLabels: Record<string, string> = {
    coral: 'High priority',
    purple: 'Medium priority',
    mint: 'Low priority',
    blue: 'Info',
};
async function restoreEditFocus() {
    await nextTick();
    editButton.value?.focus();
}

let deleteTimer: ReturnType<typeof setTimeout> | undefined;

onUnmounted(() => {
    clearTimeout(deleteTimer);
});

async function startEditing() {
    if (isDeleting.value || props.isColumnClearing) return;

    editedTitle.value = props.task.title;
    isEditing.value = true;

    await nextTick();
    editInput.value?.focus();
    editInput.value?.select();
}

function saveEditing() {
    if (!isEditing.value) return;

    const title = editedTitle.value.trim();

    if (title && title !== props.task.title) {
        emit('edit-task', props.task.id, title);
    }

    isEditing.value = false;
    void restoreEditFocus();
}

function cancelEditing() {
    isEditing.value = false;
    void restoreEditFocus();
    editedTitle.value = props.task.title;
}

function deleteWithAnimation() {
    if (isDeleting.value) return;

    isDeleting.value = true;

    deleteTimer = setTimeout(() => {
        emit('delete-task', props.task.id);
    }, 250);
}

const categories: Partial<
    Record<TaskCategory, { label: string; icon: typeof Palette }>
> = {
    design: { label: 'UI/UX', icon: Palette },
    development: { label: 'Development', icon: Code2 },
    content: { label: 'Content', icon: FileText },
    planning: { label: 'Planning', icon: Target },
    configuration: { label: 'Configuration', icon: Settings2 },
    general: { label: 'General', icon: ListTodo },
};
</script>

<template>
    <article
        class="task-card"
        :data-task-id="task.id"
        :class="{
            'task-card--done': task.status === 'done',
            'task-card--deleting': isDeleting || isColumnClearing,
        }"
    >
        <div class="task-card__leading">
            <span v-if="task.status === 'done'" class="task-card__check">
                <Check :size="16" :stroke-width="2.5" />
            </span>

            <GripVertical v-else class="task-card__grip" :size="18" />
        </div>

        <div class="task-card__content">
            <input
                v-if="isEditing"
                ref="editInput"
                v-model="editedTitle"
                class="task-card__edit-input"
                type="text"
                maxlength="100"
                aria-label="Edit task title"
                @keydown.enter.prevent="saveEditing"
                @keydown.esc.prevent="cancelEditing"
                @click.stop
                @mousedown.stop
                @pointerdown.stop
            />

            <span v-else class="task-card__title">
                {{ task.title }}
            </span>

            <span class="task-card__category">
                <template v-if="colorCategories.includes(task.category)">
                    <span
                        class="task-label-dot"
                        :class="`task-label-dot--${task.category}`"
                    ></span>

                    <span>{{ colorLabels[task.category] }}</span>
                </template>

                <template v-else>
                    <component
                        :is="categories[task.category]?.icon ?? ListTodo"
                        :size="13"
                    />
                    {{ categories[task.category]?.label ?? 'General' }}
                </template>
            </span>
        </div>

        <div class="task-card__actions" @mousedown.stop @pointerdown.stop>
            <button
                v-if="!isEditing"
                ref="editButton"
                class="task-card__edit"
                type="button"
                :aria-label="`Edit ${task.title}`"
                @click.stop="startEditing"
            >
                <Pencil :size="15" />
            </button>

            <button
                v-else
                class="task-card__edit task-card__edit--save"
                type="button"
                aria-label="Save task title"
                @click.stop="saveEditing"
            >
                <Check :size="16" />
            </button>

            <button
                class="task-card__delete"
                type="button"
                :aria-label="`Delete ${task.title}`"
                @click.stop="deleteWithAnimation"
            >
                <Trash2 :size="16" />
            </button>
        </div>
    </article>
</template>

<style scoped lang="scss">
.task-card {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 76px;
    padding: 12px 10px;
    flex-shrink: 0;
    touch-action: pan-y;

    border: 1px solid rgb(190 210 245 / 16%);
    border-radius: 13px;

    background: linear-gradient(
        135deg,
        rgb(255 255 255 / 6%),
        rgb(255 255 255 / 2%)
    );

    box-shadow:
        inset 0 1px 0 rgb(255 255 255 / 6%),
        0 6px 20px rgb(0 0 0 / 15%);

    transition:
        border-color 250ms ease,
        background 250ms ease,
        box-shadow 250ms ease;

    cursor: grab;

    &:active {
        cursor: grabbing;
    }

    &:not(.task-card--deleting):hover {
        border-color: rgb(190 215 255 / 32%);

        background: linear-gradient(
            135deg,
            rgb(255 255 255 / 9%),
            rgb(255 255 255 / 3%)
        );

        box-shadow:
            0 10px 28px rgb(0 0 0 / 25%),
            inset 0 1px 0 rgb(255 255 255 / 9%);
    }

    &__leading {
        flex-shrink: 0;
    }

    &__grip {
        color: #91a4c2;
        cursor: grab;
    }

    &__check {
        display: grid;
        place-items: center;
        width: 27px;
        height: 27px;
        border-radius: 50%;

        background: #4fe7b3;
        color: #06281d;

        box-shadow:
            0 0 12px rgb(79 231 179 / 45%),
            0 0 24px rgb(79 231 179 / 20%);
    }

    &__content {
        display: flex;
        flex: 1;
        min-width: 0;
        flex-direction: column;
        gap: 6px;
    }

    &__title {
        color: #f1f5f9;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.4;
        overflow-wrap: anywhere;
    }

    &__category {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #91a4bc;
        font-size: 10px;
    }

    &__actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
    }

    &__edit,
    &__delete {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #91a4bc;
        cursor: pointer;

        transition:
            background-color 200ms ease,
            color 200ms ease;
    }

    &__edit:hover {
        background: transparent;
        color: #a5e7ff;

        svg {
            filter: drop-shadow(0 0 3px rgb(105 197 255 / 75%))
                drop-shadow(0 0 7px rgb(105 197 255 / 35%));
        }
    }

    &__edit svg {
        transition: filter 220ms ease;
    }

    &__edit--save {
        color: #4fe7b3;

        &:hover {
            background: rgb(79 231 179 / 12%);
            color: #7affd1;
        }
    }

    &__delete:hover {
        background: rgb(255 90 90 / 12%);
        color: #ff6b6b;
    }

    &__edit-input {
        width: 100%;
        min-width: 0;
        height: 17px;
        box-sizing: border-box;
        padding: 0 5px;

        border: 1px solid rgb(105 197 255 / 55%);
        border-radius: 5px;
        outline: none;

        background: rgb(10 25 43 / 85%);
        color: #f1f5f9;

        font: inherit;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.4;

        box-shadow: 0 0 12px rgb(105 197 255 / 12%);

        &:focus {
            border-color: #69c5ff;
        }
    }

    &--done &__title {
        color: #9aadb0;
        text-decoration: line-through;
    }

    &--deleting {
        opacity: 0;
        transform: scale(0.85) translateY(-10px);
        pointer-events: none;

        transition:
            opacity 250ms ease,
            transform 250ms ease;
    }
}
</style>
