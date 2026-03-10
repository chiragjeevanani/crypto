require("dotenv").config();
const dns = require("dns");
const app = require("./app");
const connectDB = require("./utils/db");
const seedAdmin = require("./utils/seedAdmin");

const BASE_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_RETRIES = Number(process.env.MAX_PORT_RETRIES) || 10;
const dnsServers = (process.env.DNS_SERVERS || "1.1.1.1,8.8.8.8")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

if (dnsServers.length > 0) {
  dns.setServers(dnsServers);
}

const listenWithFallback = (startPort, retries) =>
  new Promise((resolve, reject) => {
    const tryPort = (port, attemptsLeft) => {
      const server = app
        .listen(port, () => {
          resolve({ server, port });
        })
        .on("error", (error) => {
          const isAddressInUse = error?.code === "EADDRINUSE";
          if (!isAddressInUse || attemptsLeft <= 0) {
            reject(error);
            return;
          }

          console.warn(`Port ${port} is in use. Trying port ${port + 1}...`);
          tryPort(port + 1, attemptsLeft - 1);
        });
    };

    tryPort(startPort, retries);
  });

const startServer = async () => {
  try {
    await connectDB();
    await seedAdmin();
    const { port } = await listenWithFallback(BASE_PORT, MAX_PORT_RETRIES);
    console.log(`Server running on port ${port}`);
  } catch (error) {
    console.error("Failed to start server:", error.message);
    if (
      typeof error?.message === "string" &&
      error.message.includes("querySrv ECONNREFUSED")
    ) {
      console.error(
        "Hint: add MONGO_URI_DIRECT in .env from MongoDB Atlas standard connection string."
      );
    }
    process.exit(1);
  }
};

startServer();
