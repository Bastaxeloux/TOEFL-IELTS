# IELTS Practice Tool

A comprehensive web application for practicing IELTS (International English Language Testing System) Speaking and Writing tasks with AI-powered feedback.

## Features

### Speaking Practice
- **Part 1**: Introduction & Interview (4-5 minutes)
- **Part 2**: Long Turn / Cue Card (3-4 minutes with 1-minute preparation)
- **Part 3**: Discussion (4-5 minutes)
- Audio recording functionality
- Automatic transcription using OpenAI Whisper
- AI-powered feedback based on IELTS band descriptors

### Writing Practice

#### Writing Task 1 (Academic)
- Describe visual information (charts, graphs, tables, diagrams, processes)
- 20-minute timer
- Minimum 150 words
- Upload and practice with custom diagrams
- AI evaluation based on IELTS Writing Task 1 criteria

#### Writing Task 2 (Essay)
- Multiple essay types:
  - Opinion (Agree/Disagree)
  - Discussion (Both Views)
  - Advantages and Disadvantages
  - Problem and Solution
  - Two Questions
- 40-minute timer
- Minimum 250 words
- AI evaluation based on IELTS Writing Task 2 criteria

### Additional Features
- **Vocabulary Flashcards**: Save AI feedback as vocabulary cards for review
- **Customizable Prompts**: Add, modify, and manage your own practice questions
- **Local Storage**: All data (prompts, config, vocabulary) stored locally on your machine
- **Privacy**: Your OpenAI API key is stored locally and never shared

## Installation

### Prerequisites
- Python 3.8 or higher
- FFmpeg (for audio conversion)
- OpenAI API key (for AI evaluation)

### Installing FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
1. Download from https://www.gyan.dev/ffmpeg/builds/
2. Extract to C:\ffmpeg
3. Add C:\ffmpeg\bin to your PATH

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# Fedora
sudo dnf install ffmpeg

# Arch
sudo pacman -S ffmpeg
```

### Setup

1. Clone or download this repository

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Open your browser and navigate to:
```
http://localhost:5002
```

## Usage

### First-Time Setup

1. **Add your OpenAI API Key**:
   - Go to the "Customization" tab on the home page
   - Enter your API key (get one at https://platform.openai.com/api-keys)
   - Click "Save"

2. **Add Practice Prompts**:
   - Navigate to any task (Speaking, Writing Task 1, or Writing Task 2)
   - Go to the "Manage Prompts" tab
   - Add your practice questions

### Speaking Practice

1. Select the Speaking part you want to practice (Part 1, 2, or 3)
2. Click "Start Practice"
3. Read the question
4. Click "Start Recording" when ready
5. Speak your response
6. Click "Stop Recording" when done
7. Click "Get Transcript" to see the transcription
8. Click "Get AI Evaluation" for detailed feedback

### Writing Practice

1. Click "Start Practice" to get a random question
2. (Optional) Click "Start Timer" to begin the timed practice
3. Write your response in the text area
4. Click "Get AI Evaluation" when ready
5. Review the AI feedback
6. Save useful vocabulary tips to your flashcards

### Vocabulary Flashcards

- After receiving AI feedback, click "Add to Vocabulary" to save it
- View all your saved flashcards by clicking "View My Vocabulary Flashcards" on the home page
- Edit or delete cards as needed

## Project Structure

```
IELTS/
├── app.py                      # Flask backend
├── requirements.txt            # Python dependencies
├── .gitignore                 # Git ignore file
├── data/                      # Local data storage (created on first run)
│   ├── config.json           # API key and settings
│   ├── vocabulary_cards.json # Saved vocabulary flashcards
│   ├── speaking/             # Speaking prompts and audio
│   ├── writing_task1/        # Writing Task 1 prompts and diagrams
│   └── writing_task2/        # Writing Task 2 prompts
├── templates/                 # HTML templates
│   ├── index.html
│   ├── speaking.html
│   ├── writing_task1.html
│   ├── writing_task2.html
│   └── vocabulary.html
└── static/                    # CSS and JavaScript
    ├── styles.css
    ├── favicon.png
    ├── speaking.js
    ├── writing_task1.js
    └── writing_task2.js
```

## Privacy & Data

- **All data is stored locally** on your machine in the `data/` directory
- Your OpenAI API key is stored in `data/config.json` (excluded from git)
- No data is sent to any server except OpenAI's API for evaluation
- Audio recordings are temporarily stored in memory and not saved permanently

## AI Evaluation

The AI evaluation uses OpenAI's GPT-4o-mini model to provide feedback based on official IELTS criteria:

### Speaking Criteria
- Fluency and Coherence
- Lexical Resource (Vocabulary)
- Grammatical Range and Accuracy
- Pronunciation

### Writing Criteria
- Task Achievement (Task 1) / Task Response (Task 2)
- Coherence and Cohesion
- Lexical Resource
- Grammatical Range and Accuracy

## Cost Estimation

Using GPT-4o-mini for evaluation:
- Approximate cost per evaluation: $0.01-0.03 USD
- Cost depends on response length and feedback detail
- Always check current OpenAI pricing at https://openai.com/pricing

## Troubleshooting

### Audio Recording Not Working
- Ensure your browser has microphone permissions
- Try using Chrome or Firefox (best browser support)
- Check that no other application is using the microphone

### FFmpeg Not Found
- Verify FFmpeg is installed: `ffmpeg -version`
- Ensure FFmpeg is in your system PATH
- Restart your terminal/command prompt after installation

### API Key Errors
- Verify your API key is valid
- Check your OpenAI account has available credits
- Ensure the API key has proper permissions

### Port Already in Use
- If port 5002 is already in use, edit `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5003)  # Change port number
```

## Credits

Adapted from the TOEFL Practice Tool by Le Guillouzic Maël.

## License

Available for personal and educational use only.

## Support

For issues or questions, please check the code comments or create an issue in the repository.

---

**Happy IELTS practicing! 🎯**
