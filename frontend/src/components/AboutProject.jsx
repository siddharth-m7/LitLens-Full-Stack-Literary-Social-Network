function AboutProject() {
  const features = [
    {
      title: 'Discover Books',
      description: 'Browse a growing library with powerful search, genre filters, and rating-based sorting.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      ),
    },
    {
      title: 'Write Reviews',
      description: 'Share detailed reviews with ratings, tags, pros & cons, and optional images.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      ),
    },
    {
      title: 'Follow Readers',
      description: 'Follow other readers, see their reviews and reading lists, and grow your community.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      ),
    },
    {
      title: 'Reading Lists',
      description: 'Track what you want to read, are currently reading, or have already finished.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      ),
    },
    {
      title: 'Earn Badges',
      description: 'Get recognized as an Early Adopter, Book Worm, or Top Reviewer each month.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      ),
    },
    {
      title: 'Leaderboard',
      description: 'Compete with other reviewers and climb the monthly leaderboard.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      ),
    },
  ];

  const stack = [
    { label: 'Frontend', value: 'React 19 + Vite + Tailwind CSS 4' },
    { label: 'Backend', value: 'Node.js + Express 5' },
    { label: 'Database', value: 'MongoDB + Mongoose 8' },
    { label: 'Auth', value: 'JWT + Role-based access' },
    { label: 'State', value: 'TanStack React Query' },
    { label: 'Logging', value: 'Pino + structured JSON' },
  ];

  return (
    <section className="py-16 px-4 border-b border-[#E8E0CE]">
      <div className="max-w-5xl mx-auto">

        {/* Heading */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">About the Project</h2>
          <div className="w-12 h-px bg-gray-900"></div>
        </div>

        {/* Intro */}
        <p className="text-gray-600 leading-relaxed text-lg mb-12 max-w-3xl">
          LitLens is a full-stack book discovery platform where readers can discover books, write detailed reviews,
          track their reading progress, and connect with a community of fellow book lovers.
        </p>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {features.map((f) => (
            <div key={f.title} className="bg-white border border-[#E8E0CE] rounded-xl p-5 shadow-sm">
              <div className="w-9 h-9 bg-[#F0EAD6] rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {f.icon}
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Tech stack */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tech Stack</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stack.map((s) => (
              <div key={s.label} className="flex items-start gap-3 bg-white border border-[#E8E0CE] rounded-xl px-4 py-3 shadow-sm">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-0.5 w-20 shrink-0">{s.label}</span>
                <span className="text-sm text-gray-700">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

export default AboutProject;
