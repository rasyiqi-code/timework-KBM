# Timework

**Protocol-Driven Project Management**

Timework is a monorepo application designed to manage projects through defined protocols (SOPs). It enforces standardized workflows while providing flexibility where needed.

## Tech Stack
-   **Framework**: Next.js 16 (App Router)
-   **Language**: TypeScript
-   **Database**: PostgreSQL + Prisma
-   **Styling**: Tailwind CSS, Shadcn UI
-   **Charts**: Recharts
-   **Workspace**: Turborepo

## Key Features

### 📊 Insight Dashboard
Real-time analytics to monitor organization performance:
-   **Project Status Distribution**: Pie charts showing Active vs Completed projects.
-   **Protocol Usage**: Bar charts identifying most popular SOPs.
-   **Team Performance**: Track average task duration by assignee to identify bottlenecks and efficiency.

### 📜 Protocol Management
Define strict Standard Operating Procedures (SOPs):
-   **Templating**: Create reusable project structures with Tasks, Notes, and Groups.
-   **Dependencies**: Enforce task order (e.g., Task B cannot start until Task A is done).
-   **Conditional Logic**: Configure "Allow Skip" permissions per item to handle edge cases.

### 🚀 Project Execution
-   **Status Tracking**: Granular states (LOCKED, OPEN, IN_PROGRESS, DONE).
-   **Role-Based Access**: Secure permissions for Admins, Managers, and Staff.
-   **File Management**: Required file uploads for specific tasks.

### 📂 File Manager & Data Safety
-   **File Explorer**: Integrated file manager with breadcrumb navigation and grid/list views.
-   **Soft Delete**: Projects are marked as deleted initially (recoverable), preventing accidental data loss.
-   **Permanent Delete**: Admin-only capability to permanently remove projects and their associated files from Cloudflare R2 storage.

## Getting Started

### Prerequisites
-   Node.js 18+
-   pnpm (`npm i -g pnpm`)
-   PostgreSQL Database

### Installation

1.  **Install dependencies**:
    ```bash
    pnpm install
    ```

2.  **Setup Environment**:
    Copy `.env.example` to `.env` and set your `DATABASE_URL`.

3.  **Database Setup**:
    ```bash
    pnpm db:push
    ```

4.  **Run Development Server**:
    ```bash
    pnpm dev
    ```

## Project Structure
-   `apps/web`: The main Next.js web application.
-   `packages/database`: Shared Prisma database schema and client.
-   `packages/project-service`: Core business logic and validations.
-   `packages/config`: Shared configurations (eslint, typescript).

## Script Commands
-   `pnpm dev`: Start all apps in watch mode.
-   `pnpm build`: Build all apps and packages.
-   `pnpm lint`: Lint all codebases.
