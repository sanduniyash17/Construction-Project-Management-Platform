import cors from "cors";
import "dotenv/config";
import express from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const prisma = new PrismaClient();

const paginationConfig = {
  defaultPage: 1,
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 25] as const,
};

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(paginationConfig.defaultPage),
  pageSize: z.coerce.number().pipe(z.union([z.literal(5), z.literal(10), z.literal(25)])).default(10),
  search: z.string().trim().default(""),
  status: z.string().trim().default(""),
});

const createProjectSchema = z.object({
  name: z.string().trim().min(2),
  client: z.string().trim().min(2),
  location: z.string().trim().min(2),
  budget: z.number().finite().nonnegative(),
  dueDate: z.iso.date(),
});

const updateProjectSchema = z.object({
  name: z.string().trim().min(2),
  client: z.union([z.string().trim(), z.null()]).transform((value) => value || null),
  location: z.union([z.string().trim(), z.null()]).transform((value) => value || null),
  budget: z.number().finite().nonnegative().nullable(),
  dueDate: z.union([z.iso.date(), z.literal(""), z.null()]).transform((value) => value || null),
  status: z.enum(["Planning", "In progress", "On hold", "Completed"]),
  progress: z.number().int().min(0).max(100),
});

const projectQuery = paginationQuery.extend({
  sortBy: z.enum(["name", "status", "progress", "budget", "dueDate"]).default("name"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
});

const taskStatus = z.enum(["To do", "In progress", "Blocked", "Done"]);
const taskPriority = z.enum(["Low", "Medium", "High"]);

const createTaskSchema = z.object({
  title: z.string().trim().min(2),
  projectId: z.number().int().positive(),
  assignee: z.string().trim().min(2),
  dueDate: z.iso.date(),
  priority: taskPriority,
});

type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

function paginate<T>(items: T[], page: number, pageSize: number, totalItems: number): PaginatedResponse<T> {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  return {
    data: items,
    pagination: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "buildflow-api", database: "postgresql" });
});

app.get("/api/config", (_request, response) => {
  response.json({ pagination: paginationConfig });
});

app.get("/api/projects", async (request, response) => {
  const query = projectQuery.parse(request.query);
  const where = { ...(query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : {}), ...(query.status ? { status: query.status } : {}) };
  const totalItems = await prisma.project.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
  const safePage = Math.min(query.page, totalPages);
  const projects = await prisma.project.findMany({
    where,
    select: { id: true, name: true, client: true, location: true, budget: true, dueDate: true, status: true, progress: true },
    orderBy: { [query.sortBy]: query.sortDirection },
    skip: (safePage - 1) * query.pageSize,
    take: query.pageSize,
  });
  response.json(paginate(projects, safePage, query.pageSize, totalItems));
});

app.get("/api/projects/options", async (_request, response) => {
  const projects = await prisma.project.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  response.json(projects);
});

app.get("/api/projects/:id", async (request, response) => {
  const id = z.coerce.number().int().positive().safeParse(request.params.id);
  if (!id.success) {
    response.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const project = await prisma.project.findUnique({
    where: { id: id.data },
    include: {
      tasks: { orderBy: { id: "desc" } },
      teamMembers: { orderBy: { name: "asc" } },
      materials: { orderBy: { name: "asc" } },
      expenses: { orderBy: { expenseDate: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) {
    response.status(404).json({ error: "Project not found" });
    return;
  }
  response.json(project);
});

app.post("/api/projects", async (request, response) => {
  const result = createProjectSchema.safeParse(request.body);
  if (!result.success) {
    response.status(400).json({ error: "Invalid project details", details: result.error.flatten() });
    return;
  }

  const project = await prisma.project.create({
    data: {
      ...result.data,
      dueDate: new Date(`${result.data.dueDate}T00:00:00.000Z`),
      status: "Planning",
      progress: 0,
    },
    select: { id: true, name: true, client: true, location: true, budget: true, dueDate: true, status: true, progress: true },
  });
  response.status(201).json(project);
});

app.put("/api/projects/:id", async (request, response) => {
  const id = z.coerce.number().int().positive().safeParse(request.params.id);
  const result = updateProjectSchema.safeParse(request.body);
  if (!id.success || !result.success) {
    response.status(400).json({ error: "Invalid project details", details: result.success ? undefined : result.error.flatten() });
    return;
  }

  const exists = await prisma.project.findUnique({ where: { id: id.data }, select: { id: true } });
  if (!exists) {
    response.status(404).json({ error: "Project not found" });
    return;
  }

  const project = await prisma.project.update({
    where: { id: id.data },
    data: { ...result.data, dueDate: result.data.dueDate ? new Date(`${result.data.dueDate}T00:00:00.000Z`) : null },
    select: { id: true, name: true, client: true, location: true, budget: true, dueDate: true, status: true, progress: true },
  });
  response.json(project);
});

app.get("/api/tasks", async (request, response) => {
  const query = paginationQuery.parse(request.query);
  const where = {
    ...(query.search ? {
      OR: [
        { title: { contains: query.search, mode: "insensitive" as const } },
        { assignee: { contains: query.search, mode: "insensitive" as const } },
        { project: { name: { contains: query.search, mode: "insensitive" as const } } },
      ],
    } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const totalItems = await prisma.task.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
  const safePage = Math.min(query.page, totalPages);
  const tasks = await prisma.task.findMany({
    where,
    select: { id: true, title: true, projectId: true, assignee: true, dueDate: true, status: true, priority: true, project: { select: { name: true } } },
    orderBy: [{ dueDate: "asc" }, { id: "asc" }],
    skip: (safePage - 1) * query.pageSize,
    take: query.pageSize,
  });
  response.json(paginate(tasks, safePage, query.pageSize, totalItems));
});

app.post("/api/tasks", async (request, response) => {
  const result = createTaskSchema.safeParse(request.body);
  if (!result.success) {
    response.status(400).json({ error: "Invalid task details", details: result.error.flatten() });
    return;
  }

  const projectExists = await prisma.project.findUnique({ where: { id: result.data.projectId }, select: { id: true } });
  if (!projectExists) {
    response.status(400).json({ error: "Selected project does not exist." });
    return;
  }

  const task = await prisma.task.create({
    data: { ...result.data, dueDate: new Date(`${result.data.dueDate}T00:00:00.000Z`), status: "To do" },
    select: { id: true, title: true, projectId: true, assignee: true, dueDate: true, status: true, priority: true, project: { select: { name: true } } },
  });
  response.status(201).json(task);
});

app.patch("/api/tasks/:id/status", async (request, response) => {
  const id = z.coerce.number().int().positive().safeParse(request.params.id);
  const status = taskStatus.safeParse(request.body?.status);
  if (!id.success || !status.success) {
    response.status(400).json({ error: "Invalid task status update." });
    return;
  }

  const exists = await prisma.task.findUnique({ where: { id: id.data }, select: { id: true } });
  if (!exists) {
    response.status(404).json({ error: "Task not found." });
    return;
  }
  const task = await prisma.task.update({
    where: { id: id.data },
    data: { status: status.data },
    select: { id: true, title: true, projectId: true, assignee: true, dueDate: true, status: true, priority: true, project: { select: { name: true } } },
  });
  response.json(task);
});

app.use((_request, response) => {
  response.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`BuildFlow API listening on http://localhost:${port}`);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
});
