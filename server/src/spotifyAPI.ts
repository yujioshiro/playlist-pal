export async function createPlaylistAndAddSongs( playlistObject: any ) {

    const clientId: string = process.env.SPOTIFY_CLIENT_ID!;
    const clientSecret: string = process.env.SPOTIFY_CLIENT_SECRET!;
    const refreshToken: string = process.env.SPOTIFY_REFRESH_TOKEN!;

    interface PlaylistInJSON {
        title: string;
        songs: { song: string; artist: string }[];
    }

    console.log("Straight console log of parameter:",playlistObject);
    // const playlistStringified = JSON.stringify(playlistObject);
    const playlistInJSON: PlaylistInJSON = JSON.parse(playlistObject.result);

    console.log("The playlist parsed into JSON:",playlistInJSON);

    
    const accessTokenWithPublicScopeResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
    });

    console.log("retrieving accessToken JSON Data Response");
    const accessTokenWithPublicScopeResponseData = await accessTokenWithPublicScopeResponse.json();
    console.log("Retrieved data response");
    const accessToken = accessTokenWithPublicScopeResponseData.access_token;
    console.log("Retrieved Access Token:", accessToken);


    const requestBody = {
        name: playlistInJSON.title,
        description: "This playlist was created using GPT-3, create your own at https://playlistpal.yujioshiro.com",
        public: true,
      };

      console.log("Playlist created");
      const createdPlaylistResponse = await fetch(
        "https://api.spotify.com/v1/users/12150582226/playlists",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      ); 

      const createdPlaylistData = await createdPlaylistResponse.json();
      console.log(createdPlaylistData);
      console.log(createdPlaylistData.id);

      const getSongUri = async (song: string, artist: string) => {
        try {
          artist = artist.split(' ')[0];
          console.log(`track:${song} artist:${artist}`);
          console.log("Before fetch");
          const songUriResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(`track:${song} artist:${artist}`)}&type=track&offset=0&limit=1`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          console.log("After fetch");
          console.log("songUriResponse:", songUriResponse);
          console.log("songUriResponse status:", songUriResponse.status);
          const data = await songUriResponse.json();
          console.log(data);
          return data.tracks.items[0].uri;
        } catch (error) {
          console.error("Error:", error);
        }
      }
      
      for (const song of playlistInJSON.songs) {
        try {
          console.log(`Getting song URI for ${song.song} by ${song.artist}`);
          const songUri = await getSongUri(song.song, song.artist);
          console.log(`Song URI for ${song.song} by ${song.artist}: ${songUri}`);
          
          const response = await fetch(`https://api.spotify.com/v1/playlists/${createdPlaylistData.id}/tracks?uris=${songUri}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          });
      
          if (!response.ok) {
            throw new Error(`Failed to add song to playlist: ${response.statusText}`);
          }
          console.log(`Successfully added song with URI ${songUri} to playlist ${createdPlaylistData.id}`);
          console.log(`Song: ${song.song}, Artist: ${song.artist}`);
        } catch (error) {
          console.error(`Error processing song ${song.song} by ${song.artist}: ${error}`);
        }
      }
      

  return { result: createdPlaylistData.id};
}
  
  