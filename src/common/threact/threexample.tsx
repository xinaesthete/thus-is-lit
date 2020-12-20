import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { IThree } from "./threact";

//only used for literal highlighting e.g. with glsl-literal extension
export const glsl = (a: any,...bb: any) => a.map((x:any,i:any) => [x, bb[i]]).flat().join('');

export abstract class ThreactTrackballBase implements IThree {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    ortho = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 1);
    trackCtrl?: TrackballControls;
    overlay = new THREE.Scene(); //for debug graphics
    initThree(dom: HTMLElement) {
        this.camera.position.set(0, 1, -3);
        this.camera.lookAt(0, 0, 0);
        this.trackCtrl = new TrackballControls(this.camera, dom);
        this.init();
    }
    init(): void {}
    update() {
        this.trackCtrl!.update();
    }
    disposeThree() {
    }
    resize(rect: DOMRect): void {
        const w = rect.width, h = rect.height;
        const a = w / h;
        this.camera.aspect = a;
        this.camera.updateProjectionMatrix();
        this.ortho.right = a;
        this.camera.updateProjectionMatrix();
    }
    render(renderer: THREE.WebGLRenderer) {
        renderer.render(this.scene, this.camera);
        renderer.clearDepth();
        if (this.overlay.children.length) renderer.render(this.overlay, this.ortho);
    }
    debugTexture(texture: THREE.Texture) {
        const mat = new THREE.MeshBasicMaterial({map: texture});
        const geo = new THREE.PlaneBufferGeometry(0.2, 0.2, 1, 1);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.x = 0.15;
        mesh.position.y = 0.15;
        this.overlay.add(mesh);
    }
}

export class DefaultCube extends ThreactTrackballBase {
    static geo = new THREE.BoxGeometry();
    static mat = new THREE.MeshNormalMaterial();
    init() {
        const mesh = new THREE.Mesh(DefaultCube.geo, DefaultCube.mat);
        this.scene.add(mesh);
    }
}

