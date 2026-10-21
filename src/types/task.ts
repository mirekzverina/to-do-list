export type TaskStatus = 'open' | 'progress' | 'done';

export type TaskCategory =
    | 'general'
    | 'blue'
    | 'mint'
    | 'purple'
    | 'coral'
    | 'design'
    | 'development'
    | 'content'
    | 'planning'
    | 'configuration'
    | 'general';

export interface Task {
    id: string;
    title: string;
    status: TaskStatus;
    category: TaskCategory;
    order: number;
}

export interface TaskColumnConfig {
    id: TaskStatus;
    title: string;
    description: string;
}
