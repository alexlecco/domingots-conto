# Domingots · Tinta Tacos

Static Netlify-ready landing page built with HTML, CSS and vanilla JavaScript.

Optional background audio: place a legally licensed or authorized copy of the Game of Thrones theme at `assets/game-of-thrones-theme.mp3`. Browsers require user interaction before allowing autoplay; the first click or key press starts playback, and the speaker control toggles mute. If the MP3 is absent, the page falls back to a generated medieval ambient loop so the control remains functional.

The visual gallery uses public location photography: Castle Ward/Winterfell (William Marnoch, CC BY 2.0), Dunluce Castle/Greyjoy and the Dubrovnik Game of Thrones set (Wikimedia Commons sources linked below each card). The images are loaded from their public source URLs.

## Deploy

1. Drag this folder into Netlify, or connect the repository.
2. Set `DASHBOARD_WEBHOOK_URL` in Netlify environment variables to the private dashboard ingestion endpoint.
3. Optionally set `DASHBOARD_WEBHOOK_TOKEN` for bearer authentication.
4. Replace `G-XXXXXXXXXX` in `index.html` with the Google Analytics measurement ID and uncomment the snippet.

The page works in demo mode without the webhook: submissions are validated and logged by the Netlify Function, but are not forwarded externally.
