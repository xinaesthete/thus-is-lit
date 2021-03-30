// not to do with mutation as it pertains to immutability, state etc.
// this is (approximately) functional mutation, so new objects are created with different values
// would like less garbage etc (especially as I currently have lots of redundant delta etc with every copy).
import {Numeric, Tweakable, vec2} from './tweakables'


export function mutateSingle(gene: Tweakable<Numeric>, amount: number) {
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
    
    let val = gene.value;
    if (typeof val === "number") {
        return val + amount * Math.random();
    } else {
        val = {x: val.x, y: val.y};
        val.x += amount * Math.random();
        val.y += amount * Math.random();
        return val;
    }
}

export function mutate(genes: Tweakable<Numeric>[], amount: number) {
    const newGenes = genes.map(g => mutateSingle(g, amount));
    return newGenes;
}