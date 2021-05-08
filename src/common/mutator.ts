// not to do with mutation as it pertains to immutability, state etc.
// this is (approximately) functional mutation, so new objects are created with different values
// would like less garbage etc (especially as I currently have lots of redundant delta etc with every copy).
import { makeAutoObservable } from 'mobx';
import KaleidModel from './KaleidModel';
import {MovementType, Numeric, Tweakable, vec2} from './tweakables'

export type GeneDef = Tweakable<Numeric>;
export type Genome = Map<GeneDef, Numeric>;

export interface Specimen {
    genes: Genome;
    /** high value = good. */
    weight: number;
    active: boolean;
}

function specimen(genes: Genome) {
    const s: Specimen = makeAutoObservable({ genes: genes, weight: 1, active: false});
    return s;
}

export function baseSpecimen(model: KaleidModel) {
    const genes: Genome = new Map<GeneDef, Numeric>();
    model.tweakables.forEach(t => {
        genes.set(t, t.value);
    });
    return specimen(genes);
}

export function breed(parents: Specimen[], mutationAmount: number, geneFilter?: (g: GeneDef)=>boolean) {
    const p = [...parents].sort((a, b) => a.weight - b.weight);
    if (parents.length === 1) {
        const p = parents[0];
        const genes = mutateGenome(p.genes, mutationAmount, geneFilter);
        return specimen(genes);
    } else {
        const p1 = p[Math.floor(Math.random() * p.length)];
        let p2 = p[Math.floor(Math.random() * p.length)];
        while (p2 === p1) {
            p2 = p[Math.floor(Math.random() * p.length)];
        }
        const crossover = Math.floor(p1.genes.size * Math.random());
        let i = 0;
        const genes: Genome = new Map<GeneDef, Numeric>();
        p1.genes.forEach((v, k) => {
            v = crossover > i++ ? p1.genes.get(k)! : p2.genes.get(k)!;
            if (geneFilter && !geneFilter(k)) {
                genes.set(k, mutateSingle(k, mutationAmount, v));
            } else {
                genes.set(k, v);
            }
        });
        return specimen(genes);
    }
}

export function mutateSingle(gene: Tweakable<Numeric>, amount: number, value?: Numeric) {
    //gene.value += Math.random() * amount;
    /////ugh, 'numeric' type...
    //need to read up on TS patterns, I'm sure I saw a relevant video
    
    //also consider random seed, noise / animation etc.
    //// XXX don't even respect min & max at present... should be able to wrap when I do.
    //// "[MobX] changing observable values without an action is prohibited"
    //// we should have parameter sets that are lighter weight and not wrapped in MobX.
    
    // const mutant = {...gene};
    // if (typeof gene.value === "number") {
    //     gene.value += amount * Math.random();
    // } else {
    //     const val = gene.value as vec2;
    //     val.x += amount * Math.random();
    //     val.y += amount * Math.random();
    // }
    // return mutant;
    let val = value ?? gene.value;
    if (gene.movement === MovementType.Fixed) {
        return val;
    }
    //TODO: seeded random.
    const {min=0, max=1, step=0.01, delta=0.5, wrap=false} = {...gene};
    let v: Numeric;
    const a = amount * delta;
    if (typeof val === "number") {
        v = val + a * Math.random();
    } else {
        val = {x: val.x, y: val.y};
        val.x += a * Math.random();
        val.y += a * Math.random();
        v = val;
    }
    v = constrain(v, min, max, wrap);
    return v;
}

function constrain(val: Numeric, min: number, max: number, wrap: boolean) {
    const r = max - min;
    if (!wrap) {
        if (typeof val === 'number') {
            return Math.min(max, Math.max(min, val));
        } else {
            val.x = Math.min(max, Math.max(min, val.x));
            val.y = Math.min(max, Math.max(min, val.y));
            return val;
        }
    }
    if (typeof val === 'number') {
        if (val > min) {
            return min + ((val - min) % r);
        }
        let v = min + (min-val);
        let t = min + (v - min) % r;
        return max - t;
    } else {
        val.x = constrain(val.x, min, max, wrap) as number;
        val.y = constrain(val.y, min, max, wrap) as number;
        return val;
    }
}

export function mutate(genes: Tweakable<Numeric>[], amount: number) {
    const newGenes = genes.map(g => mutateSingle(g, amount));
    return newGenes;
}

/** clone & mutate (NOT with mutation in the programming sense) */
export function mutateGenome(genes: Genome, amount: number, geneFilter?: (g: GeneDef)=>boolean) {
    const newGenes: Genome = new Map<GeneDef, Numeric>();
    genes.forEach((v, k) => {
        if (geneFilter && !geneFilter(k)) {
            newGenes.set(k, v);
        } else {
            newGenes.set(k, mutateSingle(k, amount, v));
        }
    });
    return newGenes;
}