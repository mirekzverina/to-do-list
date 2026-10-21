<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import {
    Plus,
    ArrowRight,
    Database,
    Sparkle,
    ListTodo,
    Check,
} from 'lucide-vue-next';

import TaskColumn from './TaskColumn.vue';
import { defaultTasks } from '../data/defaultTasks';

import type { Task, TaskCategory, TaskColumnConfig } from '../types/task';

const STORAGE_KEY = 'kanban-tasks-v1';

const validStatuses = ['open', 'progress', 'done'] as const;

const validCategories: TaskCategory[] = [
    'general',
    'blue',
    'mint',
    'purple',
    'coral',
    'design',
    'development',
    'content',
    'planning',
    'configuration',
];

function isValidTask(value: unknown): value is Task {
    if (typeof value !== 'object' || value === null) return false;

    const task = value as Record<string, unknown>;

    return (
        typeof task.id === 'string' &&
        task.id.length > 0 &&
        typeof task.title === 'string' &&
        task.title.trim().length > 0 &&
        task.title.length <= 100 &&
        validStatuses.includes(task.status as Task['status']) &&
        validCategories.includes(task.category as TaskCategory) &&
        typeof task.order === 'number' &&
        Number.isSafeInteger(task.order) &&
        task.order >= 0
    );
}

function loadTasks(): Task[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved === null) {
            return structuredClone(defaultTasks);
        }

        const parsed: unknown = JSON.parse(saved);

        if (!Array.isArray(parsed) || !parsed.every(isValidTask)) {
            return structuredClone(defaultTasks);
        }

        const ids = new Set(parsed.map((task: Task) => task.id));

        if (ids.size !== parsed.length) {
            return structuredClone(defaultTasks);
        }

        return parsed;
    } catch (error) {
        console.warn('Could not load saved tasks:', error);
        return structuredClone(defaultTasks);
    }
}

function clearColumn(status: Task['status']) {
    tasks.value = tasks.value.filter((task) => task.status !== status);
}

const taskInputRef = ref<HTMLInputElement | null>(null);

const boardHeight = ref(550);
const isResizing = ref(false);
const boardRef = ref<HTMLElement | null>(null);

let startY = 0;
let startBottom = 0;

function startResize(event: PointerEvent) {
    if (event.button !== 0 || !boardRef.value) return;

    event.preventDefault();

    startBottom = boardRef.value.getBoundingClientRect().bottom;

    isResizing.value = true;
    startY = event.clientY;

    document.body.style.cursor = 'pointer';

    window.addEventListener('pointermove', onResize);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);
}

function onResize(event: PointerEvent) {
    if (!isResizing.value || !boardRef.value) return;

    const targetBottom = startBottom + (event.clientY - startY);

    const board = boardRef.value;

    let low = 350;
    let high = Math.max(
        boardHeight.value + Math.abs(event.clientY - startY) * 3 + 500,
        1500,
    );

    for (let i = 0; i < 16; i++) {
        const mid = (low + high) / 2;

        board.style.height = `${mid}px`;

        const actualBottom = board.getBoundingClientRect().bottom;

        if (actualBottom < targetBottom) {
            low = mid;
        } else {
            high = mid;
        }
    }

    boardHeight.value = Math.max(350, (low + high) / 2);
}
function stopResize() {
    isResizing.value = false;

    document.body.style.cursor = '';

    window.removeEventListener('pointermove', onResize);
    window.removeEventListener('pointerup', stopResize);
    window.removeEventListener('pointercancel', stopResize);
}

onUnmounted(stopResize);

const tasks = ref<Task[]>(loadTasks());

watch(
    tasks,
    (currentTasks) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTasks));
        } catch (error) {
            console.warn('Could not save tasks:', error);
        }
    },
    { deep: true },
);

const newTask = ref('');

const selectedCategory = ref<TaskCategory | null>(null);
const isCategoryPickerOpen = ref(false);
const categoryWrapper = ref<HTMLElement | null>(null);

