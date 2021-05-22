/**
 * Render Three.js scenes as components in React.
 * 
 * First developed for psychogeo project.
 * 
 * Not necessarily brilliantly designed, could be either replaced with something else
 * if there's something else that does the same thing, or I may publish as an npm module.
 * For now, I'm copying the code from the other project because that's quickest.
 * 
 */


// nb, consider re-use of VideoTexture here...


import React from 'react'
import * as THREE from 'three'
import './threact.css'

declare const window: Window;
declare const document: Document;

/** access to the global rendering context, interface likely to change */
export let renderer: THREE.WebGLRenderer;
let compositeScene: THREE.Scene;
let compositeCamera: THREE.OrthographicCamera;
const views: Set<Threact> = new Set();

export const globalUniforms = {
    iTime: { value: 0 }
}

/** elements drawn to 'proxy' render targets & one big canvas vs 
 * making main canvas that owns WebGL invisible & drawing as image to each component's canvas.
 * Seems as though Chrome, Safari and others have some optimisations in place that make 'canvas'
 * work ok, but FireFox doesn't. Actually, it seems like performance in Firefox is pretty abysmal anyway
 * maybe something else I've missed.
*/
let compositeMode: 'canvas' | 'proxy' = navigator.userAgent.includes('Firefox') ? 'proxy' : 'canvas';

export const clearColor = new THREE.Color(0x000000);
const startTime = Date.now();

function init() {
    //NB:: I should consider the implications of having these values determined in a global GL context, 
    //and how they may be configured in an application (probably require app to call init with arguments).
    //(may want multiple renderers sharing context)
    console.log('<< threact module init() >>');
    renderer = new THREE.WebGLRenderer({antialias: true, logarithmicDepthBuffer: false, alpha: true});
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    compositeScene = new THREE.Scene();
    const w = window.innerWidth, h = window.innerHeight;
    compositeCamera = new THREE.OrthographicCamera(0, w, h, 0);
    compositeCamera.position.z = 0.4;
    
    window.addEventListener('resize', resize, false);
    renderer.setSize(w, h);
    const el = renderer.domElement;
    document.body.appendChild(el);
    el.id = "threact_backing_canvas";
    if (compositeMode === 'canvas') el.style.display = "none";
    animate(startTime);
}

function resize() {
    const r = window.devicePixelRatio;
    const w = window.innerWidth*r, h = window.innerHeight*r;
    compositeCamera.right = w;
    compositeCamera.top = h;
    compositeCamera.updateProjectionMatrix();
    renderer.setSize(w, h);
}
function animate(time: number) {
    requestAnimationFrame(animate);
    globalUniforms.iTime.value = (Date.now()-startTime) / 1000; //XXX::: use time passed as arg
    if (compositeMode === 'canvas') {
        views.forEach(v => v.updateLayout(time));
    } else {
        renderer.domElement.style.transform = `translateY(${window.scrollY}px)`;
        //renderer.domElement.style.transform = `translate(${window.scrollX}px, ${window.scrollY}px)`;
        //TODO: don't always assume we need to render every frame, or every view every time we render.
        views.forEach(v => v.updateLayout(time));
        renderer.setClearColor(clearColor, 0);
        renderer.autoClear = false;
        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(compositeScene, compositeCamera);
    }
}

init();

export interface IThree {
    //scene: THREE.Scene;
    //camera: THREE.Camera;
    initThree(dom: HTMLElement): void;
    update(time: number): void;
    render(renderer: THREE.WebGLRenderer): void;
    resize(rect: DOMRect): void;
    disposeThree(): void;
}

export interface DomAttributes extends React.HTMLAttributes<HTMLCanvasElement> {}

export interface IThreact {
    gfx: IThree;
    className?: string;
    domAttributes?: DomAttributes;
    //reactChildren?: React.Component[]; //React components already have children.
}

const basePlane = new THREE.PlaneBufferGeometry(1, 1, 1, 1);

/**
 * XXX: Really need to use this a bit to figure out how it should work...
 * 
 * 
 * React documentation & general conventions strongly favour composition over inheritence, for sound reasons.
 * However, it seems as though this represents a sufficiently different kind of component that it may make sense
 * to make the parts responsible for compositing related boilerplate abstract.
 * I'm still very new to React and it may well be that having an appropriate type of Prop will allow any behaviour
 * I might reasonably want.
 * Indeed, a decent design is probably to have a prop interface with methods for update, cleanup, whatever.
 */
