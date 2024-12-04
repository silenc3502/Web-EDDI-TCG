import * as THREE from 'three';
import { TextureManager } from "../../src/texture_manager/TextureManager";
import { NonBackgroundImage } from "../../src/shape/image/NonBackgroundImage";
import { AudioController } from "../../src/audio/AudioController";
import cardShopMusic from '@resource/music/shop/card-shop.mp3';
import { MouseController } from "../../src/mouse/MouseController";
import {RouteMap} from "../../src/router/RouteMap";
import { Component } from "../../src/router/Component";
import { TransparentRectangle } from "../../src/shape/TransparentRectangle";
import { ShopButtonConfigList } from "../../src/shop/ShopButtonConfigList";
import { ShopButtonType } from "../../src/shop/ShopButtonType";
import { ShopSelectScreenConfigList } from "./ShopSelectScreenConfigList";
import { ShopSelectScreenType} from "./ShopSelectScreenType";
import {routes} from "../../src/router/routes";

export class TCGJustTestShopView implements Component{
    private static instance: TCGJustTestShopView | null = null;

        private scene: THREE.Scene;
        private camera: THREE.OrthographicCamera;
        private renderer: THREE.WebGLRenderer;
        private textureManager: TextureManager;
        private shopContainer: HTMLElement;
        private background: NonBackgroundImage | null = null;
        private buttons: NonBackgroundImage[] = [];
        private buttonInitialInfo: Map<string, { positionPercent: THREE.Vector2, widthPercent: number, heightPercent: number }> = new Map();
        private selectScreens: NonBackgroundImage[] = [];
        private selectScreenInitialInfo: Map<string, { positionPercent: THREE.Vector2, widthPercent: number, heightPercent: number }> = new Map();
        private audioController: AudioController;
        private mouseController: MouseController;


        private initialized = false;
        private isAnimating = false;

        private transparentRectangles: TransparentRectangle[] = []
        private rectInitialInfo: Map<string, { positionPercent: THREE.Vector2, widthPercent: number, heightPercent: number }> = new Map();


        constructor(shopContainer: HTMLElement) {
                this.shopContainer = shopContainer; //캔버스
                this.scene = new THREE.Scene();
                this.scene.background = new THREE.Color(0xffffff);
                this.renderer = new THREE.WebGLRenderer();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.shopContainer.appendChild(this.renderer.domElement);

                const aspect = window.innerWidth / window.innerHeight;
                const viewSize = window.innerHeight;
                this.camera = new THREE.OrthographicCamera(
                    -aspect * viewSize / 2, aspect * viewSize / 2,
                    viewSize / 2, -viewSize / 2,
                    0.1, 1000
                );
                this.camera.position.set(0, 0, 5);
                this.camera.lookAt(0, 0, 0);

                this.textureManager = TextureManager.getInstance();
                this.audioController = AudioController.getInstance();
                this.audioController.setMusic(cardShopMusic);

                this.mouseController = new MouseController(this.camera, this.scene);

            }


        public static getInstance(shopContainer: HTMLElement): TCGJustTestShopView {
                if (!TCGJustTestShopView.instance) {
                    TCGJustTestShopView.instance = new TCGJustTestShopView(shopContainer);
                }
                return TCGJustTestShopView.instance;
            }


        private async initializeAudio(): Promise<void> {
                try {
                    await this.audioController.playMusic();
                } catch (error) {
                    console.error('Initial audio play failed:', error);
                }
            }

       public async initialize(): Promise<void> {
               if (this.initialized) {
                   console.log('Already initialized');
                   this.show();
                   return;
               }

               console.log('TCGJustTestShopView initialize() operate!!!');
               await this.textureManager.preloadTextures("image-paths.json");

               console.log("Textures preloaded. Adding background and buttons...");

               await this.addBackground();
               await this.addButtons();

               this.initialized = true;
               this.isAnimating = true;

               this.addTransparentRectangles();
               this.addSelectScreen();

               this.animate();
           }

