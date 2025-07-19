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

        const apiRes = await fetch(`https://www.hackthebox.com/api/v4/profile/${id}`, options);
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
        <svg xmlns="http://www.w3.org/2000/svg" width="420" height="320" viewBox="0 0 420 320" style="background-color:#161b22; border-radius:16px;">
        <style>
        .title { fill: #9fef00; font-family: 'Fira Code', monospace; font-weight: bold; font-size: 20px; text-anchor: middle; }
        .label { fill: #9fef00; font-family: 'Fira Code', monospace; font-size: 14px; }
        .value { fill: #58d66d; font-family: 'Fira Code', monospace; font-size: 14px; text-anchor: end; }
        .small { fill: #58d66d; font-family: 'Fira Code', monospace; font-size: 12px; text-anchor: middle; }
        .progress-bg { fill: #30363d; rx: 10; ry: 10; }
        .progress-bar { fill: #9fef00; rx: 10; ry: 10; }
        </style>

        <rect width="420" height="320" rx="16" ry="16" fill="#161b22" />
        <text x="210" y="40" class="title">🟢 HACK THE BOX STATUS</text>

        <text x="30" y="80" class="label">👤 Username:</text>
        <text x="390" y="80" class="value">${profile.name}</text>

        <text x="30" y="110" class="label">🧠 Points:</text>
        <text x="390" y="110" class="value">${profile.points}</text>

        <text x="30" y="140" class="label">💻 System Owns:</text>
        <text x="390" y="140" class="value">${profile.system_owns}</text>

        <text x="30" y="170" class="label">👥 User Owns:</text>
        <text x="390" y="170" class="value">${profile.user_owns}</text>

        <text x="30" y="200" class="label">🎖️ Current Rank:</text>
        <text x="390" y="200" class="value">${profile.rank}</text>

        <text x="30" y="230" class="label">⏭️ Next Rank:</text>
        <text x="390" y="230" class="value">${profile.next_rank}</text>

        <rect x="30" y="260" width="360" height="20" rx="10" ry="10" class="progress-bg" />
        <rect x="30" y="260" width="${(progress/100)*360}" height="20" rx="10" ry="10" class="progress-bar" />

        <text x="210" y="275" class="value" style="text-anchor: middle;">${progress}% Progress</text>
        
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
