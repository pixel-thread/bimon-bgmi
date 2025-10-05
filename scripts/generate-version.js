#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function generateVersion() {
  const timestamp = Date.now().toString();
  const buildTime = new Date().toISOString();

  let commitHash = "";
  try {
    // Try to get git commit hash
    commitHash = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
    }).trim();
  } catch (error) {
    console.warn("Could not get git commit hash:", error.message);
  }

  // Create environment variables
  const envVars = [
    `NEXT_PUBLIC_APP_VERSION=${timestamp}`,
    `NEXT_PUBLIC_BUILD_TIME=${buildTime}`,
    ...(commitHash ? [`NEXT_PUBLIC_COMMIT_HASH=${commitHash}`] : []),
  ];

  // Write to .env.local for build process
  const envPath = path.join(process.cwd(), ".env.local");
  let existingEnv = "";

  if (fs.existsSync(envPath)) {
    existingEnv = fs.readFileSync(envPath, "utf8");
    // Remove existing version variables
    existingEnv = existingEnv
      .split("\n")
      .filter(
        (line) =>
          !line.startsWith("NEXT_PUBLIC_APP_VERSION=") &&
          !line.startsWith("NEXT_PUBLIC_BUILD_TIME=") &&
          !line.startsWith("NEXT_PUBLIC_COMMIT_HASH=")
      )
      .join("\n");
  }

  const newEnvContent = [
    existingEnv.trim(),
    "",
    "# Auto-generated version info",
    ...envVars,
    "",
  ]
    .filter(Boolean)
    .join("\n");

  fs.writeFileSync(envPath, newEnvContent);

  console.log("✅ Version info generated:");
  console.log(`   Version: ${timestamp}`);
  console.log(`   Build Time: ${buildTime}`);
  if (commitHash) {
    console.log(`   Commit: ${commitHash}`);
  }
}

if (require.main === module) {
  generateVersion();
}

module.exports = { generateVersion };
