export function pageMeta(title: string, description: string) {
  return { meta: [{ title: `${title} — RoboShield` }, { name: 'description', content: description }, { property: 'og:title', content: `${title} — RoboShield` }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
}
export const chartTip = { contentStyle: { background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--popover-foreground)' } };
