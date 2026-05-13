/**
 * Utilitários de geolocalização para o cliente.
 *
 * As coordenadas (`latitude`, `longitude`) de Feirante e Usuário são
 * preenchidas no back-end via geocoding (ver `api/lib/geocode.ts`).
 * Aqui no front nós só leemos esses valores e calculamos distância
 * pra decidir se um feirante atende um cliente.
 */

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

/**
 * Distância em quilômetros entre dois pontos pela fórmula de Haversine.
 * Robusto a coordenadas válidas; chamadores devem garantir que ambos
 * têm `latitude` e `longitude` definidos antes de chamar.
 */
export function distanciaKm(a: Coordenadas, b: Coordenadas): number {
  const R = 6371; // raio médio da Terra em km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Verifica se um feirante atende um cliente baseado em:
 *   - feirante.entrega_ativa
 *   - feirante.raio_entrega_km
 *   - distância Haversine entre feirante e cliente
 *
 * Regras de tolerância (importante p/ não esconder demais):
 *   - Cliente sem coordenadas (não logado / endereço sem geocoding): **mostra tudo**.
 *   - Feirante sem coordenadas (endereço não geocodificado): **mostra** (admin pode reeditar depois).
 *   - Feirante com `entrega_ativa === false`: **esconde**.
 *   - Sem `raio_entrega_km` ou 0: assume 10 km como padrão.
 *   - Distância > raio: **esconde**.
 */
export function feiranteAtendeCliente(
  feirante: {
    latitude?: number | null;
    longitude?: number | null;
    raio_entrega_km?: number | null;
    entrega_ativa?: boolean | null;
  } | null | undefined,
  cliente: { latitude?: number | null; longitude?: number | null } | null | undefined
): boolean {
  if (!feirante) return false;
  if (feirante.entrega_ativa === false) return false;

  // Sem coordenadas em qualquer lado → não dá pra filtrar, mostra por segurança
  if (
    feirante.latitude == null ||
    feirante.longitude == null ||
    !cliente ||
    cliente.latitude == null ||
    cliente.longitude == null
  ) {
    return true;
  }

  const raio =
    feirante.raio_entrega_km != null && feirante.raio_entrega_km > 0
      ? Number(feirante.raio_entrega_km)
      : 10;

  const dist = distanciaKm(
    { latitude: Number(feirante.latitude), longitude: Number(feirante.longitude) },
    { latitude: Number(cliente.latitude), longitude: Number(cliente.longitude) }
  );

  return dist <= raio;
}

/**
 * Útil quando você quer mostrar a distância numa tela de detalhe.
 * Ex.: "A 2.3 km de você"
 */
export function formataDistancia(dist: number): string {
  if (!Number.isFinite(dist)) return "—";
  if (dist < 1) return `${Math.round(dist * 1000)} m`;
  return `${dist.toFixed(1)} km`;
}
