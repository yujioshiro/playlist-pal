import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getSongsFromOpenAiCompletion, getImageFromOpenAi } from './openaiAPI';
import { createPlaylistAndAddSongs } from './spotifyAPI';
import { createPlaylistAndAddSongsWithValues } from './spotifyAPIUsingRecommendationValues';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    let prompt: string | undefined;
    try {
      const requestBody = JSON.parse(event.body || '');
      prompt = requestBody.prompt;
    } catch (error) {
      console.log('Error parsing request body:', error);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid request body' }),
      };
    }
  
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing prompt parameter' }),
      };
    }
  
    const playlistObject = await getSongsFromOpenAiCompletion(prompt);
    console.log("This is the playlistObject: \n" + playlistObject);
    const imageObject = await getImageFromOpenAi(prompt);
    console.log("This is the image url:", imageObject);

    // const playlistId = await createPlaylistAndAddSongs(playlistObject);
    const playlistId = await createPlaylistAndAddSongsWithValues(playlistObject, imageObject, prompt);
    
    console.log(playlistId);

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      },
      body: JSON.stringify({
        output: playlistId
      }),
    };
    return response;
  }
  
