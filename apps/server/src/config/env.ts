export const env = {
  port: Number(process.env.PORT ?? 2567),
  clientOrigins: (process.env.CLIENT_URL ?? "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim()),
};
