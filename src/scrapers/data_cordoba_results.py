import asyncio
from playwright.async_api import async_playwright
import json

CORDOBA_ID = 2850
BASE_URL = "https://www.sofascore.com/api/v1/unique-tournament/54/season/77558/events/round/{}"

async def fetch_round(page, round_num):
    url = BASE_URL.format(round_num)
    response = await page.goto(url)
    try:
        return await response.json()
    except:
        return None

async def main():
    cordoba_events = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        for round_num in range(1, 43):  # Segunda tiene 42 jornadas
            print(f"Jornada {round_num}...")
            data = await fetch_round(page, round_num)

            if not data or "events" not in data:
                print(f"  -> Sin datos, temporada terminada en jornada {round_num - 1}")
                break

            for event in data["events"]:
                home_id = event["homeTeam"]["id"]
                away_id = event["awayTeam"]["id"]
                if home_id == CORDOBA_ID or away_id == CORDOBA_ID:
                    event["roundNumber"] = round_num  # añadir jornada al evento
                    cordoba_events.append(event)
                    home = event["homeTeam"]["name"]
                    away = event["awayTeam"]["name"]
                    print(f"  ✅ {home} vs {away}")

            await asyncio.sleep(1.5)  # throttling

        await browser.close()

    with open("../../data/raw/cordoba_25_26_completo.json", "w", encoding="utf-8") as f:
        json.dump({"events": cordoba_events}, f, indent=2, ensure_ascii=False)

    print(f"\nTotal partidos del Córdoba: {len(cordoba_events)}")

if __name__ == "__main__":
    asyncio.run(main())