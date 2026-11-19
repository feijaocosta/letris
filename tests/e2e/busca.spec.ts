import { test, expect, chooseGame } from './helpers';
import pt from '../../locales/pt.json';
import languages from '../../config/languages.json';
import { ABOUT_URL, SITE_URL } from '../../config/site';

// Página legível para os robôs de busca e do AdSense: texto em HTML puro (sem
// rodar o JavaScript), metas, robots.txt e sitemap.xml. O jogo continua igual.

/** O que um robô sem JavaScript lê: o HTML sem as tags (como `curl | sed`) */
const plainText = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

test('o index.html tem título, h1, texto sobre o jogo e links sem precisar de JavaScript', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain(`<title>${pt.meta.title}</title>`);
  expect(html).not.toMatch(/Tetris com/i);
  expect(html).toMatch(/<h1>[^<]*LETRIS[^<]*<\/h1>/);
  expect(html).toContain(`href="${ABOUT_URL}"`);
  expect(html).toContain('href="/privacidade.html"');

  const text = plainText(html);
  for (const part of ['Dois modos de jogo', 'Clássico', 'Encaixe', 'Como jogar', 'português, inglês, espanhol ou francês', 'Ñ']) {
    expect(text).toContain(part);
  }
  expect(text.split(' ').length, 'texto suficiente para o robô').toBeGreaterThan(300);
});

test('metas de busca e de compartilhamento', async ({ request }) => {
  const html = await (await request.get('/')).text();
  const meta = (attr: string) => html.match(new RegExp(`<meta ${attr} content="([^"]*)"`))?.[1];
  expect(meta('name="description"')?.length).toBeGreaterThan(80);
  expect(html).toContain(`<link rel="canonical" href="${SITE_URL}" />`);
  expect(meta('property="og:title"')).toBe(pt.meta.title);
  expect(meta('property="og:description"')).toBeTruthy();
  expect(meta('property="og:url"')).toBe(SITE_URL);
  expect(meta('property="og:image"')).toBe(`${SITE_URL}pwa-512x512.png`);
  expect((await request.get('/pwa-512x512.png')).ok()).toBe(true);
});

test('robots.txt libera tudo e aponta o sitemap; sitemap tem o jogo e as políticas de cada idioma', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Allow: /');
  expect(robots).toContain(`Sitemap: ${SITE_URL}sitemap.xml`);

  const sitemap = await (await request.get('/sitemap.xml')).text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  expect(urls).toEqual([SITE_URL, ...languages.languages.map(l => `${SITE_URL}${l.privacyPage}`)]);
  expect(sitemap).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  for (const url of urls) expect((await request.get(url.replace(SITE_URL, '/'))).ok(), url).toBe(true);
});

test('cada política de privacidade tem descrição e canonical', async ({ request }) => {
  for (const { privacyPage } of languages.languages) {
    const html = await (await request.get(`/${privacyPage}`)).text();
    expect(html, privacyPage).toMatch(/<meta name="description" content="[^"]{60,}" \/>/);
    expect(html, privacyPage).toContain(`<link rel="canonical" href="${SITE_URL}${privacyPage}" />`);
  }
});

test('com JavaScript, o jogo abre no lugar do texto e o rodapé tem o link "Sobre o Letris"', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('mode-classic')).toBeVisible();
  await expect(page.locator('.about-static')).toHaveCount(0);
  await expect(page).toHaveTitle(pt.meta.title);
  const about = page.getByRole('link', { name: pt.home.about });
  await expect(about).toBeVisible();
  await expect(about).toHaveAttribute('href', ABOUT_URL);
  // o jogo segue igual
  await chooseGame(page);
  await expect(page.getByRole('button', { name: pt.home.play, exact: true })).toBeVisible();
});
