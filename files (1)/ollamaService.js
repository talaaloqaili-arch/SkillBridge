/* Local Ollama client. No prompts or profile data leave this machine. */
(() => {
  const DEFAULTS = {
    endpoint: 'http://localhost:11434/api/chat',
    model: 'gemma:latest',
    timeoutMs: 120000
  };
  const SETTINGS_KEY = 'skillswap.ai.settings';

  class OllamaError extends Error {
    constructor(code, message) {
      super(message);
      this.name = 'OllamaError';
      this.code = code;
    }
  }

  function getSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return {
        ...DEFAULTS,
        model: typeof saved.model === 'string' && saved.model.trim()
          ? saved.model.trim()
          : DEFAULTS.model
      };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function saveSettings(settings = {}) {
    const model = String(settings.model || '').trim();
    if (!model) {
      throw new OllamaError('invalid_model', 'Enter an Ollama model name.');
    }

    const next = { ...DEFAULTS, model };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ model }));
    } catch (error) {
      throw new OllamaError('settings', `Could not save model preferences: ${error.message}`);
    }
    return next;
  }

  async function request(messages, options = {}) {
    const latestMessage = Array.isArray(messages) ? messages[messages.length - 1] : null;
    if (!latestMessage || !String(latestMessage.content || '').trim()) {
      throw new OllamaError('empty', 'Enter a message before sending it.');
    }

    const settings = getSettings();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort('timeout'), settings.timeoutMs);
    const cancel = () => controller.abort('cancelled');
    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeout);
        throw new OllamaError('cancelled', 'Request cancelled.');
      }
      options.signal.addEventListener('abort', cancel, { once: true });
    }

    let response;
    try {
      response = await fetch(settings.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.model,
          messages: options.system
            ? [{ role: 'system', content: options.system }, ...messages]
            : messages,
          stream: false,
          options: { temperature: options.temperature ?? 0.6 }
        }),
        signal: controller.signal
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new OllamaError(
          controller.signal.reason === 'cancelled' ? 'cancelled' : 'timeout',
          controller.signal.reason === 'cancelled'
            ? 'Request cancelled.'
            : 'Ollama took too long to respond. Try again or choose a smaller model.'
        );
      }
      throw new OllamaError(
        'offline',
        'Could not reach local Ollama. Start Ollama and check the localhost/CORS setup in README.md.'
      );
    } finally {
      clearTimeout(timeout);
      if (options.signal) options.signal.removeEventListener('abort', cancel);
    }

    if (!response.ok) {
      let detail = '';
      try {
        const payload = await response.json();
        detail = payload.error || '';
      } catch {}

      if (response.status === 404 || /model .* not found/i.test(detail)) {
        throw new OllamaError(
          'model_missing',
          `Model "${settings.model}" was not found. Run: ollama pull ${settings.model}`
        );
      }
      throw new OllamaError(
        'request_failed',
        `Ollama returned HTTP ${response.status}${detail ? `: ${detail}` : '.'}`
      );
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new OllamaError('invalid_response', 'Ollama returned an invalid response.');
    }
    const answer = payload?.message?.content?.trim();
    if (!answer) {
      throw new OllamaError('empty_response', 'Ollama returned an empty answer. Please try again.');
    }
    return answer;
  }

  async function checkConnection() {
    const settings = getSettings();
    let response;
    try {
      response = await fetch(settings.endpoint.replace(/\/api\/chat\/?$/, '/api/tags'));
    } catch {
      throw new OllamaError(
        'offline',
        'Could not reach local Ollama. Start Ollama and check the localhost/CORS setup in README.md.'
      );
    }

    if (!response.ok) {
      throw new OllamaError('request_failed', `Ollama returned HTTP ${response.status} while checking the connection.`);
    }

    const payload = await response.json();
    const models = (payload.models || []).map((item) => item.name);
    const hasModel = models.includes(settings.model) ||
      (!settings.model.includes(':') && models.some((name) => name.startsWith(`${settings.model}:`)));
    if (!hasModel) {
      throw new OllamaError(
        'model_missing',
        `Ollama is running, but "${settings.model}" is not installed. Run: ollama pull ${settings.model}`
      );
    }

    return { online: true, model: settings.model, models };
  }

  const SYSTEM = 'You are SkillSwap, a friendly educational assistant for university students exchanging skills. Stay focused on education, practical skills, and learning strategies. Reply in the same language as the student (English or Arabic). Never claim demo profiles are real people, and do not invent real student profiles.';
  const SYSTEMS = {
    chat: `${SYSTEM} Explain difficult ideas simply, include examples, and end with one or two practice questions when useful.`,
    recommend: `${SYSTEM} Recommend useful skills and reciprocal exchanges. You may suggest partners only from the supplied illustrative demo roster. Never invent a student or imply demo profiles are real.`,
    roadmap: `${SYSTEM} Create a beginner-friendly roadmap with steps ordered by difficulty, small practice tasks, weekly goals, and one final mini-project. Use clear headings and respect the requested duration.`,
    match: `${SYSTEM} Evaluate whether the two supplied students are complementary. Include matching skills, what each can teach and learn, why the exchange is useful, a practical exchange plan, and a match score from 0 to 100. Do not invent missing information.`
  };

  const api = {
    DEFAULTS,
    OllamaError,
    getSettings,
    saveSettings,
    checkConnection,
    request,
    chat(messages, options = {}) {
      return request(messages, { ...options, system: SYSTEMS.chat });
    },
    recommend(profile, demoStudents, options = {}) {
      const roster = demoStudents.map((student) =>
        `- ${student.name} (demo profile): teaches ${student.teach.join(', ')}; wants to learn ${student.want.join(', ')}`
      ).join('\n');
      return request([{
        role: 'user',
        content: [
          `Current skills: ${profile.known || 'not specified'}`,
          `Wants to learn: ${profile.want || 'not specified'}`,
          `Interests and goals: ${profile.interests || 'not specified'}`,
          '',
          'Only consider these illustrative demo profiles, never invent additional students:',
          roster || '(No demo profiles available)',
          'Recommend useful skills and explain the two-way exchange for each possible partner. State that these are illustrative demo profiles.'
        ].join('\n')
      }], { ...options, system: SYSTEMS.recommend });
    },
    roadmap(profile, options = {}) {
      return request([{
        role: 'user',
        content: `Create a beginner-friendly learning roadmap.\nSkill: ${profile.skill}\nCurrent level: ${profile.level}\nDuration: ${profile.weeks} weeks.\nOrder steps by difficulty, include small practice tasks, weekly goals, and a final mini-project.`
      }], { ...options, system: SYSTEMS.roadmap });
    },
    match(studentA, studentB, options = {}) {
      return request([{
        role: 'user',
        content: `Evaluate this skill exchange using only the information below.\nStudent A can teach: ${studentA.teach}. Student A wants to learn: ${studentA.want}.\nStudent B can teach: ${studentB.teach}. Student B wants to learn: ${studentB.want}.\nReturn sections for matching skills, what each can teach and learn, why the match is useful, a suggested exchange plan, and a match score from 0-100.`
      }], { ...options, system: SYSTEMS.match });
    }
  };

  window.OllamaService = api;
})();
