const { v4: uuidv4 } = require("uuid");
const { readDB, writeDB } = require("./dbHelper");
const { hashPassword } = require("./cryptoHelper");

const ADMIN_EMAIL = "admin@authapp.com";
const ADMIN_PASSWORD = "Admin@123";
const ADMIN_NAME = "Super Admin";

const DEFAULT_WIDGETS = [
  { componentName: "BarChart", name: "Bar Chart", description: "D3 bar chart visualization", defaultEnabled: true },
  { componentName: "LineChart", name: "Line Chart", description: "D3 line chart visualization", defaultEnabled: true },
  { componentName: "DonutChart", name: "Donut Chart", description: "D3 donut chart visualization", defaultEnabled: true },
  { componentName: "ScatterPlot", name: "Scatter Plot", description: "D3 scatter plot visualization", defaultEnabled: true },
];

async function seed() {
  const db = await readDB();

  let needsWrite = false;

  if (!db.departments) { db.departments = []; needsWrite = true; }
  if (!db.roles) { db.roles = []; needsWrite = true; }
  if (!db.userAssignments) { db.userAssignments = []; needsWrite = true; }
  if (!db.widgets) { db.widgets = []; needsWrite = true; }
  if (!db.permissions) { db.permissions = []; needsWrite = true; }
  if (!db.activityLogs) { db.activityLogs = []; needsWrite = true; }

  const adminExists = db.users.some(
    (u) => u.email === ADMIN_EMAIL && u.role === "admin"
  );

  if (!adminExists) {
    console.log("[Seed] Creating admin account...");
    const existing = db.users.find((u) => u.email === ADMIN_EMAIL);
    if (existing) {
      existing.role = "admin";
      existing.status = "VERIFIED";
    } else {
      const passwordHash = await hashPassword(ADMIN_PASSWORD);
      db.users.push({
        id: uuidv4(),
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        role: "admin",
        status: "VERIFIED",
        twoFactorSecretEncrypted: null,
        failedAttempts: 0,
        lockUntil: null,
        createdAt: new Date().toISOString(),
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
    }
    needsWrite = true;
    console.log("[Seed] Admin account ready:", ADMIN_EMAIL);
  }

  const defaultNames = DEFAULT_WIDGETS.map((w) => w.componentName);
  const existingWidgets = db.widgets || [];
  for (const w of DEFAULT_WIDGETS) {
    if (!existingWidgets.some((ew) => ew.componentName === w.componentName)) {
      db.widgets.push({
        id: uuidv4(),
        ...w,
        createdAt: new Date().toISOString(),
      });
      needsWrite = true;
    }
  }

  if (needsWrite) {
    await writeDB(db);
    console.log("[Seed] Seed data written.");
  }
}

module.exports = { seed };
