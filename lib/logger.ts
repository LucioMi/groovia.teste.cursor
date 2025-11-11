type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry
    let log = `[${timestamp}] [${level.toUpperCase()}] ${message}`

    if (context && Object.keys(context).length > 0) {
      log += ` | Context: ${JSON.stringify(context)}`
    }

    if (error) {
      log += ` | Error: ${error.message}\n${error.stack}`
    }

    return log
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    }

    const formattedLog = this.formatLog(entry)

    // Em desenvolvimento, usa console
    if (this.isDevelopment) {
      switch (level) {
        case "error":
          console.error(formattedLog)
          break
        case "warn":
          console.warn(formattedLog)
          break
        case "debug":
          console.debug(formattedLog)
          break
        default:
          console.log(formattedLog)
      }
    } else {
      // Em produção, envia para serviço de logging (Sentry, Datadog, etc)
      console.log(JSON.stringify(entry))
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log("error", message, context, error)
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (this.isDevelopment) {
      this.log("debug", message, context)
    }
  }
}

export const logger = new Logger()
