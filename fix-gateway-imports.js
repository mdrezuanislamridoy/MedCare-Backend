const fs = require('fs');
const path = require('path');

const gatewayDir = path.resolve(__dirname, 'apps/api-gateway/src/gateway');
const files = fs.readdirSync(gatewayDir).filter(f => f.endsWith('.ts'));

const replacements = [
  {
    from: /from '\.\.\/microservices\/analytics\/analytics\.service'/g,
    to: "from '../../../analytics-service/src/analytics/analytics.service'"
  },
  {
    from: /from '\.\.\/microservices\/appointment\/appointment\.service'/g,
    to: "from '../../../appointment-service/src/appointment/appointment.service'"
  },
  {
    from: /from '\.\.\/microservices\/audit\/audit\.service'/g,
    to: "from '../../../audit-service/src/audit/audit.service'"
  },
  {
    from: /from '\.\.\/microservices\/clinic\/clinic\.service'/g,
    to: "from '../../../clinic-service/src/clinic/clinic.service'"
  },
  {
    from: /from '\.\.\/microservices\/doctor\/doctor\.service'/g,
    to: "from '../../../doctor-service/src/doctor/doctor.service'"
  },
  {
    from: /from '\.\.\/microservices\/notification\/notification\.service'/g,
    to: "from '../../../notification-service/src/notification/notification.service'"
  },
  {
    from: /from '\.\.\/microservices\/patient\/patient\.service'/g,
    to: "from '../../../patient-service/src/patient/patient.service'"
  },
  {
    from: /from '\.\.\/microservices\/finance\/finance\.service'/g,
    to: "from '../../../billing-service/src/billing/finance.service'"
  },
  {
    from: /from '\.\.\/microservices\/chat\/chat\.service'/g,
    to: "from '../../../chat-service/src/chat/chat.service'"
  },
  {
    from: /from '\.\.\/microservices\/review\/review\.service'/g,
    to: "from './services/review.service'"
  },
  {
    from: /from '\.\.\/microservices\/review\/dto\/review\.dto'/g,
    to: "from './dto/review.dto'"
  },
  {
    from: /from '\.\.\/common\/utils\/file-upload\.util'/g,
    to: "from '../../../../src/common/utils/file-upload.util'"
  },
];

for (const file of files) {
  const filePath = path.join(gatewayDir, file);
  if (!fs.statSync(filePath).isFile()) continue;
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  for (const { from, to } of replacements) {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${file}`);
  }
}
