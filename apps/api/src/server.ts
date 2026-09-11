import cors from "cors";
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
  const query = paginationQuery.parse(request.query);
  const where = query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : undefined;
  const totalItems = await prisma.project.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
  const safePage = Math.min(query.page, totalPages);
  const projects = await prisma.project.findMany({
    where,
    select: { id: true, name: true, status: true, progress: true },
    orderBy: { id: "asc" },
    skip: (safePage - 1) * query.pageSize,
    take: query.pageSize,
  });
  response.json(paginate(projects, safePage, query.pageSize, totalItems));
});

app.get("/api/tasks", async (request, response) => {
  const query = paginationQuery.parse(request.query);
  const where = query.search ? { title: { contains: query.search, mode: "insensitive" as const } } : undefined;
  const totalItems = await prisma.task.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
  const safePage = Math.min(query.page, totalPages);
  const tasks = await prisma.task.findMany({
    where,
    select: { id: true, title: true, projectId: true, status: true, priority: true },
    orderBy: { id: "asc" },
    skip: (safePage - 1) * query.pageSize,
    take: query.pageSize,
  });
  response.json(paginate(tasks, safePage, query.pageSize, totalItems));
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
