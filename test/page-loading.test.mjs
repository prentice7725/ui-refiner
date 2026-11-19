import test from 'node:test';
import assert from 'node:assert/strict';
import {blockingFontCss,standInsWithoutSrcset,loadingProblems,nonBlockingFontLink} from '../src/page-loading.mjs';

const G='https://fonts.googleapis.com/css2?family=Murecho:wght@700&display=swap';

test('loading: a plain font stylesheet link or @import blocks; the media=print swap and noscript copy do not', () => {
 assert.deepEqual(blockingFontCss(`<link href="${G}" rel="stylesheet">`),[G]);
 assert.deepEqual(blockingFontCss(`<link rel='stylesheet' href='${G}' media="all">`),[G]);
 assert.deepEqual(blockingFontCss(`<style>@import url("${G}");body{}</style>`),[G]);
 assert.deepEqual(blockingFontCss(nonBlockingFontLink(G)),[],'the non-blocking form passes, including its noscript copy');
 assert.deepEqual(blockingFontCss(`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preload" as="style" href="${G}">`),[]);
 assert.deepEqual(blockingFontCss('<link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="https://cdn.example.com/app.css">'),[],'only font hosts');
 assert.deepEqual(blockingFontCss('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">').length,1,'Pretendard from a CDN');
 assert.deepEqual(blockingFontCss(`<!-- <link href="${G}" rel="stylesheet"> -->`),[]);
});

test('loading: stand-in photos need srcset; other images are not checked', () => {
 assert.deepEqual(standInsWithoutSrcset('<img data-stand-in src="a.jpg" alt=""><img src="b.jpg"><img data-stand-in src="c-1600.webp" srcset="c-640.webp 640w, c-1600.webp 1600w" sizes="50vw">'),['a.jpg']);
 assert.deepEqual(loadingProblems(`<link href="${G}" rel="stylesheet"><img data-stand-in src="a.jpg">`).map(p=>p.id),['blocking-font-css','stand-in-no-srcset']);
 assert.deepEqual(loadingProblems('<p>plain</p>'),[]);
});
