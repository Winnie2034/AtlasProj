import { env } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.info({ port: env.PORT }, "Atlas API listening");
});
