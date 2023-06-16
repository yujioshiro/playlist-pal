import { Configuration, OpenAIApi, ImagesResponse } from "openai";
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

console.log(`Checking API key`);
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
console.log("API key success, creating instance of openai");
const openai = new OpenAIApi(configuration);

export async function getInitialSongsFromOpenAiChatCompletion(prompt: string): Promise<{ result: string }> {
    try {
        console.log(`Getting initial songs from GPT using ${prompt}`);
        const completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [{role:'user', content:`Give 7 songs from different genres that match this prompt: ${prompt}.Put results in JSON and omit all other text.Example: [{"artist":"artist name","song":"song name"},{"artist":"artist name","song":"song name"},{"artist":"artist name","song":"song name"}]`}],
            temperature: 0.7,
            max_tokens: 750,
        })

        let replyContent = completion.data.choices[0].message?.content;
        return { result: JSON.stringify(replyContent)}

    } catch(error: any) {
        console.error(error)
        return { result: error }
    }
}

export async function getFourMatchingSongsFromOpenAiChatCompletion(prompt: string, artist: string, song: string): Promise<{ result: string }> {
    try {
        console.log(song);
        console.log(`Getting four additional songs from GPT using prompt: ${prompt}, artist: ${artist}, and song: ${song}.`);
        const completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [{role:'user', content:`Give 4 songs that aurally match ${song} by ${artist} and fit the prompt: ${prompt}. Make sure all songs are same or similar genre. Put results in JSON and omit all other text. Example: [{"artist":"artist name","song":"song name"},{"artist":"artist name","song":"song name"},{"artist":"artist name","song":"song name"}]`}],
            temperature: 0.7,
            max_tokens: 550,
        })
        return {
            result: JSON.stringify(completion.data.choices[0].message?.content)
        }
    } catch(error: any) {
        console.error(error)
        return { result: error }
    }
}

export async function getImageFromOpenAi(prompt: string, artist: string) {
    try {
      const response = await openai.createImage({
        prompt: `faceless,humanless,leica m3,50mm f2.0,natural lighting,nautral colors,vibes,${artist} visuals,scene,${prompt}`,
        n: 1,
        size: "512x512",
      })
      return { result: (response.data as ImagesResponse).data[0].url ?? '' }
    } catch(error) {
      console.error('Error occurred while creating image:', error);
      return { result: "An error occurred" };
    }
  }