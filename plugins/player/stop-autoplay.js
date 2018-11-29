_plugins.push({
   name: 'Auto pause video',
   id: 'stop-autoplay',
   section: 'player',
   depends_page: 'watch, embed',
   // sandbox: false,
   desc: 'Pause video autoplay',
   // version: '0.1',
   _runtime: function (user_settings) {

      PolymerYoutube.waitFor('#movie_player', function (playerId) {
         // // playerId.addEventListener("onStateChange", onStateChange.bind(this));

         // function _onStateChange(state) {
         //    // 1 – unstarted
         //    // 0 – ended
         //    // 1 – playing
         //    // 2 – paused
         //    // 3 – buffering
         //    // 5 – video cued
         //    console.log('state', state);
         //    if (state === 1 || state === 3) {
         //       playerId.pauseVideo();
         //    }
         // }
         
         let wait_buffering = setInterval(() => {
            // 1 – unstarted
            // 0 – ended
            // 1 – playing
            // 2 – paused
            // 3 – buffering
            // 5 – video cued
            // console.log('getPlayerState', playerId.getPlayerState());
            // if (playerId.getPlayerState() !== 3) {
            if (playerId.getPlayerState() === 1) {
               clearInterval(wait_buffering);
               // console.log('getPlayerState ok');
               playerId.pauseVideo();
            }
         }, 50);
      })

   },
});