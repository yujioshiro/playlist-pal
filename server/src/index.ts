import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getInitialSongsFromOpenAiChatCompletion, getFourMatchingSongsFromOpenAiChatCompletion, getImageFromOpenAi } from './OpenAIAPI';
import { createPlaylist } from './SpotifyAPI';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    console.log(event.path);
    if (event.path === '/get-base-songs') {
        console.log("THIS IS RUNNING");
        console.log(event.body);
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({
                output: await secondHandler(JSON.parse(event.body!).prompt, JSON.parse(event.body!).song),
            })
        }
    }

    if (event.path === `/create-playlist`) {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({
                output: await createPlaylist(JSON.parse(event.body!).prompt, JSON.parse(event.body!).songs, JSON.parse(event.body!).accessToken, JSON.parse(event.body!).image)
            })
        }
    }

    let prompt: string;

    // The prompt is parsed and checked for any errors
    // Errors might include blank prompts (which is checked on the client side, but should also be checked here)
    try {
        // When user submits prompt, we parse prompt into a string to send to OpenAI
        if (event.body && event.body !== null) {
            // console.log(event.body);
            const requestBody = JSON.parse(event.body);
            prompt = requestBody.prompt;

            // GPT-4 will generate 10 songs of varying genres based on that one prompt. These 10 songs are returned to the user so they can select the genre that fits their mood the most
            console.info(`Prompt within index.ts received from App.tsx: ${prompt}`);
            let initialSongs = JSON.parse(JSON.parse((await getInitialSongsFromOpenAiChatCompletion(prompt)).result))
            // let initialSongs = JSON.parse('[{"artist":"The Beatles","song":"Here Comes The Sun"},{"artist":"Frank Sinatra","song":"Fly Me To The Moon"},{"artist":"Ella Fitzgerald","song":"Blue Skies"},{"artist":"Israel Kamakawiwoole","song":"Somewhere Over The Rainbow"},{"artist":"Norah Jones","song":"Sunrise"},{"artist":"Coldplay","song":"Viva La Vida"},{"artist":"Johnny Cash","song":"I Walk The Line"},{"artist":"Bob Marley","song":"Three Little Birds"},{"artist":"James Brown","song":"I Got You (I Feel Good)"},{"artist":"John Denver","song":"Take Me Home, Country Roads"}]')
            console.log(`initialSongs: ${initialSongs}`);
            console.log(`initialSongs Stringified: ${JSON.stringify(initialSongs)}`);
            // let songIds = JSON.parse((await getSongIds(initialSongs, accessToken)).body);
            // songIds.message = JSON.stringify(songIds.message)
            // console.log(`Result of GetSongIds() at index.handler: ${JSON.stringify(songIds)}`);
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                  },
                body: JSON.stringify({
                    output: initialSongs
                })
            }
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    output: "User inputted blank prompt."
                })
            }
        }
    } catch (error) {
        console.error('Error parsing request body: ', error);
        return {
            statusCode: 400,
            body: JSON.stringify({message: 'Invalid request body'})
        }
    }
}

type Track = {
    artist: string;
    song: string;
    id: string;
}

type PlaylistToBuild = {
    tracks: string[];
}

export async function secondHandler(prompt: string, selectedSong: Track) {
    console.log(`*******************************************************`);
    console.log(`*******************************************************`);
    console.log(`*******************************************************`);
    console.log("****STARTING THE SECOND ROUND OF GPT SONG RETRIEVAL****")
    console.log(`*******************************************************`);
    console.log(`*******************************************************`);
    console.log(`*******************************************************`);

    // while (playlist.tracks.length < 30) {
    //     // might want to put all of the song getting in this while loop to ensure we send a full 30 song playlist to the client
    // }

    // GPT-4 will generate 4 songs based on the song the user selected
    let artist = selectedSong.artist;
    let song = selectedSong.song;

    // console.log(`SELECTED SONG: ${JSON.stringify(selectedSong)}`);
    let songsToPassToRecommendation = JSON.parse(JSON.parse((await getFourMatchingSongsFromOpenAiChatCompletion(prompt, artist, song)).result))
    // let songsToPassToRecommendation = JSON.parse('[{"artist":"Jack Johnson","song":"Banana Pancakes"},{"artist":"Corinne Bailey Rae","song":"Put Your Records On"},{"artist":"Jason Mraz","song":"Im Yours"},{"artist":"Sara Bareilles","song":"Love Song"}]')
    // let songIds = JSON.parse((await getSongIds(songsToPassToRecommendationFunction, accessToken)).body)
    // songIds.message.push(selectedSong)
    // // console.log(`Result of GetSongIds() at index.secondHandler: ${JSON.stringify(songIds)}`);

    // // The 5 songs are sent to Spotify Web API to get 100 song recommendations for each
    // console.log('running the getSongsRecommendations function');
    // console.log(`songIds.message: ${JSON.stringify(songIds.message)}`);
    // let songRecs: string[] = (JSON.parse((await getSongRecommendations(songIds.message, accessToken)).body)).message

    // // Once the playlist has at least 30 songs (but under 40), it is built with Spotify and the playlist ID is returned to the client. The app should check that there are at least 30 songs before sending the ID.
    // let playlistId = await createPlaylist(prompt, songRecs, await getImageFromOpenAi(prompt), accessToken)

    // console.log(typeof playlistId.result);
    // console.log(playlistId);

    let imageObject = await getImageFromOpenAi(prompt)

    return  [songsToPassToRecommendation, imageObject]
}

// export async function createPlaylistInSpotify(prompt: string, songs: string[], accessToken: string, image: string) {
//     console.log("all paramters,",prompt, songs,accessToken,image);
//     return (await createPlaylist(prompt, songs, accessToken, image)).result
// }