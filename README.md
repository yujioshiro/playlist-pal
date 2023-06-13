# Playlist Pal
Create Spotify playlists based on any event or mood!

### How it works
1. Type in an event you're attending or a mood you're feeling.
2. The app will present you with up to 10 songs of varying genres.
3. Select a song that best fits your vibe. In general, this will determine the genre of the playlist.
4. The app will build a playlist using the selected song and your prompt.

### Technologies used
- **React/TypeScript**, deployed to **Netlify**
- **GitHub Action** initiates a workflow that zips and deploys the **Lambda Functions** to **AWS**
- Access to the Lambda Function is done through an AWS **API Gateway**
- **OpenAI API** (GPT-4) suggests songs based on the entered prompt
- **Spotify Web API** is used to recommend more songs and build the playlist

<!-- ### Why?
I really enjoy discovering and sharing music. I've been casually hunting for "undiscovered" artists/songs since I was young. I think it started with MySpace profile songs and the desire to have a unique song. Since then, I've shared countless songs and artists with friends and I'm sure many of my Facebook messages are YouTube and Soundcloud links. The rise in popularity of Spotify allowed me to forego burning CDs and allowed me to build playlists for friends, parties, and other events. It even allowed my friends and I to collab on playlists, in which I usually make a majority of the contributions on. 

While messing around with ChatGPT (GPT-4) one day, I noticed how well it understood genres of music and what songs or artists might play at certain times. -->
