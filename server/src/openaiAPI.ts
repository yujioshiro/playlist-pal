import { Configuration, OpenAIApi, ImagesResponse } from "openai";
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

console.log("checking API Key");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
console.log("API key success, creating instance of openai");
const openai = new OpenAIApi(configuration);

export async function getSongsFromOpenAiCompletion(prompt: any): Promise<{ result: string }> {

  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: generateRecommendationsValues(prompt) ?? '',
      temperature: 1,
      max_tokens: 1000,
    });

    let completionResult = completion.data.choices[0].text ?? '';
    console.log("prompt:",prompt);
    completionResult = completionResult.trim();

    while (completionResult[0] !== "{") {
      completionResult = completionResult.substring(1);
    }
    
    while (completionResult[completionResult.length - 1] !== "}") {
      completionResult = completionResult.substring(0, completionResult.length - 1);
    }
    console.log('CompletionResult datatype: ', typeof completionResult);
    console.log('Completion result:', completionResult);

    return { result: completionResult };
  } catch (error: any) {
    console.error('Error occurred while generating values:', error);
    return { result: "An error occured." };
  }

  // try {
  //   const completion = await openai.createCompletion({
  //     model: "text-davinci-003",
  //     prompt: prompt,
  //     temperature: 1,
  //     max_tokens: 200,
  //   });
  //   return {
  //     statusCode: 200,
  //     headers: {
  //       'Access-Control-Allow-Origin': '*',
  //       'Access-Control-Allow-Headers': 'Content-Type',
  //     },
  //     body: JSON.stringify({ result: completion.data.choices[0].text }),
  //   };
  // } catch (error: any) {
  //   if (error.reponse) {
  //     return {
  //       statusCode: error.response.status,
  //       headers: {
  //         'Access-Control-Allow-Origin': '*',
  //         'Access-Control-Allow-Headers': 'Content-Type',
  //       },
  //       body: JSON.stringify(error.response.data),
  //     }
  //   } else {
  //     return {
  //       statusCode: 500,
  //       headers: {
  //         'Access-Control-Allow-Origin': '*',
  //         'Access-Control-Allow-Headers': 'Content-Type',
  //       },
  //       body: JSON.stringify({message: 'An error occurred during your request.'}),
  //     }
  //   }

  // }

  // return {
  //   statusCode: 200,
  //   headers: {
  //     'Access-Control-Allow-Origin': '*', // Replace '*' with the specific domain if needed
  //     'Access-Control-Allow-Credentials': true,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ result: completion.data.choices[0].text }),
  // };
}

export async function getImageFromOpenAi(prompt: string) {
  try {
    const response = await openai.createImage({
      prompt: `faceless,humanless,leica m3,50mm f1.4,natural lighting,vibes,scene,${prompt}`,
      n: 1,
      size: "512x512",
    })
    return { result: (response.data as ImagesResponse).data[0].url ?? '' }
  } catch(error) {
    console.error('Error occurred while creating image:', error);
    return { result: "An error occurred" };
  }
}



// This prompt might work better for GPT-4 (based on testing with chatGPT-4)
function generateSongsRaw(userPrompt: string) {
  return `Make a 10 song playlist with prompt: ${userPrompt}.Results in JSON format:{"title":"summary of the playlist","songs":[{"song":"song name","artist":"artist name"}]}`;
}

// This prompt might work better for GPT-3.5 as it relies more on Spotify's algorithm to recommend songs
function generateRecommendationsValues(userPrompt: string) {
  return `Let's make a playlist... recommend 4 artists, 1 genre based on prompt: ${userPrompt}.The genres should follow spotify's genre naming scheme.Also give rating from 0-1 for each attribute.Results in STRICT JSON format:'{"title":"philosophical quote based on prompt","genres":["genre1"],"artists":["artist1","artist2","artist3","artists4],"attributes:[{"acousticness":"x","danceability":"x","energy":"x","instrumentalness":"x","liveness":"x","loudness":"x","popularity":"x","speechiness":"x","tempo":"x"}]"}' tempo should be a single integer in BPM. popularity should be a single integer between 0 and 100. Dont explain ratings, FOLLOW THE OUTPUT EXACTLY.`
}