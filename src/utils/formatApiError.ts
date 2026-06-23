/**
 * FastAPI renvoie souvent `detail` comme string, ou comme tableau d'objets
 * `{type, loc, msg, input}` (erreurs de validation 422). Ne jamais les rendre
 * tels quels dans <Text> (React: "Objects are not valid as a React child").
 */
export function formatApiErrorDetail(detail: unknown): string {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as {msg?: string}).msg ?? '');
        }
        try {
          return JSON.stringify(item);
        } catch {
          return String(item);
        }
      })
      .filter(Boolean)
      .join(' ');
  }
  if (typeof detail === 'object' && detail !== null && 'msg' in detail) {
    return String((detail as {msg: unknown}).msg);
  }
  try {
    return JSON.stringify(detail);
  } catch {
    return 'Erreur';
  }
}

/** Message utilisateur à partir d'une erreur axios / fetch typique */
export function formatAxiosError(
  e: unknown,
  fallback = 'Une erreur est survenue',
): string {
  const err = e as {
    response?: {data?: {detail?: unknown; message?: string}};
    message?: string;
  };
  const d = err?.response?.data?.detail;
  if (d !== undefined && d !== null) {
    const s = formatApiErrorDetail(d);
    if (s) return s;
  }
  const m = err?.response?.data?.message;
  if (typeof m === 'string' && m) return m;
  if (typeof err?.message === 'string' && err.message) return err.message;
  return fallback;
}
