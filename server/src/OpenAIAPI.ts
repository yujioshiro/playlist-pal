import { Configuration, OpenAIApi, ImagesResponse } from "openai";
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

console.log(`Checking API key`);
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
console.log("API key success, creating instance of openai");
const openai = new OpenAIApi(configuration);

export async function getInitialSongsFromOpenAiChatCompletion(prompt: string, genre: string): Promise<{ result: string }> {
    try {
        console.log(`Getting initial songs from GPT using ${prompt}`);
        const completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [{role:'user', content:`You are the world's best music curator. give me 7 ${genre}-like songs that sound like ${prompt}.Results in JSON,omit all other text.Example: [{"artist":"artist name","song":"song name"},{"artist":"artist name","song":"song name"},{"artist":"artist name","song":"song name"}]`}],
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

export async function getImageFromOpenAi(prompt: string, genre: string) {
    try {
      const response = await openai.createImage({
        prompt: `faceless,humanless,leica m3,50mm f2.0,natural lighting,nautral colors,vibes,${genre} visuals,scene,${prompt}`,
        n: 1,
        size: "512x512",
      })
      return { result: (response.data as ImagesResponse).data[0].url ?? '' }
    } catch(error) {
      console.error('Error occurred while creating image:', error);
      return { result: "An error occurred" };
    }
  }