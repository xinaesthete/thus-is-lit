// not to do with mutation as it pertains to immutability, state etc.
// this is functional mutation, without mutation (for the time being at least, hopefully we won't have too much garbage)
import {Numeric, Tweakable} from './tweakables'

export function mutateSingle(gene: Tweakable<Numeric>) {
    
}

export function mutate(genes: Tweakable<Numeric>[], amount: number) {
    const newGenes = genes.map(g => {})
}