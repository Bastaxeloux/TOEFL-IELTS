from flask import Flask, render_template, request, jsonify, send_file
from gtts import gTTS
import whisper
import io
import os
import base64
import tempfile
import subprocess
import warnings
import platform
import sys
import json
from pathlib import Path
from shutil import which

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

# Data directory structure
DATA_DIR = Path(__file__).parent / 'data'
DATA_DIR.mkdir(exist_ok=True)

# Task directories
SPEAKING_DIR = DATA_DIR / 'speaking'
WRITING_TASK1_DIR = DATA_DIR / 'writing_task1'
WRITING_TASK2_DIR = DATA_DIR / 'writing_task2'

for task_dir in [SPEAKING_DIR, WRITING_TASK1_DIR, WRITING_TASK2_DIR]:
    task_dir.mkdir(exist_ok=True)

# Audio directory for speaking
(SPEAKING_DIR / 'audio').mkdir(exist_ok=True)

# Diagrams directory for Writing Task 1
(WRITING_TASK1_DIR / 'diagrams').mkdir(exist_ok=True)

# File paths
SPEAKING_PROMPTS = SPEAKING_DIR / 'prompts.json'
WRITING_TASK1_PROMPTS = WRITING_TASK1_DIR / 'prompts.json'
WRITING_TASK2_PROMPTS = WRITING_TASK2_DIR / 'prompts.json'

# Other files
VOCABULARY_FILE = DATA_DIR / 'vocabulary_cards.json'
CONFIG_FILE = DATA_DIR / 'config.json'
UPLOADS_DIR = DATA_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

def find_ffmpeg():
    """Find ffmpeg executable on any platform"""
    ffmpeg_path = which('ffmpeg')
    if ffmpeg_path:
        return ffmpeg_path

    system = platform.system()

    if system == 'Darwin':  # macOS
        possible_paths = [
            '/opt/homebrew/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            '/opt/local/bin/ffmpeg',
        ]
    elif system == 'Windows':
        possible_paths = [
            r'C:\Program Files\ffmpeg\bin\ffmpeg.exe',
            r'C:\ffmpeg\bin\ffmpeg.exe',
            os.path.join(os.getenv('PROGRAMFILES', 'C:\\Program Files'), 'ffmpeg', 'bin', 'ffmpeg.exe'),
            os.path.join(os.getenv('LOCALAPPDATA', ''), 'ffmpeg', 'bin', 'ffmpeg.exe'),
        ]
    else:  # Linux
        possible_paths = [
            '/usr/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            '/snap/bin/ffmpeg',
        ]

    for path in possible_paths:
        if os.path.exists(path):
            return path

    return None

def check_ffmpeg_installed():
    """Check if ffmpeg is installed"""
    ffmpeg_path = find_ffmpeg()

    if ffmpeg_path:
        print(f"✓ FFmpeg found: {ffmpeg_path}")
        return True
    else:
        system = platform.system()
        print("\n" + "="*60)
        print("⚠ FFmpeg NOT FOUND - Audio conversion will not work!")
        print("="*60)

        if system == 'Darwin':
            print("\nTo install ffmpeg on macOS, run:")
            print("  brew install ffmpeg")
        elif system == 'Windows':
            print("\nTo install ffmpeg on Windows:")
            print("  1. Download from: https://www.gyan.dev/ffmpeg/builds/")
            print("  2. Extract to C:\\ffmpeg")
            print("  3. Add C:\\ffmpeg\\bin to your PATH")
        else:
            print("\nTo install ffmpeg on Linux:")
            print("  Ubuntu/Debian: sudo apt-get install ffmpeg")
            print("  Fedora: sudo dnf install ffmpeg")

        print("\n" + "="*60)
        print("The app will still work, but MP3 download will be disabled.")
        print("="*60 + "\n")

        return False

# Initialize Whisper model
print("Loading Whisper model (this may take a minute)...")
whisper_model = whisper.load_model("base")
print("Whisper model loaded!")

