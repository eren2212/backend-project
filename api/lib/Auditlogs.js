let instance = null;

const AuditLogsModel = require("../db/models/AuditLogs");
const Enum = require("../config/Enum");

class AuditLogs {
  constructor() {
    if (!instance) {
      instance = this;
    }

    return instance;
  }

  info(email, location, proc_type, log) {
    this.#saveToDB({
      level: Enum.LOG_LEVELS.INFO,
      email,
      location,
      proc_type,
      log,
    });
  }
  warn(email, location, proc_type, log) {
    this.#saveToDB({
      level: Enum.LOG_LEVELS.WARN,
      email,
      location,
      proc_type,
      log,
    });
  }

  debug(email, location, proc_type, log) {
    this.#saveToDB({
      level: Enum.LOG_LEVELS.DEBUG,
      email,
      location,
      proc_type,
      log,
    });
  }

  error(email, location, proc_type, log) {
    this.#saveToDB({
      level: Enum.LOG_LEVELS.ERROR,
      email,
      location,
      proc_type,
      log,
    });
  }
  verbose(email, location, proc_type, log) {
    this.#saveToDB({
      level: Enum.LOG_LEVELS.VERBOSE,
      email,
      location,
      proc_type,
      log,
    });
  }
  http(email, location, proc_type, log) {
    this.#saveToDB({
      level: Enum.LOG_LEVELS.HTTP,
      email,
      location,
      proc_type,
      log,
    });
  }

  #saveToDB(data) {
    AuditLogsModel.create(data);
  }
}

module.exports = new AuditLogs();
