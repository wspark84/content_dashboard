/**
 * 일일 리포트 생성 및 발송 — cron: 매일 22:00
 */
import { generateDailyReport } from '../src/track/reporter.js';
import { closeDb } from '../src/shared/db.js';

try {
  const report = generateDailyReport();
  console.log(report);
  // TODO: 텔레그램 발송 연동
  closeDb();
} catch (err) {
  console.error('[daily-report] 에러:', err.message);
  closeDb();
  process.exit(1);
}
