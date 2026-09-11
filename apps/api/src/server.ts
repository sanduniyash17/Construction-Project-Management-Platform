import cors from "cors";
import express from "express";
import { z } from "zod";

const app = express();
const port = Number(process.env.PORT ?? 4000);

const paginationConfig = {
  defaultPage: 1,
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 25] as const,
};

const projects = [
  { id: 1, name: "Riverside Office Complex", status: "In progress", progress: 72 },
  { id: 2, name: "Northpoint Distribution Center", status: "In progress", progress: 48 },
  { id: 3, name: "Cedar Avenue Renovation", status: "On hold", progress: 31 },
  { id: 4, name: "Lakeside Medical Pavilion", status: "Planning", progress: 8 },
  { id: 5, name: "Westfield Retail Fit-out", status: "Completed", progress: 100 },
];

const tasks = [
  { id: 1, title: "Approve concrete pour schedule", projectId: 1, status: "In progress", priority: "High" },
  { id: 2, title: "Upload revised structural drawings", projectId: 2, status: "To do", priority: "Medium" },
  { id: 3, title: "Resolve material delivery delay", projectId: 3, status: "Blocked", priority: "High" },
  { id: 4, title: "Complete electrical inspection", projectId: 4, status: "Done", priority: "Medium" },
  { id: 5, title: "Confirm site safety walk-through", projectId: 1, status: "To do", priority: "Low" },
];

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
  response.json({ status: "ok", service: "buildflow-api" });
});

app.get("/api/config", (_request, response) => {
  response.json({ pagination: paginationConfig });
});

app.get("/api/projects", (request, response) => {
  const query = paginationQuery.parse(request.query);
  const search = query.search.toLowerCase();
  const filteredProjects = projects.filter((project) => project.name.toLowerCase().includes(search));
  response.json(paginate(filteredProjects, query.page, query.pageSize));
});

app.get("/api/tasks", (request, response) => {
  const query = paginationQuery.parse(request.query);
  const search = query.search.toLowerCase();
  const filteredTasks = tasks.filter((task) => task.title.toLowerCase().includes(search));
  response.json(paginate(filteredTasks, query.page, query.pageSize));
});

app.use((_request, response) => {
  response.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`BuildFlow API listening on http://localhost:${port}`);
});
