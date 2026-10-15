import type { Task } from '../types/task';

export const defaultTasks: Task[] = [
    {
        id: '1',
        title: 'Design new landing page',
        status: 'open',
        category: 'design',
        order: 0,
    },
    {
        id: '4',
        title: 'Build Vue components',
        status: 'progress',
        category: 'development',
        order: 0,
    },
    {
        id: '5',
        title: 'Add drag & drop',
        status: 'progress',
        category: 'development',
        order: 1,
    },
    {
        id: '6',
        title: 'Project setup',
        status: 'done',
        category: 'configuration',
        order: 0,
    },
];
