"use client";

import { useMemo, useState } from "react";
import { targetHotel } from "@/data/hotels";
import {
  buildPriceRecommendation,
  defaultScenario,
  PricingScenario,
} from "@/lib/pricing";

const formatEuro = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

const occupancySteps = [0.58, 0.62, 0.66, 0.7, 0.74, 0.78, 0.82];

const demandLevels: Record<
  "low" | "stable" | "peak",
  { label: string; description: string; index: number }
> = {
  low: {
    label: "Basse",
    description: "Mois calme, réserver à l’avance",
    index: 0.9,
  },
  stable: {
    label: "Normale",
    description: "Demande régulière, aucun événement majeur",
    index: 1,
  },
  peak: {
    label: "Haute",
    description: "Événement ou forte pression sur l’offre",
    index: 1.12,
  },
};

const categoryLabels: Record<string, string> = {
  economy: "économique",
  midscale: "milieu de gamme",
  upscale: "haut de gamme",
  boutique: "boutique",
};

const resolveCategoryLabel = (category: string) =>
  categoryLabels[category] ?? category;

export default function Home() {
  const [scenario, setScenario] = useState<PricingScenario>(defaultScenario);

  const recommendation = useMemo(
    () => buildPriceRecommendation(scenario),
    [scenario],
  );

  const categoryBreakdown = useMemo(() => {
    const aggregation = new Map<
      string,
      { adr: number; count: number; occupancy: number }
    >();

    recommendation.referenceHotels.forEach((hotel) => {
      const current = aggregation.get(hotel.category) ?? {
        adr: 0,
        count: 0,
        occupancy: 0,
      };
      current.adr += hotel.averageDailyRate;
      current.count += 1;
      current.occupancy += hotel.occupancyRate;
      aggregation.set(hotel.category, current);
    });

    return Array.from(aggregation.entries()).map(([category, data]) => ({
      category,
      averageRate: data.adr / data.count,
      averageOccupancy: data.occupancy / data.count,
      count: data.count,
    }));
  }, [recommendation.referenceHotels]);

  const projections = useMemo(
    () =>
      occupancySteps.map((occupancy) => {
        const updated = buildPriceRecommendation({
          ...scenario,
          desiredOccupancy: occupancy,
        });

        return {
          occupancy,
          price: updated.recommendedPrice,
        };
      }),
    [scenario],
  );

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
              Pricing Intelligence
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl">
              Recommandation tarifaire — Hôtel Croix Baragnon
            </h1>
            <p className="mt-3 max-w-2xl text-balance text-slate-300">
              Comparaison en temps réel avec {recommendation.referenceHotels.length} hôtels
              concurrents situés dans un rayon d&apos;1 km, pondérée par la
              distance, la réputation et les niveaux de remplissage.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-200">
              Tarif cible
            </p>
            <p className="mt-2 text-4xl font-semibold text-white">
              {formatEuro(recommendation.recommendedPrice)}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Market index: {formatEuro(recommendation.weightedMarketAverage)}
            </p>
          </div>
        </header>

        <section className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/40">
              <h2 className="text-lg font-semibold text-white">
                Paramétrage du scénario
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Ajustez les leviers pour simuler vos objectifs de performance.
              </p>
              <div className="mt-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-200">
                      Taux d&apos;occupation visé
                    </label>
                    <span className="text-sm text-slate-300">
                      {formatPercent(scenario.desiredOccupancy)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={0.9}
                    step={0.01}
                    value={scenario.desiredOccupancy}
                    onChange={(event) =>
                      setScenario((prev) => ({
                        ...prev,
                        desiredOccupancy: parseFloat(event.target.value),
                      }))
                    }
                    className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-600 accent-blue-400"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Occupation actuelle: {formatPercent(targetHotel.occupancyRate)}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {(Object.keys(demandLevels) as Array<
                    keyof typeof demandLevels
                  >).map((key) => (
                    <button
                      key={key}
                      onClick={() =>
                        setScenario((prev) => ({
                          ...prev,
                          demandIndex: demandLevels[key].index,
                        }))
                      }
                      className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                        scenario.demandIndex === demandLevels[key].index
                          ? "border-blue-400/70 bg-blue-400/15 text-white"
                          : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20"
                      }`}
                    >
                      <p className="text-sm font-medium uppercase tracking-wider">
                        Demande {demandLevels[key].label}
                      </p>
                      <p className="mt-2 text-xs text-slate-300">
                        {demandLevels[key].description}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-200">
                      Prix plancher
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-lg font-semibold text-slate-100">
                        {formatEuro(scenario.floorPrice)}
                      </span>
                      <input
                        type="number"
                        min={70}
                        max={160}
                        value={scenario.floorPrice}
                        onChange={(event) =>
                          setScenario((prev) => ({
                            ...prev,
                            floorPrice: Number(event.target.value),
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-blue-400/70 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-200">
                      Prix plafond
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-lg font-semibold text-slate-100">
                        {formatEuro(scenario.ceilingPrice)}
                      </span>
                      <input
                        type="number"
                        min={scenario.floorPrice + 20}
                        max={230}
                        value={scenario.ceilingPrice}
                        onChange={(event) =>
                          setScenario((prev) => ({
                            ...prev,
                            ceilingPrice: Number(event.target.value),
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-blue-400/70 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Inclure l’hôtellerie upscale (4★)
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      Utile lorsque la clientèle mixe des options haut de
                      gamme.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setScenario((prev) => ({
                        ...prev,
                        includeUpscale: !prev.includeUpscale,
                      }))
                    }
                    aria-pressed={scenario.includeUpscale}
                    className={`flex h-9 w-16 items-center rounded-full border border-white/10 px-1 transition ${
                      scenario.includeUpscale
                        ? "justify-end bg-blue-500/80"
                        : "justify-start bg-white/10"
                    }`}
                  >
                    <span className="h-6 w-6 rounded-full bg-white" />
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/40">
              <h2 className="text-lg font-semibold text-white">Insights clés</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {recommendation.insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`rounded-2xl border p-4 ${
                      insight.impact === "positive"
                        ? "border-emerald-400/40 bg-emerald-400/10"
                        : insight.impact === "negative"
                          ? "border-rose-400/40 bg-rose-400/10"
                          : "border-white/10 bg-white/10"
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-wide text-white">
                      {insight.label}
                    </p>
                    <p className="mt-2 text-sm text-slate-200">{insight.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/40">
              <h2 className="text-lg font-semibold text-white">
                Projection par taux de remplissage
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Base comparative avec les mêmes paramètres (hors taux
                d’occupation).
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {projections.map((projection) => (
                  <div
                    key={projection.occupancy}
                    className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${
                      projection.occupancy === scenario.desiredOccupancy
                        ? "border-blue-400/70 bg-blue-400/15"
                        : ""
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-200">
                      {formatPercent(projection.occupancy)}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {formatEuro(projection.price)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Ajustement de {formatEuro(projection.price - recommendation.weightedMarketAverage)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/40">
              <h2 className="text-lg font-semibold text-white">
                Positionnement marché
              </h2>
              <div className="mt-5 grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Prix actuel Hôtel Croix Baragnon
                    </p>
                    <p className="text-xs text-slate-300">
                      Dernier relevé du {formatDate(targetHotel.lastUpdated)}
                    </p>
                  </div>
                  <p className="text-2xl font-semibold text-white">
                    {formatEuro(targetHotel.averageDailyRate)}
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Écart vs. recommandation
                    </p>
                    <p className="text-xs text-slate-300">
                      Ajustement à appliquer pour atteindre l’objectif.
                    </p>
                  </div>
                  <p className="text-2xl font-semibold text-white">
                    {formatEuro(
                      recommendation.recommendedPrice - targetHotel.averageDailyRate,
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/40">
              <h2 className="text-lg font-semibold text-white">
                Concurrence directe ({recommendation.referenceHotels.length})
              </h2>
              <div className="mt-4 space-y-4">
                {recommendation.referenceHotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {hotel.name}
                        </p>
                        <p className="text-xs text-slate-300">
                          {hotel.address} • {hotel.starRating.toFixed(1)}★ •{" "}
                          {formatPercent(hotel.occupancyRate)} d&apos;occupation
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white">
                          {formatEuro(hotel.averageDailyRate)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {Math.round(hotel.distanceMeters)} m
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                      <span>Note clients {hotel.reviewScore.toFixed(1)}/5</span>
                      <span>{resolveCategoryLabel(hotel.category)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/40">
              <h2 className="text-lg font-semibold text-white">
                Mix tarifaire par segment
              </h2>
              <div className="mt-4 space-y-3">
                {categoryBreakdown.map((entry) => (
                  <div
                    key={entry.category}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        Segmentation {resolveCategoryLabel(entry.category)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {entry.count} établissements
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        {formatEuro(entry.averageRate)}
                      </p>
                      <p className="text-xs text-slate-400">
                        OCC {formatPercent(entry.averageOccupancy)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
