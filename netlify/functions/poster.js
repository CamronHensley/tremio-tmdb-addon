/**
 * Poster Overlay Function
 *
 * Fetches poster images (TMDB or Fanart.tv) and adds streaming service badges
 * in the top-right corner (like Netflix does for their originals)
 *
 * Usage:
 * - TMDB: /.netlify/functions/poster?path=/w500/abc123.jpg&badge=NETFLIX
 * - Full URL: /.netlify/functions/poster?url=https://...&badge=NETFLIX
 */

const fetch = require('node-fetch');
const sharp = require('sharp');

// Streaming service badge SVGs (80x80px, top-right corner placement)
const BADGE_SVGS = {
  NETFLIX: `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" fill="#E50914" rx="8"/>
    <text x="40" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">N</text>
  </svg>`,

  DISNEY_PLUS: `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" fill="#113CCF" rx="8"/>
    <text x="40" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">D+</text>
  </svg>`,

  AMAZON_PRIME: `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" fill="#00A8E1" rx="8"/>
    <text x="40" y="50" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">PV</text>
  </svg>`,

  HULU: `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" fill="#1CE783" rx="8"/>
    <text x="40" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">H</text>
  </svg>`,

  APPLE_TV_PLUS: `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" fill="#000000" rx="8"/>
    <text x="40" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">tv+</text>
  </svg>`,

  HBO_MAX: `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" fill="#7D2BFF" rx="8"/>
    <text x="40" y="50" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">HBO</text>
  </svg>`,

  PARAMOUNT_PLUS: `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" fill="#0064FF" rx="8"/>
    <text x="40" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">P+</text>
  </svg>`,

  PEACOCK: `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" fill="#000000" rx="8"/>
    <text x="40" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">P</text>
  </svg>`,

  MAX: `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" fill="#0024E6" rx="8"/>
    <text x="40" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">M</text>
  </svg>`
};

exports.handler = async (event) => {
  try {
    const { path, url, badge } = event.queryStringParameters || {};

    // Determine poster URL
    let posterUrl;
    if (url) {
      // Full URL provided (Fanart.tv or external)
      posterUrl = decodeURIComponent(url);
    } else if (path) {
      // TMDB path provided
      posterUrl = `https://image.tmdb.org/t/p${path}`;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing url or path parameter' })
      };
    }

    // Fetch original poster
    const response = await fetch(posterUrl);

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to fetch poster image' })
      };
    }

    const posterBuffer = await response.buffer();

    // If no badge, just return the original poster
    if (!badge || !BADGE_SVGS[badge]) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
        },
        body: posterBuffer.toString('base64'),
        isBase64Encoded: true
      };
    }

    // Get poster dimensions
    const posterMetadata = await sharp(posterBuffer).metadata();
    const posterWidth = posterMetadata.width;
    const posterHeight = posterMetadata.height;

    // Calculate badge position (top-right corner with 10px margin)
    const badgeSize = Math.floor(posterWidth * 0.16); // 16% of poster width
    const badgeX = posterWidth - badgeSize - 10;
    const badgeY = 10;

    // Scale badge SVG to calculated size
    const scaledBadgeSvg = BADGE_SVGS[badge]
      .replace('width="80"', `width="${badgeSize}"`)
      .replace('height="80"', `height="${badgeSize}"`);

    const badgeBuffer = Buffer.from(scaledBadgeSvg);

    // Composite badge onto poster
    const outputBuffer = await sharp(posterBuffer)
      .composite([{
        input: badgeBuffer,
        top: badgeY,
        left: badgeX
      }])
      .jpeg({ quality: 90 })
      .toBuffer();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      },
      body: outputBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Poster overlay error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process poster image' })
    };
  }
};
