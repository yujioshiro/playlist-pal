import sharp from "sharp";

export async function createPlaylist(prompt: string, songs: string[], accessToken: string, image: string) {
    console.log(typeof songs);
    console.log(`Adding these song ids: ${songs}`);
    console.log(accessToken);

    // create new playlist
    const requestBody = {
        name: prompt,
        description: `This playlist was created with playlistpal.yujioshiro.com`,
        public: true,
    }

    const createdPlaylistResponse = await fetch("https://api.spotify.com/v1/users/12150582226/playlists", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        }
    ); 

    const createdPlaylistData = await createdPlaylistResponse.json()
    console.log(createdPlaylistData);
    console.log(createdPlaylistData.id);
    await Promise.all([
        addSongsToPlaylist(songs, createdPlaylistData.id, accessToken),
        uploadPlaylistCoverImage(image, createdPlaylistData.id, accessToken)
    ])
    
    console.log(`playlistId: ${createdPlaylistData.id}`);
    return { result: createdPlaylistData.id }
}

export async function addSongsToPlaylist(songs: string[], playlistId: string, accessToken: string) {
    for (let song of songs) {
        console.log(`song: ${song}`);
        await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?uris=spotify:track:${song}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
    }
}


export async function uploadPlaylistCoverImage(image: string, playlistId: string, accessToken: string) {
     //upload image
     console.log("attempting image upload");
     const imageResponse = await fetch(image);
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
     // console.log("base64data", base64data);
         try {
         fetch(`https://api.spotify.com/v1/playlists/${playlistId}/images`, {
             method: "PUT",
             headers: {
             Authorization: `Bearer ${accessToken}`,
             "Content-Type": "image/jpeg",
             },
             body: base64data,
         });
     } catch (error) {
         console.log("error:", error);
     }
}