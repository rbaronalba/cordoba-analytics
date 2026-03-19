"""
data_segunda_advanced.py
========================
Scraper de estadísticas de LaLiga 2 (Segunda División) desde la API pública de Sofascore.

ESTRUCTURA DEL PARQUET RESULTANTE
-----------------------------------
Una fila por equipo por partido (2 filas por partido).
Columnas fijas:
  match_id, season_id, season_name, round, start_timestamp,
  team_id, team_name, is_home,
  home_team_id, away_team_id,
  goals_for, goals_against, winner_code, status_type

Columnas de estadísticas (por cada stat y período):
  {key}_{period}          → valor numérico (homeValue o awayValue)
  {key}_total_{period}    → denominador (homeTotal o awayTotal), solo para valueType="team"

Períodos: ALL, 1ST, 2ND

Ejemplo de columnas generadas:
  ballPossession_ALL, ballPossession_1ST, ballPossession_2ND
  expectedGoals_ALL, expectedGoals_1ST, expectedGoals_2ND
  accurateLongBalls_ALL, accurateLongBalls_total_ALL
  accurateLongBalls_1ST, accurateLongBalls_total_1ST
  ...

DEPENDENCIAS
-------------
  pip install playwright pandas pyarrow
  playwright install chromium
"""

import asyncio
import json
import pandas as pd
from playwright.async_api import async_playwright

# Configuración

TOURNAMENT_ID  = 54       # LaLiga 2
SEASON_ID      = 77558    # Temporada 25/26
TOTAL_ROUNDS   = 42       # Número máximo de jornadas a intentar

BASE_ROUND_URL = (
    "https://www.sofascore.com/api/v1/unique-tournament/"
    f"{TOURNAMENT_ID}/season/{SEASON_ID}/events/round/{{}}"
)
STATS_URL = "https://www.sofascore.com/api/v1/event/{}/statistics"

THROTTLE_STATS   = 0.5    # segundos entre petición de stats de cada partido
THROTTLE_ROUND   = 0.5    # segundos entre jornadas completas

OUTPUT_JSON    = "../../data/raw/segunda_division_stats.json"
OUTPUT_PARQUET = "../../data/processed/segunda_division_stats.parquet"

# Períodos que queremos extraer y el sufijo que llevarán en el parquet
PERIODS = ["ALL", "1ST", "2ND"]

# Helpers de red

async def fetch_json(page, url: str):
    """
    Navega a una URL de la API y devuelve el JSON parseado.
    Devuelve None si la petición falla o la respuesta no es JSON válido.
    """
    try:
        response = await page.goto(url)
        if response is None:
            return None
        return await response.json()
    except Exception as e:
        print(f"    [WARN] Error fetch {url}: {e}")
        return None


# Extracción de estadísticas

def extract_stats_for_team(stats_block: list, is_home: bool) -> dict:
    """
    Dado el bloque 'statistics' completo de un partido (lista de períodos),
    extrae para UN equipo (local o visitante) todas las métricas disponibles
    en todos los períodos, añadiendo el sufijo de período a cada clave.

    Parámetros
    ----------
    stats_block : list
        Lista de dicts con estructura:
          [{"period": "ALL", "groups": [...]}, {"period": "1ST", ...}, ...]
    is_home : bool
        True si queremos las estadísticas del equipo local.

    Retorna
    -------
    dict con claves del tipo:
        ballPossession_ALL         → valor numérico
        accurateLongBalls_ALL      → valor numérico (numerador)
        accurateLongBalls_total_ALL → valor numérico (denominador)
        ballPossession_1ST         → ...
        ...

    Notas
    -----
    - Si un período no existe en stats_block (p.ej. algunos partidos no tienen
      desglose por mitad), simplemente no se añaden esas columnas.
    - Si una métrica no existe en un período concreto, tampoco se añade
      (el parquet tendrá NaN para esa celda, lo cual es correcto).
    - Para valueType="team", se guarda el _total (denominador) en una columna
      separada con sufijo _total_{period}.
    """
    result = {}

    # Construir un índice rápido: period → lista de groups
    period_index = {}
    for period_block in stats_block:
        period = period_block.get("period", "").upper()
        if period in PERIODS:
            period_index[period] = period_block.get("groups", [])

    for period in PERIODS:
        groups = period_index.get(period)
        if groups is None:
            # Este período no existe para este partido — columnas ausentes (NaN)
            continue

        for group in groups:
            for item in group.get("statisticsItems", []):
                key    = item.get("key")
                if not key:
                    continue

                col_name = f"{key}_{period}"

                # Valor principal (homeValue o awayValue)
                value = item.get("homeValue") if is_home else item.get("awayValue")
                result[col_name] = value

                # Denominador para métricas de tipo ratio (valueType="team")
                # Ejemplos: accurateLongBalls (24/45), accurateCross (2/28)
                # homeTotal / awayTotal contienen el denominador real.
                # Sin esto es imposible calcular el porcentaje correcto.
                if item.get("valueType") == "team":
                    total = item.get("homeTotal") if is_home else item.get("awayTotal")
                    if total is not None:
                        result[f"{key}_total_{period}"] = total

    return result


# Scraper principal

