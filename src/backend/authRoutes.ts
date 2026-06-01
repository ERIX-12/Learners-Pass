import { Express } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";

type User = {
  id: string;
  email: string;
  passwordHash: string;
};

type DBData = {
  users: User[];
};

const dbFile = path.resolve(process.cwd(), "db.json");
const adapter = new JSONFile<DBData>(dbFile);
const db = new Low<DBData>(adapter, { users: [] });

// Initialize DB with defaults if empty
await db.read();
if (!db.data) {
  db.data = { users: [] };
  await db.write();
}

export function registerAuthRoutes(app: Express) {
  const secret = process.env.JWT_SECRET || "default_secret";

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      await db.read();
      const existing = db.data!.users.find((u) => u.email === email);
      if (existing) {
        return res.status(409).json({ error: "User already exists" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser: User = { id: Date.now().toString(), email, passwordHash };
      db.data!.users.push(newUser);
      await db.write();
      const token = jwt.sign({ id: newUser.id, email }, secret, { expiresIn: "7d" });
      res.json({ token });
    } catch (err) {
      console.error("Signup error", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      await db.read();
      const user = db.data!.users.find((u) => u.email === email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = jwt.sign({ id: user.id, email }, secret, { expiresIn: "7d" });
      res.json({ token });
    } catch (err) {
      console.error("Login error", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
