const dotenv = require("dotenv");

dotenv.config();

console.log("Loading environment variables...");
console.log("PORT:", process.env.PORT);
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "SET" : "NOT SET");

module.exports = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
};