async def main():
    all_matches  = []
    seen_match_ids = set()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page    = await browser.new_page()

        for round_num in range(1, TOTAL_ROUNDS + 1):

            print(f"\ Jornada {round_num}")
            round_data = await fetch_json(page, BASE_ROUND_URL.format(round_num))

            if not round_data or "events" not in round_data:
                print(f"  Sin datos. Temporada terminada en J{round_num - 1}.")
                break

            events = round_data["events"]
            finished = [e for e in events if e.get("status", {}).get("type") == "finished"]

            if not finished:
                print(f"  Sin partidos terminados en J{round_num}. Continuando...")
                await asyncio.sleep(THROTTLE_ROUND)
                continue

            for event in finished:
                match_id  = event["id"]
                home_name = event["homeTeam"]["name"]
                away_name = event["awayTeam"]["name"]

                if match_id in seen_match_ids:
                    print(f"  [SKIP] Ya procesado: {home_name} vs {away_name} (id:{match_id})")
                    continue
                seen_match_ids.add(match_id)

                print(f"  Descargando: {home_name} vs {away_name} (id:{match_id})")

                stats_data = await fetch_json(page, STATS_URL.format(match_id))
                await asyncio.sleep(THROTTLE_STATS)

                if not stats_data:
                    print(f"    [WARN] Sin stats para id:{match_id}")
                    continue

                all_matches.append({
                    "event":      event,
                    "statistics": stats_data
                })

            await asyncio.sleep(THROTTLE_ROUND)

        await browser.close()

    # Guardar JSON crudo (fuente de verdad)
    output_json = {
        "competition":    "Segunda División 25/26",
        "tournament_id":  TOURNAMENT_ID,
        "season_id":      SEASON_ID,
        "total_matches":  len(all_matches),
        "matches":        all_matches,
    }
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output_json, f, indent=2, ensure_ascii=False)
    print(f"\n✓ JSON guardado: {OUTPUT_JSON} ({len(all_matches)} partidos)")

    # Construir parquet
    rows = build_rows(all_matches)
    if not rows:
        print("ERROR: No se generaron filas. Revisar estructura del JSON.")
        return

    df = pd.DataFrame(rows)

    # Convertir timestamp a datetime UTC 
    if "start_timestamp" in df.columns:
        df["match_date"] = pd.to_datetime(df["start_timestamp"], unit="s", utc=True)

    df.to_parquet(OUTPUT_PARQUET, index=False)
    print(f"✓ Parquet guardado: {OUTPUT_PARQUET}")
    print(f"  Filas:    {len(df)}")
    print(f"  Columnas: {len(df.columns)}")
    print(f"  Equipos:  {df['team_name'].nunique()}")
    print(f"  Partidos: {df['match_id'].nunique()}")

    # Verificación rápida: columnas por período
    for period in PERIODS:
        cols_period = [c for c in df.columns if c.endswith(f"_{period}")]
        print(f"  Columnas _{period}: {len(cols_period)}")

    # Verificación: columnas _total (denominadores de ratios)
    total_cols = [c for c in df.columns if "_total_" in c]
    print(f"  Columnas _total_*: {len(total_cols)}")
    if total_cols:
        print(f"  Ejemplo _total: {total_cols[:5]}")


def build_rows(all_matches: list) -> list:
    """
    Construye la lista de filas del parquet a partir de los partidos scrapeados.
    Una fila por equipo por partido (2 filas por partido).
    """
    rows = []

    for match in all_matches:
        event      = match["event"]
        stats_raw  = match.get("statistics", {})
        stats_block = stats_raw.get("statistics")  # lista de períodos

        # Metadatos del evento
        match_id       = event["id"]
        round_num      = event.get("roundInfo", {}).get("round")
        start_ts       = event.get("startTimestamp")
        winner_code    = event.get("winnerCode")     # 1=home, 2=away, 3=draw
        status_type    = event.get("status", {}).get("type", "unknown")

        # Temporada
        season         = event.get("season", {})
        season_id      = season.get("id")
        season_name    = season.get("name")

        # Equipos
        home_team      = event["homeTeam"]
        away_team      = event["awayTeam"]
        home_team_id   = home_team["id"]
        away_team_id   = away_team["id"]
        home_team_name = home_team["name"]
        away_team_name = away_team["name"]

        # Marcador
        home_goals = event.get("homeScore", {}).get("current", 0)
        away_goals = event.get("awayScore", {}).get("current", 0)

        # Si no hay bloque de estadísticas, generamos igual la fila con los
        # metadatos para no perder el partido de la clasificación.
        stats_home = {}
        stats_away = {}
        if stats_block:
            stats_home = extract_stats_for_team(stats_block, is_home=True)
            stats_away = extract_stats_for_team(stats_block, is_home=False)
        else:
            print(f"  [WARN] Partido id:{match_id} sin bloque de estadísticas")

        # Fila equipo local
        row_home = {
            "match_id":      match_id,
            "season_id":     season_id,
            "season_name":   season_name,
            "round":         round_num,
            "start_timestamp": start_ts,
            "team_id":       home_team_id,
            "team_name":     home_team_name,
            "is_home":       True,
            "home_team_id":  home_team_id,
            "away_team_id":  away_team_id,
            "goals_for":     home_goals,
            "goals_against": away_goals,
            "winner_code":   winner_code,
            "status_type":   status_type,
            **stats_home,
        }

        # Fila equipo visitante
        row_away = {
            "match_id":      match_id,
            "season_id":     season_id,
            "season_name":   season_name,
            "round":         round_num,
            "start_timestamp": start_ts,
            "team_id":       away_team_id,
            "team_name":     away_team_name,
            "is_home":       False,
            "home_team_id":  home_team_id,
            "away_team_id":  away_team_id,
            "goals_for":     away_goals,
            "goals_against": home_goals,
            "winner_code":   winner_code,
            "status_type":   status_type,
            **stats_away,
        }

        rows.append(row_home)
        rows.append(row_away)

    return rows


if __name__ == "__main__":
    asyncio.run(main())