import React from 'react';
function AboutDeveloper() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Meet the Developer</h2>
          <div className="w-12 h-px bg-gray-900"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Developer Avatar */}
          <div className="flex justify-center lg:justify-start">
            <div className="w-64 h-64 bg-[#F0EAD6] border border-[#E8E0CE] rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">SM</span>
                </div>
                <p className="text-gray-500 text-sm">Photo coming soon</p>
              </div>
            </div>
          </div>

          {/* Developer Content */}
          <div className="space-y-5">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Siddharth Mishra</h3>
              <p className="text-gray-500 font-medium">Full Stack Developer</p>
            </div>

            <p className="text-gray-600 leading-relaxed">
              Passionate about creating clean, functional web applications. With experience in
              modern full-stack development, Siddharth builds user-centric platforms that
              prioritize both usability and design.
            </p>

            <p className="text-gray-600 leading-relaxed">
              This book review platform was built to bring readers together — a space to
              discover great books, share honest opinions, and connect with fellow readers.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white border border-[#E8E0CE] rounded-xl p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Expertise</h4>
                <p className="text-gray-500 text-sm">
                  React, Node.js, MongoDB, Express, Tailwind CSS
                </p>
              </div>
              <div className="bg-white border border-[#E8E0CE] rounded-xl p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Focus Areas</h4>
                <p className="text-gray-500 text-sm">
                  UI/UX Design, REST APIs, Performance, Accessibility
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutDeveloper;