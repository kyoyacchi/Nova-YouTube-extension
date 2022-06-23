window.nova_plugins.push({
   id: 'streams-disable',
   title: 'Hide Stream (live)',
   // 'title:zh': '',
   // 'title:ja': '',
   // 'title:ko': '',
   // 'title:es': '',
   // 'title:pt': '',
   // 'title:fr': '',
   // 'title:tr': '',
   // 'title:de': '',
   'title:pl': 'Ukryj strumień (na żywo)',
   run_on_pages: 'home, results, feed, channel, watch',
   // restart_on_transition: true,
   section: 'other',
   // desc: '',
   _runtime: user_settings => {

      const ATTR_MARK = 'nova-thumb-live-cleared';

      // clear before restart_on_transition
      // document.addEventListener('yt-navigate-start', () => NOVA.clear_watchElements(ATTR_MARK));

      NOVA.watchElements({
         selectors: [
            'ytd-rich-item-renderer', // home
            'ytd-video-renderer', // results
            'ytd-grid-video-renderer', // feed, channel
            'ytd-compact-video-renderer', // sidepanel in watch
            'ytm-compact-video-renderer', // mobile
            // #video-badges span:has_text("LIVE NOW")
         ],
         attr_mark: ATTR_MARK,
         callback: thumb => {
            // live now
            if (thumb.querySelector('#overlays [overlay-style="LIVE"], #video-badges [class*="live-now"], #thumbnail img[src*="qdefault_live.jpg"]')) {
               thumb.remove();
               // thumb.style.display = 'none';

               // console.debug('has live now:', thumb);
               // thumb.style.border = '2px solid red'; // mark for test
            }
            // Streamed
            if (user_settings.streamed_disable) {
               if (thumb.querySelector('#metadata-line')?.textContent?.includes('Streamed')
                  || thumb.querySelector('#video-title')?.getAttribute('aria-label')?.includes('Streamed')
               ) {
                  thumb.remove();
                  // // thumb.style.display = 'none';

                  // console.debug('has Streamed:', thumb);
                  // thumb.style.border = '2px solid green'; // mark for test
               }
            }
         },
      });

   },
   options: {
      streamed_disable: {
         _tagName: 'input',
         label: 'Also streamed',
         // 'label:zh': '',
         // 'label:ja': '',
         // 'label:ko': '',
         // 'label:es': '',
         // 'label:pt': '',
         // 'label:fr': '',
         // 'label:tr': '',
         // 'label:de': '',
         'label:pl': 'Po streamie',
         type: 'checkbox',
         title: 'That have been completed',
         'title:zh': '已经完成的',
         'title:ja': '完了しました',
         'title:ko': '완료한 것',
         'title:es': 'Que han sido completados',
         'title:pt': 'Que foram concluídos',
         'title:fr': 'Qui ont été complétés',
         'title:tr': 'Tamamlanmış olanlar',
         'title:de': 'Die sind abgeschlossen',
         'title:pl': 'Które zostały zakończone',
      },
   }
});