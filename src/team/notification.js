/**
 * 팀 알림 시스템 — 텔레그램 메시지 포맷 생성
 */

const TEMPLATES = {
  newDraft: (content) => `📝 새 콘텐츠 초안 생성
━━━━━━━━━━━━━
제목: ${content.title}
유형: ${content.type}
주제: ${content.keyword || '-'}
생성: ${content.created_at || 'now'}

검수가 필요합니다.`,

  published: (content) => `🎉 콘텐츠 발행 완료!
━━━━━━━━━━━━━
제목: ${content.title}
URL: ${content.published_url}
발행: ${content.published_at || 'now'}`,

  urgentTrend: (trend) => `🚨 긴급 트렌드 감지!
━━━━━━━━━━━━━
키워드: ${trend.keyword}
스코어: ${trend.score?.toFixed(1) || '-'}
출처: ${trend.sources || '-'}

빠른 콘텐츠 제작을 권장합니다.`,

  dailyReport: (report) => report, // reporter.js에서 이미 포맷됨

  weeklyReport: (report) => report,

  milestone: ({ type, value, message }) => `🏆 마일스톤 달성!
━━━━━━━━━━━━━
${message || `${type}: ${value}`}

축하합니다! 🎊`,

  approved: (content) => `✅ 콘텐츠 승인됨
제목: ${content.title}
승인자: ${content.reviewer || '-'}`,

  rejected: (content) => `❌ 콘텐츠 반려
제목: ${content.title}
사유: ${content.review_note || '-'}`,
};

/**
 * 알림 메시지 생성
 * @param {'newDraft'|'published'|'urgentTrend'|'dailyReport'|'weeklyReport'|'milestone'|'approved'|'rejected'} type
 * @param {object} data
 * @returns {string} 텔레그램용 메시지
 */
export function formatNotification(type, data) {
  const template = TEMPLATES[type];
  if (!template) throw new Error(`알 수 없는 알림 유형: ${type}`);
  return template(data);
}

/**
 * 마일스톤 체크
 */
export function checkMilestones(db) {
  const notifications = [];

  const totalPublished = db.prepare(`SELECT COUNT(*) as cnt FROM contents WHERE status = 'published'`).get();
  const milestones = [10, 50, 100, 500, 1000];
  for (const m of milestones) {
    if (totalPublished.cnt === m) {
      notifications.push(formatNotification('milestone', {
        type: '총 발행',
        value: `${m}건`,
        message: `📝 총 ${m}건의 콘텐츠를 발행했습니다!`
      }));
    }
  }

  const totalViews = db.prepare(`SELECT COALESCE(SUM(views), 0) as v FROM performance`).get();
  const viewMilestones = [1000, 10000, 50000, 100000];
  for (const m of viewMilestones) {
    if (totalViews.v >= m && totalViews.v < m * 1.01) {
      notifications.push(formatNotification('milestone', {
        type: '총 조회수',
        value: `${m.toLocaleString()}회`,
        message: `👀 총 조회수 ${m.toLocaleString()}회 돌파!`
      }));
    }
  }

  return notifications;
}
