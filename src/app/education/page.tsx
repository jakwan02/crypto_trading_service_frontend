const lessons = [
  {
    title: "시장 기초 읽기",
    summary: "가격·거래량·변동률 지표를 활용해 추세를 파악하는 방법",
    level: "Beginner"
  },
  {
    title: "리스크 관리 전략",
    summary: "포지션 사이징과 손절/익절 전략 설계",
    level: "Intermediate"
  },
  {
    title: "차트 활용법",
    summary: "캔들 패턴과 주요 지지/저항 구간 분석",
    level: "Intermediate"
  }
];

export default function EducationPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Education</h1>
          <p className="mt-1 text-sm text-gray-500">
            투자 결정을 돕는 핵심 가이드를 단계별로 제공합니다.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {lessons.map((lesson) => (
            <article
              key={lesson.title}
              className="fade-up rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                {lesson.level}
              </span>
              <h2 className="mt-2 text-lg font-semibold text-gray-900">{lesson.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{lesson.summary}</p>
              <button
                type="button"
                className="mt-4 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700"
              >
                자세히 보기
              </button>
            </article>
          ))}
        </section>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
          더 많은 콘텐츠는 곧 업데이트됩니다. 최신 자료는 뉴스레터로 안내드립니다.
          <a href="mailto:newsletter@coindash.com" className="ml-2 font-medium text-primary hover:text-blue-600">
            뉴스레터 신청
          </a>
        </div>
      </div>
    </main>
  );
}
