"""
update_dashboard.py
Inyecta DATOS_EMBEBIDOS, HISTORICO_EMBEBIDO y CALENDARIO_EMBEBIDO en js/data.js.
Ejecutar después de actualizar dashboard_data.json (tras correr process_dashboard_data.ipynb).
"""
import json
import re

JSON_FILE          = "../../data/processed/dashboard_data.json"
HISTORICO_FILE     = "../../data/processed/historical_thresholds.json"
CALENDARIO_FILE    = "../../data/processed/remaining_fixtures.json"
CALENDARIO_ALL_FILE= "../../data/processed/remaining_fixtures_all.json"
STATS_FILE         = "../../data/raw/segunda_division_stats.json"
HTML_FILE          = "../../dashboard/js/data.js"

with open(JSON_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

with open(HISTORICO_FILE, "r", encoding="utf-8") as f:
    historico = json.load(f)

with open(CALENDARIO_FILE, "r", encoding="utf-8") as f:
    calendario = json.load(f)

try:
    with open(CALENDARIO_ALL_FILE, "r", encoding="utf-8") as f:
        calendario_all = json.load(f)
except FileNotFoundError:
    calendario_all = {"teams": {}}
    print("AVISO: remaining_fixtures_all.json no encontrado. Ejecuta data_remaining_all.py primero.")

with open(STATS_FILE, "r", encoding="utf-8") as f:
    stats_raw = json.load(f)

# Calcular HOME_ADV real desde xG local/visitante de todos los partidos de la temporada
xg_home_total = 0.0
xg_away_total = 0.0
for match in stats_raw.get("matches", []):
    for period_block in match.get("statistics", {}).get("statistics", []):
        if period_block.get("period") != "ALL":
            continue
        for group in period_block.get("groups", []):
            for item in group.get("statisticsItems", []):
                if item.get("key") == "expectedGoals":
                    xg_home_total += item.get("homeValue", 0) or 0
                    xg_away_total += item.get("awayValue", 0) or 0

xg_total = xg_home_total + xg_away_total
home_adv = round(2 * xg_home_total / xg_total, 4) if xg_total > 0 else 1.08
historico["home_adv"] = home_adv

# Extraer todos los resultados jugados de la liga (para desempate H2H)
partidos_liga = []
for match in stats_raw.get("matches", []):
    ev = match.get("event", {})
    if ev.get("status", {}).get("type") != "finished":
        continue
    home = ev.get("homeTeam", {}).get("name", "")
    away = ev.get("awayTeam", {}).get("name", "")
    gh = (ev.get("homeScore") or {}).get("current")
    ga = (ev.get("awayScore") or {}).get("current")
    if home and away and gh is not None and ga is not None:
        partidos_liga.append({"h": home, "a": away, "gh": gh, "ga": ga})

with open(HTML_FILE, "r", encoding="utf-8") as f:
    html = f.read()

# Inyectar datos de temporada
minified = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
html, n1 = re.subn(
    r"var DATOS_EMBEBIDOS = ?\{.*?\};",
    "var DATOS_EMBEBIDOS = " + minified + ";",
    html, count=1, flags=re.DOTALL,
)

# Inyectar histórico de cortes (umbrales Monte Carlo)
hist_minified = json.dumps(historico, ensure_ascii=False, separators=(",", ":"))
html, n2 = re.subn(
    r"var HISTORICO_EMBEBIDO = ?\{.*?\};",
    "var HISTORICO_EMBEBIDO = " + hist_minified + ";",
    html, count=1, flags=re.DOTALL,
)

# Limpiar del calendario las jornadas ya jugadas
played_rounds = {p["j"] for p in data["PARTIDOS"]}
pending = [p for p in calendario["partidos"] if p["round"] not in played_rounds]
calendario["partidos"] = pending
calendario["total_pending"] = len(pending)

# Inyectar calendario de partidos restantes (Córdoba)
cal_minified = json.dumps(calendario, ensure_ascii=False, separators=(",", ":"))
html, n3 = re.subn(
    r"var CALENDARIO_EMBEBIDO = ?\{.*?\};",
    "var CALENDARIO_EMBEBIDO = " + cal_minified + ";",
    html, count=1, flags=re.DOTALL,
)

# Filtrar jornadas ya jugadas del calendario de todos los equipos
played_rounds_set = {p["j"] for p in data["PARTIDOS"]}
for team_name, fixtures in calendario_all.get("teams", {}).items():
    calendario_all["teams"][team_name] = [
        f for f in fixtures if f["round"] not in played_rounds_set
    ]

# Inyectar calendario de todos los equipos
cal_all_minified = json.dumps(calendario_all.get("teams", {}), ensure_ascii=False, separators=(",", ":"))
html, n4 = re.subn(
    r"var CALENDARIO_LIGA_EMBEBIDO = ?\{.*?\};",
    "var CALENDARIO_LIGA_EMBEBIDO = " + cal_all_minified + ";",
    html, count=1, flags=re.DOTALL,
)

# Inyectar resultados jugados de la liga (para desempate H2H)
partidos_liga_minified = json.dumps(partidos_liga, ensure_ascii=False, separators=(",", ":"))
html, n5 = re.subn(
    r"var PARTIDOS_LIGA_EMBEBIDO = ?\[.*?\];",
    "var PARTIDOS_LIGA_EMBEBIDO = " + partidos_liga_minified + ";",
    html, count=1, flags=re.DOTALL,
)

if n1 == 0:
    print("ERROR: No se encontró DATOS_EMBEBIDOS en el HTML.")
elif n2 == 0:
    print("ERROR: No se encontró HISTORICO_EMBEBIDO en el HTML.")
elif n3 == 0:
    print("ERROR: No se encontró CALENDARIO_EMBEBIDO en el HTML.")
elif n4 == 0:
    print("ERROR: No se encontró CALENDARIO_LIGA_EMBEBIDO en el HTML.")
elif n5 == 0:
    print("ERROR: No se encontró PARTIDOS_LIGA_EMBEBIDO en el HTML.")
else:
    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(html)
    thr2 = round(historico["media_pos2_ascenso_directo"])
    thr6 = round(historico["media_pos6_playoff"])
    n_pending = calendario["total_pending"]
    print(f"OK — js/data.js actualizado a J{data['CORDOBA']['partidos']} ({data['CORDOBA']['pts_total']} pts)")
    print(f"     Umbrales históricos: ascenso ≥{thr2} pts | playoff ≥{thr6} pts ({historico['seasons_used']} temporadas)")
    print(f"     Home advantage calibrado: {home_adv} (xG local/visitante, {stats_raw.get('total_matches',0)} partidos)")
    print(f"     Calendario Córdoba: {n_pending} partidos restantes inyectados")
    n_teams_all = len(calendario_all.get("teams", {}))
    print(f"     Calendario liga: {n_teams_all} equipos inyectados")
    print(f"     Partidos liga (H2H): {len(partidos_liga)} resultados inyectados")