function handleOutsideClick(event: PointerEvent) {
    if (
        isCategoryPickerOpen.value &&
        categoryWrapper.value &&
        !categoryWrapper.value.contains(event.target as Node)
    ) {
        isCategoryPickerOpen.value = false;
    }
}

function openCategoryPicker() {
    isCategoryPickerOpen.value = true;
}

function closeCategoryPicker() {
    isCategoryPickerOpen.value = false;
}

onMounted(() => {
    document.addEventListener('pointerdown', handleOutsideClick);
});

onUnmounted(() => {
    document.removeEventListener('pointerdown', handleOutsideClick);
});

const categories = [
    { id: 'general', label: 'General' },
    { id: 'coral', label: 'High priority' },
    { id: 'purple', label: 'Medium priority' },
    { id: 'mint', label: 'Low priority' },
    { id: 'blue', label: 'Info' },
] satisfies {
    id: TaskCategory;
    label: string;
}[];

const selectedCategoryData = computed(() =>
    categories.find((category) => category.id === selectedCategory.value),
);

const columns: TaskColumnConfig[] = [
    {
        id: 'open',
        title: 'To Do',
        description: 'Ideas and upcoming tasks',
    },
    {
        id: 'progress',
        title: 'In Progress',
        description: 'Currently working on',
    },
    {
        id: 'done',
        title: 'Completed',
        description: 'Nicely done!',
    },
];

async function selectCategory(category: TaskCategory) {
    selectedCategory.value = category;
    isCategoryPickerOpen.value = false;

    await nextTick();
    taskInputRef.value?.focus();
}

async function addTask() {
    const title = newTask.value.trim();

    if (!title) return;

    tasks.value
        .filter((task) => task.status === 'open')
        .forEach((task) => {
            task.order += 1;
        });

    tasks.value.push({
        id: crypto.randomUUID(),
        title,
        status: 'open',
        category: selectedCategory.value ?? 'general',
        order: 0,
    });

    newTask.value = '';
    selectedCategory.value = null;
    isCategoryPickerOpen.value = false;

    await nextTick();
    taskInputRef.value?.focus();
}

function moveTask(
    taskId: string,
    targetStatus: Task['status'],
    targetIndex: number,
) {
    const task = tasks.value.find((item) => item.id === taskId);

    if (!task) return;

    const sourceStatus = task.status;

    const sourceTasks = tasks.value
        .filter((item) => item.status === sourceStatus && item.id !== taskId)
        .sort((a, b) => a.order - b.order);

    const targetTasks =
        sourceStatus === targetStatus
            ? sourceTasks
            : tasks.value
                  .filter((item) => item.status === targetStatus)
                  .sort((a, b) => a.order - b.order);

    const safeIndex = Math.max(0, Math.min(targetIndex, targetTasks.length));

    task.status = targetStatus;
    targetTasks.splice(safeIndex, 0, task);

    if (sourceStatus !== targetStatus) {
        sourceTasks.forEach((item, index) => {
            item.order = index;
        });
    }

    targetTasks.forEach((item, index) => {
        item.order = index;
    });
}

function editTask(taskId: string, title: string) {
    const task = tasks.value.find((item) => item.id === taskId);
    if (!task) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    task.title = trimmedTitle;
}

function deleteTask(taskId: string) {
    tasks.value = tasks.value.filter((task) => task.id !== taskId);
}
</script>

