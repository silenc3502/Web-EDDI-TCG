import * as THREE from "three";
import {FrameRenderer} from "../../../../core/renderer/FrameRenderer";
import {BackgroundFrame} from "../../../../background/frame/BackgroundFrame";
import {BackgroundRendererV2} from "../../../../background/renderer/BackgroundRendererV2";
import {BoardChromeFrame, BoardChromePiece} from "../frame/BoardChromeFrame";

// 판 위에 고정으로 박힌 그림들을 그린다.
//
// **새 렌더러를 안 만들었다.** 배경 렌더러가 이미 [그림 한 장을 화면 비율 자리에 놓고
// 창을 따라간다] 를 한다. 여기가 하는 일은 그것을 조각 수만큼 부르고 하나로 묶어
// 내놓는 것뿐이다.
//
// 조각마다 따로 화면에 붙이지 않고 한 덩어리로 묶는 이유는, 화면이 크기 조절을 한 번만
// 걸면 되게 하려는 것이다. 조각이 늘 때마다 화면에 줄이 늘면 잊는다.

export class BoardChromeRenderer implements FrameRenderer<BoardChromeFrame> {
    private readonly imageRenderer = new BackgroundRendererV2();
    // 조각마다 [그림 렌더러에 넘길 값] 과 [그것이 만든 덩어리] 를 짝지어 둔다.
    private parts: {frame: BackgroundFrame; group: THREE.Group}[] = [];

    public async build(frame: BoardChromeFrame): Promise<THREE.Group> {
        const group = new THREE.Group();
        this.parts = [];

        for (const piece of frame.pieces) {
            const pieceFrame = toBackgroundFrame(piece, frame.renderOrder);
            const pieceGroup = await this.imageRenderer.build(pieceFrame);
            pieceGroup.name = piece.name;
            this.parts.push({frame: pieceFrame, group: pieceGroup});
            group.add(pieceGroup);
        }
        return group;
    }

    public resize(
        _frame: BoardChromeFrame, _group: THREE.Group, width: number, height: number,
    ): void {
        for (const part of this.parts) {
            this.imageRenderer.resize(part.frame, part.group, width, height);
        }
    }

    public dispose(group: THREE.Group): void {
        for (const part of this.parts) this.imageRenderer.dispose(part.group);
        this.parts = [];
        group.removeFromParent();
        group.clear();
    }
}

function toBackgroundFrame(piece: BoardChromePiece, renderOrder: number): BackgroundFrame {
    return {
        imageSrc: piece.imageSrc,
        widthPercent: piece.widthPercent,
        heightPercent: piece.heightPercent,
        xPercent: piece.xPercent,
        yPercent: piece.yPercent,
        renderOrder,
    };
}
