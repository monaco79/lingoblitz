# LingoBlitz 2.0 🚀

**Fast, Interactive Language Learning with AI**

LingoBlitz generates short, level-appropriate reading articles in your target language, helping you learn through engaging content matched to your interests and proficiency level.

> **Version 2.0**

## © Copyright

Copyright (c) 2025, Jurek Vengels.
Licensed under CC BY-NC 4.0.

---

## ✨ Features

- ⚡ **Lightning-fast article generation** - Articles generated using OpenAI GPT-4o
- 🔊 **Text-to-Speech (TTS)** - Natural voice playback with Microsoft, Google, or Apple voices
  - Auto-play articles after generation
  - Adjustable playback speed (0.6x - 1.4x)
  - Pause/resume/stop controls
  - Speed auto-adjusts by proficiency level
- 📚 **Adaptive content** - Content tailored to 6 proficiency levels (Absolute Beginner to C1)
- 🎯 **Personalized topics** - AI suggests topics based on your interests
- 💬 **Interactive vocabulary** - Click any word for instant translations
- ✅ **Comprehension quizzes** - Test your understanding with AI-generated questions
- 🎓 **Vocabulary practice** - Review and practice words from your articles with flashcards
- 🌙 **Dark mode** - Comfortable reading in any lighting condition
- 🎨 **Beautiful design** - Modern gradient UI with Poppins & Aleo typography

---

## 📖 How to Use

### First Time Setup (Onboarding)

1. **Select your languages** - Choose your native language and the language you want to learn
2. **Set your level** - Choose from Absolute Beginner to C1
3. **Pick your interests** - Select topics you're interested in (e.g., Food, Travel, True Crime)
4. **Configure voice settings** - Select your preferred TTS voice, speed, and auto-play preferences

### Learning Flow

1. **Choose a Blitz** - Select from AI-generated topic suggestions matched to your interests or choose any topic you want
2. **Read & Listen** - Read a short article while optionally listening to voice playback
3. **Click words** - Get instant translations for any word you don't know
4. **Take a Quiz** - Test your comprehension with an AI-generated question
5. **Practice Vocabulary** - Review words you clicked using flashcards
6. **Repeat** - Get new topic suggestions and continue learning!

---

## 🛠 Tech Stack

- **Frontend:** React 19 with TypeScript
- **Styling:** Tailwind CSS
- **Fonts:** Poppins (UI), Aleo (Article content)
- **Build Tool:** Vite
- **AI/ML:** OpenAI API (GPT-4o with prompt caching)
- **TTS:** Web Speech API (supports Microsoft, Google, and Apple voices)

---

## ⚠️ Known Issues & Limitations

### Mobile Text-to-Speech (TTS)
LingoBlitz uses the browser's built-in Web Speech API for text-to-speech functionality. This ensures privacy and low latency, but comes with some limitations on mobile devices:

- **iOS (Safari/Chrome):** Voice selection is limited by Apple. You may need to download high-quality voices in your iOS System Settings (Accessibility > Spoken Content > Voices) to hear them in the browser.
- **Edge Mobile (Android):** Voice loading can be inconsistent. If no voices are detected, the app will still function, but audio features may be disabled.
- **Background Playback:** Audio stops if you lock the screen or switch tabs (browser limitation).

---

## Data Privacy

This app does not collect any personal data. It uses only the data you provide to it, such as your language preferences and interests. The app does not store any data on your device or on any server. It also does not use any third-party services to collect data.

**OpenAI API Usage:**
To generate articles, quizzes, and translations, this application sends your selected topics, language settings, and article content to the OpenAI API. This data is processed solely for the purpose of generating the content you requested. Please refer to [OpenAI's Enterprise Privacy Policy](https://openai.com/enterprise-privacy) for more details on how they handle API data.

---

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)**.

**In summary, this means:**

1.  **Allowed:** You are free to copy, modify, distribute, and use the code.
2.  **Required:** You must give appropriate credit to the original creator (Name or organization).
3.  **Restricted:** Use is **strictly for non-commercial purposes only**.

---

## 🙏 Acknowledgments

- **AI Assistance:** This project (v2.0) was built with the help of **Google Gemini** (2.5 Pro & 3 Pro) and **Claude** (Sonnet 4.5).
- **Powered by:** [OpenAI](https://openai.com/)
- **Fonts:** [Google Fonts](https://fonts.google.com/)
- **Icons:** Heroicons

---

## 📝 Contact

For questions or feedback, please contact Jurek at jurek.vengels@lingoblitz.com.