       public show(): void {
               console.log('Showing TCGJustTestShopView...');
               this.renderer.domElement.style.display = 'block';
               this.shopContainer.style.display = 'block';
               this.isAnimating = true;

               this.scene.children.forEach(child => {
                   child.visible = true;
               });

               if (!this.initialized) {
                   this.initialize();
               } else {
                   this.animate();
               }
           }

       public hide(): void {
               console.log('Hiding TCGJustTestShopView...');
               this.isAnimating = false;
               this.renderer.domElement.style.display = 'none';
               this.shopContainer.style.display = 'none';

               this.buttons.forEach(button => {
                   this.mouseController.unregisterButton(button.getMesh());
                   this.disposeMesh(button.getMesh());
                   this.scene.remove(button.getMesh());
               });

               this.transparentRectangles.forEach(rectangle => {
                   this.mouseController.unregisterButton(rectangle.getMesh());
                   this.disposeMesh(rectangle.getMesh());
                   this.scene.remove(rectangle.getMesh());
               });

               this.mouseController.clearButtons();

               this.buttons = [];
               this.transparentRectangles = [];

           }

       private disposeMesh(mesh: THREE.Mesh): void {
               if (mesh.geometry) {
                   mesh.geometry.dispose();
               }
               if (mesh.material) {
                   if (Array.isArray(mesh.material)) {
                       mesh.material.forEach(material => material.dispose());
                   } else {
                       mesh.material.dispose();
                   }
               }
           }


       private async addBackground(): Promise<void> {
               const texture = await this.textureManager.getTexture('shop_background', 1);
               console.log('addBackground():', texture);
               if (texture) {
                   if (!this.background) {
                       this.background = new NonBackgroundImage(
                           window.innerWidth,
                           window.innerHeight,
                           new THREE.Vector2(0, 0)
                       );
                   }
                   this.background.createNonBackgroundImageWithTexture(texture, 1, 1);
                   this.background.draw(this.scene);
               } else {
                   console.error("Background texture not found.");
               }
           }


       private async addButtons(): Promise<void> {
               await Promise.all(ShopButtonConfigList.buttonConfigs.map(async (config) => {
                   const buttonTexture = await this.textureManager.getTexture('shop_buttons', config.id);
                   if (buttonTexture) {
                       const widthPercent = 300 / 1920;  // 기준 화면 크기의 퍼센트로 버튼 크기를 정의
                       const heightPercent = 300 / 1080;
                       const positionPercent = new THREE.Vector2(config.position.x / 1920, config.position.y / 1080);

                       const button = new NonBackgroundImage(
                           window.innerWidth * widthPercent,
                           window.innerHeight * heightPercent,
                           new THREE.Vector2(
                               window.innerWidth * positionPercent.x,
                               window.innerHeight * positionPercent.y
                           )
                       );
                       button.createNonBackgroundImageWithTexture(buttonTexture, 1, 1);
                       button.draw(this.scene);

                       this.buttons.push(button);
                       this.buttonInitialInfo.set(button.getMesh()?.uuid ?? '', { positionPercent, widthPercent, heightPercent });
                       console.log('addButtons()')

                       this.mouseController.registerButton(button.getMesh(), this.onButtonClick.bind(this, config.type));
                   } else {
                       console.error("Button texture not found.");
                   }
               }));
           }

       private onButtonClick(type: ShopButtonType): void {
               console.log('Button clicked:', type);
               switch (type) {
                   case ShopButtonType.ALL:
                       this.selectScreens[0].draw(this.scene);
                       break;
                   case ShopButtonType.UNDEAD:
                       this.selectScreens[1].draw(this.scene);
                       break;
                   case ShopButtonType.TRENT:
                       this.selectScreens[2].draw(this.scene);
                       break;
                   case ShopButtonType.HUMAN:
                       this.selectScreens[3].draw(this.scene);
                       break;
                   default:
                       console.error("Unknown button type:", type);
               }
           }

