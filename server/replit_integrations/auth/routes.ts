import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { storage } from "../../storage";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  const isDemoMode = !process.env.REPL_ID || process.env.REPL_ID === 'demo-repl-id';

  if (isDemoMode) {
    // Demo mode: Return mock user without authentication
    app.get("/api/auth/user", async (req, res) => {
      res.status(401).json({ message: "Demo mode - No authentication configured" });
    });

    app.get("/api/login", (req, res) => {
      res.send(`
        <html>
          <body style="font-family: sans-serif; max-width: 600px; margin: 100px auto; text-align: center;">
            <h1>🚀 Demo Mode</h1>
            <p>This application is running in demo mode without authentication.</p>
            <p>To enable full authentication, configure:</p>
            <ul style="text-align: left; display: inline-block;">
              <li><code>REPL_ID</code> - Your Replit project ID</li>
              <li><code>DATABASE_URL</code> - PostgreSQL connection string</li>
              <li><code>SESSION_SECRET</code> - Secure session secret</li>
            </ul>
            <br><br>
            <a href="/" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Public Content
            </a>
          </body>
        </html>
      `);
    });

    app.get("/api/logout", (req, res) => {
      res.redirect("/");
    });
    return;
  }

  // Get current authenticated user with role
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const role = await storage.getUserRole(userId);
      res.json({ ...user, role });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
