"""
update_dashboard.py
Inyecta DATOS_EMBEBIDOS, HISTORICO_EMBEBIDO y CALENDARIO_EMBEBIDO en js/data.js.
Ejecutar después de actualizar datos_dashboard.json (tras correr analisis_segunda.ipynb).
"""
import json
import re

JSON_FILE      = "../../data/processed/datos_dashboard.json"
HISTORICO_FILE = "../../data/processed/historico_cortes.json"
CALENDARIO_FILE= "../../data/processed/calendario_restante.json"
HTML_FILE      = "../../dashboard/js/data.js"

with open(JSON_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

with open(HISTORICO_FILE, "r", encoding="utf-8") as f:
    historico = json.load(f)

with open(CALENDARIO_FILE, "r", encoding="utf-8") as f:
    calendario = json.load(f)

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

# Inyectar calendario de partidos restantes
cal_minified = json.dumps(calendario, ensure_ascii=False, separators=(",", ":"))
html, n3 = re.subn(
    r"var CALENDARIO_EMBEBIDO = ?\{.*?\};",
    "var CALENDARIO_EMBEBIDO = " + cal_minified + ";",
    html, count=1, flags=re.DOTALL,
)

if n1 == 0:
    print("ERROR: No se encontró DATOS_EMBEBIDOS en el HTML.")
elif n2 == 0:
    print("ERROR: No se encontró HISTORICO_EMBEBIDO en el HTML.")
elif n3 == 0:
    print("ERROR: No se encontró CALENDARIO_EMBEBIDO en el HTML.")
else:
    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(html)
    thr2 = round(historico["media_pos2_ascenso_directo"])
    thr6 = round(historico["media_pos6_playoff"])
    n_pending = calendario["total_pending"]
    print(f"OK — js/data.js actualizado a J{data['CORDOBA']['partidos']} ({data['CORDOBA']['pts_total']} pts)")
    print(f"     Umbrales históricos: ascenso ≥{thr2} pts | playoff ≥{thr6} pts ({historico['seasons_used']} temporadas)")
    print(f"     Calendario: {n_pending} partidos restantes inyectados")
