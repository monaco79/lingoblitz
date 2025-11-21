# LingoBlitz 🚀

**Fast, Interactive Language Learning with AI**

LingoBlitz generates short, level-appropriate reading articles in your target language, helping you learn through engaging content matched to your interests and proficiency level.

---

## ✨ Features

- ⚡ **Lightning-fast article generation** - Articles generated in under 500ms using OpenAI GPT-4o
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

## 🛠 Tech Stack

- **Frontend:** React 19 with TypeScript
- **Styling:** Tailwind CSS
- **Fonts:** Poppins (UI), Aleo (Article content)
- **Build Tool:** Vite
- **AI/ML:** OpenAI API (GPT-4o with prompt caching)
- **TTS:** Web Speech API (supports Microsoft, Google, and Apple voices)

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your OpenAI API key:**
   
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=sk-your_openai_api_key_here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to `http://localhost:3000`

---

## 📖 How to Use

### First Time Setup (Onboarding)

1. **Select your languages** - Choose your native language and the language you want to learn
2. **Set your level** - Choose from Absolute Beginner to C1
3. **Pick your interests** - Select topics you're interested in (e.g., Food, Travel, True Crime)
4. **Configure voice settings** - Select your preferred TTS voice, speed, and auto-play preferences

### Learning Flow

1. **Choose a Blitz** - Select from AI-generated topic suggestions matched to your interests
2. **Read & Listen** - Read a short article while optionally listening to natural voice playback
3. **Click words** - Get instant translations for any word you don't know
4. **Take a Quiz** - Test your comprehension with an AI-generated question
5. **Practice Vocabulary** - Review words you clicked using flashcards
6. **Repeat** - Get new topic suggestions and continue learning!

### TTS Controls

- **🔊 Play/Pause** - Start or pause article playback
- **⏹️ Stop** - Stop playback completely
- **Auto-play** - Automatically read new articles (configurable)
- **Speed adjustment** - Change playback speed from 0.6x (slower) to 1.4x (faster)
  - Auto-adjusts based on your proficiency level
  - Absolute Beginner: 0.6x | A1: 0.7x | A2: 0.8x | B1: 0.9x | B2: 1.0x | C1: 1.1x

---

## 🎨 Design System

### Typography
- **Headings, Buttons, UI Elements:** Poppins (400, 500, 600, 700)
- **Article Content:** Aleo (300, 400, 700)

### Colors
- **Primary Gradient:** `#004AAD` → `#CB6CE6`
  - Logo text
  - Main action buttons
  - Selected cards
  - Flashcard fronts
  - Progress bars

- **Secondary Buttons:** White background with `#6263C4` border
- **Vocabulary Buttons:** 
  - "Keep practicing": Red border
  - "I know it": Green border

### Border Radius
- All UI elements: **20px** (`rounded-lingoblitz`)

---

## ⚡ Performance

### Response Times (OpenAI GPT-4o)
- **Article generation:** < 500ms
- **First word visible:** Typically < 700ms from button click
- **Translations:** < 1000ms
- **Quiz generation:** < 2000ms
- **TTS initialization:** < 100ms (local voices) / < 500ms (cloud voices)

### Optimization Features
- **Prompt Caching:** System prompts are automatically cached by OpenAI
- **Streaming:** Articles stream token-by-token for instant feedback
- **Efficient API calls:** Minimal latency with smart retry logic
- **Local TTS processing:** Web Speech API uses browser's built-in voices

---

## 💰 API Costs

Estimated monthly costs for moderate usage with OpenAI GPT-4o:

| Usage Level | Articles | Translations | Quizzes | Monthly Cost |
|-------------|----------|--------------|---------|--------------|
| Light       | 50       | 250          | 50      | ~$0.50       |
| Moderate    | 100      | 500          | 100     | ~$0.80-1.00  |
| Heavy       | 200      | 1000         | 200     | ~$1.50-2.00  |

