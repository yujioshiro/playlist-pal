import { useState } from "react";

import { ShakeAnimation } from "./Functions/ShakeAnimationEvent";
import { GenerateExample } from "./Functions/GenerateExample";
import { getAccessToken, createPlaylist, getSongIds, getSongRecommendations } from "./Functions/SpotifyAPI";
import { genres } from './Functions/Genres.ts'


export default function App() {
  const [promptInput, setPromptInput] = useState("");

  const API_ENDPOINT_INDEX: string = `${import.meta.env.VITE_API_ENDPOINT}/initial-songs`;
  const API_ENDPOINT_GET_BASE_SONGS: string = `${import.meta.env.VITE_API_ENDPOINT}/get-base-songs`;


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
      notification.innerText = 'Generating base songs...'
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
        songs = JSON.parse((await getSongRecommendations(songs)).body).message
        let finalPlaylistId: string = await createPlaylist(toPassToGPT, songs, responseFromLambda.image.result)
        console.log(finalPlaylistId);
        displayPlaylistEmbed(finalPlaylistId)
        notification.remove()

      } catch (error: any) {
        console.error(`The API returned: ${error}`);
      }
    }
  }

  // type Track = {
  //   artist: string;
  //   song: string;
  //   id: string;
  // }

  // function displayInitialSongs(songs: Track[]) {
  //   let initialSongs = document.createElement('div')
  //   initialSongs.id = 'initial-songs-container'

  //   let instructions = document.createElement('p');
  //   instructions.innerText = 'Select a song that most closely fits the vibe'
  //   initialSongs.appendChild(instructions)

  //   songs.map((key) => {
  //       let newSongOption = document.createElement('div')
  //       newSongOption.classList.add('initial-song')

  //       // create the song embed as an iframe
  //       let newIframe = document.createElement('iframe')
  //       newIframe.classList.add('initial-song-embed')
  //       newIframe.src = `https://open.spotify.com/embed/track/${key.id}?utm_source=generator`
  //       newSongOption.appendChild(newIframe)

  //       // create a button that allows users to select which song to base playlist off of
  //       let selectButton = document.createElement('button')
  //       selectButton.innerText = 'select'
  //       selectButton.addEventListener('click', () => selectSong(key))
  //       newSongOption.appendChild(selectButton)
  //       initialSongs.appendChild(newSongOption)
  //   })
  //   document.getElementById('playlist-prompt')?.appendChild(initialSongs)
  // }

  // async function selectSong(track: Track) {
  //   document.getElementById('initial-songs-container')?.remove()
  //   let notification = document.createElement('p')
  //   notification.innerText = 'Creating playlist...'
  //   document.getElementById('playlist-prompt')?.appendChild(notification)
  //   console.log(track);

  //   let prompt = (document.getElementById("prompt-input") as HTMLInputElement).value
  //   try {
  //       const BASE_SONGS_RESPONSE = await fetch(`${API_ENDPOINT_GET_BASE_SONGS}`, {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({ 
  //               prompt: prompt,
  //               song: track
  //           }),
  //       });
  //       let responseFromLambda = (await BASE_SONGS_RESPONSE.json()).output           

  //       let songs = JSON.parse((await getSongIds(responseFromLambda[0])).body).message
  //       songs.push(track)
  //       console.log(`songsIds: ${JSON.stringify(songs)}`);
  //       songs = JSON.parse((await getSongRecommendations(songs)).body).message
  //       console.log(songs);

  //       // let image = responseFromLambda[1].result;
  //       // console.log(image);

  //       let finalPlaylistId: string = await createPlaylist(prompt, songs, responseFromLambda[1].result)
  //       displayPlaylistEmbed(finalPlaylistId)
  //       notification.remove()
  //   } catch(error) {
  //       console.error(`API request failed with error: ${error}`);
  //   }
  // }

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