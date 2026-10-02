/** Fúria do kaiju: tipos e limites compartilhados entre a cena 3D e o palco (sem depender do three). */

/** Cliques até o sopro atômico. */
export const MAX_RAGE = 10;

export type RagePhase = "calm" | "charging" | "firing" | "cooling";

export interface RageState {
  level: number;
  phase: RagePhase;
}
