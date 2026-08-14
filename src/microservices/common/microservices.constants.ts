export const MICROSERVICES = {
  ANALYTICS: 'ANALYTICS_SERVICE',
  DOCTOR: 'DOCTOR_SERVICE',
  PATIENT: 'PATIENT_SERVICE',
  CLINIC: 'CLINIC_SERVICE',
  APPOINTMENT: 'APPOINTMENT_SERVICE',
  FINANCE: 'FINANCE_SERVICE',
  REVIEW: 'REVIEW_SERVICE',
  NOTIFICATION: 'NOTIFICATION_SERVICE',
  AUDIT: 'AUDIT_SERVICE',
  RBAC: 'RBAC_SERVICE',
  SYSTEM: 'SYSTEM_SERVICE',
} as const;

export const PATTERNS = {
  ANALYTICS: {
    GET_OVERVIEW: 'admin.analytics.overview',
  },
  DOCTOR: {
    LIST: 'admin.doctors.list',
    GET_BY_ID: 'admin.doctors.get',
    UPDATE_STATUS: 'admin.doctors.status.update',
    LIST_VERIFICATIONS: 'admin.doctors.verification.list',
    DECIDE_VERIFICATION: 'admin.doctors.verification.decision',
  },
  PATIENT: {
    LIST: 'admin.patients.list',
    GET_BY_ID: 'admin.patients.get',
    UPDATE_STATUS: 'admin.patients.status.update',
  },
  CLINIC: {
    LIST: 'admin.clinics.list',
    CREATE: 'admin.clinics.create',
    UPDATE: 'admin.clinics.update',
    UPDATE_STATUS: 'admin.clinics.status.update',
  },
  APPOINTMENT: {
    LIST: 'admin.appointments.list',
    TRANSITION_STATUS: 'admin.appointments.status.transition',
    RESCHEDULE: 'admin.appointments.reschedule',
    CANCEL: 'admin.appointments.cancel',
  },
  FINANCE: {
    LIST_TRANSACTIONS: 'admin.finance.transactions.list',
    PROCESS_REFUND: 'admin.finance.refund.process',
    GET_REPORT: 'admin.finance.reports.summary',
  },
  REVIEW: {
    LIST: 'admin.reviews.list',
    MODERATE: 'admin.reviews.moderate',
  },
  NOTIFICATION: {
    BROADCAST: 'admin.notifications.broadcast',
    LIST: 'admin.notifications.list',
  },
  AUDIT: {
    LOG_EVENT: 'audit.log.created',
    LIST: 'admin.audit.list',
  },
  RBAC: {
    LIST_REQUESTS: 'superadmin.access_requests.list',
    DECIDE_REQUEST: 'superadmin.access_requests.decide',
    GET_MATRIX: 'superadmin.roles.matrix',
    UPDATE_PERMISSIONS: 'superadmin.roles.permissions.update',
  },
  SYSTEM: {
    HEALTH: 'superadmin.system.health',
    GET_SETTINGS: 'superadmin.settings.get',
    UPDATE_SETTINGS: 'superadmin.settings.update',
    BACKUP: 'superadmin.system.backup',
  },
} as const;
