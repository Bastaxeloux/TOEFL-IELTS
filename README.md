<div align="center">
  <img src="TOEFL/static/favicon.png" alt="TOEFL Practice Tool Logo" width="120" height="120">

  # TOEFL & IELTS Practice Tools

  ### Ce dépôt contient deux app web similaires pour pratiquer les tests de langue anglaise TOEFL et IELTS avec des retours IA.

  [![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
  [![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)](https://flask.palletsprojects.com/)
  [![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-orange.svg)](https://openai.com/)
  [![License](https://img.shields.io/badge/License-Personal%20Use-red.svg)](#licence)

  ---

  **Réalisé par** [Maël Le Guillouzic](https://github.com/Bastaxeloux)

</div>

## Structure du Projet

```
TOEFL-IELTS/
├── TOEFL/          # Application pour pratiquer le TOEFL
│   ├── app.py
│   ├── templates/
│   ├── static/
│   ├── data/
│   └── README.md
│
└── IELTS/          # Application pour pratiquer l'IELTS
    ├── app.py
    ├── templates/
    ├── static/
    ├── data/
    └── README.md
```

## Applications

### TOEFL Practice Tool
Application complète pour s'entraîner au TOEFL avec:
- **Speaking**: 4 tâches (Independent Speaking, Campus Announcement, Academic Concept, Lecture Summary)
- **Writing**: 2 tâches (Integrated Writing, Academic Discussion)
- Test complet ou pratique par tâche
- Enregistrement audio et transcription
- Retours IA détaillés
- Cartes de vocabulaire

Voir [TOEFL/README.md](TOEFL/README.md) pour plus de détails.

**Port**: 5001

### IELTS Practice Tool
Application complète pour s'entraîner à l'IELTS avec:
- **Speaking**: 3 parties (Introduction, Cue Card, Discussion)
- **Writing Task 1**: Description de données visuelles (graphiques, diagrammes)
- **Writing Task 2**: Rédaction d'essais argumentatifs
- Enregistrement audio et transcription
- Retours IA basés sur les critères IELTS
- Cartes de vocabulaire

Voir [IELTS/README.md](IELTS/README.md) pour plus de détails.

**Port**: 5002

## Points Communs

Les deux applications partagent:
- **Technologies**: Flask, OpenAI Whisper, OpenAI GPT-4o-mini
- **Fonctionnalités**:
  - Stockage local des données
  - Clé API OpenAI stockée localement (jamais partagée)
  - Enregistrement audio avec transcription automatique
  - Retours IA personnalisés et détaillés
  - Système de cartes de vocabulaire
  - Gestion des prompts personnalisés
  - Timer pour chaque tâche
  - Support audio et téléchargement

## Installation Rapide

### Prérequis
- Python 3.8+
- FFmpeg (pour la conversion audio)
- Clé API OpenAI (pour les retours IA)

### Installation FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
1. Télécharger depuis https://www.gyan.dev/ffmpeg/builds/
2. Extraire dans C:\ffmpeg
3. Ajouter C:\ffmpeg\bin au PATH

**Linux:**
```bash
sudo apt-get install ffmpeg  # Ubuntu/Debian
```

### Démarrage

**TOEFL:**
```bash
cd TOEFL
pip install -r requirements.txt
python app.py
# Ouvrir http://localhost:5001
```

**IELTS:**
```bash
cd IELTS
pip install -r requirements.txt
python app.py
# Ouvrir http://localhost:5002
```

## Utilisation

1. **Première utilisation**:
   - Ajouter votre clé API OpenAI dans l'onglet "Customization"
   - Ajouter des prompts de pratique (ou utiliser les exemples fournis)

2. **Pratiquer**:
   - Choisir une tâche
   - Enregistrer votre réponse (Speaking) ou écrire (Writing)
   - Obtenir la transcription et l'évaluation IA
   - Sauvegarder les conseils utiles dans les flashcards de vocabulaire

3. **Réviser**:
   - Consulter vos cartes de vocabulaire
   - Revoir les retours IA précédents
   - Suivre votre progression

## Différences TOEFL vs IELTS

### Format des Tests

**TOEFL Speaking:**
- 4 tâches distinctes
- Mix de questions indépendantes et intégrées
- Temps de préparation: 15-30 secondes
- Temps de réponse: 45-60 secondes

**IELTS Speaking:**
- 3 parties continues
- Conversation plus naturelle
- Part 2: 1 minute de préparation, 1-2 minutes de parole
- Part 1 & 3: Questions-réponses

**TOEFL Writing:**
- Task 1: Integrated (lecture + reading, 150-225 mots)
- Task 2: Academic Discussion (100+ mots)

**IELTS Writing:**
- Task 1: Description de données (150+ mots, 20 minutes)
- Task 2: Essai argumentatif (250+ mots, 40 minutes)

### Critères d'Évaluation

**TOEFL**: Score 0-5 avec pourcentage
- Delivery / Language Use
- Topic Development

**IELTS**: Band Score 0-9 (avec .5)
- Fluency and Coherence
- Lexical Resource
- Grammatical Range and Accuracy
- Pronunciation (Speaking) / Task Achievement (Writing)

## Confidentialité

- Toutes les données stockées localement
- Clé API jamais partagée (fichier .gitignore)
- Pas de compte utilisateur requis
- Les enregistrements audio ne sont pas sauvegardés de façon permanente

## Coûts

Utilisation de GPT-4o-mini pour les évaluations:
- ~0.01-0.03 USD par évaluation
- Coût total dépend de votre utilisation
- Vérifier les prix actuels: https://openai.com/pricing

## Support

Pour des questions ou problèmes:
1. Consulter les README spécifiques (TOEFL/README.md ou IELTS/README.md)
2. Vérifier les commentaires dans le code
3. Créer une issue dans le dépôt

## Crédits

Application TOEFL originale adaptée par Le Guillouzic Maël.
Application IELTS créée en s'inspirant de l'architecture TOEFL.

## Licence

Disponible pour un usage personnel et éducatif uniquement.

---

**Bon entraînement!**
