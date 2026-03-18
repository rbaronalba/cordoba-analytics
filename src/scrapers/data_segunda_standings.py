"""
data_historico_standings.py
===========================
Obtiene los puntos del 2º, 6º y 18º clasificado en Segunda División
de las últimas ~20 temporadas desde la API pública de Sofascore.

Flujo:
  1. GET /api/v1/unique-tournament/54/seasons
       → lista de todas las temporadas disponibles
  2. Para cada temporada de los últimos ~20 años:
       GET /api/v1/unique-tournament/54/season/{id}/standings/total
       → clasificación final → extrae pos 2, pos 6 y pos 18

Salida:
  ../../data/raw/historico_standings.json    <- raw completo
  ../../data/processed/historical_thresholds.json <- solo pos 2, 6 + medias

DEPENDENCIAS
-------------
  pip install playwright pandas
  playwright install chromium
"""

import asyncio
import json
import pandas as pd
from playwright.async_api import async_playwright

TOURNAMENT_ID   = 54          # LaLiga 2 / Segunda División
YEARS_BACK      = 20          # número de temporadas a recoger
THROTTLE        = 0.5         # segundos entre peticiones

SEASONS_URL     = f"https://www.sofascore.com/api/v1/unique-tournament/{TOURNAMENT_ID}/seasons"
STANDINGS_URL   = f"https://www.sofascore.com/api/v1/unique-tournament/{TOURNAMENT_ID}/season/{{}}/standings/total"

OUTPUT_RAW      = "../../data/raw/historico_standings.json"
OUTPUT_PROCESSED= "../../data/processed/historical_thresholds.json"


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
    all_seasons_data = []
    cortes = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page    = await browser.new_page()

        # ── 1. Obtener lista de temporadas ────────────────────────────────────
        print("Obteniendo lista de temporadas...")
        seasons_data = await fetch_json(page, SEASONS_URL)
        if not seasons_data or "seasons" not in seasons_data:
            print("ERROR: No se pudo obtener la lista de temporadas.")
            await browser.close()
            return

        seasons = seasons_data["seasons"]
        print(f"  Total temporadas disponibles: {len(seasons)}")

        # Ordenar por año descendente y coger las últimas YEARS_BACK
        # Las temporadas tienen formato {"id": ..., "name": "24/25", "year": 2024, ...}
        # Sofascore las devuelve normalmente de más reciente a más antigua
        # Excluir la temporada en curso (25/26) porque aún no ha terminado
        CURRENT_SEASON_ID = 77558
        seasons = [s for s in seasons if s["id"] != CURRENT_SEASON_ID]
        target_seasons = seasons[:YEARS_BACK]
        print(f"  Temporadas a procesar: {len(target_seasons)}")
        for s in target_seasons:
            print(f"    {s.get('name', '?')} (id:{s['id']})")

        # ── 2. Para cada temporada, descargar clasificación ───────────────────
        for season in target_seasons:
            season_id   = season["id"]
            season_name = season.get("name", str(season_id))
            season_year = season.get("year", "?")

            print(f"\n── Temporada {season_name} (id:{season_id}) ──────────────")
            url = STANDINGS_URL.format(season_id)
            data = await fetch_json(page, url)
            await asyncio.sleep(THROTTLE)

            if not data or "standings" not in data:
                print(f"  [WARN] Sin clasificación para {season_name}")
                continue

            # La respuesta tiene standings[0].rows → lista de equipos por posición
            standings_list = data["standings"]
            if not standings_list:
                print(f"  [WARN] standings vacío para {season_name}")
                continue

            rows = standings_list[0].get("rows", [])
            if not rows:
                print(f"  [WARN] rows vacío para {season_name}")
                continue

            # Guardar raw completo de esta temporada
            all_seasons_data.append({
                "season_id":   season_id,
                "season_name": season_name,
                "season_year": season_year,
                "rows":        rows,
            })

            # Extraer posición 2, 6 y 18 (1-indexed en el campo "position")
            # pos18 = último equipo que se salva del descenso (descienden pos 19-22)
            pts_2   = None
            pts_6   = None
            pts_18  = None
            team_2  = None
            team_6  = None
            team_18 = None

            for row in rows:
                pos  = row.get("position")
                pts  = row.get("points")
                team = row.get("team", {}).get("name", "?")
                if pos == 2:
                    pts_2   = pts
                    team_2  = team
                elif pos == 6:
                    pts_6   = pts
                    team_6  = team
                elif pos == 18:
                    pts_18  = pts
                    team_18 = team

            print(f"  2º:  {team_2}  — {pts_2} pts")
            print(f"  6º:  {team_6}  — {pts_6} pts")
            print(f"  18º: {team_18} — {pts_18} pts")

            cortes.append({
                "season_id":    season_id,
                "season_name":  season_name,
                "season_year":  season_year,
                "pos2_team":    team_2,
                "pos2_pts":     pts_2,
                "pos6_team":    team_6,
                "pos6_pts":     pts_6,
                "pos18_team":   team_18,
                "pos18_pts":    pts_18,
            })

        await browser.close()

    if not cortes:
        print("\nERROR: No se obtuvieron datos.")
        return

    # ── 3. Calcular medias ────────────────────────────────────────────────────
    df = pd.DataFrame(cortes)
    media_2  = round(float(df["pos2_pts"].dropna().mean()),  1)
    media_6  = round(float(df["pos6_pts"].dropna().mean()),  1)
    media_18 = round(float(df["pos18_pts"].dropna().mean()), 1)
    min_2    = int(df["pos2_pts"].dropna().min())
    max_2    = int(df["pos2_pts"].dropna().max())
    min_6    = int(df["pos6_pts"].dropna().min())
    max_6    = int(df["pos6_pts"].dropna().max())
    min_18   = int(df["pos18_pts"].dropna().min())
    max_18   = int(df["pos18_pts"].dropna().max())

    print("\n" + "=" * 50)
    print(f"RESULTADOS ({len(df)} temporadas)")
    print("=" * 50)
    print(f"  2º (ascenso directo):  media={media_2}   rango [{min_2}–{max_2}]")
    print(f"  6º (playoff):          media={media_6}   rango [{min_6}–{max_6}]")
    print(f"  18º (salvación):       media={media_18}  rango [{min_18}–{max_18}]")
    print("=" * 50)
    print(df[["season_name","pos2_team","pos2_pts","pos6_team","pos6_pts","pos18_team","pos18_pts"]].to_string(index=False))

    # ── 4. Guardar resultados ─────────────────────────────────────────────────
    with open(OUTPUT_RAW, "w", encoding="utf-8") as f:
        json.dump(all_seasons_data, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Raw guardado: {OUTPUT_RAW}")

    output = {
        "competition":   "Segunda División",
        "tournament_id": TOURNAMENT_ID,
        "seasons_used":  len(df),
        "media_pos2_ascenso_directo": media_2,
        "media_pos6_playoff":         media_6,
        "media_pos18_salvacion":      media_18,
        "min_pos2":  min_2,   "max_pos2":  max_2,
        "min_pos6":  min_6,   "max_pos6":  max_6,
        "min_pos18": min_18,  "max_pos18": max_18,
        "detalle": cortes,
    }
    with open(OUTPUT_PROCESSED, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"✓ Procesado guardado: {OUTPUT_PROCESSED}")


if __name__ == "__main__":
    asyncio.run(main())
