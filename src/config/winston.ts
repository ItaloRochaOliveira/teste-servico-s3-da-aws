import winston from "winston";

export default winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
      return `${String(timestamp)} [${level}] ${message}${rest}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});
