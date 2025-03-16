const express = require("express");
const { createClient } = require("redis"); // Redis-in düzgün importu
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const client = createClient({
  url: process.env.REDIS_URL,
});

(async () => {
  try {
    await client.connect();
    console.log("✅ Redis-ə uğurla qoşuldu!");
  } catch (error) {
    console.error("❌ Redis bağlantı xətası:", error);
  }
})();

app.get("/todolist", async (req, res) => {
  const key = "todos";

  try {
    const data = await client.get(key);
    if (data) {
      return res.json({ source: "cache", data: JSON.parse(data) });
    }

    const response = await axios.get(
      "https://jsonplaceholder.typicode.com/todos"
    );
    await client.setEx(key, 3600, JSON.stringify(response.data));

    res.json({ source: "api", data: response.data });
  } catch (error) {
    res.status(500).json({ error: "Xəta baş verdi", details: error.message });
  }
});

// Server bağlananda Redis-i də bağlayırıq
process.on("SIGINT", async () => {
  await client.quit();
  console.log("🔴 Redis bağlantısı bağlandı");
  process.exit();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server ${PORT} portunda çalışır!`));
