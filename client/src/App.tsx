import { useState } from "react";

import { ShakeAnimation } from "./Functions/ShakeAnimationEvent";
import { GenerateExample } from "./Functions/GenerateExample";


export default function App() {
  const [promptInput, setPromptInput] = useState("");

  const API_ENDPOINT: string = `${import.meta.env.VITE_API_ENDPOINT}/initial-songs`;
  const API_ENDPOINT_SECOND_HANDLER: string = `${import.meta.env.VITE_API_ENDPOINT}/create-playlist`;

  console.log(API_ENDPOINT, API_ENDPOINT_SECOND_HANDLER);

  //Display example prompt when user clicks on Example button
  function showExample() {
    const userInput = document.getElementById("prompt-input") as HTMLElement;

    if ((userInput as HTMLInputElement).value !== "") {
      let answer = confirm("Are you sure you want to clear your prompt?");
      if (answer) {
        (userInput as HTMLInputElement).value = "";
      }
    }

    (userInput as HTMLInputElement).placeholder = GenerateExample();
  }

  // When a user clicks on the generate button, the app will initially display the first 10 songs 
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userInput = document.getElementById("prompt-input") as HTMLElement;
    let toPassToGPT = (userInput as HTMLInputElement).value;

    // check for blank user input
    if (
      toPassToGPT === "" &&
      (userInput as HTMLInputElement).placeholder === "what are we up to today?"
    ) {
      ShakeAnimation(userInput);
    } else {
      if (toPassToGPT === "") {
        toPassToGPT = (userInput as HTMLInputElement).placeholder;
        //for visual purposes
        (userInput as HTMLInputElement).value = (
          userInput as HTMLInputElement
        ).placeholder;
      }
      try {
        console.log(
          `attempting to build playlist using prompt: ${toPassToGPT}`
        );
        const response = await fetch(`${API_ENDPOINT}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: toPassToGPT }),
        });

        displayInitialSongs(JSON.parse((await response.json()).output))
        console.info('The initial onSubmit function has completed.');
      } catch (error: any) {
        console.error(`The API returned: ${error}`);
      }
    }
  }


  type Track = {
    artist: string;
    song: string;
    id: string;
  }

  function displayInitialSongs(songs: Track[]) {
    let initialSongs = document.createElement('div')
    initialSongs.id = 'initial-songs-container'

    let instructions = document.createElement('p');
    instructions.innerText = 'Select a song that most closely fits the vibe'
    initialSongs.appendChild(instructions)

    songs.map((key) => {
        let newSongOption = document.createElement('div')
        newSongOption.classList.add('initial-song')

        // create the song embed as an iframe
        let newIframe = document.createElement('iframe')
        newIframe.classList.add('initial-song-embed')
        newIframe.src = `https://open.spotify.com/embed/track/${key.id}?utm_source=generator`
        newSongOption.appendChild(newIframe)

        // create a button that allows users to select which song to base playlist off of
        let selectButton = document.createElement('button')
        selectButton.innerText = 'select'
        selectButton.addEventListener('click', () => selectSong(key))
        newSongOption.appendChild(selectButton)
        initialSongs.appendChild(newSongOption)
    })
    document.getElementById('playlist-prompt')?.appendChild(initialSongs)
  }

  async function selectSong(track: Track) {
    document.getElementById('initial-songs-container')?.remove()
    console.log(track);
    try {
        const response = await fetch(`${API_ENDPOINT_SECOND_HANDLER}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                prompt: (document.getElementById("prompt-input") as HTMLInputElement).value,
                song: track 
            }),
        });
        displayPlaylistEmbed((await response.json()).output.result)
    } catch(error) {
        console.error(`API request failed with error: ${error}`);
    }
  }

  function displayPlaylistEmbed(playlistID: string) {
    document.getElementById('initial-songs-container')?.remove()
    let playlistEmbed = document.createElement('iframe')
    playlistEmbed.id = 'embedded-playlist'
    playlistEmbed.src = `https://open.spotify.com/embed/playlist/${playlistID}?utm_source=generator&theme=0`

    document.getElementById('initial-songs-container')?.remove()
    document.getElementById('playlist-prompt')?.appendChild(playlistEmbed)

{/* <iframe style="border-radius:12px"  width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe> */}
  }

  return (
    <div className="playlist-prompt" id="playlist-prompt">
        <section className="form-container">
            <form onSubmit={onSubmit} autoComplete="off">
                <input
                    type="text"
                    id="prompt-input"
                    name="promptInput"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="what are we up to today?"
                />
                <input
                    type="button"
                    id="example-button"
                    onClick={showExample}
                    value="Example"
                />
                <input id="submit-button" type="submit" value="Generate" />
            </form>
        </section>
    </div>
  );
}



// <iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4qZLrKsaGkYmVRGUviVPtk?utm_source=generator" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>