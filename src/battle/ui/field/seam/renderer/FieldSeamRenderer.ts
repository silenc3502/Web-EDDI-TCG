import * as THREE from "three";
import {FrameRenderer} from "../../../../../core/renderer/FrameRenderer";
import {FieldSeamFrame} from "../frame/FieldSeamFrame";

// 전장 가운데 중간 지대를 그린다. **THREE 를 만드는 것은 여기뿐이다.**
//
// 가만히 있는 그림이다. 움직이지 않는다 — 땅은 가만히 있어야 땅으로 보인다.
//
// 그림 한 장으로 안 하고 셰이더로 그리는 이유가 둘이다.
//   · 창 크기가 바뀌면 그림은 늘어난다. 얼룩은 늘어나면 티가 난다
//   · 가장자리가 굽이치는 모양을 그림으로 만들면 배경마다 다시 그려야 한다

const VERTEX = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT = `
precision highp float;

varying vec2 vUv;

uniform float u_opacity;
uniform vec3  u_color;
uniform float u_aspect;
uniform float u_mottleScale;
uniform float u_mottleStrength;
uniform float u_edgeWaveScale;
uniform float u_edgeWaveAmount;
uniform float u_edgeBreakup;
uniform float u_clearL;
uniform float u_clearR;
uniform float u_sideFade;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
        sum += amp * vnoise(p);
        p *= 2.03;
        amp *= 0.5;
    }
    return sum;
}

void main() {
    // 가로는 화면비만큼 벌려 잡는다. 안 그러면 무늬가 옆으로 늘어난다.
    float ax = vUv.x * u_aspect;

    // 띠 안에서의 세로 자리. 가운데 0, 위아래 끝 1.
    float v = abs(vUv.y * 2.0 - 1.0);

    // **가장자리가 굽이친다.** 곧으면 띠를 놓았다는 티가 난다.
    // 위와 아래가 따로 굽이치게 씨앗을 갈라 준다.
    float side = step(0.5, vUv.y);
    float wave = fbm(vec2(ax * u_edgeWaveScale, side * 19.7)) - 0.5;

    // 굽이침 위에 잘게 부수는 결을 한 겹 더.
    float breakup = (fbm(vec2(ax, vUv.y) * u_mottleScale * 1.7) - 0.5) * u_edgeBreakup;

    float edge = 1.0 - smoothstep(0.0, 1.0, v + wave * u_edgeWaveAmount + breakup);

    // **배경 그림에 그려진 단추 자리는 비운다.**
    edge *= smoothstep(u_clearL - u_sideFade, u_clearL, vUv.x);
    edge *= 1.0 - smoothstep(u_clearR, u_clearR + u_sideFade, vUv.x);
    edge = clamp(edge, 0.0, 1.0);
    if (edge <= 0.001) discard;

    // 안쪽 얼룩. 평평한 막이 아니라 땅처럼 보이게 한다.
    float mottle = fbm(vec2(ax, vUv.y) * u_mottleScale);
    vec3 color = u_color * (1.0 - u_mottleStrength * 0.5 + u_mottleStrength * mottle);

    gl_FragColor = vec4(color, edge * u_opacity);
}
`;

export class FieldSeamRenderer implements FrameRenderer<FieldSeamFrame> {
    private material: THREE.ShaderMaterial | null = null;

    public async build(frame: FieldSeamFrame): Promise<THREE.Group> {
        const group = new THREE.Group();

        const material = new THREE.ShaderMaterial({
            vertexShader: VERTEX,
            fragmentShader: FRAGMENT,
            transparent: true,
            // 뒤의 배경이 비쳐야 한다. 깊이를 쓰면 뒤가 지워진다.
            depthWrite: false,
            uniforms: {
                u_opacity: {value: frame.opacity},
                u_color: {value: new THREE.Color(frame.colorR, frame.colorG, frame.colorB)},
                u_aspect: {value: 1},
                u_mottleScale: {value: frame.mottleScale},
                u_mottleStrength: {value: frame.mottleStrength},
                u_edgeWaveScale: {value: frame.edgeWaveScale},
                u_edgeWaveAmount: {value: frame.edgeWaveAmount},
                u_edgeBreakup: {value: frame.edgeBreakup},
                u_clearL: {value: frame.clearLeftRatio},
                u_clearR: {value: frame.clearRightRatio},
                u_sideFade: {value: frame.sideFadeRatio},
            },
        });
        this.material = material;

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
        mesh.renderOrder = frame.renderOrder;
        mesh.position.set(0, 0, 0);
        group.add(mesh);

        this.resize(frame, group, window.innerWidth, window.innerHeight);
        return group;
    }

    // 창을 따라간다. 가로는 화면을 가득 채우고 높이는 비율로 정해진다.
    public resize(
        frame: FieldSeamFrame, group: THREE.Group, width: number, height: number,
    ): void {
        const mesh = group.children[0];
        if (!(mesh instanceof THREE.Mesh)) return;
        const bandHeight = frame.heightRatio * height;
        mesh.scale.set(width, bandHeight, 1);
        if (this.material) this.material.uniforms.u_aspect.value = width / bandHeight;
    }

    public dispose(group: THREE.Group): void {
        group.traverse((it) => {
            if (!(it instanceof THREE.Mesh)) return;
            it.geometry.dispose();
            (it.material as THREE.Material).dispose();
        });
        group.removeFromParent();
        group.clear();
        this.material = null;
    }
}
