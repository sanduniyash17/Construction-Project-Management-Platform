import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projects = [
    { name: "Riverside Office Complex", status: "In progress", progress: 72 },
    { name: "Northpoint Distribution Center", status: "In progress", progress: 48 },
    { name: "Cedar Avenue Renovation", status: "On hold", progress: 31 },
    { name: "Lakeside Medical Pavilion", status: "Planning", progress: 8 },
    { name: "Westfield Retail Fit-out", status: "Completed", progress: 100 },
  ];

  for (const project of projects) {
    const existingProject = await prisma.project.findFirst({
      where: { name: project.name },
      orderBy: { id: "asc" },
    });
    if (existingProject) {
      await prisma.project.update({ where: { id: existingProject.id }, data: project });
    } else {
      await prisma.project.create({ data: project });
    }
  }

  const projectByName = new Map((await prisma.project.findMany()).map((project) => [project.name, project.id]));
  const tasks = [
    { title: "Approve concrete pour schedule", project: "Riverside Office Complex", assignee: "Maya Chen", dueDate: "2026-10-01", status: "In progress", priority: "High" },
    { title: "Upload revised structural drawings", project: "Northpoint Distribution Center", assignee: "Jordan Lee", dueDate: "2026-10-04", status: "To do", priority: "Medium" },
    { title: "Resolve material delivery delay", project: "Cedar Avenue Renovation", assignee: "Sam Rivera", dueDate: "2026-10-02", status: "Blocked", priority: "High" },
    { title: "Complete electrical inspection", project: "Lakeside Medical Pavilion", assignee: "Maya Chen", dueDate: "2026-10-03", status: "Done", priority: "Medium" },
    { title: "Confirm site safety walk-through", project: "Riverside Office Complex", assignee: "Alex Morgan", dueDate: "2026-10-05", status: "To do", priority: "Low" },
  ];

  for (const task of tasks) {
    const projectId = projectByName.get(task.project);
    if (!projectId) continue;
    const taskData = {
      title: task.title,
      projectId,
      assignee: task.assignee,
      dueDate: new Date(`${task.dueDate}T00:00:00.000Z`),
      status: task.status,
      priority: task.priority,
    };
    const existingTask = await prisma.task.findFirst({ where: { title: task.title, projectId } });
    if (existingTask) {
      await prisma.task.update({ where: { id: existingTask.id }, data: taskData });
    } else {
      await prisma.task.create({ data: taskData });
    }
  }
}

main().finally(() => prisma.$disconnect());
