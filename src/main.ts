import * as dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";

const PORT = parseInt(process.env.PORT ?? "3000");
const app = createApp();

app.listen(PORT, () => {
  console.log(`Event Ticketing System running on http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop.");
});
