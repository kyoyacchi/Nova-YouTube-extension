window.nova_plugins.push({
   id: 'player-hotkeys-focused',
   title: 'Player hotkeys always active',
   'title:zh': '播放器热键始终处于活动状态',
   'title:ja': 'プレーヤーのホットキーは常にアクティブです',
   run_on_pages: 'watch',
   section: 'player',
   // desc: 'Player hotkeys always active【SPACE/F】etc.',
   _runtime: user_settings => {

      document.addEventListener('keydown', ({ target }) => {
         // document.activeElement.style.border = "2px solid red"; // mark for test
         // console.debug('activePlayer', target.localName);
         if (!['input', 'textarea'].includes(target.localName) && !target.isContentEditable ) {
            document.querySelector('video')?.focus();
         }
      });

   },
});
