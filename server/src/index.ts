import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getInitialSongsFromOpenAiChatCompletion, getImageFromOpenAi } from './OpenAIAPI';
// import { createPlaylist } from './SpotifyAPI';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    console.log(event.path);

    // if (event.path === `/create-playlist`) {
    //     return {
    //         statusCode: 200,
    //         headers: {
    //             'Access-Control-Allow-Origin': '*',
    //             'Access-Control-Allow-Headers': 'Content-Type',
    //         },
    //         body: JSON.stringify({
    //             output: await createPlaylist(JSON.parse(event.body!).prompt, JSON.parse(event.body!).songs, JSON.parse(event.body!).accessToken, JSON.parse(event.body!).image)
    //         })
    //     }
    // }

    let prompt: string;
    let genre: string;

    // The prompt is parsed and checked for any errors
    // Errors might include blank prompts (which is checked on the client side, but should also be checked here)
    try {
        // When user submits prompt, we parse prompt into a string to send to OpenAI
        if (event.body && event.body !== null) {
            // console.log(event.body);
            const requestBody = JSON.parse(event.body);
            prompt = requestBody.prompt;
            genre = requestBody.genre;

            // GPT-4 will generate 10 songs of varying genres based on that one prompt. These 10 songs are returned to the user so they can select the genre that fits their mood the most
            console.info(`Prompt within index.ts received from App.tsx: ${prompt}`);
            console.info(`Genre within index.ts received from App.tsx: ${genre}`);
            let initialSongs = JSON.parse(JSON.parse((await getInitialSongsFromOpenAiChatCompletion(prompt, genre)).result))
            let imageObject = await getImageFromOpenAi(prompt, genre)
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
                    output: initialSongs,
                    image: imageObject
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
