<script setup lang="ts">
interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    driftX: number;
    driftY: number;
    color: 'blue' | 'cyan' | 'orange';
}

const particles: Particle[] = [
    {
        id: 1,
        x: 12,
        y: 14,
        size: 3,
        duration: 19,
        delay: -4,
        driftX: 18,
        driftY: -24,
        color: 'blue',
    },
    {
        id: 2,
        x: 22,
        y: 9,
        size: 5,
        duration: 24,
        delay: -12,
        driftX: -16,
        driftY: 20,
        color: 'blue',
    },
    {
        id: 3,
        x: 8,
        y: 38,
        size: 3,
        duration: 21,
        delay: -8,
        driftX: 22,
        driftY: 16,
        color: 'orange',
    },
    {
        id: 4,
        x: 18,
        y: 65,
        size: 2,
        duration: 27,
        delay: -16,
        driftX: -12,
        driftY: -28,
        color: 'blue',
    },
    {
        id: 5,
        x: 6,
        y: 82,
        size: 4,
        duration: 23,
        delay: -6,
        driftX: 20,
        driftY: -18,
        color: 'orange',
    },

    {
        id: 6,
        x: 36,
        y: 18,
        size: 2,
        duration: 25,
        delay: -10,
        driftX: 14,
        driftY: 26,
        color: 'cyan',
    },
    {
        id: 7,
        x: 44,
        y: 78,
        size: 3,
        duration: 20,
        delay: -14,
        driftX: -18,
        driftY: -22,
        color: 'orange',
    },
    {
        id: 8,
        x: 55,
        y: 12,
        size: 2,
        duration: 28,
        delay: -5,
        driftX: 16,
        driftY: 18,
        color: 'blue',
    },
    {
        id: 9,
        x: 62,
        y: 88,
        size: 4,
        duration: 22,
        delay: -18,
        driftX: -14,
        driftY: -26,
        color: 'orange',
    },

    {
        id: 10,
        x: 78,
        y: 15,
        size: 3,
        duration: 26,
        delay: -9,
        driftX: 20,
        driftY: 22,
        color: 'blue',
    },
    {
        id: 11,
        x: 91,
        y: 27,
        size: 2,
        duration: 19,
        delay: -13,
        driftX: -22,
        driftY: 18,
        color: 'cyan',
    },
    {
        id: 12,
        x: 86,
        y: 48,
        size: 4,
        duration: 24,
        delay: -7,
        driftX: 16,
        driftY: -20,
        color: 'cyan',
    },
    {
        id: 13,
        x: 95,
        y: 68,
        size: 3,
        duration: 21,
        delay: -17,
        driftX: -18,
        driftY: -24,
        color: 'cyan',
    },
    {
        id: 14,
        x: 82,
        y: 85,
        size: 5,
        duration: 29,
        delay: -11,
        driftX: 24,
        driftY: -18,
        color: 'cyan',
    },

    {
        id: 15,
        x: 28,
        y: 91,
        size: 2,
        duration: 23,
        delay: -15,
        driftX: 12,
        driftY: -24,
        color: 'orange',
    },
    {
        id: 16,
        x: 72,
        y: 8,
        size: 3,
        duration: 27,
        delay: -3,
        driftX: -16,
        driftY: 20,
        color: 'blue',
    },
    {
        id: 17,
        x: 4,
        y: 55,
        size: 2,
        duration: 25,
        delay: -19,
        driftX: 18,
        driftY: -16,
        color: 'orange',
    },
    {
        id: 18,
        x: 97,
        y: 89,
        size: 2,
        duration: 20,
        delay: -8,
        driftX: -14,
        driftY: -22,
        color: 'cyan',
    },
    {
        id: 19,
        x: 68,
        y: 58,
        size: 2,
        duration: 28,
        delay: -12,
        driftX: 10,
        driftY: 18,
        color: 'blue',
    },
    {
        id: 20,
        x: 33,
        y: 46,
        size: 2,
        duration: 26,
        delay: -6,
        driftX: -12,
        driftY: 14,
        color: 'blue',
    },
];
</script>

<template>
    <div class="ambient-particles" aria-hidden="true">
        <span
            v-for="particle in particles"
            :key="particle.id"
            class="ambient-particles__particle"
            :class="`ambient-particles__particle--${particle.color}`"
            :style="{
                '--x': `${particle.x}%`,
                '--y': `${particle.y}%`,
                '--size': `${particle.size}px`,
                '--duration': `${particle.duration}s`,
                '--delay': `${particle.delay}s`,
                '--drift-x': `${particle.driftX}px`,
                '--drift-y': `${particle.driftY}px`,
            }"
        />
    </div>
</template>

<style scoped lang="scss">
.ambient-particles {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
    pointer-events: none;

    &__particle {
        position: absolute;
        top: var(--y);
        left: var(--x);

        width: var(--size);
        height: var(--size);
        border-radius: 50%;

        background: var(--particle-color);
        box-shadow:
            0 0 6px var(--particle-glow),
            0 0 16px var(--particle-glow);

        opacity: 0.6;

        will-change: transform, opacity;

        animation:
            particle-drift var(--duration) ease-in-out var(--delay) infinite
                alternate,
            particle-glow 6s ease-in-out var(--delay) infinite alternate;

        &--blue {
            --particle-color: #70b6ff;
            --particle-glow: rgb(72 154 255 / 45%);
        }

        &--cyan {
            --particle-color: #66efd2;
            --particle-glow: rgb(67 235 207 / 40%);
        }

        &--orange {
            --particle-color: #ffbd78;
            --particle-glow: rgb(255 168 90 / 40%);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        &__particle {
            animation: none;
            will-change: auto;
        }
    }
}

@keyframes particle-drift {
    0% {
        transform: translate3d(0, 0, 0);
    }

    35% {
        transform: translate3d(
            calc(var(--drift-x) * 0.45),
            calc(var(--drift-y) * -0.35),
            0
        );
    }

    70% {
        transform: translate3d(
            calc(var(--drift-x) * -0.3),
            calc(var(--drift-y) * 0.65),
            0
        );
    }

    100% {
        transform: translate3d(var(--drift-x), var(--drift-y), 0);
    }
}

@keyframes particle-glow {
    0% {
        opacity: 0.3;
    }

    50% {
        opacity: 0.8;
    }

    100% {
        opacity: 0.45;
    }
}
</style>
