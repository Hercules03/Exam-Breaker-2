# Exam Breaker - Multiple Choice Revision Companion

**Study multiple choice questions anywhere, anytime** with Exam Breaker—a convenient, easy-to-use mobile-first web app designed for practicing and revising your knowledge on-the-go. Perfect for revising while commuting, waiting in queues, or taking quick study breaks.

---

## About

Exam Breaker is a mobile-optimized web application that helps students and professionals practice multiple-choice exams efficiently. Whether you're preparing for certifications, standardized tests, or educational exams, Exam Breaker makes it easy to study your own questions with progress tracking and detailed explanations to reinforce your learning.

---

## 🚀 Key Features

- **📥 Flexible CSV Import** - Import questions from any CSV file with your own question data. Supports two flexible formats to accommodate different CSV structures
- **🌐 Domain Filtering** - Filter questions by specific domains/topics to focus your study on particular subjects
- **🎲 Random Questions** - Study randomly selected questions to test your knowledge across all domains
- **📊 Progress Analytics** - Track your mastery level by domain with detailed statistics on correct/incorrect answers and attempt counts
- **💾 Offline Support** - Fully functional offline with IndexedDB (Dexie) local storage—study anywhere without internet
- **📝 Detailed Explanations** - Every question includes a detailed explanation to help you understand why an answer is correct
- **🎨 Clean, Modern UI** - Intuitive and distraction-free interface optimized for focused studying
- **📱 Mobile-First Design** - Optimized for mobile devices with responsive layout, perfect for studying on-the-go
- **⚡ Fast & Lightweight** - Built with modern web technologies for instant load times and smooth interactions
- **✅ Review Tracking** - Track attempts and review counts to identify questions needing more practice

---

## 🛠️ Tech Stack

- **Frontend**: React 18.2 with TypeScript 5
- **Build Tool**: Vite 5 (lightning-fast builds and dev server)
- **Database**: Dexie 4 (IndexedDB wrapper for local storage)
- **Styling**: Tailwind CSS 3.4 with PostCSS
- **Icons**: Lucide React 0.344
- **Deployment**: GitHub Pages with automated CI/CD
- **Runtime**: ES Modules

---

## 📋 CSV Import Format

Exam Breaker supports two CSV formats for maximum flexibility:

### Standard Format (9 columns)
```
id,stem,optionA,optionB,optionC,optionD,correctAnswer,explanation,domain
1,"What is the capital of France?","London","Paris","Berlin","Madrid",B,"Paris is the capital and largest city of France.","Geography"
```

### Alternative Format (5 columns)
```
#,question,answer,explanation,domain
1,"What is the capital of France?
A.) London
B.) Paris
C.) Berlin
D.) Madrid",B,"Paris is the capital and largest city of France.","Geography"
```

**Required Fields**:
- `id` or `#` - Unique identifier for the question
- `stem` or `question` - The question text
- `optionA`, `optionB`, `optionC`, `optionD` - Answer choices (or embedded in question)
- `correctAnswer` or `answer` - Correct answer (A, B, C, or D)
- `explanation` - Detailed explanation for the answer
- `domain` - Subject/topic category for filtering

---

## 🎯 How It Works

1. **Import Questions** - Upload your CSV file containing multiple-choice questions. Exam Breaker validates and parses the data, providing detailed feedback on any errors.

2. **Browse & Study** - View all your questions organized by domain. Use domain filters to focus on specific topics or select random questions for comprehensive review.

3. **Answer & Learn** - Select your answer and immediately see if it's correct. Read the detailed explanation to understand the concept better.

4. **Track Progress** - Monitor your mastery percentage by domain. See statistics on total questions, correct answers, and attempt history.

5. **Revise Effectively** - Use random question mode and domain filtering to target weak areas and reinforce your knowledge.

All your data is stored locally in your browser—no server uploads, complete privacy.

---

## 📸 UI Preview

### Question List View
![Question List](./screenshots/questionPage.png)

### Question Detail View
![Question Example 1](./screenshots/exampleQuestion.png)
![Question Example 2](./screenshots/exampleQuestion\(1\).png)
![Question Example 3](./screenshots/exampleQuestion\(2\).png)
![Question Example 4](./screenshots/exampleQuestion\(3\).png)

### Progress Analytics
![Progress Analytics](./screenshots/progressPage.png)

### Import Page
![Import Page](./screenshots/importPage.png)

### Settings
![Settings](./screenshots/settingPage.png)

---

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/Hercules03/Exam-Breaker.git
cd Exam-Breaker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🌐 Live Demo

**Try it now**: https://hercules03.github.io/Exam-Breaker/

The app is fully functional and ready to use. Start by importing your CSV questions or try the example format to see how it works!

---

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 💡 Tips for Best Results

1. **Organize by Domain** - Group related questions under meaningful domain names for better filtering
2. **Write Clear Explanations** - Detailed explanations help reinforce learning
3. **Review Weak Areas** - Use progress analytics to identify domains needing more practice
4. **Practice Randomly** - Random question mode helps test comprehensive knowledge

---

## 🔗 Links

- **Live Demo**: https://hercules03.github.io/Exam-Breaker/
- **Repository**: https://github.com/Hercules03/Exam-Breaker
- **Issues & Feedback**: https://github.com/Hercules03/Exam-Breaker/issues

---

## 📄 License

This project is open source and available under the MIT License.
