import cors from "cors";
import express from "express";
import { z } from "zod";
import { db } from "./db.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

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

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResponse<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    data: items.slice(start, start + pageSize),
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
  response.json({ status: "ok", service: "buildflow-api", database: "sqlite" });
});

app.get("/api/config", (_request, response) => {
  response.json({ pagination: paginationConfig });
});

app.get("/api/projects", (request, response) => {
  const query = paginationQuery.parse(request.query);
  const search = query.search.toLowerCase();
  const filteredProjects = db.prepare(`
    SELECT id, name, status, progress
    FROM projects
    WHERE LOWER(name) LIKE @search
    ORDER BY id ASC
  `).all({ search: `%${search}%` });
  response.json(paginate(filteredProjects, query.page, query.pageSize));
});

app.get("/api/tasks", (request, response) => {
  const query = paginationQuery.parse(request.query);
  const search = query.search.toLowerCase();
  const filteredTasks = db.prepare(`
    SELECT id, title, project_id AS projectId, status, priority
    FROM tasks
    WHERE LOWER(title) LIKE @search
    ORDER BY id ASC
  `).all({ search: `%${search}%` });
  response.json(paginate(filteredTasks, query.page, query.pageSize));
});

app.use((_request, response) => {
  response.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`BuildFlow API listening on http://localhost:${port}`);
});
