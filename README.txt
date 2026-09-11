GANESHA ULTIMATE BRAIN CHALLENGE — INTERNET MULTIPLAYER
=========================================================

This version is designed for students who are NOT on the same Wi-Fi.
After deployment, students can use mobile data or any Internet connection.

BEST FREE HOSTING OPTION: RENDER
Render supports public Node.js web services and WebSockets. Free services are suitable for a school-event prototype, but can sleep after inactivity. See:
https://render.com/docs/free
https://render.com/docs/websocket

DEPLOYMENT
1. Create a free account on GitHub and Render.
2. Create a new GitHub repository, e.g. ganesha-live-quiz.
3. Upload ALL files in this folder to the repository:
   server.js
   host.html
   player.html
   package.json
   README.txt
4. In Render choose New > Web Service and connect the GitHub repository.
5. Build Command: npm install
6. Start Command: npm start
7. Choose the Free plan and create the service.
8. Render gives you a public address such as:
   https://your-service-name.onrender.com

USING THE GAME
1. Open the Render address on the host computer.
2. The Host screen creates a game and displays a QR code.
3. Students scan the QR code from their phones.
4. They can use mobile data; they do NOT need the host's Wi-Fi.
5. Students enter their names and join.
6. Host selects questions.
7. Scores and leaderboard update live.

IMPORTANT
- The app uses secure WSS automatically when the public site is HTTPS.
- The QR is generated from the actual public Render URL, so it is suitable for student phones.
- Render's free service may take about a minute to wake if it has been idle. Start the host page a few minutes before the event.
- For a large/high-stakes event, a paid or more robust hosting plan is safer.

SCORING
Correct answers start at 1000 points and decrease with response time to 500 points at 30 seconds. Wrong answers = 0. There are no 100/200/300 question-value labels.

EVENT FLOW
Host computer → open public URL → QR appears → students scan → play → live leaderboard on big screen.