<template>
    <div
        ref="boardRef"
        class="task-board"
        :style="{ height: `${boardHeight}px` }"
    >
        <form class="task-board__input" @submit.prevent="addTask">
            <div
                ref="categoryWrapper"
                class="task-board__category-wrapper"
                @mouseenter="openCategoryPicker"
                @mouseleave="closeCategoryPicker"
            >
                <button
                    type="button"
                    class="task-board__plus"
                    :class="{
                        'task-board__plus--selected': selectedCategory,
                    }"
                    :aria-label="selectedCategoryData?.label ?? 'Select label'"
                    :aria-expanded="isCategoryPickerOpen"
                    @click="openCategoryPicker"
                >
                    <span
                        v-if="
                            selectedCategory && selectedCategory !== 'general'
                        "
                        class="task-label-dot"
                        :class="`task-label-dot--${selectedCategory}`"
                    ></span>

                    <Plus v-else :size="22" />
                </button>

                <div
                    v-if="isCategoryPickerOpen"
                    class="task-board__category-picker"
                >
                    <div class="task-board__category-heading">TASK LABEL</div>

                    <div class="task-board__category-list">
                        <button
                            v-for="category in categories"
                            :key="category.id"
                            type="button"
                            class="task-board__category-option"
                            :class="{
                                'task-board__category-option--active':
                                    (selectedCategory ?? 'general') ===
                                    category.id,
                            }"
                            :aria-label="category.label"
                            @click="selectCategory(category.id)"
                        >
                            <ListTodo
                                v-if="category.id === 'general'"
                                :size="20"
                                class="task-board__category-icon"
                            />

                            <span
                                v-else
                                class="task-label-dot"
                                :class="`task-label-dot--${category.id}`"
                            ></span>

                            <span class="task-board__category-label">
                                {{ category.label }}
                            </span>

                            <Check
                                v-if="
                                    (selectedCategory ?? 'general') ===
                                    category.id
                                "
                                :size="17"
                                class="task-board__category-check"
                            />
                        </button>
                    </div>
                </div>
            </div>

            <input
                ref="taskInputRef"
                v-model="newTask"
                type="text"
                placeholder="Add a new task..."
                aria-label="New task"
                maxlength="100"
            />

            <button type="submit">
                Add
                <ArrowRight :size="17" />
            </button>
        </form>

        <div class="task-board__columns">
            <TaskColumn
                v-for="column in columns"
                :key="column.id"
                :column="column"
                :tasks="tasks"
                @move-task="moveTask"
                @delete-task="deleteTask"
                @edit-task="editTask"
                @clear-column="clearColumn"
            />
        </div>

        <footer class="task-board__footer">
            <span
                class="task-board__footer-item task-board__footer-item--storage"
            >
                <Database :size="17" :stroke-width="2.2" />
                Tasks are saved locally in your browser
            </span>

            <span class="task-board__footer-item task-board__footer-item--drag">
                <Sparkle :size="19" :stroke-width="2" />
                Drag & drop to change status
            </span>
        </footer>
        <div class="task-board__resize-handle" @pointerdown="startResize">
            <span></span>
            <span></span>
        </div>
    </div>
</template>

