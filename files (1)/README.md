# SkillSwap

SkillSwap is a responsive, browser-based student skill-exchange demo built with
HTML, CSS, vanilla JavaScript, local demo storage, and Ollama running on the
same computer. It does not use a hosted AI provider.

## Architecture

- HTML files provide the shared page shell, navigation, and page identifier.
- `style.css` contains the responsive design system and shared components.
- `app.js` renders the home, skill discovery, dashboard, and local account
  demo, and wires up page interactions.
- `api.js` loads the bundled illustrative catalog from `data.json`, with
  fallback data if the JSON file is unavailable.
- `ollamaService.js` is the only file that calls Ollama. It provides chat,
  recommendations, roadmaps, skill matching, model settings, and connection
  errors for the AI Assistant page.
- Student accounts and shared skills are browser-local demo data, not a
  production database. The demo profile flow does not ask for passwords or
  email addresses. Do not enter private information.

## Install Ollama and Gemma

1. Install Ollama for your operating system from [ollama.com/download](https://ollama.com/download).
2. Open PowerShell or a terminal and download the default model:

   ```powershell
   ollama pull gemma:latest
   ```

3. Check that Ollama is running and the model is installed:

   ```powershell
   ollama list
   ```

4. Check the local API:

   ```powershell
   Invoke-RestMethod http://127.0.0.1:11434/api/tags
   ```

   The response should include `gemma:latest`.

## Run SkillSwap locally

Do not open the HTML files directly with `file://`; browsers block the local
JSON fetch and the Ollama request may have an opaque origin. Start a local
static server from the project folder instead:

```powershell
py -m http.server 5500 --bind 127.0.0.1
```

Open <http://127.0.0.1:5500/> in your browser. The server is bound to loopback
and is intended only for local development.

If Python is unavailable, use another static server bound to `127.0.0.1`.
Do not bind a development server to `0.0.0.0` or expose Ollama to a public
network.

## Configure the model

Open **AI Assistant**, enter an installed model name in the Ollama model field,
and select **Save model**. The preference is stored in local browser storage.
For example, if you have installed another model, enter its exact name as
shown by `ollama list`. The default is `gemma:latest`.

## Local CORS setup

The browser page and Ollama use different local ports, so Ollama must allow the
exact local web origin. If the browser reports a CORS error:

1. Close the Ollama desktop application or stop the existing Ollama server.
2. In a PowerShell window, set origins for the local server and start Ollama
   in that same window:

   ```powershell
   $env:OLLAMA_ORIGINS = "http://127.0.0.1:5500,http://localhost:5500"
   ollama serve
   ```

3. Keep that terminal open, reload SkillSwap, then choose **Test connection**.

Only allow the specific loopback origins used for local development. Do not
use `*`, do not add public website origins, and do not expose port `11434` to
the internet. If Ollama was launched by a desktop app or service, configure
the environment variable before starting that process.

## Test the AI features

1. Make sure the static server, Ollama, and the configured model are running.
2. Visit **AI Assistant** and select **Test connection**.
3. In **Chat**, ask an educational question. The conversation should show a
   loading message, then the local model's response; blank questions are not
   submitted.
4. In **Recommendations**, enter skills you can teach, a skill you want to
   learn, and an interest. Recommendations can only refer to the bundled
   illustrative demo profiles; they are not real student matches.
5. In **Learning roadmap**, enter a skill, current level, and a duration from
   1 to 52 weeks.
6. In **Skill match**, enter each student's teach/learn skills and request an
   evaluation and exchange plan.
7. Stop Ollama and try an AI action to check the offline message. Reinstall a
   missing model with `ollama pull gemma:latest`.

The project files can be checked without Ollama using:

```powershell
node --check .\app.js
node --check .\api.js
node --check .\ollamaService.js
```

## Demo and privacy limitations

This is a frontend demonstration, not secure authentication. Demo profiles
and shared skill listings are kept in local browser storage and are not
synced, backed up, or protected by a server. A one-time migration removes
legacy demo email/password fields from older local profiles. AI requests are
sent only to the configured local Ollama endpoint; recommendation prompts use
the bundled demo roster rather than private account profiles.
