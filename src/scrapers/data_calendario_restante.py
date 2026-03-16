"""
data_calendario_restante.py
===========================
Obtiene los partidos PENDIENTES del Córdoba en la temporada 25/26
desde la API pública de Sofascore.

Prueba varios endpoints hasta encontrar el que funciona:
  1. /api/v1/team/{team_id}/events/next/{page}
  2. /api/v1/unique-tournament/54/season/77558/events/round/{n} (jornadas restantes)

Salida:
  ../../data/processed/calendario_restante.json
  → lista de partidos pendientes: jornada, rival, local/visitante, fecha

DEPENDENCIAS
-------------
  pip install playwright
  playwright install chromium
"""

import asyncio
import json
from playwright.async_api import async_playwright

CORDOBA_ID    = 2850
TOURNAMENT_ID = 54
SEASON_ID     = 77558
TOTAL_ROUNDS  = 42
THROTTLE      = 0.8

NEXT_EVENTS_URL  = f"https://www.sofascore.com/api/v1/team/{CORDOBA_ID}/events/next/{{page}}"
ROUND_URL        = f"https://www.sofascore.com/api/v1/unique-tournament/{TOURNAMENT_ID}/season/{SEASON_ID}/events/round/{{round_num}}"

OUTPUT = "../../data/processed/calendario_restante.json"


async def fetch_json(page, url: str):
    try:
        response = await page.goto(url)
        if response is None:
            return None
        return await response.json()
    except Exception as e:
        print(f"  [WARN] {url}: {e}")
        return None


async def main():
    pending = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page    = await browser.new_page()

        # ── Estrategia 1: endpoint next events del equipo ─────────────────────
        print("=== Estrategia 1: /team/{id}/events/next ===")
        found_via_next = False
        for pg in range(0, 3):  # máximo 3 páginas
            url  = NEXT_EVENTS_URL.format(page=pg)
            data = await fetch_json(page, url)
            await asyncio.sleep(THROTTLE)

            if not data or "events" not in data:
                print(f"  Página {pg}: sin datos")
                break

            events = data["events"]
            print(f"  Página {pg}: {len(events)} eventos")

            for ev in events:
                # Filtrar solo eventos de la liga (tournament_id=54) y temporada actual
                tournament = ev.get("tournament", {}).get("uniqueTournament", {})
                season     = ev.get("season", {})
                if tournament.get("id") != TOURNAMENT_ID:
                    continue
                if season.get("id") != SEASON_ID:
                    continue

                home_id   = ev["homeTeam"]["id"]
                away_id   = ev["awayTeam"]["id"]
                is_home   = home_id == CORDOBA_ID

                rival_team = ev["awayTeam"] if is_home else ev["homeTeam"]
                rival_name = rival_team["name"]
                round_num  = ev.get("roundInfo", {}).get("round")
                ts         = ev.get("startTimestamp")

                entry = {
                    "match_id": ev["id"],
                    "round":    round_num,
                    "rival":    rival_name,
                    "local":    "L" if is_home else "V",
                    "timestamp": ts,
                }
                pending.append(entry)
                loc_str = "LOCAL" if is_home else "VISITANTE"
                print(f"  J{round_num:02d} | {rival_name} | {loc_str}")
                found_via_next = True

            # Si no hay hasNextPage o ya no es de la liga, parar
            if not data.get("hasNextPage", False):
                break

        # ── Estrategia 2: recorrer jornadas si la 1 no funcionó ──────────────
        if not found_via_next or not pending:
            print("\n=== Estrategia 2: recorrer jornadas pendientes por round ===")
            pending = []

            for round_num in range(1, TOTAL_ROUNDS + 1):
                url  = ROUND_URL.format(round_num=round_num)
                data = await fetch_json(page, url)
                await asyncio.sleep(THROTTLE)

                if not data or "events" not in data:
                    print(f"  J{round_num}: sin datos → fin de temporada")
                    break

                for ev in data["events"]:
                    home_id = ev["homeTeam"]["id"]
                    away_id = ev["awayTeam"]["id"]

                    if home_id != CORDOBA_ID and away_id != CORDOBA_ID:
                        continue

                    status = ev.get("status", {}).get("type", "")
                    if status == "finished":
                        continue  # ya jugado

                    is_home   = home_id == CORDOBA_ID
                    rival_team = ev["awayTeam"] if is_home else ev["homeTeam"]
                    rival_name = rival_team["name"]
                    ts         = ev.get("startTimestamp")

                    entry = {
                        "match_id": ev["id"],
                        "round":    round_num,
                        "rival":    rival_name,
                        "local":    "L" if is_home else "V",
                        "timestamp": ts,
                    }
                    pending.append(entry)
                    loc_str = "LOCAL" if is_home else "VISITANTE"
                    print(f"  J{round_num:02d} | {rival_name} | {loc_str}")

        await browser.close()

    # ── Resultado ─────────────────────────────────────────────────────────────
    pending.sort(key=lambda x: x["round"] or 99)

    print(f"\n{'='*50}")
    print(f"PARTIDOS PENDIENTES: {len(pending)}")
    print(f"{'='*50}")
    for m in pending:
        loc_str = "LOCAL" if m["local"] == "L" else "VISITANTE"
        print(f"  J{m['round']:02d} | {m['rival']:30s} | {loc_str}")

    output = {
        "team":           "Córdoba CF",
        "team_id":        CORDOBA_ID,
        "tournament_id":  TOURNAMENT_ID,
        "season_id":      SEASON_ID,
        "total_pending":  len(pending),
        "partidos":       pending,
    }
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Guardado: {OUTPUT}")


if __name__ == "__main__":
    asyncio.run(main())
