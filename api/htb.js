import fetch from 'node-fetch';

export default async function handler(req, res) {
    const { id } = req.query;

    // ID kontrolü: yoksa ya da sadece rakam değilse hata
    if (!id || !/^\d+$/.test(id)) {
        res.status(400).send('Invalid or missing id (should be a number)');
        return;
    }

    try {
        // Hack The Box API çağrısı
        const options = {
            method: 'GET',
            headers: {
                // Gerekli headerlar, uygun şekilde ayarla
                'accept': 'application/json',
                'user-agent': 'Mozilla/5.0'
            }
        };

        const apiRes = await fetch(`https://labs.hackthebox.com/api/v4/profile/${id}`, options);
        if (!apiRes.ok) {
            res.status(apiRes.status).send('Failed to fetch HTB profile');
            return;
        }

        const data = await apiRes.json();
        const profile = data.profile;

        // Eğer profile yoksa
        if (!profile) {
            res.status(404).send('Profile not found');
            return;
        }

        // SVG için veriler
        const progress = profile.current_rank_progress || 0;
        const ownership = profile.rank_ownership || 0;
        const requirement = profile.rank_requirement || 1;
        const remainingPercent = (((requirement - ownership) / requirement) * 100).toFixed(2);

        // Dinamik SVG stringi
        const svg = `
       <svg xmlns="http://www.w3.org/2000/svg" width="467" height="195" viewBox="0 0 467 195" fill="none">
  <style>
    .header {
      font: 600 18px 'Fira Code', monospace;
      fill: #9fef00;
    }
    .label {
      font: 600 14px 'Fira Code', monospace;
      fill: #9fef00;
    }
    .value {
      font: 600 14px 'Fira Code', monospace;
      fill: #58d66d;
    }
    .progress-bg {
      fill: #30363d;
    }
    .progress-bar {
      fill: #9fef00;
    }
  </style>

  <!-- Kart Arka Planı -->
  <rect x="0.5" y="0.5" rx="4.5" width="466" height="194" fill="#161b22" stroke="#2f2f2f" />

  <!-- Başlık -->
  <g transform="translate(25, 35)">
    <text class="header">🟢 HTB STATUS</text>
  </g>

  <!-- Bilgiler -->
  <g transform="translate(25, 60)">
    <text class="label" x="0" y="0">👤 Username:</text>
    <text class="value" x="420" y="0" text-anchor="end">${profile.name}</text>
  </g>
  <g transform="translate(25, 80)">
    <text class="label" x="0" y="0">🧠 Points:</text>
    <text class="value" x="420" y="0" text-anchor="end">${profile.points}</text>
  </g>
  <g transform="translate(25, 100)">
    <text class="label" x="0" y="0">💻 System Owns:</text>
    <text class="value" x="420" y="0" text-anchor="end">${profile.system_owns}</text>
  </g>
  <g transform="translate(25, 120)">
    <text class="label" x="0" y="0">👥 User Owns:</text>
    <text class="value" x="420" y="0" text-anchor="end">${profile.user_owns}</text>
  </g>
  <g transform="translate(25, 140)">
    <text class="label" x="0" y="0">🎖️ Current Rank:</text>
    <text class="value" x="420" y="0" text-anchor="end">${profile.rank}</text>
  </g>
  <g transform="translate(25, 160)">
    <text class="label" x="0" y="0">⏭️ Next Rank:</text>
    <text class="value" x="420" y="0" text-anchor="end">${profile.next_rank}</text>
  </g>

  <!-- İlerleme Çubuğu -->
  <g transform="translate(25, 175)">
    <rect width="417" height="10" class="progress-bg" rx="5" ry="5" />
    <rect width="${(progress/100)*417}" height="10" class="progress-bar" rx="5" ry="5" />
  </g>
</svg>
`;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // Vercel için cache
        res.status(200).send(svg);

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