<style scoped lang="scss">
.task-board {
    position: relative;
    isolation: isolate;
    overflow: hidden;

    --column-height: 390px;

    width: min(100%, 850px);
    height: 550px;
    min-height: 350px;

    box-sizing: border-box;

    display: flex;
    flex-direction: column;

    padding: 20px;

    border: 1px solid transparent;
    border-radius: 24px;

    background:
        linear-gradient(125deg, rgb(12 20 31 / 65%), rgb(12 20 31 / 55%))
            padding-box,
        linear-gradient(125deg, rgb(12 20 31 / 65%), rgb(12 20 31 / 55%))
            padding-box,
        padding-box,
        linear-gradient(
                135deg,
                #72baff 0%,
                rgb(114 186 255 / 25%) 25%,
                rgb(114 186 255 / 12%) 48%,
                rgb(101 229 188 / 20%) 70%,
                #65e5bc 100%
            )
            border-box;

    box-shadow:
        0 24px 80px rgb(0 0 0 / 35%),
        inset 0 1px 0 rgb(255 255 255 / 4%);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        border-radius: inherit;
        pointer-events: none;

        background:
            radial-gradient(
                ellipse 150px 115px at 0% 0%,
                rgb(105 183 255 / 10%),
                transparent 100%
            ),
            radial-gradient(
                ellipse 150px 110px at 100% 0%,
                rgb(101 229 188 / 6%),
                transparent 100%
            ),
            radial-gradient(
                ellipse 170px 110px at 0% 100%,
                rgb(60 155 255 / 9%),
                transparent 100%
            ),
            radial-gradient(
                ellipse 170px 110px at 100% 100%,
                rgb(101 229 188 / 7%),
                transparent 100%
            );

        opacity: 1;
    }

    &::after {
        content: '';
        position: absolute;
        inset: -2px;
        z-index: -2;
        border-radius: inherit;
        pointer-events: none;
        opacity: 0.15;

        background:
            radial-gradient(
                ellipse 130px 85px at 0% 100%,
                rgb(60 155 255 / 55%) 0%,
                rgb(40 125 255 / 22%) 35%,
                transparent 100%
            ),
            radial-gradient(
                ellipse 180px 120px at 100% 0%,
                rgb(101 229 188 / 10%),
                transparent 95%
            ),
            radial-gradient(
                ellipse 180px 120px at 100% 100%,
                rgb(101 229 188 / 12%),
                transparent 95%
            );

        filter: blur(14px);
    }

    & {
        border: 1px solid transparent;

        background:
            linear-gradient(135deg, rgb(8 15 27 / 12%), rgb(8 15 27 / 12%))
                padding-box,
            linear-gradient(125deg, rgb(8 15 27 / 82%), rgb(8 15 27 / 78%))
                padding-box,
            radial-gradient(
                    ellipse 160px 120px at 0% 0%,
                    rgb(145 202 255 / 35%),
                    transparent 95%
                )
                border-box,
            radial-gradient(
                    ellipse 170px 120px at 100% 0%,
                    rgb(138 255 219 / 30%),
                    transparent 95%
                )
                border-box,
            radial-gradient(
                    ellipse 240px 125px at 0% 100%,
                    rgb(240 251 255 / 35%) 0%,
                    rgb(156 218 255 / 20%) 14%,
                    rgb(84 170 255 / 10%) 38%,
                    rgb(65 145 255 / 5%) 70%,
                    transparent 100%
                )
                border-box,
            radial-gradient(
                    ellipse 210px 115px at 100% 100%,
                    rgb(213 255 245 / 30%) 0%,
                    rgb(121 245 215 / 15%) 18%,
                    rgb(101 229 188 / 6%) 55%,
                    transparent 100%
                )
                border-box,
            radial-gradient(
                    ellipse 420px 65px at 50% 100%,
                    rgb(255 174 95 / 65%) 0%,
                    rgb(255 155 85 / 30%) 45%,
                    transparent 100%
                )
                border-box,
            linear-gradient(
                    135deg,
                    rgb(114 186 255 / 25%),
                    rgb(101 229 188 / 20%)
                )
                border-box;
    }

    &__input {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;
        padding: 9px;
        border: 1px solid rgb(140 175 255 / 18%);
        border-radius: 15px;

        background:
            linear-gradient(110deg, rgb(39 68 110 / 15%), rgb(22 54 62 / 12%)),
            rgb(255 255 255 / 2%);

        transition:
            border-color 200ms ease,
            box-shadow 200ms ease;

        &:focus-within {
            border-color: rgb(105 197 255 / 55%);
            box-shadow: 0 0 20px rgb(105 197 255 / 8%);
        }

        input {
            flex: 1;
            min-width: 0;
            padding: 10px 4px;
            border: 0;
            outline: 0;
            background: transparent;
            color: #f1f5f9;
            font-size: 13px;

            &::placeholder {
                color: #8192a9;
            }
        }

        > button[type='submit'] {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 11px 17px;
            border: 0;
            border-radius: 10px;
            background: linear-gradient(120deg, #65e5bc, #69c5ff);
            color: #07131c;
            font-size: 13px;
            font-weight: 700;

            transition:
                filter 200ms ease,
                transform 200ms ease;

            &:hover {
                filter: brightness(1.12);
                transform: translateY(-1px);
            }

            &:active {
                transform: translateY(0);
            }
        }
    }

    &__category-general {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px;
        border: 1px solid transparent;
        border-radius: 10px;
        background: transparent;
        color: #a9bad2;
        font-size: 13px;
        text-align: left;
        cursor: pointer;
        transition:
            background 180ms ease,
            color 180ms ease;

        &:hover,
        &--active {
            background: rgb(105 197 255 / 10%);
            color: #f1f5f9;
        }
    }

    &__category-check {
        margin-left: auto;
        color: #69c5ff;
    }

    &__category-colors {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-top: 12px;
        padding: 12px 4px 4px;
        border-top: 1px solid rgb(140 175 255 / 14%);
    }

    &__category-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 10px;
    }

    &__category-option {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        min-height: 48px;
        padding: 10px 12px;

        border: 1px solid transparent;
        border-radius: 11px;
        background: transparent;
        color: #a9bad2;

        text-align: left;
        cursor: pointer;

        transition:
            background-color 180ms ease,
            border-color 180ms ease,
            color 180ms ease;

        &:hover {
            background: rgb(105 197 255 / 8%);
            color: #f1f5f9;
        }

        &--active {
            background: rgb(105 197 255 / 12%);
            color: #f1f5f9;
        }

        .task-label-dot {
            width: 23px;
            height: 23px;
        }
    }

    &__category-icon {
        flex-shrink: 0;
        color: #9fb4cc;
    }

    &__category-label {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
    }

    &__category-check {
        flex-shrink: 0;
        color: #69c5ff;
    }

    &__color-option {
        display: grid;
        place-items: center;
        width: 100%;
        aspect-ratio: 1;
        padding: 5px;
        border: 1px solid transparent;
        border-radius: 12px;
        background: transparent;
        cursor: pointer;
        transition:
            background 180ms ease,
            border-color 180ms ease,
            transform 180ms ease;

        &:hover {
            background: rgb(255 255 255 / 7%);
            transform: translateY(-2px);
        }

        &--active {
            border-color: rgb(105 197 255 / 50%);
            background: rgb(105 197 255 / 10%);
        }

        .task-label-dot {
            width: 28px;
            height: 28px;
        }
    }

    &__plus {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        padding: 0;

        border: 1px solid #69c5ff;
        border-radius: 11px;

        background: linear-gradient(
            135deg,
            #203f65 0%,
            #234c7b 55%,
            #327bb7 100%
        );

        color: #8cdeff;
        cursor: pointer;

        box-shadow:
            inset 0 1px 0 rgb(255 255 255 / 18%),
            inset 0 -2px 8px rgb(87 190 255 / 22%),
            0 0 12px rgb(69 160 255 / 20%),
            0 4px 14px rgb(0 0 0 / 20%);

        transition:
            background 250ms ease,
            border-color 250ms ease,
            color 250ms ease,
            box-shadow 250ms ease,
            filter 250ms ease;

        &:hover {
            border-color: #a4e7ff;
            color: #d0f5ff;

            filter: brightness(1.15);

            box-shadow:
                inset 0 1px 0 rgb(255 255 255 / 25%),
                inset 0 -2px 12px rgb(105 210 255 / 35%),
                0 0 16px rgb(69 160 255 / 35%),
                0 0 28px rgb(69 160 255 / 15%),
                0 5px 16px rgb(0 0 0 / 25%);
        }

        &:active {
            filter: brightness(1.05);
        }

        &:focus-visible {
            outline: 2px solid #b0eaff;
            outline-offset: 3px;
        }

        &--selected {
            color: #8cdeff;

            svg {
                filter: drop-shadow(0 0 5px rgb(105 197 255 / 25%));
            }
        }
    }

    &__category-wrapper {
        position: relative;
        flex-shrink: 0;
    }

    &__category-picker {
        position: absolute;
        top: 100%;
        margin-top: 0;
        left: 0;
        z-index: 100;

        min-width: 230px;
        padding: 8px;

        border: 1px solid rgb(105 197 255 / 35%);
        border-radius: 14px;

        background: rgb(13 25 42 / 97%);
        backdrop-filter: blur(24px);

        box-shadow:
            0 14px 40px rgb(0 0 0 / 45%),
            0 0 24px rgb(105 197 255 / 10%),
            inset 0 1px 0 rgb(255 255 255 / 7%);

        animation: categoryAppear 180ms ease-out;
    }

    &__category-heading {
        padding: 8px 10px 10px;
        color: #8192a9;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.7px;
        text-transform: uppercase;
    }

    @keyframes categoryAppear {
        from {
            opacity: 0;
            transform: translateY(-6px);
        }

        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        &__category-picker {
            animation: none;
        }
    }

    &__columns {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: minmax(0, 1fr);
        gap: 12px;

        flex: 1;
        min-height: 0;

        > * {
            height: 100%;
            min-height: 0;
            box-sizing: border-box;
        }
    }

    &__footer {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 20px;
        flex-shrink: 0;

        color: #8192a9;
        font-size: 11px;
        padding-right: 38px;

        &-item {
            display: inline-flex;
            align-items: center;
            gap: 10px;

            svg {
                flex-shrink: 0;
            }

            &--storage {
                svg {
                    color: #69baff;

                    filter: drop-shadow(0 0 4px rgb(105 186 255 / 35%));
                }
            }

            &--drag {
                svg {
                    color: #4fe7c5;

                    filter: drop-shadow(0 0 5px rgb(79 231 197 / 35%));
                }
            }
        }
    }

    @media (max-width: 768px) {
        --column-height: 290px;

        padding: 14px;

        &__columns {
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: none;
        }

        &__footer {
            flex-direction: column;
        }
    }

    @media (max-width: 380px) {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        padding: 10px;

        &__input {
            gap: 6px;
            padding: 6px;

            > button[type='submit'] {
                padding: 10px 12px;
                gap: 6px;
            }
        }

        &__columns {
            min-width: 0;
        }

        footer {
            padding: 10px;
        }
    }

    &__resize-handle {
        position: absolute;
        right: 10px;
        bottom: 7px;
        width: 20px;
        height: 20px;
        z-index: 20;

        cursor: pointer;
        touch-action: none;
        user-select: none;

        display: grid;
        place-items: center;

        &::after {
            content: '';
            width: 3.5px;
            height: 3.5px;
            border-radius: 50%;

            background: #65e5bc;

            box-shadow:
                9px 0 0 #65e5bc,
                9px -9px 0 #65e5bc;

            opacity: 0.55;

            transition:
                opacity 200ms ease,
                filter 200ms ease,
                transform 200ms ease;
        }

        &:hover::after {
            opacity: 1;
            filter: drop-shadow(0 0 4px rgb(101 229 188 / 65%));
            transform: scale(1.1);
        }

        span {
            display: none;
        }
    }
}
</style>

