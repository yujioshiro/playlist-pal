import sharp from 'sharp';

export async function createPlaylistAndAddSongsWithValues ( valuesObject: any, imageObject: any, prompt:string ) {

    const clientId: string = process.env.SPOTIFY_CLIENT_ID!;
    const clientSecret: string = process.env.SPOTIFY_CLIENT_SECRET!;
    const refreshToken: string = process.env.SPOTIFY_REFRESH_TOKEN!;

    interface Attribute {
        [key: string]: number;
        acousticness: number;
        danceability: number;
        energy: number;
        instrumentalness: number;
        liveness: number;
        loudness: number;
        popularity: number;
        speechiness: number;
        target_tempo: number;
    }

    interface ValuesInJSON {
        title: string;
        genres: string[];
        artists: string[];
        attributes: Attribute[];
    }    

    interface SearchResponse {
        "artists": {
          "href": string,
          "items": [
            {
              "id": string,
              "name": string,
              "uri": string
            },
            {
              "id": string,
              "name": string,
              "uri": string
            }
          ],
          "limit": number,
          "next": string,
          "offset": number,
          "previous": null,
          "total": number
        }
    }

    interface Track {
        album: {
          album_type: string;
          artists: {
            external_urls: {
              spotify: string;
            };
            href: string;
            id: string;
            name: string;
            type: string;
            uri: string;
          }[];
          available_markets: string[];
          external_urls: {
            spotify: string;
          };
          href: string;
          id: string;
          images: {
            height: number;
            url: string;
            width: number;
          }[];
          name: string;
          release_date: string;
          release_date_precision: string;
          total_tracks: number;
          type: string;
          uri: string;
        };
        artists: {
          external_urls: {
            spotify: string;
          };
          href: string;
          id: string;
          name: string;
          type: string;
          uri: string;
        }[];
        available_markets: string[];
        disc_number: number;
        duration_ms: number;
        explicit: boolean;
        external_ids: {
          isrc: string;
        };
        external_urls: {
          spotify: string;
        };
        href: string;
        id: string;
        is_local: boolean;
        name: string;
        popularity: number;
        preview_url: string | null;
        track_number: number;
        type: string;
        uri: string;
      }
      
      interface ReturnedRecommendationData {
        tracks: Track[];
      }
      
    // const playlistStringified = JSON.stringify(valuesObject);
    let jsonString = valuesObject.result.replace(/^\.\n\n/, '');

    const valuesInJSON: ValuesInJSON = JSON.parse(jsonString);

    console.log("The values parsed into JSON:",valuesInJSON);
    console.log("genres:",valuesInJSON.genres);
    console.log("artists:",valuesInJSON.artists);
    console.log("attributes",valuesInJSON.attributes);

    let spotifyRecommendationValuesEndpointUrl = 'https://api.spotify.com/v1/recommendations?limit=30';


    const accessTokenWithPublicScopeResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
    });

    // console.log("retrieving accessToken JSON Data Response");
    const accessTokenWithPublicScopeResponseData = await accessTokenWithPublicScopeResponse.json();
    // console.log("Retrieved data response");
    const accessToken = accessTokenWithPublicScopeResponseData.access_token;
    // console.log("Retrieved Access Token:", accessToken);

    const AVAILABLE_GENRES = ["acoustic", "afrobeat", "alt-rock", "alternative", "ambient", "anime", "black-metal", "bluegrass", "blues", "bossanova", "brazil", "breakbeat", "british", "cantopop", "chicago-house", "children", "chill", "classical", "club", "comedy", "country", "dance", "dancehall", "death-metal", "deep-house", "detroit-techno", "disco", "disney", "drum-and-bass", "dub", "dubstep", "edm", "electro", "electronic", "emo", "folk", "forro", "french", "funk", "garage", "german", "gospel", "goth", "grindcore", "groove", "grunge", "guitar", "happy", "hard-rock", "hardcore", "hardstyle", "heavy-metal", "hip-hop", "holidays", "honky-tonk", "house", "idm", "indian", "indie", "indie-pop", "industrial", "iranian", "j-dance", "j-idol", "j-pop", "j-rock", "jazz", "k-pop", "kids", "latin", "latino", "malay", "mandopop", "metal", "metal-misc", "metalcore", "minimal-techno", "movies", "mpb", "new-age", "new-release", "opera", "pagode", "party", "philippines-opm", "piano", "pop", "pop-film", "post-dubstep", "power-pop", "progressive-house", "psych-rock", "punk", "punk-rock", "r-n-b", "rainy-day", "reggae", "reggaeton", "road-trip", "rock", "rock-n-roll", "rockabilly", "romance", "sad", "salsa", "samba", "sertanejo", "show-tunes", "singer-songwriter", "ska", "sleep", "songwriter", "soul", "soundtracks", "spanish", "study", "summer", "swedish", "synth-pop", "tango", "techno", "trance", "trip-hop", "turkish", "work-out", "world-music"]
    // search for genres
    for (let i = 0; i < valuesInJSON.genres.length; i++) {
        valuesInJSON.genres[i] = valuesInJSON.genres[i].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
        valuesInJSON.genres[i] = valuesInJSON.genres[i].replace(/\s+/g, '-');
        valuesInJSON.genres[i] = valuesInJSON.genres[i].toLowerCase();
        valuesInJSON.genres[i] = valuesInJSON.genres[i].trim();

        console.log("before:",valuesInJSON.genres[i]);
        if (valuesInJSON.genres[i] === "r-b" || valuesInJSON.genres[i] === "r-and-b") {
          valuesInJSON.genres[i] = "r-n-b";
        }
        console.log("after:",valuesInJSON.genres[i]);
        if (AVAILABLE_GENRES.indexOf(valuesInJSON.genres[i]) === -1) {
          console.log(valuesInJSON.genres[i] + " not found in available genres")
        } else {
          console.log(valuesInJSON.genres[i] + " FOUND!");
          spotifyRecommendationValuesEndpointUrl = spotifyRecommendationValuesEndpointUrl + "&seed_genres=" + valuesInJSON.genres[i];
        }
    }

    // search for artist IDs
    for (let i = 0; i < valuesInJSON.artists.length; i++) {

        const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${valuesInJSON.artists[i]}&type=artist`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
        });

        const searchData = await searchResponse.json();
        console.log(searchData.artists.items[0].id);

        if (searchData) {
            if (i === 0) {
                spotifyRecommendationValuesEndpointUrl = spotifyRecommendationValuesEndpointUrl + "&seed_artists=" + searchData.artists.items[0].id;
            } else {
                spotifyRecommendationValuesEndpointUrl = spotifyRecommendationValuesEndpointUrl + "," + searchData.artists.items[0].id;
            }
        }
    }

    for (const attribute of valuesInJSON.attributes) {
        for (const key in attribute) {
            console.log(`${key}: ${attribute[key]}`);
            spotifyRecommendationValuesEndpointUrl = `${spotifyRecommendationValuesEndpointUrl}&target_${key}=${attribute[key]}`
        }
    }
      
    console.log("attempting fetch using:",spotifyRecommendationValuesEndpointUrl);

    // trim the prompt to 204 characters

    const requestBody = {
        name: valuesInJSON.title,
        description: `${prompt.slice(0,203)} // This playlist was created using GPT-3, create your own at https://playlistpal.yujioshiro.com`,
        public: true,
    };

    console.log("Playlist created:",requestBody);
    const createdPlaylistResponse = await fetch(
    "https://api.spotify.com/v1/users/12150582226/playlists",
    {
        method: "POST",
        headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    }
    ); 

    const createdPlaylistData = await createdPlaylistResponse.json();
    console.log("createdPlaylistData.id:",createdPlaylistData.id);

    let numberOfTries = 0;
    let retrievedPlaylistFromSpotify = false;

    while (numberOfTries < 5 && !retrievedPlaylistFromSpotify) {
      try {
          const returnedRecommendationResponse = await fetch(`${spotifyRecommendationValuesEndpointUrl}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          });

          const returnedRecommendationData: ReturnedRecommendationData = await returnedRecommendationResponse.json();
          console.log("returnedRecommendationData:",returnedRecommendationData);

          let songUris = '';

          returnedRecommendationData.tracks.map((track) => {
              songUris += `${track.uri},`;
          });
          songUris = songUris.slice(0, -1); // remove the last comma

          const returnedAddedSongToPlaylistResponse = await fetch(`https://api.spotify.com/v1/playlists/${createdPlaylistData.id}/tracks?uris=${songUris}`, {
              method: "POST",
              headers: {
                  Authorization: `Bearer ${accessToken}`
              }
          });
          const returnedAddedSongToPlaylistData = returnedAddedSongToPlaylistResponse.json();
          console.log("returnedAddedSongToPlaylistData",returnedAddedSongToPlaylistData);
          retrievedPlaylistFromSpotify = true;

        } catch (error) {
          console.log("THAT WAS TRY #",numberOfTries)
          console.log("This error is being sent when trying to add the songs:",error);
        }
        numberOfTries++;
      }

      console.log("imageObject.result:", imageObject.result);
      console.log("type", typeof imageObject);
      
      // Upload the image
      console.log("attempting image upload");
      const imageResponse = await fetch(imageObject.result);
      console.log("Converted imageObject to imageResponse...");
      const blob = await imageResponse.blob();
      console.log("converted imageResponse to blob...");
      
      // Resize the image
      const MAX_WIDTH = 300; // Set the maximum width for the resized image
      const MAX_HEIGHT = 300; // Set the maximum height for the resized image
      
      const buffer = Buffer.from(await blob.arrayBuffer());
      
      const resizedImageBuffer = await sharp(buffer)
      .resize(MAX_WIDTH, MAX_HEIGHT, { fit: 'inside' })
      .jpeg({ quality: 80 }) // Adjust the quality value to reduce the file size
      .toBuffer();
    
      
      const base64data = resizedImageBuffer.toString('base64');
      console.log("base64data", base64data);
      try {
        const uploadedImageResponse = await fetch(`https://api.spotify.com/v1/playlists/${createdPlaylistData.id}/images`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "image/jpeg",
          },
          body: base64data,
        });
        console.log("uploadedImageResponse:", uploadedImageResponse);
      } catch (error) {
        console.log("error:", error);
      }
      
        


    // const getSongUri = async (song: string, artist: string) => {
    // try {
    //     artist = artist.split(' ')[0];
    //     console.log(`track:${song} artist:${artist}`);
    //     console.log("Before fetch");
    //     const songUriResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(`track:${song} artist:${artist}`)}&type=track&offset=0&limit=1`, {
    //     headers: {
    //         Authorization: `Bearer ${accessToken}`,
    //         'Content-Type': 'application/json'
    //     }
    //     });
    //     console.log("After fetch");
    //     console.log("songUriResponse:", songUriResponse);
    //     console.log("songUriResponse status:", songUriResponse.status);
    //     const data = await songUriResponse.json();
    //     console.log(data);
    //     return data.tracks.items[0].uri;
    // } catch (error) {
    //     console.error("Error:", error);
    // }
    // }
          
  return { result: createdPlaylistData.id};
}
