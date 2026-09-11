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
    await prisma.project.upsert({
      where: { name: project.name },
      update: project,
      create: project,
    });
  }

  const projectByName = new Map((await prisma.project.findMany()).map((project) => [project.name, project.id]));
  const tasks = [
    { title: "Approve concrete pour schedule", project: "Riverside Office Complex", status: "In progress", priority: "High" },
    { title: "Upload revised structural drawings", project: "Northpoint Distribution Center", status: "To do", priority: "Medium" },
    { title: "Resolve material delivery delay", project: "Cedar Avenue Renovation", status: "Blocked", priority: "High" },
    { title: "Complete electrical inspection", project: "Lakeside Medical Pavilion", status: "Done", priority: "Medium" },
    { title: "Confirm site safety walk-through", project: "Riverside Office Complex", status: "To do", priority: "Low" },
  ];

  for (const task of tasks) {
    const projectId = projectByName.get(task.project);
    if (!projectId) continue;
    await prisma.task.upsert({
      where: { id: tasks.indexOf(task) + 1 },
      update: { title: task.title, projectId, status: task.status, priority: task.priority },
      create: { title: task.title, projectId, status: task.status, priority: task.priority },
    });
  }
}

main().finally(() => prisma.$disconnect());
