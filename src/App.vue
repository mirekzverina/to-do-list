<script setup lang="ts">
import TaskBoard from './components/TaskBoard.vue';
import AmbientParticles from './components/AmbientParticles.vue';
import ShootingStars from './components/ShootingStars.vue';
import TechStack from './components/TechStack.vue';
</script>

<template>
    <main class="app">
        <TechStack />
        <ShootingStars />
        <AmbientParticles />
        <TaskBoard />
    </main>
</template>

<style scoped lang="scss">
.app {
    position: relative;
    isolation: isolate;
    z-index: 1;

    display: grid;
    place-items: center;

    min-height: 100vh;
    min-height: 100dvh;
    padding: 60px 24px;
    overflow: hidden;

    background-color: #080f1b;
    background-image: url('./assets/images/bg.webp');
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;

    > *:last-child {
        position: relative;
        z-index: 2;
    }

    > .tech-stack {
        z-index: 20;
    }

    @media (max-width: 768px) {
        padding: 100px 16px 32px;
    }
}
</style>
