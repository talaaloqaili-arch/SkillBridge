(function () {
  const fallbackData = {
    categories: [
      'Programming',
      'UI/UX Design',
      'Digital Marketing',
      'Data Analysis',
      'Languages',
      'Video Editing'
    ],
    skills: [
      { id: 's1', t: 'Python essentials', d: 'Turn your first lines of code into a small, working project.', c: 'Programming', w: 'UI/UX Design', m: 'Online', l: 'Beginner friendly', u: 'Maya', e: 'seed' },
      { id: 's2', t: 'Design with Figma', d: 'From wireframe to a clickable prototype, one screen at a time.', c: 'UI/UX Design', w: 'Digital Marketing', m: 'Online / campus', l: 'Beginner friendly', u: 'Leo', e: 'seed' },
      { id: 's3', t: 'Content that connects', d: 'Plan a social campaign and tell a story people want to follow.', c: 'Digital Marketing', w: 'Data Analysis', m: 'Online', l: 'All levels welcome', u: 'Sara', e: 'seed' },
      { id: 's4', t: 'Make sense of data', d: 'Explore spreadsheets and turn everyday data into clear insights.', c: 'Data Analysis', w: 'Programming', m: 'Online / campus', l: 'Beginner friendly', u: 'Noah', e: 'seed' },
      { id: 's5', t: 'Conversational English', d: 'Practice speaking with confidence in relaxed sessions.', c: 'Languages', w: 'Video Editing', m: 'Online', l: 'All levels welcome', u: 'Lina', e: 'seed' },
      { id: 's6', t: 'Edit videos that flow', d: 'Cut, pace and polish short videos for social media.', c: 'Video Editing', w: 'Languages', m: 'Online / campus', l: 'Beginner friendly', u: 'Omar', e: 'seed' },
      { id: 's7', t: 'JavaScript for the web', d: 'Build interactive pages and understand how the web works.', c: 'Programming', w: 'Digital Marketing', m: 'Online', l: 'Some experience', u: 'Dana', e: 'seed' },
      { id: 's8', t: 'Brand identity basics', d: 'Logos, colors and type that make a project feel real.', c: 'UI/UX Design', w: 'Programming', m: 'Online', l: 'All levels welcome', u: 'Yazan', e: 'seed' }
    ],
    faq: [
      [
        'Do I need to be an expert to teach?',
        'Not at all. Share something you understand well enough to help a peer get started. Be clear about your experience and learn together along the way.'
      ],
      [
        'What kinds of skills can I exchange?',
        'Programming, UI/UX design, digital marketing, data analysis, and other practical skills. Start with something useful you can demonstrate or practice together.'
      ],
      [
        'Can we learn online or meet in person?',
        'Plan a format that works for both of you. For in-person sessions, choose a public place and keep your boundaries clear.'
      ],
      [
        'What should we agree on before we start?',
        'Discuss what each person wants to learn, how much time you can give, and a small goal for the session.'
      ]
    ]
  };

  const state = { data: null };

  function normalizeData(payload) {
    const source = payload || {};
    return {
      categories: Array.isArray(source.categories) && source.categories.length ? source.categories : fallbackData.categories,
      skills: Array.isArray(source.skills) && source.skills.length ? source.skills : fallbackData.skills,
      faq: Array.isArray(source.faq) && source.faq.length ? source.faq : fallbackData.faq
    };
  }

  async function loadData() {
    if (state.data) {
      return state.data;
    }

    try {
      const response = await fetch('./data.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load data.json');
      }

      const json = await response.json();
      state.data = normalizeData(json);
      return state.data;
    } catch (error) {
      console.warn('SkillSwap API: using fallback data.', error);
      state.data = normalizeData(fallbackData);
      return state.data;
    }
  }

  window.SkillBridgeAPI = {
    loadData,
    fallbackData
  };
})();
