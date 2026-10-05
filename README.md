# Multi-Tenant Project Management & Collaboration System (MERN Stack)

A production-grade, real-time SaaS project management application built on the **MERN Stack** (**MongoDB**, **Express.js**, **React**, **Node.js**) with JavaScript, Socket.IO, and Tailwind CSS.

---

## 🏗️ Architecture (MERN Stack)

* **M — MongoDB & Mongoose:**
  * Multi-tenant data models with composite B-Tree indexes and text indexes.
  * Auto-reconnecting database layer with embedded zero-config fallback.
* **E — Express.js:**
  * Clean Controller-Service-Middleware architecture.
  * Server-side RBAC validation and organization tenant resolution (`x-organization-id`).
* **R — React 18 & JavaScript:**
  * Interactive Kanban board with drag-and-drop.
  * Real-time WebSocket synchronization, debounced multi-filter search, and compliance audit trail UI.
* **N — Node.js & Socket.IO:**
  * Real-time bidirectional event streaming across project rooms and private notification channels.

---

## 🌟 Key Features

1. **Multi-Tenant Organization Structure**
   * Users can belong to multiple organizations (e.g. Rahul belongs to Company A as OWNER and Company B as MEMBER).
   * Strict tenant data isolation enforced server-side.
   * Four distinct roles: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`.

2. **Server-Side RBAC Enforcement**
   * Security is verified strictly at the controller/middleware level.
   * **VIEWER**: Read-only access to projects, tasks, and comments. Cannot create, edit, or drag cards.
   * **MEMBER**: Can create tasks, edit tasks assigned to or created by them, and write comments.
   * **ADMIN**: Can manage projects, invite/remove members, and delete tasks.
   * **OWNER**: Full administrative control across the organization.

3. **Kanban Board & Real-Time Collaboration**
   * Columns: `TODO`, `IN PROGRESS`, `REVIEW`, `DONE`.
   * Drag-and-drop card movement with instant MongoDB persistence.
   * **Socket.IO Real-Time Sync**: When any user moves, updates, or adds a task, all users viewing that project see the changes live without page refresh.

4. **Searchable & Filterable Audit Trail**
   * Records every critical change: `TASK_CREATE`, `STATUS_CHANGE`, `ASSIGN_CHANGE`, `PRIORITY_CHANGE`, `TASK_DELETE`, `MEMBER_ADD`, `MEMBER_REMOVE`, `PROJECT_CREATE`.
   * Stores `user`, `organization`, `action`, `entity`, `entityId`, `oldValue`, `newValue`, and `timestamp`.
   * Filterable audit page for `ADMIN` and `OWNER`.

5. **Advanced Search with Combined Filters & Debouncing**
   * Multi-field filtering: `status`, `priority`, `assignee`, `dueDateBefore`, `labels`, and free text search.
   * Frontend debouncing (300ms) on text search.
   * Pagination (`page` and `limit`) to safely handle 100k records.

6. **Real-Time Notification Center**
   * Triggers live alerts on task assignment, status updates, `@mentions` inside task comments, and organization invitations.
   * In-app notification center with live unread badge, quick "mark as read", and "mark all read".

---

## 🔑 Demo Test Accounts (1-Click Switch in UI)

| Name | Email | Password | Role in Company A | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Rahul Sharma** | `owner@example.com` | `password123` | **OWNER** | Full control, audit logs, manage all tasks/members |
| **Priya Patel** | `admin@example.com` | `password123` | **ADMIN** | Manage projects, invite/remove members, delete tasks |
| **Amit Verma** | `member@example.com` | `password123` | **MEMBER** | Create tasks, edit assigned tasks, comment |
| **Neha Singh** | `viewer@example.com` | `password123` | **VIEWER** | Read-only view. Creation, editing, and deletion blocked |

---

## ⚡ MongoDB Performance & Indexing Strategy (100k Tasks Scale)

To support **100,000 tasks, 10,000 users, and 1,000 organizations**, the MongoDB schema incorporates compound B-Tree and text indexes tailored to specific query patterns:

### 1. Mongoose Indexes:
* `TaskSchema.index({ organizationId: 1 })`
  * **Rationale:** Guarantees `O(log N)` tenant isolation filtering on every task query (`{ organizationId }`) rather than full collection scans (`COLLSCAN`).
* `TaskSchema.index({ projectId: 1, status: 1 })`
  * **Rationale:** The Kanban board query always fetches tasks by `projectId` grouped by `status`. This compound index satisfies both equality matches simultaneously without in-memory sorting.
* `TaskSchema.index({ organizationId: 1, status: 1 })`
  * **Rationale:** Powers organization-wide status summaries and dashboards.
* `TaskSchema.index({ assigneeId: 1 })`
  * **Rationale:** Accelerates "Assigned to me" task queries and relation lookups.
* `TaskSchema.index({ dueDate: 1 })`
  * **Rationale:** Enables fast range scanning (`dueDate: { $lte: date }`) for deadline reminders and filters.
* `TaskSchema.index({ title: 'text', description: 'text' })`
  * **Rationale:** Full-text search index allows rapid keyword searches across 100k tasks without expensive regex scans.
* `AuditLogSchema.index({ organizationId: 1, timestamp: -1 })`
  * **Rationale:** Audit logs grow continuously. Querying recent audit logs for an organization performs an index-assisted reverse scan, avoiding memory-intensive sorting.
* `NotificationSchema.index({ userId: 1, isRead: 1 })`
  * **Rationale:** Optimizes unread notification counts and badge fetching (`{ userId, isRead: false }`).

### 2. Elimination of N+1 Queries:
* Relational joins (e.g. user details on tasks and comments) use Mongoose's `.populate({ path: 'assigneeId', select: 'id name email avatar' })`.
* This performs a single batched `$in` lookup on the `users` collection rather than executing individual queries per task.

### 3. Pagination & Query Bounds:
* Endpoints utilize `.skip()` and `.limit()` (capped at 100 max records).
* `Promise.all([Task.countDocuments(query), Task.find(query)...])` executes the count and dataset retrieval concurrently.

### 4. Search Debouncing:
* The client applies a **300ms debounce** to the search input, avoiding flooding the server on every keystroke.

---

## 📡 Required REST API Specification

### Organizations & Members
| Method | Endpoint | Description | Minimum Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/organizations` | Create a new organization | Any Authenticated User |
| `GET` | `/api/organizations` | List all organizations current user belongs to | Authenticated User |
| `GET` | `/api/organizations/:id` | Get organization details and member roster | Member of Org |
| `POST` | `/api/organizations/:id/members` | Add a member to organization with role | `ADMIN` / `OWNER` |
| `DELETE` | `/api/organizations/:id/members/:userId` | Remove a member from organization | `ADMIN` / `OWNER` |

