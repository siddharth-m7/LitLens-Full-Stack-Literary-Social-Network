function AboutDeveloper() {
  const skills = [
    { category: 'Frontend', items: ['React', 'Tailwind CSS', 'Redux'] },
    { category: 'Backend', items: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Redis', 'Prisma'] },
    { category: 'DevOps & Cloud', items: ['AWS', 'Docker', 'GitHub Actions', 'Git'] },
  ];

  const cp = [
    { platform: 'LeetCode', detail: 'Knight · 1966 rating', sub: 'Top 3% globally · 500+ problems', color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { platform: 'Codeforces', detail: 'Specialist · 1410 rating', sub: 'Consistent contest participant', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { platform: 'CodeChef', detail: '4★ · 1806 max rating', sub: 'Long challenge specialist', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  ];

  const links = [
    {
      label: 'Portfolio',
      href: 'https://siddharth-mishra.vercel.app/',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      ),
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/siddharthm7/',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" />
      ),
    },
    {
      label: 'GitHub',
      href: 'https://github.com/siddharth-m7',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
      ),
    },
    {
      label: 'Email',
      href: 'mailto:siddharth4386@gmail.com',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      ),
    },
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Heading */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Meet the Developer</h2>
          <div className="w-12 h-px bg-gray-900"></div>
        </div>

        {/* Hero row */}
        <div className="grid lg:grid-cols-3 gap-10 items-start mb-12">

          {/* Avatar + links */}
          <div className="flex flex-col items-center gap-5">
            <div className="w-36 h-36 bg-gray-900 rounded-full flex items-center justify-center shadow-md">
              <span className="text-4xl font-bold text-white">SM</span>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Siddharth Mishra</h3>
              <p className="text-gray-500 font-medium mt-0.5">Full Stack Developer</p>
              <p className="text-gray-400 text-sm mt-0.5">IIIT Ranchi · ECE · 9.03 CGPA</p>
            </div>
            <div className="flex gap-3">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noreferrer"
                  title={l.label}
                  className="w-9 h-9 rounded-lg bg-white border border-[#E8E0CE] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-400 shadow-sm transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {l.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="lg:col-span-2 space-y-4">
            <p className="text-gray-600 leading-relaxed">
              Full-stack developer who enjoys building scalable systems — from clean, responsive UIs to
              robust backend APIs and cloud infrastructure. Currently focused on system design, cloud
              infrastructure, and building production-ready applications.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Outside of development, an active competitive programmer ranked in the{' '}
              <span className="font-semibold text-gray-900">top 3% globally on LeetCode</span> with
              500+ problems solved. Always open to collaborating on interesting projects.
            </p>

            {/* Skill groups */}
            <div className="pt-2 space-y-3">
              {skills.map((s) => (
                <div key={s.category} className="flex items-start gap-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1 w-24 shrink-0">
                    {s.category}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {s.items.map((item) => (
                      <span
                        key={item}
                        className="bg-white border border-[#E8E0CE] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md shadow-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Competitive Programming */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitive Programming</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {cp.map((c) => (
              <div
                key={c.platform}
                className={`border rounded-xl px-5 py-4 shadow-sm ${c.color}`}
              >
                <p className="font-bold text-sm mb-0.5">{c.platform}</p>
                <p className="font-semibold text-base">{c.detail}</p>
                <p className="text-xs mt-1 opacity-75">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

export default AboutDeveloper;
