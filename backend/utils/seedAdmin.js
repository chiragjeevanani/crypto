const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "Super Admin";

  if (!adminEmail || !adminPassword) {
    console.warn("ADMIN_EMAIL or ADMIN_PASSWORD missing. Skipping admin seed.");
    return;
  }

  const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existingAdmin) {
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await User.create({
    name: adminName,
    email: adminEmail.toLowerCase(),
    password: hashedPassword,
    role: "SuperNode"
  });

  console.log("Default admin account created");
};

module.exports = seedAdmin;
