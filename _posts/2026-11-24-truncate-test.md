---
layout: post
title: "Discord Announcement Integration Test"
description: "A test article to verify automatic MinecraftPlanetEarth news announcements in Discord."
date: 2026-11-24 12:00:00 -0600
categories:
  - announcements
---

# Discord Integration Test

This is a test announcement for **MinecraftPlanetEarth**.

We're testing the new automated news publishing system. When a new article is published on the website, it should automatically appear in the designated Discord news channel.

## What We're Testing

The integration should:

- Detect newly published articles in the Jekyll `_posts` directory.
- Extract the article title and description.
- Include the article body in the Discord announcement.
- Preserve readable formatting, including headings and bullet points.
- Link back to the full article on the MinecraftPlanetEarth website.
- Truncate longer articles when they exceed Discord's embed character limit.

## About MinecraftPlanetEarth

MinecraftPlanetEarth is the original Minecraft Earth geopolitical server, established in 2013.

For over a decade, players have built towns, established nations, developed economies, formed alliances, and created their own history on a shared Earth map.

Our goal is to continue providing a world where players have the freedom to shape their own experience.

### Useful Links

- [Website](https://minecraftplanetearth.com/)
- [Live Map](https://map.minecraftplanetearth.com/)
- [Wiki](https://docs.minecraftplanetearth.com/)
- [Discord](https://discord.minecraftplanetearth.com/)
- [Server Store](https://shop.minecraftplanetearth.com/)

## Expected Result

After this article is committed and pushed to the `main` branch, GitHub Actions should detect it, wait for GitHub Pages to publish it, and send an announcement to Discord.

**If you're reading this in Discord, the integration is working!**

This is only a test article and can be deleted after verification.

---

*MinecraftPlanetEarth · The Original Minecraft Earth Server · Est. 2013*