import { useState } from "react";

import { ShakeAnimation } from "./Functions/ShakeAnimationEvent";
import { GenerateExample } from "./Functions/GenerateExample";
import { getAccessToken, getSongIds, getSongRecommendations, createPlaylist } from "./Functions/SpotifyAPI";
import { genres } from './Functions/Genres.ts'


export default function App() {
  const [promptInput, setPromptInput] = useState("");

  const API_ENDPOINT_INDEX: string = `${import.meta.env.VITE_API_ENDPOINT}/initial-songs`;
  // const API_ENDPOINT_GET_BASE_SONGS: string = `${import.meta.env.VITE_API_ENDPOINT}/get-base-songs`;


  //Display example prompt when user clicks on Example button
  function showExample() {
    const userInput = document.getElementById("prompt-input") as HTMLInputElement;

    if (userInput.value !== "") {
      let answer = confirm("Are you sure you want to clear your prompt?");
      if (answer) {
        userInput.value = "";
      }
    }

    userInput.placeholder = GenerateExample();
  }

  // When a user clicks on the generate button, the app will initially display the first 10 songs 
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Get accessToken from storage if available
    let accessToken: string = 'NEEDS TOKEN'
    if (localStorage.getItem('dateReceived') && Date.now() - parseInt(localStorage.getItem('dateReceived') as string) < 3_000_000) {
        accessToken = localStorage.getItem('accessToken') as string
    } else {
        accessToken = await getAccessToken()
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('dateReceived', String(Date.now()))
    }
    console.log(accessToken);

    const userInput = document.getElementById("prompt-input") as HTMLInputElement;
    const userGenreSelection = document.getElementById("genre-selector") as HTMLSelectElement;
    let toPassToGPT = userInput.value;

    // check for blank user input
    if (userGenreSelection.value === "Select a Genre") {
      ShakeAnimation(userGenreSelection);
    }

    if (
      toPassToGPT === "" &&
      userInput.placeholder === "what are we up to today?"
    ) {
      ShakeAnimation(userInput);
    }
    
    if (
      userGenreSelection.value !== "Select a Genre" && (userInput.placeholder !== "what are we up to today?" || userInput.value !== "")
    ) {
      // disable buttons and notify user the base songs are being generated
      (document.getElementById('example-button') as HTMLButtonElement).disabled = true;
      (document.getElementById('submit-button') as HTMLButtonElement).disabled = true;
      document.getElementById('embedded-playlist')?.remove();
      let notification = document.createElement('p')
      notification.innerText = 'Generating playlist...'
      document.getElementById('playlist-prompt')?.appendChild(notification)

      if (toPassToGPT === "") {
        toPassToGPT = userInput.placeholder;
        //for visual purposes
        userInput.value = (
          userInput as HTMLInputElement
        ).placeholder;
      }

      try {
        console.log(
          `attempting to build playlist using prompt: ${toPassToGPT}`
        );
        const response = await fetch(`${API_ENDPOINT_INDEX}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: toPassToGPT, genre: userGenreSelection.value }),
        });
        let responseFromLambda = (await response.json());
        let songs = JSON.parse((await getSongIds(responseFromLambda.output)).body).message;
        console.log(songs)
        songs = JSON.parse((await getSongRecommendations(songs)).body).message
        console.log(songs)
        let finalPlaylistId: string = await createPlaylist(toPassToGPT, userGenreSelection.value, songs, accessToken, responseFromLambda.image.result)
        console.log(finalPlaylistId);
        displayPlaylistEmbed(finalPlaylistId)
        notification.remove()

      } catch (error: any) {
        console.error(`The API returned: ${error}`);
      }
    }
  }

  function displayPlaylistEmbed(playlistId: string) {
    console.log(playlistId);
    document.getElementById('initial-songs-container')?.remove()
    let playlistEmbed = document.createElement('iframe')
    playlistEmbed.id = 'embedded-playlist'
    playlistEmbed.src = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`
    document.getElementById('initial-songs-container')?.remove()
    document.getElementById('playlist-prompt')?.appendChild(playlistEmbed);
    (document.getElementById('example-button') as HTMLButtonElement).disabled = false;
    (document.getElementById('submit-button') as HTMLButtonElement).disabled = false;

{/* <iframe style="border-radius:12px"  width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe> */}
  }

  return (
    <div className="playlist-prompt" id="playlist-prompt">
      <h1>Playlist Pal</h1>
        <section className="form-container">
            <form onSubmit={onSubmit} autoComplete="off">
              <div id="user-input">
                <input
                  type="text"
                  id="prompt-input"
                  name="promptInput"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="what are we up to today?"
                  />
                <select name="genre-selector" id="genre-selector">
                  <option id="select-a-genre" selected disabled>Select a Genre</option>
                  <option id="any-genre" value="">Any Genre</option>
                  {genres.sort().map((value) => 
                    <option id={value as string}>{value}</option>
                  )}
                </select>
                
              </div>
                <div id="buttons">
                  <input
                    type="button"
                    id="example-button"
                    onClick={showExample}
                    value="Example"
                    />
                  <input id="submit-button" type="submit" value="Generate" />
                </div>
            </form>
        </section>
    </div>
  );
}



// <iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4qZLrKsaGkYmVRGUviVPtk?utm_source=generator" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>