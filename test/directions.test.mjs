import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDirectionNote,renderDirectionsMarkdown,renderDirectionsHtml} from '../src/directions.mjs';

test('direction note: concept first, then key: value parts', () => {
 const n=parseDirectionNote('<!doctype html>\n<!-- direction: The clinic\'s front desk | type: Bricolage Grotesque + Public Sans | palette: deep green, marigold | signature: today\'s hours board -->\n<h1>x</h1>');
 assert.deepEqual(n,{concept:"The clinic's front desk",type:'Bricolage Grotesque + Public Sans',palette:'deep green, marigold',signature:"today's hours board"});
 assert.equal(parseDirectionNote('<h1>no note</h1>'),null);
});

const items=[
 {label:'A',file:'a.html',note:{concept:'이번 달 장부 한 장',type:'Black Han Sans + Pretendard',signature:'11월 가계부'},score:0,signals:[],quality:2,ja:null,desktop:'_scans/a/scan-desktop.png',mobile:'_scans/a/scan-mobile.png'},
 {label:'B',file:'b.html',note:null,score:24,signals:['Uniform 3–4 card grid'],quality:0,ja:1,desktop:'_scans/b/scan-desktop.png',mobile:'_scans/b/scan-mobile.png'}];

test('directions sheet: markdown lists each direction and asks for a choice in the report language', () => {
 const ko=renderDirectionsMarkdown(items,'ko');
 assert.match(ko,/^# 디자인 방향 비교/);
 assert.match(ko,/## A\. 이번 달 장부 한 장/);assert.match(ko,/- 고유 요소: 11월 가계부/);
 assert.match(ko,/## B\. b\.html/,'a mock without a note falls back to its file name');
 assert.match(ko,/AI 티 지수: 24\/100 · 기본 품질 문제: 0 · 일본어 조판 문제: 1/);
 assert.match(ko,/어느 방향으로 갈지 정해 주세요: A \/ B\n$/);
 assert.match(renderDirectionsMarkdown(items,'ja'),/どの方針で進めるか選んでください：A \/ B/);
});

test('directions sheet: HTML escapes notes and links the screenshots relatively', () => {
 const html=renderDirectionsHtml([{...items[0],note:{concept:'<b>bold</b> & co'}}],'en');
 assert.match(html,/&lt;b&gt;bold&lt;\/b&gt; &amp; co/);
 assert.match(html,/<img src="_scans\/a\/scan-desktop.png"/);
 assert.match(html,/<html lang="en">/);
});
