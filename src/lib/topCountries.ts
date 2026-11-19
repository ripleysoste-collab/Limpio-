import type { SupportedLocale } from './i18n';

export interface CommerceCountryOption {
  code: string;
  flag: string;
  timezone: string;
  names: Record<SupportedLocale, string>;
}

/**
 * Top 50 high-commerce countries with their flag and primary IANA timezone.
 */
export const TOP_COMMERCE_COUNTRIES: CommerceCountryOption[] = [
  { code: 'US', flag: '🇺🇸', timezone: 'America/New_York', names: { es: 'Estados Unidos', en: 'United States', pt: 'Estados Unidos' } },
  { code: 'MX', flag: '🇲🇽', timezone: 'America/Mexico_City', names: { es: 'México', en: 'Mexico', pt: 'México' } },
  { code: 'CO', flag: '🇨🇴', timezone: 'America/Bogota', names: { es: 'Colombia', en: 'Colombia', pt: 'Colômbia' } },
  { code: 'ES', flag: '🇪🇸', timezone: 'Europe/Madrid', names: { es: 'España', en: 'Spain', pt: 'Espanha' } },
  { code: 'AR', flag: '🇦🇷', timezone: 'America/Argentina/Buenos_Aires', names: { es: 'Argentina', en: 'Argentina', pt: 'Argentina' } },
  { code: 'CL', flag: '🇨🇱', timezone: 'America/Santiago', names: { es: 'Chile', en: 'Chile', pt: 'Chile' } },
  { code: 'PE', flag: '🇵🇪', timezone: 'America/Lima', names: { es: 'Perú', en: 'Peru', pt: 'Peru' } },
  { code: 'BR', flag: '🇧🇷', timezone: 'America/Sao_Paulo', names: { es: 'Brasil', en: 'Brazil', pt: 'Brasil' } },
  { code: 'EC', flag: '🇪🇨', timezone: 'America/Guayaquil', names: { es: 'Ecuador', en: 'Ecuador', pt: 'Equador' } },
  { code: 'PA', flag: '🇵🇦', timezone: 'America/Panama', names: { es: 'Panamá', en: 'Panama', pt: 'Panamá' } },
  { code: 'CR', flag: '🇨🇷', timezone: 'America/Costa_Rica', names: { es: 'Costa Rica', en: 'Costa Rica', pt: 'Costa Rica' } },
  { code: 'DO', flag: '🇩🇴', timezone: 'America/Santo_Domingo', names: { es: 'Rep. Dominicana', en: 'Dominican Rep.', pt: 'Rep. Dominicana' } },
  { code: 'GT', flag: '🇬🇹', timezone: 'America/Guatemala', names: { es: 'Guatemala', en: 'Guatemala', pt: 'Guatemala' } },
  { code: 'UY', flag: '🇺🇾', timezone: 'America/Montevideo', names: { es: 'Uruguay', en: 'Uruguay', pt: 'Uruguai' } },
  { code: 'PY', flag: '🇵🇾', timezone: 'America/Asuncion', names: { es: 'Paraguay', en: 'Paraguay', pt: 'Paraguai' } },
  { code: 'BO', flag: '🇧🇴', timezone: 'America/La_Paz', names: { es: 'Bolivia', en: 'Bolivia', pt: 'Bolívia' } },
  { code: 'CA', flag: '🇨🇦', timezone: 'America/Toronto', names: { es: 'Canadá', en: 'Canada', pt: 'Canadá' } },
  { code: 'GB', flag: '🇬🇧', timezone: 'Europe/London', names: { es: 'Reino Unido', en: 'United Kingdom', pt: 'Reino Unido' } },
  { code: 'DE', flag: '🇩🇪', timezone: 'Europe/Berlin', names: { es: 'Alemania', en: 'Germany', pt: 'Alemanha' } },
  { code: 'FR', flag: '🇫🇷', timezone: 'Europe/Paris', names: { es: 'Francia', en: 'France', pt: 'França' } },
  { code: 'IT', flag: '🇮🇹', timezone: 'Europe/Rome', names: { es: 'Italia', en: 'Italy', pt: 'Itália' } },
  { code: 'PT', flag: '🇵🇹', timezone: 'Europe/Lisbon', names: { es: 'Portugal', en: 'Portugal', pt: 'Portugal' } },
  { code: 'NL', flag: '🇳🇱', timezone: 'Europe/Amsterdam', names: { es: 'Países Bajos', en: 'Netherlands', pt: 'Países Baixos' } },
  { code: 'CH', flag: '🇨🇭', timezone: 'Europe/Zurich', names: { es: 'Suiza', en: 'Switzerland', pt: 'Suíça' } },
  { code: 'BE', flag: '🇧🇪', timezone: 'Europe/Brussels', names: { es: 'Bélgica', en: 'Belgium', pt: 'Bélgica' } },
  { code: 'SE', flag: '🇸🇪', timezone: 'Europe/Stockholm', names: { es: 'Suecia', en: 'Sweden', pt: 'Suécia' } },
  { code: 'NO', flag: '🇳🇴', timezone: 'Europe/Oslo', names: { es: 'Noruega', en: 'Norway', pt: 'Noruega' } },
  { code: 'DK', flag: '🇩🇰', timezone: 'Europe/Copenhagen', names: { es: 'Dinamarca', en: 'Denmark', pt: 'Dinamarca' } },
  { code: 'PL', flag: '🇵🇱', timezone: 'Europe/Warsaw', names: { es: 'Polonia', en: 'Poland', pt: 'Polônia' } },
  { code: 'AT', flag: '🇦🇹', timezone: 'Europe/Vienna', names: { es: 'Austria', en: 'Austria', pt: 'Áustria' } },
  { code: 'IE', flag: '🇮🇪', timezone: 'Europe/Dublin', names: { es: 'Irlanda', en: 'Ireland', pt: 'Irlanda' } },
  { code: 'FI', flag: '🇫🇮', timezone: 'Europe/Helsinki', names: { es: 'Finlandia', en: 'Finland', pt: 'Finlândia' } },
  { code: 'CZ', flag: '🇨🇿', timezone: 'Europe/Prague', names: { es: 'Chequia', en: 'Czechia', pt: 'Tchéquia' } },
  { code: 'RO', flag: '🇷🇴', timezone: 'Europe/Bucharest', names: { es: 'Rumania', en: 'Romania', pt: 'Romênia' } },
  { code: 'GR', flag: '🇬🇷', timezone: 'Europe/Athens', names: { es: 'Grecia', en: 'Greece', pt: 'Grécia' } },
  { code: 'CN', flag: '🇨🇳', timezone: 'Asia/Shanghai', names: { es: 'China', en: 'China', pt: 'China' } },
  { code: 'JP', flag: '🇯🇵', timezone: 'Asia/Tokyo', names: { es: 'Japón', en: 'Japan', pt: 'Japão' } },
  { code: 'KR', flag: '🇰🇷', timezone: 'Asia/Seoul', names: { es: 'Corea del Sur', en: 'South Korea', pt: 'Coreia do Sul' } },
  { code: 'IN', flag: '🇮🇳', timezone: 'Asia/Kolkata', names: { es: 'India', en: 'India', pt: 'Índia' } },
  { code: 'SG', flag: '🇸🇬', timezone: 'Asia/Singapore', names: { es: 'Singapur', en: 'Singapore', pt: 'Singapura' } },
  { code: 'AE', flag: '🇦🇪', timezone: 'Asia/Dubai', names: { es: 'Emiratos Árabes', en: 'UAE', pt: 'Emirados Árabes' } },
  { code: 'SA', flag: '🇸🇦', timezone: 'Asia/Riyadh', names: { es: 'Arabia Saudita', en: 'Saudi Arabia', pt: 'Arábia Saudita' } },
  { code: 'IL', flag: '🇮🇱', timezone: 'Asia/Jerusalem', names: { es: 'Israel', en: 'Israel', pt: 'Israel' } },
  { code: 'TR', flag: '🇹🇷', timezone: 'Europe/Istanbul', names: { es: 'Turquía', en: 'Turkey', pt: 'Turquia' } },
  { code: 'AU', flag: '🇦🇺', timezone: 'Australia/Sydney', names: { es: 'Australia', en: 'Australia', pt: 'Austrália' } },
  { code: 'NZ', flag: '🇳🇿', timezone: 'Pacific/Auckland', names: { es: 'Nueva Zelanda', en: 'New Zealand', pt: 'Nova Zelândia' } },
  { code: 'ID', flag: '🇮🇩', timezone: 'Asia/Jakarta', names: { es: 'Indonesia', en: 'Indonesia', pt: 'Indonésia' } },
  { code: 'TH', flag: '🇹🇭', timezone: 'Asia/Bangkok', names: { es: 'Tailandia', en: 'Thailand', pt: 'Tailândia' } },
  { code: 'MY', flag: '🇲🇾', timezone: 'Asia/Kuala_Lumpur', names: { es: 'Malasia', en: 'Malaysia', pt: 'Malásia' } },
  { code: 'ZA', flag: '🇿🇦', timezone: 'Africa/Johannesburg', names: { es: 'Sudáfrica', en: 'South Africa', pt: 'África do Sul' } },
];
