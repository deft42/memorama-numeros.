const CACHE_NAME = "memorama-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  // Agrega tus audios y cualquier ícono
  "./audios/1_Pixel_Dreams.mp3",
  "./audios/2_Counting_Stars.mp3",
  "./audios/3_Memory_Quest.mp3",
  "./audios/4_Bit_by_Bit.mp3",
  "./audios/5_Numberland.mp3",
  "./audios/6_Retro_Playground.mp3",
  "./audios/7_Tiny_Adventures.mp3",
  "./audios/8_Learning_Loop.mp3",
  "./audios/9_Pixel_Parade.mp3",
  "./audios/10_Happy_Digits.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (!cacheWhitelist.includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});
