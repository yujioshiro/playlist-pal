import { config as dotenvConfig } from 'dotenv';
import sharp from 'sharp'

dotenvConfig();

type Track = {
    artist: string,
    song: string,
    id?: string
}

const clientId: string = process.env.SPOTIFY_CLIENT_ID!;
const clientSecret: string = process.env.SPOTIFY_CLIENT_SECRET!;
const refreshToken: string = process.env.SPOTIFY_REFRESH_TOKEN!;

export async function getSongIds(songs: Track[]) {

    // Get new accessToken which allows us to fetch data from the Spotify API
    let accessTokenWithPublicScopeResponse = await fetch(`https://accounts.spotify.com/api/token`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
    })
    const accessToken: string = (await accessTokenWithPublicScopeResponse.json()).access_token
    // console.log("Retrieved Access Token:", accessToken);

    // convert the songs into an object of song objects
    let songsToReturn = []
    for (let song of songs) {
        console.log(song);
        // sometimes GPT responds with songs that have special characters or accented characters in it. Since we can't pass some of these through to the spotify API, we replace them or get rid of them using regex
        try {
            let searchedSong = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(`track:${(song.song).normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/ &/g, "")} artist:${(song.artist).normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/ &/g, "")}`)}&type=track&offset=0&limit=1`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
            })
            // console.log(searchedSong);
            let searchedSongId = (await searchedSong.json()).tracks.items[0].id
            console.log(searchedSongId);
            songsToReturn.push({"artist":`${song.artist}`,"song":`${song.song}`,"id":`${searchedSongId}`})
            } catch (error) {
                console.error(error);
                continue
            }
    }
    return {
        statusCode: 200,
        body: JSON.stringify({message: songsToReturn})
    }
}

export async function getSongRecommendations(songs: Track[]) {
    let playlistToCheckForDuplicates: { [songId: string]: number } = {}
    const playlistToReturn = new Set()

     // Get new accessToken which allows us to fetch data from the Spotify API
     let accessTokenWithPublicScopeResponse = await fetch(`https://accounts.spotify.com/api/token`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
    })
    const accessToken: string = (await accessTokenWithPublicScopeResponse.json()).access_token
    console.log("Retrieved Access Token:", accessToken);

    // If the final playlist does not have at least 30 songs, we repeat the song recommendations or the 4 song generation
    while (playlistToReturn.size < 30) {
        // each song object in the songs array will get 100 recommendations from the spotify web api 
        for (let song of songs) {
            let songRecommendationsFromSpotifyAPI = await fetch(`https://api.spotify.com/v1/recommendations?limit=100&seed_tracks=${song.id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })

            // console.log((await songRecommendationsFromSpotifyAPI.json()));

            // iterate through all 100 tracks in the response and add them to an array. This array will be checked for duplicates as we're adding
            for (let track of (await songRecommendationsFromSpotifyAPI.json()).tracks) {
                if (playlistToCheckForDuplicates[track.id]) {
                    playlistToCheckForDuplicates[track.id]++
                    playlistToReturn.add(song.id)
                } else {
                    playlistToCheckForDuplicates[track.id] = 1
                }
            }
        }

    // All 500 songs are put into an array and any song with at least 2 occurences will be put into the final playlist
        for (let track in playlistToCheckForDuplicates) {
            if (playlistToCheckForDuplicates[track] > 2 && playlistToReturn.size < 50) {
                playlistToReturn.add(track)
            }
        }
    }
    // console.log(playlistToReturn);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: Array.from(playlistToReturn)
        })
    }
}

export async function createPlaylist(prompt: string, songs: string[], imageObject: any) {
    console.log(typeof songs);
    console.log(`Adding these song ids: ${songs}`);

    // Get new accessToken which allows us to fetch data from the Spotify API
    let accessTokenWithPublicScopeResponse = await fetch(`https://accounts.spotify.com/api/token`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
    })
    const accessToken: string = (await accessTokenWithPublicScopeResponse.json()).access_token
    // console.log("Retrieved Access Token:", accessToken);

    // create new playlist
    const requestBody = {
        name: prompt,
        description: `This playlist was created with playlistpal.yujioshiro.com`,
        public: true,
    }

    const createdPlaylistResponse = await fetch("https://api.spotify.com/v1/users/12150582226/playlists", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        }
    ); 

    const createdPlaylistData = await createdPlaylistResponse.json()
    Promise.all([
        addSongsToPlaylist(songs, createdPlaylistData.id, accessToken),
        uploadPlaylistCoverImage(imageObject, createdPlaylistData.id, accessToken)
    ])
    
    console.log(`playlistId: ${createdPlaylistData.id}`);
    return { result: createdPlaylistData.id }
}

export async function addSongsToPlaylist(songs: string[], playlistId: string, accessToken: string) {
    for (let song in songs) {
        console.log(`song: ${song}`);
        await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?uris=spotify:track:${song}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
    }
}

export async function uploadPlaylistCoverImage(imageObject: any, playlistId: string, accessToken: string) {
     //upload image
     console.log("attempting image upload");
     const imageResponse = await fetch(imageObject.result);
     console.log("Converted imageObject to imageResponse...");
     const blob = await imageResponse.blob();
     console.log("converted imageResponse to blob...");
       
     // Resize the image
     const MAX_WIDTH = 300; // Set the maximum width for the resized image
     const MAX_HEIGHT = 300; // Set the maximum height for the resized image
     
     const buffer = Buffer.from(await blob.arrayBuffer());
     
     const resizedImageBuffer = await sharp(buffer)
     .resize(MAX_WIDTH, MAX_HEIGHT, { fit: 'inside' })
     .jpeg({ quality: 80 }) // Adjust the quality value to reduce the file size
     .toBuffer();
 
     
     const base64data = resizedImageBuffer.toString('base64');
     // console.log("base64data", base64data);
         try {
         fetch(`https://api.spotify.com/v1/playlists/${playlistId}/images`, {
             method: "PUT",
             headers: {
             Authorization: `Bearer ${accessToken}`,
             "Content-Type": "image/jpeg",
             },
             body: base64data,
         });
     } catch (error) {
         console.log("error:", error);
     }
}