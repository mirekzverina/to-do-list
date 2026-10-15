<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

type ShootingStar = {
    id: number;
    x: number;
    y: number;
    duration: number;
    length: number;
};

const stars = ref<ShootingStar[]>([]);

let nextId = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const removalTimers = new Set<ReturnType<typeof setTimeout>>();

function spawnStar() {
    const id = nextId++;
    const duration = 1100 + Math.random() * 400;

    stars.value.push({
        id,
        x: 10 + Math.random() * 85,
        y: 5 + Math.random() * 85,
        duration,
        length: 110 + Math.random() * 90,
    });

    const removalTimer = setTimeout(() => {
        stars.value = stars.value.filter((star) => star.id !== id);
        removalTimers.delete(removalTimer);
    }, duration);

    removalTimers.add(removalTimer);
}

function scheduleNextStar() {
    timer = setTimeout(
        () => {
            spawnStar();
            scheduleNextStar();
        },
        12000 + Math.random() * 3000,
    );
}

onMounted(() => {
    if (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        window.matchMedia('(max-width: 768px)').matches
    ) {
        return;
    }

    timer = setTimeout(() => {
        spawnStar();
        scheduleNextStar();
    }, 3000);
});

onUnmounted(() => {
    clearTimeout(timer);
    removalTimers.forEach(clearTimeout);
    removalTimers.clear();
});
</script>

<template>
    <div class="shooting-stars" aria-hidden="true">
        <span
            v-for="star in stars"
            :key="star.id"
            class="shooting-stars__star"
            :style="{
                '--star-x': `${star.x}%`,
                '--star-y': `${star.y}%`,
                '--star-duration': `${star.duration}ms`,
                '--star-length': `${star.length}px`,
            }"
        />
    </div>
</template>

<style scoped lang="scss">
.shooting-stars {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;

    &__star {
        position: absolute;
        top: var(--star-y);
        left: var(--star-x);

        width: var(--star-length);
        height: 1px;
        border-radius: 999px;

        background: linear-gradient(
            90deg,
            #ffffff 0%,
            rgb(225 245 255 / 95%) 2%,
            rgb(165 215 255 / 75%) 10%,
            rgb(105 180 255 / 35%) 35%,
            rgb(105 180 255 / 8%) 70%,
            transparent 100%
        );

        box-shadow:
            0 0 4px rgb(205 235 255 / 45%),
            0 0 12px rgb(105 180 255 / 12%);

        opacity: 0;

        transform: translate3d(0, 0, 0) rotate(-35deg);
        transform-origin: left center;

        animation: meteor-fall var(--star-duration)
            cubic-bezier(0.35, 0, 0.8, 1) forwards;

        will-change: transform, opacity;

        &::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;

            width: 2px;
            height: 2px;
            border-radius: 50%;

            background: #ffffff;

            box-shadow:
                0 0 4px 1px rgb(255 255 255 / 80%),
                0 0 10px 2px rgb(145 210 255 / 35%);

            transform: translateY(-50%);
        }
    }
}

@keyframes meteor-fall {
    0% {
        opacity: 0;
        transform: translate3d(0, 0, 0) rotate(-35deg);
    }

    12% {
        opacity: 0.95;
    }

    45% {
        opacity: 1;
    }

    75% {
        opacity: 0.65;
    }

    100% {
        opacity: 0;
        transform: translate3d(-420px, 290px, 0) rotate(-35deg);
    }
}

@media (max-width: 768px) {
    .shooting-stars {
        display: none;
    }
}
</style>