<style lang="scss">
.task-label-dot {
    display: inline-block;
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 1px solid rgb(255 255 255 / 28%);

    box-shadow:
        inset 0 1px 2px rgb(255 255 255 / 35%),
        0 2px 8px rgb(0 0 0 / 20%);

    // High priority — red
    &--coral {
        background: linear-gradient(135deg, #ff9292, #e83b50);
    }

    // Medium priority — yellow
    &--purple {
        background: linear-gradient(135deg, #ffe68a, #f3ac28);
    }

    // Low priority — green
    &--mint {
        background: linear-gradient(135deg, #a1f5bd, #23b67d);
    }

    // Universal — blue
    &--blue {
        background: linear-gradient(135deg, #a2e8ff, #3479ff);
    }
}

.task-card--chosen {
    cursor: grabbing !important;
    border-color: rgb(105 197 255 / 55%);
    box-shadow:
        0 0 22px rgb(105 197 255 / 18%),
        0 12px 35px rgb(0 0 0 / 35%);
}

.task-card--ghost {
    opacity: 0.18;
    border: 1px dashed rgb(105 197 255 / 65%);
    background: rgb(105 197 255 / 10%);
}

.task-card--dragging {
    opacity: 1 !important;
    cursor: grabbing !important;
    border: 1px solid #69c5ff !important;
    border-radius: 13px;
    background: #1a3048 !important;

    box-shadow:
        0 20px 45px rgb(0 0 0 / 50%),
        0 0 24px rgb(105 197 255 / 25%) !important;

    pointer-events: none;
    transition: none !important;
    z-index: 9999 !important;
}
</style>
