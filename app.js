const express = require("express");
const redis = require("redis");
const axios = require("axios");
const cors = require("cors");
const app = express();
require("dotenv").config();

app.use(cors());
app.use(express.json());
const client = redis.createClient();

(async () => {
  await client.connect(); // Redis müştərisini işə salırıq ki, sorğulara cavab verə bilsin.
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

    // Yalnız doğru formatda olan məlumatları göndəririk (əgər massivdirsə)
    if (Array.isArray(response.data)) {
      res.json({ source: "api", data: response.data });
    } else {
      // Məlumat obyekt formatında gəldikdə
      res.json({ source: "api", data: [response.data] });
    }
  } catch (error) {
    res.status(500).json({ error: "Xəta baş verdi", details: error.message });
  }
});
// Serveri bağlayanda Redis-i də bağla
process.on("SIGINT", async () => {
  await client.quit(); // Əsas Redis müştərisini bağlayırıq.
  process.exit(); // Prosesdən çıxırıq.
});

app.listen(process.env.PORT, () => console.log("Server çalışır")); // Serveri 3000 portunda işə salırıq.
