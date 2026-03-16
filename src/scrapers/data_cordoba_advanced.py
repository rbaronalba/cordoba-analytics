import asyncio
from playwright.async_api import async_playwright
import json

BASE_ROUND_URL = "https://www.sofascore.com/api/v1/unique-tournament/54/season/77558/events/round/{}"
STATS_URL = "https://www.sofascore.com/api/v1/event/{}/statistics"
CORDOBA_ID = 2850

async def fetch_url(page, url):
    response = await page.goto(url)
    try:
        return await response.json()
    except:
        return None

async def main():
    all_data = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        for round_num in range(1, 43):
            print(f"Jornada {round_num}...")
            data = await fetch_url(page, BASE_ROUND_URL.format(round_num))

            if not data or "events" not in data:
                print(f"  -> Temporada terminada en jornada {round_num - 1}")
                break

            for event in data["events"]:
                home_id = event["homeTeam"]["id"]
                away_id = event["awayTeam"]["id"]

                if home_id != CORDOBA_ID and away_id != CORDOBA_ID:
                    continue

                # Solo partidos finalizados
                if event.get("status", {}).get("type") != "finished":
                    continue

                match_id = event["id"]
                home = event["homeTeam"]["name"]
                away = event["awayTeam"]["name"]
                print(f"  Sacando stats: {home} vs {away} (id:{match_id})")

                stats_data = await fetch_url(page, STATS_URL.format(match_id))
                await asyncio.sleep(1.5)

                all_data.append({
                    "event": event,
                    "statistics": stats_data
                })

            await asyncio.sleep(1.5)

        await browser.close()

    with open("../../data/raw/cordoba_25_26_con_stats.json", "w", encoding="utf-8") as f:
        json.dump({"matches": all_data}, f, indent=2, ensure_ascii=False)

    print(f"\nTotal partidos con estadísticas: {len(all_data)}")

asyncio.run(main())