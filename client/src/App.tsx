import { useState } from 'react'

// const examples = ['bonfire with all my friends, rap', 'cruising down pch', 'road trip through the desert, listening to country', 'gaming until my fingers hurt', 'studying all night to lo-fi hip-hop']

export default function App() {

  const [promptInput, setPromptInput] = useState("");

  const API_ENDPOINT: string = import.meta.env.VITE_AWS_LAMBDA_API_ENDPOINT
  console.log(API_ENDPOINT);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const textarea = document.getElementById("prompt-input") as HTMLTextAreaElement;
    if (textarea.value === "") {
      alert("Please enter a prompt");
      return;
    }

    // Disable generate button so that user does not make multiple api calls
    const submitButton = document.getElementById("submit-button") as HTMLInputElement;
    // const loadingText = document.getElementById("loading-container");

    if (submitButton) {
      // submitButton.style.display = "none";
      submitButton.disabled = true;

      // loadingText!.style.display = "block"
    }

    // Disable the text area so that user cannot edit the textarea
    textarea.disabled = true;

    // instantiate the playlistIdResult so that it can be used outside of the try block
    let playlistIdResult: string;

    try {
      console.log("attempting to fetch..........................")
      const response = await fetch(`${API_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: promptInput }),
      });
      console.log(response)
      console.log("fetched");
      const data = await response.json();
      console.log(data)
      if (response.status !== 200) {
        throw data.error || new Error( `Reeeeeeequest failed with status ${response.status}`);
      }

      console.log("Fetch successful: " + data.output.result);
      playlistIdResult = data.output.result;
      console.log("playlistIdResult:",playlistIdResult)
      setPromptInput("");

    } catch (error: any) {
      console.error("uh oh:",error);
      alert(error.message);
    }

    let reEnableAllButtons = () => {
        // Re-enable the generate button so the user can create another playlist
        const submitButton = document.getElementById("submit-button") as HTMLInputElement;
        if (submitButton) {
          submitButton.style.display = "block";
          submitButton.disabled = false;
        }
    
        // Re-enable the text-area so the user can create another playlist
        const textarea = document.getElementById("prompt-input") as HTMLTextAreaElement;
        textarea.disabled = false;

        // Hide the loading animation
        const loadingText = document.getElementById("loading-container");
        loadingText!.style.display = "none";
    
    }
    // Immediately embedding the playlist does not work. This delay ensures the embed is available and ready before being displayed
    setTimeout(() => {

        let playlistContainer = document.getElementById("created-playlist-embed-iframe");
        let playlistDisplayed = false;
        while (!playlistDisplayed) {
            if (playlistContainer) {
              playlistContainer.setAttribute("src", `https://open.spotify.com/embed/playlist/${playlistIdResult}?utm_source=generator?theme=0`)
              playlistDisplayed = true;
            }
        }
        playlistContainer!.style.display = 'block';
        setTimeout(reEnableAllButtons, 200)
    }, 150);

  }

  return (
    <div className="playlist-prompt">
      {/* <p>by <a href="https://yujioshiro.com">yuji oshiro</a></p> */}
        <form onSubmit={onSubmit} autoComplete="off">
          <input
            type="text"
            id="prompt-input"
            name="promptInput"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="what are we up to today?" />
          <input type="button" value="Example"/>
          <input id="submit-button" type="submit" value="Generate"/>
          {/* <div id="loading-container">
            <span>loading</span>
            <span className="dot dot-1">.</span>
            <span className="dot dot-2">.</span>
            <span className="dot dot-3">.</span>
          </div> */}
        </form>
        <iframe 
          id="created-playlist-embed-iframe"
          style={{display:'none'}}>
        </iframe>
        {/* <div id="some-random-notes">
          <h3>Utilizing GPT-3 and the Spotify Web API, build your own playlists based on any prompt you want!</h3><a href="https://yujioshiro.com/contact/">Click here to send feedback</a>
          <h4>some tips</h4>
          <ul>
            <li>You can only control the sound or "emotion" of the playlist, the playlist will always be 30 songs. The title and cover are also generated based on your prompt</li>
            <li>add specific descriptors to your prompt. For example:</li>
            <ul>
              <li>instead of <s>make me a playlist so that I can focus on my homework</s> you write <strong>background music while doing homework, instrumental, quiet, calm</strong></li>
              <li>instead of <s>songs to listen to while driving with my friends</s> you write <strong>driving around with my friends, happy, upbeat</strong></li>
            </ul>
            <li>add specific artists or genres to the list if you're looking for a certain sound... "driving around with my friends, happy, upbeat, hip hop" or "driving around with my friends, happy, upbeat, pop"</li>
            <li>if the playlist isn't what you were looking for, try the same prompt againor add more specific words</li>
            <li>some example prompts:</li>
            <ul>
              <li><i>hanging out at the fair with my boyfriend, high energy, love, pop, calvin harris</i><iframe className="demo-playlist" src="https://open.spotify.com/embed/playlist/5oFxL9lUSDtNMtbiU1R9It?utm_source=generator&theme=0" width="100%" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></li>
              <li><i>moved away from a place I call home, underground, sad, melancholy, pop</i><iframe className="demo-playlist" src="https://open.spotify.com/embed/playlist/39hed74CQbHk1nmHWbzkBs?utm_source=generator&theme=0" width="100%" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></li>
              <li><i>slow rnb to cry to</i><iframe className="demo-playlist" src="https://open.spotify.com/embed/playlist/68247ykwhFqKdA4Ogjvns7?utm_source=generator&theme=0" width="100%" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></li>
            </ul>
            <li>FINALLY, don't restrict yourself to my "rules." type out random prompts that don't follow my tips and see what it does for you. It's fun to see what it creates based on the words you use. And <a href="https://yujioshiro.com/contact/">leave any feedback or suggestions</a></li>
          </ul>
          <h4>some issues</h4>
          <ul>
            <li>if it fails to load a playlist, just reclick generate. If it fails more than a couple times, it might be having trouble finding songs that fit your prompt. Readjust the prompt and resubmit. Currently my top priority, will have better error handling implemented soon</li>
            <li>the program doesn't yet recognize years or eras. Unfortunately, spotify web api doesn't have a straightforward way to work with years. I am figuring out a way to take care of this!</li>
            <li>styling will be worked on when the program runs smoother and produces better playlists</li>
          </ul>
        </div>  */}
    </div>
  )

  
}

