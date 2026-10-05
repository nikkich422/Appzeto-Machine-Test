import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';
import { User } from './models/User.js';
import { Organization } from './models/Organization.js';
import { OrganizationMember } from './models/OrganizationMember.js';
import { Project } from './models/Project.js';
import { Task } from './models/Task.js';
import { Comment } from './models/Comment.js';
import { AuditLog } from './models/AuditLog.js';
import { Notification } from './models/Notification.js';

dotenv.config();

export async function seedDatabase() {
  console.log('🌱 Seeding MongoDB database...');

  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    OrganizationMember.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
    AuditLog.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Users
  const [userOwner, userAdmin, userMember, userViewer] = await User.create([
    {
      name: 'Rahul Sharma',
      email: 'owner@example.com',
      password: passwordHash,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Priya Patel',
      email: 'admin@example.com',
      password: passwordHash,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Amit Verma',
      email: 'member@example.com',
      password: passwordHash,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Neha Singh',
      email: 'viewer@example.com',
      password: passwordHash,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
    },
  ]);

  console.log('✓ Users created');

  // 2. Organizations
  const [companyA, companyB] = await Organization.create([
    { name: 'Company A', slug: 'company-a' },
    { name: 'Company B', slug: 'company-b' },
  ]);

  console.log('✓ Organizations created');

  // 3. Organization Memberships
  await OrganizationMember.create([
    { organizationId: companyA._id, userId: userOwner._id, role: 'OWNER' },
    { organizationId: companyA._id, userId: userAdmin._id, role: 'ADMIN' },
    { organizationId: companyA._id, userId: userMember._id, role: 'MEMBER' },
    { organizationId: companyA._id, userId: userViewer._id, role: 'VIEWER' },
    { organizationId: companyB._id, userId: userAdmin._id, role: 'OWNER' },
    { organizationId: companyB._id, userId: userOwner._id, role: 'MEMBER' },
  ]);

  console.log('✓ Memberships created');

  // 4. Projects
  const [project1, project2, project3] = await Project.create([
    {
      name: 'Project 1: SaaS Cloud Architecture',
      description: 'Core microservices, multi-tenant database partitioning, and real-time event streaming.',
      organizationId: companyA._id,
    },
    {
      name: 'Project 2: Mobile App MVP',
      description: 'Cross-platform mobile application with offline-first sync.',
      organizationId: companyA._id,
    },
    {
      name: 'Project 3: Enterprise AI Analytics',
      description: 'Predictive analytics pipeline and reporting dashboard.',
      organizationId: companyB._id,
    },
  ]);

  console.log('✓ Projects created');

  // 5. Tasks
  const [taskA, taskB, taskC, taskD, taskE] = await Task.create([
    {
      title: 'Task A: Database Indexing & Optimization',
      description: 'Implement composite indexes on (projectId, status) and (organizationId, status) for 100k records.',
      status: 'TODO',
      priority: 'HIGH',
      order: 0,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      labels: 'backend,mongodb,indexes',
      projectId: project1._id,
      organizationId: companyA._id,
      creatorId: userOwner._id,
      assigneeId: userMember._id,
    },
    {
      title: 'Task B: WebSocket Real-Time Synchronization',
      description: 'Broadcast card drag events via Socket.IO project rooms without page refresh.',
      status: 'TODO',
      priority: 'URGENT',
      order: 1,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      labels: 'websocket,realtime,collaboration',
      projectId: project1._id,
      organizationId: companyA._id,
      creatorId: userAdmin._id,
      assigneeId: userAdmin._id,
    },
    {
      title: 'Task C: Server-Side RBAC Enforcement',
      description: 'Enforce OWNER, ADMIN, MEMBER, VIEWER role checks at the controller level.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      order: 0,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      labels: 'security,rbac,auth',
      projectId: project1._id,
      organizationId: companyA._id,
      creatorId: userOwner._id,
      assigneeId: userMember._id,
    },
    {
      title: 'Task D: Comprehensive Audit Trail System',
      description: 'Record oldValue, newValue, userId, and timestamps for all task changes.',
      status: 'REVIEW',
      priority: 'MEDIUM',
      order: 0,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      labels: 'audit,logging,compliance',
      projectId: project1._id,
      organizationId: companyA._id,
      creatorId: userAdmin._id,
      assigneeId: userAdmin._id,
    },
    {
      title: 'Task E: Multi-Filter Search & Pagination API',
      description: 'Support search with status, priority, assignee, due date, and debounced text querying.',
      status: 'DONE',
      priority: 'LOW',
      order: 0,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      labels: 'api,search,pagination',
      projectId: project1._id,
      organizationId: companyA._id,
      creatorId: userOwner._id,
      assigneeId: userMember._id,
    },
  ]);

  console.log('✓ Tasks created');

  // 6. Comments
  await Comment.create([
    {
      content: 'I have started testing the indexing with 10k rows. @Rahul Sharma please review.',
      taskId: taskA._id,
      userId: userMember._id,
    },
    {
      content: 'Looks promising! Let us make sure pagination avoids N+1 queries.',
      taskId: taskA._id,
      userId: userOwner._id,
    },
  ]);

  // 7. Audit Logs
  await AuditLog.create([
    {
      userId: userOwner._id,
      organizationId: companyA._id,
      action: 'TASK_CREATE',
      entity: 'Task',
      entityId: taskA._id.toString(),
      newValue: JSON.stringify({ title: taskA.title, status: 'TODO', priority: 'HIGH' }),
    },
    {
      userId: userMember._id,
      organizationId: companyA._id,
      action: 'STATUS_CHANGE',
      entity: 'Task',
      entityId: taskC._id.toString(),
      oldValue: JSON.stringify({ status: 'TODO' }),
      newValue: JSON.stringify({ status: 'IN_PROGRESS' }),
    },
    {
      userId: userMember._id,
      organizationId: companyA._id,
      action: 'STATUS_CHANGE',
      entity: 'Task',
      entityId: taskE._id.toString(),
      oldValue: JSON.stringify({ status: 'REVIEW' }),
      newValue: JSON.stringify({ status: 'DONE' }),
    },
  ]);

  // 8. Notifications
  await Notification.create([
    {
      userId: userMember._id,
      organizationId: companyA._id,
      title: 'Task Assigned',
      message: `You were assigned task "${taskA.title}".`,
      type: 'TASK_ASSIGNED',
      link: `/tasks/${taskA._id}`,
      isRead: false,
    },
    {
      userId: userOwner._id,
      organizationId: companyA._id,
      title: 'Mentioned in Comment',
      message: 'Amit Verma mentioned you in a comment on Task A.',
      type: 'MENTION',
      link: `/tasks/${taskA._id}`,
      isRead: false,
    },
    {
      userId: userMember._id,
      organizationId: companyA._id,
      title: 'Welcome to Company A',
      message: 'You have been added to Company A as a MEMBER.',
      type: 'ORG_ADDED',
      link: `/organizations/${companyA._id}`,
      isRead: true,
    },
  ]);

  console.log('✅ MongoDB seeded successfully!');
}

if (process.argv[1]?.includes('seed')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    await disconnectDB();
    process.exit(0);
  })();
}
