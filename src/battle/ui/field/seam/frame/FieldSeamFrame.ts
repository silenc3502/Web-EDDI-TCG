// 전장 위아래가 맞닿는 자리에 까는 중간 지대.
//
// **THREE 를 모른다.** 값만 든다 (frame-no-three).
//
// 지금은 배경이 한 장이라 이음매가 없다. 종족별 배경이 붙으면 위는 상대, 아래는 나로
// 갈리고 그 사이가 딱 잘려 보인다 — 언데드 묘지와 휴먼 성채가 맞닿는다.
//
// **어느 쪽도 아닌 구간을 하나 둔다.** 두 지형이 직접 맞닿지 않고 중간 지대를 사이에
// 두면, 무엇과 무엇이 만나든 어색하지 않다. 경계를 없애는 것이 아니라 경계가 어디인지
// 흐리는 것이다.
//
// **움직이지 않는다.** 한때 잡음이 튀게 만들어 봤는데, 화면이 실제로 지직거리면 사용자는
// 고장 난 줄 안다. 땅은 가만히 있어야 땅으로 보인다.
//
// **양쪽 그림을 모른 채로 덮는다.** 두 그림을 받아 섞으면 더 자연스럽지만, 그러려면
// 배경 두 장이 정해져야 하고 종족이 늘 때마다 조합을 봐야 한다. 이 방식은 무엇이 오든
// 한 벌로 받는다.

export interface FieldSeamFrame {
    // 중간 지대의 높이. 화면 높이에 대한 비율.
    //
    // 두 필드 영역 사이 빈 구간이 0.076 이다. 그보다 넓게 잡아 양쪽 필드 위로 번지게
    // 한다 — 빈 구간만 덮으면 이 구간의 위아래 끝이 또 하나의 경계가 된다.
    readonly heightRatio: number;

    // 가운데의 짙기. 1 로 덮으면 벽이 된다. 배경이 비쳐야 한다.
    readonly opacity: number;

    // 중간 지대의 색. **어둡고 채도가 낮아야** 어느 배경에나 얹힌다.
    // 밝으면 어두운 배경 위에서 뜨고, 채도가 있으면 배경 색과 싸운다.
    readonly colorR: number;
    readonly colorG: number;
    readonly colorB: number;

    // 안쪽 얼룩의 결. 평평한 막이 아니라 땅처럼 보이게 한다.
    readonly mottleScale: number;
    // 얼룩의 세기.
    readonly mottleStrength: number;

    // 위아래 가장자리가 굽이치는 결. 작을수록 크게 굽이친다.
    //
    // **곧은 가장자리는 띠를 놓았다는 티가 난다.** 굽이쳐야 지형으로 읽힌다.
    readonly edgeWaveScale: number;
    // 굽이치는 폭.
    readonly edgeWaveAmount: number;
    // 가장자리를 잘게 부수는 정도. 굽이침 위에 한 겹 더 얹는다.
    readonly edgeBreakup: number;

    // 좌우 끝을 비워 두는 자리. 화면 가로에 대한 비율.
    //
    // **배경 그림에 Setting 톱니 · ENV 카드 · 턴 종료 단추가 그려져 있다.** 이 구간은
    // 배경 위에 깔리므로 그 자리를 덮으면 안 된다.
    //
    // 그 자리의 이음매는 안 덮이지만, 거기는 그 그림들이 이미 가리고 있다.
    readonly clearLeftRatio: number;
    readonly clearRightRatio: number;
    // 비워 두는 자리로 넘어갈 때 부드럽게 줄어드는 폭.
    readonly sideFadeRatio: number;

    // 배경(0) 바로 위, 필드 영역(1) 아래.
    readonly renderOrder: number;
}

export function createDefaultFieldSeamFrame(): FieldSeamFrame {
    return {
        // 빈 구간 0.076 의 세 배쯤. 양쪽 필드의 바깥쪽 절반까지 번진다.
        heightRatio: 0.22,
        opacity: 0.58,

        // 푸른 기가 아주 살짝 도는 검정.
        colorR: 0.05,
        colorG: 0.055,
        colorB: 0.07,

        mottleScale: 5.0,
        mottleStrength: 0.45,

        edgeWaveScale: 1.6,
        edgeWaveAmount: 0.28,
        edgeBreakup: 0.35,

        // Setting 톱니가 0.05 까지, ENV 카드가 0.12 까지. 턴 종료 단추가 0.91 부터.
        clearLeftRatio: 0.145,
        clearRightRatio: 0.885,
        sideFadeRatio: 0.05,

        renderOrder: 0.5,
    };
}
