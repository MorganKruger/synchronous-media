require("dotenv").config(); // Youtube Data v3 API key
const axios = require("axios");
const YouTubeAPI = require("googleapis").google.youtube("v3");
const { ipcRenderer } = require("electron");


window.$ = window.jQuery = require("jquery");

const API_KEY = process.env.YOUTUBE_API_KEY;
const INTERMISSION = 3000;
// let playlistSearchResults;
let videoQueue = [];
// let currentIndex = 0;
let player;


//////////////////////
// SEARCH PLAYLISTS //
//////////////////////
$("#keywordSearch").on("keyup", function (ev) { // PLAYLIST BY KEYWORD
  if (ev.key !== "Enter") return;
  let searchQuery = ev.target.value.split(" ").join("+");

  $(ev.target).attr("disabled", true)
  
  axios.get(`https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&q=${searchQuery}&type=playlist`)
  .then(response => {
    $(ev.target).attr("disabled", false)

    response.data.items.forEach(playlist => {

      let title;
      YouTubeAPI.playlists.list({
        auth: API_KEY,
        part: "snippet",
        maxResults: 150,
        id: playlist.id.playlistId,
      },(err, response) => {
        if (err) {
          console.error("Error fetching playlist details:", err);
          return;
        }
        title = response.data.items[0].snippet.title;
      });

      let result = 
      `<li>
      <button class="searchResult" value="${playlist.id.playlistId}">${title || "--- "}: ${playlist.id.playlistId}</button>
      </li>`;
      
      $("#searchResults").append(result)
        .on("click", ev => findPlaylistVideos(ev.target.value));
      });
  }).catch(error => {
    console.error(error);
    $(ev.target).attr("disabled", false)
  });
});

$("#idSearch").on("keyup", function (ev) { // PLAYLIST BY ID
  if (ev.key === "Enter") 
    findPlaylistVideos(ev.target.value);
});

function findPlaylistVideos(plId) {
  YouTubeAPI.playlistItems.list({
    auth: API_KEY,
    part: "snippet",
    maxResults: 50,
    // maxResults: 150,
    playlistId: plId,
  }, (err, response) => {
    if (err) {
      console.error(err);
      return;
    }

    videoQueue = response.data.items.map(item => item.snippet.resourceId.videoId);
    updateQueueNumber();

    console.log(player)
    playNextInQueueWithDelay();
  });
}

///////////////////////
// PLAY THE PLAYLIST //
///////////////////////
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "100%",
    width: "100%",
    playerVars: {
      controls: 0,
      disablekb: 1,
      fs: 0,
      rel: 0,
    },
    events: {
      "onReady": onPlayerReady,
      "onStateChange": onPlayerStateChange,
      "onError": mammaMia
    }
  });
}
function mammaMia(e) {
  if (e.data == 101 || e.data == 150) { // Publisher disallowed embeds
    console.log("buh, no embeds fo you")
    ipc("hide");
    videoQueue.shift();
    playNextInQueueWithDelay();
  }
}

function onPlayerReady(event) {
  // wait for other users to be ready
  console.log("apparently ready")
  // then play
  // event.target.playVideo();
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    console.log("VIDEO ENDED")
    ipc("hide");
    playNextInQueueWithDelay();
  } else {

    // something changed, but not because a video ended.
    console.log(event.data + ":state");

  }
}

function playNextInQueueWithDelay() {
  if (!videoQueue.length) return;
    
  setTimeout(function () {
    
    // Proactive status check. 
    while (!axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoQueue[0]}&part=status&key=${API_KEY}`).uploadStatus == "processed") 
      console.log(videoQueue.shift());

    updateQueueNumber();    

    // Don't need to call stopVideo() first. Regular queueing functions work.
    player.loadVideoById(videoQueue.shift());
    ipc("show");
  }, Math.floor((Math.random() * INTERMISSION) + INTERMISSION / 2));
  
}

//////////////////
// UTILITY BELT //
//////////////////
const ipc = message => ipcRenderer.send(message);
const updateQueueNumber = () => $("#queueLength").text(videoQueue.length + " videos queued");