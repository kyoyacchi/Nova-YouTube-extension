// for test
// the adjustment area depends on the video size. Problems are visible at non-standard proportions
// https://www.youtube.com/watch?v=U9mUwZ47z3E - ultra-wide
// https://www.youtube.com/watch?v=4Zivt4wbvoM - narrow
// https://www.youtube.com/watch?v=embed%2FJVi_e - err - TypeError: Cannot read property 'playerMicroformatRenderer' of undefined

// fot "isMusic" fn test
// https://www.youtube.com/watch?v=kCHiSHxTXgg - svg icon "🎵"
// https://www.youtube.com/results?search_query=Highly+Suspect+-+Upperdrugs+-+2019 // test transition. Open firt thumb "Highly Suspect 🎵"

window.nova_plugins.push({
   id: 'rate-wheel',
   title: 'Playback speed control',
   'title:zh': '播放速度控制',
   'title:ja': '再生速度制御',
   run_on_pages: 'watch, embed',
   section: 'player',
   // desc: 'Use mouse wheel to change playback speed',
   desc: 'with mousewheel',
   'desc:zh': '带鼠标滚轮',
   'desc:ja': 'マウスホイール付き',
   _runtime: user_settings => {

      NOVA.waitElement('#movie_player')
         .then(player => {
            // trigger default indicator
            // Default indicator does not work for html5 way
            // player.addEventListener('onPlaybackRateChange', rate => {
            //    console.debug('onPlaybackRateChange', rate);
            // });
            NOVA.waitElement('video')
               .then(video => {
                  const sliderConteiner = renderSlider();

                  // html5 way
                  video.addEventListener('ratechange', function () {
                     // console.debug('ratechange', player.getPlaybackRate(), this.playbackRate);
                     NOVA.bezelTrigger(this.playbackRate + 'x');

                     // slider update
                     sliderConteiner.slider.value = this.playbackRate;
                     sliderConteiner.sliderLabel.textContent = `Speed (${this.playbackRate})`;
                     sliderConteiner.sliderCheckbox.checked = this.playbackRate === 1 ? false : true;
                  });

                  video.addEventListener('loadeddata', setDefaultRate);

                  sliderConteiner.slider.addEventListener('change', ({ target }) => playerRate.set(target.value));
                  sliderConteiner.slider.addEventListener('wheel', evt => {
                     evt.preventDefault();
                     const rate = playerRate.adjust(+user_settings.rate_step * Math.sign(evt.wheelDelta));
                  });
                  sliderConteiner.sliderCheckbox.addEventListener('change', ({ target }) => target.checked || playerRate.set(1));
               });

            // mousewheel in player area
            if (user_settings.rate_hotkey) {
               document.querySelector('.html5-video-container')
                  .addEventListener('wheel', evt => {
                     evt.preventDefault();

                     if (evt[user_settings.rate_hotkey]
                        || (user_settings.rate_hotkey == 'none' && !evt.ctrlKey && !evt.altKey && !evt.shiftKey)) {
                        // console.debug('hotkey caught');
                        const rate = playerRate.adjust(+user_settings.rate_step * Math.sign(evt.wheelDelta));
                        // console.debug('current rate:', rate);
                     }
                  });
            }

            const playerRate = {
               // DEBUG: true,

               set(level = 1) {
                  this.log('set', ...arguments);
                  player.setPlaybackRate(+level) && this.saveInSession(level);
               },

               // adjust(rate_step) {
               //    // default method requires a multiplicity of 0.25
               //    return (+rate_step % .25) === 0 && player.hasOwnProperty('getPlaybackRate')
               //       ? this.default(+rate_step)
               //       : this.html5(+rate_step);
               // },

               adjust(rate_step = required()) {
                  this.log('adjust', ...arguments);
                  return player.hasOwnProperty('getPlaybackRate') ? this.default(+rate_step) : this.html5(+rate_step);
               },

               default(playback_rate = required()) {
                  this.log('playerRate:default', ...arguments);
                  const playbackRate = player.getPlaybackRate();
                  // const inRange = delta => {
                  //    const rangeRate = player.getAvailablePlaybackRates();
                  //    const playbackRateIdx = rangeRate.indexOf(playbackRate);
                  //    return rangeRate[playbackRateIdx + delta];
                  // };
                  // const newRate = inRange(Math.sign(+playback_rate));
                  const inRange = step => {
                     const setRateStep = playbackRate + step;
                     return (.1 <= setRateStep && setRateStep <= 2) && +setRateStep.toFixed(2);
                  };
                  const newRate = inRange(+playback_rate);
                  // set new rate
                  if (newRate && newRate != playbackRate) {
                     player.setPlaybackRate(newRate);

                     if (newRate === player.getPlaybackRate()) {
                        this.saveInSession(newRate);

                     } else {
                        console.error('playerRate:default different: %s!=%s', newRate, player.getPlaybackRate());
                     }
                  }
                  this.log('playerRate:default return', newRate);
                  return newRate === player.getPlaybackRate() && newRate;
               },

               html5(playback_rate = required()) {
                  this.log('playerRate:html5', ...arguments);
                  const videoElm = player.querySelector('video');
                  const playbackRate = videoElm.playbackRate;
                  const inRange = step => {
                     const setRateStep = playbackRate + step;
                     return (.1 <= setRateStep && setRateStep <= 3) && +setRateStep.toFixed(2);
                  };
                  const newRate = inRange(+playback_rate);
                  // set new rate
                  if (newRate && newRate != playbackRate) {
                     // document.querySelector('video').defaultPlaybackRate = newRate;
                     videoElm.playbackRate = newRate;

                     if (newRate === videoElm.playbackRate) {
                        this.saveInSession(newRate);

                     } else {
                        console.error('playerRate:html5 different: %s!=%s', newRate, videoElm.playbackRate);
                     }
                  }
                  this.log('playerRate:html5 return', newRate);
                  return newRate === videoElm.playbackRate && newRate;
               },

               saveInSession(level = required()) {
                  try {
                     sessionStorage['yt-player-playback-rate'] = JSON.stringify({
                        creation: Date.now(), data: level.toString(),
                     })
                     this.log('playbackRate save in session:', ...arguments);

                  } catch (err) {
                     console.info(`${err.name}: save "rate" in sessionStorage failed. It seems that "Block third-party cookies" is enabled`, err.message);
                  }
               },

               log(...args) {
                  if (this.DEBUG && args?.length) {
                     console.groupCollapsed(...args);
                     console.trace();
                     console.groupEnd();
                  }
               },
            };

            function setDefaultRate() {
               // init rate_default
               if (+user_settings.rate_default !== 1 && (!user_settings.rate_default_apply_music || !isMusic())) {
                  // console.debug('update rate_default', +user_settings.rate_default, user_settings.rate_default_apply_music, isMusic());
                  playerRate.set(user_settings.rate_default);
               }

               function isMusic() {
                  const title = player.getVideoData().title;

                  if (user_settings.rate_default_apply_music === 'expanded') {
                     if (title.includes(' - ')  // search for a hyphen. Ex.:"Artist - Song"
                        || ['CD', 'AUDIO', 'FULL', 'POP', 'TRAP'].some(i => title.toUpperCase().includes(i))
                     ) {
                        // ,'TRACK'
                        return true;
                     }
                  }

                  // warn false finding ex: "AUDIO visualizer" 'underCOVER','VOCALoid','write THEME','photo ALBUM', 'lolyPOP', 'ascENDING'
                  return [
                     title,
                     location.href, // 'music.youtube.com' or 'youtube.com#music'
                     // ALL BELOW - not updated on page transition!
                     // document.querySelector('meta[itemprop="genre"][content]')?.content,
                     // window.ytplayer?.config?.args.raw_player_response.microformat?.playerMicroformatRenderer.category,
                     document.querySelector('ytd-player')?.player_?.getCurrentVideoConfig()?.args.raw_player_response.microformat.playerMicroformatRenderer.category
                  ]
                     .some(i => i?.toLowerCase().includes('music'))
                     // has svg icon "🎵"
                     || document.querySelector('#meta #upload-info #channel-name svg path[d*="M12,4v9.38C11.27,12.54,10.2,12,9,12c-2.21,0-4,1.79-4,4c0,2.21,1.79,4,4,4s4-1.79,4-4V8h6V4H12z"]')
                     // channelNameVEVO
                     || /(VEVO|Topic|Records)$/.test(document.querySelector('#meta #upload-info #channel-name a')?.textContent) // |Media
                     // search in title
                     || title && ['SONG', 'SOUND', 'LYRIC', 'THEME', 'AMBIENT', '🎵', '♫', 'MIX', /*'REMIX',*/  'OFFICIAL VIDEO', 'OFFICIAL AUDIO', 'AUDIO)', 'AUDIO]', 'VEVO', 'FEAT.', 'FT.', 'KARAOKE', 'OPENING', 'COVER', 'VOCAL', 'INSTRUMENTAL', 'DNB', 'BASS', 'BEAT', 'LIVE RADIO', 'ALBUM', 'PLAYLIST', 'DUBSTEP', 'DANCE VER', '8-BIT', 'PIANO', 'HIP HOP', 'CHILL', 'RELAX', 'EXTENDED', 'HOUR VER', 'HOURS VER'].some(i => title.toUpperCase().includes(i))
                     // case sensitive
                     || ['MV', 'PV', 'OST', 'NCS', 'BGM', 'EDM', 'GMV', 'AMV', 'OP', 'ED', 'MMD'].some(i => title.includes(i));
               }
            }
         });


      function renderSlider() {
         const
            video = document.querySelector('video'),
            SELECTOR_ID = 'rate-slider-menu',
            SELECTOR = '#' + SELECTOR_ID; // for css

         NOVA.css.push(
            `${SELECTOR} [type="range"] {
               vertical-align: text-bottom;
               margin: '0 5px',
            }
            ${SELECTOR} [type="checkbox"] {
               appearance: none;
               outline: none;
               cursor: pointer;
            }

            ${SELECTOR} [type="checkbox"]:checked {
               background: #f00;
            }

            ${SELECTOR} [type="checkbox"]:checked:after {
               left: 20px;
               background-color: #fff;
            }`);

         // slider
         const slider = document.createElement('input');
         slider.className = 'ytp-menuitem-slider';
         slider.type = 'range';
         slider.min = .1;
         slider.max = 2;
         slider.step = .1;
         slider.value = video.playbackRate;
         // slider.addEventListener('change', () => playerRate.set(slider.value));
         // slider.addEventListener('wheel', () => playerRate.set(slider.value));

         const sliderIcon = document.createElement('div');
         sliderIcon.className = 'ytp-menuitem-icon';

         const sliderLabel = document.createElement('div');
         sliderLabel.className = 'ytp-menuitem-label';
         sliderLabel.textContent = `Speed (${video.playbackRate})`;

         const sliderCheckbox = document.createElement('input');
         sliderCheckbox.className = 'ytp-menuitem-toggle-checkbox';
         sliderCheckbox.type = 'checkbox';
         sliderCheckbox.title = 'Remember speed';
         // sliderCheckbox.addEventListener('change', function () {
         //    this.value
         // });

         // appends
         const right = document.createElement('div');
         right.className = 'ytp-menuitem-content';
         right.append(sliderCheckbox);
         right.append(slider);

         const speedMenu = document.createElement('div');
         speedMenu.className = 'ytp-menuitem';
         speedMenu.id = SELECTOR_ID;
         speedMenu.append(sliderIcon);
         speedMenu.append(sliderLabel);
         speedMenu.append(right);

         document.querySelector('.ytp-panel-menu')
            ?.append(speedMenu);

         // append final
         // document.querySelector('.ytp-panel-menu')
         //    ?.insertAdjacentHTML('beforeend',
         //       `<div class="ytp-menuitem" id="rate-slider-menu">
         //          <div class="ytp-menuitem-icon"></div>
         //          <div class="ytp-menuitem-label">Speed (${user_settings.rate_default})</div>
         //          <div class="ytp-menuitem-content">
         //             <input type="checkbox" checked="${Boolean(user_settings.rate_default)}" title="Remember speed" class="ytp-menuitem-toggle-checkbox">
         //             <input type="range" min="0.5" max="4" step="0.1" class="ytp-menuitem-slider">
         //          </div>
         //       </div>`);

         return {
            'sliderCheckbox': document.querySelector(`${SELECTOR} [type="checkbox"]`),
            'slider': document.querySelector(`${SELECTOR} [type="range"]`),
            'sliderLabel': document.querySelector(`${SELECTOR} .${sliderLabel.className}`),
         };
      }

   },
   options: {
      rate_default: {
         _tagName: 'input',
         // label: 'Default rate',
         label: 'Speed at startup',
         'label:zh': '启动速度',
         'label:ja': '起動時の速度',
         type: 'number',
         title: '1 - default',
         placeholder: '1-2',
         step: 0.05,
         min: 1,
         max: 2,
         value: 1,
      },
      rate_default_apply_music: {
         _tagName: 'select',
         label: 'Music genre',
         'label:zh': '音乐流派视频',
         'label:ja': '音楽ジャンルのビデオ',
         title: 'extended detection - may trigger falsely',
         'title:zh': '扩展检测 - 可能会错误触发',
         'title:ja': '拡張検出-誤ってトリガーされる可能性があります',
         options: [
            { label: 'skip', value: true, selected: true, 'label:zh': '跳过', 'label:ja': 'スキップ' },
            { label: 'skip (extended detection)', value: 'expanded', 'label:zh': '跳过（扩展检测）', 'label:ja': 'スキップ（拡張検出）' },
            { label: 'force apply', value: false, 'label:zh': '施力', 'label:ja': '力を加える' },
         ],
         'data-dependent': '{"rate_default":"!1"}',
      },
      rate_step: {
         _tagName: 'input',
         label: 'Step',
         'label:zh': '步',
         type: 'number',
         title: '0.25 - default',
         placeholder: '0.1-1',
         step: 0.05,
         min: 0.1,
         max: 0.5,
         value: 0.25,
      },
      rate_hotkey: {
         _tagName: 'select',
         label: 'Hotkey',
         'label:zh': '热键',
         options: [
            { label: 'alt+wheel', value: 'altKey', selected: true },
            { label: 'shift+wheel', value: 'shiftKey' },
            { label: 'ctrl+wheel', value: 'ctrlKey' },
            { label: 'wheel', value: 'none' },
            { label: 'disable', value: false },
         ],
      },
   },
});