### Projects
| Method | Endpoint | Description | Minimum Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/projects` | Create a new project | `ADMIN` / `OWNER` |
| `GET` | `/api/projects` | List projects for an organization | `VIEWER` |
| `GET` | `/api/projects/:id` | Get project details and all tasks | `VIEWER` |

### Tasks & Comments
| Method | Endpoint | Description | Minimum Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/tasks` | Create task, notify assignee, emit socket | `MEMBER` |
| `GET` | `/api/tasks` | Filter & search tasks with pagination | `VIEWER` |
| `GET` | `/api/tasks/:id` | Get task details, comments, and audit history | `VIEWER` |
| `PUT` | `/api/tasks/:id` | Update task, record audit log, emit socket | `MEMBER` (assigned/creator) / `ADMIN` |
| `DELETE` | `/api/tasks/:id` | Delete task, record audit log, emit socket | `ADMIN` / `OWNER` |
| `POST` | `/api/tasks/:id/comments` | Add comment, notify @mentions | `MEMBER` |

### Audit Logs & Notifications
| Method | Endpoint | Description | Minimum Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/audit-logs` | Filterable and searchable audit log trail | `ADMIN` / `OWNER` |
| `GET` | `/api/notifications` | Get user notifications with unread count | Authenticated User |
| `PATCH` | `/api/notifications/:id/read` | Mark a notification as read | Authenticated User |
| `POST` | `/api/notifications/mark-all-read` | Mark all notifications read | Authenticated User |

---

## 🔌 WebSocket Events Reference

| Event Name | Scope / Room | Direction | Payload Description |
| :--- | :--- | :--- | :--- |
| `join_project` | Project Room | Client ➔ Server | Joins `project:${projectId}` room |
| `leave_project` | Project Room | Client ➔ Server | Leaves `project:${projectId}` room |
| `task_created` | `project:${projectId}` | Server ➔ Clients | Full task object for real-time card addition |
| `task_updated` | `project:${projectId}` | Server ➔ Clients | Updated task object for instant card move/edit |
| `task_deleted` | `project:${projectId}` | Server ➔ Clients | `{ id, projectId }` to remove card across screens |
| `new_notification` | `user:${userId}` | Server ➔ Client | Notification alert for live toast/badge |