       private async addSelectScreen(): Promise<void> {
           await Promise.all(ShopSelectScreenConfigList.screenConfigs.map(async (config) => {
               const selectScreenTexture = await this.textureManager.getTexture('shop_select_screens', config.id);
               if (selectScreenTexture) {
                   const widthPercent = 400 / 1920;
                   const heightPercent = 600 / 1080;
                   const positionPercent = new THREE.Vector2(config.position.x / 1920, config.position.y / 1080);

                   const selectScreen = new NonBackgroundImage(
                       window.innerWidth * widthPercent,
                       window.innerHeight * heightPercent,
                       new THREE.Vector2(
                           window.innerWidth * positionPercent.x,
                           window.innerHeight * positionPercent.y
                           )
                       );

                   selectScreen.createNonBackgroundImageWithTexture(selectScreenTexture, 1, 1);
                   this.selectScreens.push(selectScreen);
                   this.selectScreenInitialInfo.set(selectScreen.getMesh()?.uuid ?? '', { positionPercent, widthPercent, heightPercent });
                   } else {
                       console.error("Select Screen Texture not found.");
                       }
               }));
           }

       private addTransparentRectangles(): void {
               // 로비 버튼
               const lobbyButtonX = 0.04761;
               const lobbyButtonY = 0.07534;
               console.log('addLobbyButtonRectangle');
               this.addTransparentRectangle('lobbyButton', lobbyButtonX, lobbyButtonY);

               // 카드 버튼
               const myCardButtonX = 0.04761;
               const myCardButtonY = 0.14734;
               this.addTransparentRectangle('myCardButton', myCardButtonX, myCardButtonY);
               console.log('addMyCardButtonRectangle');

               console.log('addTransparentRectangles()!');

       }

       private addTransparentRectangle(id: string, positionXPercent: number, positionYPercent: number): void {
           const screenWidth = window.innerWidth;
           const screenHeight = window.innerHeight;
           console.log('Window screenWidth, screenHeight:', screenHeight, screenHeight);

           const positionX = (positionXPercent - 0.5) * screenWidth
           const positionY = (0.5 - positionYPercent) * screenHeight


           console.log('TransparentRectangle Position:', positionX, positionY);

           const position = new THREE.Vector2(
               positionX, positionY

           );

           const width = 0.09415 * screenWidth
           const height = 0.06458 * screenHeight
           console.log('Calculated position:', position, 'Width:', width, 'Height:', height);

           const transparentRectangle = new TransparentRectangle(position, width, height, 0xffffff, 0.8, id);
           transparentRectangle.addToScene(this.scene);
//            this.mouseController.registerButton(transparentRectangle.getMesh(), this.onTransparentRectangleClick.bind(this, id));

           this.transparentRectangles.push(transparentRectangle);

       }

//        private onTransparentRectangleClick(id: string): void {
//            console.log("TransparentRectangle Button Click !");
//            switch(id) {
//                case 'lobbyButton':
//                    this.hide();
//                    const rootElement = document.getElementById('app');
//                    if (rootElement) {
//                        const routeMap = new RouteMap(rootElement, '/tcg-main-lobby');
//                        routeMap.registerRoutes(routes);
//                    } else {
//                        console.error('Root element not found');
//                    }
//                    break;
//                case 'myCardButton':
//                    console.log("wait! not yet prepare..")
//                    break;
//                default:
//                    console.error("Unknown TransparentRectangle ID:", id);
//                }
//            }


       public animate(): void {
               if (this.isAnimating) {
                   requestAnimationFrame(() => this.animate());
                   this.renderer.render(this.scene, this.camera);
               } else {
                   console.log('TCGCardShop: Animation stopped.');
               }
       }

    }

const rootElement = document.getElementById('app');

if (!rootElement) {
    throw new Error("Cannot find element with id 'app'.");
}

const fieldView = TCGJustTestShopView.getInstance(rootElement);
fieldView.initialize();