*Costs include ~50% reduction from prompt caching*
*TTS is free (uses browser's built-in voices)*

---

## 📁 Project Structure

```
lingoblitz/
├── src/
│   ├── services/
│   │   ├── aiService.ts          # OpenAI API integration
│   │   └── ttsService.ts         # Web Speech API for TTS
│   ├── components/
│   │   ├── Onboarding.tsx        # Initial setup flow
│   │   ├── TopicSelector.tsx     # Topic selection UI
│   │   ├── Article.tsx           # Article display with TTS controls
│   │   ├── Quiz.tsx              # Quiz interaction
│   │   ├── VocabularyPractice.tsx # Flashcard practice
│   │   ├── PostArticleActions.tsx # Action buttons
│   │   ├── SettingsModal.tsx     # Settings interface with TTS options
│   │   └── icons/                # Icon components
│   ├── App.tsx                   # Main application
│   ├── types.ts                  # TypeScript types
│   ├── constants.ts              # Configuration & constants
│   └── index.tsx                 # App entry point
├── index.html                    # HTML template
├── vite.config.ts                # Vite configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

---

## 🔧 Development

### Current Status (November 2025)

**✅ Completed Features:**
- Article generation with streaming
- Interactive word translation
- Comprehension quizzes
- Vocabulary practice with flashcards
- Settings modal with full configuration
- Text-to-Speech for articles
  - Auto-play on article load
  - Pause/resume/stop controls
  - Voice selection (Microsoft/Google/Apple)
  - Adjustable playback speed
  - Auto-adjust speed by level
  - Auto-select best voice for language

**🚧 In Progress:**
- TTS for quiz answers
- TTS for word translations in popups

**📋 Planned Features:**
- Spaced repetition system for vocabulary
- Progress tracking and statistics
- Export vocabulary lists
- Achievement system
- More language support
- Community features

### Key Technologies

- **React 19** - Latest React with improved performance
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool and dev server
- **OpenAI API** - GPT-4o for content generation
- **Web Speech API** - Browser-native text-to-speech

### Development Features

- **Hot Module Replacement (HMR)** - Instant updates during development
- **DEV_LOGGING** - Performance logging in development mode
- **Error Handling** - Automatic retry with exponential backoff
- **Prompt Caching** - Reduced costs through smart API usage

### Building for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` folder.

---

## 🎯 Key Features Explained

### Text-to-Speech (TTS)

LingoBlitz uses the Web Speech API for natural voice playback:

**Voice Priority:**
1. **Microsoft voices** (e.g., Microsoft Juan for Spanish) - Highest quality
2. **Google voices** (e.g., Google US English) - Good quality
3. **Apple voices** (e.g., Mónica for Spanish, Daniel for English) - Local fallback

**Preferred Apple Voices:**
- French: Thomas (fr-FR)
- English: Daniel (en-GB)
- Spanish: Mónica (es-ES)
- German: Anna (de-DE)
- Italian: Alice (it-IT)
- Portuguese: Joana (pt-PT)
- Japanese: Kyoko (ja-JP)
- Chinese: Ting-Ting (zh-CN)

**Speed Settings by Level:**
- Absolute Beginner: 0.6x (40% slower for careful listening)
- A1: 0.7x (30% slower)
- A2: 0.8x (20% slower)
- B1: 0.9x (10% slower)
- B2: 1.0x (normal speed)
- C1: 1.1x (10% faster for advanced learners)

### Prompt Caching

LingoBlitz uses OpenAI's prompt caching to reduce costs by ~50%:

- **System prompts** (generic instructions) are cached automatically
- **User prompts** (with variables) are sent fresh each time
- Cache hits are automatic - no extra configuration needed

### Adaptive Content Generation

Articles are tailored to your level:

| Level | Word Count | Complexity | TTS Speed |
|-------|-----------|------------|-----------|
| Absolute Beginner | 50 words | Basic vocabulary, present tense only | 0.6x |
| A1 | 80 words | Simple sentences, common nouns | 0.7x |
| A2 | 150 words | Past tense introduced | 0.8x |
| B1 | 250 words | Complex sentences, wider vocabulary | 0.9x |
| B2 | 350 words | Nuanced vocabulary, idioms | 1.0x |
| C1 | 450 words | Advanced structures, formal/informal tone | 1.1x |

### Intelligent Topic Suggestions

The AI generates topics based on:
- Your selected interests
- Topics you've already read (avoided)
- Your language level
- Variety and engagement

---

## 🛠 Known Issues

### Resolved Issues ✅

- ~~Slow article generation (36+ seconds)~~ **FIXED** - Now < 500ms with OpenAI GPT-4o
- ~~Sky blue color scheme~~ **UPDATED** - New gradient design system
- ~~Inconsistent button styling~~ **FIXED** - Unified design language
- ~~Azure TTS SDK reliability issues~~ **FIXED** - Migrated to Web Speech API
- ~~Voice not changing with language~~ **FIXED** - Auto-selects best voice

### Current Limitations

- **Browser Compatibility:** TTS requires modern browsers (Chrome, Safari, Edge, Firefox)
- **Voice Availability:** Voice selection depends on operating system and browser
- **Network Requirements:** Active internet connection required for API calls
- **Language Support:** Limited to languages supported by both OpenAI and Web Speech API

---

## 📜 Next Steps

### Immediate Priorities

1. **TTS for Quiz Answers** - Add voice playback to quiz answer options
2. **TTS for Translation Popups** - Play pronunciation when hovering over translated words
3. **Voice Selection Improvements** - Better voice filtering and preview

### Future Enhancements

- Spaced repetition system
- Progress tracking dashboard
- Vocabulary export (CSV/Anki)
- Achievement badges
- Multiple article formats (dialogues, stories)
- Audio-only mode for listening practice
- Speech recognition for pronunciation practice

---

## 🆘 Troubleshooting

### Common Issues

**Issue:** "Failed to load article"
- **Solution:** Check your OpenAI API key in `.env.local`
- Ensure you have API credits available

**Issue:** "Network error"
- **Solution:** Check your internet connection
- Verify API key is valid

**Issue:** TTS not working
- **Solution:** Check browser compatibility (Chrome, Safari, Edge, Firefox recommended)
- Enable system voices in browser settings
- Try a different voice from the dropdown

**Issue:** No voices available for language
- **Solution:** Download language packs from system settings
- Try a different browser
- Use cloud-based voices (Microsoft/Google) if available

**Issue:** Voice quality poor
- **Solution:** Select a different voice (Microsoft > Google > Apple)
- Adjust playback speed
- Check system volume settings

---

## 📝 Migration Notes

### OpenAI Migration (November 2024)

LingoBlitz was migrated from Google Gemini to OpenAI GPT-4o:

**Benefits:**
- 80x faster article generation (36s → 0.5s)
- More consistent response times
- Better quality outputs
- Lower costs with prompt caching

**Breaking Changes:**
- Removed `@google/genai` dependency
- Added `openai` package
- Environment variable changed from `GEMINI_API_KEY` to `OPENAI_API_KEY`

### TTS Implementation (November 2025)

Added Text-to-Speech functionality using Web Speech API:

**Why Web Speech API?**
- No additional API costs
- Works offline with local voices
- Native browser integration
- Support for multiple voice providers

**Migration from Azure TTS:**
- Removed `microsoft-cognitiveservices-speech-sdk`
- Simplified voice management
- Improved reliability
- Better browser compatibility

---

## 🎨 Design Update (November 2024)

LingoBlitz received a complete visual redesign:

**Typography:**
- Poppins for UI elements
- Aleo for article content

**Colors:**
- New gradient: #004AAD → #CB6CE6
- Unified button styling
- Consistent 20px border radius

**Components Updated:**
- All screens redesigned
- Improved accessibility
- Better dark mode support
- TTS control icons integrated

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Built with ❤️ for language learners everywhere
- Powered by [OpenAI](https://openai.com/)
- Fonts by [Google Fonts](https://fonts.google.com/)
- Icons from Heroicons
- TTS powered by Web Speech API

---

## 🔧 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the OpenAI API documentation

---

## 🔐 Security Notes

- **API Keys:** Never commit your `.env.local` file to version control
- **Browser Usage:** API calls are made from the browser (client-side)
- **Rate Limiting:** Automatic retry logic prevents excessive API calls
- **Data Privacy:** No user data is stored server-side
- **TTS Privacy:** Voice synthesis happens locally in the browser

---

**Happy Learning! 🌍📚✨**

Start your language learning journey with LingoBlitz today!