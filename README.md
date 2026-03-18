# Córdoba CF — Dashboard de Análisis de Temporada

Dashboard de analítica deportiva para el seguimiento del Córdoba CF en LaLiga Hypermotion (Segunda División), construido con datos reales de la liga y actualizado jornada a jornada.

---

## Qué hace

- **Simulación Monte Carlo** — 100.000 simulaciones de los partidos restantes para estimar la distribución de puntos finales y la probabilidad de cada escenario (ascenso directo, playoff, zona media, descenso).
- **Modelo Poisson por partido** — probabilidades de victoria, empate y derrota para cada rival del calendario restante, basadas en xG y xGA de temporada con regularización bayesiana.
- **Análisis de rendimiento** — métricas avanzadas (xG, xGA, grandes ocasiones, posesión, tiros) comparadas con la media de la liga y desglosadas por tramos de temporada y localía.
- **Correlación con resultados** — análisis sobre 600+ registros reales de Segunda División para identificar los indicadores que mejor predicen los puntos obtenidos.

---

## Metodología del modelo

- Fuerzas ofensiva y defensiva de cada equipo derivadas de xG y xGA, normalizadas respecto a la media de liga.
- Regularización bayesiana con factor `pj / (pj + 10)` para reducir el ruido en muestras pequeñas.
- Ventaja de campo calibrada automáticamente con los xG reales de todos los partidos de la temporada en curso.
- Umbrales de ascenso, playoff y salvación calculados como medias históricas de las últimas 17 temporadas de Segunda División.

---

## Stack tecnológico

- **Python** — scraping (Playwright), procesado de datos (Pandas) y pipeline de actualización
- **JavaScript** — modelo Poisson, simulación Monte Carlo y visualización en el navegador (sin dependencias externas)
- **Sofascore API** — fuente de datos de partidos, estadísticas avanzadas y clasificación

---

## Estructura del proyecto

```
dashboard/          Frontend — HTML, CSS y JS del dashboard
src/
  scrapers/         Scripts de extracción de datos de Sofascore
  pipeline/         Pipeline de actualización del dashboard
data/
  raw/              Datos en crudo descargados de la API
  processed/        JSONs procesados listos para el dashboard
```

---

## Actualización

Tras cada jornada, el pipeline sigue este orden:

1. `src/scrapers/data_segunda_advanced.py` — scraping de estadísticas avanzadas
2. `notebooks/process_dashboard_data.ipynb` — procesado y generación de JSONs
3. `src/pipeline/update_dashboard.py` — inyección de datos en el dashboard

---

## Limitaciones conocidas

- El modelo asume independencia de goles entre ambos equipos (distribución de Poisson estándar).
- Las fuerzas ofensiva y defensiva se calculan sobre el total de temporada, sin split por localía a nivel individual de equipo.
- Los umbrales de clasificación son medias históricas, no proyecciones de los rivales directos.
