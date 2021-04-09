// not to do with mutation as it pertains to immutability, state etc.
// this is (approximately) functional mutation, so new objects are created with different values
// would like less garbage etc (especially as I currently have lots of redundant delta etc with every copy).
import KaleidModel from './KaleidModel';
import {MovementType, Numeric, Tweakable, vec2} from './tweakables'

type Genome = Map<Tweakable<Numeric>, Numeric>;
export interface Specimen {
    genes: Genome;
    /** high value = good. */
    weight: number;
}

export function baseSpecimen(model: KaleidModel) {
    const genes: Genome = new Map<Tweakable<Numeric>, Numeric>();
    model.tweakables.forEach(t => {
        genes.set(t, t.value);
    });
    return {
        genes: genes, weight: 0
    } as Specimen;
}

export function breed(parents: Specimen[], mutationAmount: number) {
    parents.sort((a, b) => a.weight - b.weight);
    if (parents.length === 1) {
        
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

/** mutate 'in place' (ie, with mutation in the programming sense) */
export function mutateGenome(genes: Genome, amount: number) {
    genes.forEach((v, k) => {
        genes.set(k, mutateSingle(k, amount, v));
    });
}