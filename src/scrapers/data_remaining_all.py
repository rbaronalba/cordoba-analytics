"""
data_remaining_all.py
=====================
Obtiene los partidos restantes de TODOS los equipos de la temporada 25/26
de Segunda División desde la API pública de Sofascore.

Flujo:
  1. Para cada jornada 1-42:
       GET /api/v1/unique-tournament/54/season/77558/events/round/{round}
       → lista de partidos de esa jornada
  2. Filtra los partidos con status "notstarted" (no jugados aún)
  3. Construye un dict por equipo con sus partidos restantes

Salida:
  ../../data/processed/remaining_fixtures_all.json

DEPENDENCIAS
-------------
  pip install playwright
  playwright install chromium
"""

import asyncio
import json
from playwright.async_api import async_playwright

TOURNAMENT_ID = 54
SEASON_ID     = 77558
TOTAL_ROUNDS  = 42
THROTTLE      = 0.3  # segundos entre peticiones

BASE_ROUND_URL = (
    f"https://www.sofascore.com/api/v1/unique-tournament/"
    f"{TOURNAMENT_ID}/season/{SEASON_ID}/events/round/{{}}"
)

OUTPUT_FILE = "../../data/processed/remaining_fixtures_all.json"


async def fetch_json(page, url: str):
    try:
        response = await page.goto(url)
        if response is None:
            return None
        return await response.json()
    except Exception as e:
        print(f"  [WARN] Error fetch {url}: {e}")
        return None


async def main():
    # Dict: team_name -> list of {round, rival, local}
    teams_fixtures: dict[str, list] = {}
    played_rounds = []
    pending_rounds = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        for rnd in range(1, TOTAL_ROUNDS + 1):
            url = BASE_ROUND_URL.format(rnd)
            data = await fetch_json(page, url)
            await asyncio.sleep(THROTTLE)

            if not data or "events" not in data:
                print(f"  J{rnd}: sin datos")
                continue

            events = data["events"]
            finished_in_round = 0
            pending_in_round = 0

            for ev in events:
                status = ev.get("status", {}).get("type", "")
                home_name = ev.get("homeTeam", {}).get("name", "")
                away_name = ev.get("awayTeam", {}).get("name", "")

                if status == "finished":
                    finished_in_round += 1
                elif status in ("notstarted", "postponed"):
                    pending_in_round += 1
                    # Partido restante para el equipo local
                    if home_name not in teams_fixtures:
                        teams_fixtures[home_name] = []
                    teams_fixtures[home_name].append({
                        "round": rnd,
                        "rival": away_name,
                        "local": "L"
                    })
                    # Partido restante para el equipo visitante
                    if away_name not in teams_fixtures:
                        teams_fixtures[away_name] = []
                    teams_fixtures[away_name].append({
                        "round": rnd,
                        "rival": home_name,
                        "local": "V"
                    })

            # Clasificar la jornada (si todos los partidos están terminados -> jugada)
            total = len(events)
            if finished_in_round == total and total > 0:
                played_rounds.append(rnd)
            elif pending_in_round > 0:
                pending_rounds.append(rnd)

            print(f"  J{rnd}: {finished_in_round} terminados, {pending_in_round} pendientes")

        await browser.close()

    if not teams_fixtures:
        print("ERROR: No se obtuvieron fixtures.")
        return

    # Ordenar partidos de cada equipo por jornada
    for name in teams_fixtures:
        teams_fixtures[name].sort(key=lambda x: x["round"])

    n_teams = len(teams_fixtures)
    n_pending = sum(len(v) for v in teams_fixtures.values()) // 2  # cada partido cuenta 2 veces

    output = {
        "season_id":      SEASON_ID,
        "tournament_id":  TOURNAMENT_ID,
        "total_rounds":   TOTAL_ROUNDS,
        "played_rounds":  played_rounds,
        "pending_rounds": pending_rounds,
        "teams":          teams_fixtures,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nOK — {OUTPUT_FILE}")
    print(f"     {n_teams} equipos | {n_pending} partidos pendientes por disputar")
    print(f"     Jornadas jugadas: {played_rounds}")
    print(f"     Jornadas pendientes: {pending_rounds}")


if __name__ == "__main__":
    asyncio.run(main())
