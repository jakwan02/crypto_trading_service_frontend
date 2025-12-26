"use client";

import { useTranslation } from "react-i18next";

const lessons = [
  {
    id: "lesson1",
    titleKey: "education.lessons.lesson1.title",
    summaryKey: "education.lessons.lesson1.summary",
    levelKey: "education.levels.beginner"
  },
  {
    id: "lesson2",
    titleKey: "education.lessons.lesson2.title",
    summaryKey: "education.lessons.lesson2.summary",
    levelKey: "education.levels.intermediate"
  },
  {
    id: "lesson3",
    titleKey: "education.lessons.lesson3.title",
    summaryKey: "education.lessons.lesson3.summary",
    levelKey: "education.levels.intermediate"
  }
];

export default function EducationPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("education.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("education.desc")}</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {lessons.map((lesson) => (
            <article
              key={lesson.id}
              className="fade-up rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                {t(lesson.levelKey)}
              </span>
              <h2 className="mt-2 text-lg font-semibold text-gray-900">{t(lesson.titleKey)}</h2>
              <p className="mt-2 text-sm text-gray-600">{t(lesson.summaryKey)}</p>
              <button
                type="button"
                className="mt-4 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700"
              >
                {t("education.more")}
              </button>
            </article>
          ))}
        </section>

        <div className="mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
          {t("education.notice")}
          <a href="mailto:newsletter@coindash.com" className="ml-2 font-medium text-primary hover:text-primary-dark">
            {t("education.newsletter")}
          </a>
        </div>
      </div>
    </main>
  );
}
