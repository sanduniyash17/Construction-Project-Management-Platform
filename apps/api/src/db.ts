import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const databasePath = join(dirname(fileURLToPath(import.meta.url)), "../data/buildflow.db");
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Invited',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    reorder_at REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount >= 0),
    expense_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    owner TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'In review',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const projectCount = db.prepare("SELECT COUNT(*) AS count FROM projects").get() as { count: number };
if (projectCount.count === 0) {
  const insertProject = db.prepare("INSERT INTO projects (name, status, progress) VALUES (?, ?, ?)");
  const insertTask = db.prepare("INSERT INTO tasks (title, project_id, status, priority) VALUES (?, ?, ?, ?)");
  const seed = db.transaction(() => {
    const riverside = insertProject.run("Riverside Office Complex", "In progress", 72).lastInsertRowid;
    const northpoint = insertProject.run("Northpoint Distribution Center", "In progress", 48).lastInsertRowid;
    const cedar = insertProject.run("Cedar Avenue Renovation", "On hold", 31).lastInsertRowid;
    const lakeside = insertProject.run("Lakeside Medical Pavilion", "Planning", 8).lastInsertRowid;
    insertProject.run("Westfield Retail Fit-out", "Completed", 100);

    insertTask.run("Approve concrete pour schedule", riverside, "In progress", "High");
    insertTask.run("Upload revised structural drawings", northpoint, "To do", "Medium");
    insertTask.run("Resolve material delivery delay", cedar, "Blocked", "High");
    insertTask.run("Complete electrical inspection", lakeside, "Done", "Medium");
    insertTask.run("Confirm site safety walk-through", riverside, "To do", "Low");
  });
  seed();
}
