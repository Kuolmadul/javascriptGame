# Ultimate Tic Tac Toe

## Project Overview

Ultimate Tic Tac Toe is an interactive, feature-rich web-based game built to enhance the classic Tic Tac Toe experience. It offers single-player (against AI) and multiplayer modes, customizable themes, sound effects, a leaderboard with round history, and a replay feature. The game includes a responsive design, animated effects like confetti and winning line animations, and a typewriter splash screen for an engaging user experience. Players can personalize their avatars with emojis, toggle dark mode, and save game progress locally.

## Project Developers

- Tracy Macharia
- Violet Atieno
- Kuol Madul

## Technologies Used

- **HTML5**: Structure and layout of the game interface.
- **CSS3**: Styling with responsive design, animations, and theme customization (e.g., Classic, Neon, Wood, Clear).
- **JavaScript**: Core game logic, AI implementation (Minimax for Hard AI), local storage for game state and leaderboard, and dynamic DOM manipulation.
- **Canvas API**: Used for confetti effects and animated winning lines.
- **LocalStorage**: Persistent storage for game state and leaderboard data.
- **External Resources**:
  - Background images and video for splash screen and themes.
  - Audio files for sound effects (click, win, draw).
- **Third-Party Libraries**: None, pure vanilla JavaScript implementation.

## Project / File Structure

```
ultimate-tic-tac-toe/
├── index.html         # Main HTML file with game UI
├── style.css          # Styles for layout, themes, and animations
├── game.js            # Game logic, AI, leaderboard, and animations
├── assets/            # Directory for static assets (create this if using)
│   ├── t3.jpg         # Background image for light mode
│   ├── dark.jpeg      # Background image for dark mode
│   ├── classic.jpeg   # Board background for Classic theme
│   ├── neon.jpg.jpeg  # Board background for Neon theme
│   ├── wood.jpg.jpeg  # Board background for Wood theme
│   ├── ticanimation.mp4 # Splash screen video (optional)
│   ├── click.wav      # Sound for cell click
│   ├── win.wav        # Sound for winning
│   ├── draw.wav       # Sound for draw
└── README.md          # Project documentation
```

## Installation Instructions (How to Set Up Locally)

1. **Clone or Download the Project**:
   - Clone the repository using `git clone [repository-url]` or download the project files as a ZIP and extract them.
2. **Set Up a Local Server**:
   - To avoid CORS issues with local assets (e.g., images, audio, video), use a local development server.
   - Option 1: Use Python's HTTP server:

     ```bash
     python -m http.server 8000
     ```
   - Option 2: Use Node.js with `http-server`:

     ```bash
     npm install -g http-server
     http-server
     ```
3. **Place Assets**:
   - Create an `assets/` directory in the project root.
   - Add the required images (`t3.jpg`, `dark.jpeg`, `classic.jpeg`, `neon.jpg.jpeg`, `wood.jpg.jpeg`), video (`ticanimation.mp4`, optional), and audio files (`click.wav`, `win.wav`, `draw.wav`) to the `assets/` directory.
   - Update file paths in `style.css` and `game.js` if your asset directory structure differs.
4. **Access the Game**:
   - Open your browser and navigate to `http://localhost:8000` (or the port provided by your server).
   - The game will load with a splash screen, followed by the intro screen.
5. **Optional: Test Without Assets**:
   - If assets are unavailable, the game will still function (without backgrounds or sounds). Comment out the video background call in `game.js` (e.g., `// setVideoBackground('ticanimation.mp4');`) to avoid errors.

## Unique Features

- **Customizable Avatars**: Players can choose emojis for their markers (e.g., 😎, 🚀), enhancing personalization.
- **AI Opponents**: Easy AI (random moves) and Hard AI (Minimax algorithm) provide varied challenge levels.
- **Leaderboard with Round History**: Tracks wins, draws, and rounds for PvP and PvC modes, with a replay feature to revisit past games.
- **Animated Effects**: Includes confetti for wins, animated winning lines, and a typewriter effect on the splash screen.
- **Responsive Design**: Adapts to mobile and desktop screens with media queries.
- **Dark Mode**: Toggleable dark theme for better visibility and user preference.
- **Multi-Round Gameplay**: Supports up to 5 rounds with a game-over popup summarizing results.
- **Game State Persistence**: Saves game progress in LocalStorage for seamless resumption.
- **Sound Effects**: Toggleable audio for clicks, wins, and draws, enhancing immersion.

## How to Play

1. On the intro screen, enter player names, select emojis, choose a theme (Classic, Neon, Wood, Clear), and pick a game mode (PvP, Easy AI, Hard AI).
2. Set the number of rounds (1–5) and click "Start Game."
3. Take turns placing your marker (X or O) on the 3x3 grid.
4. Win by aligning three markers horizontally, vertically, or diagonally, or end in a draw if the grid fills.
5. Use the leaderboard to track scores and replay past rounds.
6. Access settings to toggle sound, dark mode, or reset stats.

## Future Enhancements

- **Online Multiplayer**: Add WebSocket support for real-time PvP across devices.
- **Custom Themes**: Allow users to upload their own background images.
- **Difficulty Levels**: Introduce more AI difficulty settings (e.g., Medium AI).
- **Accessibility**: Add keyboard controls and screen reader support.
- **Analytics**: Track game statistics like average game time or win rates.

## Troubleshooting

- **Assets Not Loading**: Ensure the `assets/` directory exists and file paths in `style.css` and `game.js` are correct. Use a local server to avoid CORS issues.
- **Game Not Saving**: Check browser LocalStorage availability (e.g., not in incognito mode).
- **Video Issues**: If `ticanimation.mp4` fails, the splash screen will fallback to a timer-based transition. Ensure the video file is in the correct format (MP4) and path.
- **Leaderboard Errors**: Clear LocalStorage via Settings &gt; Reset Stats if leaderboard data becomes corrupted.