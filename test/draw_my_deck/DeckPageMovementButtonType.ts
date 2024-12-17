import * as THREE from 'three';

export enum DeckPageMovementButtonType {
    PREV = "prev_button",
    NEXT = "next_button"
}

export interface DeckPageMovementButtonConfig {
    id: number;
    type: DeckPageMovementButtonType;
    imagePath: string;
    position: THREE.Vector2;
}