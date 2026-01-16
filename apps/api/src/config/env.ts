export const env = {
  port: parseInt(process.env.PORT!, 10),
  db: {
    host: process.env.PGHOST!,
    port: parseInt(process.env.PGPORT!, 10),
    user: process.env.PGUSER!,
    password: process.env.PGPASSWORD!,
    database: process.env.PGDATABASE!,
  },
} as const;