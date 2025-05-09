import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs/promises";

export async function registerRoutes(app: Express): Promise<Server> {
  // Static route to serve attached assets
  app.get("/attached_assets/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), "attached_assets", filename);
      
      // Check if file exists
      await fs.access(filePath);
      
      // Serve the file
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).send("File not found");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
