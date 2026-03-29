
import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "sow-generator-secret-key-123";

// Initialize Database
const db = new Database("sow_cloud.db");

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    ownerEmail TEXT NOT NULL,
    sharedWith TEXT, -- JSON array of emails
    created TEXT NOT NULL,
    updated TEXT NOT NULL,
    FOREIGN KEY(ownerEmail) REFERENCES users(email)
  );

  CREATE TABLE IF NOT EXISTS line_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId INTEGER NOT NULL,
    room TEXT NOT NULL,
    item TEXT NOT NULL,
    trade TEXT NOT NULL,
    action TEXT NOT NULL,
    quantity REAL,
    unit TEXT,
    notes TEXT,
    specs TEXT,
    materialsNeeded TEXT,
    materialsProvidedBy TEXT,
    manualPrice REAL,
    needsVerification INTEGER DEFAULT 0,
    photos TEXT, -- JSON array of {base64, name}
    FOREIGN KEY(projectId) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS project_data (
    projectId INTEGER, -- NULL for global data
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY(projectId, key)
  );
`);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- Middleware: Auth ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API: Auth ---

app.post("/api/auth/register", async (req, res) => {
  const { email, name, role, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const stmt = db.prepare("INSERT INTO users (email, name, role, password) VALUES (?, ?, ?, ?)");
    stmt.run(email.toLowerCase(), name, role, hashedPassword);
    
    const token = jwt.sign({ email, name, role }, JWT_SECRET);
    res.json({ token, user: { email, name, role } });
  } catch (e) {
    res.status(400).json({ error: "User already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as any;

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ email: user.email, name: user.name, role: user.role }, JWT_SECRET);
  res.json({ token, user: { email: user.email, name: user.name, role: user.role } });
});

app.get("/api/users", authenticateToken, (req, res) => {
    const users = db.prepare("SELECT email, name, role FROM users").all() as any[];
    res.json(users);
});

// --- API: Projects ---

app.get("/api/projects", authenticateToken, (req: any, res) => {
  const email = req.user.email;
  const projects = db.prepare(`
    SELECT * FROM projects 
    WHERE ownerEmail = ? OR sharedWith LIKE ?
    ORDER BY updated DESC
  `).all(email, `%${email}%`) as any[];

  res.json(projects.map(p => ({
      ...p,
      sharedWith: p.sharedWith ? JSON.parse(p.sharedWith) : []
  })));
});

app.post("/api/projects", authenticateToken, (req: any, res) => {
  const { name, address } = req.body;
  const ownerEmail = req.user.email;
  const now = new Date().toISOString();

  const stmt = db.prepare("INSERT INTO projects (name, address, ownerEmail, sharedWith, created, updated) VALUES (?, ?, ?, ?, ?, ?)");
  const info = stmt.run(name, address, ownerEmail, JSON.stringify([]), now, now);
  
  res.json({ id: info.lastInsertRowid });
});

app.delete("/api/projects/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const email = req.user.email;
    
    // Check ownership
    const project = db.prepare("SELECT ownerEmail FROM projects WHERE id = ?").get(id) as any;
    if (!project || project.ownerEmail !== email) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    db.prepare("DELETE FROM line_items WHERE projectId = ?").run(id);
    db.prepare("DELETE FROM project_data WHERE projectId = ?").run(id);
    
    res.json({ success: true });
});

app.post("/api/projects/:id/share", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const { targetEmail } = req.body;
    
    const project = db.prepare("SELECT sharedWith FROM projects WHERE id = ?").get(id) as any;
    if (!project) return res.status(404).json({ error: "Project not found" });

    const sharedWith = JSON.parse(project.sharedWith || "[]");
    if (!sharedWith.includes(targetEmail)) {
        sharedWith.push(targetEmail);
        db.prepare("UPDATE projects SET sharedWith = ?, updated = ? WHERE id = ?").run(JSON.stringify(sharedWith), new Date().toISOString(), id);
    }
    
    res.json({ success: true });
});

// --- API: Line Items ---

app.get("/api/projects/:id/items", authenticateToken, (req, res) => {
    const { id } = req.params;
    const items = db.prepare("SELECT * FROM line_items WHERE projectId = ?").all(id) as any[];
    res.json(items.map(i => ({
        ...i,
        photos: i.photos ? JSON.parse(i.photos) : [],
        needsVerification: !!i.needsVerification
    })));
});

app.post("/api/projects/:id/items/bulk", authenticateToken, (req, res) => {
    const { id } = req.params;
    const items = req.body;
    const now = new Date().toISOString();

    const insert = db.prepare(`
        INSERT INTO line_items (
            projectId, room, item, trade, action, quantity, unit, notes, specs, 
            materialsNeeded, materialsProvidedBy, manualPrice, needsVerification, photos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((items) => {
        for (const item of items) {
            insert.run(
                id, item.room, item.item, item.trade, item.action, item.quantity, item.unit, 
                item.notes, item.specs, item.materialsNeeded, item.materialsProvidedBy, 
                item.manualPrice, item.needsVerification ? 1 : 0, JSON.stringify(item.photos || [])
            );
        }
        db.prepare("UPDATE projects SET updated = ? WHERE id = ?").run(now, id);
    });

    transaction(items);
    res.json({ success: true });
});

app.put("/api/items/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const item = req.body;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
        UPDATE line_items SET
            room = ?, item = ?, trade = ?, action = ?, quantity = ?, unit = ?, 
            notes = ?, specs = ?, materialsNeeded = ?, materialsProvidedBy = ?, 
            manualPrice = ?, needsVerification = ?, photos = ?
        WHERE id = ?
    `);

    stmt.run(
        item.room, item.item, item.trade, item.action, item.quantity, item.unit, 
        item.notes, item.specs, item.materialsNeeded, item.materialsProvidedBy, 
        item.manualPrice, item.needsVerification ? 1 : 0, JSON.stringify(item.photos || []),
        id
    );

    if (item.projectId) {
        db.prepare("UPDATE projects SET updated = ? WHERE id = ?").run(now, item.projectId);
    }

    res.json({ success: true });
});

app.delete("/api/items/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM line_items WHERE id = ?").run(id);
    res.json({ success: true });
});

// --- API: Project Data ---

app.get("/api/projects/:id/data", authenticateToken, (req, res) => {
    const { id } = req.params;
    const projectId = id === "null" ? null : id;
    const data = db.prepare("SELECT key, value FROM project_data WHERE projectId IS ?").all(projectId) as any[];
    
    const result: Record<string, any> = {};
    data.forEach(d => {
        try {
            result[d.key] = JSON.parse(d.value);
        } catch (e) {
            result[d.key] = d.value;
        }
    });
    res.json(result);
});

app.post("/api/projects/:id/data", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { key, value } = req.body;
    const projectId = id === "null" ? null : id;

    const stmt = db.prepare("INSERT OR REPLACE INTO project_data (projectId, key, value) VALUES (?, ?, ?)");
    stmt.run(projectId, key, JSON.stringify(value));
    
    res.json({ success: true });
});

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("/{*splat}", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
