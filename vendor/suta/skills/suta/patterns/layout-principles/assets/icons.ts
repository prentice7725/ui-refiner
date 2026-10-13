/* layout-principles — 앱 화면에 자주 쓰는 선 아이콘 한 벌(24×24, 선 굵기 1.75). 프레임워크 무관 데이터 + SVG 문자열 함수.
 *
 * 왜 한 벌인가: 아이콘을 그때그때 손으로 그리면 크기·선 굵기·모서리가 화면마다 달라지고, 모양이 틀리기도 한다
 * (설정 톱니가 해처럼 보인다). 이모지는 기기마다 그림이 달라 AI가 만든 화면의 표시가 된다. 같은 격자에서 그린 한 벌만 쓴다.
 * 이 목록에 없는 아이콘이 필요하면 같은 출처(Lucide)에서 같은 형식으로 더한다 — 다른 아이콘 세트와 섞지 않는다.
 *
 * 경로 출처: Lucide v0.469.0 (https://lucide.dev)
 * ISC License
 *
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

export type IconTag = 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon' | 'ellipse'
export type IconNode = Array<[IconTag, Record<string, string>]>

export const ICONS = {
  /** 홈 */
  'home': [['path', { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8' }], ['path', { d: 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }]],
  /** 카테고리 */
  'category': [['rect', { width: '7', height: '7', x: '3', y: '3', rx: '1' }], ['rect', { width: '7', height: '7', x: '14', y: '3', rx: '1' }], ['rect', { width: '7', height: '7', x: '14', y: '14', rx: '1' }], ['rect', { width: '7', height: '7', x: '3', y: '14', rx: '1' }]],
  /** 검색 */
  'search': [['circle', { cx: '11', cy: '11', r: '8' }], ['path', { d: 'm21 21-4.3-4.3' }]],
  /** 찜 */
  'heart': [['path', { d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z' }]],
  /** 마이 */
  'user': [['path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }], ['circle', { cx: '12', cy: '7', r: '4' }]],
  /** 장바구니 */
  'cart': [['circle', { cx: '8', cy: '21', r: '1' }], ['circle', { cx: '19', cy: '21', r: '1' }], ['path', { d: 'M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12' }]],
  /** 쇼핑백·주문 */
  'bag': [['path', { d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z' }], ['path', { d: 'M3 6h18' }], ['path', { d: 'M16 10a4 4 0 0 1-8 0' }]],
  /** 알림 */
  'bell': [['path', { d: 'M10.268 21a2 2 0 0 0 3.464 0' }], ['path', { d: 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326' }]],
  /** 설정 */
  'settings': [['path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }], ['circle', { cx: '12', cy: '12', r: '3' }]],
  /** 메뉴 */
  'menu': [['line', { x1: '4', x2: '20', y1: '12', y2: '12' }], ['line', { x1: '4', x2: '20', y1: '6', y2: '6' }], ['line', { x1: '4', x2: '20', y1: '18', y2: '18' }]],
  /** 뒤로 */
  'chevron-left': [['path', { d: 'm15 18-6-6 6-6' }]],
  /** 이동(행 끝 꺾쇠) */
  'chevron-right': [['path', { d: 'm9 18 6-6-6-6' }]],
  /** 펼침·정렬 */
  'chevron-down': [['path', { d: 'm6 9 6 6 6-6' }]],
  /** 맨 위로 */
  'arrow-up': [['path', { d: 'm5 12 7-7 7 7' }], ['path', { d: 'M12 19V5' }]],
  /** 닫기·삭제 */
  'close': [['path', { d: 'M18 6 6 18' }], ['path', { d: 'm6 6 12 12' }]],
  /** 더하기 */
  'plus': [['path', { d: 'M5 12h14' }], ['path', { d: 'M12 5v14' }]],
  /** 빼기 */
  'minus': [['path', { d: 'M5 12h14' }]],
  /** 확인·선택 */
  'check': [['path', { d: 'M20 6 9 17l-5-5' }]],
  /** 별점 */
  'star': [['path', { d: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z' }]],
  /** 공유 */
  'share': [['path', { d: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8' }], ['polyline', { points: '16 6 12 2 8 6' }], ['line', { x1: '12', x2: '12', y1: '2', y2: '15' }]],
  /** 삭제 */
  'trash': [['path', { d: 'M3 6h18' }], ['path', { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' }], ['path', { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' }], ['line', { x1: '10', x2: '10', y1: '11', y2: '17' }], ['line', { x1: '14', x2: '14', y1: '11', y2: '17' }]],
  /** 필터 */
  'filter': [['line', { x1: '21', x2: '14', y1: '4', y2: '4' }], ['line', { x1: '10', x2: '3', y1: '4', y2: '4' }], ['line', { x1: '21', x2: '12', y1: '12', y2: '12' }], ['line', { x1: '8', x2: '3', y1: '12', y2: '12' }], ['line', { x1: '21', x2: '16', y1: '20', y2: '20' }], ['line', { x1: '12', x2: '3', y1: '20', y2: '20' }], ['line', { x1: '14', x2: '14', y1: '2', y2: '6' }], ['line', { x1: '8', x2: '8', y1: '10', y2: '14' }], ['line', { x1: '16', x2: '16', y1: '18', y2: '22' }]],
  /** 더보기 */
  'more': [['circle', { cx: '12', cy: '12', r: '1' }], ['circle', { cx: '19', cy: '12', r: '1' }], ['circle', { cx: '5', cy: '12', r: '1' }]],
  /** 복사 */
  'copy': [['rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' }], ['path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }]],
  /** 다시 시도 */
  'refresh': [['path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }], ['path', { d: 'M21 3v5h-5' }], ['path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }], ['path', { d: 'M8 16H3v5' }]],
  /** 배송 상품 */
  'package': [['path', { d: 'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z' }], ['path', { d: 'M12 22V12' }], ['path', { d: 'm3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7' }], ['path', { d: 'm7.5 4.27 9 5.15' }]],
  /** 배송 */
  'truck': [['path', { d: 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2' }], ['path', { d: 'M15 18H9' }], ['path', { d: 'M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14' }], ['circle', { cx: '17', cy: '18', r: '2' }], ['circle', { cx: '7', cy: '18', r: '2' }]],
  /** 쿠폰 */
  'coupon': [['path', { d: 'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z' }], ['path', { d: 'M13 5v2' }], ['path', { d: 'M13 17v2' }], ['path', { d: 'M13 11v2' }]],
  /** 포인트 */
  'point': [['circle', { cx: '8', cy: '8', r: '6' }], ['path', { d: 'M18.09 10.37A6 6 0 1 1 10.34 18' }], ['path', { d: 'M7 6h1v4' }], ['path', { d: 'm16.71 13.88.7.71-2.82 2.82' }]],
  /** 선물 */
  'gift': [['rect', { x: '3', y: '8', width: '18', height: '4', rx: '1' }], ['path', { d: 'M12 8v13' }], ['path', { d: 'M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7' }], ['path', { d: 'M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5' }]],
  /** 주문 내역 */
  'receipt': [['path', { d: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z' }], ['path', { d: 'M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8' }], ['path', { d: 'M12 17.5v-11' }]],
  /** 문의·후기 */
  'message': [['path', { d: 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z' }]],
  /** 시간·최근 본 */
  'clock': [['circle', { cx: '12', cy: '12', r: '10' }], ['polyline', { points: '12 6 12 12 16 14' }]],
  /** 주소·매장 */
  'map-pin': [['path', { d: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0' }], ['circle', { cx: '12', cy: '10', r: '3' }]],
  /** 사진 찍기 */
  'camera': [['path', { d: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z' }], ['circle', { cx: '12', cy: '13', r: '3' }]],
  /** 사진 */
  'image': [['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2', ry: '2' }], ['circle', { cx: '9', cy: '9', r: '2' }], ['path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }]],
  /** 파일 */
  'file': [['path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' }], ['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }]],
  /** 안내 */
  'info': [['circle', { cx: '12', cy: '12', r: '10' }], ['path', { d: 'M12 16v-4' }], ['path', { d: 'M12 8h.01' }]],
  /** 오류 */
  'alert': [['circle', { cx: '12', cy: '12', r: '10' }], ['line', { x1: '12', x2: '12', y1: '8', y2: '12' }], ['line', { x1: '12', x2: '12.01', y1: '16', y2: '16' }]],
  /** 로그아웃 */
  'logout': [['path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }], ['polyline', { points: '16 17 21 12 16 7' }], ['line', { x1: '21', x2: '9', y1: '12', y2: '12' }]],
  /** 전화 걸기 */
  'phone': [['path', { d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' }]],
  /** 숨기기 (Lucide eye-off) */
  'eye-off': [['path', { d: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49' }], ['path', { d: 'M14.084 14.158a3 3 0 0 1-4.242-4.242' }], ['path', { d: 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143' }], ['path', { d: 'm2 2 20 20' }]],
  /** 재생 — 자동 넘김·영상 */
  'play': [['polygon', { points: '6 3 20 12 6 21 6 3' }]],
  /** 일시정지 */
  'pause': [['rect', { x: '14', y: '4', width: '4', height: '16', rx: '1' }], ['rect', { x: '6', y: '4', width: '4', height: '16', rx: '1' }]],
  /** 트로피 — 순위·업적 */
  'trophy': [['path', { d: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6' }], ['path', { d: 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18' }], ['path', { d: 'M4 22h16' }], ['path', { d: 'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22' }], ['path', { d: 'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22' }], ['path', { d: 'M18 2H6v7a6 6 0 0 0 12 0V2Z' }]],
  /** 메달 — 배지·1~3위 */
  'medal': [['path', { d: 'M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15' }], ['path', { d: 'M11 12 5.12 2.2' }], ['path', { d: 'm13 12 5.88-9.8' }], ['path', { d: 'M8 7h8' }], ['circle', { cx: '12', cy: '17', r: '5' }], ['path', { d: 'M12 18v-2h-.5' }]],
  /** 자물쇠 — 못 얻은 배지·잠긴 보상 */
  'lock': [['rect', { width: '18', height: '11', x: '3', y: '11', rx: '2', ry: '2' }], ['path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' }]],
  /** 불꽃 — 연속 기록 */
  'flame': [['path', { d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z' }]],
  /** 출석 */
  'calendar-check': [['path', { d: 'M8 2v4' }], ['path', { d: 'M16 2v4' }], ['rect', { width: '18', height: '18', x: '3', y: '4', rx: '2' }], ['path', { d: 'M3 10h18' }], ['path', { d: 'm9 16 2 2 4-4' }]],
  /** 걸음 */
  'footprints': [['path', { d: 'M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z' }], ['path', { d: 'M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z' }], ['path', { d: 'M16 17h4' }], ['path', { d: 'M4 13h4' }]],
  /** 기록·통계 (Lucide chart-no-axes-column) */
  'chart': [['line', { x1: '18', x2: '18', y1: '20', y2: '10' }], ['line', { x1: '12', x2: '12', y1: '20', y2: '4' }], ['line', { x1: '6', x2: '6', y1: '20', y2: '14' }]],
  /** 그릇·음식점 (Lucide soup) */
  'bowl': [['path', { d: 'M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z' }], ['path', { d: 'M7 21h10' }], ['path', { d: 'M19.5 12 22 6' }], ['path', { d: 'M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62' }], ['path', { d: 'M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62' }], ['path', { d: 'M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62' }]],
} satisfies Record<string, IconNode>

export type IconName = keyof typeof ICONS

/** 채운 모양에서 바탕색으로 남길 안쪽 선(도형 순번) — 채움과 같은 색이면 손잡이·문이 묻혀 덩어리로 보인다.
 * 바탕이 흰 면이 아니면 아이콘을 감싼 요소에 `--icon-cutout`을 그 바탕색으로 둔다 */
export const FILL_CUTOUTS: Partial<Record<IconName, number[]>> = {
  home: [0],
  bag: [1, 2],
}
export const CUTOUT_STYLE = 'var(--icon-cutout, #fff)'

/** 그리는 순서 — 채울 때는 안쪽 선을 맨 뒤로 보낸다(정의에서 앞에 있으면 나중에 칠한 외곽이 덮는다) */
export const drawOrder = ({ name, filled }: { name: IconName; filled: boolean }) => {
  const cutouts = filled ? (FILL_CUTOUTS[name] ?? []) : []
  const nodes = ICONS[name].map((node, index) => ({ node, index, cutout: cutouts.includes(index) }))
  return [...nodes.filter((item) => !item.cutout), ...nodes.filter((item) => item.cutout)]
}

/** SVG 문자열 — 순수 JS·서버 렌더용. 뜻이 있는 아이콘(글자 없이 혼자 쓰는 버튼)은 label을 주고, 옆에 글자가 있으면 비워 숨긴다.
 * filled는 닫힌 모양(home·heart·star·user·bell·bag)에만 — 선택된 탭·눌린 찜처럼 상태를 채움으로 보일 때 쓴다 */
export const iconSvg = ({ name, size = 24, strokeWidth = 1.75, label, filled = false }: { name: IconName; size?: number; strokeWidth?: number; label?: string; filled?: boolean }) => {
  const body = drawOrder({ name, filled })
    .map(({ node: [tag, attrs], cutout }) => `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(' ')}${cutout ? ` style="stroke:${CUTOUT_STYLE};fill:none"` : ''}/>`)
    .join('')
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" focusable="false" ${a11y}>${body}</svg>`
}
