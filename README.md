# To-Do List

An interactive To-Do List built as a frontend showcase project with Vue 3, TypeScript and SCSS.

The application combines drag-and-drop task management, smooth animations and a responsive glassmorphism interface in a modern Kanban-style layout.

## Live Demo

https://mirekzverina-to-do-list.netlify.app/

## Features

- Three-column task board: To Do, In Progress and Completed
- Drag-and-drop task management powered by SortableJS
- Create, edit and delete tasks
- Task categories with dedicated icons
- Automatic task persistence using localStorage
- Smooth task transitions and deletion animations
- Glassmorphism design with ambient particles and shooting stars
- Responsive layout for desktop, tablet and mobile
- Reduced-motion support for animations
- Built With technology stack popover
- Open Graph metadata for social sharing

## Tech Stack

- Vue 3
- TypeScript
- Vite
- SCSS
- SortableJS
- vue-draggable-plus
- Lucide Icons
- Simple Icons

## Getting Started

Clone the repository and install the dependencies:

```bash
git clone https://github.com/mirekzverina/to-do-list.git
cd to-do-list
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Project Structure

```text
public/
├── favicon.png
└── social-preview.png

src/
├── assets/
│   └── images/
├── components/
│   ├── AmbientParticles.vue
│   ├── ShootingStars.vue
│   ├── TaskBoard.vue
│   ├── TaskCard.vue
│   ├── TaskColumn.vue
│   └── TechStack.vue
├── data/
│   └── defaultTasks.ts
├── types/
│   └── task.ts
├── App.vue
└── main.ts
```

## Design

The project focuses on a modern, interactive task management experience with:

- dark glassmorphism surfaces and subtle transparency
- distinct accent colors for each task status
- smooth drag-and-drop interactions
- animated task cards and ambient visual effects
- responsive layouts across different screen sizes
- subtle lighting, gradients and visual depth

The three-column layout provides a clear visual overview of task progress while maintaining a consistent design language.

## Accessibility

The interface includes semantic buttons, descriptive labels for task actions, keyboard-accessible task editing and support for the user's reduced-motion preference.

Drag-and-drop task reordering is primarily designed for mouse and touch interaction.

## Author

**Mirek Zvěřina**  
Full-Stack Developer

Portfolio: https://mirekzverina.netlify.app/  
GitHub: https://github.com/mirekzverina  
LinkedIn: https://linkedin.com/in/mirekzverina
