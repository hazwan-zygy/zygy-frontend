// server/storage/index.ts
import { JsonStorage } from "./json";
import { MemStorage, IStorage } from "./memory";

export const storage: IStorage =
  process.env.NODE_ENV === "development"
    ? new JsonStorage()               // persists across restarts
    : new MemStorage();               // or still use in-memory