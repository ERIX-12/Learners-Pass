import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";

export type User = {
  email: string;
  passwordHash: string;
};

type Schema = {
  users: User[];
};

// Initialize lowdb
const file = path.join(process.cwd(), "db.json");
const adapter = new JSONFile<Schema>(file);
const db = new Low<Schema>(adapter, { users: [] });
await db.read();
// Set defaults if file empty
if (!db.data) {
  db.data = { users: [] };
  await db.write();
}

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const JWT_EXPIRES_IN = "7d";

export async function signUp(email: string, password: string) {
  await db.read();
  const exists = db.data!.users.find(u => u.email === email);
  if (exists) {
    throw new Error("User already exists");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  db.data!.users.push({ email, passwordHash });
  await db.write();
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return token;
}

export async function signIn(email: string, password: string) {
  await db.read();
  const user = db.data!.users.find(u => u.email === email);
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new Error("Invalid email or password");
  }
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return token;
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { email: string };
  } catch (e) {
    throw new Error("Invalid token");
  }
}