export class Threact extends React.Component<IThreact, any> {
    composite: THREE.Mesh;
    private mount?: HTMLCanvasElement;
    renderTarget: THREE.WebGLRenderTarget;
    color = 0x202020;
    private lastW = 0;
    private lastH = 0;
    disposed = false;
    constructor(props: any) {
        super(props);
        this.state = {
            frameCount: 0, className: props.className || 'threact_view_proxy'
        }
        this.renderTarget = new THREE.WebGLRenderTarget(256, 256);
        
        const geo = basePlane;
        const mat = new THREE.MeshBasicMaterial({map: this.renderTarget.texture});
        //const mat = new THREE.MeshBasicMaterial({color: this.color});
        this.composite = new THREE.Mesh(geo, mat);
    }
    componentDidMount() {
        //will any component with THREE content will be expected to have a render target that it updates as necessary?
        //may be more optimal for it to render into main, but this is premature optimization and may be less debug-friendly.
        compositeScene.add(this.composite);
        views.add(this);
        this.disposed = false;
        this.props.gfx.initThree(this.mount!);
    }
    componentWillUnmount() {
        compositeScene.remove(this.composite);
        views.delete(this);
        this.disposed = true;
        this.props.gfx.disposeThree(); //is this a safe bet? should be symmetric with `componentDidMount()`?
    }
    updateLayout(time: number) {
        if (!this.mount) return;
        if (this.disposed) throw "still renderering after dispose";
        //nb: it could be possible to use something other than bounding rect, in cases with odd CSS transform.
        //but that's a bit of a tangent. Not sure if there's a simple way to e.g. get a matrix representing arbitrary transform
        const rect = this.mount.getBoundingClientRect(); //"Forced Reflow is likely a performance bottleneck"

        //TODO: don't render if off screen.
        const w = rect.width, cw = renderer.domElement.clientWidth;
        const h = rect.height, ch = renderer.domElement.clientHeight;
        this.resize(rect);
        
        //this.composite.updateMatrix();
        if (compositeMode === 'proxy') {
        const left = rect.left + w/2;
        const bottom = (ch - rect.bottom) + h/2;
        this.composite.position.x = left;
        this.composite.position.y = bottom;
        
        //this.composite.updateMatrix();
        if (rect.bottom < 0 || rect.top > ch || rect.right < 0 || rect.left > cw) return;
        }
        this.renderGL(time);
    }
    resize(rect: DOMRect) {
        ///....
        const r = window.devicePixelRatio;
        const w = rect.width * r;
        const h = rect.height * r;
        let dirty = (w !== this.lastW) || (h !== this.lastH);
        if (!dirty) return;
        if (compositeMode === 'proxy') {
            this.renderTarget.setSize(w, h);
            this.composite.scale.setX(w);
            this.composite.scale.setY(h - 1);
        }
        this.lastW = w;
        this.lastH = h;
        this.props.gfx.resize(rect);
        this.mount!.width = w;
        this.mount!.height = h;
    }
    renderGL(time: number) {
        switch (compositeMode) {
            case 'proxy':
                this.renderGL_proxy(time);
                break;
            case 'canvas':
                this.renderGL_canvas(time);
                break;
        }
    }
    renderGL_proxy(time: number) {
        //this can be a significant performance bottleneck here, understandably:
        //this.setState({frameCount: this.state.frameCount+1})
        //::: this also demonstrates that using 'state' for things unrelated to React rendering is ill-advised.
        //be clear about what causes Three things to need rendering, and what causes React things need rendering.
        const rt = renderer.getRenderTarget();
        const oldAlpha = renderer.getClearAlpha();
        renderer.setRenderTarget(this.renderTarget);
        //renderer.setViewport //alternative to renderTarget...
        renderer.setClearColor(this.color, 1);
        renderer.clear();
        this.props.gfx.update(time);
        //we may want to do things like handle multi-pass configurations, as well as debug overlays etc etc (that's what I want right now).
        //rather than assume gfx has a single 'scene' and 'camera' and that rendering the scene with the camera will get the right result,
        //it should have a render method where it can do what it likes, including changing render target etc safe in the knowledge that the
        //calling function (this one) will take care of setting up & restoring that kind of state.
        //renderer.render(this.props.gfx.scene, this.props.gfx.camera);
        this.props.gfx.render(renderer);

        renderer.setRenderTarget(rt);
    }
    renderGL_canvas(time: number) {
        renderer.setSize(this.lastW, this.lastH);
        renderer.setRenderTarget(null);
        renderer.setClearColor(this.color);
        renderer.clear();
        this.props.gfx.update(time);
        this.props.gfx.render(renderer);
        const ctx = this.mount!.getContext("2d", { alpha: true })!;
        ctx.clearRect(0, 0, 1e6, 1e6);
        ctx.drawImage(renderer.domElement, 0, 0);
    }
    render() {
        return <canvas {...this.props.domAttributes} className={this.state.className} ref={(mount) => this.mount = mount as HTMLCanvasElement} />
    }
}