# Check ffmpeg availability
FFMPEG_AVAILABLE = check_ffmpeg_installed()
FFMPEG_PATH = find_ffmpeg()

def load_task_prompts(task_name):
    """Load prompts for a specific task"""
    prompt_files = {
        'speaking': SPEAKING_PROMPTS,
        'writing_task1': WRITING_TASK1_PROMPTS,
        'writing_task2': WRITING_TASK2_PROMPTS
    }

    file_path = prompt_files.get(task_name)
    if not file_path or not file_path.exists():
        return {"prompts": []}

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {task_name} prompts: {e}")
        return {"prompts": []}

def save_task_prompts(task_name, data):
    """Save prompts for a specific task"""
    prompt_files = {
        'speaking': SPEAKING_PROMPTS,
        'writing_task1': WRITING_TASK1_PROMPTS,
        'writing_task2': WRITING_TASK2_PROMPTS
    }

    file_path = prompt_files.get(task_name)
    if not file_path:
        return False

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving {task_name} prompts: {e}")
        return False

def load_vocabulary_cards():
    """Load vocabulary cards from file"""
    try:
        if VOCABULARY_FILE.exists():
            with open(VOCABULARY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading vocabulary cards: {e}")
    return []

def save_vocabulary_cards(cards):
    """Save vocabulary cards to file"""
    try:
        with open(VOCABULARY_FILE, 'w', encoding='utf-8') as f:
            json.dump(cards, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving vocabulary cards: {e}")
        return False

def load_config():
    """Load config from file"""
    try:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading config: {e}")
    return {}

def save_config(config):
    """Save config to file"""
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving config: {e}")
        return False

@app.route('/')
def index():
    """Render the main page"""
    config = load_config()
    api_key = config.get('api_key', '')
    return render_template('index.html', api_key=api_key)

@app.route('/speaking')
def speaking():
    """Render Speaking test page"""
    config = load_config()
    api_key = config.get('api_key', '')
    return render_template('speaking.html', api_key=api_key)

@app.route('/writing-task1')
def writing_task1():
    """Render Writing Task 1 page"""
    config = load_config()
    api_key = config.get('api_key', '')
    return render_template('writing_task1.html', api_key=api_key)

@app.route('/writing-task2')
def writing_task2():
    """Render Writing Task 2 page"""
    config = load_config()
    api_key = config.get('api_key', '')
    return render_template('writing_task2.html', api_key=api_key)

@app.route('/vocabulary')
def vocabulary():
    """Vocabulary flashcards page"""
    return render_template('vocabulary.html')

@app.route('/save_config', methods=['POST'])
def save_config_route():
    """Save config (API key) to file"""
    try:
        data = request.get_json()
        config = load_config()
        config['api_key'] = data.get('api_key', '')
        if save_config(config):
            return jsonify({'success': True, 'message': 'Config saved successfully!'})
        else:
            return jsonify({'success': False, 'error': 'Failed to save config'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/vocabulary_cards', methods=['GET'])
def get_vocabulary_cards():
    """Get all vocabulary cards"""
    try:
        cards = load_vocabulary_cards()
        return jsonify({'cards': cards})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vocabulary_cards', methods=['POST'])
def add_vocabulary_card():
    """Add a new vocabulary card"""
    try:
        data = request.get_json()
        cards = load_vocabulary_cards()

        new_card = {
            'date': data.get('date'),
            'question': data.get('question'),
            'title': data.get('title'),
            'content': data.get('content')
        }

        cards.append(new_card)

        if save_vocabulary_cards(cards):
            return jsonify({'success': True, 'message': 'Vocabulary card saved!'})
        else:
            return jsonify({'success': False, 'error': 'Failed to save'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vocabulary_cards/<int:index>', methods=['PUT'])
def update_vocabulary_card(index):
    """Update a vocabulary card by index"""
    try:
        data = request.get_json()
        cards = load_vocabulary_cards()

        if 0 <= index < len(cards):
            if 'content' in data:
                cards[index]['content'] = data['content']

            if save_vocabulary_cards(cards):
                return jsonify({'success': True, 'message': 'Card updated!'})
            else:
                return jsonify({'success': False, 'error': 'Failed to save'}), 500
        else:
            return jsonify({'error': 'Invalid index'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vocabulary_cards/<int:index>', methods=['DELETE'])
def delete_vocabulary_card(index):
    """Delete a vocabulary card by index"""
    try:
        cards = load_vocabulary_cards()

        if 0 <= index < len(cards):
            cards.pop(index)
            if save_vocabulary_cards(cards):
                return jsonify({'success': True, 'message': 'Card deleted!'})
            else:
                return jsonify({'success': False, 'error': 'Failed to save'}), 500
        else:
            return jsonify({'error': 'Invalid index'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/create_audio', methods=['POST'])
def create_audio():
    """Create audio from text using gTTS"""
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        tts = gTTS(text=text, lang='en')
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)

        audio_b64 = base64.b64encode(mp3_fp.read()).decode()

        return jsonify({'audio': audio_b64})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio using Whisper"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']

        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_audio:
            audio_file.save(temp_audio.name)
            temp_path = temp_audio.name

        file_size = os.path.getsize(temp_path)
        print(f"[TRANSCRIBE] Received audio file: {file_size} bytes")

        if file_size < 1000:
            print(f"[TRANSCRIBE] WARNING: Audio file is suspiciously small!")

        try:
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", message="FP16 is not supported on CPU; using FP32 instead")
                result = whisper_model.transcribe(
                    temp_path,
                    verbose=False,
                    language="en",
                    task="transcribe"
                )

            print(f"[TRANSCRIBE] Whisper result: {len(result.get('segments', []))} segments")

            formatted_transcript = ""
            word_count = 0

            for segment in result["segments"]:
                start_time = segment["start"]
                text = segment["text"].strip()
                word_count += len(text.split())
                formatted_transcript += f"[{start_time:.1f}s] {text}\n"

            return jsonify({
                'transcript': formatted_transcript,
                'word_count': word_count
            })

        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/evaluate', methods=['POST'])
def evaluate():
    """Evaluate response using OpenAI GPT"""
    try:
        from openai import OpenAI

        data = request.get_json()
        api_key = data.get('api_key', '')
        task_type = data.get('task_type', 'speaking')  # 'speaking', 'writing_task1', 'writing_task2'

        if not api_key:
            return jsonify({'error': 'No API key provided'}), 400

        # Load existing vocabulary cards to avoid repetition
        vocab_context = ""
        try:
            if VOCABULARY_FILE.exists():
                with open(VOCABULARY_FILE, 'r', encoding='utf-8') as f:
                    vocab_cards = json.load(f)
                    if vocab_cards:
                        previous_suggestions = set()
                        for card in vocab_cards:
                            content = card.get('content', '')
                            import re
                            matches = re.findall(r'Instead of ["\']([^"\']+)["\']', content)
                            previous_suggestions.update(matches)

                        if previous_suggestions:
                            vocab_context = f"\n\n**IMPORTANT - Previous Vocabulary Work:**\nYou have already suggested alternatives for: {', '.join(list(previous_suggestions)[:15])}.\nPRIORITIZE NEW, DIFFERENT vocabulary. Focus on variety and progression."
        except:
            pass

        client = OpenAI(api_key=api_key)

        # Task-specific evaluation
        if task_type == 'speaking':
            transcript = data.get('transcript', '')
            word_count = data.get('word_count', 0)
            speaking_time = data.get('speaking_time', 120)
            part = data.get('part', 1)  # IELTS Speaking Part 1, 2, or 3
            question = data.get('question', '')

            wpm = (word_count / speaking_time * 60) if speaking_time > 0 else 0

            part_descriptions = {
                1: "Part 1 (Introduction & Interview): You answered questions about familiar topics like work, studies, hobbies, and interests.",
                2: "Part 2 (Long Turn): You spoke for 1-2 minutes on a specific topic after 1 minute of preparation.",
                3: "Part 3 (Discussion): You engaged in a detailed discussion exploring abstract ideas related to the Part 2 topic."
            }

            task_context = part_descriptions.get(part, "IELTS Speaking test")

            prompt = f"""You are an experienced IELTS speaking examiner. Your MISSION: Help this student achieve the HIGHEST possible IELTS band score (9.0) by teaching them HIGH-IMPACT vocabulary and expressions that IMPRESS examiners.

**CRITICAL FOCUS:** Band 8-9 vocabulary - sophisticated, less common words and idiomatic expressions that demonstrate advanced proficiency.{vocab_context}

**Task Context:** {task_context}

**Question:** {question}

**Student's Response (transcribed):**
{transcript}

**Statistics:**
- Total words: {word_count}
- Words per minute: {wpm:.1f}

**Your task:**
Provide a detailed evaluation following this structure:

1. **Overall Band Score**:
   - Give an estimated IELTS band score (0-9, can use .5 increments)
   - Format: "Band Score: X.X/9.0"
   - Briefly explain the score based on IELTS criteria

2. **Assessment by IELTS Criteria**:
   - Fluency and Coherence
   - Lexical Resource (Vocabulary)
   - Grammatical Range and Accuracy
   - Pronunciation (based on transcript quality)

3. **Strengths**:
   - List 2-3 specific positive points with examples

4. **Areas for Improvement**:
   - List 2-3 specific issues with examples

5. **Vocabulary Enhancement - HIGH-IMPACT FOCUS**:
   - Identify BASIC or REPETITIVE words/phrases
   - Suggest BAND 8-9 alternatives and idiomatic expressions
   - Provide 2-3 REPHRASING examples with ADVANCED vocabulary
   - Format: "You said: '[quote]' → Better: '[Band 8-9 version]'"

6. **Grammar & Structure**:
   - Note grammatical errors (with corrections)
   - Comment on sentence variety and complexity
   - Suggest advanced structures for higher bands

7. **Recommendations for Band Score Improvement**:
   - Give 2-3 SPECIFIC, ACTIONABLE tactics to boost the score

Format your response in clear HTML with <h4> tags for section titles, <p> tags or <ul> lists for content.
Do NOT use emojis. Do NOT wrap in markdown code blocks. Return only pure HTML content."""

        elif task_type == 'writing_task1':
            text = data.get('text', '')
            word_count = data.get('word_count', 0)
            diagram_description = data.get('diagram_description', '')

            prompt = f"""You are an experienced IELTS Writing Task 1 examiner. Help this student achieve Band 9.0 by teaching them the highest-scoring vocabulary and structures.

**CRITICAL FOCUS:** Band 8-9 academic vocabulary for data description - sophisticated words and phrases that demonstrate advanced analytical writing skills.{vocab_context}

**Task Context:** Writing Task 1 (Academic) - Describe visual information (chart, graph, table, diagram, or process). Minimum 150 words, recommended time 20 minutes.

**Diagram/Chart Description:** {diagram_description}

**Student's Response:**
{text}

**Word Count:** {word_count}

**Your task:**
Provide detailed evaluation following this structure:

1. **Overall Band Score**:
   - Give an estimated IELTS band score (0-9, can use .5 increments)
   - Briefly explain based on IELTS Task 1 criteria

2. **Assessment by IELTS Criteria**:
   - Task Achievement (Did they address all requirements? Clear overview?)
   - Coherence and Cohesion (Logical organization, paragraphing, linking words)
   - Lexical Resource (Vocabulary range and accuracy)
   - Grammatical Range and Accuracy

3. **Strengths**:
   - List 2-3 specific positive points with examples

4. **Areas for Improvement**:
   - List 2-3 specific issues with examples

5. **Vocabulary Enhancement**:
   - Identify basic/repetitive words for describing data
   - Suggest Band 8-9 alternatives (e.g., instead of "increase": surge, escalate, climb, soar)
   - Provide rephrasing examples with advanced vocabulary

6. **Grammar & Structure**:
   - Note errors with corrections
   - Suggest advanced grammatical structures for Task 1

7. **Recommendations for Band Score Improvement**:
   - Give 2-3 SPECIFIC, ACTIONABLE tactics

Format in HTML with <h4> section titles, <p> or <ul> for content. No emojis. No markdown blocks."""

        else:  # writing_task2
            text = data.get('text', '')
            word_count = data.get('word_count', 0)
            question = data.get('question', '')
            essay_type = data.get('essay_type', 'opinion')

            prompt = f"""You are an experienced IELTS Writing Task 2 examiner. Help this student achieve Band 9.0 by teaching them the highest-scoring vocabulary and argumentation techniques.

**CRITICAL FOCUS:** Band 8-9 academic essay vocabulary - sophisticated expressions, hedging language, and advanced discourse markers.{vocab_context}

**Task Context:** Writing Task 2 (Essay) - Write at least 250 words in 40 minutes. Essay type: {essay_type}

**Question:** {question}

**Student's Response:**
{text}

**Word Count:** {word_count}

**Your task:**
Provide detailed evaluation following this structure:

1. **Overall Band Score**:
   - Give an estimated IELTS band score (0-9, can use .5 increments)
   - Briefly explain based on IELTS Task 2 criteria

2. **Assessment by IELTS Criteria**:
   - Task Response (Did they fully address all parts? Clear position? Well-developed ideas?)
   - Coherence and Cohesion (Logical progression, paragraphing, cohesive devices)
   - Lexical Resource (Vocabulary sophistication and accuracy)
   - Grammatical Range and Accuracy

3. **Strengths**:
   - List 2-3 specific positive points with examples

4. **Areas for Improvement**:
   - List 2-3 specific issues with examples

5. **Vocabulary Enhancement - HIGH-IMPACT FOCUS**:
   - Identify BASIC or REPETITIVE words/phrases
   - Suggest Band 8-9 alternatives and sophisticated expressions
   - Provide rephrasing examples
   - Suggest power phrases and discourse markers

6. **Grammar & Structure**:
   - Note errors with corrections
   - Comment on sentence variety
   - Suggest advanced structures (complex sentences, conditionals, passive voice, etc.)

7. **Recommendations for Band Score Improvement**:
   - Give 2-3 SPECIFIC, ACTIONABLE tactics

Format in HTML with <h4> section titles, <p> or <ul> for content. No emojis. No markdown blocks."""

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert IELTS examiner. Provide detailed, constructive feedback. Do not use any emojis. Return only HTML content without markdown code blocks."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )

        feedback = response.choices[0].message.content

        # Clean up the feedback
        import re
        feedback = re.sub(r'^```html\s*', '', feedback, flags=re.MULTILINE)
        feedback = re.sub(r'```\s*$', '', feedback, flags=re.MULTILINE)
        feedback = re.sub(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002702-\U000027B0\U000024C2-\U0001F251]+', '', feedback)

        return jsonify({'feedback': feedback})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/convert_to_mp3', methods=['POST'])
def convert_to_mp3():
    """Convert WebM audio to MP3"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']

        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_webm:
            audio_file.save(temp_webm.name)
            webm_path = temp_webm.name

        mp3_path = webm_path.replace('.webm', '.mp3')

        try:
            if not FFMPEG_AVAILABLE or not FFMPEG_PATH:
                return jsonify({'error': 'FFmpeg not installed. Please install FFmpeg to enable MP3 conversion.'}), 400

            subprocess.run([
                FFMPEG_PATH, '-i', webm_path,
                '-codec:a', 'libmp3lame',
                '-qscale:a', '2',
                mp3_path,
                '-y'
            ], check=True, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)

            with open(mp3_path, 'rb') as f:
                mp3_data = f.read()
            mp3_b64 = base64.b64encode(mp3_data).decode()

            return jsonify({'mp3': mp3_b64})

        finally:
            if os.path.exists(webm_path):
                os.unlink(webm_path)
            if os.path.exists(mp3_path):
                os.unlink(mp3_path)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Routes for prompt management
@app.route('/api/<task_name>/prompts/list')
def list_prompts(task_name):
    """List all prompts for a specific task"""
    if task_name not in ['speaking', 'writing_task1', 'writing_task2']:
        return jsonify({'error': 'Invalid task name'}), 400

    try:
        data = load_task_prompts(task_name)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/<task_name>/prompts/<int:prompt_id>')
def get_prompt(task_name, prompt_id):
    """Get a specific prompt by ID"""
    if task_name not in ['speaking', 'writing_task1', 'writing_task2']:
        return jsonify({'error': 'Invalid task name'}), 400

    try:
        data = load_task_prompts(task_name)
        for prompt in data.get('prompts', []):
            if prompt['id'] == prompt_id:
                return jsonify(prompt)
        return jsonify({'error': 'Prompt not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/<task_name>/prompts', methods=['POST'])
def create_prompt(task_name):
    """Create a new prompt"""
    if task_name not in ['speaking', 'writing_task1', 'writing_task2']:
        return jsonify({'error': 'Invalid task name'}), 400

    try:
        incoming_data = request.get_json()
        data = load_task_prompts(task_name)

        new_id = max([p['id'] for p in data['prompts']], default=0) + 1

        new_prompt = {'id': new_id}

        if task_name == 'speaking':
            new_prompt['part'] = incoming_data.get('part', 1)
            new_prompt['question'] = incoming_data.get('question', '')
            new_prompt['topic'] = incoming_data.get('topic', '')  # For Part 2 cue cards
            new_prompt['audio_file'] = incoming_data.get('audio_file')
        elif task_name == 'writing_task1':
            new_prompt['diagram_file'] = incoming_data.get('diagram_file')
            new_prompt['diagram_description'] = incoming_data.get('diagram_description', '')
            new_prompt['question'] = incoming_data.get('question', '')
        elif task_name == 'writing_task2':
            new_prompt['question'] = incoming_data.get('question', '')
            new_prompt['essay_type'] = incoming_data.get('essay_type', 'opinion')

        data['prompts'].append(new_prompt)

        if save_task_prompts(task_name, data):
            return jsonify({'success': True, 'prompt': new_prompt})
        else:
            return jsonify({'error': 'Failed to save prompt'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/<task_name>/prompts/<int:prompt_id>', methods=['PUT'])
def update_prompt(task_name, prompt_id):
    """Update an existing prompt"""
    if task_name not in ['speaking', 'writing_task1', 'writing_task2']:
        return jsonify({'error': 'Invalid task name'}), 400

    try:
        incoming_data = request.get_json()
        data = load_task_prompts(task_name)

        for i, prompt in enumerate(data['prompts']):
            if prompt['id'] == prompt_id:
                if task_name == 'speaking':
                    if 'part' in incoming_data:
                        prompt['part'] = incoming_data['part']
                    if 'question' in incoming_data:
                        prompt['question'] = incoming_data['question']
                    if 'topic' in incoming_data:
                        prompt['topic'] = incoming_data['topic']
                    if 'audio_file' in incoming_data:
                        prompt['audio_file'] = incoming_data['audio_file']
                elif task_name == 'writing_task1':
                    if 'diagram_file' in incoming_data:
                        prompt['diagram_file'] = incoming_data['diagram_file']
                    if 'diagram_description' in incoming_data:
                        prompt['diagram_description'] = incoming_data['diagram_description']
                    if 'question' in incoming_data:
                        prompt['question'] = incoming_data['question']
                elif task_name == 'writing_task2':
                    if 'question' in incoming_data:
                        prompt['question'] = incoming_data['question']
                    if 'essay_type' in incoming_data:
                        prompt['essay_type'] = incoming_data['essay_type']

                data['prompts'][i] = prompt

                if save_task_prompts(task_name, data):
                    return jsonify({'success': True, 'prompt': prompt})
                else:
                    return jsonify({'error': 'Failed to save prompt'}), 500

        return jsonify({'error': 'Prompt not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/<task_name>/prompts/<int:prompt_id>', methods=['DELETE'])
def delete_prompt(task_name, prompt_id):
    """Delete a prompt"""
    if task_name not in ['speaking', 'writing_task1', 'writing_task2']:
        return jsonify({'error': 'Invalid task name'}), 400

    try:
        data = load_task_prompts(task_name)
        data['prompts'] = [p for p in data['prompts'] if p['id'] != prompt_id]

        if save_task_prompts(task_name, data):
            return jsonify({'success': True, 'message': 'Prompt deleted'})
        else:
            return jsonify({'error': 'Failed to delete prompt'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/<task_name>/upload_audio', methods=['POST'])
def upload_audio(task_name):
    """Upload audio file for speaking task"""
    if task_name != 'speaking':
        return jsonify({'error': 'Audio upload only for speaking task'}), 400

    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        audio_dir = SPEAKING_DIR / 'audio'
        original_filename = audio_file.filename
        saved_path = audio_dir / original_filename

        counter = 1
        while saved_path.exists():
            name_parts = os.path.splitext(original_filename)
            new_filename = f"{name_parts[0]}_{counter}{name_parts[1]}"
            saved_path = audio_dir / new_filename
            counter += 1

        audio_file.save(saved_path)

        return jsonify({
            'success': True,
            'message': 'Audio uploaded successfully!',
            'filename': saved_path.name
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/<task_name>/upload_diagram', methods=['POST'])
def upload_diagram(task_name):
    """Upload diagram/chart image for Writing Task 1"""
    if task_name != 'writing_task1':
        return jsonify({'error': 'Diagram upload only for Writing Task 1'}), 400

    try:
        if 'diagram' not in request.files:
            return jsonify({'error': 'No diagram file provided'}), 400

        diagram_file = request.files['diagram']
        if diagram_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        diagram_dir = WRITING_TASK1_DIR / 'diagrams'
        original_filename = diagram_file.filename
        saved_path = diagram_dir / original_filename

        counter = 1
        while saved_path.exists():
            name_parts = os.path.splitext(original_filename)
            new_filename = f"{name_parts[0]}_{counter}{name_parts[1]}"
            saved_path = diagram_dir / new_filename
            counter += 1

        diagram_file.save(saved_path)

        return jsonify({
            'success': True,
            'message': 'Diagram uploaded successfully!',
            'filename': saved_path.name
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/speaking/audio/<filename>')
def serve_speaking_audio(filename):
    """Serve audio file for speaking task"""
    try:
        audio_path = SPEAKING_DIR / 'audio' / filename
        if not audio_path.exists():
            return jsonify({'error': 'Audio file not found'}), 404
        return send_file(audio_path)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/writing_task1/diagram/<filename>')
def serve_diagram(filename):
    """Serve diagram file for Writing Task 1"""
    try:
        diagram_path = WRITING_TASK1_DIR / 'diagrams' / filename
        if not diagram_path.exists():
            return jsonify({'error': 'Diagram file not found'}), 404
        return send_file(diagram_path)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    Path('templates').mkdir(exist_ok=True)
    Path('static').mkdir(exist_ok=True)
    print("\n" + "="*60)
    print("IELTS Practice Tool - Starting Server")
    print("="*60)
    print("\nOnce the server starts, open your browser and go to:")
    print("\n    http://localhost:5002\n")
    print("="*60 + "\n")

    app.run(debug=True, host='0.0.0.0', port=5002)
