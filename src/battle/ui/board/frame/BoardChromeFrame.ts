// 판 위에 고정으로 박혀 있는 것들. **지금은 로스트존뿐이다.**
//
// **THREE 를 모른다.** 값만 든다 (frame-no-three).
//
// 지금까지는 이것들이 **배경 그림 한 장에 같이 그려져** 있었다. 배경을 종족별로 갈아
// 끼우면 그것들도 같이 사라지므로, 종족마다 같은 것을 다시 그려 넣어야 한다.
//
// 배경에서 떼어 각자의 그림으로 올린다. **배경은 순수한 배경만 남는다.**
//
// 자리와 크기는 배경 그림을 재서 냈다. 지금은 원래 있던 자리에 같은 그림을 겹쳐 놓는
// 것이라 화면이 안 달라진다 — 배경이 깨끗한 것으로 바뀌는 순간 이쪽이 보인다.

export interface BoardChromePiece {
    // 무엇인지. 화면에는 안 나오고 코드에서 찾을 때 쓴다.
    readonly name: string;
    readonly imageSrc: string;
    // 화면 크기에 대한 비율.
    readonly widthPercent: number;
    readonly heightPercent: number;
    // 화면 한가운데에서 얼마나 떨어져 있나. 세로는 위가 양수.
    readonly xPercent: number;
    readonly yPercent: number;
}

export interface BoardChromeFrame {
    readonly pieces: readonly BoardChromePiece[];
    // 배경(0) 과 중간 지대(0.5) 위, 필드 영역(1) 아래.
    //
    // **중간 지대보다 위여야 한다.** 아래면 그 알갱이가 이 그림들을 덮는다 (R2-142).
    readonly renderOrder: number;
}

// 로스트존 그림의 가로/세로. 800x924 이다.
const LOST_ZONE_ASPECT = 924 / 800;
// 16:9 화면에서 비율로 옮길 때 쓰는 값. 세로 비율 = 가로 비율 x 그림비 x (1920/1080).
const TO_HEIGHT_PERCENT = LOST_ZONE_ASPECT * 1920 / 1080;

// 배경 그림에서 잰 값이다.
//
// **붉은 LOST 글자를 기준으로 맞췄다.** 어두운 칸의 테두리를 훑으면 옆 무덤까지 같이
// 잡힌다. 글자는 그 칸 안에만 있어서 딴 것과 안 섞인다.
//
//   배경의 LOST 글자   크기 4.278% x 2.222%,  한가운데 위 (93.405%, 13.413%) · 아래 (7.219%, 86.349%)
//   그림 속 LOST 글자  크기 43.250% x 11.039%, 한가운데 (50.125%, 49.242%)
//
// 둘의 글자 크기 비가 곧 그림 크기다. 위아래 글자가 4.278% x 2.222% 로 똑같이 나와서
// 양쪽에 같은 크기를 쓴다.
const LOST_ZONE_WIDTH_PERCENT = 0.09892;
const LOST_ZONE_HEIGHT_PERCENT = LOST_ZONE_WIDTH_PERCENT * TO_HEIGHT_PERCENT;

export function createDefaultBoardChromeFrame(): BoardChromeFrame {
    return {
        pieces: [
            {
                name: 'opponentLostZone',
                imageSrc: 'resource/lostzone.png',
                widthPercent: LOST_ZONE_WIDTH_PERCENT,
                heightPercent: LOST_ZONE_HEIGHT_PERCENT,
                xPercent: 0.43392,
                yPercent: 0.36433,
            },
            {
                name: 'yourLostZone',
                imageSrc: 'resource/lostzone.png',
                widthPercent: LOST_ZONE_WIDTH_PERCENT,
                heightPercent: LOST_ZONE_HEIGHT_PERCENT,
                xPercent: -0.42793,
                yPercent: -0.36503,
            },
            // 아직 그림이 없어서 못 떼어낸 것들. 그림이 오면 여기 한 줄씩 늘고,
            // **각자 티켓을 하나씩 받는다** — 한 티켓에 뭉치지 않는다.
            //
            //   무덤 (위·아래)      비석 그림
            //   덱 (위·아래)        책 그림
            //   Setting             톱니
            //   ENV                 환경 카드 자리
            //   턴 종료             육각형 단추
            //   쪽 넘기기 화살표     오른쪽 아래 두 줄
        ],
        renderOrder: 0.6,
    };
}
