_plugins_conteiner.push({
   id: 'thumbnails-rating',
   title: 'Rating preview',
   run_on_pages: 'all, -embed',
   section: 'other',
   opt_api_key_warn: true,
   desc: 'Rating bar over videos thumbnail',
   _runtime: user_settings => {

      const
         CACHED_TIME = 8, // hours
         SELECTOR_ID = 'rating-line',
         CACHE_NAME = 'ratings-thumbnail',
         colorLiker = user_settings.rating_like_color || '#3ea6ff',
         colorDislike = user_settings.rating_dislike_color || '#ddd';

      // init bars style
      YDOM.css.push(
         `#${SELECTOR_ID}{
            --height: ${(user_settings.rating_bar_height || 5)}px;
         }
         #${SELECTOR_ID}{
            width: 100%;
            height: var(--height);
         }
         a#thumbnail #${SELECTOR_ID} {
            position: absolute;
            bottom: 0;
         }`);

      let thumbsIdCollect = [];
      let newCache = {};

      YDOM.watchElement({
         selector: 'a#thumbnail[href]',
         attr_mark: 'thumbnail-rated',
         callback: thumbnail => {
            const id = YDOM.getQueryURL('v', thumbnail.href);
            id && thumbsIdCollect.push(id);
         },
      });

      // chack update new thumbnail
      setInterval(() => {
         patchThumbnail(thumbsIdCollect);
         updaterCache(newCache);
      }, 1000 * 1); // 1sec

      function updaterCache(new_cache) {
         if (!new_cache || !Object.keys(new_cache).length) return;
         // console.debug('updaterCache', ...arguments);
         newCache = {}; // clear
         let oldCache = JSON.parse(localStorage.getItem(CACHE_NAME)) || {}; // get
         const timeNow = new Date();
         // delete expired
         // console.groupCollapsed('ratingCacheExpires');
         Object.entries(oldCache)
            .filter(([key, value]) => {
               const cacheDate = new Date(+value?.date);
               const timeExpires = cacheDate.setHours(cacheDate.getHours() + CACHED_TIME);
               if (timeNow > timeExpires) {
                  // console.debug('timeExpires', key, value);
                  delete oldCache[key];
               }
            });
         // console.groupEnd();
         // save
         localStorage.setItem(CACHE_NAME, JSON.stringify(Object.assign(new_cache, oldCache)));
      }

      function patchThumbnail(vids_id) {
         if (!vids_id?.length) return;
         // console.debug('find thumbnail', ...arguments);
         thumbsIdCollect = []; // clear
         let oldCache = JSON.parse(localStorage.getItem(CACHE_NAME));
         const timeNow = new Date().getTime();

         const newIds = vids_id.filter(id => {
            if (oldCache?.hasOwnProperty(id)) {
               const cacheItem = oldCache[id],
                  cacheDate = new Date(+cacheItem?.date),
                  timeExpires = cacheDate.setHours(cacheDate.getHours() + CACHED_TIME);
               // console.debug(timeNow, timeExpires);
               if (timeNow < timeExpires) {
                  // console.debug('cached', id);
                  attachBar({ 'id': id, 'pt': cacheItem.pt });
                  return false;
               }
               // else console.debug('expired', document.querySelector(`a#thumbnail[href*="${id}"]`));
            }
            // else console.debug('new', document.querySelector(`a#thumbnail[href*="${id}"]`));
            return true;
         });
         // console.debug('newIds', newIds);
         requestRating(newIds);
      }

      function requestRating(arr_id) {
         if (!arr_id?.length) return;
         // console.debug('requestRating', ...arguments);

         const YOUTUBE_API_MAX_IDS_PER_CALL = 50; // API max = 50

         chunkArray(arr_id, YOUTUBE_API_MAX_IDS_PER_CALL)
            .forEach(id_part => {
               // console.debug('id_part', id_part);
               YDOM.request.API({
                  request: 'videos',
                  params: { 'id': id_part.join(','), 'part': 'statistics' },
                  api_key: user_settings['custom-api-key'],
               })
                  .then(res => {
                     res?.items?.forEach(item => {
                        // console.debug('item', item);
                        const
                           views = parseInt(item.statistics.viewCount) || 0,
                           likes = parseInt(item.statistics.likeCount) || 0,
                           dislikes = parseInt(item.statistics.dislikeCount) || 0,
                           total = likes + dislikes;

                        let percent = Math.floor(likes / total * 100);
                        let timeNow = new Date();

                        // show more than the min value
                        if (views > 5 && total > 3) {
                           attachBar({ 'id': item.id, 'pt': percent });
                           // console.debug('requestRating > attachBar', item.id);
                        } else {
                           percent = undefined; // do not display
                           timeNow = timeNow.setHours(timeNow.getHours() - (CACHED_TIME - 1)); // cache for 1 hour
                        }
                        // push to cache
                        newCache[item.id] = { 'date': new Date(timeNow).getTime(), 'pt': percent };
                     });
                  });
            });

         function chunkArray(array = [], size) {
            let chunked = [];
            while (array.length) chunked.push(array.splice(0, size));
            return chunked;
         }
      }

      function attachBar({ id, pt }) {
         if (!id || !pt) return
         // console.debug('attachBar', ...arguments);
         document.querySelectorAll(`a#thumbnail[href*="${id}"]`)
            .forEach(a => {
               // console.debug('finded', a, pt);
               a.insertAdjacentHTML("beforeend",
                  `<div id="${SELECTOR_ID}" class="style-scope ytd-sentiment-bar-renderer" style="background:linear-gradient(to right, ${colorLiker} ${pt}%, ${colorDislike} ${pt}%)"></div>`);
            });
      }

   },
   options: {
      rating_bar_height: {
         _tagName: 'input',
         label: 'Bar height',
         type: 'number',
         title: 'In pixels',
         placeholder: '1-9',
         min: 1,
         max: 9,
         value: 3,
      },
      rating_like_color: {
         _tagName: 'input',
         label: 'Like color',
         type: 'color',
         value: '#3ea6ff',
      },
      rating_dislike_color: {
         _tagName: 'input',
         label: 'Dislike color',
         type: 'color',
         value: '#ddDDdd',
      },
   },
});